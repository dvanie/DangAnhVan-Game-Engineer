const PROTECTED_SYSTEMS = [
    "Runtime",
    "Army",
    "Summon",
    "Collection",
    "GameManager",
    "Unity Scene",
    "Project Settings",
    "Package Manifest / Lock"
];

const HIGH_IMPACT_SYSTEMS = new Set(["Runtime", "Army", "Summon"]);
const MEDIUM_IMPACT_SYSTEMS = new Set(["Collection", "GameManager"]);
const GAMEPLAY_TOUCH_SYSTEMS = new Set(["Player", "Enemy", "Soul"]);

function buildRiskProfile(contextObject) {

    const contexts = contextObject.contexts || [];
    const contextByFeature = indexByFeature(contexts);
    const relevantItems = contextObject.relevantFeatures || [];
    const relevantFeatures = relevantItems
        .map(item => item.feature)
        .filter(Boolean);
    const touches = buildTouches(relevantItems, contextByFeature);
    const reasons = [];
    let score = Math.max(0, relevantFeatures.length - 1);

    if (relevantFeatures.length > 1) {
        reasons.push("Multiple relevant features");
    }

    relevantFeatures.forEach(feature => {
        const context = contextByFeature[feature] || {};
        const integrationPoints = context.integrationPoints || [];
        const architecture = context.architecture || {};
        const files = unique([
            ...(context.ownedFiles || []),
            ...integrationPoints.flatMap(point => typeof point === "string" ? [] : point.files || []),
            ...(context.files || [])
        ]);

        if (integrationPoints.length > 0) {
            score += 1;
            addReason(reasons, "Feature has integration points");
        }

        if (isArchitectureRisky(architecture)) {
            score += 2;
            addReason(reasons, "Architecture metadata marks feature risky");
        }

        if (files.some(isUnityFile)) {
            score += 1;
            addReason(reasons, "Likely files include Unity project assets");
        }
    });

    if (touches.some(feature => GAMEPLAY_TOUCH_SYSTEMS.has(feature))) {
        score += 1;
        reasons.push("Touches Player / Enemy / Soul");
    }

    touches.forEach(feature => {
        if (MEDIUM_IMPACT_SYSTEMS.has(feature)) {
            score += 2;
            addReason(reasons, `Touches ${feature}`);
        }

        if (HIGH_IMPACT_SYSTEMS.has(feature)) {
            score += 3;
            addReason(reasons, `Touches ${feature}`);
        }
    });

    const level = riskLevel(score);

    return {
        level,
        score,
        reasons,
        touches,
        avoid: buildAvoid(touches),
        recommendedVerification: recommendedVerification(level),
        scopeReminder: buildScopeReminder(level)
    };

}

function buildTouches(relevantItems, contextByFeature) {

    const touches = [];
    const relevantFeatures = relevantItems
        .map(item => item.feature)
        .filter(Boolean);

    relevantFeatures.forEach(feature => add(touches, feature));

    relevantItems.forEach(item => {
        const context = contextByFeature[item.feature] || {};

        ((context.integrationPoints || [])).forEach(point => {
            if (typeof point !== "string") {
                add(touches, point.feature);
            }
        });

        if ((item.directScore || 0) > 0) {
            ((context.dependencies || {}).dependsOn || []).forEach(dependency => {
                add(touches, dependency);
            });
        }
    });

    return touches;

}

function buildAvoid(touches) {

    const touched = new Set(touches.map(item => item.toLowerCase()));

    return PROTECTED_SYSTEMS.filter(system =>
        !touched.has(system.toLowerCase())
    );

}

function recommendedVerification(level) {

    if (level === "High") {
        return [
            "node devos compile --all",
            "node devos architecture summary",
            "git diff --check",
            "node devos review --diff",
            "Unity Play Mode manual test"
        ];
    }

    if (level === "Medium") {
        return [
            "node devos compile --all",
            "git diff --check",
            "node devos review --diff",
            "Unity Play Mode manual test"
        ];
    }

    return [
        "git diff --check",
        "node devos review --diff",
        "Unity Play Mode manual test if gameplay-visible"
    ];

}

function buildScopeReminder(level) {

    if (level === "High") {
        return "High-risk task. Confirm scope before coding and avoid unrelated systems.";
    }

    if (level === "Medium") {
        return "Medium-risk task. Keep changes feature-local and verify affected integrations.";
    }

    return "Low-risk task. Keep the change localized.";

}

function riskLevel(score) {

    if (score >= 6) return "High";
    if (score >= 3) return "Medium";
    return "Low";

}

function isArchitectureRisky(architecture) {

    const intelligence = architecture.intelligence || {};
    const risk = String(architecture.riskLevel || "").toLowerCase();
    const hotspot = String(intelligence.hotspotLevel || "").toLowerCase();

    return risk === "high" || hotspot === "high";

}

function isUnityFile(file) {

    return /\.unity$/i.test(file) ||
        /\.prefab$/i.test(file) ||
        /\.asset$/i.test(file) ||
        /^ProjectSettings\//i.test(file) ||
        /^Packages\//i.test(file);

}

function indexByFeature(items) {

    return items.reduce((index, item) => {
        index[item.feature] = item;
        return index;
    }, {});

}

function add(items, item) {

    if (item && !items.includes(item)) {
        items.push(item);
    }

}

function addReason(reasons, reason) {

    if (!reasons.includes(reason)) {
        reasons.push(reason);
    }

}

function unique(items) {

    return [...new Set(items.filter(Boolean))];

}

module.exports = {
    buildRiskProfile
};
