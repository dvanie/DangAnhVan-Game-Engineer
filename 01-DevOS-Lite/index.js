const bootstrap = require("./core/runtime/bootstrap");

bootstrap.boot();

const args = process.argv.slice(2);

const command = args[0];

switch (command) {
    case "view":
        const view = require("./cli/view");

        if (args[1] === "all") {

            view.showAll();

        }
        else if (args[1] === "last") {

            view.showLast(Number(args[2]) || 5);

        }
        else {

            console.log("Usage:");
            console.log("view all");
            console.log("view last 5");

        }

        break;

    case "query":
        require("./core/engines/query.engine");
        break;

    case "feature":
        require("./core/engines/feature.engine");
        break;
        
    case "log": {
        const logger = require("./core/services/logger.service");
        logger.logCommit();
        break;
    }

    case "knowledge": {

        const knowledge = require("./core/services/knowledge.service");

        const data = knowledge.loadKnowledge();

        console.log("🧠 DevOS Knowledge");
        console.log("=================");

        Object.keys(data).forEach(key => {

            console.log(`\n📦 ${key}`);
            console.log(`Files: ${data[key].files.length}`);
            console.log(`Commits: ${data[key].commits.length}`);
            console.log(`Updated: ${data[key].updatedAt || data[key].updated}`);

        });

        break;

    }

    case "ask": {

        const ask = require("./core/engines/ask.engine");

        ask.ask(args.slice(1));

        break;

    }

    case "export": {

        const ask = require("./core/engines/ask.engine");

        ask.exportAiContext(args.slice(1));

        break;

    }

    case "adapter": {

        const adapter = require("./core/adapters/adapter.interface");

        adapter.runAdapter(args.slice(1));

        break;

    }

    case "task": {

        const task = require("./core/engines/task.engine");

        task.showAgentTaskPackage(args.slice(1));

        break;

    }

    case "impact": {

        const impact = require("./core/engines/impact.engine");

        impact.showImpact(args.slice(1));

        break;

    }

    case "review": {

        const review = require("./core/engines/review.engine");

        review.runReview(args.slice(1));

        break;

    }

    case "report": {

        const report = require("./core/engines/report.engine");

        report.runReport(args.slice(1));

        break;

    }

    case "status": {

        const status = require("./core/engines/status.engine");

        status.showStatus();

        break;

    }
    
    case "resume": {
        const resume = require("./core/engines/resume.engine");
        
        resume.showResume();
        
        break;
    }
    
    case "context": {
        const context = require("./core/engines/context.engine");
        context.buildContext(args[1]);
        break;
    }

    case "decision": {

        const decision = require("./core/services/decision.service");

        const action = args[1];

        if (action === "add") {
            decision.addDecision(args[2], args[3]);
        }
        else if (action === "list") {
            decision.showDecisions();
        }
        else {
            console.log("Usage:");
            console.log('node devos decision add "title" "reason"');
            console.log("node devos decision list");
        }

        break;

    }

    case "compile": {

        const compiler = require("./core/engines/compiler.engine");

        if (args[1] === "--all") {
            compiler.exportAllCompiledFeatures();
        }
        else if (args[2] === "--out") {
            compiler.exportCompiledFeature(args[1]);
        }
        else {
            compiler.showCompiledFeature(args[1]);
        }

        break;

    }

    case "bootstrap": {

        const compiler = require("./core/engines/compiler.engine");

        compiler.showProjectBootstrap();

        break;

    }

    case "evolution": {

        const compiler = require("./core/engines/compiler.engine");

        compiler.showKnowledgeEvolution();

        break;

    }

    case "doctor": {

        const doctor = require("./cli/doctor");

        doctor.runDoctor();

        break;

    }

    case "dependency": {

        const dependency = require("./core/engines/dependency.engine");

        dependency.analyzeDependencies();

        break;

    }

    case "architecture": {

        const architecture = require("./core/engines/architecture.engine");

        if (args[1] === "summary") {
            architecture.showArchitectureSummary({
                includeAll: args.includes("--all")
            });
        }
        else {
            architecture.exportArchitectureGraph();
        }

        break;

    }

    case "discover": {

        const discovery = require("./core/engines/discovery.engine");

        discovery.discoverProject();

        break;

    }
    
    default:
        console.log("DevOS v0.2");
        console.log("Commands:");
        console.log("  view");
        console.log("  query");
        console.log("  feature");
        console.log(" log");
        console.log(" knowledge");
        console.log(" status");
        console.log(" resume");
        console.log(" context");
        console.log(" export");
        console.log(" adapter");
        console.log(" task");
        console.log(" impact");
        console.log(" review");
        console.log(" report");
        console.log(" decision");
        console.log(" compile");
        console.log(" bootstrap");
        console.log(" evolution");
        console.log(" dependency");
        console.log(" architecture");
        console.log(" discover");
}
