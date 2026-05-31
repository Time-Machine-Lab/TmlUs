## Context

TmlUs currently has a minimal preview CLI in `tmlus-core/src/cli/index.ts` with help and version output. The product concept positions TmlUs as the team's AI development workspace entry point, and the approved visual exploration in `docs/banner-preview.html` establishes a `kawaii-terminal-v1` direction: TML ASCII lettermark, pink/aqua/mint/gold/violet colors, terminal scanline energy, spark-like accents, and a short startup progress moment.

The implementation should translate that HTML concept into a real terminal experience without making command output fragile. The banner is presentation, not command logic; it must degrade cleanly when animation or color is inappropriate.

## Goals / Non-Goals

**Goals:**

- Provide a branded startup banner that makes `tmlus` feel recognizable and polished.
- Preserve the approved `kawaii-terminal-v1` direction in terminal-safe form.
- Keep animation lightweight, brief, and optional.
- Make terminal capability detection explicit so CI, pipes, narrow terminals, and quiet modes do not receive noisy animated output.
- Keep the banner reusable for future startup flows and commands.

**Non-Goals:**

- Do not build a web UI or reuse the HTML preview at runtime.
- Do not require images, browser rendering, or external services.
- Do not block command execution on banner animation.
- Do not show the banner for `--version` or machine-readable/quiet output.
- Do not introduce business commands beyond the banner integration.

## Decisions

### Decision 1: Implement a terminal-native banner module

Create a dedicated CLI presentation module, for example `src/cli/banner.ts`, that exports banner rendering functions and keeps text art, color palette, frame definitions, fallback content, and terminal capability logic outside the command router.

Rationale: The banner will evolve visually, while command routing should stay simple and testable. A separate module also makes it easy for future commands to opt in without duplicating ANSI output.

Alternatives considered:

- Inline banner logic inside `src/cli/index.ts`: faster for the first implementation, but it would make the entry file noisy and harder to test.
- Store banner frames as external assets: useful later if the animation grows, but unnecessary for the first version and less convenient for package distribution.

### Decision 2: Use ANSI text art instead of image-based rendering

The CLI banner should use terminal-safe ASCII/Unicode text art for the TML mark, ANSI color sequences for gradient-like styling, and small character accents for sparkle/progress motion.

Rationale: Terminal users expect fast text output. ANSI text keeps the feature portable across npm installs, SSH sessions, and local terminals.

Alternatives considered:

- Render bitmap or sixel images: visually richer but unsupported in many terminals and not appropriate for a general-purpose CLI startup.
- Use only plain ASCII with no color: robust but loses the product identity confirmed by the preview.

### Decision 3: Gate animation behind terminal capability checks

Animated rendering should run only when all of these are true:

- `stdout.isTTY` is true.
- CI mode is not detected.
- The terminal width is sufficient for the selected banner layout.
- Color is supported or explicitly allowed.
- The user has not requested quiet/no-banner behavior.

Otherwise, render a compact static banner or no banner depending on the command mode.

Rationale: Animated terminal output can corrupt logs, annoy CI pipelines, and wrap poorly in narrow terminals. Gating keeps the experience delightful for humans and predictable for automation.

Alternatives considered:

- Always animate: strongest brand moment, but poor automation behavior.
- Never animate: safest, but it ignores the user's request for a dynamic startup identity.

### Decision 4: Provide explicit user controls

Support CLI/env controls such as `--no-banner`, `--quiet`, and `TMLUS_NO_BANNER=1`. If future command parsing introduces global options, these controls should become global options rather than command-specific flags.

Rationale: Presentation features should be easy to disable in scripts, screenshots, slow terminals, or user preferences.

Alternatives considered:

- Only auto-detect environment: helpful but not enough for user preference.
- Persist a config preference immediately: useful later, but not required for the first implementation.

### Decision 5: Keep animation short and bounded

The animated sequence should be a brief startup flourish, roughly under one second by default. It can use staged TML reveal, color cycling, a spinner/progress line, and final static state. The implementation should avoid unbounded timers and should be interruptible by normal process flow.

Rationale: The banner should create emotional polish without slowing down the tool. TmlUs is still a developer CLI, so speed remains part of the product feel.

Alternatives considered:

- Longer cinematic sequence: more expressive, but likely frustrating during repeated CLI use.
- Single-frame static only: efficient, but less aligned with the approved direction.

## Risks / Trade-offs

- [Risk] ANSI color or Unicode width may render inconsistently across terminals -> Mitigation: keep a plain ASCII fallback and validate on Windows Terminal, PowerShell, cmd, and common Unix-like terminals.
- [Risk] Animation may slow command startup -> Mitigation: cap animation duration and skip animation for non-interactive contexts.
- [Risk] Banner may wrap in narrow terminals -> Mitigation: detect terminal width and use compact/static variants below the full-width threshold.
- [Risk] Logs may become noisy in automation -> Mitigation: skip animation in CI and support `--no-banner`, `--quiet`, and `TMLUS_NO_BANNER=1`.
- [Risk] Visual style may feel too playful for professional usage -> Mitigation: keep default copy concise, avoid excessive frames, and allow easy disabling.

## Migration Plan

1. Add the terminal-native banner module and integrate it into the default interactive startup path.
2. Keep `--version` plain and stable.
3. Ensure help output remains readable after the banner and can run without the banner when disabled.
4. Add tests or scripted checks for animated, static, no-banner, CI, and narrow-terminal decisions.
5. Roll back by removing the banner call from the CLI entry point while leaving command behavior unchanged.

## Open Questions

- Should the default `tmlus --help` show the banner, or should the banner show only for bare `tmlus` and future interactive commands?
- Should the first implementation depend on a small ANSI library, or should it use local ANSI helpers to avoid adding dependencies?
- What exact terminal width should trigger the compact fallback: 80 columns, 90 columns, or a measured width based on the final art?
