## Purpose

Specify the TmlUs CLI self-update command behavior.

## Requirements

### Requirement: CLI latest version check

TmlUs SHALL provide `tmlus update` to compare the currently installed CLI version with the latest published `@time-machine-lab/tmlus` version available from npm.

The command MUST use the current package version as the local version and MUST compare versions using semantic version ordering rather than plain string ordering.

#### Scenario: Newer version is detected

- **WHEN** the user runs `tmlus update` and npm reports a latest version greater than the current CLI version
- **THEN** the command reports that an update is available and proceeds to the update flow

#### Scenario: Current version is already latest

- **WHEN** the user runs `tmlus update` and npm reports a latest version equal to or lower than the current CLI version
- **THEN** the command reports that TmlUs is already current and does not reinstall the package

#### Scenario: Latest version cannot be checked

- **WHEN** the user runs `tmlus update` and the latest npm version cannot be queried
- **THEN** the command reports the lookup failure, keeps the current installation unchanged, and exits with a non-zero status

### Requirement: Global npm update execution

When a newer version is available and the active installation can be updated through npm global installation, TmlUs SHALL update itself by running npm global installation for `@time-machine-lab/tmlus@latest`.

The command MUST use the platform-appropriate npm executable and MUST surface a clear manual command when automatic installation fails.

#### Scenario: Global update succeeds

- **WHEN** the user runs `tmlus update`, a newer version is available, and `npm install -g @time-machine-lab/tmlus@latest` succeeds
- **THEN** the command reports that TmlUs was updated from the previous version to the latest version

#### Scenario: Global update fails

- **WHEN** the user runs `tmlus update`, a newer version is available, and npm global installation fails
- **THEN** the command reports the failure, includes a manual npm install command, and exits with a non-zero status

#### Scenario: Active invocation should not be mutated automatically

- **WHEN** the user runs `tmlus update` from an invocation mode that cannot be confidently updated in place, such as npx
- **THEN** the command reports the latest version and provides appropriate npm or npx guidance without claiming that the active invocation was updated

### Requirement: Post-update verification

After npm installation succeeds, TmlUs SHALL verify that the installed CLI resolves to the expected latest version or report that verification requires user action.

#### Scenario: Updated version is visible

- **WHEN** npm installation succeeds and the installed `tmlus version` resolves to the latest version
- **THEN** the command reports the update as verified

#### Scenario: Updated version is not visible yet

- **WHEN** npm installation succeeds but the installed `tmlus version` does not resolve to the latest version
- **THEN** the command reports that installation completed but verification failed and suggests restarting the terminal or checking the npm global bin path

### Requirement: Update output behavior

TmlUs update output SHALL follow the CLI design language and MUST remain readable in plain text, CI, non-TTY, no-color, and `--quiet` contexts.

The command MUST NOT display decorative startup animation in quiet or no-banner contexts and MUST NOT include ANSI escape output when color is disabled.

#### Scenario: Quiet update output

- **WHEN** the user runs `tmlus update --quiet`
- **THEN** the command prints only essential update status or error information

#### Scenario: Plain output remains readable

- **WHEN** the user runs `tmlus update` in CI, non-TTY, or no-color output
- **THEN** the command output remains readable and contains no broken ANSI escape sequences

#### Scenario: Failed update exits non-zero

- **WHEN** `tmlus update` cannot check, install, or verify an available update
- **THEN** the command sets a non-zero exit status
