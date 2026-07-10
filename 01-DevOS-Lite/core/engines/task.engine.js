const fs = require("fs");
const path = require("path");
const contextPipeline = require("../pipelines/context.pipeline");
const promptPackageBuilder = require("../builders/prompt-package.builder");
const agentTaskPackageBuilder = require("../builders/agent-task-package.builder");

const DEFAULT_BUDGET = "medium";
const VALID_BUDGETS = ["small", "medium", "full"];
const DEFAULT_FORMAT = "terminal";
const VALID_FORMATS = ["terminal", "markdown", "md"];
const DEFAULT_SIZE = "medium";
const VALID_SIZES = ["small", "medium", "large"];
const TASK_OUTPUT_PATH = path.join(__dirname, "..", "..", "tasks", "current.md");
const SIZE_PROFILES = {
    small: {
        label: "Small",
        workflow: [
            "Use DevOS ask to narrow context.",
            "Make the smallest local change.",
            "Review the diff before handoff."
        ],
        verification: [
            "node devos ask \"<task keywords>\"",
            "git diff --check",
            "node devos review --diff"
        ],
        reminder: "Keep the change localized. Compile is optional unless the edit affects runtime behavior."
    },
    medium: {
        label: "Medium",
        workflow: [
            "Compile current project intelligence.",
            "Use DevOS ask to read feature-local context.",
            "Implement scoped gameplay changes.",
            "Review diff coverage before handoff."
        ],
        verification: [
            "node devos compile --all",
            "node devos ask \"<task keywords>\"",
            "git diff --check",
            "node devos review --diff"
        ],
        reminder: "Default feature-local workflow. Keep changes inside the relevant feature boundary."
    },
    large: {
        label: "Large",
        workflow: [
            "Compile current project intelligence.",
            "Review architecture summary before coding.",
            "Use DevOS ask to focus context.",
            "Confirm scope before touching cross-system files.",
            "Review diff coverage before handoff."
        ],
        verification: [
            "node devos compile --all",
            "node devos architecture summary",
            "node devos ask \"<task keywords>\"",
            "git diff --check",
            "node devos review --diff"
        ],
        reminder: "Large task detected. Confirm scope before coding."
    }
};

function showAgentTaskPackage(args) {

    const parsed = parseTaskInput(args);

    if (!parsed.query) {
        console.log("Usage:");
        console.log('node devos task "fix summon slot bug"');
        console.log('node devos task "summon flow" --budget small');
        console.log('node devos task "summon flow" --size small');
        return;
    }

    if (parsed.error) {
        console.log(parsed.error);
        return;
    }

    if (parsed.warnings.length > 0) {
        parsed.warnings.forEach(warning => console.log(warning));
    }

    const contextObject = contextPipeline.buildContextObject(parsed.query, parsed.budget);

    if (contextObject.contexts.length === 0) {
        console.log("Context not compiled.");
        console.log("");
        console.log("Run:");
        console.log("");
        console.log("node devos compile --all");
        return;
    }

    const promptPackage = promptPackageBuilder.buildPromptPackage(contextObject);
    const agentTaskPackage = agentTaskPackageBuilder.buildAgentTaskPackage(promptPackage);
    const markdown = renderAgentTaskPackageMarkdown(agentTaskPackage, contextObject, parsed.size);

    if (parsed.format === "markdown") {
        console.log(markdown);
    }
    else {
        printAgentTaskPackage(agentTaskPackage, contextObject, parsed.size);
    }

    if (parsed.save) {
        saveCurrentTask(markdown);
    }

}

function parseTaskInput(input) {

    const args = Array.isArray(input)
        ? input
        : String(input || "").split(/\s+/).filter(Boolean);
    const queryParts = [];
    let budget = DEFAULT_BUDGET;
    let format = DEFAULT_FORMAT;
    let size = DEFAULT_SIZE;
    let save = false;
    let error = "";
    const warnings = [];

    for (let index = 0; index < args.length; index += 1) {
        const arg = args[index];

        if (arg === "--budget") {
            const value = (args[index + 1] || "").toLowerCase();

            if (VALID_BUDGETS.includes(value)) {
                budget = value;
                index += 1;
            }
            else {
                warnings.push(`Invalid budget "${value || "(missing)"}". Falling back to medium.`);
                budget = DEFAULT_BUDGET;

                if (value) {
                    index += 1;
                }
            }
        }
        else if (arg === "--format") {
            const value = (args[index + 1] || "").toLowerCase();

            if (VALID_FORMATS.includes(value)) {
                format = value === "md" ? "markdown" : value;
                index += 1;
            }
            else {
                warnings.push(`Invalid format "${value || "(missing)"}". Falling back to terminal.`);
                format = DEFAULT_FORMAT;

                if (value) {
                    index += 1;
                }
            }
        }
        else if (arg === "--save") {
            save = true;
        }
        else if (arg === "--size") {
            const value = (args[index + 1] || "").toLowerCase();

            if (VALID_SIZES.includes(value)) {
                size = value;
                index += 1;
            }
            else {
                error = [
                    `Invalid task size: ${value || "(missing)"}`,
                    "Allowed values: small, medium, large"
                ].join("\n");

                if (value) {
                    index += 1;
                }
            }
        }
        else {
            queryParts.push(arg);
        }
    }

    return {
        query: queryParts.join(" ").trim(),
        budget,
        format,
        size,
        save,
        error,
        warnings
    };

}

function printAgentTaskPackageMarkdown(agentTaskPackage, contextObject, size = DEFAULT_SIZE) {

    console.log(renderAgentTaskPackageMarkdown(agentTaskPackage, contextObject, size));

}

function renderAgentTaskPackageMarkdown(agentTaskPackage, contextObject, size = DEFAULT_SIZE) {

    const task = agentTaskPackage.task || {};
    const metadata = agentTaskPackage.metadata || {};
    const sizeProfile = getSizeProfile(size);
    const lines = [];

    lines.push("# DevOS Agent Task Package");
    lines.push("");
    lines.push("## Task");
    lines.push("");
    lines.push(task.query || "Unknown");
    lines.push("");
    lines.push("## Budget");
    lines.push("");
    lines.push(task.budget || metadata.budget || "medium");
    lines.push("");
    lines.push("## Confidence");
    lines.push("");
    lines.push(task.confidence || metadata.confidence || "Low");
    lines.push("");
    lines.push("## Task Size");
    lines.push("");
    lines.push(sizeProfile.label);
    lines.push("");
    lines.push("## Relevant Features");
    lines.push("");

    if (!task.relevantFeatures || task.relevantFeatures.length === 0) {
        lines.push("No relevant context found.");
    }
    else {
        task.relevantFeatures.forEach(feature => {
            lines.push(`- ${feature.name}`);
        });
    }

    lines.push("");
    lines.push("## Workflow");
    lines.push("");
    (agentTaskPackage.workflow || []).forEach((stage, index) => {
        lines.push(`${index + 1}. ${stage.stage}`);
        lines.push(`   ${stage.description}`);
    });

    lines.push("");
    lines.push("## Restrictions");
    lines.push("");
    buildRestrictionLines(agentTaskPackage.restrictions || {}).forEach(line => lines.push(line));

    lines.push("");
    lines.push("## Verification Commands");
    lines.push("");
    addMarkdownCommandBlocks(lines, (agentTaskPackage.verification || {}).recommendedCommands || []);

    lines.push("");
    lines.push("## Suggested Workflow");
    lines.push("");
    sizeProfile.workflow.forEach((step, index) => {
        lines.push(`${index + 1}. ${step}`);
    });

    lines.push("");
    lines.push("## Suggested Verification");
    lines.push("");
    addMarkdownCommandBlocks(lines, sizeProfile.verification);

    lines.push("");
    lines.push("## Scope Reminder");
    lines.push("");
    lines.push(sizeProfile.reminder);

    lines.push("");
    lines.push("## Context Behavior Checks");
    lines.push("");
    addMarkdownCommandBlocks(lines, (agentTaskPackage.verification || {}).contextBehaviorCommands || []);

    lines.push("");
    lines.push("## Expected Report Shape");
    lines.push("");
    Object.keys(agentTaskPackage.expectedReport || {}).forEach(key => {
        lines.push(`- ${key}`);
    });

    lines.push("");
    lines.push("## Metadata");
    lines.push("");
    lines.push(`- Schema Version: ${agentTaskPackage.schemaVersion}`);
    lines.push(`- Package Type: ${agentTaskPackage.packageType}`);
    lines.push(`- Created At: ${metadata.createdAt || "Unknown"}`);
    lines.push(`- Feature Count: ${metadata.featureCount || 0}`);
    lines.push(`- Source: ${metadata.source || "prompt-package"}`);

    lines.push("");
    lines.push("## Read-only Rules");
    lines.push("");
    lines.push("- Read-only: Yes");
    lines.push("- No AI.");
    lines.push("- No API.");
    lines.push("- No compile.");
    lines.push("- No source scanning.");
    lines.push("- No storage write.");

    if ((contextObject.relevantFeatures || []).length === 0) {
        lines.push("");
        lines.push("## Note");
        lines.push("");
        lines.push("No relevant context found for this task. The package is still deterministic and safe.");
    }

    return lines.join("\n");

}

function printAgentTaskPackage(agentTaskPackage, contextObject, size = DEFAULT_SIZE) {

    const task = agentTaskPackage.task || {};
    const metadata = agentTaskPackage.metadata || {};
    const sizeProfile = getSizeProfile(size);

    console.log("DevOS Agent Task Package");
    console.log("===========================");
    console.log("");
    console.log("Task:");
    console.log(task.query || "Unknown");
    console.log("");
    console.log("Budget:");
    console.log(task.budget || metadata.budget || "medium");
    console.log("");
    console.log("Confidence:");
    console.log(task.confidence || metadata.confidence || "Low");
    console.log("");
    console.log("Task Size:");
    console.log(sizeProfile.label);
    console.log("");

    console.log("Relevant Features:");
    if (!task.relevantFeatures || task.relevantFeatures.length === 0) {
        console.log("No relevant context found.");
    }
    else {
        task.relevantFeatures.forEach(feature => {
            console.log(`- ${feature.name}`);
        });
    }

    console.log("");
    console.log("Workflow:");
    (agentTaskPackage.workflow || []).forEach((stage, index) => {
        console.log(`${index + 1}. ${stage.stage}`);
        console.log(`   ${stage.description}`);
    });

    console.log("");
    console.log("Restrictions:");
    printRestrictions(agentTaskPackage.restrictions || {});

    console.log("");
    console.log("Verification Commands:");
    printList((agentTaskPackage.verification || {}).recommendedCommands || [], "None");

    console.log("");
    console.log("Suggested Workflow:");
    printNumberedList(sizeProfile.workflow, "None");

    console.log("");
    console.log("Suggested Verification:");
    printList(sizeProfile.verification, "None");

    console.log("");
    console.log("Scope Reminder:");
    console.log(sizeProfile.reminder);

    console.log("");
    console.log("Context Behavior Checks:");
    printList((agentTaskPackage.verification || {}).contextBehaviorCommands || [], "None");

    console.log("");
    console.log("Expected Report Shape:");
    Object.keys(agentTaskPackage.expectedReport || {}).forEach(key => {
        console.log(`- ${key}`);
    });

    console.log("");
    console.log("Metadata:");
    console.log(`Schema Version: ${agentTaskPackage.schemaVersion}`);
    console.log(`Package Type: ${agentTaskPackage.packageType}`);
    console.log(`Created At: ${metadata.createdAt || "Unknown"}`);
    console.log(`Feature Count: ${metadata.featureCount || 0}`);
    console.log(`Source: ${metadata.source || "prompt-package"}`);

    console.log("");
    console.log("Read-only:");
    console.log("Yes");
    console.log("No AI.");
    console.log("No API.");
    console.log("No compile.");
    console.log("No source scanning.");
    console.log("No storage write.");

    if ((contextObject.relevantFeatures || []).length === 0) {
        console.log("");
        console.log("Note:");
        console.log("No relevant context found for this task. The package is still deterministic and safe.");
    }

}

function getSizeProfile(size) {

    return SIZE_PROFILES[size] || SIZE_PROFILES[DEFAULT_SIZE];

}

function printRestrictions(restrictions) {

    buildRestrictionLines(restrictions).forEach(line => console.log(line));

}

function buildRestrictionLines(restrictions) {

    const labels = [
        ["noAICall", "No AI call"],
        ["noAPICall", "No API call"],
        ["noCompile", "No compile"],
        ["noSourceScan", "No source scan"],
        ["noStorageMutation", "No storage mutation"],
        ["deterministic", "Deterministic"],
        ["local", "Local"],
        ["readOnly", "Read only"],
        ["executable", "Executable"]
    ];
    const lines = [];

    labels.forEach(([key, label]) => {
        if (key === "executable") {
            lines.push(`- ${label}: ${restrictions[key] ? "Yes" : "No"}`);
        }
        else if (restrictions[key] !== undefined) {
            lines.push(`- ${label}: ${restrictions[key] ? "Yes" : "No"}`);
        }
    });

    return lines;

}

function printMarkdownCommandBlocks(items) {

    if (!items || items.length === 0) {
        console.log("None");
        return;
    }

    items.forEach(item => {
        console.log("```bash");
        console.log(item);
        console.log("```");
        console.log("");
    });

}

function addMarkdownCommandBlocks(lines, items) {

    if (!items || items.length === 0) {
        lines.push("None");
        return;
    }

    items.forEach(item => {
        lines.push("```bash");
        lines.push(item);
        lines.push("```");
        lines.push("");
    });

}

function printList(items, fallback) {

    if (!items || items.length === 0) {
        console.log(`- ${fallback}`);
        return;
    }

    items.forEach(item => console.log(`- ${item}`));

}

function printNumberedList(items, fallback) {

    if (!items || items.length === 0) {
        console.log(`- ${fallback}`);
        return;
    }

    items.forEach((item, index) => console.log(`${index + 1}. ${item}`));

}

function saveCurrentTask(markdown) {

    const relativePath = "devos/tasks/current.md";

    try {
        fs.mkdirSync(path.dirname(TASK_OUTPUT_PATH), { recursive: true });
        fs.writeFileSync(TASK_OUTPUT_PATH, `${markdown}\n`, "utf8");
        console.log("");
        console.log("Task saved:");
        console.log(relativePath);
    }
    catch (error) {
        console.log("");
        console.log("Task save failed.");
        console.log(error.message);
    }

}

module.exports = {
    showAgentTaskPackage
};
