const VALID_BUDGETS = ["small", "medium", "full"];
const REQUIRED_FIELDS = [
    "adapter",
    "target",
    "inputType",
    "outputType",
    "query",
    "budget",
    "features",
    "context",
    "metadata",
    "restrictions",
    "provenance"
];

function validateGenericAdapterPayload(payload) {

    const errors = [];
    const warnings = [];
    const checks = [];

    if (!payload || typeof payload !== "object") {
        return {
            valid: false,
            errors: ["Payload is missing."],
            warnings,
            checks
        };
    }

    validateRequiredFields(payload, errors, checks);
    validateExpectedValues(payload, errors, checks);
    validateBudget(payload, errors, checks);
    validateRestrictions(payload, errors, checks);
    validateProvenance(payload, errors, checks);
    validateFeatures(payload, errors, warnings, checks);
    validateContext(payload, errors, warnings, checks);
    validateMetadata(payload, errors, warnings, checks);

    return {
        valid: errors.length === 0,
        errors,
        warnings,
        checks
    };

}

function validateRequiredFields(payload, errors, checks) {

    const missing = REQUIRED_FIELDS.filter(field => payload[field] === undefined);

    if (missing.length > 0) {
        missing.forEach(field => errors.push(`Missing required field: ${field}.`));
    }

    checks.push("Required fields");

}

function validateExpectedValues(payload, errors, checks) {

    if (payload.adapter !== undefined && payload.adapter !== "generic") {
        errors.push("Adapter must be generic.");
    }

    if (payload.inputType !== undefined && payload.inputType !== "context-object") {
        errors.push("Input type must be context-object.");
    }

    if (payload.outputType !== undefined && payload.outputType !== "adapter-payload") {
        errors.push("Output type must be adapter-payload.");
    }

    checks.push("Expected adapter values");

}

function validateBudget(payload, errors, checks) {

    if (payload.budget !== undefined && !VALID_BUDGETS.includes(payload.budget)) {
        errors.push("Budget must be small, medium, or full.");
    }

    checks.push("Budget");

}

function validateRestrictions(payload, errors, checks) {

    const restrictions = payload.restrictions || {};
    const required = [
        "noAI",
        "noAPI",
        "noSourceScan",
        "noCompile",
        "noStorageWrite"
    ];

    required.forEach(field => {
        if (restrictions[field] !== true) {
            errors.push(`Restriction ${field} must be true.`);
        }
    });

    checks.push("Restrictions");

}

function validateProvenance(payload, errors, checks) {

    const provenance = payload.provenance || {};

    if (provenance.deterministic !== true) {
        errors.push("Provenance deterministic must be true.");
    }

    if (provenance.readOnly !== true) {
        errors.push("Provenance readOnly must be true.");
    }

    if (provenance.source !== undefined &&
        provenance.source !== "compiled-project-intelligence") {
        errors.push("Provenance source must be compiled-project-intelligence.");
    }

    if (provenance.pipeline !== undefined &&
        provenance.pipeline !== "context-pipeline") {
        errors.push("Provenance pipeline must be context-pipeline.");
    }

    checks.push("Provenance");

}

function validateFeatures(payload, errors, warnings, checks) {

    if (!Array.isArray(payload.features)) {
        errors.push("Features must be an array.");
        checks.push("Features");
        return;
    }

    const context = Array.isArray(payload.context) ? payload.context : [];
    const contextFeatures = context.map(block => block && block.feature).filter(Boolean);

    if (contextFeatures.length > 0) {
        const orderMatches = payload.features.every((feature, index) =>
            contextFeatures[index] === feature
        );

        if (!orderMatches) {
            errors.push("Feature order must match context block order.");
        }
    }

    if (payload.metadata && payload.metadata.featureCount !== undefined &&
        payload.metadata.featureCount !== payload.features.length) {
        errors.push("Feature count must match metadata.featureCount.");
    }

    checks.push("Features");

}

function validateContext(payload, errors, warnings, checks) {

    if (!Array.isArray(payload.context)) {
        errors.push("Context must be an array.");
        checks.push("Context blocks");
        return;
    }

    if (payload.context.length === 0) {
        warnings.push("Context is empty.");
    }

    payload.context.forEach((block, index) => {
        if (!block || typeof block !== "object") {
            errors.push(`Context block ${index + 1} must be an object.`);
            return;
        }

        if (!block.feature) {
            errors.push(`Context block ${index + 1} is missing feature name.`);
        }

        if (!Array.isArray(block.sections) && !Array.isArray(block.includedSections)) {
            errors.push(`Context block ${index + 1} is missing section data.`);
        }

        if (Array.isArray(block.sections) && block.sections.length === 0) {
            warnings.push(`Context block ${index + 1} has no sections.`);
        }
    });

    checks.push("Context blocks");

}

function validateMetadata(payload, errors, warnings, checks) {

    const metadata = payload.metadata || {};
    const required = [
        "featureCount",
        "includedSections",
        "omittedSections",
        "estimatedCost",
        "compressionApplied",
        "confidence"
    ];

    required.forEach(field => {
        if (metadata[field] === undefined) {
            errors.push(`Metadata field ${field} is missing.`);
        }
    });

    if (metadata.estimatedCost === 0) {
        warnings.push("Estimated cost is 0.");
    }

    if (metadata.includedSections === 0) {
        warnings.push("Included sections is 0.");
    }

    if ((payload.budget === "small" || payload.budget === "medium") &&
        metadata.compressionApplied === undefined) {
        warnings.push("Compression flag is missing for compressed budget mode.");
    }

    if (!metadata.confidence || metadata.confidence === "Low") {
        warnings.push("Confidence is missing or Low.");
    }

    checks.push("Metadata");

}

module.exports = {
    validateGenericAdapterPayload
};
