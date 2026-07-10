const fs = require("fs");
const path = require("path");

const { ROOT, STORAGE } = require("../../config/paths");
const { loadKnowledge } = require("../services/knowledge.service");
const { SCHEMA_VERSION, nowIso } = require("../models/data-contract.model");

function readFileSafe(filePath) {
    try {
        return fs.readFileSync(path.join(ROOT, "..", filePath), "utf-8");
    }
    catch {
        return "";
    }
}

function extractNamespace(content) {
    const match = content.match(/\bnamespace\s+([A-Za-z0-9_.]+)/);
    return match ? match[1] : null;
}

function extractUsings(content) {
    return [...content.matchAll(/^using\s+([A-Za-z0-9_.]+);/gm)]
        .map(m => m[1]);
}

function extractClasses(content) {
    return [...content.matchAll(/\bclass\s+([A-Za-z0-9_]+)/g)]
        .map(m => m[1]);
}

function extractMethods(content) {
    const regex = /\b(public|private|protected|internal)\s+(?:static\s+)?[A-Za-z0-9_<>\[\]]+\s+([A-Za-z0-9_]+)\s*\(/g;

    return [...content.matchAll(regex)].map(m => ({
        visibility: m[1],
        name: m[2]
    }));
}

function extractMethodBodies(content) {
    const regex = /\b(public|private|protected|internal)\s+(?:static\s+)?[A-Za-z0-9_<>\[\]]+\s+([A-Za-z0-9_]+)\s*\([^)]*\)\s*\{/g;
    const bodies = [];

    [...content.matchAll(regex)].forEach(match => {
        const start = match.index + match[0].length - 1;
        let depth = 0;
        let end = start;

        for (let i = start; i < content.length; i++) {
            if (content[i] === "{") depth++;
            if (content[i] === "}") depth--;

            if (depth === 0) {
                end = i;
                break;
            }
        }

        bodies.push({
            name: match[2],
            body: content.slice(start, end + 1)
        });
    });

    return bodies;
}

function extractTodos(content) {
    return content
        .split("\n")
        .filter(line =>
            line.includes("TODO") ||
            line.includes("FIXME") ||
            line.includes("BUG")
        )
        .map(line => line.trim());
}

function analyzeDependencies() {

    const knowledge = loadKnowledge();
    const generatedAt = nowIso();

    const allClasses = [];
    const allFiles = [];

    Object.keys(knowledge).forEach(featureName => {
        knowledge[featureName].files
            .filter(file => file.endsWith(".cs"))
            .forEach(file => {
                const content = readFileSafe(file);
                const classes = extractClasses(content);
                const methods = extractMethods(content);

                allFiles.push({
                    feature: featureName,
                    file,
                    content,
                    classes,
                    methods
                });

                classes.forEach(className => {
                    allClasses.push({
                        className,
                        feature: featureName,
                        file
                    });
                });
            });
    });

    const result = {};

    Object.keys(knowledge).forEach(featureName => {

        const feature = knowledge[featureName];

        result[featureName] = {
            schemaVersion: SCHEMA_VERSION,
            generatedAt,
            files: {},
            dependsOn: [],
            details: {
                classUsage: [],
                methodCalls: [],
                publicApiUsage: [],
                circularDependencies: [],
                possibleUnusedApis: []
            }
        };

        feature.files
            .filter(file => file.endsWith(".cs"))
            .forEach(file => {

                const content = readFileSafe(file);

                const referencedClasses = allClasses.filter(item => {
                    if (item.file === file) return false;
                    return content.includes(item.className);
                });

                const dependencies = [...new Set(
                    referencedClasses
                        .filter(item => item.feature !== featureName)
                        .map(item => item.feature)
                )];

                result[featureName].files[file] = {
                    namespace: extractNamespace(content),
                    usings: extractUsings(content),
                    classes: extractClasses(content),
                    methods: extractMethods(content),
                    todos: extractTodos(content),
                    references: referencedClasses.map(item => ({
                        className: item.className,
                        feature: item.feature,
                        file: item.file
                    })),
                    dependsOn: dependencies
                };

                dependencies.forEach(dep => {
                    if (!result[featureName].dependsOn.includes(dep)) {
                        result[featureName].dependsOn.push(dep);
                    }
                });

            });

    });

    Object.keys(result).forEach(featureName => {
        result[featureName].details.classUsage = buildClassUsage(
            featureName,
            result[featureName],
            allClasses
        );
        result[featureName].details.methodCalls = buildMethodCalls(
            result[featureName]
        );
        result[featureName].details.publicApiUsage = buildPublicApiUsage(
            featureName,
            allFiles
        );
        result[featureName].details.circularDependencies = buildCircularDependencies(
            featureName,
            result
        );
        result[featureName].details.possibleUnusedApis = buildPossibleUnusedApis(
            featureName,
            allFiles
        );
    });

    const outPath = path.join(STORAGE, "dependencies.json");

    fs.writeFileSync(
        outPath,
        JSON.stringify(result, null, 2)
    );

    console.log("🫀 DevOS Dependency Engine v0.3");
    console.log("==============================");
    console.log(`✔ Dependencies exported: ${outPath}`);

}

function buildClassUsage(featureName, featureDependency, allClasses) {
    const usage = [];

    Object.keys(featureDependency.files || {}).forEach(filePath => {
        const file = featureDependency.files[filePath];
        const content = readFileSafe(filePath);
        const owner = (file.classes || [])[0] || path.basename(filePath, path.extname(filePath));

        (file.references || []).forEach(reference => {
            if (reference.className === owner) return;

            addUniqueObject(usage, {
                fromClass: owner,
                toClass: reference.className,
                toFeature: reference.feature,
                confidence: "Possible"
            }, ["fromClass", "toClass", "toFeature"]);
        });

        allClasses
            .filter(item => item.file !== filePath)
            .forEach(item => {
                const pattern = new RegExp(`\\b(new\\s+)?${item.className}\\b`);

                if (pattern.test(content)) {
                    addUniqueObject(usage, {
                        fromClass: owner,
                        toClass: item.className,
                        toFeature: item.feature,
                        confidence: item.feature === featureName ? "Possible" : "Possible cross-feature"
                    }, ["fromClass", "toClass", "toFeature"]);
                }
            });
    });

    return usage;
}

function buildMethodCalls(featureDependency) {
    const calls = [];

    Object.keys(featureDependency.files || {}).forEach(filePath => {
        const file = featureDependency.files[filePath];
        const methodNames = (file.methods || []).map(method => method.name);
        const bodies = extractMethodBodies(readFileSafe(filePath));

        bodies.forEach(methodBody => {
            methodNames
                .filter(name => name !== methodBody.name)
                .forEach(targetName => {
                    const pattern = new RegExp(`(?:\\bthis\\.|\\b[A-Za-z0-9_]+\\.)?\\b${targetName}\\s*\\(`);

                    if (pattern.test(methodBody.body)) {
                        addUniqueObject(calls, {
                            fromMethod: methodBody.name,
                            toMethod: targetName,
                            confidence: "Possible"
                        }, ["fromMethod", "toMethod"]);
                    }
                });
        });
    });

    return calls;
}

function buildPublicApiUsage(featureName, allFiles) {
    const usage = [];
    const sourceApis = allFiles
        .filter(file => file.feature === featureName)
        .flatMap(file => file.methods
            .filter(method => method.visibility === "public")
            .map(method => ({
                api: method.name,
                className: (file.classes || [])[0] || null
            }))
        );

    sourceApis.forEach(api => {
        allFiles
            .filter(file => file.feature !== featureName)
            .forEach(file => {
                const pattern = new RegExp(`\\b${api.api}\\s*\\(`);

                if (pattern.test(file.content)) {
                    addUniqueObject(usage, {
                        api: api.api,
                        fromFeature: file.feature,
                        toFeature: featureName,
                        className: api.className,
                        confidence: "Possible API usage"
                    }, ["api", "fromFeature", "toFeature"]);
                }
            });
    });

    return usage;
}

function buildCircularDependencies(featureName, result) {
    const circular = [];

    (result[featureName].dependsOn || []).forEach(dep => {
        if ((result[dep] && result[dep].dependsOn || []).includes(featureName)) {
            circular.push({
                from: featureName,
                to: dep,
                confidence: "Possible"
            });
        }
    });

    return circular;
}

function buildPossibleUnusedApis(featureName, allFiles) {
    const unused = [];
    const ownFiles = allFiles.filter(file => file.feature === featureName);
    const methodCalls = buildMethodCalls({
        files: Object.fromEntries(ownFiles.map(file => [
            file.file,
            {
                classes: file.classes,
                methods: file.methods
            }
        ]))
    });
    const calledMethods = new Set(methodCalls.map(call => call.toMethod));

    ownFiles.forEach(file => {
        file.methods
            .filter(method => method.visibility === "public")
            .forEach(method => {
                const usage = getPublicApiUsageScope(method.name, file, allFiles, calledMethods);

                if (usage === "none") {
                    addUniqueObject(unused, {
                        api: method.name,
                        className: (file.classes || [])[0] || null,
                        confidence: "Possible unused public API, not referenced in scanned code"
                    }, ["api", "className"]);
                }
            });
    });

    return unused;
}

function getPublicApiUsageScope(methodName, declaringFile, allFiles, calledMethods) {
    if (calledMethods.has(methodName)) {
        return "internal";
    }

    const otherFiles = allFiles.filter(file => file.file !== declaringFile.file);

    if (otherFiles.some(file => hasCallUsage(file.content, methodName))) {
        return "external";
    }

    const ownContentWithoutDeclaration = removeMethodDeclarations(declaringFile.content, methodName);

    if (hasCallUsage(ownContentWithoutDeclaration, methodName)) {
        return "internal";
    }

    return "none";
}

function hasCallUsage(content, methodName) {
    const callPattern = new RegExp(`(?:\\bthis\\.|\\b[A-Za-z0-9_]+\\.)?\\b${methodName}\\s*\\(`);
    return content
        .split("\n")
        .filter(line => !isMethodDeclarationLine(line, methodName))
        .some(line => callPattern.test(line));
}

function removeMethodDeclarations(content, methodName) {
    return content
        .split("\n")
        .filter(line => !isMethodDeclarationLine(line, methodName))
        .join("\n");
}

function isMethodDeclarationLine(line, methodName) {
    const declarationPattern = new RegExp(`\\b(public|private|protected|internal)\\s+(?:static\\s+)?[A-Za-z0-9_<>,\\[\\]]+\\s+${methodName}\\s*\\(`);
    return declarationPattern.test(line);
}

function addUniqueObject(items, item, keys) {
    const exists = items.some(existing =>
        keys.every(key => existing[key] === item[key])
    );

    if (!exists) {
        items.push(item);
    }
}

module.exports = {
    analyzeDependencies
};
