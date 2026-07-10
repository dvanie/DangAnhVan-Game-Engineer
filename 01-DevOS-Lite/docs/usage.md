# DevOS Usage Guide

## Overview

DevOS is the local Project Brain for **The Wone: Shadows**.

DevOS is not a Coding Agent.

DevOS does not write code automatically.

DevOS does not call AI.

DevOS does not scan source code during `ask`, `export`, or `adapter`.

DevOS does not compile during `ask`, `export`, or `adapter`.

DevOS helps you understand the project through deterministic project intelligence.

---

## Project Location

Project root:

```bash
D:\Projects\UnityProjects\The Wone_Shadows
```

DevOS folder:

```bash
D:\Projects\UnityProjects\The Wone_Shadows\devos
```

Recommended terminal location:

```bash
cd D:\Projects\UnityProjects\The Wone_Shadows
```

---

## Main Command Pattern

Most commands are run like this:

```bash
node devos <command>
```

Example:

```bash
node devos doctor
```

---

# 1. Health / Status Commands

## Doctor

Checks DevOS Brain health.

```bash
node devos doctor
```

Use when:

* after adding a new DevOS feature
* after refactor
* before commit
* when something feels broken

Expected good result:

```text
Overall Brain Health: Excellent
```

---

## Evolution

Checks structural changes in the DevOS intelligence layer.

```bash
node devos evolution
```

Use when:

* checking whether DevOS detected structural growth
* reviewing project intelligence changes
* validating read-only commands did not mutate intelligence

Note:

`evolution` may export evolution files by design. This is normal behavior for the evolution command.

---

# 2. Context / Knowledge Commands

## Context

Shows compiled context for a feature.

```bash
node devos context summon
node devos context system
node devos context soul
node devos context army
```

Use when:

* you want to inspect one feature directly
* you need feature details before coding
* DevOS `ask` suggests reading a context command

Example:

```bash
node devos context summon
```

---

## Ask

Asks DevOS a project question.

```bash
node devos ask "summon flow"
```

Use when:

* you want DevOS to choose relevant features
* you want a deterministic Context Pack
* you want to understand how systems relate
* you want context before asking GPT/Codex/Claude manually

Examples:

```bash
node devos ask "summon flow"
node devos ask "army summon soul"
node devos ask "How does the player summon an army?"
```

Ask output includes:

* query
* budget mode
* relevant features
* reasons
* suggested context commands
* suggested reading order
* knowledge retrieval
* final context pack
* assembly summary
* confidence

Ask is read-only.

Ask does not scan source.

Ask does not compile.

Ask does not call AI.

---

## Ask with Budget

Budget controls context size.

```bash
node devos ask "summon flow" --budget small
node devos ask "summon flow" --budget medium
node devos ask "summon flow" --budget full
```

Default:

```text
medium
```

### small

Use for quick reading.

Includes mostly:

* summary
* responsibility
* dependencies
* architecture summary

Example:

```bash
node devos ask "summon flow" --budget small
```

### medium

Use for normal work.

Includes:

* small budget sections
* public APIs
* selected methods
* selected references if useful

Example:

```bash
node devos ask "summon flow" --budget medium
```

### full

Use when you need complete context.

Includes all retrieved sections.

Example:

```bash
node devos ask "summon flow" --budget full
```

---

## Invalid Budget

Invalid budget falls back safely to medium.

```bash
node devos ask "summon flow" --budget tiny
```

Expected:

```text
Invalid budget "tiny". Falling back to medium.
```

---

## Unknown Query

If no feature matches:

```bash
node devos ask "banana"
```

Expected:

```text
No relevant features found.
```

No Context Pack should be assembled.

---

## Empty Ask

```bash
node devos ask
node devos ask ""
```

Expected:

```text
Usage:
node devos ask "summon flow"
```

No crash.

---

# 3. Export Commands

## Export

Exports an AI-ready Context Pack.

```bash
node devos export "summon flow"
```

Use when:

* you want context prepared for external AI/manual paste
* you want a cleaner export format than ask
* you want project intelligence without terminal explanation noise

Export is not AI integration.

Export does not call GPT, Claude, Codex, Gemini, or Ollama.

Export does not generate prompts.

Export only prepares project intelligence.

---

## Export with Budget

```bash
node devos export "summon flow" --budget small
node devos export "summon flow" --budget medium
node devos export "summon flow" --budget full
```

Examples:

```bash
node devos export "summon flow" --budget small
node devos export "army summon soul" --budget full
```

---

## Empty Export

```bash
node devos export
```

Expected:

```text
Usage:
node devos export "summon flow"
```

No crash.

---

## Unknown Export Query

```bash
node devos export "banana"
```

Expected:

```text
No relevant features found.
```

No export should be generated.

---

# 4. Adapter Commands

## Adapter

Creates a dry-run adapter payload from the Context Object.

```bash
node devos adapter "summon flow"
```

Use when:

* testing future AI adapter infrastructure
* checking adapter payload readiness
* validating Context Object consumption
* preparing for future GPT/Claude/Codex/Gemini/Ollama support

Adapter is dry-run only.

Adapter does not call AI.

Adapter does not call API.

Adapter does not send data anywhere.

---

## Adapter with Target

Supported dry-run targets:

* generic
* gpt
* claude
* codex
* gemini
* ollama

Commands:

```bash
node devos adapter "summon flow" --target generic
node devos adapter "summon flow" --target gpt
node devos adapter "summon flow" --target claude
node devos adapter "summon flow" --target codex
node devos adapter "summon flow" --target gemini
node devos adapter "summon flow" --target ollama
```

Default target:

```text
generic
```

---

## Adapter with Budget

```bash
node devos adapter "summon flow" --target gpt --budget small
node devos adapter "summon flow" --target codex --budget full
node devos adapter "army summon soul" --target gpt --budget medium
```

---

## Invalid Target

Invalid target falls back safely to generic.

```bash
node devos adapter "summon flow" --target invalid
```

Expected:

```text
Invalid target "invalid". Falling back to generic.
```

---

## Unknown Adapter Query

```bash
node devos adapter "banana" --target gpt
```

Expected:

```text
No relevant features found.

No adapter payload produced.
```

No crash.

---

## Empty Adapter

```bash
node devos adapter
```

Expected:

```text
Usage:
node devos adapter "summon flow"
```

No crash.

---

# 5. Compile / Intelligence Build Commands

## Compile

Use compile only when project source/intelligence needs to be refreshed.

```bash
node devos compile
```

Use when:

* source files changed meaningfully
* feature structure changed
* new systems were added
* compiled intelligence is outdated

Do not expect `ask`, `export`, or `adapter` to compile automatically.

---

## Important Rule

These commands should not compile:

```bash
node devos ask "summon flow"
node devos export "summon flow"
node devos adapter "summon flow"
```

If you want new source changes reflected, compile intentionally first.

---

# 6. Bootstrap / Resume / Memory Commands

These commands may exist depending on current DevOS build.

Use them as support commands, not daily commands.

## Bootstrap

Used for generating or checking bootstrap project intelligence.

```bash
node devos bootstrap
```

Use when:

* initializing DevOS intelligence
* regenerating project startup context
* checking project brain bootstrapping

---

## Resume

Used to resume project state.

```bash
node devos resume
```

Use when:

* returning to the project after a break
* checking latest known project state
* preparing a continuation summary

---

## Memory / Logs

Older or internal commands may exist for logs and memory.

Examples may include:

```bash
node devos view
node devos search
```

Use only if still supported by the current CLI.

---

# 7. Git / Commit Workflow

Recommended workflow after each DevOS change:

```bash
git status
node devos doctor
```

Run relevant tests.

Then commit:

```bash
git add devos
git commit -m "type(devos): message"
```

Example commits:

```bash
git commit -m "feat(devos): assemble deterministic context packs"
git commit -m "feat(devos): optimize context packs with budget compression"
git commit -m "feat(devos): export ai-ready context packs"
git commit -m "refactor(devos): introduce reusable context pipeline"
git commit -m "feat(devos): add deterministic adapter interface"
git commit -m "feat(devos): format generic adapter payloads"
git commit -m "feat(devos): validate generic adapter payloads"
git commit -m "feat(devos): add dry-run target adapter skeletons"
git commit -m "docs(devos): add architecture snapshot v0.6"
```

---

# 8. Common Test Sets

## Quick Health Test

Use after small changes.

```bash
node devos doctor
node devos ask "summon flow" --budget small
```

Expected:

* doctor excellent
* ask works
* no crash

---

## Context Intelligence Test

Use after changes to ask/context pipeline.

```bash
node devos ask "summon flow" --budget small
node devos ask "summon flow" --budget medium
node devos ask "summon flow" --budget full
node devos ask "army summon soul" --budget small
node devos ask "army summon soul" --budget full
node devos ask "banana"
node devos ask
```

Expected:

* small output shorter than full
* full includes more sections
* banana finds no relevant features
* empty ask prints usage
* no crash

---

## Export Test

Use after changes to export or Context Object.

```bash
node devos export "summon flow" --budget small
node devos export "summon flow" --budget full
node devos export "army summon soul" --budget full
node devos export "banana"
node devos export
```

Expected:

* export works
* full is more complete than small
* banana does not export
* empty export prints usage

---

## Adapter Test

Use after changes to adapter infrastructure.

```bash
node devos adapter "summon flow"
node devos adapter "summon flow" --target gpt
node devos adapter "summon flow" --target codex --budget small
node devos adapter "summon flow" --target invalid
node devos adapter "banana" --target gpt
node devos adapter
```

Expected:

* target payload generated for valid query
* target mode is dry-run
* executable is No
* sendable is No
* invalid target falls back to generic
* banana produces no payload
* empty adapter prints usage

---

## Read-only Test

Use after any ask/export/adapter refactor.

```bash
node devos doctor
node devos evolution
node devos ask "summon flow" --budget small
node devos export "summon flow" --budget small
node devos adapter "summon flow" --target gpt --budget small
node devos doctor
node devos evolution
```

Expected:

* doctor remains Excellent
* ask/export/adapter do not compile
* ask/export/adapter do not scan source
* ask/export/adapter do not create new context
* ask/export/adapter do not mutate storage

Note:

`node devos evolution` may export evolution files because that is evolution command behavior.

---

## Case Insensitive Test

```bash
node devos ask "summon"
node devos ask "Summon"
node devos ask "SUMMON"
```

Expected:

* same relevant feature selection
* same retrieval
* same context pack
* only query display differs

---

# 9. Suggested Daily Usage

## When starting work

```bash
node devos doctor
node devos ask "current system you want to work on" --budget small
```

Example:

```bash
node devos ask "summon flow" --budget small
```

---

## Before asking GPT/Codex/Claude manually

```bash
node devos export "summon flow" --budget medium
```

Copy the exported context into the AI conversation if needed.

---

## Before coding a feature

```bash
node devos ask "feature name or flow" --budget medium
node devos context featureName
```

Example:

```bash
node devos ask "army summon soul" --budget medium
node devos context summon
```

---

## After changing game code

```bash
node devos compile
node devos doctor
node devos ask "changed feature" --budget small
```

---

## After changing DevOS code

```bash
node devos doctor
node devos ask "summon flow" --budget small
node devos export "summon flow" --budget small
node devos adapter "summon flow" --target gpt --budget small
```

---

# 10. Command Categories

## Human Understanding

Use these when you want to understand the project:

```bash
node devos ask "summon flow"
node devos context summon
node devos doctor
```

---

## AI Preparation

Use these when you want context for AI but DevOS should not call AI:

```bash
node devos export "summon flow"
node devos adapter "summon flow" --target gpt
node devos adapter "summon flow" --target codex
```

---

## Project Intelligence Maintenance

Use these when project structure changed:

```bash
node devos compile
node devos evolution
node devos bootstrap
```

---

## Testing / Verification

Use these before commit:

```bash
node devos doctor
node devos ask "summon flow" --budget small
node devos export "summon flow" --budget small
node devos adapter "summon flow" --target gpt --budget small
```

---

# 11. Current Supported Budgets

```text
small
medium
full
```

Default:

```text
medium
```

Use:

```bash
--budget small
--budget medium
--budget full
```

---

# 12. Current Supported Adapter Targets

```text
generic
gpt
claude
codex
gemini
ollama
```

Default:

```text
generic
```

Use:

```bash
--target gpt
--target claude
--target codex
--target gemini
--target ollama
```

---

# 13. What DevOS Should Never Do in Current Version

DevOS should not:

* auto write code
* act as an autonomous coding agent
* call GPT/Claude/Gemini/Codex/Ollama
* call external API
* generate final prompts automatically
* scan source during ask/export/adapter
* compile during ask/export/adapter
* mutate storage during ask/export/adapter
* use embeddings
* use RAG
* use vector database

---

# 14. Future Commands

These are planned or possible future commands.

Do not assume they exist yet.

## Prompt Package

Possible future command:

```bash
node devos prompt "summon flow" --target gpt --budget small
```

Purpose:

* create a provider-specific prompt package
* still dry-run
* still no AI call

---

## MCP / IDE

Possible future command:

```bash
node devos mcp
```

Purpose:

* expose DevOS Context Object to IDEs or MCP clients

---

## Serve / Local API

Possible future command:

```bash
node devos serve
```

Purpose:

* local read-only DevOS API
* useful for tools and dashboards

---

## Dashboard

Possible future command:

```bash
node devos dashboard
```

Purpose:

* local visual project brain dashboard

---

## Package

Possible future command:

```bash
node devos package
```

Purpose:

* package DevOS as a standalone local tool

---

# 15. Recommended Docs

Suggested docs inside project:

```text
devos/docs/architecture-snapshot-v0.6.md
devos/docs/usage.md
devos/docs/backlog.md
devos/docs/roadmap.md
```

Suggested Obsidian notes:

```text
DevOS/Architecture Snapshot v0.6.md
DevOS/Usage Guide.md
DevOS/Backlog.md
DevOS/Development Workflow.md
DevOS/Roadmap.md
```

---

# 16. Quick Reference

## Most used commands

```bash
node devos doctor
node devos ask "summon flow" --budget small
node devos ask "army summon soul" --budget medium
node devos context summon
node devos export "summon flow" --budget medium
node devos adapter "summon flow" --target gpt --budget small
```

## Most important test commands

```bash
node devos doctor
node devos ask "summon flow" --budget small
node devos export "summon flow" --budget small
node devos adapter "summon flow" --target gpt --budget small
node devos adapter "banana" --target gpt
```

## Before commit

```bash
git status
node devos doctor
node devos ask "summon flow" --budget small
git add devos
git commit -m "type(devos): message"
```

---

## Final Rule

DevOS is the Brain.

AI is only an adapter.

Keep DevOS deterministic, local, explainable, and safe.
