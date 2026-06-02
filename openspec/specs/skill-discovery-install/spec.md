## Purpose

Specify maintained Skill discovery, selection, download, compatibility handling, and installation into supported AI IDE environments.

## Requirements

### Requirement: Maintained Skill catalog

TmlUs SHALL maintain a structured catalog of available skills.

The Skill catalog MUST be loaded from the official remote catalog by default, with local cache and bundled catalog fallback. Each Skill entry MUST include Skill ID, display name, source, category, functional description, installer metadata, and supported AI IDE environment targets.

#### Scenario: Skill list comes from loaded catalog

- **WHEN** the user runs `tmlus skills`
- **THEN** TmlUs displays skills from the loaded maintained Skill catalog

#### Scenario: New Skill can be added through remote catalog

- **WHEN** a maintainer adds a valid new Skill entry to the official remote catalog
- **THEN** the Skill can appear in `tmlus skills` after catalog refresh without publishing a new TmlUs CLI version

#### Scenario: Humanizer-zh appears as content creation Skill

- **WHEN** the official remote catalog is available
- **THEN** `tmlus skills` can display `Humanizer-zh`
- **THEN** its category is `内容创作`

### Requirement: Interactive Skill listing and selection

TmlUs SHALL support interactive Skill discovery through `tmlus skills`.

The command MUST present skills in a selectable list with Skill name, source, category, and functional description. The list MUST support pagination and multi-select.

#### Scenario: User browses paged Skill list

- **WHEN** the maintained Skill catalog has more items than one page
- **THEN** `tmlus skills` allows the user to navigate pages

#### Scenario: User selects multiple skills

- **WHEN** the user selects multiple skills and confirms
- **THEN** TmlUs proceeds to target AI IDE environment selection for all selected skills

### Requirement: Target IDE selection for Skill install

After Skill selection, TmlUs SHALL ask which AI IDE environments should receive the selected skills.

The target IDE selection MUST prioritize already existing AI IDE environments, MUST still allow selecting supported but not-yet-initialized environments, MUST support multi-select, and MUST support installing to all existing AI IDE directories when the user chooses to skip target selection.

#### Scenario: Existing IDEs are prioritized

- **WHEN** the current project has existing supported AI IDE directories
- **THEN** the Skill target selection shows those environments before missing environments

#### Scenario: Install to all existing IDEs by default path

- **WHEN** the user skips target IDE selection
- **THEN** TmlUs installs selected skills to all currently existing supported AI IDE environments

#### Scenario: Missing IDE can be selected

- **WHEN** the user selects a supported AI IDE environment that is not yet initialized
- **THEN** TmlUs initializes the required environment folders before installing compatible selected skills

### Requirement: Direct Skill install arguments

TmlUs SHALL support direct Skill installation arguments through `tmlus skills`.

When Skill IDs are provided, TmlUs MUST skip Skill selection. When target IDE names are provided, TmlUs MUST skip target IDE selection. If no target IDE is provided, TmlUs MUST default to all existing supported AI IDE environments.

#### Scenario: Direct Skill install to specified IDE

- **WHEN** the user runs `tmlus skills tml-docs-spec-generate --ide codex`
- **THEN** TmlUs installs the `tml-docs-spec-generate` Skill into the Codex environment without Skill or IDE selection prompts

#### Scenario: Direct Skill install to existing IDEs

- **WHEN** the user runs `tmlus skills tml-docs-spec-generate` without an IDE target
- **THEN** TmlUs installs the Skill into all existing supported AI IDE environments

### Requirement: Skill download and progress

TmlUs SHALL download selected skills from their catalog source when installation requires remote content.

Downloads MUST support bounded concurrency and MUST display progress in interactive TTY mode. The output MUST include a final summary of successful, skipped, and failed installations.

#### Scenario: Concurrent downloads show progress

- **WHEN** multiple selected skills require remote download
- **THEN** TmlUs downloads them with bounded concurrency and shows progress for interactive users

#### Scenario: Download failure is reported

- **WHEN** a Skill download fails
- **THEN** TmlUs reports the failed Skill and target environment without claiming total success

### Requirement: Per-environment Skill install compatibility

TmlUs SHALL install skills according to each AI IDE environment's supported target strategy.

If a selected Skill is not compatible with a selected environment, TmlUs MUST skip that combination with a clear message instead of creating arbitrary unsupported folders.

#### Scenario: Unsupported Skill target is skipped

- **WHEN** a selected Skill does not support the selected AI IDE environment
- **THEN** TmlUs skips that install target and explains why

#### Scenario: Compatible Skill target is installed

- **WHEN** a selected Skill supports the selected AI IDE environment
- **THEN** TmlUs installs the Skill into the catalog-defined target path for that environment

### Requirement: Skill UI follows design language

TmlUs Skill listing, selection, progress, and summary output SHALL comply with `docs/spec/DESIGN.md`.

The output MUST be readable without color, MUST avoid decorative animation in CI/non-TTY/quiet modes, and MUST keep progress/status text explicit.

#### Scenario: Skill progress is text-readable

- **WHEN** TmlUs shows Skill install progress
- **THEN** the current action and completion state are understandable from text, not only color

#### Scenario: Quiet mode suppresses decoration

- **WHEN** the user runs `tmlus skills` with `--quiet` or `--no-banner`
- **THEN** decorative output is suppressed while essential results remain available

### Requirement: Search and recommendation deferred

TmlUs SHALL support explicit remote Skill discovery through configured search sources.

TmlUs MUST use the `tml-skills` source by default for `tmlus skills search`. TmlUs MUST NOT show the official TmlUs catalog as a Search Source because `tmlus skills` already uses it directly. TmlUs SHALL still defer semantic search, ranking, online recommendation, and personalized recommendation behavior.

#### Scenario: Default search uses TML-Skills source

- **WHEN** the user runs `tmlus skills search`
- **THEN** TmlUs discovers remote Skills from the configured `tml-skills` search source

#### Scenario: User selects TML-Skills source

- **WHEN** the user runs `tmlus skills search --search tml-skills`
- **THEN** TmlUs discovers remote Skills from the configured `tml-skills` search source

#### Scenario: Recommendation remains unavailable

- **WHEN** the user runs `tmlus skills`
- **THEN** the command does not expose semantic ranking, online recommendation, or personalized recommendation behavior

### Requirement: Skill catalog loading feedback

TmlUs SHALL show lightweight Skill catalog loading feedback when `tmlus skills` loads the catalog in an interactive terminal.

The loading feedback MUST be suppressed in quiet mode, CI, non-TTY output, and dumb terminal environments.

#### Scenario: Interactive catalog loading shows progress

- **WHEN** the user runs `tmlus skills` in an interactive terminal
- **THEN** TmlUs shows a small progress indicator or animation while loading the Skill catalog

#### Scenario: Non-interactive catalog loading stays clean

- **WHEN** the user runs `tmlus skills` in CI, quiet mode, non-TTY output, or a dumb terminal
- **THEN** TmlUs does not show loading animation output
