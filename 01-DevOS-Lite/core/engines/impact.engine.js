const contextPipeline = require("../pipelines/context.pipeline");
const recipeEngine = require("./recipe.engine");
const riskEngine = require("./risk.engine");
const featureIntelligence = require("./feature-intelligence.engine");

const DEFAULT_BUDGET = "medium";

function showImpact(args) {

    const query = parseImpactInput(args);

    if (!query) {
        console.log("Usage:");
        console.log('node devos impact "tutorial"');
        console.log('node devos impact "summon runtime"');
        return;
    }

    const impact = buildImpact(query);

    printImpact(impact);

}

function buildImpact(query) {

    const contextObject = contextPipeline.buildContextObject(query, DEFAULT_BUDGET);
    const recipe = recipeEngine.buildRecipe(contextObject);
    const riskProfile = riskEngine.buildRiskProfile(contextObject);
    const relevantFeatures = contextObject.relevantFeatures || [];
    const contextByFeature = indexByFeature(contextObject.contexts || []);
    const likelyImpact = buildLikelyImpact(relevantFeatures, contextByFeature);
    const featureProfiles = featureIntelligence.buildFeatureProfiles(contextObject);

    return {
        query,
        relevantFeatures: relevantFeatures.map(item => item.feature),
        likelyImpact,
        readFirst: buildReadFirst(recipe.read, likelyImpact, featureProfiles),
        ownedFiles: buildOwnedFiles(featureProfiles),
        featureProfiles,
        riskProfile,
        hasStrongMatch: relevantFeatures.length > 0
    };

}

function buildLikelyImpact(relevantFeatures, contextByFeature) {

    const impacts = [];

    relevantFeatures.forEach(item => {
        const context = contextByFeature[item.feature] || {};
        const integrationPoints = context.integrationPoints || [];

        integrationPoints.forEach(point => {
            if (typeof point === "string") {
                addImpact(impacts, item.feature, point);
            }
            else {
                addImpact(impacts, point.feature, point.reason);
            }
        });
    });

    if (impacts.length > 0) {
        return impacts;
    }

    relevantFeatures.forEach(item => {
        const context = contextByFeature[item.feature] || {};
        const dependencies = (context.dependencies || {}).dependsOn || [];

        dependencies.forEach(dependency => {
            addImpact(impacts, dependency, `Dependency of ${item.feature}`);
        });
    });

    return impacts;

}

function buildReadFirst(readList, likelyImpact, featureProfiles) {

    const impactContexts = likelyImpact
        .map(item => item.feature)
        .filter(Boolean)
        .map(feature => `${feature}.context.json`);
    const profileEntries = featureProfiles
        .flatMap(profile => profile.recommendedEntry || []);

    return unique([
        ...profileEntries,
        ...(readList || []),
        ...impactContexts
    ]);

}

function buildOwnedFiles(featureProfiles) {

    return featureProfiles.map(profile => ({
        feature: profile.feature,
        files: profile.ownedFiles || []
    }));

}

function printImpact(impact) {

    console.log("DevOS Impact Analysis");
    console.log("=====================");

    console.log("\nQuery:");
    console.log(impact.query);

    if (!impact.hasStrongMatch) {
        console.log("\nNo strong feature match found.");
        console.log("\nSuggested:");
        console.log(`- node devos ask "${impact.query}"`);
        console.log("- refine query with a known feature name");
        return;
    }

    console.log("\nRelevant Features:");
    printList(impact.relevantFeatures, "None");

    console.log("\nLikely Impact:");
    printImpacts(impact.likelyImpact);

    console.log("\nRead First:");
    printList(impact.readFirst, "Unknown");

    console.log("\nOwned Files:");
    printOwnedFiles(impact.ownedFiles);

    printRiskProfile(impact.riskProfile);

    if (impact.riskProfile.level === "High") {
        console.log("\nScope Warning:");
        console.log(impact.riskProfile.scopeReminder);
    }

    console.log("\nRule:");
    console.log("Impact inferred from compiled feature facts, integration points, recipe, and risk profile.");
    console.log("No AI.");
    console.log("No source scanning.");
    console.log("No compile.");

}

function printRiskProfile(profile) {

    console.log("\nRisk Profile:");
    console.log(`Level: ${profile.level || "Low"}`);

    console.log("\nTouches:");
    printList(profile.touches, "None");

    console.log("\nAvoid Touching:");
    printList(profile.avoid, "None");

    console.log("\nRecommended Verification:");
    printList(profile.recommendedVerification, "None");

    console.log("\nReasons:");
    printList(profile.reasons, "No risk reasons detected.");

}

function printImpacts(impacts) {

    if (!impacts || impacts.length === 0) {
        console.log("- Unknown");
        return;
    }

    impacts.forEach(impact => {
        console.log(`- ${impact.feature}: ${impact.reason}`);
    });

}

function printOwnedFiles(items) {

    if (!items || items.length === 0) {
        console.log("- Unknown");
        return;
    }

    items.forEach(item => {
        console.log(`- ${item.feature}:`);

        if (!item.files || item.files.length === 0) {
            console.log("  - Unknown");
        }
        else {
            item.files.forEach(file => console.log(`  - ${file}`));
        }
    });

}

function printList(items, fallback) {

    if (!items || items.length === 0) {
        console.log(`- ${fallback}`);
        return;
    }

    items.forEach(item => console.log(`- ${item}`));

}

function addImpact(impacts, feature, reason) {

    if (!feature || !reason) {
        return;
    }

    const duplicate = impacts.some(item =>
        item.feature === feature && item.reason === reason
    );

    if (!duplicate) {
        impacts.push({ feature, reason });
    }

}

function parseImpactInput(args) {

    return (args || [])
        .filter(arg => arg !== "--")
        .join(" ")
        .trim();

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
    showImpact,
    buildImpact
};
