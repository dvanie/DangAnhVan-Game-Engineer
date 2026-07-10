const services = {};

function register(name, service) {

    services[name] = service;

    console.log(`✔ Loaded Service : ${name}`);

}

function get(name) {

    return services[name];

}

function load() {

    console.log("Loading Runtime...");

    register(
        "memory",
        require("../services/memory.service")
    );

    register(
        "logger",
        require("../services/logger.service")
    );

}

module.exports = {

    register,

    get,

    load

};