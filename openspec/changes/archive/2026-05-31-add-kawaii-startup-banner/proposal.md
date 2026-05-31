## Why

TmlUs is positioned as the team's AI development workspace entry point, but the command-line startup experience should also communicate that identity immediately. A distinctive animated startup banner can make the tool feel polished, memorable, and aligned with the kawaii anime-inspired direction already approved in `docs/banner-preview.html`.

## What Changes

- Add a CLI startup banner experience based on the approved `kawaii-terminal-v1` visual direction.
- Show a TML lettermark using terminal-safe text art with pink, aqua, mint, gold, and violet ANSI styling.
- Add lightweight startup animation for interactive terminals, including staged reveal, glow-like color transitions, spinner/progress motion, and short status copy.
- Provide a non-animated fallback for non-TTY, CI, narrow terminals, unsupported color environments, or explicit quiet/no-banner modes.
- Keep the banner as a reusable startup presentation component so future commands can opt in consistently.
- Do not introduce breaking CLI behavior or require the banner for command correctness.

## Capabilities

### New Capabilities

- `startup-banner`: Covers the TmlUs command-line startup banner, including visual identity, animation behavior, terminal compatibility, and fallback behavior.

### Modified Capabilities

- None.

## Impact

- Affected code: CLI startup flow, presentation/banner utilities, terminal capability detection, and any init/start command entry points that display the banner.
- Affected docs/assets: `docs/banner-preview.html` remains the visual reference; implementation docs may reference the approved `kawaii-terminal-v1` direction.
- Dependencies: May use lightweight terminal rendering/color libraries if the existing codebase does not already provide adequate ANSI styling and animation helpers.
- Runtime behavior: Interactive users see a branded animated startup moment; automated or constrained environments receive clean plain-text output.
