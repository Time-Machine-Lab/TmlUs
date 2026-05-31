## 1. Banner Foundation

- [x] 1.1 Create a dedicated CLI banner/presentation module in `tmlus-core/src/cli/`.
- [x] 1.2 Define the TML text-art lettermark and compact fallback identity.
- [x] 1.3 Define the `kawaii-terminal-v1` ANSI palette based on the preview colors.
- [x] 1.4 Add local ANSI helpers or a small dependency decision for coloring, cursor control, and frame clearing.

## 2. Terminal Capability Handling

- [x] 2.1 Implement terminal capability detection for TTY, CI, color support, and terminal width.
- [x] 2.2 Implement explicit suppression controls for `--no-banner`, `--quiet`, and `TMLUS_NO_BANNER=1`.
- [x] 2.3 Implement selection between animated, static full, compact static, monochrome, and suppressed modes.
- [x] 2.4 Ensure non-TTY output avoids animation control sequences and decorative frames.

## 3. Animation And Static Rendering

- [x] 3.1 Implement a bounded animated startup sequence with staged TML reveal and progress/spinner motion.
- [x] 3.2 Implement the final readable banner state after animation completes.
- [x] 3.3 Implement compact static rendering for narrow terminals.
- [x] 3.4 Implement monochrome fallback rendering for terminals without color support.
- [x] 3.5 Ensure banner rendering errors are caught and do not fail the command.

## 4. CLI Integration

- [x] 4.1 Integrate banner rendering into the default interactive `tmlus` startup path.
- [x] 4.2 Keep `tmlus --version` plain and free of banner output.
- [x] 4.3 Ensure `tmlus --help` remains readable with banner enabled, static, or suppressed.
- [x] 4.4 Preserve existing preview CLI behavior apart from the approved presentation layer.

## 5. Verification

- [x] 5.1 Add automated or scripted checks for banner mode selection across TTY, CI, no-banner, quiet, and non-TTY contexts.
- [x] 5.2 Add checks for static fallback behavior in narrow terminal widths.
- [x] 5.3 Run `npm run build` in `tmlus-core`.
- [x] 5.4 Manually preview the CLI banner in PowerShell or Windows Terminal and compare against `docs/banner-preview.html`.
- [x] 5.5 Verify no startup banner appears in version output and automation-safe contexts.
