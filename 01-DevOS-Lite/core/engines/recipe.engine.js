const riskEngine = require("./risk.engine");

function buildRecipe(contextObject) {

    const relevantFeatures = contextObject.relevantFeatures || [];
    const readingOrder = contextObject.readingOrder || [];
    const contexts = contextObject.contexts || [];
    const contextByFeature = indexByFeature(contexts);
    const selectedFeatureNames = relevantFeatures.map(item => item.feature);
    const likelyFiles = buildLikelyFiles(selectedFeatureNames, contextByFeature);
    const riskProfile = riskEngine.buildRiskProfile(contextObject);

    return {
        read: buildReadList(readingOrder),
        likelyFiles,
        integrationPoints: buildIntegrationPoints(selectedFeatureNames, contextByFeature),
        avoid: riskProfile.avoid,
        verify: riskProfile.recommendedVerification,
        estimatedScope: estimateScope(selectedFeatureNames, contextByFeature)
    };

}

function buildReadList(readingOrder) {

    return unique(readingOrder
        .map(item => item.feature)
        .filter(Boolean)
        .map(feature => `${feature}.context.json`));

}

function buildLikelyFiles(featureNames, contextByFeature) {

    const ownedFiles = featureNames.flatMap(feature => {
        const context = contextByFeature[feature] || {};

        return context.ownedFiles || [];
    });
    const contextFiles = featureNames.flatMap(feature => {
        const context = contextByFeature[feature] || {};

        return context.files || [];
    });
    const integrationFiles = featureNames.flatMap(feature => {
        const context = contextByFeature[feature] || {};

        return (context.integrationPoints || [])
            .flatMap(point => typeof point === "string" ? [] : point.files || []);
    });

    return unique([
        ...ownedFiles,
        ...integrationFiles,
        ...contextFiles
    ].filter(file => !/\.meta$/i.test(file)))
        .filter((file, index, files) => !isCoveredByFolder(file, index, files));

}

function buildIntegrationPoints(featureNames, contextByFeature) {

    return featureNames.map(feature => {
        const context = contextByFeature[feature] || {};

        return {
            feature,
            points: context.integrationPoints || []
        };
    });

}

function isCoveredByFolder(file, index, files) {

    if (file.endsWith("/")) {
        return false;
    }

    return files
        .slice(0, index)
        .some(candidate => candidate.endsWith("/") && file.startsWith(candidate));

}

function estimateScope(featureNames, contextByFeature) {

    const featureCount = featureNames.length;
    const dependencyCount = featureNames.reduce((total, feature) => {
        const context = contextByFeature[feature] || {};
        const dependencies = (context.dependencies || {}).dependsOn || [];
        const outgoing = ((context.architecture || {}).outgoing || []).length;
        const incoming = ((context.architecture || {}).incoming || []).length;

        return total + dependencies.length + outgoing + incoming;
    }, 0);
    const hasHighRisk = featureNames.some(feature => {
        const context = contextByFeature[feature] || {};
        const risk = String((context.architecture || {}).riskLevel || "").toLowerCase();
        const hotspot = String((((context.architecture || {}).intelligence || {}).hotspotLevel) || "").toLowerCase();

        return risk === "high" || hotspot === "high";
    });

    if (featureCount >= 3 || dependencyCount >= 10 || hasHighRisk) {
        return "Large";
    }

    if (featureCount >= 2 || dependencyCount >= 4) {
        return "Medium";
    }

    return "Small";

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
    buildRecipe
};
