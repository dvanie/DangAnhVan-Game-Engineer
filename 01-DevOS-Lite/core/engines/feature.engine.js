const { getAllLogs } = require("./memory.service");

/**
 * Xác định feature từ commit
 */
function detectFeature(entry) {

    const text = (
        entry.message +
        " " +
        entry.files.map(file => file.file).join(" ")
    ).toLowerCase();

    if (text.includes("player"))
        return "🎮 Player System";

    if (text.includes("inventory"))
        return "🎒 Inventory System";

    if (text.includes("ui"))
        return "🧭 UI System";

    if (
        text.includes("enemy") ||
        text.includes("ai")
    )
        return "🧠 AI / Enemy System";

    if (
        text.includes("weapon") ||
        text.includes("combat")
    )
        return "⚔️ Combat System";

    if (
        text.includes("map") ||
        text.includes("world")
    )
        return "🗺️ World System";

    return "📦 General System";

}

/**
 * Gom log theo Feature
 */
function groupByFeature() {

    const logs = getAllLogs();

    const groups = {};

    for (const entry of logs) {

        const feature = detectFeature(entry);

        if (!groups[feature]) {
            groups[feature] = [];
        }

        groups[feature].push(entry);

    }

    return groups;

}

/**
 * Hiển thị Feature
 */
function showFeatures() {

    const groups = groupByFeature();

    Object.entries(groups).forEach(([feature, commits]) => {

        console.log("\n=======================");

        console.log(feature);

        console.log("=======================");

        commits.forEach(commit => {

            console.log(`🧠 ${commit.message}`);

        });

    });

}

const args = process.argv.slice(2);

switch (args[0]) {

    case "all":

        showFeatures();

        break;

    default:

        console.log("Usage:");

        console.log("node devos feature all");

}