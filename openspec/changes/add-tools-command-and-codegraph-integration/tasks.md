## 1. Tool Catalog And Selection Flow

- [x] 1.1 Add Tool domain types for catalog entries, recommendation levels, installation phases, and Tool installation results.
- [x] 1.2 Create a Tool catalog with a CodeGraph entry and helper functions for resolving Tool IDs and aliases.
- [x] 1.3 Add a single-select Tool table UI that shows Name, Purpose, and Recommend while reusing existing table rendering safety rules.
- [x] 1.4 Add app-layer Tool selection and install orchestration that mirrors the `skills` flow without hard-coding Tool IDs in the CLI.

## 2. CodeGraph Tool Adapter

- [x] 2.1 Implement CodeGraph CLI detection using `codegraph version` with structured installed/missing/failure results.
- [x] 2.2 Implement the configured CodeGraph install path or missing-tool guidance for `@colbymchenry/codegraph`.
- [x] 2.3 Implement CodeGraph project initialization for the selected project root using the current CLI behavior.
- [x] 2.4 Implement CodeGraph status verification and parse failures into concise actionable messages.
- [x] 2.5 Ensure `.codegraph/` is present in project `.gitignore` without duplicating entries or removing existing content.

## 3. AI IDE MCP Adaptation

- [x] 3.1 Decide the first supported AI IDE targets for CodeGraph based on existing TmlUs environment definitions and CodeGraph official support.
- [x] 3.2 Implement idempotent MCP config adaptation for supported targets, starting with Codex, Claude, and Cursor.
- [x] 3.3 Report unsupported or unavailable AI IDE targets as skipped with clear reasons rather than treating them as Tool failures.
- [x] 3.4 Keep CodeGraph guidance lightweight by relying on MCP-delivered instructions and not writing mode-specific rule files.

## 4. CLI And Help Wiring

- [x] 4.1 Wire `tmlus tools` and direct arguments such as `tmlus tools codegraph` into CLI argument handling.
- [x] 4.2 Add Tool install summary rendering with installed, existing, initialized, configured, skipped, and failed statuses.
- [x] 4.3 Update dynamic command metadata so `tmlus help` describes `tools` and includes a CodeGraph example.
- [x] 4.4 Ensure quiet, no-banner, CI, non-TTY, and no-color behavior remains design-compliant for Tool output.

## 5. Verification

- [x] 5.1 Add command-level checks for Tool catalog resolution, unknown Tool errors, and direct CodeGraph selection.
- [x] 5.2 Add tests for the Tool table render path, including narrow terminal width and visual-width truncation.
- [x] 5.3 Add CodeGraph adapter tests using mocked command execution for installed, missing, init failure, and status failure cases.
- [x] 5.4 Add workspace tests for idempotent `.gitignore` updates for `.codegraph/`.
- [x] 5.5 Add MCP adaptation tests for supported targets and duplicate-entry prevention.
- [x] 5.6 Run `npm run build` in `tmlus-core`.
- [x] 5.7 Run the relevant command verification script in `tmlus-core`.
- [x] 5.8 Validate behavior in `./tmlus-test` using the repository cleanup script before manual CLI acceptance checks.
