## Context

The current CLI already has focused building blocks for AI IDE environment initialization (`tmlus ide`) and Skill installation (`tmlus skills`). Those commands are useful as standalone operations, but the project-start path still requires users to run several commands in the correct order and repeat choices such as target AI IDE environments.

The architecture guidance defines `init` as an application use case, with the CLI shell collecting input and the app layer orchestrating resource, environment, tool, workspace, and UI modules. This change keeps that boundary: `tmlus init` becomes a workflow coordinator, while reusable steps such as TML Docs structure initialization and work-mode initialization are also exposed as standalone commands.

## Goals / Non-Goals

**Goals:**
- Provide `tmlus init` as the guided project setup workflow.
- Keep initialization steps modular so they can be added, removed, or run independently.
- Reuse existing AI IDE initialization and Skill installation behavior without re-prompting for AI IDE targets inside `init`.
- Make TML Docs structure initialization and work-mode initialization standalone use cases.
- Support resuming with `tmlus init --from <step>`, where execution starts at the selected step and continues through later steps.
- Keep all file writes scoped to the selected project root and idempotent where possible.

**Non-Goals:**
- Do not introduce a hosted service, account system, remote dashboard, server API, database, or daemon.
- Do not globally install OpenSpec or modify user-level OpenSpec configuration.
- Do not replace OpenSpec behavior; TmlUs only initializes project-level OpenSpec structure for the selected project.
- Do not build a full recipe/profile engine in this change, though the step model should not block that later.

## Decisions

### Decision 1: Implement `init` as a step-based app use case

`tmlus init` will be represented as an ordered list of step IDs:

```text
banner -> workdir -> ide -> tml-spec -> skills -> work-mode
```

The app layer will decide which steps execute based on parsed CLI options. `--from <step>` resolves to an index in that ordered list, skips earlier steps, and continues through every later step.

Alternative considered: hard-code one long interactive function in `cli/index.ts`. This would be faster to write, but it would repeat the current coupling in `skills` and make later step removal or reordering expensive.

### Decision 2: Keep standalone commands for reusable steps

TML Docs structure initialization will be exposed as `tmlus tml-spec`. Work-mode initialization will be exposed as `tmlus work-mode`. `tmlus init` calls the same app-level functions rather than shelling out to its own CLI commands.

Alternative considered: have `init` execute subprocesses such as `tmlus tml-spec`. That preserves command reuse at the process level, but it makes shared state, selected project root, selected IDE targets, quiet/no-banner behavior, and error handling harder to control.

### Decision 3: Carry selected AI IDE environments forward to Skill installation

During `init`, the AI IDE step returns the selected/resolved environment definitions. The Skill step receives those environments directly and therefore does not ask the user to choose target IDEs again.

If the user skips custom Skill selection, the Skill step installs the default starter set:

```text
skill-creator
tml-docs-spec-generate
```

Alternative considered: call the existing `skills` flow as-is. That would duplicate the IDE target prompt and violate the expected init experience.

### Decision 4: Treat TML Docs as a workspace structure use case

`tmlus tml-spec` creates or repairs this project-root-relative structure:

```text
docs/
docs/design/
docs/api/
docs/sql/
docs/preview/
docs/spec/
```

Each directory keeps a `.gitkeep` file so the folder structure can be committed even when empty. The implementation should reuse workspace path safety helpers and report created/existing/failed results.

Alternative considered: make this part of a future recipe engine only. The folder structure is already a concrete team convention and useful as a standalone command, so waiting for recipe work would delay a low-risk building block.

### Decision 5: Scope work-mode initialization to the selected project

`tmlus work-mode openspec` initializes OpenSpec only inside the selected project root. It must not perform global installation or modify user-level settings. If OpenSpec CLI is unavailable or project initialization fails, the command reports the issue with a next-step suggestion.

Alternative considered: globally install OpenSpec when missing. That is more magical but changes the user's machine outside the project root and exceeds the confirmed scope.

### Decision 6: Centralize output through existing UI conventions

New commands should use the current banner, quiet/no-banner, CI, non-TTY, and no-color behavior. `tmlus init` can show the startup banner before interactive work, while standalone commands should keep summaries explicit and machine-readable modes clean when introduced later.

Alternative considered: give `init` its own bespoke terminal UI. The design spec allows a richer init experience, but this change should first establish correct workflow behavior and reusable output helpers.

## Risks / Trade-offs

- [Risk] Step cancellation semantics can become inconsistent across consecutive selectors. -> Mitigation: reuse `SELECTION_CANCELLED` and stop the whole init workflow on cancellation.
- [Risk] `--from` can skip context needed by later steps, such as selected AI IDE targets. -> Mitigation: when starting after `ide`, infer target IDEs from existing initialized environments or require explicit `--ide` targets for non-interactive usage.
- [Risk] OpenSpec availability differs by developer machine. -> Mitigation: detect command failure and report that current-project OpenSpec initialization could not run, without claiming success.
- [Risk] Adding more logic to the current CLI entry point could make it harder to maintain. -> Mitigation: move orchestration into `app/` functions and keep `cli/index.ts` responsible for parsing and calling use cases.
- [Risk] Remote Skill installation can fail during init and leave a partially initialized project. -> Mitigation: summarize successful, skipped, and failed steps and preserve idempotency so the user can re-run from `skills`.
