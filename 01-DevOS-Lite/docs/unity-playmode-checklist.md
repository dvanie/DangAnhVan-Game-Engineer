# Unity Play Mode Runtime Checklist

Use this checklist before adding new gameplay after DevOS RC1.

## Keyboard / IME Preflight

- Switch the input language to English before entering Play Mode.
- Turn off UniKey or any Vietnamese IME while testing Unity keyboard input.
- If keyboard input feels delayed or requires holding keys, check IME/language state first.
- Click inside the Game View before testing gameplay input.

## Play Mode Checklist

1. Open Unity and wait for compilation to finish.
2. Open the main gameplay scene: `Assets/Scenes/main.unity`.
3. Clear the Console.
4. Click the Game View.
5. Press Play.
6. Test WASD movement.
7. Test `R` recall shadow.
8. Test basic summon keys only if the current collection/army data supports them.
9. Confirm the Console has no new red errors.
10. Stop and Play again at least 3 times when verifying runtime stability.

## Notes

- UniKey/Vietnamese IME can delay or alter keyboard input in Unity Play Mode.
- Prefer testing gameplay input with English keyboard input active.
- If input delay returns while English input is active, check Console/Editor.log for log spam or red runtime errors before changing gameplay code.
