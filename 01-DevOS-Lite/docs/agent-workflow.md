# DevOS Agent Workflow

## Purpose

This document explains how external coding agents should work with DevOS.

DevOS is a deterministic local Project Brain. Coding agents are Workers that consume DevOS context before acting. This workflow helps agents avoid broad source scans, unrelated edits, architecture drift, and unnecessary token use.

## DevOS Role

DevOS owns project intelligence.

DevOS is responsible for:

- Understanding compiled project knowledge.
- Providing relevant feature context.
- Explaining dependency and architecture relationships.
- Producing deterministic Context Objects.
- Producing dry-run adapter payloads.
- Validating project brain health.

DevOS does not write code, call AI, call APIs, or decide implementation changes.

## Coding Agent Role

The coding agent is only a Worker.

The agent is responsible for:

- Understanding the user task.
- Asking DevOS for relevant context before source edits.
- Reading only relevant files after DevOS narrows the scope.
- Making small, scoped changes.
- Running appropriate verification.
- Reporting the result clearly.

The agent must not replace DevOS as the project brain.

## Required Workflow

```text
User Task
↓
DevOS Ask
↓
DevOS Export / Context
↓
Read Suggested Files Only
↓
Implement Scoped Change
↓
Verify
↓
Report
```

Use this workflow for code tasks:

1. Read the user request carefully.
2. Run a DevOS query for feature relevance.
3. Use DevOS export or context packs for deeper context.
4. Open only the files needed for the selected feature or task.
5. Make the smallest correct change.
6. Run verification commands.
7. Report changed files, rationale, tests, and risks.

## Recommended Commands

Start with a small context query:

```bash
node devos ask "<task>" --budget small
```

Get an AI-ready context pack without calling AI:

```bash
node devos export "<task>" --budget medium
```

Use specific feature context when DevOS identifies relevant features:

```bash
node devos context summon
node devos context system
```

Check brain health:

```bash
node devos doctor
```

When context or adapter behavior is touched, run:

```bash
node devos ask "summon flow" --budget small
node devos export "summon flow" --budget small
node devos adapter "summon flow" --target gpt --budget small
node devos adapter "banana" --target gpt
```

## What Agents Must Not Do

Agents must not:

- Treat themselves as the project brain.
- Scan the entire project before asking DevOS.
- Read unrelated files without a reason.
- Compile unless needed for verification.
- Modify unrelated files.
- Rewrite architecture casually.
- Add features outside task scope.
- Call AI or APIs from DevOS.
- Change DevOS storage schemas.
- Mutate DevOS intelligence during `ask`, `export`, or `adapter`.
- Generate prompt packages in this milestone.
- Add AI adapter execution.
- Add autonomous coding behavior.

## Verification Rules

Prefer deterministic local verification.

Use:

```bash
node devos doctor
```

If only documentation changed, no compile is required.

If runtime behavior changed, run the relevant command paths that could be affected. For context and adapter changes, include:

```bash
node devos ask "summon flow" --budget small
node devos export "summon flow" --budget small
node devos adapter "summon flow" --target gpt --budget small
node devos adapter "banana" --target gpt
```

Do not run broad or destructive commands unless the user explicitly asks.

## Reporting Rules

The final report should include:

- Summary of the change.
- Files changed.
- Why the change was made.
- Verification commands run.
- Whether any tests or checks could not be run.
- Remaining risks or recommended follow-up.

Keep reports clear and scoped to the task.

## Example Task Flow

User task:

```text
Fix summon flow context selection.
```

Agent flow:

```bash
node devos ask "summon flow" --budget small
node devos export "summon flow" --budget medium
node devos context summon
node devos context system
```

Then:

1. Read only the files needed for summon context behavior.
2. Make the scoped fix.
3. Verify:

```bash
node devos ask "summon flow" --budget small
node devos export "summon flow" --budget small
node devos doctor
```

4. Report the result.

## Non Goals

This workflow does not introduce:

- AI API integration.
- OpenAI, Gemini, Claude, Codex, or Ollama clients.
- MCP integration.
- Prompt package builders.
- Prompt validators.
- Automatic code writing.
- Automatic file editing.
- New storage schemas.
- New compile behavior.
- Dashboards.
- Executable apps.

DevOS remains the Project Brain. Agents remain Workers. Humans remain in control.
