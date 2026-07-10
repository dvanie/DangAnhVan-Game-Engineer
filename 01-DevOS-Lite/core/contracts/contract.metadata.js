const { nowIso } = require("../models/data-contract.model");
const {
    CONTRACT_SCHEMA_VERSION
} = require("./contract.constants");

function createContractMetadata(options = {}) {

    const metadata = {
        createdAt: options.createdAt || nowIso(),
        schemaVersion: options.schemaVersion || CONTRACT_SCHEMA_VERSION,
        contractType: options.contractType || ""
    };

    if (options.source !== undefined) metadata.source = options.source;
    if (options.budget !== undefined) metadata.budget = options.budget;
    if (options.confidence !== undefined) metadata.confidence = options.confidence;
    if (options.featureCount !== undefined) metadata.featureCount = options.featureCount;

    return metadata;

}

module.exports = {
    createContractMetadata
};
