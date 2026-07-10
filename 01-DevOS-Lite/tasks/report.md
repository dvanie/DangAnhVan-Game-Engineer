# Task Report

## Summary
- Fixed `SoulObject` runtime rules so Common Souls always auto collect even if old Soul prefab inspector values are stale.
- Fixed manual extract prompt behavior for non-common Souls: prompt resolves at runtime, appears in range, clears when out of range, on extraction, expiration, disable, or destroy.
- Kept the fix local to Soul behavior and did not refactor GoblinSoul/SlimeSoul/WolfSoul prefab architecture or GameManager.

## Changed Files
- Assets/Scripts/Soul/SoulObject.cs
- devos/tasks/report.md

## Rationale
- Root cause: old type-specific Soul prefabs can carry stale `isAutoCollect` values, so Common Slime/Wolf Souls could incorrectly require manual extraction.
- Root cause: runtime-spawned Soul prefabs may not have `extractText` assigned, and the old prompt logic did not reliably clear prompt text on expiration or destruction.
- Design decision: enforce Common auto collect in code via `soulRank == SoulRank.Common`, while keeping non-common ranks on the existing manual extraction path.
- Design decision: resolve `PressEText` at runtime and create a minimal fallback TMP prompt if missing, without merging Soul extraction into the new Interaction Foundation yet.

## Verification Commands
- node devos task "Fix Soul auto collect and extract prompt" --size medium
- node devos compile --all
- node devos impact "soul auto collect extract prompt common rank"
- node devos ask "soul auto collect extract prompt common rank"
- git diff --check -- Assets/Scripts Assets/Scenes/main.unity
- node devos report --save
- node devos review --diff
- node devos doctor
- dotnet build Assembly-CSharp.csproj --no-restore

## Remaining Risks
- Unity Play Mode has not been run yet, so Slime/Wolf Common auto collect and non-common manual extract prompt behavior still need in-editor validation.
- Old Soul prefab inspector values may still be inconsistent; code now overrides Common behavior, but prefab cleanup should be a future maintenance task.
- `E` is shared by Soul extraction and the new Interaction Foundation. This task does not add a full prompt/input priority system.
- The worktree contains unrelated existing changes in prefabs, ProjectSettings, Interaction files, terrain/tree assets, TextMesh Pro fallback asset, and DevOS workflow docs.

## Impact Summary

Risk Level: High

Relevant Features:
- Soul
- Enemy
- System

Likely Impact:
- Soul: Common auto collect and manual extract prompt behavior.
- Enemy: enemy drops still assign runtime `soulType` and `soulRank` through `EnemySoulDrop.SetupDroppedSoul`.
- System: rewards still flow through existing `GameManager.AddMite` and `GameManager.AddSoul` calls.

Touches:
- Soul

Avoid Touching:
- Runtime
- GameManager
- Unity Scene
- Project Settings
- Package Manifest / Lock

## Notes
- Common auto collect is enforced by code in `SoulObject.ApplyRuntimeCollectRules`.
- `extractText` is resolved by first using an assigned reference, then finding `PressEText`, then creating a minimal fallback TMP prompt under an existing or new Canvas.
- SlimeSoul/WolfSoul/GoblinSoul prefab architecture was not refactored.
- Soul prefab cleanup and prompt priority with Interaction Foundation should be future tasks.

## Metadata
- Generated At: 2026-07-09T19:12:44.163Z
- Source: manual correction after devos-report-engine
- Current Task: Fix Soul auto collect and extract prompt
