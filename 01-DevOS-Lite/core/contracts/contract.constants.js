const CONTRACT_SCHEMA_VERSION = "1.0";

const CONTRACT_TYPES = {
    contextObject: "context-object",
    promptPackage: "prompt-package",
    agentTaskPackage: "agent-task-package",
    adapterPayload: "adapter-payload",
    targetAdapterPayload: "target-adapter-payload"
};

const CONTRACT_VALIDATION_STATUS = {
    valid: "valid",
    invalid: "invalid"
};

const CONTRACT_RESTRICTIONS = {
    noAI: "noAI",
    noAPI: "noAPI",
    noCompile: "noCompile",
    noSourceScan: "noSourceScan",
    noStorageMutation: "noStorageMutation",
    deterministic: "deterministic",
    local: "local",
    readOnly: "readOnly",
    nonExecutable: "nonExecutable"
};

module.exports = {
    CONTRACT_SCHEMA_VERSION,
    CONTRACT_TYPES,
    CONTRACT_VALIDATION_STATUS,
    CONTRACT_RESTRICTIONS
};
