const path = require("path");

const ROOT = path.join(__dirname, "..");

module.exports = {
    ROOT,
    CORE: path.join(ROOT, "core"),
    CONFIG: path.join(ROOT, "config"),
    STORAGE: path.join(ROOT, "storage"),
    PLUGINS: path.join(ROOT, "plugins"),
    CLI: path.join(ROOT, "cli")
};