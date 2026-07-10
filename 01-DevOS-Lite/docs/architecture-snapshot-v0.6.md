# DevOS Architecture Snapshot v0.6

## Status

DevOS v0.6.x is stable.

Current role:

* Project Brain
* Project Intelligence Layer
* Context Compiler
* Adapter Infrastructure

DevOS is not a Coding Agent.

DevOS does not write code automatically.

DevOS does not call AI.

DevOS does not replace GPT, Claude, Codex, Gemini, or Ollama.

DevOS prepares deterministic project intelligence so humans and future AI adapters can consume the right context safely.

---

## Core Principles

DevOS must remain:

* Deterministic
* Local
* Explainable
* Lightweight
* AI-independent
* Read-only for ask/export/adapter
* No source scan during ask/export/adapter
* No compile during ask/export/adapter
* No LLM/API calls
* No embeddings
* No RAG
* No vector database

Project philosophy:

```text
Project
    ↓
DevOS Brain
    ↓
AI Adapter
    ↓
GPT / Claude / Codex / Gemini / Ollama
```

AI is only an adapter.

DevOS is the project intelligence layer.

---

## Architecture Overview

```text
Source / Project Data
        ↓
Discovery
        ↓
Dependency
        ↓
Architecture
        ↓
Compiler
        ↓
Compiled Project Intelligence
        ↓
Context Pipeline
        ↓
Context Object
        ↓
Ask / Export / Adapter
        ↓
Generic Adapter Payload
        ↓
Payload Validator
        ↓
Target Adapter Skeletons
```

---

## Stable Milestones

### Brain Foundation

Status: Stable

Includes:

* Logger
* Memory
* Knowledge
* Decision
* Resume
* Discovery
* Dependency
* Architecture Intelligence
* Compiler Intelligence
* Context Pack
* Context Quality
* Bootstrap Generator
* Evolution Snapshot
* Doctor
* Internal Data Contract

---

### Context Intelligence v0.4

Status: Stable

Includes:

* v0.4.1 Relevant Feature Selection
* v0.4.2 Knowledge Retrieval
* v0.4.3 Context Assembly
* v0.4.4 Context Optimization / Budget / Compression

Pipeline:

```text
Question
    ↓
Relevant Features
    ↓
Knowledge Retrieval
    ↓
Context Assembly
    ↓
Context Optimization
    ↓
Final Context Pack
```

Ask behavior is deterministic.

Ask does not scan source.

Ask does not compile.

Ask does not write storage.

---

### AI Export v0.5.0

Status: Stable

DevOS can export an AI-ready context pack.

This is not AI integration.

Export only prepares structured project intelligence.

No prompt generation.

No API call.

No model call.

---

### Context Pipeline v0.5.1

Status: Stable

Introduced reusable Context Object generation.

Current pipeline:

```text
Question
    ↓
Context Pipeline
    ↓
Context Object
    ↓
Ask Renderer
    ↓
Export Renderer
    ↓
Adapter Interface
```

The Context Object is the single source of truth for ask, export, adapter, and future AI integrations.

---

### Adapter Infrastructure v0.6

Status: Stable

Includes:

* v0.6.0 Adapter Interface
* v0.6.1 Adapter Payload Formatter
* v0.6.2 Adapter Payload Validator
* v0.6.3 Target Adapter Formatter Skeletons
* v0.6.4 Context Pipeline Boundary Refactor

Current adapter flow:

```text
Context Object
    ↓
Generic Adapter Payload
    ↓
Payload Validation
    ↓
Target Adapter Skeleton
```

Supported dry-run targets:

* generic
* gpt
* claude
* codex
* gemini
* ollama

All target adapters are provider-inert.

No AI call.

No API call.

No prompt generation.

No execution.

No sending data anywhere.

---

## v0.6.4 Boundary Fix

v0.6.4 fixed an important architecture debt.

Before v0.6.4:

```text
context.pipeline.js
    ↓
ask.engine.js
    ↓
real pipeline logic
```

Problem:

`context.pipeline.js` was mostly a facade.

After v0.6.4:

```text
context.pipeline.js
    ↓
feature selection
    ↓
relationship expansion
    ↓
knowledge retrieval
    ↓
context assembly
    ↓
context optimization
    ↓
Context Object
```

Now:

* `context.pipeline.js` owns real pipeline internals
* `ask.engine.js` only handles ask CLI/rendering
* export consumes the Context Object
* adapter consumes the Context Object
* no circular dependency exists
* adapter does not import ask engine
* export does not depend on ask engine for pipeline logic

This makes the architecture ready for v0.7.

---

## Current Runtime Flow

```text
Question
    ↓
Context Pipeline
    ↓
Context Object
    ↓
Renderer or Adapter
```

Renderers:

```text
Ask Renderer
Export Renderer
Adapter Renderer
```

Adapters:

```text
Generic Payload Formatter
Generic Payload Validator
Target Adapter Formatter
```

---

## Context Pipeline

The Context Pipeline owns:

* query handling
* budget handling
* relevant feature selection
* relationship expansion
* knowledge retrieval
* context assembly
* context optimization
* confidence calculation
* reading order
* Context Object creation

The pipeline does not render terminal output.

The pipeline does not call AI.

The pipeline does not scan source.

The pipeline does not compile.

The pipeline does not write storage.

---

## Context Object

The Context Object is the single source of truth for:

* ask
* export
* adapter
* future GPT adapter
* future Claude adapter
* future Codex adapter
* future Gemini adapter
* future Ollama adapter
* future MCP / IDE integration

It contains:

* query
* budget
* relevant features
* retrieved sections
* optimized sections
* included sections
* omitted sections
* assembled context metadata
* estimated cost
* compression state
* confidence
* reading order

Rule:

No renderer or adapter should rebuild context manually.

---

## Ask

Ask is for human-readable project intelligence.

Example:

```bash
node devos ask "summon flow" --budget small
```

Ask should:

* select relevant features
* retrieve useful knowledge sections
* assemble context
* optimize by budget
* render a readable report

Ask should not:

* scan source
* compile
* write storage
* call AI
* generate prompts

---

## Export

Export is for AI-ready context output.

Example:

```bash
node devos export "summon flow" --budget small
```

Export should:

* consume Context Object
* render AI-ready context
* preserve deterministic ordering
* preserve budget behavior

Export should not:

* call AI
* call API
* generate system prompts
* generate provider-specific prompts
* write storage

---

## Adapter Interface

Adapter is for future integrations.

Example:

```bash
node devos adapter "summon flow" --target gpt --budget small
```

Adapter should:

* consume Context Object
* format Generic Adapter Payload
* validate Generic Adapter Payload
* format Target Adapter Skeleton
* render dry-run summary

Adapter should not:

* call GPT
* call Claude
* call Codex
* call Gemini
* call Ollama
* call any API
* generate executable payloads
* generate final prompts
* send data anywhere

---

## Generic Adapter Payload

Generic Adapter Payload is structured project intelligence.

It includes:

* adapter
* target
* input type
* output type
* query
* budget
* features
* context blocks
* metadata
* restrictions
* provenance

Restrictions:

```text
noAI: true
noAPI: true
noSourceScan: true
noCompile: true
noStorageWrite: true
```

Provenance:

```text
source: compiled-project-intelligence
pipeline: context-pipeline
deterministic: true
readOnly: true
```

---

## Payload Validator

Payload Validator checks that Generic Adapter Payloads are safe and structurally valid.

It validates:

* required fields
* adapter values
* budget
* restrictions
* provenance
* features
* context blocks
* metadata

It returns pure validation data.

It does not mutate payload.

It does not render.

It does not call AI.

---

## Target Adapter Skeletons

Target Adapter Skeletons are dry-run target-specific envelopes.

Supported targets:

```text
generic
gpt
claude
codex
gemini
ollama
```

Rules:

* executable: false
* sendable: false
* dry-run only
* no AI call
* no API call
* no prompt generation

Target-specific current behavior:

```text
gpt:
messages = []

claude:
messages = []

codex:
task = null

gemini:
contents = []

ollama:
prompt = null
```

These are not real provider integrations yet.

---

## Development Workflow

DevOS development now follows this workflow:

```text
Roadmap
    ↓
Architecture Discussion
    ↓
Task Definition
    ↓
Prompt for Codex
    ↓
Implementation
    ↓
Verification
    ↓
Acceptance Tests
    ↓
Architecture Review
    ↓
Commit
    ↓
Next Step Planning
```

Rules:

* keep milestones small
* avoid scope creep
* do not trust implementation reports blindly
* run real CLI tests
* review architecture before commit
* put non-urgent polish into backlog
* after 3–5 milestones, run architecture review
* each milestone should introduce or clarify one abstraction

---

## Acceptance Test Pattern

Common checks:

```bash
node devos ask "summon flow" --budget small
node devos export "summon flow" --budget small
node devos adapter "summon flow" --target gpt --budget small
node devos adapter "banana" --target gpt
node devos doctor
```

Expected:

* ask works
* export works
* adapter works
* unknown query does not crash
* no payload generated for unknown query
* doctor remains Excellent
* no compile
* no source scan
* no AI/API call
* no storage mutation

---

## Current Health

Latest verified status:

```text
Doctor:
Overall Brain Health: Excellent
```

Current architecture status:

```text
Brain Foundation:        Stable
Context Intelligence:    Stable
Context Optimization:    Stable
Context Pipeline:        Stable
Export Layer:            Stable
Adapter Infrastructure:  Stable
AI Integration:          Not implemented intentionally
```

Estimated maturity:

```text
Brain Foundation:        100%
Context Intelligence:    100%
Context Pipeline:        95–100%
Adapter Infrastructure:  90–95%
AI Integration:          0% intentional
Overall DevOS Product:   82–85%
```

AI Integration being 0% is intentional.

DevOS is still AI-independent.

---

## Known Backlog

UX:

* Rename `Omitted Sections` to `Budget Omitted Sections`
* Hide `Context Pack Preview` when Final Context Pack exists
* Improve terminal formatting
* Show better context-size estimate

Architecture:

* Shared CLI parser for `--budget` and `--target`
* Constants module for adapter names, target names, input/output types, and restrictions
* Split adapter CLI renderer if `adapter.interface.js` grows
* Optional Target Payload Validator if target skeletons become more complex

Future:

* Prompt Package Builder
* Target-specific prompt package formats
* MCP / IDE integration
* Optional standalone packaging

---

## Non Goals

DevOS v0.6 does not implement:

* GPT API integration
* Claude API integration
* Gemini API integration
* Codex execution
* Ollama execution
* MCP server
* prompt generation
* auto coding
* agent behavior
* chat memory
* embeddings
* RAG
* vector database

These belong to later roadmap versions.

---

## v0.7 Direction

v0.7 should not immediately call external AI.

Recommended next phase:

```text
v0.7 Prompt Package Layer
```

Possible flow:

```text
Context Object
    ↓
Generic Adapter Payload
    ↓
Target Adapter Skeleton
    ↓
Prompt Package Builder
    ↓
Prompt Package Validator
    ↓
Dry-run Target Package
```

v0.7 should still be:

* dry-run
* deterministic
* provider-aware but provider-inert
* no AI call
* no API call
* no auto coding

Only after prompt packages are safe and validated should DevOS consider real AI client integration.

---

## Architecture Verdict

DevOS v0.6.x is stable.

The architecture is ready to move forward because:

* Context Pipeline is now independent
* Context Object is the single source of truth
* ask/export/adapter consume the same pipeline
* adapters are provider-inert
* payloads are validated
* target skeletons are dry-run only
* no AI/API behavior has leaked into the Brain

Verdict:

```text
Ready for v0.7: Yes
Recommended next step: Prompt Package Layer
AI integration: Not yet
```

DevOS should continue to protect its core philosophy:

```text
DevOS is the Brain.
AI is only an adapter.
```
