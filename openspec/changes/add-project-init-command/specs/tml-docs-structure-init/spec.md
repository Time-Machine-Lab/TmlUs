## ADDED Requirements

### Requirement: TML Docs structure command
TmlUs SHALL provide `tmlus tml-spec` as a standalone command for initializing the standard TML Docs folder structure in the selected project root.

The command MUST create or verify these project-root-relative directories:

- `docs`
- `docs/design`
- `docs/api`
- `docs/sql`
- `docs/preview`
- `docs/spec`

#### Scenario: User initializes TML Docs structure
- **WHEN** the user runs `tmlus tml-spec`
- **THEN** TmlUs creates the standard TML Docs directories under the current project root
- **AND** it reports created and existing directories

#### Scenario: TML Docs structure targets selected init project
- **WHEN** `tmlus init` calls the TML Docs structure step after the user selected a project root
- **THEN** TmlUs creates or verifies the standard TML Docs directories under that selected project root

### Requirement: TML Docs gitkeep preservation
TmlUs SHALL preserve `.gitkeep` files for the standard TML Docs structure.

Each standard TML Docs directory MUST contain a `.gitkeep` file after successful initialization unless an existing non-directory path blocks creation.

#### Scenario: Gitkeep files are created
- **WHEN** the user runs `tmlus tml-spec` in a project without TML Docs directories
- **THEN** each standard TML Docs directory contains a `.gitkeep` file

#### Scenario: Existing gitkeep files are preserved
- **WHEN** the user runs `tmlus tml-spec` in a project where `.gitkeep` files already exist
- **THEN** TmlUs leaves the existing `.gitkeep` files in place
- **AND** it does not duplicate or overwrite unrelated files

### Requirement: TML Docs structure repair
TmlUs SHALL detect incomplete TML Docs folder structures and repair missing directories or `.gitkeep` files.

The command MUST be idempotent and safe to run multiple times.

#### Scenario: Missing subdirectory is repaired
- **WHEN** the project contains `docs` but lacks `docs/sql`
- **THEN** `tmlus tml-spec` creates `docs/sql`
- **AND** it creates `docs/sql/.gitkeep`

#### Scenario: Repeated command is idempotent
- **WHEN** the user runs `tmlus tml-spec` twice in the same project
- **THEN** the second run reports existing directories and files
- **AND** it does not create duplicate content

### Requirement: TML Docs path safety
TmlUs SHALL scope all `tmlus tml-spec` writes to the selected project root.

If a target path would resolve outside the selected project root, TmlUs MUST refuse the write and report the problem.

#### Scenario: Path escapes project root
- **WHEN** a TML Docs target path would resolve outside the selected project root
- **THEN** TmlUs refuses the write
- **AND** it reports the unsafe path

### Requirement: TML Docs output follows CLI design language
TmlUs TML Docs structure output SHALL comply with `docs/spec/DESIGN.md`.

The command MUST keep status text explicit and MUST suppress decorative output in CI, non-TTY, `--quiet`, and machine-oriented modes.

#### Scenario: Quiet TML Docs initialization
- **WHEN** the user runs `tmlus tml-spec --quiet`
- **THEN** TmlUs suppresses decorative output
- **AND** it still exits according to whether initialization succeeded
