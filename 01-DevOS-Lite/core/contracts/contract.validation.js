function createValidationResult(options = {}) {

    const errors = options.errors || [];
    const warnings = options.warnings || [];
    const checks = options.checks || [];
    const valid = typeof options.valid === "boolean"
        ? options.valid
        : errors.length === 0;

    return {
        valid,
        errors,
        warnings,
        checks
    };

}

function createValidationCheck(name, passed, details = {}) {

    return {
        name,
        passed: passed === true,
        details
    };

}

function createValidationError(code, message, details = {}) {

    return {
        code,
        message,
        details
    };

}

function createValidationWarning(code, message, details = {}) {

    return {
        code,
        message,
        details
    };

}

module.exports = {
    createValidationResult,
    createValidationCheck,
    createValidationError,
    createValidationWarning
};
