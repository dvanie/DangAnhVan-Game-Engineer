const ADAPTER_NAME = "generic";
const ADAPTER_TARGET = "generic-ai";
const INPUT_TYPE = "context-object";
const OUTPUT_TYPE = "adapter-payload";

const COMPRESSION_LIMITS = {
    small: { Methods: 0, Files: 0, "Public APIs": 0, "Known References": 0 },
    medium: { Methods: 5, Files: 0, "Public APIs": 8, "Known References": 5 },
    full: { Methods: Infinity, Files: Infinity, "Public APIs": Infinity, "Known References": Infinity }
};

function formatGenericAdapterPayload(contextObject) {

    const validation = validateInput(contextObject);

    if (!validation.valid) {
        return {
            adapter: ADAPTER_NAME,
            target: ADAPTER_TARGET,
            inputType: INPUT_TYPE,
            outputType: OUTPUT_TYPE,
            valid: false,
            errors: validation.errors,
            restrictions: buildRestrictions(),
            provenance: buildProvenance()
        };
    }

    return {
        adapter: ADAPTER_NAME,
        target: ADAPTER_TARGET,
        inputType: INPUT_TYPE,
        outputType: OUTPUT_TYPE,
        query: contextObject.query,
        budget: contextObject.budget,
        features: contextObject.relevantFeatures.map(feature => feature.feature),
        context: buildContextBlocks(contextObject),
        metadata: {
            featureCount: contextObject.relevantFeatures.length,
            includedSections: contextObject.includedSections,
            omittedSections: contextObject.omittedSections,
            estimatedCost: contextObject.estimatedCost,
            compressionApplied: contextObject.compressionApplied,
            confidence: contextObject.confidence
        },
        restrictions: buildRestrictions(),
        provenance: buildProvenance()
    };

}

function validateInput(contextObject) {

    const errors = [];

    if (!contextObject || typeof contextObject !== "object") {
        return {
            valid: false,
            errors: ["Context Object is missing."]
        };
    }

    if (!contextObject.query) errors.push("Query is missing.");
    if (!contextObject.budget) errors.push("Budget is missing.");
    if (!Array.isArray(contextObject.relevantFeatures)) errors.push("Relevant features are missing.");
    if (!Array.isArray(contextObject.assembledContext)) errors.push("Assembled context is missing.");
    if (typeof contextObject.includedSections !== "number") errors.push("Included section metadata is missing.");
    if (typeof contextObject.omittedSections !== "number") errors.push("Omitted section metadata is missing.");
    if (typeof contextObject.estimatedCost !== "number") errors.push("Estimated cost metadata is missing.");
    if (typeof contextObject.compressionApplied !== "boolean") errors.push("Compression metadata is missing.");

    return {
        valid: errors.length === 0,
        errors
    };

}

function buildContextBlocks(contextObject) {

    return contextObject.assembledContext.map(block => ({
        feature: block.feature,
        rank: block.rank,
        includedSections: block.includedSections,
        omittedSections: block.omittedSections,
        estimatedCost: block.estimatedCost,
        compressionApplied: block.compressionApplied,
        sections: buildSections(block, contextObject)
    }));

}

function buildSections(block, contextObject) {

    return block.includedSections.map(sectionName => ({
        name: sectionName,
        data: sectionData(sectionName, block.context || {}, contextObject)
    }));

}

function sectionData(sectionName, context, contextObject) {

    if (sectionName === "Summary") {
        return {
            shortDescription: (context.summary || {}).shortDescription || "",
            mainPurpose: (context.summary || {}).mainPurpose || ""
        };
    }

    if (sectionName === "Responsibility") {
        return (context.summary || {}).responsibility || "";
    }

    if (sectionName === "Dependencies") {
        return unique((context.dependencies || {}).dependsOn || []);
    }

    if (sectionName === "Incoming Dependencies") {
        return unique(((context.architecture || {}).incoming || []).map(edge => edge.from));
    }

    if (sectionName === "Public APIs") {
        return compressedList(
            "Public APIs",
            (context.insight || {}).publicAPIs || [],
            contextObject
        );
    }

    if (sectionName === "Architecture") {
        return {
            riskLevel: (context.architecture || {}).riskLevel || "Unknown",
            hotspot: ((context.architecture || {}).intelligence || {}).hotspotLevel || "",
            outgoing: unique(((context.architecture || {}).outgoing || []).map(edge => edge.to))
        };
    }

    if (sectionName === "Files") {
        return compressedList("Files", context.files || [], contextObject);
    }

    if (sectionName === "Methods") {
        const dependencies = context.dependencies || {};
        const methods = Object.values(dependencies.files || {})
            .flatMap(file => file.methods || [])
            .map(method => `${method.visibility} ${method.name}`);

        return compressedList("Methods", methods, contextObject);
    }

    return null;

}

function compressedList(sectionName, items, contextObject) {

    const values = unique(items || []);
    const limit = (COMPRESSION_LIMITS[contextObject.budget] || {})[sectionName];
    const selected = selectRelevantItems(values, contextObject.query, limit);

    return {
        total: values.length,
        included: selected,
        omitted: values.length - selected.length,
        compressed: values.length > selected.length
    };

}

function selectRelevantItems(items, query, limit) {

    if (limit === 0) return [];
    if (!Number.isFinite(limit)) return items;

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

function normalizeQuery(query) {

    return unique(
        String(query || "")
            .toLowerCase()
            .split(/[^a-z0-9_]+/)
            .map(token => token.trim())
            .filter(token => token.length >= 2)
    );

}

function countTokenHits(tokens, text) {

    const normalized = String(text || "")
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .toLowerCase();

    return tokens.filter(token => normalized.includes(token)).length;

}

function buildRestrictions() {

    return {
        noAI: true,
        noAPI: true,
        noSourceScan: true,
        noCompile: true,
        noStorageWrite: true
    };

}

function buildProvenance() {

    return {
        source: "compiled-project-intelligence",
        pipeline: "context-pipeline",
        deterministic: true,
        readOnly: true
    };

}

function unique(items) {

    return [...new Set((items || []).filter(Boolean))];

}

module.exports = {
    formatGenericAdapterPayload
};
