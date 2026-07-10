const fs = require("fs");
const path = require("path");

const { STORAGE } = require("../../config/paths");
const { getAllLogs } = require("../services/memory.service");
const { loadKnowledge } = require("../services/knowledge.service");

function loadDependencies() {
    const depPath = path.join(STORAGE, "dependencies.json");

    if (!fs.existsSync(depPath)) return {};

    return JSON.parse(fs.readFileSync(depPath, "utf-8"));
}

function detectFeatureFromFile(filePath, knowledge) {
    for (const feature of Object.keys(knowledge)) {
        if (knowledge[feature].files.includes(filePath)) {
            return feature;
        }
    }

    return "Unknown";
}

function contextExists(feature) {
    const contextPath = path.join(
        STORAGE,
        "contexts",
        `${feature}.context.json`
    );

    return fs.existsSync(contextPath);
}

function showResume() {
    const logs = getAllLogs();
    const knowledge = loadKnowledge();
    const dependencies = loadDependencies();

    const last = logs[logs.length - 1];

    console.log("🚀 DevOS Smart Resume");
    console.log("====================");

    if (!last) {
        console.log("\nNo logs found.");
        return;
    }

    const changedFiles = last.files.map(f => f.file);

    const features = [...new Set(
        changedFiles.map(file => detectFeatureFromFile(file, knowledge))
    )];

    console.log("\n🧠 Last Work");
    console.log(last.message);

    console.log("\n🔗 Commit");
    console.log(last.commit.substring(0, 8));

    console.log("\n📦 Recent Features");
    features.forEach(feature => {
        console.log(`- ${feature}`);
    });

    console.log("\n📁 Changed Files");
    last.files.forEach(file => {
        console.log(`- ${file.file} [${file.status}]`);
    });

    console.log("\n🫀 Related Dependencies");
    features.forEach(feature => {
        const dep = dependencies[feature];

        if (!dep || dep.dependsOn.length === 0) {
            console.log(`- ${feature}: No dependencies found.`);
        }
        else {
            console.log(`- ${feature}: ${dep.dependsOn.join(", ")}`);
        }
    });

    console.log("\n📦 Context Status");
    features.forEach(feature => {
        if (feature === "Unknown") {
            console.log("- Unknown: No context.");
            return;
        }

        console.log(
            contextExists(feature)
                ? `- ${feature}: Context exists.`
                : `- ${feature}: Context missing. Run compile --all.`
        );
    });

    console.log("\n👉 Suggested Next Step");

    const mainFeature = features[0];

    if (mainFeature === "Unknown") {
        console.log("Run discovery, dependency, then compile --all to update DevOS knowledge.");
    }
    else if (!contextExists(mainFeature)) {
        console.log(`Run: node devos compile --all`);
    }
    else {
        console.log(`Continue working on ${mainFeature}. Check its context before coding.`);
        console.log(`Run: node devos context ${mainFeature.toLowerCase()}`);
    }
}

module.exports = {
    showResume
};