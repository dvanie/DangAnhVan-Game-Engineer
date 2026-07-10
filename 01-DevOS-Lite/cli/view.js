const { getAllLogs } = require("../core/services/memory.service");

function formatEntry(e) {
    const files = e.files.map(f => {
        return `  - ${f.file} [${f.status}]`;
    }).join("\n");

    return `
========================
🕒 ${e.time}
🧠 ${e.message}
🔗 ${e.commit}

📁 Files:
${files}

📊 Diff:
${e.diffStat}
========================
`;
}

function showAll() {
    const logs = getAllLogs();
    logs.forEach(e => console.log(formatEntry(e)));
}

function showLast(n = 5) {
    const logs = getAllLogs().slice(-n);
    logs.forEach(e => console.log(formatEntry(e)));
}

module.exports = {
    showAll,
    showLast,
};