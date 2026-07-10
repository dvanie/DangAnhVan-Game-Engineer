const SCHEMA_VERSION = "1.0";

const SCHEMAS = {
    logEntry: SCHEMA_VERSION,
    decision: SCHEMA_VERSION,
    knowledgeFeature: SCHEMA_VERSION,
    architecture: SCHEMA_VERSION,
    context: SCHEMA_VERSION,
    evolutionReport: SCHEMA_VERSION,
    evolutionSnapshot: SCHEMA_VERSION
};

function nowIso() {
    return new Date().toISOString();
}

function withGeneratedMetadata(data, type, generatedAt = nowIso()) {
    return {
        schemaVersion: SCHEMAS[type] || SCHEMA_VERSION,
        generatedAt,
        ...data
    };
}

module.exports = {
    SCHEMA_VERSION,
    SCHEMAS,
    nowIso,
    withGeneratedMetadata
};
