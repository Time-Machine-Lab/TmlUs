## Context

TmlUs already has focused flows for AI IDE initialization (`ide`), Skill discovery and installation (`skills`), TML Docs setup (`tml-spec`), work-mode setup (`work-mode`), and guided project initialization (`init`). The product and architecture documents also reserve `Tool` as a first-class resource type for external tools such as OpenSpec, spec-kit, harness, codegraph, npm, and Git.

The missing piece is a dedicated Tool installation flow. CodeGraph is the immediate driver: its official workflow is not a separate development mode, but a general agent integration path that configures an MCP server and initializes a local project index. Once the MCP server is available, CodeGraph provides its own agent-facing usage guidance through the MCP initialize response, so TmlUs should avoid duplicating long per-IDE instruction blocks.

## Goals / Non-Goals

**Goals:**
- Add `tmlus tools` as the guided entry point for external tool discovery and installation.
- Model tools with a structured catalog rather than hard-coded CLI conditionals.
- Reuse the visual and interaction patterns of the existing Skill table selector, while making Tool selection single-choice.
- Integrate CodeGraph as the first Tool, using the official installation shape: CLI availability, MCP configuration, project initialization, status validation.
- Keep CodeGraph usable across supported AI IDEs through MCP rather than through mode-specific rules.
- Keep all project writes idempotent and scoped to the selected project root.

**Non-Goals:**
- Do not build separate CodeGraph flows for vibecoding, spec-coding, or harness-coding.
- Do not reimplement CodeGraph indexing, MCP serving, graph querying, or agent guidance inside TmlUs.
- Do not introduce a hosted tool registry, accounts, dashboards, services, databases, or remote project state.
- Do not require all AI IDEs to support CodeGraph in the first iteration. Unsupported or unknown targets can be reported as skipped with a clear reason.
- Do not add CodeGraph to the Skill catalog or install it into AI IDE Skill directories.

## Decisions

### Decision 1: Introduce a dedicated Tool catalog and app flow

`tmlus tools` will read structured Tool definitions from a catalog. A Tool definition should include a stable ID, display name, purpose, recommendation level, command/package metadata, supported AI IDE targets, project artifacts, and adapter strategy.

This keeps external tools separate from Skills and AI IDE environments, matching the existing architecture guidance. The CLI layer collects arguments or selection results, then calls an app-level Tool installation use case. Tool-specific behavior belongs in `adapters/tools/` and app orchestration, not in `cli/index.ts`.

Alternative considered: add CodeGraph as a special-case branch in CLI parsing. That is faster, but it would break the Resource Catalog pattern and make later tools harder to add.

### Decision 2: Make `tools` single-select but visually aligned with `skills`

The command should render a table with:

```text
Name | Purpose | Recommend
```

Unlike `skills`, tool installation is single-select because each tool can have a different installation and adaptation workflow. The UI can reuse table rendering primitives, but selection behavior should confirm one tool with Enter.

Alternative considered: multi-select all tools like Skills. That creates mixed progress, failure, and confirmation semantics too early, especially for tools that modify user-level AI IDE MCP config.

### Decision 3: Follow CodeGraph's official minimal integration path

The CodeGraph adapter should perform these phases:

```text
detect/install CLI
  -> configure supported AI IDE MCP target
  -> initialize current project with codegraph init
  -> ensure .codegraph/ is ignored
  -> verify with codegraph status
```

For CLI installation, TmlUs can prefer a standard npm installation path for `@colbymchenry/codegraph` when the command is missing, while still treating CodeGraph as an external tool. For project initialization, current CodeGraph versions index by default through `codegraph init`; older-compatible `-i` usage is acceptable but not required.

Alternative considered: use `npx @colbymchenry/codegraph` interactive installer directly. That would delegate too much UX and write behavior to a nested installer, making it harder for TmlUs to provide consistent summaries, safety checks, and idempotency.

### Decision 4: Prefer MCP-delivered guidance over per-mode or per-file rules

CodeGraph's current official guidance states that the MCP server delivers agent usage instructions automatically during initialize, and that the installer no longer needs to write duplicated instruction blocks into files such as `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, or Cursor rules.

Therefore TmlUs should make the MCP connection reliable and avoid separate development-mode adaptation. A short project summary or final message can tell the user that CodeGraph is available as the agent's code map, but TmlUs should not write long CodeGraph usage rules by default.

Alternative considered: write TML-specific CodeGraph rules for vibecoding, spec-coding, and harness-coding. That adds maintenance burden and can conflict with CodeGraph's own MCP instructions while solving less than reliable MCP setup does.

### Decision 5: Treat AI IDE MCP configuration as an environment adaptation concern

CodeGraph is a Tool, while Codex, Claude, Cursor, Gemini, OpenCode/opencode, and similar hosts are AI IDE environments. The CodeGraph Tool flow may need to write MCP configuration for those environments, but Tool Adapter and Environment Adapter responsibilities should stay separate:

- Environment definitions describe supported AI IDEs and their config locations or target capabilities.
- The CodeGraph tool adapter provides MCP snippets or command arguments.
- The app flow composes both and performs safe writes through workspace/config helpers.

Unsupported combinations such as a TmlUs-supported AI IDE that CodeGraph does not officially support should be reported as skipped, not failed.

## Risks / Trade-offs

- [Risk] CodeGraph installer behavior or supported agent list changes over time. -> Mitigation: isolate version and command assumptions in the CodeGraph adapter and test output parsing with fixtures where possible.
- [Risk] MCP config writes can affect user-level files outside the project. -> Mitigation: require explicit selection/confirmation for AI IDE adaptation and use safe, idempotent merge behavior rather than blind overwrite.
- [Risk] Installing CodeGraph from npm can require network access. -> Mitigation: detect existing installations first, report actionable next steps on failure, and keep diagnostic behavior useful offline.
- [Risk] Cursor and other IDEs can have path or workspace-root quirks. -> Mitigation: follow CodeGraph's official MCP config shape for each target and validate with print-config or adapter tests.
- [Risk] `.codegraph/` can be accidentally committed. -> Mitigation: ensure `.gitignore` contains `.codegraph/` during project initialization and include a verification case.
- [Risk] Tool selection UI can regress terminal rendering. -> Mitigation: reuse existing table selector rendering constraints and add command checks for narrow/non-TTY behavior.
