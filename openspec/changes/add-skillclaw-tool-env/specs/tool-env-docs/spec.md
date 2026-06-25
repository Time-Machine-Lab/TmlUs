## ADDED Requirements

### Requirement: User-level Tool env root

TmlUs SHALL maintain a platform-independent user-level Tool env root for Tool-specific runtime documents and metadata.

The env root MUST be derived from the current user's home directory and MUST NOT hard-code operating-system-specific paths such as a specific Windows username. By default, the env root MUST resolve to `~/.tmlus/env` on Windows, macOS, and Linux. TmlUs MUST create the env root when a command needs it and it does not exist.

#### Scenario: Env root is created on demand

- **WHEN** a Tool flow requires the user-level env root
- **AND** `~/.tmlus/env` does not exist
- **THEN** TmlUs creates `~/.tmlus/env` under the current user's home directory

#### Scenario: Env root is platform independent

- **WHEN** TmlUs resolves the Tool env root on Windows, macOS, or Linux
- **THEN** it uses the current user's home directory
- **AND** it does not rely on a hard-coded path such as `C:\Users\WIN11`

### Requirement: Tool document package preparation

TmlUs SHALL support preparing a Tool-specific document package under the user-level Tool env root.

A document package MUST include required files declared by package metadata, MUST write them under `~/.tmlus/env/<tool-id>`, and MUST produce or preserve a manifest that TmlUs can use to validate local package completeness.

#### Scenario: Document package is prepared

- **WHEN** a Tool document package is prepared for Tool ID `skillclaw`
- **THEN** TmlUs writes required package files under `~/.tmlus/env/skillclaw`
- **AND** TmlUs writes a manifest file under `~/.tmlus/env/skillclaw`

#### Scenario: Partial package is incomplete

- **WHEN** a Tool env folder exists
- **AND** one or more required files declared by the manifest are missing
- **THEN** TmlUs treats the Tool document package as incomplete

### Requirement: Remote document package

TmlUs SHALL obtain maintained Tool document packages from a configured remote static source.

When the remote source is unavailable, invalid, or incomplete, TmlUs MUST fail document package preparation and report an actionable error. TmlUs MUST NOT use a bundled SkillClaw document fallback.

#### Scenario: Remote package succeeds

- **WHEN** the configured remote document package is available and complete
- **THEN** TmlUs prepares the Tool env from the remote package
- **AND** the summary identifies the remote source

#### Scenario: Remote package failure fails preparation

- **WHEN** the configured remote document package cannot be fetched or validated
- **THEN** TmlUs does not mark the Tool env as complete
- **AND** the summary identifies the remote package failure

### Requirement: Tool env output degradation

Tool env document preparation output SHALL remain readable across interactive, quiet, CI, non-TTY, and no-color modes.

The output MUST distinguish prepared, refreshed, existing, skipped, and failed states without relying on color or decorative animation.

#### Scenario: Quiet output remains actionable

- **WHEN** a user prepares a Tool document package with quiet output enabled
- **THEN** TmlUs prints only essential status and next-step text

#### Scenario: Non-color output remains readable

- **WHEN** color output is disabled
- **THEN** the Tool env preparation result still names the Tool, target env path, status, and next step in plain text
