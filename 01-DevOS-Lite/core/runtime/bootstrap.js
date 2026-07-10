const registry = require("./registry");

function boot() {

    registry.load();

}

module.exports = {

    boot

};