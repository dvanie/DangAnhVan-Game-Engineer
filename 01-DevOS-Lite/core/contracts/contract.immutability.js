function deepFreeze(value) {

    if (value === null || typeof value !== "object" || Object.isFrozen(value)) {
        return value;
    }

    Object.keys(value).forEach(key => {
        deepFreeze(value[key]);
    });

    return Object.freeze(value);

}

module.exports = {
    deepFreeze
};
