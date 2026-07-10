const {
    CONTRACT_TYPES
} = require("../contracts/contract.constants");
const {
    deepFreeze
} = require("../contracts/contract.immutability");

const AGENT_TASK_PACKAGE_SCHEMA_VERSION = "0.10.0";
const AGENT_TASK_PACKAGE_TYPE = CONTRACT_TYPES.agentTaskPackage;

function createAgentTaskPackage(data = {}) {

    return deepFreeze({
        schemaVersion: AGENT_TASK_PACKAGE_SCHEMA_VERSION,
        packageType: AGENT_TASK_PACKAGE_TYPE,
        task: data.task || {},
        context: data.context || {},
        restrictions: data.restrictions || defaultRestrictions(),
        workflow: data.workflow || defaultWorkflow(),
        verification: data.verification || defaultVerification(),
        expectedReport: data.expectedReport || defaultExpectedReport(),
        metadata: data.metadata || {}
    });

}

function defaultRestrictions() {

    return {
        noAICall: true,
        noAPICall: true,
        noSourceScan: true,
        noStorageMutation: true,
        providerIndependent: true,
        deterministic: true,
        local: true,
        readOnly: true,
        executable: false
    };

}

function defaultWorkflow() {

    return [
        {
            stage: "Understand",
            description: "Understand the user task and the provided package."
        },
        {
            stage: "Context",
            description: "Use DevOS context before opening source files."
        },
        {
            stage: "Read Relevant Files",
            description: "Read only files relevant to the selected context."
        },
        {
            stage: "Implement",
            description: "Make scoped changes only."
        },
        {
            stage: "Verify",
            description: "Run appropriate deterministic verification."
        },
        {
            stage: "Report",
            description: "Report changes, rationale, verification, and risks."
        }
    ];

}

function defaultVerification() {

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
            "If only documentation or package contracts changed, no compile is required.",
            "If context behavior changed, run ask/export/adapter verification.",
            "Do not compile unless needed for verification.",
            "Do not mutate DevOS storage during ask/export/adapter verification."
        ]
    };

}

function defaultExpectedReport() {

    return {
        summary: "",
        changedFiles: [],
        rationale: "",
        verificationCommands: [],
        remainingRisks: []
    };

}

function validateAgentTaskPackage(agentTaskPackage) {

    const errors = [];

    if (!agentTaskPackage || typeof agentTaskPackage !== "object") {
        return {
            valid: false,
            errors: ["Agent Task Package is missing."]
        };
    }

    [
        "schemaVersion",
        "packageType",
        "task",
        "context",
        "restrictions",
        "workflow",
        "verification",
        "expectedReport",
        "metadata"
    ].forEach(field => {
        if (agentTaskPackage[field] === undefined) {
            errors.push(`Missing field: ${field}.`);
        }
    });

    if (agentTaskPackage.packageType !== AGENT_TASK_PACKAGE_TYPE) {
        errors.push(`packageType must be ${AGENT_TASK_PACKAGE_TYPE}.`);
    }

    if (!Array.isArray(agentTaskPackage.workflow) ||
        agentTaskPackage.workflow.length !== 6) {
        errors.push("workflow must contain six stages.");
    }

    return {
        valid: errors.length === 0,
        errors
    };

}

module.exports = {
    AGENT_TASK_PACKAGE_SCHEMA_VERSION,
    AGENT_TASK_PACKAGE_TYPE,
    createAgentTaskPackage,
    defaultRestrictions,
    defaultWorkflow,
    defaultVerification,
    defaultExpectedReport,
    validateAgentTaskPackage
};
