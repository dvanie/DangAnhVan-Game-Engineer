# DevOS Agent Task Package

## Task

Save size test

## Budget

medium

## Confidence

Low

## Task Size

Large

## Relevant Features

No relevant context found.

## Workflow

1. Understand
   Understand the user task and the provided package.
2. Context
   Use DevOS context before opening source files.
3. Read Relevant Files
   Read only files relevant to the selected context.
4. Implement
   Make scoped changes only.
5. Verify
   Run appropriate deterministic verification.
6. Report
   Report changes, rationale, verification, and risks.

## Restrictions

- No AI call: Yes
- No API call: Yes
- No compile: Yes
- No source scan: Yes
- No storage mutation: Yes
- Deterministic: Yes
- Local: Yes
- Read only: Yes
- Executable: No

## Verification Commands

```bash
node devos doctor
```


## Suggested Workflow

1. Compile current project intelligence.
2. Review architecture summary before coding.
3. Use DevOS ask to focus context.
4. Confirm scope before touching cross-system files.
5. Review diff coverage before handoff.

## Suggested Verification

```bash
node devos compile --all
```

```bash
node devos architecture summary
```

```bash
node devos ask "<task keywords>"
```

```bash
git diff --check
```

```bash
node devos review --diff
```


## Scope Reminder

Large task detected. Confirm scope before coding.

## Context Behavior Checks

```bash
node devos ask "summon flow" --budget small
```

```bash
node devos export "summon flow" --budget small
```

```bash
node devos adapter "summon flow" --target gpt --budget small
```

```bash
node devos adapter "banana" --target gpt
```


## Expected Report Shape

- summary
- changedFiles
- rationale
- verificationCommands
- remainingRisks

## Metadata

- Schema Version: 0.10.0
- Package Type: agent-task-package
- Created At: 2026-07-08T13:08:47.202Z
- Feature Count: 0
- Source: prompt-package

## Read-only Rules

- Read-only: Yes
- No AI.
- No API.
- No compile.
- No source scanning.
- No storage write.

## Note

No relevant context found for this task. The package is still deterministic and safe.
