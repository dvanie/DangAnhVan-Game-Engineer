const fs = require("fs");
const path = require("path");

const { STORAGE } = require("../config/paths");

function runDoctor() {

    const state = loadBrainState();
    const checks = [
        checkMemory(state),
        checkKnowledge(state),
        checkDiscovery(state),
        checkDependency(state),
        checkArchitecture(state),
        checkCompiler(state),
        checkContext(state),
        checkEvolution(state),
        checkPipeline(state)
    ];

    console.log("🩺 DevOS Brain Validation");
    console.log("=========================");

    checks.forEach(check => {
        console.log(`\n${check.label}`);
        console.log(`${statusIcon(check.status)} ${check.status}`);

        check.messages.forEach(message => {
            console.log(`- ${message}`);
        });
    });

    const overall = buildOverallHealth(checks);

    console.log("\nOverall Brain Health");
    console.log("");
    console.log(overall.status);

    if (overall.reasons.length > 0) {
        console.log("");
        console.log("Reason:");
        console.log("");
        overall.reasons.forEach(reason => {
            console.log(`- ${reason}`);
        });
    }

}

function loadBrainState() {

    return {
        logs: readJson(path.join(STORAGE, "logs.json"), []),
        knowledge: readJson(path.join(STORAGE, "knowledge.json"), {}),
        dependencies: readJson(path.join(STORAGE, "dependencies.json"), {}),
        architecture: readJson(path.join(STORAGE, "architecture.json"), null),
        contexts: loadContexts(),
        snapshots: loadEvolutionSnapshots()
    };

}

function checkMemory(state) {

    if (!Array.isArray(state.logs.value)) {
        return warning("Memory", ["logs.json is not readable as an array."]);
    }

    return healthy("Memory", [`Tracked logs: ${state.logs.value.length}`]);

}

function checkKnowledge(state) {

    const knowledge = state.knowledge.value;
    const featureCount = Object.keys(knowledge).length;

    if (!state.knowledge.ok) {
        return warning("Knowledge", ["knowledge.json is missing or unreadable."]);
    }

    if (featureCount === 0) {
        return warning("Knowledge", ["No tracked features found."]);
    }

    return healthy("Knowledge", [`Tracked features: ${featureCount}`]);

}

function checkDiscovery(state) {

    const contexts = state.contexts.value;
    const hasClasses = contexts.some(context => (context.insight || {}).classCount > 0);
    const hasMethods = contexts.some(context => (context.insight || {}).methodCount > 0);

    if (contexts.length === 0) {
        return warning("Discovery", ["No compiled contexts available for discovery validation."]);
    }

    if (!hasClasses || !hasMethods) {
        return warning("Discovery", ["Compiled contexts do not contain class/method insight."]);
    }

    return healthy("Discovery", ["Class and method insight found in compiled contexts."]);

}

function checkDependency(state) {

    const dependencies = state.dependencies.value;
    const featureCount = Object.keys(dependencies || {}).length;
    const hasEdges = Object.values(dependencies || {}).some(item =>
        (item.dependsOn || []).length > 0
    );

    if (!state.dependencies.ok || featureCount === 0) {
        return warning("Dependency", ["dependencies.json is missing, unreadable, or empty."]);
    }

    if (!hasEdges) {
        return warning("Dependency", ["Dependency graph has no feature edges."]);
    }

    return healthy("Dependency", [`Dependency features: ${featureCount}`]);

}

function checkArchitecture(state) {

    const architecture = state.architecture.value || {};
    const nodeCount = (architecture.nodes || []).length;
    const edgeCount = (architecture.edges || []).length;

    if (!state.architecture.ok) {
        return warning("Architecture", ["architecture.json is missing or unreadable."]);
    }

    if (nodeCount === 0 || edgeCount === 0) {
        return warning("Architecture", [`Nodes: ${nodeCount}, Edges: ${edgeCount}`]);
    }

    return healthy("Architecture", [`Nodes: ${nodeCount}`, `Edges: ${edgeCount}`]);

}

function checkCompiler(state) {

    const contexts = state.contexts.value;
    const completeContexts = contexts.filter(context =>
        context.summary &&
        context.quality &&
        context.insight &&
        context.dependencies &&
        context.architecture
    );

    if (contexts.length === 0) {
        return warning("Compiler", ["No compiled context packs found."]);
    }

    if (completeContexts.length !== contexts.length) {
        return warning("Compiler", [`Complete contexts: ${completeContexts.length}/${contexts.length}`]);
    }

    return healthy("Compiler", [`Complete contexts: ${completeContexts.length}`]);

}

function checkContext(state) {

    const contexts = state.contexts.value;
    const invalid = contexts.filter(context => !isValidDate(context.updatedAt || context.updated));

    if (contexts.length === 0) {
        return warning("Context", ["No context packs found."]);
    }

    if (invalid.length > 0) {
        return warning("Context", [`Invalid context timestamps: ${invalid.map(item => item.feature).join(", ")}`]);
    }

    return healthy("Context", [
        `Context packs: ${contexts.length}`,
        `Latest context: ${latestContextTime(contexts)}`
    ]);

}

function checkEvolution(state) {

    const snapshots = state.snapshots.value;
    const latestSnapshot = snapshots[snapshots.length - 1];

    if (snapshots.length === 0) {
        return warning("Evolution", ["No evolution snapshots found. Run: node devos compile --all"]);
    }

    if (!latestSnapshot || !Array.isArray(latestSnapshot.features)) {
        return warning("Evolution", ["Latest snapshot is unreadable or missing feature metadata."]);
    }

    const mismatches = compareSnapshotWithContexts(latestSnapshot, state.contexts.value);

    if (mismatches.length > 0) {
        return warning("Evolution", [
            "Latest snapshot does not match latest contexts.",
            ...mismatches.slice(0, 6)
        ]);
    }

    return healthy("Evolution", [
        `Snapshots: ${snapshots.length}`,
        `Latest snapshot: ${latestSnapshot.project.createdAt || latestSnapshot.project.timestamp}`
    ]);

}

function checkPipeline(state) {

    const dependencyTime = fileModifiedTime(path.join(STORAGE, "dependencies.json"));
    const architectureTime = fileModifiedTime(path.join(STORAGE, "architecture.json"));
    const latestContext = latestContextTimestamp(state.contexts.value);
    const latestSnapshot = latestSnapshotTimestamp(state.snapshots.value);
    const messages = [];

    if (dependencyTime && architectureTime && architectureTime < dependencyTime) {
        messages.push("Architecture appears older than dependencies.");
    }

    if (architectureTime && latestContext && latestContext < architectureTime) {
        messages.push("Context appears stale compared to architecture.");
    }

    if (latestContext && latestSnapshot && latestSnapshot < latestContext) {
        messages.push("Evolution snapshot older than latest context.");
    }

    if (messages.length > 0) {
        return warning("Pipeline", messages);
    }

    return healthy("Pipeline", [
        "Discovery -> Dependency -> Architecture -> Context -> Evolution timestamps are consistent."
    ]);

}

function loadContexts() {

    const contextDir = path.join(STORAGE, "contexts");

    if (!fs.existsSync(contextDir)) {
        return {
            ok: false,
            value: []
        };
    }

    try {
        return {
            ok: true,
            value: fs.readdirSync(contextDir)
                .filter(file => file.endsWith(".context.json"))
                .map(file => readJson(path.join(contextDir, file), null).value)
                .filter(Boolean)
        };
    }
    catch (err) {
        return {
            ok: false,
            value: []
        };
    }

}

function loadEvolutionSnapshots() {

    const historyDir = path.join(STORAGE, "evolution", "history");

    if (!fs.existsSync(historyDir)) {
        return {
            ok: false,
            value: []
        };
    }

    try {
        return {
            ok: true,
            value: fs.readdirSync(historyDir)
                .filter(file => file.endsWith(".json"))
                .sort((a, b) => a.localeCompare(b))
                .map(file => readJson(path.join(historyDir, file), null).value)
                .filter(Boolean)
        };
    }
    catch (err) {
        return {
            ok: false,
            value: []
        };
    }

}

function compareSnapshotWithContexts(snapshot, contexts) {

    const contextByFeature = contexts.reduce((index, context) => {
        index[context.feature] = context;
        return index;
    }, {});

    return (snapshot.features || []).flatMap(feature => {
        const context = contextByFeature[feature.feature];

        if (!context) {
            return [`Missing context for ${feature.feature}`];
        }

        const insight = context.insight || {};
        const dependencies = context.dependencies || {};
        const checks = [
            compareMetric(feature.feature, "methods", feature.methods, insight.methodCount || 0),
            compareMetric(feature.feature, "publicApis", feature.publicApis, (insight.publicAPIs || []).length),
            compareMetric(feature.feature, "dependencies", feature.dependencies, (dependencies.dependsOn || []).length)
        ];

        return checks.filter(Boolean);
    });

}

function compareMetric(feature, metric, snapshotValue, contextValue) {

    if (snapshotValue !== contextValue) {
        return `${feature}: snapshot ${metric}=${snapshotValue}, context ${metric}=${contextValue}`;
    }

    return null;

}

function readJson(filePath, fallback) {

    if (!fs.existsSync(filePath)) {
        return {
            ok: false,
            value: fallback
        };
    }

    try {
        return {
            ok: true,
            value: JSON.parse(fs.readFileSync(filePath, "utf-8"))
        };
    }
    catch (err) {
        return {
            ok: false,
            value: fallback
        };
    }

}

function latestContextTime(contexts) {

    const timestamp = latestContextTimestamp(contexts);

    return timestamp ? timestamp.toISOString() : "Unknown";

}

function latestContextTimestamp(contexts) {

    const times = contexts
        .map(context => Date.parse(context.updatedAt || context.updated))
        .filter(time => !Number.isNaN(time));

    if (times.length === 0) {
        return null;
    }

    return new Date(Math.max(...times));

}

function latestSnapshotTimestamp(snapshots) {

    if (snapshots.length === 0) {
        return null;
    }

    const latest = snapshots[snapshots.length - 1];
    const time = Date.parse((latest.project || {}).createdAt || (latest.project || {}).timestamp);

    return Number.isNaN(time) ? null : new Date(time);

}

function fileModifiedTime(filePath) {

    if (!fs.existsSync(filePath)) {
        return null;
    }

    return fs.statSync(filePath).mtime;

}

function isValidDate(value) {

    return typeof value === "string" && !Number.isNaN(Date.parse(value));

}

function healthy(label, messages = []) {

    return {
        label,
        status: "Healthy",
        messages
    };

}

function warning(label, messages = []) {

    return {
        label,
        status: "Warning",
        messages
    };

}

function statusIcon(status) {

    return status === "Healthy" ? "✔" : "⚠";

}

function buildOverallHealth(checks) {

    const warnings = checks.filter(check => check.status !== "Healthy");

    if (warnings.length === 0) {
        return {
            status: "Excellent",
            reasons: []
        };
    }

    return {
        status: "Warning",
        reasons: warnings.flatMap(check =>
            check.messages.map(message => `${check.label}: ${message}`)
        )
    };

}

module.exports = {
    runDoctor
};
