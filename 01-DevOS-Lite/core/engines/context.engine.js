const { compileFeature, showDependencyDetails, showArchitecture, showArchitectureIntelligence, showSummary, showContextQuality } = require("./compiler.engine");

function buildContext(featureName) {

    const compiled = compileFeature(featureName);

    if (!compiled) {
        console.log("❌ Feature not found.");
        return;
    }

    console.log("📦 DevOS Context Pack");
    console.log("====================");

    console.log("\nFeature:");
    console.log(compiled.feature);

    console.log("\nFiles:");
    compiled.files.forEach(file => {
        console.log(`- ${file}`);
    });

    console.log("\nCommits:");
    compiled.commits.forEach(commit => {
        console.log(`- ${commit.shortHash} | ${commit.message}`);
    });

    console.log("\nDecisions:");
    if (compiled.decisions.length === 0) {
        console.log("- No decisions recorded.");
    }
    else {
        compiled.decisions.forEach(d => {
            console.log(`- ${d.title}`);
            console.log(`  Reason: ${d.reason}`);
        });
    }

    console.log("\nDependencies:");
    if (!compiled.dependencies || compiled.dependencies.dependsOn.length === 0) {
        console.log("- No dependencies found.");
    }
    else {
        compiled.dependencies.dependsOn.forEach(dep => {
            console.log(`- ${dep}`);
        });
    }

    showDependencyDetails(compiled.dependencies.details);

    console.log("\nInsight:");
    console.log(`- Classes: ${compiled.insight.classCount}`);
    console.log(`- Methods: ${compiled.insight.methodCount}`);
    console.log(`- TODOs: ${compiled.insight.todoCount}`);

    console.log("- Public APIs:");
    if (compiled.insight.publicAPIs.length === 0) {
        console.log("  - None found.");
    }
    else {
        compiled.insight.publicAPIs.forEach(api => {
            console.log(`  - ${api}`);
        });
    }

    console.log("- Known References:");
    if (compiled.insight.knownReferences.length === 0) {
        console.log("  - None found.");
    }
    else {
        compiled.insight.knownReferences.forEach(reference => {
            console.log(`  - ${reference.className} (${reference.feature})`);
        });
    }

    console.log("- Risk Hints:");
    if (compiled.insight.riskHints.length === 0) {
        console.log("  - None found.");
    }
    else {
        compiled.insight.riskHints.forEach(hint => {
            console.log(`  - ${hint}`);
        });
    }

    showArchitecture(compiled.architecture);

    showArchitectureIntelligence(compiled.architecture);

    showSummary(compiled.summary);

    showContextQuality(compiled.quality);

    console.log("\nLast Updated:");
    console.log(compiled.updatedAt || compiled.updated);

    console.log("\nAI Instruction:");
    console.log(compiled.instruction);

}

module.exports = {
    buildContext
};
