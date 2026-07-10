const contextPipeline = require("../pipelines/context.pipeline");
const payloadFormatter = require("./adapter-payload.formatter");
const payloadValidator = require("./adapter-payload.validator");
const targetFormatter = require("./target-adapter.formatter");

const DEFAULT_BUDGET = "medium";
const DEFAULT_TARGET = "generic";
const VALID_BUDGETS = ["small", "medium", "full"];

const ADAPTER_CONTRACT = {
    name: "generic",
    target: "generic-ai",
    input: "Context Object",
    output: "Adapter Payload",
    capabilities: [
        "readContextObject",
        "renderAdapterPayload"
    ],
    restrictions: {
        noAI: true,
        noAPI: true,
        noSourceScan: true,
        noCompile: true,
        noStorageWrite: true
    }
};

function runAdapter(args) {

    const parsed = parseAdapterInput(args);

    if (!parsed.query) {
        console.log("Usage:");
        console.log('node devos adapter "summon flow"');
        console.log('node devos adapter "summon flow" --budget small');
        return;
    }

    if (parsed.warning) {
        console.log(parsed.warning);
    }

    const contextObject = contextPipeline.buildContextObject(parsed.query, parsed.budget);
    contextObject.target = parsed.target;
    const validation = validate(contextObject);

    if (contextObject.contexts.length === 0) {
        console.log("Context not compiled.");
        console.log("");
        console.log("Run:");
        console.log("");
        console.log("node devos compile --all");
        return;
    }

    if (contextObject.relevantFeatures.length === 0) {
        printAdapterHeader(contextObject);
        console.log("");
        console.log("No relevant features found.");
        console.log("");
        console.log("No adapter payload produced.");
        return;
    }

    if (!validation.valid) {
        printAdapterHeader(contextObject);
        console.log("");
        console.log("Context Object:");
        console.log("Invalid");
        console.log("");
        console.log("Reason:");
        validation.errors.forEach(error => console.log(`- ${error}`));
        return;
    }

    const adapterResult = consume(contextObject, parsed.target);

    printAdapterReport(contextObject, adapterResult);

}

function parseAdapterInput(input) {

    const args = Array.isArray(input)
        ? input
        : String(input || "").split(/\s+/).filter(Boolean);
    const queryParts = [];
    let budget = DEFAULT_BUDGET;
    let target = DEFAULT_TARGET;
    let warning = "";
    const warnings = [];

    for (let index = 0; index < args.length; index += 1) {
        const arg = args[index];

        if (arg === "--budget") {
            const value = (args[index + 1] || "").toLowerCase();

            if (VALID_BUDGETS.includes(value)) {
                budget = value;
                index += 1;
            }
            else {
                warnings.push(`Invalid budget "${value || "(missing)"}". Falling back to medium.`);
                budget = DEFAULT_BUDGET;

                if (value) {
                    index += 1;
                }
            }
        }
        else if (arg === "--target") {
            const value = (args[index + 1] || "").toLowerCase();

            if (targetFormatter.isSupportedTarget(value)) {
                target = value;
                index += 1;
            }
            else {
                warnings.push(`Invalid target "${value || "(missing)"}". Falling back to generic.`);
                target = DEFAULT_TARGET;

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
        target,
        warning: warnings.join("\n")
    };

}

function consume(contextObject, target = DEFAULT_TARGET) {

    const validation = validate(contextObject);

    if (!validation.valid) {
        const payload = {
            adapter: ADAPTER_CONTRACT.name,
            target: ADAPTER_CONTRACT.target,
            valid: false,
            errors: validation.errors
        };
        const payloadValidation = payloadValidator.validateGenericAdapterPayload(payload);
        const targetPayload = targetFormatter.formatTargetAdapterPayload(payload, target);
        const targetValidation = targetFormatter.validateTargetAdapterPayload(targetPayload);

        return {
            payload,
            payloadValidation,
            targetPayload,
            targetValidation
        };
    }

    const payload = payloadFormatter.formatGenericAdapterPayload(contextObject);
    const payloadValidation = payloadValidator.validateGenericAdapterPayload(payload);
    const targetPayload = targetFormatter.formatTargetAdapterPayload(payload, target);
    const targetValidation = targetFormatter.validateTargetAdapterPayload(targetPayload);

    return {
        payload,
        payloadValidation,
        targetPayload,
        targetValidation
    };

}

function validate(contextObject) {

    const errors = [];

    if (!contextObject || typeof contextObject !== "object") {
        return {
            valid: false,
            errors: ["Context Object is missing."]
        };
    }

    if (!contextObject.query) {
        errors.push("Query is missing.");
    }

    if (!contextObject.budget) {
        errors.push("Budget is missing.");
    }

    if (!Array.isArray(contextObject.relevantFeatures)) {
        errors.push("Relevant features are missing.");
    }

    if (!Array.isArray(contextObject.assembledContext)) {
        errors.push("Assembled context is missing.");
    }

    if (typeof contextObject.estimatedCost !== "number") {
        errors.push("Metadata estimated cost is missing.");
    }

    if (typeof contextObject.compressionApplied !== "boolean") {
        errors.push("Metadata compression flag is missing.");
    }

    return {
        valid: errors.length === 0,
        errors
    };

}

function describe() {

    return {
        ...ADAPTER_CONTRACT
    };

}

function printAdapterReport(contextObject, adapterResult) {

    const payload = adapterResult.payload;
    const payloadValidation = adapterResult.payloadValidation;
    const targetPayload = adapterResult.targetPayload;
    const targetValidation = adapterResult.targetValidation;

    printAdapterHeader(contextObject);
    console.log("");
    console.log("Context Object:");
    console.log("Valid");
    console.log("");
    console.log("Payload:");
    console.log("Ready");
    console.log("");
    console.log("Payload Object:");
    console.log("Generated");
    console.log("");
    console.log("Payload Type:");
    console.log(payload.outputType);
    console.log("");
    console.log("Payload Validation:");
    console.log(payloadValidation.valid ? "Valid" : "Invalid");
    console.log("");
    console.log("Validation Checks:");
    payloadValidation.checks.forEach(check => console.log(`- ${check}`));
    console.log("");
    if (payloadValidation.errors.length > 0) {
        console.log("Validation Errors:");
        payloadValidation.errors.forEach(error => console.log(`- ${error}`));
        console.log("");
    }
    console.log("Warnings:");
    if (payloadValidation.warnings.length === 0) {
        console.log("None");
    }
    else {
        payloadValidation.warnings.forEach(warning => console.log(`- ${warning}`));
    }
    console.log("");
    console.log("Target Payload:");
    console.log(targetValidation.valid ? "Generated" : "Invalid");
    console.log("");
    console.log("Target Mode:");
    console.log(targetPayload.mode);
    console.log("");
    console.log("Executable:");
    console.log(targetPayload.executable ? "Yes" : "No");
    console.log("");
    console.log("Sendable:");
    console.log(targetPayload.sendable ? "Yes" : "No");
    console.log("");
    if (targetValidation.errors.length > 0) {
        console.log("Target Payload Errors:");
        targetValidation.errors.forEach(error => console.log(`- ${error}`));
        console.log("");
    }
    console.log("Feature Count:");
    console.log(payload.metadata.featureCount);
    console.log("");
    console.log("Feature Order:");
    payload.features.forEach(feature => console.log(`- ${feature}`));
    console.log("");
    console.log("Context Blocks:");
    console.log(payload.context.length);
    console.log("");
    console.log("Restrictions:");
    console.log("No AI.");
    console.log("No API.");
    console.log("Dry run only.");
    console.log("No source scanning.");
    console.log("No compile.");
    console.log("No storage write.");
    console.log("");
    console.log("Adapter Summary:");
    console.log(`Features: ${payload.metadata.featureCount}`);
    console.log(`Included Sections: ${payload.metadata.includedSections}`);
    console.log(`Omitted Sections: ${payload.metadata.omittedSections}`);
    console.log(`Estimated Cost: ${payload.metadata.estimatedCost}`);
    console.log(`Compression Applied: ${payload.metadata.compressionApplied ? "Yes" : "No"}`);
    console.log("");
    console.log("Payload Metadata:");
    console.log(`Source Scan: ${payload.restrictions.noSourceScan ? "No" : "Yes"}`);
    console.log(`Compile: ${payload.restrictions.noCompile ? "No" : "Yes"}`);
    console.log(`AI Call: ${payload.restrictions.noAI ? "No" : "Yes"}`);
    console.log(`API Call: ${payload.restrictions.noAPI ? "No" : "Yes"}`);
    console.log(`Storage Write: ${payload.restrictions.noStorageWrite ? "No" : "Yes"}`);

}

function printAdapterHeader(contextObject) {

    console.log("🧩 DevOS Adapter Interface");
    console.log("==========================");
    console.log("");
    console.log("Query:");
    console.log(contextObject.query);
    console.log("");
    console.log("Adapter:");
    console.log(ADAPTER_CONTRACT.name);
    console.log("");
    console.log("Target:");
    console.log(contextObject.target || DEFAULT_TARGET);
    console.log("");
    console.log("Budget:");
    console.log(contextObject.budget);

}

module.exports = {
    describe,
    validate,
    consume,
    runAdapter
};
