const { execSync } = require("child_process");
const { getAllLogs } = require("../services/memory.service");
const { loadKnowledge } = require("../services/knowledge.service");

function run(cmd) {
    try {
        return execSync(cmd).toString().trim();
    }
    catch {
        return "";
    }
}

function showStatus() {

    const branch = run("git branch --show-current");
    const lastCommit = run("git log -1 --pretty=%h");
    const lastMessage = run("git log -1 --pretty=%s");
    const changes = run("git status --short");

    const logs = getAllLogs();
    const knowledge = loadKnowledge();

    console.log("🩺 DevOS Status");
    console.log("================");

    console.log("\n🌿 Branch");
    console.log(branch || "unknown");

    console.log("\n🔗 Last Commit");
    console.log(`${lastCommit} - ${lastMessage}`);

    console.log("\n📦 Knowledge");
    console.log(`${Object.keys(knowledge).length} systems`);

    console.log("\n🧠 Logs");
    console.log(`${logs.length} commits logged`);

    console.log("\n📝 Working Tree");

    if (changes) {
        console.log(changes);
    }
    else {
        console.log("clean");
    }

}

module.exports = {
    showStatus
};