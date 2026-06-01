## ADDED Requirements

### Requirement: CodeGraph tool catalog entry

TmlUs SHALL include CodeGraph as a supported Tool in the Tool catalog.

The CodeGraph Tool entry MUST identify CodeGraph as an external tool, not a Skill or AI IDE environment. The entry MUST describe its purpose as local code intelligence for AI agents and SHOULD assign it the highest recommendation level among initial Tool entries.

#### Scenario: CodeGraph appears in tools
- **WHEN** the user runs `tmlus tools`
- **THEN** CodeGraph appears as a recommended Tool with its purpose and recommendation level

#### Scenario: CodeGraph is not a Skill
- **WHEN** the user runs `tmlus skills`
- **THEN** CodeGraph is not displayed as a Skill installation option

### Requirement: CodeGraph CLI availability

TmlUs SHALL detect whether the `codegraph` CLI is available before initializing CodeGraph.

If CodeGraph is missing, TmlUs MUST attempt the configured installation strategy or report a clear manual installation command. If CodeGraph is present, TmlUs MUST query its version and continue without reinstalling by default.

#### Scenario: Existing CodeGraph installation
- **WHEN** `codegraph version` succeeds
- **THEN** TmlUs records CodeGraph as existing and continues the Tool flow

#### Scenario: Missing CodeGraph installation
- **WHEN** `codegraph version` fails
- **THEN** TmlUs either installs CodeGraph through the configured strategy or reports how to install `@colbymchenry/codegraph`

### Requirement: CodeGraph project initialization

TmlUs SHALL initialize CodeGraph in the selected project root after CodeGraph CLI availability is confirmed.

The CodeGraph Tool flow MUST run project initialization against the selected project root, MUST treat an existing `.codegraph/` directory as idempotent state, and MUST verify the result with `codegraph status`.

#### Scenario: New project index
- **WHEN** the selected project has no `.codegraph/` directory
- **THEN** TmlUs initializes CodeGraph for that project and verifies status

#### Scenario: Existing project index
- **WHEN** the selected project already has `.codegraph/`
- **THEN** TmlUs treats the project index as existing or refreshable state instead of failing

#### Scenario: Status verification fails
- **WHEN** `codegraph status` fails after initialization
- **THEN** TmlUs reports the failure and provides the next command the user can run manually

### Requirement: CodeGraph ignore handling

TmlUs SHALL ensure the selected project does not accidentally commit CodeGraph local index data.

The CodeGraph Tool flow MUST ensure `.codegraph/` is ignored by the selected project's `.gitignore` when a project-level `.gitignore` is present or can be safely created. Existing `.gitignore` content MUST be preserved.

#### Scenario: Gitignore updated
- **WHEN** CodeGraph is initialized and `.gitignore` does not ignore `.codegraph/`
- **THEN** TmlUs adds an ignore entry for `.codegraph/` without removing existing content

#### Scenario: Gitignore already ignores CodeGraph
- **WHEN** `.gitignore` already ignores `.codegraph/`
- **THEN** TmlUs does not add a duplicate entry

### Requirement: CodeGraph AI IDE MCP adaptation

TmlUs SHALL adapt CodeGraph to supported AI IDE environments through MCP configuration.

The CodeGraph Tool flow MUST configure the selected or detected supported AI IDE target so it can launch `codegraph serve --mcp`. TmlUs MUST keep CodeGraph as a Tool while treating Codex, Claude, Cursor, Gemini, OpenCode/opencode, and similar hosts as AI IDE environments. Unsupported targets MUST be skipped with a clear reason.

#### Scenario: Supported AI IDE is configured
- **WHEN** the user selects a supported AI IDE target during the CodeGraph Tool flow
- **THEN** TmlUs configures that environment to launch `codegraph serve --mcp`

#### Scenario: Unsupported AI IDE is skipped
- **WHEN** the selected AI IDE is not supported by the CodeGraph adapter
- **THEN** TmlUs skips MCP configuration for that environment and reports why

#### Scenario: MCP configuration is idempotent
- **WHEN** CodeGraph MCP configuration already exists for an AI IDE
- **THEN** TmlUs does not create duplicate MCP server entries

### Requirement: CodeGraph agent guidance remains official and lightweight

TmlUs SHALL rely on CodeGraph's official MCP-delivered agent guidance instead of installing long duplicated CodeGraph instruction blocks by default.

The CodeGraph Tool flow MUST NOT create separate CodeGraph behavior rules for vibecoding, spec-coding, or harness-coding. It MAY print a concise completion note explaining that CodeGraph is available to the agent through MCP.

#### Scenario: No mode-specific rules are written
- **WHEN** the user installs CodeGraph through `tmlus tools codegraph`
- **THEN** TmlUs does not write separate CodeGraph rule files for different development modes

#### Scenario: Completion note is concise
- **WHEN** CodeGraph installation completes
- **THEN** TmlUs tells the user that their AI IDE may need to restart before CodeGraph MCP tools are available
