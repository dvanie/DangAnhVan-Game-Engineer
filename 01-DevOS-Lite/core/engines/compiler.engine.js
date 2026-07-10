const { loadKnowledge } = require("../services/knowledge.service");
const { getAllLogs } = require("../services/memory.service");
const { loadDecisions } = require("../services/decision.service");
const fs = require("fs");
const path = require("path");
const { STORAGE } = require("../../config/paths");
const devosConfig = require("../../config/config.json");
const discovery = require("./discovery.engine");
const dependency = require("./dependency.engine");
const architectureEngine = require("./architecture.engine");
const { SCHEMAS, nowIso } = require("../models/data-contract.model");
const ownedFilesModel = require("../models/owned-files.model");

const PROJECT_BRAIN_MILESTONE = "Project Brain v0.3 Stable";
const NEXT_RECOMMENDED_TASK = {
    title: "Knowledge Evolution",
    goal: "Understand project evolution over time."
};

const SEMANTIC_KEYWORDS = [
    {
        key: "soul",
        label: "Soul Collection",
        responsibility: "soul collection and access",
        purpose: "collected shadows can be tracked and reused in gameplay"
    },
    {
        key: "army",
        label: "Army Management",
        responsibility: "army composition and validation",
        purpose: "the player army can be assembled, validated, and used during gameplay"
    },
    {
        key: "summon",
        label: "Summon Flow",
        responsibility: "summon flow and active unit coordination",
        purpose: "collected units can participate in live gameplay"
    },
    {
        key: "inventory",
        label: "Inventory",
        responsibility: "inventory state and item access",
        purpose: "owned items remain available to gameplay systems"
    },
    {
        key: "enemy",
        label: "Enemy Behaviour",
        responsibility: "enemy behaviour and combat interactions",
        purpose: "enemy actors can participate in combat and progression"
    },
    {
        key: "player",
        label: "Player State",
        responsibility: "player state and player-driven actions",
        purpose: "player actions and state changes drive gameplay"
    },
    {
        key: "quest",
        label: "Quest System",
        responsibility: "quest state and objective progress",
        purpose: "objectives can guide player progression"
    },
    {
        key: "skill",
        label: "Skill Logic",
        responsibility: "skill rules and ability behavior",
        purpose: "abilities can be executed consistently in gameplay"
    },
    {
        key: "ui",
        label: "User Interface",
        responsibility: "user interface updates and feedback",
        purpose: "gameplay state can be visible to the player"
    },
    {
        key: "health",
        label: "Health State",
        responsibility: "health state and defeat flow",
        purpose: "actors can take damage, recover, or be defeated"
    },
    {
        key: "combat",
        label: "Combat Flow",
        responsibility: "combat flow and attack resolution",
        purpose: "gameplay actors can resolve offensive interactions"
    },
    {
        key: "level",
        label: "Progression",
        responsibility: "level and progression state",
        purpose: "gameplay progression can be tracked over time"
    }
];

function compileFeature(featureName, options = {}) {

    const knowledge = loadKnowledge();
    const logs = getAllLogs();
    const decisions = loadDecisions();
    const dependencies = loadDependencies();
    const architecture = loadArchitecture();

    const key = Object.keys(knowledge).find(k =>
        k.toLowerCase() === featureName.toLowerCase()
    );

    if (!key) {
        return null;
    }

    const feature = knowledge[key];

    const relatedLogs = logs.filter(log =>
        feature.commits.includes(log.commit)
    );

    const featureDependencies = dependencies[key] || {
        files: {},
        dependsOn: []
    };

    const insight = buildInsight(featureDependencies);
    const architectureContext = buildArchitectureContext(key, architecture);
    const summary = buildSummary(key, feature, featureDependencies, insight, architectureContext);
    const updatedAt = options.updatedAt || feature.updatedAt || feature.updated;
    const compiled = {
        schemaVersion: SCHEMAS.context,
        feature: key,
        files: feature.files,
        ownedFiles: ownedFilesModel.getOwnedFiles(key),
        integrationPoints: ownedFilesModel.getIntegrationPoints(key),
        commits: relatedLogs.map(log => ({
            hash: log.commit,
            shortHash: log.commit.substring(0, 8),
            message: log.message,
            createdAt: log.createdAt || log.time,
            time: log.time
        })),
        decisions,
        dependencies: featureDependencies,
        insight,
        architecture: architectureContext,
        summary,
        updatedAt,
        updated: updatedAt,
        instruction: `Use this compiled context to understand the ${key} system before suggesting code changes.`
    };

    compiled.quality = buildContextQuality(compiled);

    return compiled;

}

function buildContextQuality(compiled) {

    const weaknesses = buildQualityWeaknesses(compiled);
    const penalty = weaknesses.reduce((total, weakness) =>
        total + weakness.penalty
    , 0);
    const dependencyConfidence = buildDependencyDetailConfidence(compiled.dependencies.details);
    const cappedScore = applyQualityCaps(100 - penalty, compiled, dependencyConfidence);
    const overallScore = Math.max(0, cappedScore);

    return {
        overallScore,
        overallRating: ratingFromScore(overallScore),
        aiReadiness: rateAiReadiness(compiled),
        completeness: rateCompleteness(compiled),
        dependencyCoverage: rateDependencyCoverage(compiled),
        architectureCoverage: rateArchitectureCoverage(compiled),
        summaryQuality: rateSummaryQuality(compiled.summary),
        dependencyDetailConfidence: dependencyConfidence.level,
        strengths: buildQualityStrengths(compiled),
        weaknesses: weaknesses.map(weakness => weakness.message)
    };

}

function buildDependencyDetailConfidence(details) {

    const items = collectDependencyDetailItems(details);

    if (items.length === 0) {
        return {
            level: "Unknown",
            possibleRatio: 0,
            total: 0
        };
    }

    const possibleCount = items.filter(item =>
        (item.confidence || "").includes("Possible")
    ).length;
    const possibleRatio = possibleCount / items.length;

    return {
        level: possibleRatio > 0.7 ? "Moderate" : "Good",
        possibleRatio,
        total: items.length
    };

}

function collectDependencyDetailItems(details) {

    if (!details) {
        return [];
    }

    return [
        ...(details.classUsage || []),
        ...(details.methodCalls || []),
        ...(details.publicApiUsage || []),
        ...(details.circularDependencies || []),
        ...(details.possibleUnusedApis || [])
    ];

}

function applyQualityCaps(score, compiled, dependencyConfidence) {

    let capped = score;

    if (dependencyConfidence.possibleRatio > 0.7) {
        capped = Math.min(capped, 95);
    }

    if (((compiled.dependencies.details || {}).possibleUnusedApis || []).length > 5) {
        capped = Math.min(capped, 94);
    }

    return capped;

}

function hasDependencies(compiled) {

    return !!compiled.dependencies &&
        (
            (compiled.dependencies.dependsOn || []).length > 0 ||
            Object.keys(compiled.dependencies.files || {}).length > 0
        );

}

function hasInsight(insight) {

    return !!insight &&
        (
            insight.classCount > 0 ||
            insight.methodCount > 0 ||
            (insight.publicAPIs || []).length > 0 ||
            (insight.knownReferences || []).length > 0
        );

}

function hasArchitecture(architecture) {

    return !!architecture &&
        (
            (architecture.outgoing || []).length > 0 ||
            (architecture.incoming || []).length > 0 ||
            (architecture.risks || []).length > 0 ||
            !!architecture.riskLevel
        );

}

function hasCompleteSummary(summary) {

    return !!summary &&
        !!summary.shortDescription &&
        !!summary.responsibility &&
        !!summary.mainPurpose &&
        Array.isArray(summary.mainAPIs) &&
        !!summary.riskSummary &&
        !!summary.aiHint;

}

function rateAiReadiness(compiled) {

    return qualityFromScore([
        hasCompleteSummary(compiled.summary),
        (compiled.summary.mainAPIs || []).length > 0,
        hasDependencies(compiled),
        hasArchitecture(compiled.architecture),
        hasInsight(compiled.insight)
    ].filter(Boolean).length * 20);

}

function rateCompleteness(compiled) {

    return qualityFromScore([
        compiled.files.length > 0,
        compiled.commits.length > 0,
        hasDependencies(compiled),
        hasInsight(compiled.insight),
        hasArchitecture(compiled.architecture),
        hasCompleteSummary(compiled.summary)
    ].filter(Boolean).length * 16);

}

function rateDependencyCoverage(compiled) {

    const hasOutgoing = (compiled.architecture.outgoing || []).length > 0;
    const hasIncoming = (compiled.architecture.incoming || []).length > 0;
    const hasRisks = (compiled.architecture.risks || []).length > 0;
    const hasBasicDependencies = hasDependencies(compiled);

    if (hasOutgoing && hasIncoming && hasRisks) {
        return "Excellent";
    }

    if (hasBasicDependencies && (hasOutgoing || hasIncoming)) {
        return "Good";
    }

    if (hasBasicDependencies) {
        return "Fair";
    }

    return "Poor";

}

function rateArchitectureCoverage(compiled) {

    const architecture = compiled.architecture || {};
    const coverage = [
        !!architecture.riskLevel,
        (architecture.risks || []).length > 0,
        (architecture.incoming || []).length > 0,
        (architecture.outgoing || []).length > 0
    ].filter(Boolean).length;

    if (coverage >= 4) return "Excellent";
    if (coverage >= 3) return "Good";
    if (coverage >= 1) return "Fair";
    return "Poor";

}

function rateSummaryQuality(summary) {

    const quality = [
        !!summary.shortDescription,
        !!summary.responsibility,
        !!summary.mainPurpose,
        Array.isArray(summary.mainAPIs),
        !!summary.riskSummary,
        !!summary.aiHint
    ].filter(Boolean).length;

    if (quality >= 6) return "Excellent";
    if (quality >= 4) return "Good";
    if (quality >= 2) return "Fair";
    return "Poor";

}

function ratingFromScore(score) {

    if (score >= 96) return "Outstanding";
    if (score >= 90) return "Excellent";
    if (score >= 80) return "Good";
    if (score >= 70) return "Fair";
    if (score >= 60) return "Basic";
    return "Poor";

}

function qualityFromScore(score) {

    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Poor";

}

function buildQualityStrengths(compiled) {

    const strengths = [];

    if (hasCompleteSummary(compiled.summary)) {
        strengths.push("Rich semantic summary");
    }

    if (compiled.summary.responsibility) {
        strengths.push("Clear responsibilities");
    }

    if ((compiled.architecture.risks || []).length > 0) {
        strengths.push("Architecture risks detected");
    }

    if ((compiled.summary.mainAPIs || []).length > 0) {
        strengths.push("Public APIs documented");
    }

    if (hasDependencies(compiled)) {
        strengths.push("Good dependency information");
    }

    if (compiled.summary.aiHint) {
        strengths.push("AI guidance available");
    }

    return strengths.length > 0 ? strengths : ["Basic context structure available"];

}

function buildQualityWeaknesses(compiled) {

    const weaknesses = [];

    if (compiled.files.length === 0) {
        weaknesses.push({
            message: "No files",
            penalty: 15
        });
    }

    if (compiled.commits.length < 2) {
        weaknesses.push({
            message: "Few commits",
            penalty: 2
        });
    }

    if (compiled.insight.todoCount === 0) {
        weaknesses.push({
            message: "No TODO information",
            penalty: 1
        });
    }

    if (compiled.decisions.length === 0) {
        weaknesses.push({
            message: "No design decisions",
            penalty: 5
        });
    }

    if (!hasDependencies(compiled)) {
        weaknesses.push({
            message: "No dependencies",
            penalty: 10
        });
    }

    if (!hasInsight(compiled.insight)) {
        weaknesses.push({
            message: "No code insight",
            penalty: 12
        });
    }

    if (!hasArchitecture(compiled.architecture)) {
        weaknesses.push({
            message: "No architecture coverage",
            penalty: 15
        });
    }

    if (!hasCompleteSummary(compiled.summary)) {
        weaknesses.push({
            message: "No complete semantic summary",
            penalty: 20
        });
    }

    if ((compiled.architecture.risks || []).length === 0) {
        weaknesses.push({
            message: "No architecture risks detected",
            penalty: 0
        });
    }

    const dependencyConfidence = buildDependencyDetailConfidence(compiled.dependencies.details);

    if (dependencyConfidence.possibleRatio > 0.7) {
        weaknesses.push({
            message: "Dependency details are mostly heuristic",
            penalty: 2
        });
    }

    if (((compiled.dependencies.details || {}).possibleUnusedApis || []).length > 5) {
        weaknesses.push({
            message: "Many possible unused APIs need review",
            penalty: 1
        });
    }

    return weaknesses.length > 0
        ? weaknesses
        : [{ message: "No major context gaps detected", penalty: 0 }];

}

function buildSummary(featureName, feature, dependencies, insight, architecture) {

    const semanticProfile = buildSemanticProfile(featureName, feature, dependencies, insight, architecture);
    const responsibility = inferResponsibility(featureName, semanticProfile);
    const hasRisks = architecture.risks.length > 0 || insight.riskHints.length > 0;

    return {
        feature: featureName,
        shortDescription: buildShortDescription(featureName, insight, architecture, semanticProfile),
        responsibility,
        mainPurpose: buildMainPurpose(featureName, dependencies, architecture, semanticProfile),
        mainAPIs: (insight.publicAPIs || []).slice(0, 10),
        riskSummary: hasRisks
            ? buildRiskSummary(insight, architecture)
            : "No major architectural risks detected.",
        aiHint: buildAiHint(featureName, insight, architecture)
    };

}

function buildSemanticProfile(featureName, feature, dependencies, insight, architecture) {

    if (featureName === "DevOS") {
        return {
            domains: ["Project Intelligence"],
            responsibilities: ["project memory and AI-ready context"],
            purposes: ["project knowledge can be preserved and reused"],
            signals: []
        };
    }

    const signals = collectSemanticSignals(featureName, feature, dependencies, insight, architecture);
    const scores = SEMANTIC_KEYWORDS.map(item => ({
        ...item,
        score: scoreKeyword(item.key, signals)
    }))
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score);

    const top = scores.slice(0, 3);

    return {
        domains: top.map(item => item.label),
        responsibilities: top.map(item => item.responsibility),
        purposes: top.map(item => item.purpose),
        signals
    };

}

function collectSemanticSignals(featureName, feature, dependencies, insight, architecture) {

    const fileNames = (feature.files || []).map(file =>
        path.basename(file, path.extname(file))
    );

    const dependencyFiles = Object.values((dependencies && dependencies.files) || {});
    const classes = dependencyFiles.flatMap(file => file.classes || []);
    const methods = dependencyFiles.flatMap(file =>
        (file.methods || []).map(method => method.name)
    );
    const references = (insight.knownReferences || [])
        .map(reference => reference.className);
    const outgoing = (architecture.outgoing || []).map(edge => edge.to);
    const incoming = (architecture.incoming || []).map(edge => edge.from);

    return unique([
        featureName,
        ...fileNames,
        ...classes,
        ...methods,
        ...(insight.publicAPIs || []),
        ...references,
        ...outgoing,
        ...incoming
    ]).map(signal => signal.toLowerCase());

}

function scoreKeyword(keyword, signals) {

    return signals.reduce((score, signal) =>
        signal.includes(keyword) ? score + 1 : score
    , 0);

}

function buildShortDescription(featureName, insight, architecture, semanticProfile) {

    if (featureName === "DevOS") {
        return "DevOS is internal project intelligence tooling, not a gameplay feature.";
    }

    if (semanticProfile.domains.length >= 2) {
        return `Gameplay feature responsible for ${joinPhrase(semanticProfile.domains).toLowerCase()}.`;
    }

    if (semanticProfile.domains.length === 1) {
        return `Gameplay feature focused on ${semanticProfile.domains[0].toLowerCase()}.`;
    }

    if (architecture.outgoing.length > 0 || architecture.incoming.length > 0) {
        return `${featureName} is a gameplay feature connected to other project systems.`;
    }

    if (insight.classCount > 0 || insight.methodCount > 0) {
        return `${featureName} is a focused gameplay feature with local code responsibilities.`;
    }

    return `${featureName} is a known project feature with limited analyzed code data.`;

}

function inferResponsibility(featureName, semanticProfile) {

    if (featureName === "DevOS") {
        return "Maintains project memory, analysis outputs, and AI-ready context tooling.";
    }

    if (semanticProfile.responsibilities.length > 0) {
        return `Manages ${joinPhrase(semanticProfile.responsibilities)}.`;
    }

    return `Manages ${featureName} gameplay behavior and related project logic.`;

}

function buildMainPurpose(featureName, dependencies, architecture, semanticProfile) {

    if (featureName === "DevOS") {
        return "Builds deterministic project intelligence that helps humans and AI understand the project faster.";
    }

    const outgoing = architecture.outgoing.map(edge => edge.to);

    if (semanticProfile.purposes.length > 0 && outgoing.length > 0) {
        return `Coordinates ${joinPhrase(semanticProfile.domains)} with ${joinPhrase(outgoing)} so ${semanticProfile.purposes[0]}.`;
    }

    if (semanticProfile.purposes.length > 0) {
        return `Provides the gameplay flow where ${semanticProfile.purposes[0]}.`;
    }

    if (outgoing.length > 0) {
        return `Coordinates with ${joinPhrase(outgoing)} to support the larger gameplay flow.`;
    }

    if ((dependencies.dependsOn || []).length > 0) {
        return "Uses related feature data to support gameplay behavior.";
    }

    return "Provides focused behavior that can be understood with minimal cross-feature context.";

}

function buildRiskSummary(insight, architecture) {

    if (architecture.risks.length > 0) {
        const reasons = [];

        if (architecture.outgoing.length >= 3) {
            reasons.push("multiple feature dependencies");
        }

        if (architecture.incoming.length >= 3) {
            reasons.push("many incoming dependents");
        }

        if ((insight.publicAPIs || []).length > 20) {
            reasons.push("a large public surface");
        }

        if (insight.methodCount > 50) {
            reasons.push("many methods");
        }

        if (insight.todoCount > 0) {
            reasons.push("unfinished TODO/FIXME/BUG work");
        }

        if (reasons.length === 0) {
            reasons.push("architecture warnings");
        }

        return `${architecture.riskLevel} risk due to ${joinPhrase(reasons)}.`;
    }

    if (insight.riskHints.length > 0) {
        return `Potential risk: ${insight.riskHints.slice(0, 3).join("; ")}.`;
    }

    return "No major architectural risks detected.";

}

function buildAiHint(featureName, insight, architecture) {

    if (featureName === "DevOS") {
        return "When modifying DevOS, preserve deterministic local analysis and avoid adding AI-agent behavior.";
    }

    const hints = [];

    if (architecture.incoming.length >= 3) {
        hints.push("Changing public APIs may affect multiple gameplay systems");
    }

    if (architecture.outgoing.length >= 3) {
        hints.push("Review dependent features before modifying internal logic");
    }

    if ((insight.publicAPIs || []).length > 20) {
        hints.push("Prefer extending existing APIs instead of creating new ones");
    }

    if (insight.methodCount > 50) {
        hints.push("Keep changes narrow because this feature already has many methods");
    }

    if (architecture.riskLevel === "High") {
        hints.push("Avoid adding unrelated responsibilities");
    }

    if (hints.length === 0) {
        hints.push("Keep changes focused and preserve existing feature boundaries");
    }

    return `${hints.join(". ")}.`;

}

function joinPhrase(items) {

    const clean = unique(items);

    if (clean.length === 0) {
        return "";
    }

    if (clean.length === 1) {
        return clean[0];
    }

    if (clean.length === 2) {
        return `${clean[0]} and ${clean[1]}`;
    }

    return `${clean.slice(0, -1).join(", ")}, and ${clean[clean.length - 1]}`;

}

function unique(items) {

    return [...new Set(items.filter(Boolean))];

}

function buildArchitectureContext(featureName, architecture) {

    const outgoing = (architecture.edges || [])
        .filter(edge => edge.from === featureName);

    const incoming = (architecture.edges || [])
        .filter(edge => edge.to === featureName);

    const risks = (architecture.risks || [])
        .filter(risk => risk.feature === featureName);
    const intelligence = (architecture.intelligence || [])
        .find(item => item.feature === featureName) || null;

    return {
        outgoing,
        incoming,
        risks,
        riskLevel: getArchitectureRiskLevel(risks),
        intelligence
    };

}

function getArchitectureRiskLevel(risks) {

    if (risks.length >= 3) {
        return "High";
    }

    if (risks.length >= 1) {
        return "Medium";
    }

    return "Low";

}

function buildInsight(dependencies) {

    const files = dependencies.files || {};
    const fileAnalyses = Object.values(files);
    const knownReferences = [];
    const publicAPIs = [];

    let classCount = 0;
    let methodCount = 0;
    let todoCount = 0;

    fileAnalyses.forEach(file => {
        classCount += (file.classes || []).length;
        methodCount += (file.methods || []).length;
        todoCount += (file.todos || []).length;

        (file.methods || [])
            .filter(method => method.visibility === "public")
            .forEach(method => {
                if (!publicAPIs.includes(method.name)) {
                    publicAPIs.push(method.name);
                }
            });

        (file.references || []).forEach(reference => {
            if (!knownReferences.some(item =>
                item.className === reference.className &&
                item.feature === reference.feature &&
                item.file === reference.file
            )) {
                knownReferences.push(reference);
            }
        });
    });

    const riskHints = buildRiskHints({
        todoCount,
        dependsOn: dependencies.dependsOn || [],
        publicAPIs,
        fileCount: fileAnalyses.length
    });

    return {
        classCount,
        methodCount,
        todoCount,
        publicAPIs,
        knownReferences,
        riskHints
    };

}

function buildRiskHints({ todoCount, dependsOn, publicAPIs, fileCount }) {

    const hints = [];

    if (todoCount > 0) {
        hints.push("Has TODO/FIXME/BUG markers");
    }

    if (dependsOn.length > 0) {
        hints.push(`Depends on ${dependsOn.join(", ")}`);
    }

    if (publicAPIs.length >= 8) {
        hints.push("Exposes many public methods");
    }

    if (fileCount === 0) {
        hints.push("No dependency analysis available");
    }

    return hints;

}

function showCompiledFeature(featureName) {

    const compiled = compileFeature(featureName);

    if (!compiled) {
        console.log("❌ Feature not found.");
        return;
    }

    console.log("🧩 DevOS Compiled Context");
    console.log("========================");

    console.log("\nFeature:");
    console.log(compiled.feature);

    console.log("\nFiles:");
    compiled.files.forEach(file => {
        console.log(`- ${file}`);
    });

    console.log("\nCommits:");
    compiled.commits.forEach(commit => {
        console.log(`- ${commit.shortHash} | ${commit.message}`);
    });

    console.log("\nDecisions:");
    if (compiled.decisions.length === 0) {
        console.log("- No decisions recorded.");
    }
    else {
        compiled.decisions.forEach(d => {
            console.log(`- ${d.title}`);
            console.log(`  Reason: ${d.reason}`);
        });
    }

    console.log("\nDependencies:");

    if (!compiled.dependencies || compiled.dependencies.dependsOn.length === 0) {
        console.log("- No dependencies found.");
    }
    else {
        compiled.dependencies.dependsOn.forEach(dep => {
            console.log(`- ${dep}`);
        });
    }

    showDependencyDetails(compiled.dependencies.details);

    console.log("\nInsight:");
    console.log(`- Classes: ${compiled.insight.classCount}`);
    console.log(`- Methods: ${compiled.insight.methodCount}`);
    console.log(`- TODOs: ${compiled.insight.todoCount}`);

    console.log("- Public APIs:");
    if (compiled.insight.publicAPIs.length === 0) {
        console.log("  - None found.");
    }
    else {
        compiled.insight.publicAPIs.forEach(api => {
            console.log(`  - ${api}`);
        });
    }

    console.log("- Known References:");
    if (compiled.insight.knownReferences.length === 0) {
        console.log("  - None found.");
    }
    else {
        compiled.insight.knownReferences.forEach(reference => {
            console.log(`  - ${reference.className} (${reference.feature})`);
        });
    }

    console.log("- Risk Hints:");
    if (compiled.insight.riskHints.length === 0) {
        console.log("  - None found.");
    }
    else {
        compiled.insight.riskHints.forEach(hint => {
            console.log(`  - ${hint}`);
        });
    }

    showArchitecture(compiled.architecture);

    showArchitectureIntelligence(compiled.architecture);

    showSummary(compiled.summary);

    showContextQuality(compiled.quality);

    console.log("\nLast Updated:");
    console.log(compiled.updated);

    console.log("\nAI Instruction:");
    console.log(compiled.instruction);

}

function showDependencyDetails(details) {

    const safe = details || {
        classUsage: [],
        methodCalls: [],
        publicApiUsage: [],
        circularDependencies: [],
        possibleUnusedApis: []
    };

    console.log("\nDependency Details:");

    printLimitedDependencyItems(
        "- Class Usage:",
        safe.classUsage,
        item => `${item.fromClass} uses ${item.toClass} (${item.confidence})`
    );

    printLimitedDependencyItems(
        "- Method Calls:",
        safe.methodCalls,
        item => `${item.fromMethod} calls ${item.toMethod} (${item.confidence})`
    );

    printLimitedDependencyItems(
        "- Public API Usage:",
        safe.publicApiUsage,
        item => `${item.fromFeature} may call ${item.toFeature}.${item.api} (${item.confidence})`
    );

    printLimitedDependencyItems(
        "- Circular Dependencies:",
        safe.circularDependencies,
        item => `${item.from} <-> ${item.to} (${item.confidence})`
    );

    printLimitedDependencyItems(
        "- Possible Unused APIs:",
        safe.possibleUnusedApis,
        item => `${item.className ? `${item.className}.` : ""}${item.api} (${item.confidence})`,
        8
    );

}

function printLimitedDependencyItems(title, items, format, limit = 12) {

    console.log(title);

    if (!items || items.length === 0) {
        console.log("  - None detected");
        return;
    }

    items.slice(0, limit).forEach(item => {
        console.log(`  - ${format(item)}`);
    });

    if (items.length > limit) {
        console.log(`  - ...and ${items.length - limit} more in context JSON`);
    }

}

function showContextQuality(quality) {

    console.log("\nContext Quality:");

    if (!quality) {
        console.log("- No quality score available.");
        return;
    }

    console.log(`- Overall Score: ${quality.overallScore}/100`);
    console.log(`- Overall Rating: ${quality.overallRating}`);
    console.log(`- AI Readiness: ${quality.aiReadiness}`);
    console.log(`- Completeness: ${quality.completeness}`);
    console.log(`- Dependency Coverage: ${quality.dependencyCoverage}`);
    console.log(`- Architecture Coverage: ${quality.architectureCoverage}`);
    console.log(`- Summary Quality: ${quality.summaryQuality}`);
    console.log(`- Dependency Detail Confidence: ${quality.dependencyDetailConfidence}`);

    console.log("\nStrengths:");
    quality.strengths.forEach(strength => {
        console.log(`- ${strength}`);
    });

    console.log("\nWeaknesses:");
    quality.weaknesses.forEach(weakness => {
        console.log(`- ${weakness}`);
    });

}

function showSummary(summary) {

    console.log("\nSummary:");

    if (!summary) {
        console.log("- No summary available.");
        return;
    }

    console.log(`- Short Description: ${summary.shortDescription}`);
    console.log(`- Responsibility: ${summary.responsibility}`);
    console.log(`- Main Purpose: ${summary.mainPurpose}`);

    console.log("- Main APIs:");
    if (!summary.mainAPIs || summary.mainAPIs.length === 0) {
        console.log("  - None");
    }
    else {
        summary.mainAPIs.forEach(api => {
            console.log(`  - ${api}`);
        });
    }

    console.log(`- Risk Summary: ${summary.riskSummary}`);
    console.log(`- AI Hint: ${summary.aiHint}`);

}

function showArchitecture(architecture) {

    console.log("\nArchitecture:");

    console.log("- Outgoing Dependencies:");
    if (!architecture || architecture.outgoing.length === 0) {
        console.log("  - None");
    }
    else {
        architecture.outgoing.forEach(edge => {
            console.log(`  - ${edge.to}`);
        });
    }

    console.log("\n- Incoming Dependencies:");
    if (!architecture || architecture.incoming.length === 0) {
        console.log("  - None");
    }
    else {
        architecture.incoming.forEach(edge => {
            console.log(`  - ${edge.from}`);
        });
    }

    console.log("\n- Risk Level:");
    console.log(`  ${architecture ? architecture.riskLevel : "Low"}`);

    console.log("\n- Architecture Risks:");
    if (!architecture || architecture.risks.length === 0) {
        console.log("  - None");
    }
    else {
        architecture.risks.forEach(risk => {
            console.log(`  - ${risk.message}`);
        });
    }

}

function showArchitectureIntelligence(architecture) {

    const intelligence = architecture && architecture.intelligence;

    console.log("\nArchitecture Intelligence:");

    if (!intelligence) {
        console.log("- No major architecture intelligence findings detected.");
        return;
    }

    console.log(`- Hotspot Level: ${intelligence.hotspotLevel}`);
    console.log(`- God Object Risk: ${intelligence.godObjectRisk}${intelligence.godObjectRisk !== "Low" ? " (Possible)" : ""}`);
    console.log(`- Responsibility Risk: ${intelligence.responsibilityRisk || "Low"}`);
    console.log(`- Bottleneck Risk: ${intelligence.bottleneckRisk}`);
    console.log(`- Circular Architecture: ${intelligence.circularArchitecture.length > 0 ? "Possible" : "None detected"}`);
    console.log(`- Refactor Priority: ${intelligence.refactorPriority}`);

    console.log("\nFindings:");
    if (intelligence.findings.length === 0) {
        console.log("- None detected");
    }
    else {
        intelligence.findings.slice(0, 6).forEach(finding => {
            console.log(`- ${finding}`);
        });
    }

    console.log("\nSuggestions:");
    if (intelligence.suggestions.length === 0) {
        console.log("- None");
    }
    else {
        intelligence.suggestions.slice(0, 6).forEach(suggestion => {
            console.log(`- ${suggestion}`);
        });
    }

}

function exportCompiledFeature(featureName, options = {}) {

    const compiled = compileFeature(featureName, options);

    if (!compiled) {
        console.log("❌ Feature not found.");
        return;
    }

    const contextDir = path.join(STORAGE, "contexts");

    if (!fs.existsSync(contextDir)) {
        fs.mkdirSync(contextDir, { recursive: true });
    }

    const filePath = path.join(
        contextDir,
        `${compiled.feature}.context.json`
    );

    fs.writeFileSync(
        filePath,
        JSON.stringify(compiled, null, 2)
    );

    console.log(`✔ Context exported: ${filePath}`);

}

function cleanContextBuild() {

    const contextDir = path.join(STORAGE, "contexts");

    if (!fs.existsSync(contextDir)) {
        return;
    }

    const files = fs.readdirSync(contextDir);

    files
        .filter(file => file.endsWith(".context.json"))
        .forEach(file => {
            fs.unlinkSync(path.join(contextDir, file));
        });

}

function exportAllCompiledFeatures() {

    rebuildCompilePipeline();

    cleanContextBuild();

    const knowledge = loadKnowledge();

    const keys = Object.keys(knowledge);

    if (keys.length === 0) {
        console.log("❌ No features found.");
        return;
    }

    const compileTime = nowIso();

    keys.forEach(key => {
        exportCompiledFeature(key, {
            updatedAt: compileTime
        });
    });

    console.log(`✔ Exported ${keys.length} context packs.`);
    const snapshotPath = saveEvolutionSnapshot();
    console.log(`✔ Evolution snapshot saved: ${snapshotPath}`);

}

function rebuildCompilePipeline() {

    console.log("🔁 DevOS Compile Rebuild");
    console.log("========================");

    discovery.discoverProject();
    dependency.analyzeDependencies();
    architectureEngine.exportArchitectureGraph();

}

function loadDependencies() {

    const depPath = path.join(STORAGE, "dependencies.json");

    if (!fs.existsSync(depPath)) {
        return {};
    }

    return JSON.parse(fs.readFileSync(depPath, "utf-8"));

}

function showProjectBootstrap() {

    const result = buildProjectBootstrap();

    if (!result.ok) {
        console.log("Context not compiled.");
        console.log("");
        console.log("Run:");
        console.log("");
        console.log("node devos compile --all");
        return;
    }

    const outPath = path.join(STORAGE, "bootstrap.md");

    fs.writeFileSync(outPath, result.markdown, "utf-8");

    console.log(result.markdown);
    console.log("");
    console.log(`Bootstrap exported: ${outPath}`);

}

function buildProjectBootstrap() {

    const compiledContexts = loadCompiledContexts();

    if (compiledContexts.length === 0) {
        return {
            ok: false,
            markdown: ""
        };
    }

    const knowledge = loadKnowledge();
    const logs = getAllLogs();
    const architecture = loadArchitecture();
    const latestLog = logs[logs.length - 1] || null;
    const currentStatus = buildProjectStatus(compiledContexts, architecture);
    const architectureSummary = buildProjectArchitectureSummary(architecture);
    const featureCounts = buildFeatureCounts(knowledge);
    const projectName = formatProjectName(devosConfig.project || "Unknown Project");

    return {
        ok: true,
        markdown: [
            "🚀 DevOS Bootstrap",
            "==================",
            "",
            "## Project",
            "",
            `Project: ${projectName}`,
            "",
            "Brain: DevOS",
            "",
            `Current Milestone: ${PROJECT_BRAIN_MILESTONE}`,
            "",
            "## Vision",
            "",
            "DevOS is a Project Brain.",
            "",
            "AI is an adapter.",
            "",
            "DevOS owns project knowledge.",
            "",
            "DevOS reads, remembers, and compiles project understanding so AI does not need to reread the whole source tree.",
            "",
            "## Current Architecture",
            "",
            "```text",
            "Git Commit",
            "↓",
            "Logger",
            "↓",
            "Memory",
            "↓",
            "Knowledge",
            "↓",
            "Discovery",
            "↓",
            "Dependency",
            "↓",
            "Architecture",
            "↓",
            "Compiler",
            "↓",
            "Context Pack",
            "↓",
            "AI",
            "```",
            "",
            "## Stable Modules",
            "",
            "- Memory",
            "- Knowledge",
            "- Discovery",
            "- Dependency v0.3",
            "- Architecture Intelligence v0.2",
            "- Compiler Intelligence",
            "- Context Quality",
            "- Context Pack",
            "- Resume",
            "",
            "## Latest Milestone",
            "",
            latestLog
                ? `${latestLog.message}`
                : "No memory logs found.",
            "",
            latestLog
                ? `Commit: ${latestLog.commit.substring(0, 8)}`
                : "",
            "",
            "## Current Project Status",
            "",
            `Project Brain: ${currentStatus.projectBrain}`,
            "",
            `Architecture: ${currentStatus.architecture}`,
            "",
            `Dependency: ${currentStatus.dependency}`,
            "",
            `Compiler: ${currentStatus.compiler}`,
            "",
            `Context Quality: ${currentStatus.contextQuality}`,
            "",
            `Next Phase: ${NEXT_RECOMMENDED_TASK.title}`,
            "",
            "## Project Snapshot",
            "",
            `Gameplay Features: ${featureCounts.gameplay}`,
            "",
            `Tooling Features: ${featureCounts.tooling}`,
            "",
            `Total Tracked Features: ${featureCounts.total}`,
            "",
            `Compiled Contexts: ${compiledContexts.length}`,
            "",
            `Architecture Nodes: ${architectureSummary.nodeCount}`,
            "",
            `Architecture Edges: ${architectureSummary.edgeCount}`,
            "",
            `Architecture Risks: ${architectureSummary.riskCount}`,
            "",
            "## Compiled Features",
            "",
            ...buildCompiledFeatureLines(compiledContexts),
            "",
            "## Architecture Intelligence Snapshot",
            "",
            ...buildArchitectureIntelligenceLines(architecture),
            "",
            "## Recommended Next Step",
            "",
            NEXT_RECOMMENDED_TASK.title,
            "",
            "Goal:",
            "",
            NEXT_RECOMMENDED_TASK.goal,
            "",
            "## Useful Commands",
            "",
            "```bash",
            "node devos resume",
            "node devos context system",
            "node devos architecture summary",
            "node devos compile --all",
            "node devos bootstrap",
            "```",
            "",
            "## AI Instructions",
            "",
            "- DevOS is not a Coding Agent.",
            "- Do not redesign DevOS into Cursor.",
            "- Do not turn DevOS into Claude Code or an Auto Refactor tool.",
            "- Do not add AI inside the Brain pipeline.",
            "- Prefer deterministic analysis.",
            "- Prefer local project data.",
            "- Prefer extending existing engines before adding new ones.",
            "- Keep AI as a replaceable adapter.",
            "- Read Bootstrap first, then read feature Context Packs only when needed.",
            "",
            "## Bootstrap Rule",
            "",
            "This bootstrap is generated from existing DevOS memory, knowledge, architecture, and compiled contexts.",
            "",
            "It does not scan source code and does not use AI."
        ].filter(line => line !== null).join("\n")
    };

}

function formatProjectName(name) {

    return name
        .split(/(\s+|:|-|_)/)
        .map(part => {
            if (/^\s+$/.test(part) || part === ":" || part === "-") {
                return part;
            }

            if (part === "_") {
                return " ";
            }

            if (!part) {
                return part;
            }

            return part.charAt(0).toUpperCase() + part.slice(1);
        })
        .join("");

}

function buildFeatureCounts(knowledge) {

    const features = Object.keys(knowledge);
    const tooling = features.filter(isToolingFeature).length;

    return {
        gameplay: features.length - tooling,
        tooling,
        total: features.length
    };

}

function isToolingFeature(featureName) {

    return featureName === "DevOS";

}

function loadCompiledContexts() {

    const contextDir = path.join(STORAGE, "contexts");

    if (!fs.existsSync(contextDir)) {
        return [];
    }

    return fs.readdirSync(contextDir)
        .filter(file => file.endsWith(".context.json"))
        .map(file => path.join(contextDir, file))
        .map(filePath => JSON.parse(fs.readFileSync(filePath, "utf-8")))
        .sort((a, b) => a.feature.localeCompare(b.feature));

}

function buildProjectStatus(compiledContexts, architecture) {

    const hasArchitecture = (architecture.nodes || []).length > 0;
    const hasDependencies = compiledContexts.some(context =>
        context.dependencies &&
        (
            (context.dependencies.dependsOn || []).length > 0 ||
            Object.keys(context.dependencies.files || {}).length > 0
        )
    );
    const hasQuality = compiledContexts.every(context => !!context.quality);

    return {
        projectBrain: "Stable",
        architecture: hasArchitecture ? "Stable" : "Missing",
        dependency: hasDependencies ? "Stable" : "Missing",
        compiler: compiledContexts.length > 0 ? "Stable" : "Missing",
        contextQuality: hasQuality ? "Available" : "Partial"
    };

}

function buildProjectArchitectureSummary(architecture) {

    return {
        nodeCount: (architecture.nodes || []).length,
        edgeCount: (architecture.edges || []).length,
        riskCount: (architecture.risks || []).length
    };

}

function buildCompiledFeatureLines(compiledContexts) {

    return compiledContexts.flatMap(context => {
        const summary = context.summary || {};
        const quality = context.quality || {};
        const dependsOn = (context.dependencies && context.dependencies.dependsOn) || [];
        const publicApis = (summary.mainAPIs || []).slice(0, 6);
        const strengths = (quality.strengths || []).slice(0, 4);
        const weaknesses = (quality.weaknesses || []).slice(0, 4);
        const featureType = isToolingFeature(context.feature) ? "Tooling" : "Gameplay";

        return [
            `### ${context.feature}`,
            "",
            summary.shortDescription || "Compiled context available.",
            "",
            `Type: ${featureType}`,
            "",
            `Files: ${(context.files || []).length}`,
            "",
            `Commits: ${(context.commits || []).length}`,
            "",
            `Quality: ${quality.overallRating ? `${quality.overallRating} (${quality.overallScore}/100)` : "Unknown"}`,
            "",
            `AI Readiness: ${quality.aiReadiness || "Unknown"}`,
            "",
            `Responsibility: ${summary.responsibility || "Unknown"}`,
            "",
            `Main Purpose: ${summary.mainPurpose || "Unknown"}`,
            "",
            `Risk Summary: ${summary.riskSummary || "Unknown"}`,
            "",
            "Dependencies:",
            ...formatList(dependsOn, "None detected."),
            "",
            "Main APIs:",
            ...formatList(publicApis, "None detected."),
            "",
            "Context Strengths:",
            ...formatList(strengths, "No strengths recorded."),
            "",
            "Context Weaknesses:",
            ...formatList(weaknesses, "No weaknesses recorded."),
            "",
            `AI Hint: ${summary.aiHint || context.instruction || "Use this compiled context before suggesting project changes."}`,
            ""
        ];
    });

}

function formatList(items, fallback) {

    if (!items || items.length === 0) {
        return [`- ${fallback}`];
    }

    return items.map(item => `- ${item}`);

}

function buildArchitectureIntelligenceLines(architecture) {

    const intelligence = architecture.intelligence || [];

    if (intelligence.length === 0) {
        return ["- No architecture intelligence found."];
    }

    const priorityItems = intelligence
        .filter(item => item.refactorPriority !== "Low")
        .slice(0, 5);
    const hotspotItems = intelligence
        .filter(item => item.hotspotLevel !== "Low")
        .slice(0, 5);

    const lines = [];

    lines.push("Refactor Priorities:");

    if (priorityItems.length === 0) {
        lines.push("- None");
    }
    else {
        priorityItems.forEach(item => {
            lines.push(`- ${item.feature}: ${item.refactorPriority}`);
        });
    }

    lines.push("");
    lines.push("Hotspots:");

    if (hotspotItems.length === 0) {
        lines.push("- None");
    }
    else {
        hotspotItems.forEach(item => {
            lines.push(`- ${item.feature}: ${item.hotspotLevel}`);
        });
    }

    return lines;

}

function showKnowledgeEvolution() {

    const evolution = buildKnowledgeEvolution();
    const markdown = renderKnowledgeEvolution(evolution);
    const jsonPath = path.join(STORAGE, "evolution.json");
    const markdownPath = path.join(STORAGE, "evolution.md");

    fs.writeFileSync(jsonPath, JSON.stringify(evolution, null, 2), "utf-8");
    fs.writeFileSync(markdownPath, markdown, "utf-8");

    console.log(markdown);
    console.log("");
    console.log(`Evolution exported: ${jsonPath}`);
    console.log(`Evolution exported: ${markdownPath}`);

}

function buildKnowledgeEvolution() {

    const knowledge = loadKnowledge();
    const logs = getAllLogs();
    const compiledContexts = loadCompiledContexts();
    const architecture = loadArchitecture();
    const featureCounts = buildFeatureCounts(knowledge);
    const snapshots = loadEvolutionSnapshots();
    const snapshotComparison = compareLatestSnapshots(snapshots);
    const historyDepth = snapshots.length < 2
        ? "Limited"
        : logs.length < 10 ? "Limited" : "Useful";
    const activity = buildFeatureActivity(knowledge, logs, compiledContexts);
    const growingFeatures = buildGrowingFeatures(compiledContexts, architecture, historyDepth, snapshotComparison);
    const stableFeatures = buildStableFeatures(activity, growingFeatures);

    return {
        schemaVersion: SCHEMAS.evolutionReport,
        generatedAt: nowIso(),
        rule: "Deterministic summary from DevOS memory, knowledge, architecture, compiled contexts, and evolution snapshots. No source scan. No AI.",
        overview: {
            trackedFeatures: featureCounts.total,
            gameplayFeatures: featureCounts.gameplay,
            toolingFeatures: featureCounts.tooling,
            trackedCommits: logs.length,
            trackedMilestones: buildRecentMilestones(logs).length,
            snapshots: snapshots.length,
            historyDepth
        },
        recentMilestones: buildRecentMilestones(logs),
        changesSinceLastSnapshot: snapshotComparison ? snapshotComparison.changes : [],
        structuralGrowth: snapshotComparison ? snapshotComparison.structuralGrowth : [],
        featureActivity: activity,
        growingFeatures,
        stableFeatures,
        projectTrend: buildProjectTrend(logs),
        riskTrend: buildRiskTrend(compiledContexts, architecture, historyDepth, snapshotComparison),
        riskChanges: snapshotComparison ? snapshotComparison.riskChanges : [],
        suggestedNextStep: buildEvolutionNextStep(historyDepth)
    };

}

function saveEvolutionSnapshot() {

    const snapshot = buildEvolutionSnapshot();
    const historyDir = getEvolutionHistoryDir();

    if (!fs.existsSync(historyDir)) {
        fs.mkdirSync(historyDir, { recursive: true });
    }

    const filePath = path.join(historyDir, `${snapshot.sequence}_${snapshot.project.commit}.json`);

    fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2), "utf-8");

    return filePath;

}

function buildEvolutionSnapshot() {

    const logs = getAllLogs();
    const latestLog = logs[logs.length - 1] || {};
    const compiledContexts = loadCompiledContexts();
    const architecture = loadArchitecture();
    const incomingCounts = countIncomingDependencies(architecture);
    const intelligenceByFeature = indexByFeature(architecture.intelligence || []);
    const sequence = String(loadEvolutionSnapshots().length + 1).padStart(4, "0");
    const createdAt = nowIso();

    return {
        schemaVersion: SCHEMAS.evolutionSnapshot,
        version: "0.2",
        sequence,
        project: {
            createdAt,
            timestamp: createdAt,
            commit: latestLog.commit ? latestLog.commit.substring(0, 8) : "unknown",
            milestone: latestLog.message || ""
        },
        features: compiledContexts.map(context => {
            const insight = context.insight || {};
            const dependencies = context.dependencies || {};
            const architectureContext = context.architecture || {};
            const intelligence = intelligenceByFeature[context.feature] ||
                architectureContext.intelligence ||
                {};

            return {
                feature: context.feature,
                type: isToolingFeature(context.feature) ? "Tooling" : "Gameplay",
                files: (context.files || []).length,
                classes: insight.classCount || 0,
                methods: insight.methodCount || 0,
                publicApis: (insight.publicAPIs || []).length,
                dependencies: (dependencies.dependsOn || []).length,
                incomingDependencies: incomingCounts[context.feature] || 0,
                riskLevel: architectureContext.riskLevel || "Unknown",
                hotspot: intelligence.hotspotLevel || "Unknown",
                responsibilityRisk: intelligence.responsibilityRisk || "Unknown",
                godObjectRisk: intelligence.godObjectRisk || "Unknown",
                bottleneckRisk: intelligence.bottleneckRisk || "Unknown"
            };
        })
    };

}

function getEvolutionHistoryDir() {

    return path.join(STORAGE, "evolution", "history");

}

function loadEvolutionSnapshots() {

    const historyDir = getEvolutionHistoryDir();

    if (!fs.existsSync(historyDir)) {
        return [];
    }

    return fs.readdirSync(historyDir)
        .filter(file => file.endsWith(".json"))
        .sort((a, b) => a.localeCompare(b))
        .map(file => JSON.parse(fs.readFileSync(path.join(historyDir, file), "utf-8")));

}

function compareLatestSnapshots(snapshots) {

    if (snapshots.length < 2) {
        return null;
    }

    const previous = snapshots[snapshots.length - 2];
    const current = snapshots[snapshots.length - 1];
    const previousByFeature = indexByFeature(previous.features || []);
    const changes = (current.features || []).map(feature => {
        const before = previousByFeature[feature.feature];

        if (!before) {
            return {
                feature: feature.feature,
                type: feature.type,
                status: "New feature",
                deltas: {},
                riskChange: null
            };
        }

        const deltas = {
            files: feature.files - before.files,
            classes: feature.classes - before.classes,
            methods: feature.methods - before.methods,
            publicApis: feature.publicApis - before.publicApis,
            dependencies: feature.dependencies - before.dependencies,
            incomingDependencies: feature.incomingDependencies - before.incomingDependencies
        };
        const riskChange = before.riskLevel !== feature.riskLevel
            ? `${before.riskLevel} -> ${feature.riskLevel}`
            : null;
        const hasStructuralChange = Object.values(deltas).some(delta => delta !== 0);

        return {
            feature: feature.feature,
            type: feature.type,
            status: hasStructuralChange || riskChange ? "Changed" : "No structural changes",
            deltas,
            previousRisk: before.riskLevel,
            currentRisk: feature.riskLevel,
            riskChange
        };
    });

    return {
        previous: previous.project,
        current: current.project,
        changes,
        structuralGrowth: changes.filter(hasGrowthDelta),
        riskChanges: changes.filter(hasRiskIncrease)
    };

}

function hasGrowthDelta(change) {

    return !!change.deltas &&
        (
            change.deltas.methods > 0 ||
            change.deltas.publicApis > 0 ||
            change.deltas.dependencies > 0
        );

}

function hasRiskIncrease(change) {

    if (!change.riskChange) {
        return false;
    }

    return riskScore(change.currentRisk) > riskScore(change.previousRisk);

}

function riskScore(risk) {

    if (risk === "High") return 3;
    if (risk === "Medium") return 2;
    if (risk === "Low") return 1;
    return 0;

}

function countIncomingDependencies(architecture) {

    return (architecture.edges || []).reduce((counts, edge) => {
        counts[edge.to] = (counts[edge.to] || 0) + 1;
        return counts;
    }, {});

}

function buildRecentMilestones(logs) {

    return logs
        .filter(log => isMilestoneLog(log))
        .slice(-5)
        .reverse()
        .map(log => ({
            message: cleanMilestoneMessage(log.message),
            commit: log.commit ? log.commit.substring(0, 8) : "unknown",
            time: log.time || ""
        }));

}

function isMilestoneLog(log) {

    const text = `${log.message || ""} ${log.tag || ""}`.toLowerCase();

    return text.includes("stable") ||
        text.includes("v0.") ||
        text.includes("architecture") ||
        text.includes("bootstrap") ||
        text.includes("dependency") ||
        text.includes("brain") ||
        text.includes("context");

}

function cleanMilestoneMessage(message) {

    return (message || "Unknown milestone")
        .replace(/[^\x20-\x7E]/g, "")
        .trim() || "Unknown milestone";

}

function buildFeatureActivity(knowledge, logs, compiledContexts) {

    const contextByFeature = indexByFeature(compiledContexts);

    return Object.keys(knowledge)
        .sort((a, b) => a.localeCompare(b))
        .map(feature => {
            const commits = knowledge[feature].commits || [];
            const logHits = logs.filter(log => commits.includes(log.commit));
            const context = contextByFeature[feature];
            const contextUpdated = !!(context && (context.updatedAt || context.updated));
            const score = commits.length + (contextUpdated ? 1 : 0);

            return {
                feature,
                type: isToolingFeature(feature) ? "Tooling" : "Gameplay",
                level: activityLevel(score),
                commitCount: commits.length,
                contextUpdated,
                lastUpdated: knowledge[feature].updatedAt || knowledge[feature].updated || "",
                latestCommit: logHits.length > 0 ? logHits[logHits.length - 1].message : ""
            };
        });

}

function activityLevel(score) {

    if (score >= 6) return "High";
    if (score >= 3) return "Medium";
    if (score >= 1) return "Low";
    return "Unknown";

}

function buildGrowingFeatures(compiledContexts, architecture, historyDepth, snapshotComparison) {

    if (snapshotComparison) {
        return snapshotComparison.changes.map(change => ({
            feature: change.feature,
            type: change.type,
            status: hasGrowthDelta(change) ? "Growing" : "Stable",
            reasons: buildGrowthReasons(change)
        }));
    }

    const intelligenceByFeature = indexByFeature(architecture.intelligence || []);

    return compiledContexts
        .map(context => {
            const insight = context.insight || {};
            const dependencies = context.dependencies || {};
            const intelligence = intelligenceByFeature[context.feature] || {};
            const publicApiCount = (insight.publicAPIs || []).length;
            const dependencyCount = (dependencies.dependsOn || []).length;
            const methodCount = insight.methodCount || 0;
            const reasons = [];

            if (historyDepth === "Limited") {
                reasons.push("History depth is limited");
            }

            if (methodCount > 40) reasons.push("High method count");
            if (publicApiCount > 10) reasons.push("High public API surface");
            if (dependencyCount >= 3) reasons.push("Multiple dependencies");
            if (intelligence.hotspotLevel === "High") reasons.push("High hotspot");
            if (intelligence.refactorPriority === "High") reasons.push("High refactor priority");
            if (intelligence.godObjectRisk && intelligence.godObjectRisk !== "Low") {
                reasons.push("Possible god object pressure");
            }

            const status = reasons.some(reason => reason !== "History depth is limited")
                ? "Growing"
                : "Unknown";

            return {
                feature: context.feature,
                type: isToolingFeature(context.feature) ? "Tooling" : "Gameplay",
                status,
                reasons
            };
        })
        .filter(item => item.status !== "Unknown" || historyDepth === "Limited")
        .slice(0, 8);

}

function buildGrowthReasons(change) {

    const reasons = [];

    if (change.deltas.methods > 0) reasons.push(`Methods ${formatDelta(change.deltas.methods)}`);
    if (change.deltas.publicApis > 0) reasons.push(`Public APIs ${formatDelta(change.deltas.publicApis)}`);
    if (change.deltas.dependencies > 0) reasons.push(`Dependencies ${formatDelta(change.deltas.dependencies)}`);

    return reasons.length > 0 ? reasons : ["No structural growth since last snapshot"];

}

function buildStableFeatures(activity, growingFeatures) {

    const growingNames = growingFeatures
        .filter(item => item.status === "Growing")
        .map(item => item.feature);

    return activity
        .filter(item => !growingNames.includes(item.feature))
        .filter(item => item.level === "Low" || item.level === "Unknown")
        .map(item => ({
            feature: item.feature,
            type: item.type,
            status: item.level === "Unknown" ? "Unknown" : "Stable",
            reason: item.level === "Unknown"
                ? "Limited history"
                : "Low recent tracked activity"
        }));

}

function buildProjectTrend(logs) {

    const recent = logs.slice(-8);
    const focus = [];

    addTrendIfPresent(focus, recent, "brain", "Project Brain stabilization");
    addTrendIfPresent(focus, recent, "architecture", "Architecture Intelligence");
    addTrendIfPresent(focus, recent, "context", "Context Quality and Context Pack");
    addTrendIfPresent(focus, recent, "dependency", "Dependency Analysis");
    addTrendIfPresent(focus, recent, "bootstrap", "Bootstrap Generator");

    return {
        currentFocus: focus.length > 0 ? focus : ["Unknown"],
        basis: recent.map(log => cleanMilestoneMessage(log.message)).filter(Boolean)
    };

}

function addTrendIfPresent(focus, logs, keyword, label) {

    if (logs.some(log => (log.message || "").toLowerCase().includes(keyword))) {
        focus.push(label);
    }

}

function buildRiskTrend(compiledContexts, architecture, historyDepth, snapshotComparison) {

    if (snapshotComparison) {
        return snapshotComparison.changes.map(change => ({
            feature: change.feature,
            type: change.type,
            riskLevel: change.currentRisk || "Unknown",
            trend: buildSnapshotRiskTrend(change),
            monitoring: buildSnapshotRiskTrend(change)
        }));
    }

    const intelligenceByFeature = indexByFeature(architecture.intelligence || []);

    return compiledContexts.map(context => {
        const architectureContext = context.architecture || {};
        const intelligence = intelligenceByFeature[context.feature] || architectureContext.intelligence || {};
        const riskLevel = architectureContext.riskLevel || "Unknown";
        const monitoring = buildRiskMonitoringLabel(riskLevel, intelligence);

        return {
            feature: context.feature,
            type: isToolingFeature(context.feature) ? "Tooling" : "Gameplay",
            riskLevel: historyDepth === "Limited" && riskLevel === "Low" ? "Unknown" : riskLevel,
            trend: historyDepth === "Limited" ? "Unknown" : monitoring,
            monitoring
        };
    });

}

function buildSnapshotRiskTrend(change) {

    if (hasRiskIncrease(change)) {
        return "Risk Increasing";
    }

    if (change.deltas && (
        change.deltas.publicApis >= 5 ||
        change.deltas.dependencies >= 2
    )) {
        return "Risk Increasing";
    }

    return "No significant structural change";

}

function buildRiskMonitoringLabel(riskLevel, intelligence) {

    if (riskLevel === "High" || intelligence.refactorPriority === "High") {
        return "Monitoring";
    }

    if (riskLevel === "Medium" || intelligence.hotspotLevel === "Medium") {
        return "Stable";
    }

    return "Stable";

}

function buildEvolutionNextStep(historyDepth) {

    if (historyDepth === "Limited") {
        return "Knowledge Evolution collection should continue. More commit history will improve future analysis.";
    }

    return "Continue collecting evolution data and compare future compiled contexts against this baseline.";

}

function renderKnowledgeEvolution(evolution) {

    return [
        "🧬 DevOS Knowledge Evolution",
        "============================",
        "",
        "## Overview",
        "",
        `Tracked Features: ${evolution.overview.trackedFeatures}`,
        "",
        `Gameplay Features: ${evolution.overview.gameplayFeatures}`,
        "",
        `Tooling Features: ${evolution.overview.toolingFeatures}`,
        "",
        `Tracked Commits: ${evolution.overview.trackedCommits}`,
        "",
        `Tracked Milestones: ${evolution.overview.trackedMilestones}`,
        "",
        `Snapshots: ${evolution.overview.snapshots}`,
        "",
        `History Depth: ${evolution.overview.historyDepth}`,
        "",
        "## Recent Milestones",
        "",
        ...renderMilestoneLines(evolution.recentMilestones),
        "",
        "## Changes Since Last Snapshot",
        "",
        ...renderSnapshotChangeLines(evolution.changesSinceLastSnapshot),
        "",
        "## Structural Growth",
        "",
        ...renderStructuralGrowthLines(evolution.structuralGrowth),
        "",
        "## Feature Activity",
        "",
        ...evolution.featureActivity.flatMap(item => [
            item.feature,
            "",
            item.level,
            "",
            `Type: ${item.type}`,
            "",
            `Commits: ${item.commitCount}`,
            "",
            `Context Updated: ${item.contextUpdated ? "Yes" : "No"}`,
            ""
        ]),
        "## Feature Growth Status",
        "",
        ...renderGrowingFeatureLines(evolution.growingFeatures),
        "",
        "## Stable Features",
        "",
        ...renderStableFeatureLines(evolution.stableFeatures),
        "",
        "## Project Trend",
        "",
        "Current Focus",
        "",
        ...formatList(evolution.projectTrend.currentFocus, "Unknown"),
        "",
        "## Risk Trend",
        "",
        ...renderRiskTrendLines(evolution.riskTrend),
        "",
        "## Risk Changes",
        "",
        ...renderRiskChangeLines(evolution.riskChanges),
        "",
        "## Suggested Next Step",
        "",
        evolution.suggestedNextStep,
        "",
        "## Rule",
        "",
        evolution.rule
    ].join("\n");

}

function renderSnapshotChangeLines(changes) {

    if (!changes || changes.length === 0) {
        return ["Not enough snapshots for comparison."];
    }

    return changes.flatMap(change => {
        if (change.status === "No structural changes") {
            return [
                change.feature,
                "",
                "No structural changes.",
                ""
            ];
        }

        return [
            change.feature,
            "",
            `Methods: ${formatDelta(change.deltas.methods)}`,
            "",
            `Public APIs: ${formatDelta(change.deltas.publicApis)}`,
            "",
            `Dependencies: ${formatDelta(change.deltas.dependencies)}`,
            "",
            `Risk: ${change.riskChange || "No change"}`,
            ""
        ];
    });

}

function renderStructuralGrowthLines(items) {

    if (!items || items.length === 0) {
        return ["No structural growth since last snapshot."];
    }

    return items.flatMap(item => [
        item.feature,
        "",
        ...formatList(buildGrowthReasons(item), "No structural growth"),
        ""
    ]);

}

function renderRiskChangeLines(items) {

    if (!items || items.length === 0) {
        return ["No significant structural change."];
    }

    return items.flatMap(item => [
        item.feature,
        "",
        `Risk: ${item.riskChange}`,
        ""
    ]);

}

function formatDelta(value) {

    if (typeof value !== "number") {
        return "0";
    }

    if (value > 0) {
        return `+${value}`;
    }

    return `${value}`;

}

function renderMilestoneLines(milestones) {

    if (milestones.length === 0) {
        return ["Limited history."];
    }

    return milestones.flatMap((milestone, index) => {
        const lines = [
            milestone.message,
            "",
            `Commit: ${milestone.commit}`
        ];

        if (index < milestones.length - 1) {
            lines.push("", "↓");
        }

        return lines.concat("");
    });

}

function renderGrowingFeatureLines(items) {

    if (items.length === 0) {
        return ["Unknown"];
    }

    return items.flatMap(item => [
        item.feature,
        "",
        item.status,
        "",
        `Type: ${item.type}`,
        "",
        "Reason:",
        "",
        ...formatList(item.reasons, "Unknown"),
        ""
    ]);

}

function renderStableFeatureLines(items) {

    if (items.length === 0) {
        return ["Unknown"];
    }

    return items.flatMap(item => [
        item.feature,
        "",
        item.status,
        "",
        `Type: ${item.type}`,
        "",
        `Reason: ${item.reason}`,
        ""
    ]);

}

function renderRiskTrendLines(items) {

    if (items.length === 0) {
        return ["Unknown"];
    }

    return items.flatMap(item => [
        item.feature,
        "",
        item.riskLevel,
        "",
        item.monitoring,
        ""
    ]);

}

function indexByFeature(items) {

    return items.reduce((index, item) => {
        index[item.feature] = item;
        return index;
    }, {});

}

function loadArchitecture() {

    const architecturePath = path.join(STORAGE, "architecture.json");

    if (!fs.existsSync(architecturePath)) {
        return {
            nodes: [],
            edges: [],
            risks: []
        };
    }

    return JSON.parse(fs.readFileSync(architecturePath, "utf-8"));

}

module.exports = {
    compileFeature,
    showCompiledFeature,
    showDependencyDetails,
    showArchitecture,
    showArchitectureIntelligence,
    showSummary,
    showContextQuality,
    exportCompiledFeature,
    exportAllCompiledFeatures,
    buildProjectBootstrap,
    showProjectBootstrap,
    buildKnowledgeEvolution,
    showKnowledgeEvolution
};
