# Codex Workflow Protocol v2

This file defines the required workflow for AI-assisted coding tasks in The Wone: Shadows.

Codex must read this file before making changes.

---

## Core Principle

DevOS serves TWS.

TWS must not be bent around DevOS.

Gameplay progress is the priority.

All changes must be:

* small
* scoped
* testable
* reviewable
* committable

DevOS is the project intelligence layer.

Codex should use DevOS to understand scope before reading source broadly.

---

## Standard Workflow

1. Read the user task carefully.
2. Determine task size:

    * small
    * medium
    * large
3. Run:

```bash
node devos task "<task name>" --size <small|medium|large>
```

4. Run impact analysis:

```bash
node devos impact "<task keywords>"
```

5. Run context query:

```bash
node devos ask "<task keywords>"
```

6. Read DevOS output:

    * Relevant Features
    * Feature Intelligence
    * Owned Files
    * Integration Points
    * Risk Profile
    * Suggested Recipe
7. Inspect only files needed for the task.
8. Make minimal changes required to complete the task.
9. Do not refactor unrelated systems.
10. Generate report:

```bash
node devos report --save
```

11. Run review:

```bash
node devos review --diff
```

12. Run verification commands.
13. Do not commit changes.
14. Report changed files, verification results, and remaining risks.

---

## Task Size Rules

### Small

Use for:

* cooldown value tweak
* UI text tweak
* trigger range tweak
* local bug fix
* small debug adjustment

Suggested flow:

```bash
node devos task "<task>" --size small
node devos impact "<keywords>"
node devos ask "<keywords>"
git diff --check
node devos report --save
node devos review --diff
```

Do not run heavy architecture commands unless needed.

### Medium

Use for:

* feature-local gameplay change
* tutorial logic change
* combat readability polish
* movement polish
* enemy behavior tweak
* soul pickup flow

Suggested flow:

```bash
node devos task "<task>" --size medium
node devos compile --all
node devos impact "<keywords>"
node devos ask "<keywords>"
git diff --check
node devos report --save
node devos review --diff
```

### Large

Use for:

* Runtime lifecycle
* Army runtime
* Summon lifecycle
* Collection core
* GameManager changes
* cross-system refactor
* architecture-sensitive task

Suggested flow:

```bash
node devos task "<task>" --size large
node devos compile --all
node devos architecture summary
node devos impact "<keywords>"
node devos ask "<keywords>"
git diff --check
node devos report --save
node devos review --diff
```

Large tasks require extra scope caution.

---

## DevOS Context Sync Rule

`node devos ask` reads compiled project intelligence.

It does not scan source directly.

Compile Policy

Run:

```bash
node devos compile --all
```

BEFORE implementation
- Sync DevOS with the current project state.
- Ensure AI reads the latest project knowledge.

Run:

```bash
node devos compile --all
```

AFTER implementation ONLY IF the task introduces:
- New feature
- New system
- New architecture
- New public API
- New reusable gameplay foundation
- New long-term project structure

Reason:
DevOS is the project's Source of Truth.
New architectural facts must be compiled so future AI agents can discover them through DevOS.

Pure bug fixes, balancing, UI tweaks, refactors, and small maintenance changes do not require a post-task compile unless they modify project knowledge.

---

## Scope Rules

Do only the requested task.

Do not expand scope.

Do not implement future systems unless explicitly requested.

Avoid speculative architecture.

If a task is a bug fix, fix the bug only.

If a task is gameplay polish, do not alter core architecture.

Follow DevOS Risk Profile:

* read `Touches`
* obey `Avoid Touching`
* respect `Recommended Verification`

---

## DevOS Rules

Do not upgrade DevOS unless the task explicitly says so.

Do not modify DevOS core, CLI, services, engines, runtime, or storage unless the task is specifically about DevOS.

For TWS gameplay tasks, DevOS should only be used for:

* task sizing
* context
* impact analysis
* scope control
* report generation
* review

---

## Runtime Rules

Do not modify Runtime lifecycle unless the task explicitly says so.

Current Runtime lifecycle is considered stable:

* Summon
* Alive
* Recall
* Death
* Cooldown
* CanSpawn

Do not add Runtime persistence unless explicitly requested.

Deferred Runtime state includes:

* current HP
* skill cooldown
* buff/debuff
* aggro
* target
* stored combat state
* instance reference

---

## Architecture Rules

Do not perform large refactors unless explicitly requested.

Do not refactor `GameManager` unless the task explicitly says so.

`GameManager` may currently act as a coordinator.

Do not introduce new manager classes unless necessary for the task.

Prefer small localized changes.

Avoid unnecessary abstraction.

---

## Gameplay Rules

Gameplay-first.

Do not rebalance damage, cooldown, range, speed, economy, or drop values unless the task asks for it.

Do not add new gameplay systems unless the task asks for them.

Do not add:

* skill system
* equipment
* save system
* quest system
* threat/aggro
* boss system
* full UI system

unless explicitly requested.

---

## Unity Rules

Unity Play Mode testing is required before commit.

DevOS review passing is not enough.

Manual Unity testing should verify the exact feature or bug fix.

Check Console for:

* Error
* Warning
* NullReferenceException

If `dotnet build` is unavailable, mention it in the final response.

Do not claim Unity testing passed unless it was actually tested in Unity Play Mode.

---

## File Change Rules

Keep changes minimal.

Do not touch unrelated files.

If unrelated files are already modified, leave them untouched.

Do not restore, stage, or commit unrelated user changes.

Be careful with Unity auto-generated or environment files, including:

* `Assets/Scenes/*.unity`
* `ProjectSettings/*.asset`
* `ProjectSettings/ProjectVersion.txt`
* `Packages/manifest.json`
* `Packages/packages-lock.json`

Only modify or stage these if the task requires it.

---

## Report Rules

Use DevOS report generator.

Run:

```bash
node devos report --save
```

Then run:

```bash
node devos review --diff
```

The generated report must pass review unless there is a known reason.

If report generation is incomplete, manually mention what is missing in the final response.

---

## Verification Rules

Run when possible:

```bash
git diff --check
node devos review --diff
```

For medium or large tasks, also run relevant DevOS commands suggested by Risk Profile.

If full `git diff --check` fails due to unrelated pre-existing files, run a targeted check on changed task files and mention the unrelated failure.

---

## Git Rules

Do not commit.

Do not run:

```bash
git add .
```

Do not stage files unless explicitly asked.

Each commit should represent one task or one bug fix.

Unity version upgrade should be committed separately from gameplay changes.

---

## Final Output Format

When finished, respond with:

```text
Done.

Summary:
- ...

Changed:
- path/to/file.cs

DevOS:
- impact: pass/fail
- report --save: pass/fail
- review --diff: pass/fail

Verification:
- git diff --check: pass/fail
- Unity Play Mode: not run / passed / failed

Remaining risks:
- ...
```

Keep the response concise but complete.
