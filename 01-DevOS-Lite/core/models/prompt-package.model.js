const {
    CONTRACT_TYPES
} = require("../contracts/contract.constants");
const {
    deepFreeze
} = require("../contracts/contract.immutability");

const PROMPT_PACKAGE_SCHEMA_VERSION = "0.8.0";
const PROMPT_PACKAGE_TYPE = CONTRACT_TYPES.promptPackage;

function createPromptPackage(data = {}) {

    return deepFreeze({
        schemaVersion: PROMPT_PACKAGE_SCHEMA_VERSION,
        packageType: PROMPT_PACKAGE_TYPE,
        task: data.task || {},
        context: data.context || {},
        restrictions: data.restrictions || defaultRestrictions(),
        workflow: data.workflow || defaultWorkflow(),
        validation: data.validation || defaultValidation(),
        metadata: data.metadata || {}
    });

}

function defaultRestrictions() {

    return {
        noAICall: true,
        noAPICall: true,
        noCompile: true,
        noSourceScan: true,
        noStorageMutation: true,
        deterministic: true,
        local: true,
        executable: false,
        providerIndependent: true
    };

}

function defaultWorkflow() {

    return [
        {
            step: "Understand",
            description: "Understand the user task and selected DevOS context."
        },
        {
            step: "Context",
            description: "Use the Context Object and relevant feature context before reading source files."
        },
        {
            step: "Implement",
            description: "Make scoped changes only after context is understood."
        },
        {
            step: "Verify",
            description: "Run deterministic verification appropriate to the change."
        },
        {
            step: "Report",
            description: "Report changes, rationale, verification, and remaining risks."
        }
    ];

}

function defaultValidation() {

    return {
        recommendedCommands: [
            "node devos doctor"
        ],
        contextBehaviorCommands: [
            'node devos ask "summon flow" --budget small',
            'node devos export "summon flow" --budget small',
            'node devos adapter "summon flow" --target gpt --budget small',
            'node devos adapter "banana" --target gpt'
        ],
        rules: [
            "If only documentation changed, no compile is required.",
            "If context behavior changed, run ask/export/adapter verification.",
            "Do not compile unless needed for verification.",
            "Do not mutate DevOS storage during ask/export/adapter verification."
        ]
    };

}

function validatePromptPackage(promptPackage) {

    const errors = [];

    if (!promptPackage || typeof promptPackage !== "object") {
        return {
            valid: false,
            errors: ["Prompt Package is missing."]
        };
    }

    [
        "schemaVersion",
        "packageType",
        "task",
        "context",
        "restrictions",
        "workflow",
        "validation",
        "metadata"
    ].forEach(field => {
        if (promptPackage[field] === undefined) {
            errors.push(`Missing field: ${field}.`);
        }
    });

    if (promptPackage.packageType !== PROMPT_PACKAGE_TYPE) {
        errors.push(`packageType must be ${PROMPT_PACKAGE_TYPE}.`);
    }

    return {
        valid: errors.length === 0,
        errors
    };

}

module.exports = {
    PROMPT_PACKAGE_SCHEMA_VERSION,
    PROMPT_PACKAGE_TYPE,
    createPromptPackage,
    defaultRestrictions,
    defaultWorkflow,
    defaultValidation,
    validatePromptPackage
};
