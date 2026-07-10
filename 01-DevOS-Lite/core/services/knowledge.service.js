const fs = require("fs");
const path = require("path");

const { STORAGE } = require("../../config/paths");
const { SCHEMAS } = require("../models/data-contract.model");

const knowledgePath = path.join(
    STORAGE,
    "knowledge.json"
);
function loadKnowledge() {

    if (!fs.existsSync(knowledgePath)) {

        fs.writeFileSync(
            knowledgePath,
            JSON.stringify({}, null, 2)
        );

    }

    return JSON.parse(
        fs.readFileSync(knowledgePath, "utf-8")
    );

}

function saveKnowledge(data) {

    fs.writeFileSync(
        knowledgePath,
        JSON.stringify(data, null, 2)
    );

}
function detectFeature(filePath){
    const parts = filePath.split(/[\\/]/);
    const index = parts.indexOf("Scripts");
    if (index > 0 && parts.length > index + 1) {
        return parts[index + 1];
    }
    if (parts[0] === "devos"){
        return "DevOS";
    }
    return "General";
}

function updateKnowledge(entry) {

    const knowledge = loadKnowledge();

    entry.files.forEach(file => {

        const feature = detectFeature(file.file);

        if (!knowledge[feature]) {

            knowledge[feature] = {

                schemaVersion: SCHEMAS.knowledgeFeature,

                files: [],
                commits: [],
                updatedAt: "",
                updated: ""

            };

        }

        if (!knowledge[feature].files.includes(file.file)) {

            knowledge[feature].files.push(file.file);

        }

        if (!knowledge[feature].commits.includes(entry.commit)) {

            knowledge[feature].commits.push(entry.commit);

        }

        const updatedAt = entry.createdAt || entry.time;

        knowledge[feature].schemaVersion = knowledge[feature].schemaVersion || SCHEMAS.knowledgeFeature;
        knowledge[feature].updatedAt = updatedAt;
        knowledge[feature].updated = updatedAt;

    });

    saveKnowledge(knowledge);

}


module.exports = {

    loadKnowledge,

    saveKnowledge,
    
    detectFeature,
    
    updateKnowledge

};
