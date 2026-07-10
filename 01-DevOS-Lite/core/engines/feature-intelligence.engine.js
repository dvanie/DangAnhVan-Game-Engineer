const recipeEngine = require("./recipe.engine");
const riskEngine = require("./risk.engine");

function buildFeatureProfiles(contextObject) {

    const contexts = contextObject.contexts || [];
    const contextByFeature = indexByFeature(contexts);

    return (contextObject.relevantFeatures || [])
        .map(item => contextByFeature[item.feature])
        .filter(Boolean)
        .map(context => buildFeatureProfile(context, contextObject));

}

function buildFeatureProfile(featureContext, contextObject = {}) {

    const feature = featureContext.feature || "Unknown";
    const recipe = recipeEngine.buildRecipe(contextObject);
    const riskProfile = riskEngine.buildRiskProfile(contextObject);
    const integrationPoints = featureContext.integrationPoints || [];
    const ownedFiles = (featureContext.ownedFiles || []).filter(file => !/\.meta$/i.test(file));
    const touches = buildTouches(feature, integrationPoints, riskProfile);

    return {
        feature,
        purpose: buildPurpose(featureContext),
        ownedFiles,
        integrationPoints,
        touches,
        doesNotOwn: buildDoesNotOwn(touches, riskProfile),
        risk: buildFeatureRisk(feature, riskProfile, featureContext),
        recommendedEntry: buildRecommendedEntry(feature, ownedFiles, recipe),
        summary: featureContext.summary || {}
    };

}

function buildPurpose(featureContext) {

    const summary = featureContext.summary || {};

    return summary.mainPurpose ||
        summary.shortDescription ||
        summary.responsibility ||
        "Unknown";

}

function buildTouches(feature, integrationPoints, riskProfile) {

    const touched = [feature];

    integrationPoints.forEach(point => {
        if (typeof point === "string") {
            add(touched, point);
        }
        else {
            add(touched, point.feature);
        }
    });

    (riskProfile.touches || []).forEach(item => {
        if (item === feature || integrationPoints.some(point => pointFeature(point) === item)) {
            add(touched, item);
        }
    });

    return touched;

}

function buildDoesNotOwn(touches, riskProfile) {

    const touched = new Set(touches.map(item => String(item).toLowerCase()));

    return (riskProfile.avoid || [])
        .filter(item => !touched.has(String(item).toLowerCase()));

}

function buildFeatureRisk(feature, riskProfile, featureContext) {

    const architecture = featureContext.architecture || {};

    return {
        level: architecture.riskLevel || riskProfile.level || "Low",
        hotspot: ((architecture.intelligence || {}).hotspotLevel) || "Unknown",
        profileLevel: riskProfile.level || "Low",
        reasons: riskProfile.reasons || []
    };

}

function buildRecommendedEntry(feature, ownedFiles, recipe) {

    if (ownedFiles.length > 0) {
        return unique([
            `${feature}.context.json`,
            ...ownedFiles
        ]);
    }

    return unique([
        `${feature}.context.json`,
        ...(recipe.read || [])
    ]);

}

function pointFeature(point) {

    return typeof point === "string"
        ? point
        : point.feature;

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

function unique(items) {

    return [...new Set(items.filter(Boolean))];

}

module.exports = {
    buildFeatureProfile,
    buildFeatureProfiles
};
