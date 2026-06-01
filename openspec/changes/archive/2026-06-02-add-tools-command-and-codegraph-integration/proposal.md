## Why

TmlUs already positions external tools such as codegraph as part of the team's local AI development toolbox, but there is no dedicated command for discovering and installing those tools. Team members still need to manually learn each tool's installation, project initialization, AI IDE MCP configuration, and validation steps, which creates the same setup drift that `ide` and `skills` were created to remove.

CodeGraph is a strong first tool integration because its official workflow is intentionally lightweight: install the CLI, configure the MCP server for the user's agent, initialize the current project index, and let the MCP server's own initialize instructions guide the agent during normal coding.

## What Changes

- Add `tmlus tools` as an interactive external tool discovery and installation command.
- Render recommended tools in a table with tool name, purpose, and recommendation level, using a single-select flow similar to the current `skills` UI and keyboard behavior.
- Support direct tool selection arguments such as `tmlus tools codegraph` to skip the table.
- Add a structured Tool catalog and app-level tool installation flow so tools are not hard-coded in CLI parsing.
- Add CodeGraph as the first maintained Tool integration.
- For CodeGraph, install or validate the `codegraph` CLI, initialize the selected project with `codegraph init`, ensure `.codegraph/` is ignored, configure supported AI IDE MCP integration, and verify with `codegraph status`.
- Prefer CodeGraph's official MCP-delivered agent instructions instead of writing duplicated long rules into per-IDE instruction files.
- Leave development-mode-specific behavior out of scope: TmlUs will not create separate CodeGraph integrations for vibecoding, spec-coding, or harness-coding.
- Leave hosted services, accounts, dashboards, project databases, and replacement implementations of CodeGraph out of scope.

## Capabilities

### New Capabilities
- `tool-discovery-install`: Covers the `tmlus tools` command, Tool catalog, interactive table selection, direct tool arguments, and installation summary behavior.
- `codegraph-tool-integration`: Covers CodeGraph as a Tool, including CLI detection/installation, project initialization, `.codegraph/` ignore handling, AI IDE MCP configuration, and validation.

### Modified Capabilities
- `dynamic-help-command`: Help output must include the new `tools` command family and examples.

## Impact

- Affected code: `tmlus-core/src/cli/index.ts`, `tmlus-core/src/cli/command-registry.ts`, `tmlus-core/src/core/types.ts`, `tmlus-core/src/catalog/*`, `tmlus-core/src/app/*`, `tmlus-core/src/adapters/tools/*`, `tmlus-core/src/ui/*`, `tmlus-core/src/workspace/*`, and command verification scripts.
- Affected specs: new tool discovery/install and CodeGraph integration capabilities; dynamic help command update.
- External dependency: `@colbymchenry/codegraph` / `codegraph` CLI, installed or invoked as a local external tool. TmlUs does not vendor or reimplement CodeGraph.
- User-facing behavior: `tmlus tools` becomes the guided path for external tool setup, with CodeGraph available as a recommended tool that can be installed and adapted to the current AI IDE environment.
- Project writes: CodeGraph integration may create `.codegraph/` under the selected project and update `.gitignore`; AI IDE MCP configuration writes must follow existing safe write and idempotency expectations.
