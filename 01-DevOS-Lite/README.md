# DevOS

*English · [Tiếng Việt](README.vi.md) · [Portfolio](../README.md)*

**Developer tooling · Node.js CLI · v0.6.1**

I built DevOS while developing *The Wone: Shadows* to make project structure, dependencies, and implementation rules easier to discover before changing gameplay code.

## How it works

- **Project attachment.** The runtime installs outside the project. A project-local `.DevOS` attachment holds its configuration and generated intelligence.
- **Compilation.** DevOS discovers project resources, resolves feature ownership, and builds dependency and architecture views. It compiles these into feature context with relevant files, contracts, and risks.
- **Retrieval.** `ask` ranks relevant compiled features for a task, `impact` identifies affected features, and `adapter` exports a bounded payload for a coding agent. Retrieval is deterministic and uses the existing compiled evidence.

For example, from an initialized Unity project:

```bash
devos compile --all
devos ask "summon flow" --budget small
devos impact "change how Shadow targets are selected"
```

## Source and verification

The current runtime, product guide, and regression suite are public. The regression suite uses disposable project fixtures to cover setup, ownership, compilation, CLI packaging, and workflow behavior.

[Current DevOS source](https://github.com/Heavant/DevOS) · [Product guide](https://github.com/Heavant/DevOS/blob/main/docs/DEVOS_PRODUCT_GUIDE.md) · [Regression suite](https://github.com/Heavant/DevOS/tree/main/tests)

This folder preserves the **DevOS-Lite** sample and [its original workflow notes](docs/agent-workflow.md). [Early CLI demo](../docs/DevOS-Demo.gif)
