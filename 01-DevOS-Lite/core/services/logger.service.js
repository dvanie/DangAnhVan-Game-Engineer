function logCommit() {

    const { execSync } = require("child_process");
    const { saveLog, getLastLog } = require("./memory.service");
    const { updateKnowledge } = require("./knowledge.service");
    const { SCHEMAS, nowIso } = require("../models/data-contract.model");

    function runCommand(cmd) {
        return execSync(cmd).toString().trim();
    }

    function getTag(message) {

        const msg = message.toLowerCase();

        if (msg.includes("fix") || msg.includes("bug"))
            return "🐛 bugfix";

        if (msg.includes("add") || msg.includes("create"))
            return "✨ feature";

        if (msg.includes("refactor"))
            return "🔧 refactor";

        if (msg.includes("optimize") || msg.includes("performance"))
            return "⚡ performance";

        if (msg.includes("remove") || msg.includes("delete"))
            return "🧹 cleanup";

        return "📦 general";

    }

    const hash = runCommand("git rev-parse HEAD");
    const message = runCommand("git log -1 --pretty=%B");
    const time = nowIso();

    const rawFiles = runCommand(
        "git diff-tree --no-commit-id --name-status -r HEAD"
    );

    const files = rawFiles
        .split("\n")
        .filter(Boolean)
        .map(line => {

            const [status, file] = line.split("\t");

            return {
                file,
                status
            };

        });

    let diffStat = "";

    try {

        diffStat = runCommand(
            "git diff --stat HEAD~1 HEAD"
        );

    } catch {

        diffStat = "Initial Commit";

    }

    const entry = {

        schemaVersion: SCHEMAS.logEntry,

        commit: hash,

        message,

        createdAt: time,

        time,

        tag: getTag(message),

        files,

        diffStat

    };

    const last = getLastLog();

    if (!last || last.commit !== entry.commit) {

        saveLog(entry);

        updateKnowledge(entry);

        console.log("✔ Knowledge Updated");

    }
    else {

        console.log("ℹ Commit already logged.");

    }
    
    
}

module.exports = {
    logCommit,
};
