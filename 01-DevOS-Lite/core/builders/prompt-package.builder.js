const promptPackageModel = require("../models/prompt-package.model");
const {
    CONTRACT_TYPES
} = require("../contracts/contract.constants");
const {
    createContractMetadata
} = require("../contracts/contract.metadata");

function buildPromptPackage(contextObject) {

    const validation = validateContextObject(contextObject);

    if (!validation.valid) {
        return promptPackageModel.createPromptPackage({
            task: {
                query: "",
                valid: false,
                errors: validation.errors
            },
            metadata: buildMetadata({})
        });
    }

    return promptPackageModel.createPromptPackage({
        task: buildTask(contextObject),
        context: buildContext(contextObject),
        restrictions: promptPackageModel.defaultRestrictions(),
        workflow: promptPackageModel.defaultWorkflow(),
        validation: buildValidation(contextObject),
        metadata: buildMetadata(contextObject)
    });

}

function buildTask(contextObject) {

    return {
        query: contextObject.query,
        budget: contextObject.budget,
        confidence: contextObject.confidence,
        relevantFeatures: (contextObject.relevantFeatures || []).map(feature => ({
            name: feature.feature,
            score: feature.score,
            directScore: feature.directScore,
            relationshipScore: feature.relationshipScore,
            reasons: feature.reasons || []
        })),
        readingOrder: (contextObject.readingOrder || []).map(item => item.feature)
    };

}

function buildContext(contextObject) {

    return {
        retrievedSections: contextObject.retrievedSections || [],
        optimizedSections: contextObject.optimizedPlan || [],
        assembledContext: (contextObject.assembledContext || []).map(block => ({
            feature: block.feature,
            rank: block.rank,
            includedSections: block.includedSections,
            omittedSections: block.omittedSections,
            estimatedCost: block.estimatedCost,
            compressionApplied: block.compressionApplied
        })),
        summary: {
            includedSections: contextObject.includedSections || 0,
            omittedSections: contextObject.omittedSections || 0,
            estimatedCost: contextObject.estimatedCost || 0,
            compressionApplied: contextObject.compressionApplied === true
        }
    };

}

function buildValidation(contextObject) {

    const validation = promptPackageModel.defaultValidation();

    return {
        ...validation,
        packageChecks: [
            "Prompt Package is provider-independent.",
            "Prompt Package is not executable.",
            "Prompt Package does not contain generated prompts.",
            "Prompt Package was built from an existing Context Object."
        ],
        recommendedCommands: unique([
            ...validation.recommendedCommands,
            ...recommendedContextCommands(contextObject)
        ])
    };

}

function recommendedContextCommands(contextObject) {

    return (contextObject.relevantFeatures || [])
        .map(feature => `node devos context ${String(feature.feature || "").toLowerCase()}`)
        .filter(command => command.trim() !== "node devos context");

}

function buildMetadata(contextObject) {

    return {
        ...createContractMetadata({
            contractType: CONTRACT_TYPES.promptPackage,
            source: "context-object",
            budget: contextObject.budget || "",
            confidence: contextObject.confidence || "Low",
            featureCount: Array.isArray(contextObject.relevantFeatures)
                ? contextObject.relevantFeatures.length
                : 0
        }),
        budget: contextObject.budget || "",
        confidence: contextObject.confidence || "Low",
        featureCount: Array.isArray(contextObject.relevantFeatures)
            ? contextObject.relevantFeatures.length
            : 0,
        source: "context-object",
        deterministic: true,
        local: true,
        readOnly: true
    };

}

function validateContextObject(contextObject) {

    const errors = [];

    if (!contextObject || typeof contextObject !== "object") {
        return {
            valid: false,
            errors: ["Context Object is missing."]
        };
    }

    if (!contextObject.query) errors.push("Context Object query is missing.");
    if (!contextObject.budget) errors.push("Context Object budget is missing.");
    if (!Array.isArray(contextObject.relevantFeatures)) errors.push("Context Object relevantFeatures must be an array.");
    if (!Array.isArray(contextObject.retrievedSections)) errors.push("Context Object retrievedSections must be an array.");
    if (!Array.isArray(contextObject.assembledContext)) errors.push("Context Object assembledContext must be an array.");
    if (typeof contextObject.estimatedCost !== "number") errors.push("Context Object estimatedCost must be a number.");
    if (typeof contextObject.compressionApplied !== "boolean") errors.push("Context Object compressionApplied must be a boolean.");

    return {
        valid: errors.length === 0,
        errors
    };

}

function unique(items) {

    return [...new Set((items || []).filter(Boolean))];

}

module.exports = {
    buildPromptPackage
};
