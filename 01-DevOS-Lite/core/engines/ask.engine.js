const contextPipeline = require("../pipelines/context.pipeline");
const recipeEngine = require("./recipe.engine");
const riskEngine = require("./risk.engine");
const featureIntelligence = require("./feature-intelligence.engine");

const STOP_WORDS = new Set([
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from",
    "how", "in", "into", "is", "of", "on", "or", "the", "to", "with"
]);
const DEFAULT_BUDGET = "medium";
const COMPRESSION_LIMITS = {
    small: { Methods: 0, Files: 0, "Public APIs": 0, "Known References": 0 },
    medium: { Methods: 5, Files: 0, "Public APIs": 8, "Known References": 5 },
    full: { Methods: Infinity, Files: Infinity, "Public APIs": Infinity, "Known References": Infinity }
};

function ask(query) {

    const parsed = parseAskInput(query);
    const rawQuery = parsed.query;
    const budget = parsed.budget;

    if (!rawQuery) {
        console.log("Usage:");
        console.log('node devos ask "summon flow"');
        console.log('node devos ask "summon flow" --budget small');
        return;
    }

    if (parsed.warning) {
        console.log(parsed.warning);
    }

    const contextObject = contextPipeline.buildContextObject(rawQuery, budget);

    if (contextObject.contexts.length === 0) {
        console.log("Context not compiled.");
        console.log("");
        console.log("Run:");
        console.log("");
        console.log("node devos compile --all");
        return;
    }

    printContextIntelligence(contextObject);

}

function exportAiContext(query) {

    const parsed = parseAskInput(query);
    const rawQuery = parsed.query;
    const budget = parsed.budget;

    if (!rawQuery) {
        console.log("Usage:");
        console.log('node devos export "summon flow"');
        console.log('node devos export "summon flow" --budget small');
        return;
    }

    if (parsed.warning) {
        console.log(parsed.warning);
    }

    const contextObject = contextPipeline.buildContextObject(rawQuery, budget);

    if (contextObject.contexts.length === 0) {
        console.log("Context not compiled.");
        console.log("");
        console.log("Run:");
        console.log("");
        console.log("node devos compile --all");
        return;
    }

    if (contextObject.relevantFeatures.length === 0) {
        console.log("🧠 DevOS AI Export");
        console.log("==================");
        console.log("");
        console.log("Query:");
        console.log(rawQuery);
        console.log("");
        console.log("Budget:");
        console.log(budget);
        console.log("");
        console.log("No relevant features found.");
        console.log("");
        console.log("No export generated.");
        return;
    }

    printAiExport(contextObject);

}

function parseAskInput(input) {

    const args = Array.isArray(input)
        ? input
        : String(input || "").split(/\s+/).filter(Boolean);
    const queryParts = [];
    let budget = DEFAULT_BUDGET;
    let warning = "";

    for (let index = 0; index < args.length; index += 1) {
        const arg = args[index];

        if (arg === "--budget") {
            const value = (args[index + 1] || "").toLowerCase();

            if (["small", "medium", "full"].includes(value)) {
                budget = value;
                index += 1;
            }
            else {
                warning = `Invalid budget "${value || "(missing)"}". Falling back to medium.`;
                budget = DEFAULT_BUDGET;

                if (value) {
                    index += 1;
                }
            }
        }
        else {
            queryParts.push(arg);
        }
    }

    return {
        query: queryParts.join(" ").trim(),
        budget,
        warning
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

function printContextIntelligence(contextObject) {

    const query = contextObject.query;
    const budget = contextObject.budget;
    const ranked = contextObject.relevantFeatures;
    const readingOrder = contextObject.readingOrder;
    const retrievalPlan = contextObject.retrievedSections;
    const confidence = contextObject.confidence;

    console.log("🧠 DevOS Context Intelligence");
    console.log("=============================");

    console.log("\nQuery:");
    console.log(query);

    console.log("\nBudget Mode:");
    console.log(budget);

    console.log("\nRelevant Features:");

    if (ranked.length === 0) {
        console.log("No relevant features found.");
    }
    else {
        ranked.forEach(item => {
            console.log(`- ${item.feature}`);
            console.log("  Reason:");
            item.reasons.forEach(reason => {
                console.log(`    - ${reason}`);
            });
        });
    }

    console.log("\nSuggested Context Commands:");

    if (ranked.length === 0) {
        console.log("- None");
    }
    else {
        ranked.forEach(item => {
            console.log(`- node devos context ${item.feature.toLowerCase()}`);
        });
    }

    printOwnedFiles(contextObject);
    printIntegrationPoints(contextObject);

    console.log("\nSuggested Reading Order:");

    if (ranked.length === 0) {
        console.log("None");
    }
    else {
        readingOrder.forEach((item, index) => {
            console.log(`${index + 1}. ${item.feature}`);
        });
    }

    if (ranked.length > 0) {
        printKnowledgeRetrieval(retrievalPlan);
        printContextPackPreview(retrievalPlan);
        printAssembledContextPack(contextObject);
        printSuggestedRecipe(recipeEngine.buildRecipe(contextObject));
        printFeatureIntelligence(featureIntelligence.buildFeatureProfiles(contextObject));
    }

    printRiskProfile(riskEngine.buildRiskProfile(contextObject));

    console.log("\nConfidence:");
    console.log(confidence);

    console.log("\nRule:");
    console.log("Deterministic feature selection from compiled project intelligence.");
    console.log("No AI.");
    console.log("No source scanning.");

}

function printFeatureIntelligence(profiles) {

    console.log("\nFeature Intelligence");
    console.log("====================");

    if (!profiles || profiles.length === 0) {
        console.log("\nUnknown");
        return;
    }

    profiles.forEach(profile => {
        console.log(`\nFeature: ${profile.feature}`);

        console.log("\nPurpose:");
        console.log(profile.purpose || "Unknown");

        console.log("\nRecommended Entry:");
        printRecipeList(profile.recommendedEntry, "Unknown");

        console.log("\nOwns:");
        printRecipeList(profile.ownedFiles, "Unknown");

        console.log("\nIntegrates With:");
        printProfileIntegrationPoints(profile.integrationPoints);

        console.log("\nDoes Not Own:");
        printRecipeList(profile.doesNotOwn, "None");

        console.log("\nRisk:");
        console.log(`Level: ${(profile.risk || {}).level || "Low"}`);
        console.log(`Hotspot: ${(profile.risk || {}).hotspot || "Unknown"}`);
    });

}

function printProfileIntegrationPoints(points) {

    if (!points || points.length === 0) {
        console.log("Unknown");
        return;
    }

    points.forEach(point => {
        if (typeof point === "string") {
            console.log(`- ${point}`);
        }
        else {
            console.log(`- ${point.feature}: ${point.reason}`);
        }
    });

}

function printRiskProfile(profile) {

    console.log("\nRisk Profile");
    console.log("============");

    console.log("\nLevel:");
    console.log(profile.level || "Low");

    console.log("\nTouches:");
    printRecipeList(profile.touches, "None");

    console.log("\nAvoid Touching:");
    printRecipeList(profile.avoid, "None");

    console.log("\nRecommended Verification:");
    printRecipeList(profile.recommendedVerification, "None");

    console.log("\nReasons:");
    printRecipeList(profile.reasons, "No risk reasons detected.");

}

function printIntegrationPoints(contextObject) {

    const ranked = contextObject.relevantFeatures || [];
    const contextByFeature = indexByFeature(contextObject.contexts || []);

    console.log("\nIntegration Points:");

    if (ranked.length === 0) {
        console.log("- Unknown");
        return;
    }

    ranked.forEach(item => {
        const context = contextByFeature[item.feature] || {};
        const points = context.integrationPoints || [];

        console.log(`- ${item.feature}:`);

        if (points.length === 0) {
            console.log("  - Unknown");
        }
        else {
            points.forEach(point => {
                if (typeof point === "string") {
                    console.log(`  - ${point}`);
                }
                else {
                    console.log(`  - ${point.feature}: ${point.reason}`);
                }
            });
        }
    });

}

function printOwnedFiles(contextObject) {

    const ranked = contextObject.relevantFeatures || [];
    const contextByFeature = indexByFeature(contextObject.contexts || []);

    console.log("\nOwned Files:");

    if (ranked.length === 0) {
        console.log("- Unknown");
        return;
    }

    ranked.forEach(item => {
        const context = contextByFeature[item.feature] || {};
        const ownedFiles = ((context.ownedFiles || []).filter(file => !/\.meta$/i.test(file)));

        console.log(`- ${item.feature}:`);

        if (ownedFiles.length === 0) {
            console.log("  - Unknown");
        }
        else {
            ownedFiles.forEach(file => {
                console.log(`  - ${file}`);
            });
        }
    });

}

function printSuggestedRecipe(recipe) {

    console.log("\nSuggested Recipe");
    console.log("================");

    console.log("\nRead:");
    printRecipeList(recipe.read, "Unknown");

    console.log("\nLikely Files:");
    printRecipeList(recipe.likelyFiles, "Unknown");

    console.log("\nIntegration Points:");
    printRecipeIntegrationPoints(recipe.integrationPoints);

    console.log("\nAvoid Touching:");
    printRecipeList(recipe.avoid, "None");

    console.log("\nVerify:");
    printRecipeList(recipe.verify, "None");

    console.log("\nEstimated Scope:");
    console.log(recipe.estimatedScope || "Unknown");

}

function printRecipeIntegrationPoints(items) {

    if (!items || items.length === 0) {
        console.log("Unknown");
        return;
    }

    items.forEach(item => {
        console.log(`- ${item.feature}:`);

        if (!item.points || item.points.length === 0) {
            console.log("  - Unknown");
        }
        else {
            item.points.forEach(point => {
                if (typeof point === "string") {
                    console.log(`  - ${point}`);
                }
                else {
                    console.log(`  - ${point.feature}: ${point.reason}`);
                }
            });
        }
    });

}

function printRecipeList(items, fallback) {

    if (!items || items.length === 0) {
        console.log(fallback);
        return;
    }

    items.forEach(item => console.log(`- ${item}`));

}

function printKnowledgeRetrieval(retrievalPlan) {

    console.log("\nKnowledge Retrieval");
    console.log("===================");

    retrievalPlan.forEach(plan => {
        console.log("\nFeature:");
        console.log(plan.feature);

        console.log("\nRetrieved:");
        plan.retrieved.forEach(section => {
            console.log(`✔ ${section.name}`);
            console.log(`  Reason: ${section.reason}`);
        });

        console.log("\nSkipped:");
        plan.skipped.forEach(section => {
            console.log(`- ${section.name}`);
        });

        console.log("\nReason:");
        console.log(plan.reason);
    });

}

function printContextPackPreview(retrievalPlan) {

    console.log("\nContext Pack Preview");
    console.log("====================");

    retrievalPlan.forEach((plan, index) => {
        console.log("\n" + plan.feature);
        plan.retrieved.forEach(section => {
            console.log(section.name);
        });

        if (index < retrievalPlan.length - 1) {
            console.log("\n------------------");
        }
    });

    console.log("\nThis is only a preview.");

}

function printAssembledContextPack(contextObject) {

    const query = contextObject.query;
    const budget = contextObject.budget;
    const ranked = contextObject.relevantFeatures;
    const optimizedPlan = contextObject.optimizedPlan;
    const contextByFeature = indexByFeature(contextObject.contexts);

    console.log("\n🧠 DevOS Context Pack");
    console.log("=====================");

    console.log("\nQuery:");
    console.log(query);

    console.log("\nBudget Mode:");
    console.log(budget);

    console.log("\n--------------------------------");

    console.log("\nRelevant Features:");
    ranked.forEach(item => {
        console.log(`- ${item.feature}`);
    });

    optimizedPlan.forEach(plan => {
        const context = contextByFeature[plan.feature] || {};

        console.log("\n--------------------------------");
        console.log("\nFeature:");
        console.log(plan.feature);

        orderedSections(plan.included).forEach(section => {
            printAssembledSection(section.name, context, budget, query);
        });
    });

    console.log("\n--------------------------------");
    console.log("\nAssembly Summary");
    console.log("");
    console.log(`Features: ${contextObject.retrievedSections.length}`);
    console.log("");
    console.log(`Included Sections: ${contextObject.includedSections}`);
    console.log("");
    console.log(`Omitted Sections: ${contextObject.omittedSections}`);
    console.log("");
    console.log(`Estimated Cost: ${contextObject.estimatedCost}`);
    console.log("");
    console.log(`Compression Applied: ${contextObject.compressionApplied ? "Yes" : "No"}`);
    console.log("");
    console.log("Assembly Rule:");
    console.log("");
    console.log("Context assembled only from compiled project intelligence.");
    console.log("");
    console.log("No AI.");
    console.log("No source scanning.");

}

function printAiExport(contextObject) {

    const query = contextObject.query;
    const budget = contextObject.budget;
    const ranked = contextObject.relevantFeatures;
    const contextLines = buildAiReadyContextLines(contextObject);

    console.log("🧠 DevOS AI Export");
    console.log("==================");
    console.log("");
    console.log("Query:");
    console.log(query);
    console.log("");
    console.log("Budget:");
    console.log(budget);
    console.log("");
    console.log("Features:");
    console.log(ranked.length);
    console.log("");
    console.log("Context Size:");
    console.log(`${contextLines.join("\n").length} characters`);
    console.log("");
    console.log("Assembly Rule:");
    console.log("Compiled project intelligence only.");
    console.log("");
    contextLines.forEach(line => console.log(line));
    console.log("");
    console.log("--------------------------------");
    console.log("");
    console.log("Export Summary");
    console.log("");
    console.log("Budget:");
    console.log(budget);
    console.log("");
    console.log(`Included Sections: ${contextObject.includedSections}`);
    console.log("");
    console.log(`Omitted Sections: ${contextObject.omittedSections}`);
    console.log("");
    console.log(`Estimated Cost: ${contextObject.estimatedCost}`);
    console.log("");
    console.log(`Compression Applied: ${contextObject.compressionApplied ? "Yes" : "No"}`);
    console.log("");
    console.log("Read Only:");
    console.log("Yes");
    console.log("");
    console.log("Source Scan:");
    console.log("No");
    console.log("");
    console.log("Compile:");
    console.log("No");

}

function buildAiReadyContextLines(contextObject) {

    const query = contextObject.query;
    const ranked = contextObject.relevantFeatures;
    const optimizedPlan = contextObject.optimizedPlan;
    const budget = contextObject.budget;
    const contextByFeature = indexByFeature(contextObject.contexts);
    const lines = [];

    lines.push("--------------------------------");
    lines.push("");
    lines.push("AI Ready Context");
    lines.push("");
    lines.push("Query:");
    lines.push(query);
    lines.push("");
    lines.push("Relevant Features:");
    ranked.forEach(item => {
        lines.push(`- ${item.feature}`);
    });

    optimizedPlan.forEach(plan => {
        const context = contextByFeature[plan.feature] || {};

        lines.push("");
        lines.push("--------------------------------");
        lines.push("");
        lines.push("Feature:");
        lines.push(plan.feature);

        orderedSections(plan.included).forEach(section => {
            lines.push("");
            lines.push(section.name);
            formatAssembledSectionLines(section.name, context, budget, query)
                .forEach(line => lines.push(line));
        });
    });

    return lines;

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
        "Methods"
    ];

    return [...sections].sort((a, b) =>
        order.indexOf(a.name) - order.indexOf(b.name)
    );

}

function printAssembledSection(sectionName, context, budget, query) {

    console.log(`\n${sectionName}`);

    formatAssembledSectionLines(sectionName, context, budget, query)
        .forEach(line => console.log(line));

}

function formatAssembledSectionLines(sectionName, context, budget, query) {

    if (sectionName === "Summary") {
        return formatSummarySectionLines(context.summary);
    }
    else if (sectionName === "Responsibility") {
        return [(context.summary || {}).responsibility || "Unknown"];
    }
    else if (sectionName === "Dependencies") {
        return formatList((context.dependencies || {}).dependsOn || [], "None");
    }
    else if (sectionName === "Incoming Dependencies") {
        return formatList(((context.architecture || {}).incoming || []).map(edge => edge.from), "None");
    }
    else if (sectionName === "Public APIs") {
        return formatCompressedListLines(
            "Public APIs",
            (context.insight || {}).publicAPIs || [],
            budget,
            query,
            item => item
        );
    }
    else if (sectionName === "Architecture") {
        return formatArchitectureSectionLines(context.architecture || {});
    }
    else if (sectionName === "Files") {
        return formatCompressedListLines(
            "Files",
            context.files || [],
            budget,
            query,
            item => item
        );
    }
    else if (sectionName === "Methods") {
        return formatMethodsSectionLines(context, budget, query);
    }

    return [];

}

function printSummarySection(summary = {}) {

    formatSummarySectionLines(summary).forEach(line => console.log(line));

}

function formatSummarySectionLines(summary = {}) {

    const lines = [
        summary.shortDescription || "No summary available."
    ];

    if (summary.mainPurpose) {
        lines.push(`Purpose: ${summary.mainPurpose}`);
    }

    return lines;

}

function printArchitectureSection(architecture) {

    formatArchitectureSectionLines(architecture)
        .forEach(line => console.log(line));

}

function formatArchitectureSectionLines(architecture) {

    const lines = [
        `Risk Level: ${architecture.riskLevel || "Unknown"}`
    ];

    const intelligence = architecture.intelligence || {};

    if (intelligence.hotspotLevel) {
        lines.push(`Hotspot: ${intelligence.hotspotLevel}`);
    }

    const outgoing = (architecture.outgoing || []).map(edge => edge.to);

    if (outgoing.length > 0) {
        lines.push("Outgoing:");
        formatList(outgoing, "None").forEach(line => lines.push(line));
    }

    return lines;

}

function printMethodsSection(context, budget, query) {

    formatMethodsSectionLines(context, budget, query)
        .forEach(line => console.log(line));

}

function formatMethodsSectionLines(context, budget, query) {

    const dependencies = context.dependencies || {};
    const methods = Object.values(dependencies.files || {})
        .flatMap(file => file.methods || [])
        .map(method => `${method.visibility} ${method.name}`);

    return formatCompressedListLines(
        "Methods",
        methods,
        budget,
        query,
        item => item
    );

}

function printCompressedList(sectionName, items, budget, query, format) {

    formatCompressedListLines(sectionName, items, budget, query, format)
        .forEach(line => console.log(line));

}

function formatCompressedListLines(sectionName, items, budget, query, format) {

    if (!items || items.length === 0) {
        return ["- None"];
    }

    const lines = [];
    const uniqueItems = unique(items);
    const limit = (COMPRESSION_LIMITS[budget] || {})[sectionName];
    const selected = selectRelevantItems(uniqueItems, query, limit);
    const omitted = uniqueItems.length - selected.length;

    if (Number.isFinite(limit) && uniqueItems.length > selected.length) {
        lines.push(`${uniqueItems.length} compiled ${sectionName.toLowerCase()}.`);
        lines.push(`Showing ${selected.length} most relevant:`);
    }

    selected.forEach(item => {
        lines.push(`- ${format(item)}`);
    });

    if (omitted > 0) {
        lines.push(`${omitted} ${sectionName.toLowerCase()} omitted by budget.`);
    }

    return lines;

}

function selectRelevantItems(items, query, limit) {

    if (limit === 0) {
        return [];
    }

    if (!Number.isFinite(limit)) {
        return items;
    }

    const tokens = normalizeQuery(query);

    return [...items]
        .map((item, index) => ({
            item,
            index,
            score: countTokenHits(tokens, item)
        }))
        .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return a.index - b.index;
        })
        .slice(0, limit)
        .map(entry => entry.item);

}

function printList(items, fallback) {

    formatList(items, fallback).forEach(item => console.log(item));

}

function formatList(items, fallback) {

    if (!items || items.length === 0) {
        return [`- ${fallback}`];
    }

    return unique(items).map(item => `- ${item}`);

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
    ask,
    exportAiContext
};
