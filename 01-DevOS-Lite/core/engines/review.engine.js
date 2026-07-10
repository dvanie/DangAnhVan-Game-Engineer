const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");

const CURRENT_TASK_PATH = path.join(__dirname, "..", "..", "tasks", "current.md");
const REPORT_PATH = path.join(__dirname, "..", "..", "tasks", "report.md");
const PROJECT_ROOT = path.join(__dirname, "..", "..", "..");

const REQUIRED_SECTIONS = [
    {
        name: "Summary",
        expectedShapePattern: /(^|\n)\s*-\s*summary\s*($|\n)/i,
        reportPattern: /(^|\n)\s*#{1,6}\s*summary\s*($|\n)|(^|\n)\s*summary\s*:\s*/i
    },
    {
        name: "Changed Files",
        expectedShapePattern: /(^|\n)\s*-\s*changedFiles\s*($|\n)|(^|\n)\s*-\s*changed files\s*($|\n)/i,
        reportPattern: /(^|\n)\s*#{1,6}\s*changed files\s*($|\n)|(^|\n)\s*changed files\s*:\s*/i
    },
    {
        name: "Rationale",
        expectedShapePattern: /(^|\n)\s*-\s*rationale\s*($|\n)/i,
        reportPattern: /(^|\n)\s*#{1,6}\s*(rationale|root cause|design decision)\s*($|\n)|(^|\n)\s*(rationale|root cause|design decision)\s*:\s*/i
    },
    {
        name: "Verification Commands",
        expectedShapePattern: /(^|\n)\s*-\s*verificationCommands\s*($|\n)|(^|\n)\s*-\s*verification commands\s*($|\n)/i,
        reportPattern: /(^|\n)\s*#{1,6}\s*verification commands\s*($|\n)|(^|\n)\s*verification commands\s*:\s*/i
    },
    {
        name: "Remaining Risks",
        expectedShapePattern: /(^|\n)\s*-\s*remainingRisks\s*($|\n)|(^|\n)\s*-\s*remaining risks\s*($|\n)/i,
        reportPattern: /(^|\n)\s*#{1,6}\s*remaining risks\s*($|\n)|(^|\n)\s*remaining risks\s*:\s*/i
    }
];

const SCOPE_RULES = [
    {
        restriction: "No AI",
        restrictionPattern: /\bno\s+ai\b|\bno\s+ai\s+call\b/i,
        reportPatterns: [
            /\bcalled\s+ai\b/i,
            /\bused\s+openai\b/i,
            /\bused\s+claude\b/i,
            /\bused\s+gemini\b/i,
            /\bused\s+api\b/i
        ]
    },
    {
        restriction: "No API",
        restrictionPattern: /\bno\s+api\b|\bno\s+api\s+call\b/i,
        reportPatterns: [
            /\bcalled\s+api\b/i,
            /\bapi\s+request\b/i,
            /\bfetched\s+from\s+api\b/i
        ]
    },
    {
        restriction: "No compile",
        restrictionPattern: /\bno\s+compile\b/i,
        reportPatterns: [
            /\bcompiled\b/i,
            /\bbuild\s+succeeded\b/i,
            /\bran\s+build\b/i,
            /\bbuilt\s+project\b/i
        ]
    },
    {
        restriction: "No source scan",
        restrictionPattern: /\bno\s+source\s+scan\b|\bno\s+source\s+scanning\b/i,
        reportPatterns: [
            /\bscanned\s+entire\s+project\b/i,
            /\bscanned\s+all\s+files\b/i,
            /\bsearched\s+whole\s+repo\b/i
        ]
    },
    {
        restriction: "No storage mutation",
        restrictionPattern: /\bno\s+storage\s+mutation\b|\bno\s+storage\s+write\b/i,
        reportPatterns: [
            /\bwrote\s+storage\b/i,
            /\bmodified\s+storage\b/i,
            /\bchanged\s+schema\b/i,
            /\bmigrated\s+storage\b/i
        ]
    },
    {
        restriction: "Read only",
        restrictionPattern: /\bread[- ]only\b/i,
        reportPatterns: [
            /\bwrote\s+file\b/i,
            /\bcreated\s+file\b/i,
            /\bmodified\s+file\b/i
        ]
    },
    {
        restriction: "No file write",
        restrictionPattern: /\bno\s+file\s+write\b|\bno\s+file\s+writing\b/i,
        reportPatterns: [
            /\bwrote\s+file\b/i,
            /\bcreated\s+file\b/i,
            /\bmodified\s+file\b/i
        ]
    }
];

const RISK_ZONES = [
    {
        name: "Runtime",
        pattern: /^Assets\/Scripts\/Runtime(\/|$)/i
    },
    {
        name: "Army",
        pattern: /^Assets\/Scripts\/Army(\/|$)/i
    },
    {
        name: "Summon",
        pattern: /^Assets\/Scripts\/Summon(\/|$)/i
    },
    {
        name: "Soul",
        pattern: /^Assets\/Scripts\/Soul(\/|$)/i
    },
    {
        name: "Collection",
        pattern: /^Assets\/Scripts\/Collection(\/|$)/i
    },
    {
        name: "GameManager",
        pattern: /(^|\/)GameManager\.cs$/i
    },
    {
        name: "Unity Scene",
        pattern: /^Assets\/Scenes\/.*\.unity$/i
    },
    {
        name: "Unity Project Settings",
        pattern: /^ProjectSettings\//i
    },
    {
        name: "Package Manifest / Lock",
        pattern: /^Packages\/(manifest\.json|packages-lock\.json)$/i
    }
];

function runReview(args) {

    const options = parseReviewOptions(args);

    if (!fs.existsSync(CURRENT_TASK_PATH)) {
        console.log("DevOS Task Review");
        console.log("================");
        console.log("");
        console.log("No current task found.");
        console.log("");
        console.log("Run:");
        console.log('node devos task "<task>" --save');
        return;
    }

    if (!fs.existsSync(REPORT_PATH)) {
        console.log("DevOS Task Review");
        console.log("================");
        console.log("");
        console.log("No completion report found.");
        console.log("");
        console.log("Create:");
        console.log("devos/tasks/report.md");
        return;
    }

    let currentTask = "";
    let completionReport = "";

    try {
        currentTask = fs.readFileSync(CURRENT_TASK_PATH, "utf8");
    }
    catch (error) {
        console.log("DevOS Task Review");
        console.log("================");
        console.log("");
        console.log("Unable to read current task.");
        console.log(error.message);
        return;
    }

    try {
        completionReport = fs.readFileSync(REPORT_PATH, "utf8");
    }
    catch (error) {
        console.log("DevOS Task Review");
        console.log("================");
        console.log("");
        console.log("Unable to read completion report.");
        console.log(error.message);
        return;
    }

    const diffReview = options.diff
        ? buildDiffReview(completionReport)
        : null;
    const expectedShapeExists = /(^|\n)\s*#{1,6}\s*expected report shape\s*($|\n)/i.test(currentTask);
    const found = [];
    const missing = [];
    const missingExpectedShape = [];

    REQUIRED_SECTIONS.forEach(section => {
        if (!section.expectedShapePattern.test(currentTask)) {
            missingExpectedShape.push(section.name);
        }

        if (section.reportPattern.test(completionReport)) {
            found.push(section.name);
        }
        else {
            missing.push(section.name);
        }
    });

    const scopeWarnings = findScopeWarnings(currentTask, completionReport);
    const hasStructuralWarnings = !expectedShapeExists || missingExpectedShape.length > 0 || missing.length > 0;
    const hasWarnings = hasStructuralWarnings ||
        scopeWarnings.length > 0 ||
        (diffReview && diffReview.warnings.length > 0);
    const status = hasStructuralWarnings
        ? "FAIL"
        : hasWarnings
            ? "PASS WITH WARNING"
            : "PASS";

    printReviewResult({
        status: options.diff ? status : hasWarnings ? "WARN" : "PASS",
        expectedShapeExists,
        found,
        missing,
        missingExpectedShape,
        scopeWarnings,
        diffReview
    });

}

function parseReviewOptions(args) {

    const input = Array.isArray(args) ? args : [];

    return {
        diff: input.includes("--diff")
    };

}

function printReviewResult(result) {

    console.log("DevOS Task Review");
    console.log("================");
    console.log("");
    console.log("Review Result");
    console.log("");
    console.log(result.status);
    console.log("");

    if (!result.expectedShapeExists) {
        console.log("Warnings:");
        console.log("- Expected Report Shape section is missing from current task.");
        console.log("");
    }

    if (result.missingExpectedShape.length > 0) {
        console.log("Expected Report Shape missing:");
        result.missingExpectedShape.forEach(section => {
            console.log(`- ${section}`);
        });
        console.log("");
    }

    console.log("Required sections:");
    REQUIRED_SECTIONS.forEach(section => {
        const marker = result.found.includes(section.name) ? "OK" : "Missing";
        console.log(`- ${section.name}: ${marker}`);
    });

    if (result.missing.length > 0) {
        console.log("");
        console.log("Missing:");
        result.missing.forEach(section => {
            console.log(`- ${section}`);
        });
    }

    console.log("");
    if (result.scopeWarnings.length > 0) {
        console.log("Scope Warnings:");
        result.scopeWarnings.forEach(warning => {
            console.log(`- Report mentions "${warning.phrase}", but task restriction says ${warning.restriction}.`);
        });
    }
    else {
        console.log("Scope Checks:");
        console.log("- No obvious scope drift.");
    }

    if (result.diffReview) {
        printDiffReview(result.diffReview);
    }

    console.log("");
    console.log("Review Rule:");
    console.log("Structural report validation only.");
    console.log("Scope checks are conservative phrase checks only.");
    console.log("No AI.");
    console.log("No compile.");
    console.log("No source scanning.");
    console.log("No storage mutation.");

}

function printDiffReview(diffReview) {

    console.log("");
    console.log("Diff Review:");

    if (diffReview.gitWarning) {
        console.log(diffReview.gitWarning);
    }

    console.log("Changed Files:");
    if (diffReview.changedFiles.length === 0) {
        console.log("- None");
    }
    else {
        diffReview.changedFiles.forEach(file => console.log(`- ${file}`));
    }

    console.log("");
    console.log("Report Coverage:");
    if (diffReview.coverageMessages.length === 0) {
        console.log("- All changed files listed.");
    }
    else {
        diffReview.coverageMessages.forEach(message => console.log(`- ${message}`));
    }

    console.log("");
    console.log("Risk Check:");
    diffReview.riskChecks.forEach(check => {
        const marker = check.touched ? "WARNING" : "OK";
        console.log(`- ${check.name}: ${marker}`);
    });

    console.log("");
    console.log("Unity Files:");
    if (diffReview.unityFiles.length === 0) {
        console.log("- None");
    }
    else {
        diffReview.unityFiles.forEach(file => console.log(`- ${file}`));
    }

    if (diffReview.warnings.length > 0) {
        console.log("");
        console.log("Warnings:");
        diffReview.warnings.forEach(warning => console.log(`- ${warning}`));
    }

}

function buildDiffReview(report) {

    const gitResult = readGitChangedFiles();
    const changedFiles = gitResult.files;
    const reportFiles = extractChangedFilesFromReport(report);
    const missingFromReport = changedFiles.filter(file => !reportFiles.includes(file));
    const missingFromGit = reportFiles.filter(file => !changedFiles.includes(file));
    const unityFiles = changedFiles.filter(isUnityFile);
    const riskChecks = RISK_ZONES.map(zone => ({
        name: zone.name,
        touched: changedFiles.some(file => zone.pattern.test(file))
    }));
    const coverageMessages = [];
    const warnings = [];

    if (gitResult.warning) {
        warnings.push(gitResult.warning);
    }

    if (changedFiles.length === 0) {
        warnings.push("No changed files detected from git diff.");
    }

    missingFromReport.forEach(file => {
        const message = `Changed file not listed in report: ${file}`;
        coverageMessages.push(message);
        warnings.push(message);
    });

    missingFromGit.forEach(file => {
        const message = `Report lists file not currently changed: ${file}`;
        coverageMessages.push(message);
        warnings.push(message);
    });

    unityFiles.forEach(file => {
        warnings.push(`${file} is a Unity file. Confirm this was intentional.`);
    });

    return {
        changedFiles,
        reportFiles,
        missingFromReport,
        missingFromGit,
        unityFiles,
        riskChecks,
        coverageMessages,
        warnings: dedupeStrings(warnings),
        gitWarning: gitResult.warning
    };

}

function readGitChangedFiles() {

    try {
        const unstaged = runGitNameOnly(["diff", "--name-only"]);
        const staged = runGitNameOnly(["diff", "--cached", "--name-only"]);

        return {
            files: dedupeStrings(unstaged.concat(staged)).sort(),
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

function extractChangedFilesFromReport(report) {

    const section = extractSection(report, "Changed Files");

    if (!section) {
        return [];
    }

    return dedupeStrings(section
        .split(/\r?\n/)
        .map(line => {
            const bullet = line.match(/^\s*(?:[-*+]|\d+\.)\s+(.+?)\s*$/);
            const value = bullet ? bullet[1] : "";

            return normalizeReportedPath(value);
        })
        .filter(Boolean));

}

function extractSection(markdown, title) {

    const lines = markdown.split(/\r?\n/);
    const headingPattern = new RegExp(`^\\s*#{1,6}\\s*${escapeRegExp(title)}\\s*$`, "i");
    const labelPattern = new RegExp(`^\\s*${escapeRegExp(title)}\\s*:\\s*$`, "i");
    let start = -1;

    for (let index = 0; index < lines.length; index += 1) {
        if (headingPattern.test(lines[index]) || labelPattern.test(lines[index])) {
            start = index + 1;
            break;
        }
    }

    if (start === -1) {
        return "";
    }

    const sectionLines = [];

    for (let index = start; index < lines.length; index += 1) {
        if (/^\s*#{1,6}\s+\S/.test(lines[index]) || /^[A-Za-z][A-Za-z ]+:\s*$/.test(lines[index])) {
            break;
        }

        sectionLines.push(lines[index]);
    }

    return sectionLines.join("\n");

}

function normalizeReportedPath(value) {

    return normalizePath(value
        .replace(/^`+|`+$/g, "")
        .replace(/^["']|["']$/g, "")
        .trim());

}

function normalizePath(value) {

    return String(value || "")
        .replace(/\\/g, "/")
        .replace(/^\.\//, "")
        .trim();

}

function isUnityFile(file) {

    return /\.unity$/i.test(file) ||
        /\.prefab$/i.test(file) ||
        /\.asset$/i.test(file) ||
        /^ProjectSettings\//i.test(file) ||
        /^Packages\//i.test(file);

}

function findScopeWarnings(currentTask, completionReport) {

    const warnings = [];

    SCOPE_RULES.forEach(rule => {
        if (!rule.restrictionPattern.test(currentTask)) {
            return;
        }

        rule.reportPatterns.forEach(pattern => {
            const match = completionReport.match(pattern);

            if (match) {
                warnings.push({
                    restriction: rule.restriction,
                    phrase: match[0]
                });
            }
        });
    });

    return dedupeWarnings(warnings);

}

function dedupeWarnings(warnings) {

    const seen = new Set();

    return warnings.filter(warning => {
        const key = `${warning.restriction}:${warning.phrase.toLowerCase()}`;

        if (seen.has(key)) {
            return false;
        }

        seen.add(key);
        return true;
    });

}

function dedupeStrings(items) {

    return Array.from(new Set(items.filter(Boolean)));

}

function escapeRegExp(value) {

    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

}

module.exports = {
    runReview
};
