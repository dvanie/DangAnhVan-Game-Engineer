const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");
const impactEngine = require("./impact.engine");

const PROJECT_ROOT = path.join(__dirname, "..", "..", "..");
const TASKS_DIR = path.join(__dirname, "..", "..", "tasks");
const CURRENT_TASK_PATH = path.join(TASKS_DIR, "current.md");
const REPORT_PATH = path.join(TASKS_DIR, "report.md");

function runReport(args) {

    const options = parseReportOptions(args);
    const report = generateTaskReport();
    const markdown = renderMarkdown(report);

    if (options.save) {
        try {
            fs.mkdirSync(TASKS_DIR, { recursive: true });
            fs.writeFileSync(REPORT_PATH, markdown, "utf8");

            console.log("Task Report Generated");
            console.log("");
            console.log("Saved:");
            console.log("");
            console.log("devos/tasks/report.md");
        }
        catch (error) {
            console.log("Task Report");
            console.log("===========");
            console.log("");
            console.log("Unable to save report.");
            console.log(error.message);
        }

        return;
    }

    console.log(markdown);

}

function generateTaskReport() {

    const currentTask = readCurrentTask();
    const taskName = extractTaskName(currentTask);
    const query = taskName || "";
    const impact = query ? impactEngine.buildImpact(query) : null;
    const changedFiles = readGitChangedFiles();
    const reportFiles = changedFiles.files;
    const verificationCommands = buildVerificationCommands(currentTask, impact);
    const remainingRisks = buildRemainingRisks(changedFiles, impact);

    return {
        title: "Task Report",
        summary: buildSummary(taskName, reportFiles, impact),
        changedFiles: reportFiles,
        rationale: buildRationale(taskName, impact),
        verificationCommands,
        remainingRisks,
        impactSummary: buildImpactSummary(impact),
        metadata: {
            generatedAt: new Date().toISOString(),
            source: "devos-report-engine",
            currentTask: taskName || "Unknown",
            gitWarning: changedFiles.warning
        }
    };

}

function buildSummary(taskName, changedFiles, impact) {

    const lines = [];

    if (taskName) {
        lines.push(`Generated deterministic completion report for task: ${taskName}.`);
    }
    else {
        lines.push("Summary unavailable.");
    }

    if (changedFiles.length > 0) {
        lines.push(`Detected ${changedFiles.length} changed file(s) from Git diff/report output.`);
    }

    if (impact && impact.hasStrongMatch) {
        lines.push(`Impact context resolved to ${impact.relevantFeatures.length} relevant feature(s).`);
    }
    else if (impact) {
        lines.push("No strong feature match found for impact context.");
    }

    return lines;

}

function buildRationale(taskName, impact) {

    const lines = [
        "Report generated from deterministic DevOS facts: current task metadata, Git diff, impact analysis, and risk profile."
    ];

    if (taskName) {
        lines.push(`Current task used as report context: ${taskName}.`);
    }

    if (impact && impact.hasStrongMatch) {
        lines.push("Impact and risk sections reuse existing DevOS engines.");
    }
    else {
        lines.push("No feature-specific rationale available because no strong feature match was found.");
    }

    return lines;

}

function buildVerificationCommands(currentTask, impact) {

    const commands = [
        ...extractCommandBlocks(currentTask, "Suggested Verification"),
        ...extractCommandBlocks(currentTask, "Verification Commands")
    ];

    if (impact && impact.riskProfile) {
        commands.push(...(impact.riskProfile.recommendedVerification || []));
    }

    commands.push("node devos review --diff");
    commands.push("git diff --check");

    return unique(commands);

}

function buildRemainingRisks(changedFiles, impact) {

    const risks = [
        "Generated report uses deterministic metadata only.",
        "No semantic source analysis was performed."
    ];

    if (changedFiles.warning) {
        risks.push(changedFiles.warning);
    }

    if (impact && impact.riskProfile) {
        (impact.riskProfile.reasons || []).forEach(reason => {
            risks.push(reason);
        });
    }

    risks.push("Git line-ending warnings may appear on Windows.");

    return unique(risks);

}

function buildImpactSummary(impact) {

    if (!impact || !impact.hasStrongMatch) {
        return {
            relevantFeatures: [],
            likelyImpact: [],
            touches: [],
            riskLevel: "Low",
            avoid: []
        };
    }

    return {
        relevantFeatures: impact.relevantFeatures || [],
        likelyImpact: impact.likelyImpact || [],
        touches: (impact.riskProfile || {}).touches || [],
        riskLevel: (impact.riskProfile || {}).level || "Low",
        avoid: (impact.riskProfile || {}).avoid || []
    };

}

function renderMarkdown(report) {

    const lines = [];

    lines.push(`# ${report.title}`);
    lines.push("");
    lines.push("## Summary");
    listOrFallback(lines, report.summary, "Summary unavailable.");
    lines.push("");
    lines.push("## Changed Files");
    listOrFallback(lines, report.changedFiles, "None");
    lines.push("");
    lines.push("## Rationale");
    listOrFallback(lines, report.rationale, "No deterministic rationale available.");
    lines.push("");
    lines.push("## Verification Commands");
    listOrFallback(lines, report.verificationCommands, "None");
    lines.push("");
    lines.push("## Remaining Risks");
    listOrFallback(lines, report.remainingRisks, "None");
    lines.push("");
    lines.push("## Impact Summary");
    lines.push("");
    lines.push(`Risk Level: ${report.impactSummary.riskLevel}`);
    lines.push("");
    lines.push("Relevant Features:");
    listOrFallback(lines, report.impactSummary.relevantFeatures, "None");
    lines.push("");
    lines.push("Likely Impact:");
    listImpactsOrFallback(lines, report.impactSummary.likelyImpact);
    lines.push("");
    lines.push("Touches:");
    listOrFallback(lines, report.impactSummary.touches, "None");
    lines.push("");
    lines.push("Avoid Touching:");
    listOrFallback(lines, report.impactSummary.avoid, "None");
    lines.push("");
    lines.push("## Metadata");
    lines.push(`- Generated At: ${report.metadata.generatedAt}`);
    lines.push(`- Source: ${report.metadata.source}`);
    lines.push(`- Current Task: ${report.metadata.currentTask}`);

    if (report.metadata.gitWarning) {
        lines.push(`- Git Warning: ${report.metadata.gitWarning}`);
    }

    return `${lines.join("\n")}\n`;

}

function readCurrentTask() {

    try {
        return fs.existsSync(CURRENT_TASK_PATH)
            ? fs.readFileSync(CURRENT_TASK_PATH, "utf8")
            : "";
    }
    catch (error) {
        return "";
    }

}

function readGitChangedFiles() {

    try {
        const unstaged = runGitNameOnly(["diff", "--name-only"]);
        const staged = runGitNameOnly(["diff", "--cached", "--name-only"]);

        return {
            files: unique(unstaged.concat(staged)).sort(),
            warning: ""
        };
    }
    catch (error) {
        return {
            files: [],
            warning: `Git diff unavailable: ${error.message}`
        };
    }

}

function runGitNameOnly(args) {

    const output = childProcess.execFileSync("git", args, {
        cwd: PROJECT_ROOT,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"]
    });

    return output
        .split(/\r?\n/)
        .map(normalizePath)
        .filter(Boolean);

}

function extractTaskName(markdown) {

    const section = extractSection(markdown, "Task");
    const firstLine = section
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean)[0];

    return firstLine || "";

}

function extractCommandBlocks(markdown, sectionTitle) {

    const section = extractSection(markdown, sectionTitle);
    const commands = [];
    const fencePattern = /```(?:bash|sh|shell)?\s*([\s\S]*?)```/gi;
    let match = fencePattern.exec(section);

    while (match) {
        match[1]
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(Boolean)
            .forEach(command => commands.push(command));

        match = fencePattern.exec(section);
    }

    section
        .split(/\r?\n/)
        .map(line => {
            const bullet = line.match(/^\s*(?:[-*+]|\d+\.)\s+(.+?)\s*$/);
            return bullet ? bullet[1].trim() : "";
        })
        .filter(Boolean)
        .forEach(command => commands.push(command));

    return commands;

}

function extractSection(markdown, title) {

    const lines = String(markdown || "").split(/\r?\n/);
    const headingPattern = new RegExp(`^\\s*#{1,6}\\s*${escapeRegExp(title)}\\s*$`, "i");
    let start = -1;

    for (let index = 0; index < lines.length; index += 1) {
        if (headingPattern.test(lines[index])) {
            start = index + 1;
            break;
        }
    }

    if (start === -1) {
        return "";
    }

    const sectionLines = [];

    for (let index = start; index < lines.length; index += 1) {
        if (/^\s*#{1,6}\s+\S/.test(lines[index])) {
            break;
        }

        sectionLines.push(lines[index]);
    }

    return sectionLines.join("\n");

}

function listOrFallback(lines, items, fallback) {

    if (!items || items.length === 0) {
        lines.push(`- ${fallback}`);
        return;
    }

    items.forEach(item => lines.push(`- ${item}`));

}

function listImpactsOrFallback(lines, impacts) {

    if (!impacts || impacts.length === 0) {
        lines.push("- None");
        return;
    }

    impacts.forEach(impact => {
        lines.push(`- ${impact.feature}: ${impact.reason}`);
    });

}

function parseReportOptions(args) {

    const input = Array.isArray(args) ? args : [];

    return {
        save: input.includes("--save"),
        output: input.includes("--output") ? input[input.indexOf("--output") + 1] : "markdown"
    };

}

function normalizePath(value) {

    return String(value || "")
        .replace(/\\/g, "/")
        .replace(/^\.\//, "")
        .trim();

}

function unique(items) {

    return [...new Set(items.filter(Boolean))];

}

function escapeRegExp(value) {

    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

}

module.exports = {
    generateTaskReport,
    renderMarkdown,
    runReport
};
