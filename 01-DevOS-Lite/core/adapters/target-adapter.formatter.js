const payloadValidator = require("./adapter-payload.validator");

const SUPPORTED_TARGETS = ["generic", "gpt", "claude", "codex", "gemini", "ollama"];

function formatTargetAdapterPayload(genericPayload, target = "generic") {

    const selectedTarget = normalizeTarget(target);
    const validation = payloadValidator.validateGenericAdapterPayload(genericPayload);

    if (!validation.valid) {
        return {
            target: selectedTarget,
            mode: "dry-run",
            inputType: "adapter-payload",
            outputType: "target-adapter-payload",
            executable: false,
            sendable: false,
            valid: false,
            errors: validation.errors,
            payload: null,
            restrictions: buildRestrictions()
        };
    }

    return {
        target: selectedTarget,
        mode: "dry-run",
        inputType: "adapter-payload",
        outputType: "target-adapter-payload",
        executable: false,
        sendable: false,
        payload: buildTargetPayload(genericPayload, selectedTarget),
        restrictions: buildRestrictions(),
        provenance: {
            source: "generic-adapter-payload",
            formatter: "target-adapter-formatter",
            deterministic: true,
            readOnly: true
        }
    };

}

function normalizeTarget(target) {

    const value = String(target || "generic").toLowerCase();

    return SUPPORTED_TARGETS.includes(value) ? value : "generic";

}

function isSupportedTarget(target) {

    return SUPPORTED_TARGETS.includes(String(target || "").toLowerCase());

}

function buildTargetPayload(genericPayload, target) {

    if (target === "generic") {
        return {
            genericPayload,
            executable: false
        };
    }

    if (target === "gpt") {
        return {
            model: null,
            messages: [],
            context: genericPayload.context,
            metadata: genericPayload.metadata,
            executable: false
        };
    }

    if (target === "claude") {
        return {
            model: null,
            messages: [],
            context: genericPayload.context,
            metadata: genericPayload.metadata,
            executable: false
        };
    }

    if (target === "codex") {
        return {
            model: null,
            task: null,
            context: genericPayload.context,
            metadata: genericPayload.metadata,
            executable: false
        };
    }

    if (target === "gemini") {
        return {
            model: null,
            contents: [],
            context: genericPayload.context,
            metadata: genericPayload.metadata,
            executable: false
        };
    }

    if (target === "ollama") {
        return {
            model: null,
            prompt: null,
            context: genericPayload.context,
            metadata: genericPayload.metadata,
            executable: false
        };
    }

    return {
        genericPayload,
        executable: false
    };

}

function validateTargetAdapterPayload(targetPayload) {

    const errors = [];
    const checks = [];

    if (!targetPayload || typeof targetPayload !== "object") {
        return {
            valid: false,
            errors: ["Target payload is missing."],
            checks
        };
    }

    if (!SUPPORTED_TARGETS.includes(targetPayload.target)) {
        errors.push("Target is not supported.");
    }

    if (targetPayload.mode !== "dry-run") {
        errors.push("Target payload mode must be dry-run.");
    }

    if (targetPayload.executable !== false) {
        errors.push("Target payload executable must be false.");
    }

    if (targetPayload.sendable !== false) {
        errors.push("Target payload sendable must be false.");
    }

    const restrictions = targetPayload.restrictions || {};

    if (restrictions.noAI !== true) {
        errors.push("Target payload restriction noAI must be true.");
    }

    if (restrictions.noAPI !== true) {
        errors.push("Target payload restriction noAPI must be true.");
    }

    if (restrictions.dryRunOnly !== true) {
        errors.push("Target payload restriction dryRunOnly must be true.");
    }

    checks.push("Target");
    checks.push("Dry run");
    checks.push("Executable");
    checks.push("Sendable");
    checks.push("Restrictions");

    return {
        valid: errors.length === 0,
        errors,
        checks
    };

}

function buildRestrictions() {

    return {
        noAI: true,
        noAPI: true,
        dryRunOnly: true,
        noSourceScan: true,
        noCompile: true,
        noStorageWrite: true
    };

}

module.exports = {
    SUPPORTED_TARGETS,
    formatTargetAdapterPayload,
    validateTargetAdapterPayload,
    isSupportedTarget,
    normalizeTarget
};
