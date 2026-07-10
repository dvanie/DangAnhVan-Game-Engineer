const fs = require("fs");
const path = require("path");

const { STORAGE } = require("../../config/paths");
const ownedFilesModel = require("../models/owned-files.model");

const STOP_WORDS = new Set([
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from",
    "how", "in", "into", "is", "of", "on", "or", "the", "to", "with"
]);
const MIN_RELEVANCE_SCORE = 24;
const MIN_GRAPH_ONLY_SCORE = 18;
const MAX_RELEVANT_FEATURES = 3;
const SECTION_POLICY = {
    Summary: { cost: 1, priority: 100, budgets: ["small", "medium", "full"] },
    Responsibility: { cost: 1, priority: 95, budgets: ["small", "medium", "full"] },
    Dependencies: { cost: 2, priority: 90, budgets: ["small", "medium", "full"] },
    "Incoming Dependencies": { cost: 2, priority: 85, budgets: ["small", "medium", "full"] },
    Architecture: { cost: 4, priority: 80, budgets: ["small", "medium", "full"] },
    "Public APIs": { cost: 5, priority: 70, budgets: ["medium", "full"] },
    "Known References": { cost: 4, priority: 60, budgets: ["medium", "full"] },
    Decisions: { cost: 4, priority: 55, budgets: ["medium", "full"] },
    Methods: { cost: 10, priority: 50, budgets: ["medium", "full"] },
    Files: { cost: 8, priority: 45, budgets: ["full"] },
    "Context Quality": { cost: 2, priority: 20, budgets: ["full"] },
    "AI Hint": { cost: 2, priority: 15, budgets: ["full"] }
};
const COMPRESSION_LIMITS = {
    small: { Methods: 0, Files: 0, "Public APIs": 0, "Known References": 0 },
    medium: { Methods: 5, Files: 0, "Public APIs": 8, "Known References": 5 },
    full: { Methods: Infinity, Files: Infinity, "Public APIs": Infinity, "Known References": Infinity }
};

function buildContextObject(rawQuery, budget) {

    const contexts = loadCompiledContexts();

    if (contexts.length === 0) {
        return {
            contexts: [],
            query: rawQuery,
            budget,
            relevantFeatures: [],
            readingOrder: [],
            retrievedSections: [],
            assembledContext: [],
            includedSections: 0,
            omittedSections: 0,
            estimatedCost: 0,
            compressionApplied: false,
            confidence: "Low"
        };
    }

    const architecture = loadArchitecture();
    const tokens = normalizeQuery(rawQuery);
    const directScores = scoreCandidateFeatures(rawQuery, tokens, contexts);
    const expandedScores = expandThroughRelationships(directScores, contexts, architecture);
    const ranked = rankRelevantFeatures(expandedScores);
    const readingOrder = buildReadingOrder(ranked, contexts);
    const retrievalPlan = buildKnowledgeRetrieval(rawQuery, tokens, ranked, contexts);
    const optimizedPlan = optimizeRetrievalPlan(retrievalPlan, budget);
    const summary = buildOptimizedPlanSummary(optimizedPlan);
    const confidence = buildConfidence(ranked, tokens);

    return {
        query: rawQuery,
        budget,
        contexts,
        relevantFeatures: ranked,
        readingOrder,
        retrievedSections: retrievalPlan,
        optimizedPlan,
        assembledContext: buildAssembledContextData(rawQuery, ranked, optimizedPlan, contexts, budget),
        includedSections: summary.includedCount,
        omittedSections: summary.omittedCount,
        estimatedCost: summary.estimatedCost,
        compressionApplied: summary.compressionApplied,
        confidence
    };

}

function normalizeQuery(query) {

    return unique(
        query
            .toLowerCase()
            .split(/[^a-z0-9_]+/)
            .map(token => token.trim())
            .filter(token => token.length >= 2)
            .filter(token => !STOP_WORDS.has(token))
    );

}

function scoreCandidateFeatures(rawQuery, tokens, contexts) {

    const normalizedQuery = rawQuery.toLowerCase();

    return contexts.map(context => {
        const featureName = context.feature || "";
        const summary = context.summary || {};
        const insight = context.insight || {};
        const dependencies = context.dependencies || {};
        const architecture = context.architecture || {};
        const reasons = [];
        let directScore = 0;
        let relationshipScore = 0;

        if (featureName.toLowerCase() === normalizedQuery) {
            directScore += 100;
            reasons.push("Direct feature match");
        }

        if (tokens.includes(featureName.toLowerCase())) {
            directScore += 70;
            reasons.push("Direct keyword match");
        }

        const summaryText = [
            summary.shortDescription,
            summary.responsibility,
            summary.mainPurpose,
            summary.riskSummary,
            summary.aiHint
        ].filter(Boolean).join(" ");
        const summaryHits = countTokenHits(tokens, summaryText);

        if (summaryHits > 0) {
            directScore += summaryHits * 22;
            reasons.push("Summary matches query");
        }

        const apiHits = countTokenHits(tokens, (insight.publicAPIs || []).join(" "));

        if (apiHits > 0) {
            directScore += apiHits * 20;
            reasons.push("Public API match");
        }

        const referenceText = (insight.knownReferences || [])
            .map(reference => `${reference.className} ${reference.feature}`)
            .join(" ");
        const referenceHits = countTokenHits(tokens, referenceText);

        if (referenceHits > 0) {
            directScore += referenceHits * 10;
            reasons.push("Known reference match");
        }

        const dependencyHits = countTokenHits(tokens, (dependencies.dependsOn || []).join(" "));

        if (dependencyHits > 0) {
            relationshipScore += dependencyHits * 8;
            reasons.push("Dependency name match");
        }

        const architectureHits = countTokenHits(
            tokens,
            [
                ...(architecture.outgoing || []).map(edge => edge.to),
                ...(architecture.incoming || []).map(edge => edge.from)
            ].join(" ")
        );

        if (architectureHits > 0) {
            relationshipScore += architectureHits * 5;
            reasons.push("Architecture relation match");
        }

        return {
            feature: featureName,
            score: directScore + relationshipScore,
            directScore,
            relationshipScore,
            reasons,
            nameMatch: featureName.toLowerCase() === normalizedQuery ||
                tokens.includes(featureName.toLowerCase()),
            direct: directScore >= 20
        };
    });

}

function expandThroughRelationships(scored, contexts, architecture) {

    const scoreByFeature = indexScores(scored);
    const contextByFeature = indexByFeature(contexts);

    scored
        .filter(item => item.directScore >= MIN_RELEVANCE_SCORE)
        .forEach(item => {
            const context = contextByFeature[item.feature] || {};

            ((context.dependencies || {}).dependsOn || []).forEach(dependency => {
                addRelationshipScore(scoreByFeature, dependency, 10, `Referenced by ${item.feature}`);
            });

            ((context.architecture || {}).outgoing || []).forEach(edge => {
                addRelationshipScore(scoreByFeature, edge.to, 8, `Connected to ${item.feature}`);
            });

            ((context.architecture || {}).incoming || []).forEach(edge => {
                addRelationshipScore(scoreByFeature, edge.from, 6, `Used by ${item.feature}`);
            });
        });

    (architecture.edges || []).forEach(edge => {
        const from = scoreByFeature[edge.from];
        const to = scoreByFeature[edge.to];

        if (from && from.directScore >= MIN_RELEVANCE_SCORE) {
            addRelationshipScore(scoreByFeature, edge.to, 5, `Connected to ${edge.from}`);
        }

        if (to && to.directScore >= MIN_RELEVANCE_SCORE) {
            addRelationshipScore(scoreByFeature, edge.from, 5, `Connected to ${edge.to}`);
        }
    });

    return Object.values(scoreByFeature);

}

function addRelationshipScore(scoreByFeature, feature, score, reason) {

    if (!scoreByFeature[feature]) return;

    scoreByFeature[feature].relationshipScore += score;
    scoreByFeature[feature].score += score;

    if (!scoreByFeature[feature].reasons.includes(reason)) {
        scoreByFeature[feature].reasons.push(reason);
    }

}

function rankRelevantFeatures(scores) {

    return scores
        .filter(isRelevantScore)
        .sort((a, b) => {
            if (b.directScore !== a.directScore) return b.directScore - a.directScore;
            if (b.score !== a.score) return b.score - a.score;
            return a.feature.localeCompare(b.feature);
        })
        .slice(0, MAX_RELEVANT_FEATURES)
        .map(item => ({
            ...item,
            reasons: simplifyReasons(item.reasons)
        }));

}

function isRelevantScore(item) {

    if (item.directScore >= MIN_RELEVANCE_SCORE) return true;
    return item.score >= MIN_GRAPH_ONLY_SCORE && item.relationshipScore >= MIN_GRAPH_ONLY_SCORE;

}

function buildKnowledgeRetrieval(query, tokens, ranked, contexts) {

    const contextByFeature = indexByFeature(contexts);

    return ranked.map((item, index) => {
        const context = contextByFeature[item.feature] || {};
        const sections = buildRetrievedSections(query, tokens, item, context, index);
        const retrieved = sections.filter(section => section.selected);
        const skipped = sections.filter(section => !section.selected);

        return {
            feature: item.feature,
            retrieved,
            skipped,
            reason: buildRetrievalSummary(query, item, retrieved)
        };
    });

}

function buildRetrievedSections(query, tokens, item, context, index) {

    const insight = context.insight || {};
    const dependencies = (context.dependencies && context.dependencies.dependsOn) || [];
    const architecture = context.architecture || {};
    const hasMethods = (insight.methodCount || 0) > 0;
    const hasFiles = (context.files || []).length > 0;
    const hasPublicApis = (insight.publicAPIs || []).length > 0;
    const hasKnownReferences = (insight.knownReferences || []).length > 0;
    const isPrimary = index === 0;
    const isCoordinator = isCoordinatorFeature(context);
    const structuralFlowQuery = hasAnyToken(tokens, ["flow", "summon", "combat"]);
    const primaryFeature = isPrimary && item.nameMatch;

    return [
        section("Summary", true, "Every retrieved feature needs its semantic summary."),
        section("Responsibility", primaryFeature && structuralFlowQuery, "Flow query benefits from the primary feature responsibility boundary."),
        section("Dependencies", dependencies.length > 0, "Dependency links explain how this feature relates to the selected context."),
        section("Public APIs", hasPublicApis && primaryFeature, "Direct feature match makes public APIs useful."),
        section("Files", hasFiles && primaryFeature, "Direct feature match makes file ownership useful."),
        section("Methods", hasMethods && structuralFlowQuery && (isPrimary || isCoordinator), "Flow-oriented query benefits from method-level compiled metadata."),
        section("Architecture", structuralFlowQuery && isCoordinator, "Coordinator feature needs architecture context for this query."),
        section("Known References", hasKnownReferences && hasReason(item, "Known reference") && wantsReferences(tokens), "Known references directly matched the query."),
        section("Context Quality", false, "Quality score is not needed for feature retrieval."),
        section("AI Hint", false, "AI guidance is not needed for deterministic knowledge retrieval."),
        section("Decisions", false, "Design decisions are not directly requested by this query.")
    ];

}

function section(name, selected, reason) {

    return {
        name,
        selected,
        reason
    };

}

function buildRetrievalSummary(query, item, retrieved) {

    const names = retrieved.map(section => section.name);

    if (names.includes("Dependencies") && names.includes("Public APIs")) {
        return `Query "${query}" is best answered with feature summary, dependency links, and API surface for ${item.feature}.`;
    }

    if (names.includes("Architecture")) {
        return `Query "${query}" touches coordination, so architecture and dependency metadata are useful for ${item.feature}.`;
    }

    return `Query "${query}" has limited direct evidence for ${item.feature}, so only focused compiled metadata is retrieved.`;

}

function optimizeRetrievalPlan(retrievalPlan, budget) {

    return retrievalPlan.map(plan => {
        const included = [];
        const omitted = [];
        let estimatedCost = 0;

        plan.retrieved.forEach(section => {
            const policy = SECTION_POLICY[section.name] || {
                cost: 5,
                priority: 50,
                budgets: ["full"]
            };

            if (policy.budgets.includes(budget)) {
                included.push({
                    ...section,
                    cost: policy.cost,
                    priority: policy.priority
                });
                estimatedCost += policy.cost;
            }
            else {
                omitted.push({
                    ...section,
                    reason: `${section.name} omitted by ${budget} budget.`
                });
            }
        });

        return {
            ...plan,
            included,
            omitted,
            estimatedCost,
            compressionApplied: budget !== "full" &&
                included.some(section => hasCompressionLimit(section.name, budget))
        };
    });

}

function hasCompressionLimit(sectionName, budget) {

    const limit = (COMPRESSION_LIMITS[budget] || {})[sectionName];

    return typeof limit === "number" && Number.isFinite(limit);

}

function buildOptimizedPlanSummary(optimizedPlan) {

    return {
        includedCount: optimizedPlan.reduce((total, plan) =>
            total + plan.included.length
        , 0),
        omittedCount: optimizedPlan.reduce((total, plan) =>
            total + plan.omitted.length
        , 0),
        estimatedCost: optimizedPlan.reduce((total, plan) =>
            total + plan.estimatedCost
        , 0),
        compressionApplied: optimizedPlan.some(plan =>
            plan.compressionApplied || plan.omitted.length > 0
        )
    };

}

function buildAssembledContextData(query, ranked, optimizedPlan, contexts, budget) {

    const contextByFeature = indexByFeature(contexts);

    return optimizedPlan.map(plan => {
        const context = contextByFeature[plan.feature] || {};

        return {
            query,
            budget,
            feature: plan.feature,
            rank: ranked.findIndex(item => item.feature === plan.feature) + 1,
            includedSections: orderedSections(plan.included).map(section => section.name),
            omittedSections: plan.omitted.map(section => section.name),
            estimatedCost: plan.estimatedCost,
            compressionApplied: plan.compressionApplied,
            context
        };
    });

}

function orderedSections(sections) {

    const order = [
        "Summary",
        "Responsibility",
        "Dependencies",
        "Incoming Dependencies",
        "Public APIs",
        "Architecture",
        "Files",
        "Methods",
        "Known References",
        "Decisions",
        "Context Quality",
        "AI Hint"
    ];

    return [...sections].sort((a, b) =>
        order.indexOf(a.name) - order.indexOf(b.name)
    );

}

function buildConfidence(ranked, tokens) {

    if (ranked.length === 0 || tokens.length === 0) {
        return "Low";
    }

    const top = ranked[0];
    const second = ranked[1];
    const directMatches = ranked.filter(item => item.directScore >= MIN_RELEVANCE_SCORE).length;
    const graphOnly = ranked.filter(item => item.directScore === 0).length;
    const gap = second ? top.score - second.score : top.score;

    if (top.directScore >= 70 && gap >= 20 && graphOnly <= 1) {
        return "High";
    }

    if (top.score >= MIN_RELEVANCE_SCORE && directMatches > 0) {
        return "Medium";
    }

    return "Low";

}

function buildReadingOrder(ranked, contexts) {

    const contextByFeature = indexByFeature(contexts);

    return [...ranked].sort((a, b) => {
        const aRole = readingRoleScore(a, contextByFeature[a.feature]);
        const bRole = readingRoleScore(b, contextByFeature[b.feature]);

        if (bRole !== aRole) return bRole - aRole;
        if (b.directScore !== a.directScore) return b.directScore - a.directScore;
        if (b.score !== a.score) return b.score - a.score;
        return a.feature.localeCompare(b.feature);
    });

}

function readingRoleScore(item, context) {

    if (item.directScore >= 70) return 4;

    const architecture = (context && context.architecture) || {};
    const outgoing = (architecture.outgoing || []).length;
    const incoming = (architecture.incoming || []).length;

    if (outgoing >= 3 || (outgoing >= 2 && incoming >= 2)) return 3;
    if (item.directScore >= MIN_RELEVANCE_SCORE) return 2;
    return 1;

}

function isCoordinatorFeature(context) {

    const architecture = (context && context.architecture) || {};
    const outgoing = (architecture.outgoing || []).length;

    return outgoing >= 3;

}

function hasAnyToken(tokens, candidates) {

    return candidates.some(candidate => tokens.includes(candidate));

}

function hasReason(item, text) {

    return (item.reasons || []).some(reason => reason.includes(text));

}

function wantsReferences(tokens) {

    return hasAnyToken(tokens, ["reference", "references", "usage", "serialization", "serialized"]);

}

function simplifyReasons(reasons) {

    const groups = [
        ["Direct feature match"],
        ["Direct keyword match"],
        ["Summary matches query"],
        ["Public API match"],
        ["Known reference match"],
        ["Dependency name match"],
        ["Architecture relation match"],
        ["Used by"],
        ["References"],
        ["Connected to"]
    ];
    const simplified = [];

    groups.forEach(group => {
        const match = reasons.find(reason =>
            group.some(prefix => reason.startsWith(prefix))
        );

        if (match && !simplified.includes(match)) {
            simplified.push(match);
        }
    });

    reasons.forEach(reason => {
        if (!simplified.includes(reason)) {
            simplified.push(reason);
        }
    });

    return simplified;

}

function countTokenHits(tokens, text) {

    const normalized = normalizeText(text);

    return tokens.filter(token => normalized.includes(token)).length;

}

function normalizeText(text) {

    return String(text || "")
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .toLowerCase();

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
        .map(context => ownedFilesModel.attachFeatureIntelligence(context))
        .sort((a, b) => a.feature.localeCompare(b.feature));

}

function loadArchitecture() {

    const architecturePath = path.join(STORAGE, "architecture.json");

    if (!fs.existsSync(architecturePath)) {
        return {
            edges: []
        };
    }

    return JSON.parse(fs.readFileSync(architecturePath, "utf-8"));

}

function indexScores(scores) {

    return scores.reduce((index, item) => {
        index[item.feature] = item;
        return index;
    }, {});

}

function indexByFeature(items) {

    return items.reduce((index, item) => {
        index[item.feature] = item;
        return index;
    }, {});

}

function unique(items) {

    return [...new Set(items.filter(Boolean))];

}

module.exports = {
    buildContextObject,
    normalizeQuery,
    orderedSections
};
