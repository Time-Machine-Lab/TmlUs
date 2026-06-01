## 1. Shared Flow Boundaries

- [x] 1.1 Review current `ide` and `skills` CLI flows and identify app-layer functions that can be reused by `tmlus init`.
- [x] 1.2 Extract Skill selection and Skill installation orchestration so `init` can pass preselected AI IDE environments without triggering target IDE selection again.
- [x] 1.3 Add shared init step IDs and validation for `workdir`, `ide`, `tml-spec`, `skills`, and `work-mode`.
- [x] 1.4 Add or reuse UI helpers for single-choice work-mode selection and working-directory text input with current directory as default.

## 2. TML Docs Structure Command

- [x] 2.1 Add workspace helpers for idempotently ensuring project-root-relative files such as `.gitkeep` without writing outside the project root.
- [x] 2.2 Implement the TML Docs structure use case for `docs`, `docs/design`, `docs/api`, `docs/sql`, `docs/preview`, and `docs/spec`.
- [x] 2.3 Ensure every standard TML Docs directory preserves or creates a `.gitkeep` file.
- [x] 2.4 Add summary rendering for created, existing, and failed TML Docs structure items with quiet/no-color-safe text.
- [x] 2.5 Wire `tmlus tml-spec` into CLI argument handling and dynamic help metadata.

## 3. Work-Mode Command

- [x] 3.1 Add a project-level work-mode catalog or resolver supporting `openspec` and `skip`.
- [x] 3.2 Implement `skip` as a no-op work mode with a clear summary result.
- [x] 3.3 Implement `openspec` work-mode initialization scoped to the selected project root without global installation or user-level config changes.
- [x] 3.4 Report OpenSpec availability or initialization failures with actionable next-step text.
- [x] 3.5 Wire `tmlus work-mode` into CLI argument handling, interactive selection, direct arguments, and dynamic help metadata.

## 4. Init Orchestration

- [x] 4.1 Implement the `tmlus init` use case with ordered steps: banner, workdir, ide, tml-spec, skills, work-mode.
- [x] 4.2 Implement working-directory resolution so later steps read and write under the selected project root.
- [x] 4.3 Reuse AI IDE selections from the `ide` step as Skill installation targets in the `skills` step.
- [x] 4.4 Implement default starter Skill behavior for `skill-creator` and `tml-docs-spec-generate` when custom Skill selection is skipped.
- [x] 4.5 Implement `tmlus init --from <step>` so execution starts at the named step and continues through later steps.
- [x] 4.6 Ensure cancellation from any interactive selector stops the remaining init workflow.
- [x] 4.7 Add final init summary output that distinguishes completed, skipped, and failed steps.

## 5. Help And CLI Output

- [x] 5.1 Update the command registry with bilingual entries for `init`, `tml-spec`, and `work-mode`.
- [x] 5.2 Ensure `tmlus help` includes `init --from <step>`, TML Docs structure initialization, and work-mode examples.
- [x] 5.3 Verify `--quiet`, `--no-banner`, CI, non-TTY, and no-color behavior for new commands follows `docs/spec/DESIGN.md`.
- [x] 5.4 Ensure errors for unknown init steps, unknown work modes, unknown IDEs, and unknown Skills list supported values.

## 6. Verification

- [x] 6.1 Add command-level checks for `tmlus tml-spec` creating directories and `.gitkeep` files idempotently.
- [x] 6.2 Add command-level checks for `tmlus work-mode skip` and invalid work-mode arguments.
- [x] 6.3 Add command-level checks for `tmlus init --from tml-spec` running later steps and skipping earlier steps.
- [x] 6.4 Add checks that `tmlus help` exposes the new command families in Chinese-friendly and English output.
- [x] 6.5 Run `npm run build` in `tmlus-core`.
- [x] 6.6 Run the relevant command verification script in `tmlus-core`.
- [x] 6.7 Validate behavior in `./tmlus-test` using the repository cleanup script before manual CLI acceptance checks.
