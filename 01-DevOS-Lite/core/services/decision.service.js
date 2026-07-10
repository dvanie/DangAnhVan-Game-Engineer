const fs = require("fs");
const path = require("path");

const { STORAGE } = require("../../config/paths");
const { SCHEMAS, nowIso } = require("../models/data-contract.model");

const decisionPath = path.join(STORAGE, "decisions.json");

function loadDecisions() {

    if (!fs.existsSync(decisionPath)) {
        fs.writeFileSync(decisionPath, JSON.stringify([], null, 2));
    }

    return JSON.parse(fs.readFileSync(decisionPath, "utf-8"));

}

function saveDecisions(data) {

    fs.writeFileSync(
        decisionPath,
        JSON.stringify(data, null, 2)
    );

}

function addDecision(title, reason) {

    const decisions = loadDecisions();
    const createdAt = nowIso();

    const entry = {
        schemaVersion: SCHEMAS.decision,
        title,
        reason,
        createdAt,
        time: createdAt
    };

    decisions.push(entry);

    saveDecisions(decisions);

    console.log("✔ Decision saved");

}

function showDecisions() {

    const decisions = loadDecisions();

    console.log("🧠 DevOS Decisions");
    console.log("==================");

    if (decisions.length === 0) {
        console.log("\nNo decisions found.");
        return;
    }

    decisions.forEach((d, i) => {
        console.log(`\n${i + 1}. ${d.title}`);
        console.log(`Reason: ${d.reason}`);
        console.log(`Time: ${d.createdAt || d.time}`);
    });

}

module.exports = {
    loadDecisions,
    saveDecisions,
    addDecision,
    showDecisions
};
