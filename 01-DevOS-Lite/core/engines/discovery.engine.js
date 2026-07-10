const fs = require("fs");
const path = require("path");

const { ROOT } = require("../../config/paths");
const {
    loadKnowledge,
    saveKnowledge
} = require("../services/knowledge.service");
const { SCHEMAS, nowIso } = require("../models/data-contract.model");

const scriptsPath = path.join(ROOT, "..", "Assets", "Scripts");

function walk(dir, result = []) {

    if (!fs.existsSync(dir)) {
        return result;
    }

    const items = fs.readdirSync(dir);

    items.forEach(item => {

        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            walk(fullPath, result);
        }
        else if (item.endsWith(".cs")) {
            result.push(fullPath);
        }

    });

    return result;

}

function toProjectPath(fullPath) {
    return path.relative(path.join(ROOT, ".."), fullPath).replace(/\\/g, "/");
}

function detectFeature(filePath) {

    const parts = filePath.split(/[\\/]/);

    const index = parts.indexOf("Scripts");

    if (index >= 0 && parts.length > index + 2) {
        return parts[index + 1];
    }

    if (index >= 0 && parts.length > index + 1) {
        const fileName = parts[index + 1];

        if (fileName.includes("Player")) return "Player";
        if (fileName.includes("Shadow")) return "Shadow";
        if (fileName.includes("Enemy")) return "Enemy";
        if (fileName.includes("Army")) return "Army";
        if (fileName.includes("Soul")) return "Soul";
        if (fileName.includes("Summon")) return "Summon";

        return "General";
    }
}

function discoverProject() {

    const knowledge = loadKnowledge();
    const discoveredAt = nowIso();

    const files = walk(scriptsPath);

    files.forEach(fullPath => {

        const projectPath = toProjectPath(fullPath);
        const feature = detectFeature(projectPath);

        if (!knowledge[feature]) {
            knowledge[feature] = {
                schemaVersion: SCHEMAS.knowledgeFeature,
                files: [],
                commits: [],
                updatedAt: "",
                updated: ""
            };
        }

        if (!knowledge[feature].files.includes(projectPath)) {
            knowledge[feature].files.push(projectPath);
        }

        knowledge[feature].schemaVersion = knowledge[feature].schemaVersion || SCHEMAS.knowledgeFeature;
        knowledge[feature].updatedAt = discoveredAt;
        knowledge[feature].updated = discoveredAt;

    });

    saveKnowledge(knowledge);

    console.log("🧭 DevOS Discovery");
    console.log("=================");
    console.log(`✔ Discovered ${files.length} script files.`);

}

module.exports = {
    discoverProject
};
