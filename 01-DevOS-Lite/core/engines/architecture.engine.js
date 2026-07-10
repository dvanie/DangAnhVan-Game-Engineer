const fs = require("fs");
const path = require("path");

const { STORAGE } = require("../../config/paths");
const { loadKnowledge } = require("../services/knowledge.service");
const { withGeneratedMetadata } = require("../models/data-contract.model");

function buildArchitectureGraph() {

    const knowledge = loadKnowledge();
    const dependencies = loadDependencies();

    const nodes = Object.keys(knowledge).map(featureName =>
        buildNode(featureName, knowledge[featureName], dependencies[featureName])
    );

    const edges = Object.keys(knowledge).flatMap(featureName =>
        buildEdges(featureName, dependencies[featureName])
    );

    const risks = nodes.flatMap(node =>
        buildRisks(node, dependencies[node.id])
    );
    const graph = withGeneratedMetadata({
        nodes,
        edges,
        risks
    }, "architecture");

    graph.intelligence = nodes.map(node =>
        buildArchitectureIntelligence(node, graph, dependencies[node.id])
    );

    return graph;

}

function exportArchitectureGraph() {

    const graph = buildArchitectureGraph();
    const outPath = path.join(STORAGE, "architecture.json");

    fs.writeFileSync(
        outPath,
        JSON.stringify(graph, null, 2)
    );

    console.log("🏛 DevOS Architecture Graph");
    console.log("===========================");
    console.log(`✔ Nodes: ${graph.nodes.length}`);
    console.log(`✔ Edges: ${graph.edges.length}`);
    console.log(`✔ Risks: ${graph.risks.length}`);
    console.log(`✔ Architecture exported: ${outPath}`);

}

function showArchitectureSummary(options = {}) {

    const architecture = loadArchitecture();

    if (!architecture) {
        console.log("❌ Architecture graph not found. Run: node devos architecture");
        return;
    }

    const visibleArchitecture = options.includeAll
        ? architecture
        : filterInternalArchitecture(architecture);

    const summary = buildArchitectureSummary(visibleArchitecture);

    console.log("🏛 DevOS Architecture Summary");
    console.log("=============================");

    console.log("\nOverview:");
    console.log(`- Features: ${visibleArchitecture.nodes.length}`);
    console.log(`- Dependencies: ${visibleArchitecture.edges.length}`);
    console.log(`- Risks: ${visibleArchitecture.risks.length}`);

    console.log("\nTop Risk Features:");
    printRankedItems(
        summary.topRiskFeatures,
        item => `${item.feature}: ${item.riskCount} ${pluralize("risk", item.riskCount)}`
    );

    console.log("\nMost Connected Features:");
    printRankedItems(
        summary.mostConnectedFeatures,
        item => `${item.feature}: ${item.connectionCount} connections`
    );

    console.log("\nIsolated Features:");
    if (summary.isolatedFeatures.length === 0) {
        console.log("- None");
    }
    else {
        summary.isolatedFeatures.forEach(feature => {
            console.log(`- ${feature}`);
        });
    }

    console.log("\nSuggested Refactor Targets:");
    printRankedItems(
        summary.refactorTargets,
        item => `${item.feature}: ${item.reasons.join(", ")}.`
    );

    showArchitectureIntelligenceSummary(visibleArchitecture);

}

function filterInternalArchitecture(architecture) {

    return {
        nodes: (architecture.nodes || [])
            .filter(node => !isInternalFeature(node.id)),
        edges: (architecture.edges || [])
            .filter(edge =>
                !isInternalFeature(edge.from) &&
                !isInternalFeature(edge.to)
            ),
        risks: (architecture.risks || [])
            .filter(risk => !isInternalFeature(risk.feature)),
        intelligence: (architecture.intelligence || [])
            .filter(item => !isInternalFeature(item.feature))
    };

}

function showArchitectureIntelligenceSummary(architecture) {

    const intelligence = architecture.intelligence || [];
    const hotspots = intelligence
        .filter(item => item.hotspotLevel !== "Low")
        .slice(0, 5);
    const godObjects = intelligence
        .filter(item => item.godObjectRisk !== "Low")
        .slice(0, 5);
    const responsibilityRisks = intelligence
        .filter(item => item.responsibilityRisk !== "Low")
        .slice(0, 5);
    const bottlenecks = intelligence
        .filter(item => item.bottleneckRisk !== "Low")
        .slice(0, 5);
    const circular = intelligence
        .flatMap(item => item.circularArchitecture || [])
        .filter((item, index, items) =>
            index === items.findIndex(other =>
                [other.from, other.to].sort().join(":") ===
                [item.from, item.to].sort().join(":")
            )
        )
        .slice(0, 8);
    const priorities = intelligence
        .filter(item => item.refactorPriority !== "Low")
        .slice(0, 5);

    console.log("\nArchitecture Intelligence:");

    console.log("\nHotspots:");
    printRankedItems(hotspots, item => `${item.feature}: ${item.hotspotLevel}`);

    console.log("\nGod Object Risks:");
    printRankedItems(godObjects, item => `${item.feature}: ${item.godObjectRisk} (Possible) - ${item.godObjectReasons.join(", ")}`);

    console.log("\nResponsibility Risks:");
    printRankedItems(responsibilityRisks, item => `${item.feature}: ${item.responsibilityRisk} - ${item.responsibilityReasons.join(", ")}`);

    console.log("\nBottlenecks:");
    printRankedItems(bottlenecks, item => `${item.feature}: ${item.bottleneckRisk} - ${item.bottleneckReasons.join(", ")}`);

    console.log("\nCircular Architecture:");
    printRankedItems(circular, item => `${item.from} <-> ${item.to} (${item.confidence})`);

    console.log("\nRefactor Priorities:");
    printRankedItems(priorities, item => `${item.feature}: ${item.refactorPriority}`);

}

function isInternalFeature(featureName) {

    return featureName === "DevOS";

}

function buildArchitectureSummary(architecture) {

    const riskCounts = countRisksByFeature(architecture.risks || []);
    const connectionCounts = countConnectionsByFeature(
        architecture.nodes || [],
        architecture.edges || []
    );

    const topRiskFeatures = Object.keys(riskCounts)
        .map(feature => ({
            feature,
            riskCount: riskCounts[feature]
        }))
        .sort((a, b) => b.riskCount - a.riskCount)
        .slice(0, 5);

    const mostConnectedFeatures = Object.keys(connectionCounts)
        .map(feature => ({
            feature,
            connectionCount: connectionCounts[feature]
        }))
        .filter(item => item.connectionCount > 0)
        .sort((a, b) => b.connectionCount - a.connectionCount)
        .slice(0, 5);

    const isolatedFeatures = (architecture.nodes || [])
        .map(node => node.id)
        .filter(feature => connectionCounts[feature] === 0);

    const refactorTargets = (architecture.nodes || [])
        .map(node => buildRefactorTarget(node, riskCounts, connectionCounts))
        .filter(Boolean);

    return {
        topRiskFeatures,
        mostConnectedFeatures,
        isolatedFeatures,
        refactorTargets
    };

}

function countRisksByFeature(risks) {

    return risks.reduce((counts, risk) => {
        counts[risk.feature] = (counts[risk.feature] || 0) + 1;
        return counts;
    }, {});

}

function countConnectionsByFeature(nodes, edges) {

    const counts = {};

    nodes.forEach(node => {
        counts[node.id] = 0;
    });

    edges.forEach(edge => {
        counts[edge.from] = (counts[edge.from] || 0) + 1;
        counts[edge.to] = (counts[edge.to] || 0) + 1;
    });

    return counts;

}

function buildRefactorTarget(node, riskCounts, connectionCounts) {

    const riskCount = riskCounts[node.id] || 0;
    const connectionCount = connectionCounts[node.id] || 0;
    const reasons = [];

    if (riskCount >= 2) {
        reasons.push("High risk");
    }

    if (connectionCount >= 5) {
        reasons.push("Many dependencies");
    }

    if (node.methodCount > 50) {
        reasons.push("Many methods");
    }

    if (node.fileCount > 5) {
        reasons.push("Many files");
    }

    if (reasons.length === 0) {
        return null;
    }

    return {
        feature: node.id,
        reasons
    };

}

function printRankedItems(items, format) {

    if (items.length === 0) {
        console.log("- None");
        return;
    }

    items.forEach(item => {
        console.log(`- ${format(item)}`);
    });

}

function pluralize(word, count) {

    return count === 1 ? word : `${word}s`;

}

function buildNode(featureName, feature, dependency) {

    const fileAnalyses = Object.values((dependency && dependency.files) || {});
    const totals = getTotals(fileAnalyses);

    return {
        id: featureName,
        type: "feature",
        fileCount: (feature.files || []).length,
        classCount: totals.classCount,
        methodCount: totals.methodCount,
        todoCount: totals.todoCount
    };

}

function buildEdges(featureName, dependency) {

    if (!dependency || !dependency.dependsOn) {
        return [];
    }

    return dependency.dependsOn.map(targetFeature => {
        const references = collectReferencesForFeature(dependency, targetFeature);

        return {
            from: featureName,
            to: targetFeature,
            type: "dependsOn",
            weight: references.length || 1,
            references
        };
    });

}

function collectReferencesForFeature(dependency, targetFeature) {

    const names = [];

    Object.values(dependency.files || {}).forEach(file => {
        (file.references || [])
            .filter(reference => reference.feature === targetFeature)
            .forEach(reference => {
                if (!names.includes(reference.className)) {
                    names.push(reference.className);
                }
            });
    });

    return names;

}

function buildRisks(node, dependency) {

    const risks = [];
    const dependsOn = (dependency && dependency.dependsOn) || [];
    const publicApiCount = countPublicApis(dependency);

    if (dependsOn.length >= 3) {
        risks.push({
            feature: node.id,
            type: "high-dependency-count",
            message: `${node.id} depends on ${dependsOn.length} features.`
        });
    }

    if (publicApiCount > 20) {
        risks.push({
            feature: node.id,
            type: "high-public-api-count",
            message: `${node.id} exposes many public methods.`
        });
    }

    if (node.todoCount > 0) {
        risks.push({
            feature: node.id,
            type: "todo-markers",
            message: `${node.id} has TODO/FIXME/BUG comments.`
        });
    }

    if (node.methodCount > 50) {
        risks.push({
            feature: node.id,
            type: "high-method-count",
            message: `${node.id} has many methods.`
        });
    }

    return risks;

}

function buildArchitectureIntelligence(node, graph, dependency) {

    const incoming = (graph.edges || []).filter(edge => edge.to === node.id);
    const outgoing = (graph.edges || []).filter(edge => edge.from === node.id);
    const risks = (graph.risks || []).filter(risk => risk.feature === node.id);
    const details = (dependency && dependency.details) || {};
    const publicApiCount = countPublicApis(dependency);
    const circularArchitecture = buildCircularForFeature(node.id, graph);

    const hotspotScore = [
        node.methodCount > 40,
        publicApiCount > 10,
        outgoing.length >= 3,
        incoming.length >= 3,
        risks.length >= 3,
        circularArchitecture.length > 0
    ].filter(Boolean).length;

    const responsibilityDomainCount = countResponsibilityDomains(node.id, dependency);
    const hasManyMethods = node.methodCount > 40;
    const hasManyPublicApis = publicApiCount > 10;
    const hasManyOutgoing = outgoing.length >= 3;
    const hasCentralRole = incoming.length >= 2;
    const hasManyDomains = responsibilityDomainCount >= 3;
    const godReasons = [];
    if (hasManyMethods) godReasons.push("many methods");
    if (hasManyPublicApis) godReasons.push("many public APIs");
    if (hasManyDomains) godReasons.push("multiple responsibility domains");
    if (hasManyOutgoing && hasCentralRole) godReasons.push("central incoming/outgoing role");

    const responsibilityReasons = [];
    if (hasManyOutgoing) responsibilityReasons.push("many outgoing dependencies");
    if (hasManyDomains) responsibilityReasons.push("multiple responsibility domains");
    if (incoming.length > 0 && outgoing.length > 0) responsibilityReasons.push("mixed incoming and outgoing dependencies");
    if (node.fileCount > 5) responsibilityReasons.push("many files");

    const bottleneckReasons = [];
    if (incoming.length >= 3) bottleneckReasons.push("many incoming dependencies");
    if (outgoing.length >= 3) bottleneckReasons.push("many outgoing dependencies");
    if (publicApiCount > 10) bottleneckReasons.push("large public API surface");
    if (((details.classUsage || []).length + (details.methodCalls || []).length) > 30) {
        bottleneckReasons.push("many detailed code links");
    }

    const hotspotLevel = levelFromScore(hotspotScore);
    const godObjectRisk = buildGodObjectRisk({
        hasManyMethods,
        hasManyPublicApis,
        hasManyDomains,
        hasManyOutgoing,
        hasCentralRole
    });
    const responsibilityRisk = responsibilityLevelFromScore(responsibilityReasons.length);
    const bottleneckRisk = levelFromScore(bottleneckReasons.length);
    const refactorPriority = buildRefactorPriority({
        hotspotLevel,
        godObjectRisk,
        responsibilityRisk,
        bottleneckRisk,
        circularArchitecture,
        risks
    });

    return {
        feature: node.id,
        hotspotLevel,
        godObjectRisk,
        responsibilityRisk,
        bottleneckRisk,
        circularArchitecture,
        refactorPriority,
        findings: buildArchitectureFindings(node, incoming, outgoing, publicApiCount, circularArchitecture, godReasons, responsibilityReasons, bottleneckReasons),
        suggestions: buildArchitectureSuggestions(node, incoming, outgoing, publicApiCount, circularArchitecture, godObjectRisk),
        godObjectReasons: godReasons,
        responsibilityReasons,
        bottleneckReasons
    };

}

function buildCircularForFeature(featureName, graph) {

    return (graph.edges || [])
        .filter(edge => edge.from === featureName)
        .filter(edge => (graph.edges || []).some(other =>
            other.from === edge.to &&
            other.to === featureName
        ))
        .map(edge => ({
            from: featureName,
            to: edge.to,
            confidence: "Possible"
        }));

}

function countResponsibilityDomains(featureName, dependency) {

    const signals = [
        featureName,
        ...Object.keys((dependency && dependency.files) || {}),
        ...Object.values((dependency && dependency.files) || {})
            .flatMap(file => [
                ...(file.classes || []),
                ...(file.methods || []).map(method => method.name)
            ])
    ].join(" ").toLowerCase();
    const domains = ["army", "soul", "summon", "player", "enemy", "ui", "inventory", "combat", "health", "level"];

    return domains.filter(domain => signals.includes(domain)).length;

}

function buildGodObjectRisk({ hasManyMethods, hasManyPublicApis, hasManyDomains, hasManyOutgoing, hasCentralRole }) {

    const strongScore = [
        hasManyMethods,
        hasManyPublicApis,
        hasManyDomains,
        hasManyOutgoing && hasCentralRole
    ].filter(Boolean).length;

    if (strongScore >= 3) return "High";
    if (strongScore >= 2 && (hasManyMethods || hasManyPublicApis)) return "Medium";
    return "Low";

}

function levelFromScore(score) {

    if (score >= 4) return "High";
    if (score >= 2) return "Medium";
    return "Low";

}

function responsibilityLevelFromScore(score) {

    if (score >= 3) return "High";
    if (score >= 2) return "Medium";
    return "Low";

}

function buildRefactorPriority({ hotspotLevel, godObjectRisk, responsibilityRisk, bottleneckRisk, circularArchitecture, risks }) {

    const score = [
        hotspotLevel === "High",
        godObjectRisk !== "Low",
        responsibilityRisk === "High",
        bottleneckRisk !== "Low",
        circularArchitecture.length > 0,
        risks.length >= 3
    ].filter(Boolean).length;

    if (score >= 3) return "High";
    if (score >= 1) return "Medium";
    return "Low";

}

function buildArchitectureFindings(node, incoming, outgoing, publicApiCount, circularArchitecture, godReasons, responsibilityReasons, bottleneckReasons) {

    const findings = [];

    if (node.methodCount > 40 || publicApiCount > 10) {
        findings.push(`${node.id} has many methods or public APIs.`);
    }

    if (incoming.length > 0 && outgoing.length > 0) {
        findings.push(`${node.id} has both incoming and outgoing dependencies.`);
    }

    if (circularArchitecture.length > 0) {
        findings.push(`${node.id} participates in possible circular dependencies with ${circularArchitecture.map(item => item.to).join(", ")}.`);
    }

    if (godReasons.length > 0) {
        findings.push(`${node.id} may have possible god object pressure.`);
    }

    if (responsibilityReasons.length > 0) {
        findings.push(`${node.id} may be carrying multiple responsibilities.`);
    }

    if (bottleneckReasons.length > 0) {
        findings.push(`${node.id} may act as an architectural bottleneck.`);
    }

    return findings;

}

function buildArchitectureSuggestions(node, incoming, outgoing, publicApiCount, circularArchitecture, godObjectRisk) {

    const suggestions = [];

    if (node.methodCount > 40) {
        suggestions.push(`Avoid adding unrelated methods to ${node.id}.`);
    }

    if (publicApiCount > 10) {
        suggestions.push("Review public APIs before adding more.");
    }

    if (outgoing.length >= 3) {
        suggestions.push("Review dependent features before changing coordination logic.");
    }

    if (incoming.length >= 3) {
        suggestions.push("Changing this feature may affect multiple systems.");
    }

    if (circularArchitecture.length > 0) {
        suggestions.push("Consider reducing bidirectional dependencies over time.");
    }

    if (godObjectRisk !== "Low") {
        suggestions.push("Consider splitting responsibilities if this feature keeps growing.");
    }

    return suggestions;

}

function getTotals(fileAnalyses) {

    return fileAnalyses.reduce((totals, file) => ({
        classCount: totals.classCount + ((file.classes || []).length),
        methodCount: totals.methodCount + ((file.methods || []).length),
        todoCount: totals.todoCount + ((file.todos || []).length)
    }), {
        classCount: 0,
        methodCount: 0,
        todoCount: 0
    });

}

function countPublicApis(dependency) {

    if (!dependency) {
        return 0;
    }

    return Object.values(dependency.files || {}).reduce((count, file) =>
        count + (file.methods || [])
            .filter(method => method.visibility === "public")
            .length
    , 0);

}

function loadDependencies() {

    const depPath = path.join(STORAGE, "dependencies.json");

    if (!fs.existsSync(depPath)) {
        return {};
    }

    return JSON.parse(fs.readFileSync(depPath, "utf-8"));

}

function loadArchitecture() {

    const architecturePath = path.join(STORAGE, "architecture.json");

    if (!fs.existsSync(architecturePath)) {
        return null;
    }

    return JSON.parse(fs.readFileSync(architecturePath, "utf-8"));

}

module.exports = {
    buildArchitectureGraph,
    exportArchitectureGraph,
    showArchitectureSummary
};
