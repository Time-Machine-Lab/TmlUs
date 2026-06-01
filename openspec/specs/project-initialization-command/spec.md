## Purpose

Specify the guided project initialization command for TmlUs.

## Requirements

### Requirement: Guided project initialization command

TmlUs SHALL provide `tmlus init` as an interactive project initialization command that orchestrates project setup steps in a stable order.

The ordered initialization steps MUST be:

1. banner
2. workdir
3. ide
4. tml-spec
5. skills
6. work-mode

#### Scenario: User runs guided initialization

- **WHEN** the user runs `tmlus init` in an interactive terminal
- **THEN** TmlUs runs the initialization flow in the defined step order
- **AND** it reports the result of each executed step

#### Scenario: Init displays startup banner

- **WHEN** the user runs `tmlus init` in an interactive terminal where banner output is enabled
- **THEN** TmlUs renders the startup banner before the initialization prompts

#### Scenario: Init suppresses banner

- **WHEN** the user runs `tmlus init --quiet` or `tmlus init --no-banner`
- **THEN** TmlUs suppresses decorative banner output for that invocation

### Requirement: Project working directory selection

TmlUs SHALL allow the user to choose the project working directory during `tmlus init`.

The default working directory MUST be the current process working directory. All later init steps MUST read from and write to the selected project root.

#### Scenario: User accepts default working directory

- **WHEN** the user runs `tmlus init` and confirms the default working directory
- **THEN** all later initialization steps target the current process working directory

#### Scenario: User enters another working directory

- **WHEN** the user runs `tmlus init` and enters a different working directory
- **THEN** all later initialization steps target the entered directory

#### Scenario: Working directory cannot be used

- **WHEN** the selected working directory cannot be resolved or created
- **THEN** TmlUs reports the directory problem
- **AND** it does not write initialization files outside the selected project root

### Requirement: Init reuses AI IDE selection for Skill targets

TmlUs SHALL reuse AI IDE environments selected during the `ide` step as Skill installation targets during the `skills` step.

The `skills` step in `tmlus init` MUST NOT ask the user to choose target AI IDE environments again when the `ide` step has already selected or resolved them.

#### Scenario: Skills install to selected IDEs

- **WHEN** the user selects Codex during the `ide` step
- **AND** the user proceeds to the `skills` step
- **THEN** selected Skills install to Codex without another target IDE selection prompt

#### Scenario: Init starts after IDE step

- **WHEN** the user runs `tmlus init --from skills`
- **THEN** TmlUs uses existing initialized AI IDE environments as the default Skill targets
- **AND** it reports a clear error if no supported target environments can be found

### Requirement: Starter Skill defaults in init

TmlUs SHALL provide a starter Skill path during `tmlus init`.

When the user chooses to skip custom Skill selection, TmlUs MUST install the default starter Skills `skill-creator` and `tml-docs-spec-generate` into the resolved AI IDE targets.

#### Scenario: User uses default Skills

- **WHEN** the user skips custom Skill selection during `tmlus init`
- **THEN** TmlUs installs `skill-creator` and `tml-docs-spec-generate` into the resolved AI IDE targets

#### Scenario: User selects custom Skills

- **WHEN** the user selects one or more custom Skills during `tmlus init`
- **THEN** TmlUs installs the selected Skills instead of the default starter set

### Requirement: Init resume from step

TmlUs SHALL support `tmlus init --from <step>` for resuming the initialization workflow from a named step.

The command MUST skip all earlier steps and continue through the selected step and every later step. Supported step names MUST include `workdir`, `ide`, `tml-spec`, `skills`, and `work-mode`.

#### Scenario: Resume from TML Docs structure step

- **WHEN** the user runs `tmlus init --from tml-spec`
- **THEN** TmlUs skips `workdir` and `ide`
- **AND** it runs `tml-spec`, `skills`, and `work-mode` in order

#### Scenario: Unknown resume step

- **WHEN** the user runs `tmlus init --from unknown-step`
- **THEN** TmlUs reports the unknown step name
- **AND** it lists the supported step names

### Requirement: Init cancellation stops workflow

TmlUs SHALL stop the `tmlus init` workflow when the user cancels an interactive selection.

Cancellation MUST be distinguishable from confirming an empty selection.

#### Scenario: User cancels IDE selection

- **WHEN** the user cancels the AI IDE selection during `tmlus init`
- **THEN** TmlUs stops the initialization workflow
- **AND** it does not run later steps

### Requirement: Init output follows CLI design language

TmlUs initialization output SHALL comply with `docs/spec/DESIGN.md`.

The output MUST remain readable without color, MUST not rely only on icons or color for status, and MUST suppress decorative output in CI, non-TTY, `--quiet`, and machine-oriented modes.

#### Scenario: Init runs in CI

- **WHEN** `tmlus init` runs in CI or non-TTY output
- **THEN** decorative banner and animation output is suppressed
- **AND** step result text remains readable

#### Scenario: Init reports partial failure

- **WHEN** one initialization step fails after earlier steps succeeded
- **THEN** TmlUs reports which steps completed and which step failed
- **AND** it does not claim the full initialization succeeded
