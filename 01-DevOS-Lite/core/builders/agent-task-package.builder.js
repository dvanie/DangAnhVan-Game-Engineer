const agentTaskPackageModel = require("../models/agent-task-package.model");
const {
    CONTRACT_TYPES
} = require("../contracts/contract.constants");
const {
    createContractMetadata
} = require("../contracts/contract.metadata");

function buildAgentTaskPackage(promptPackage) {

    const validation = validatePromptPackageInput(promptPackage);

    if (!validation.valid) {
        return agentTaskPackageModel.createAgentTaskPackage({
            task: {
                valid: false,
                errors: validation.errors
            },
            metadata: buildMetadata({})
        });
    }

    return agentTaskPackageModel.createAgentTaskPackage({
        task: buildTask(promptPackage),
        context: buildContext(promptPackage),
        restrictions: buildRestrictions(promptPackage),
        workflow: agentTaskPackageModel.defaultWorkflow(),
        verification: buildVerification(promptPackage),
        expectedReport: agentTaskPackageModel.defaultExpectedReport(),
        metadata: buildMetadata(promptPackage)
    });

}

function buildTask(promptPackage) {

    return {
        query: (promptPackage.task || {}).query || "",
        budget: (promptPackage.task || {}).budget || "",
        confidence: (promptPackage.task || {}).confidence || "",
        relevantFeatures: (promptPackage.task || {}).relevantFeatures || [],
        readingOrder: (promptPackage.task || {}).readingOrder || []
    };

}

function buildContext(promptPackage) {

    return {
        sourcePackageType: promptPackage.packageType,
        promptPackageMetadata: promptPackage.metadata || {},
        projectContext: promptPackage.context || {}
    };

}

function buildRestrictions(promptPackage) {

    return {
        ...agentTaskPackageModel.defaultRestrictions(),
        ...(promptPackage.restrictions || {})
    };

}

function buildVerification(promptPackage) {

    const defaults = agentTaskPackageModel.defaultVerification();
    const sourceValidation = promptPackage.validation || {};

    return {
        recommendedCommands: unique([
            ...defaults.recommendedCommands,
            ...(sourceValidation.recommendedCommands || [])
        ]),
        contextBehaviorCommands: unique([
            ...defaults.contextBehaviorCommands,
            ...(sourceValidation.contextBehaviorCommands || [])
        ]),
        rules: unique([
            ...defaults.rules,
            ...(sourceValidation.rules || [])
        ])
    };

}

function buildMetadata(promptPackage) {

    const promptMetadata = promptPackage.metadata || {};
    const promptTask = promptPackage.task || {};

    return {
        ...createContractMetadata({
            contractType: CONTRACT_TYPES.agentTaskPackage,
            source: "prompt-package",
            budget: promptMetadata.budget || promptTask.budget || "",
            confidence: promptMetadata.confidence || promptTask.confidence || "",
            featureCount: typeof promptMetadata.featureCount === "number"
                ? promptMetadata.featureCount
                : Array.isArray(promptTask.relevantFeatures)
                    ? promptTask.relevantFeatures.length
                    : 0
        }),
        sourcePackageType: promptPackage.packageType || "",
        deterministic: true,
        local: true,
        readOnly: true
    };

}

function validatePromptPackageInput(promptPackage) {

    const errors = [];

    if (!promptPackage || typeof promptPackage !== "object") {
        return {
            valid: false,
            errors: ["Prompt Package is missing."]
        };
    }

    if (!promptPackage.task || typeof promptPackage.task !== "object") {
        errors.push("Prompt Package task is missing.");
    }

    if (!promptPackage.context || typeof promptPackage.context !== "object") {
        errors.push("Prompt Package context is missing.");
    }

    if (!promptPackage.metadata || typeof promptPackage.metadata !== "object") {
        errors.push("Prompt Package metadata is missing.");
    }

    return {
        valid: errors.length === 0,
        errors
    };

}

function unique(items) {

    return [...new Set((items || []).filter(Boolean))];

}

module.exports = {
    buildAgentTaskPackage
};
