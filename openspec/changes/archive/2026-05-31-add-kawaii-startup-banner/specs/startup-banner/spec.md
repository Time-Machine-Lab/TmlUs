## ADDED Requirements

### Requirement: Branded Startup Banner

The system SHALL provide a TmlUs startup banner that presents a TML lettermark and product identity in a terminal-native format inspired by the approved `kawaii-terminal-v1` preview.

#### Scenario: Interactive startup displays branded banner

- **WHEN** a user runs `tmlus` in an interactive terminal that supports the full banner
- **THEN** the system SHALL display a TML lettermark, TmlUs identity text, and kawaii terminal styling before the primary command content

#### Scenario: Banner follows approved visual direction

- **WHEN** the startup banner is displayed with styling enabled
- **THEN** the system SHALL use the approved pink, aqua, mint, gold, and violet visual direction from `docs/banner-preview.html`

### Requirement: Animated Startup Experience

The system SHALL provide a lightweight animated startup sequence for capable interactive terminals.

#### Scenario: Animation runs in capable terminal

- **WHEN** stdout is a TTY, CI is not detected, terminal width is sufficient, color is supported, and banner output is enabled
- **THEN** the system SHALL render a brief animated sequence before settling on a readable final banner state

#### Scenario: Animation remains bounded

- **WHEN** the animated banner runs
- **THEN** the system SHALL complete the animation without requiring user input and without delaying command execution beyond a short bounded startup flourish

### Requirement: Static Fallback

The system SHALL provide a static fallback banner for environments where animation is not appropriate but human-readable branded output is still acceptable.

#### Scenario: Narrow terminal uses compact output

- **WHEN** a user runs `tmlus` in an interactive terminal narrower than the full banner layout requires
- **THEN** the system SHALL render a compact static banner that does not wrap incoherently

#### Scenario: Unsupported color uses readable output

- **WHEN** the terminal does not support color output
- **THEN** the system SHALL render a readable monochrome banner or compact text identity without ANSI color artifacts

### Requirement: Automation-Safe Output

The system SHALL avoid animated or decorative startup output in automation and machine-consumed contexts.

#### Scenario: CI skips decorative animation

- **WHEN** the system detects a CI environment
- **THEN** the system SHALL skip animated banner output

#### Scenario: Piped output stays clean

- **WHEN** stdout is not a TTY
- **THEN** the system SHALL avoid animated control sequences and decorative frames in stdout

### Requirement: User-Controlled Banner Visibility

The system SHALL allow users to disable banner output explicitly.

#### Scenario: No-banner flag suppresses banner

- **WHEN** the user runs a command with `--no-banner`
- **THEN** the system SHALL suppress startup banner output for that invocation

#### Scenario: Quiet flag suppresses banner

- **WHEN** the user runs a command with `--quiet`
- **THEN** the system SHALL suppress startup banner output for that invocation

#### Scenario: Environment variable suppresses banner

- **WHEN** `TMLUS_NO_BANNER=1` is present in the environment
- **THEN** the system SHALL suppress startup banner output for that invocation

### Requirement: Command Output Stability

The system SHALL keep functional CLI output stable and readable regardless of banner mode.

#### Scenario: Version output remains plain

- **WHEN** the user runs `tmlus version`
- **THEN** the system SHALL print only the version-oriented output without startup banner animation

#### Scenario: Help output remains readable

- **WHEN** the user runs `tmlus help`
- **THEN** the system SHALL print help content that remains readable whether the banner is enabled, static, or suppressed

#### Scenario: Banner failure does not fail command

- **WHEN** banner rendering encounters an unsupported terminal capability or internal rendering error
- **THEN** the system SHALL continue executing the requested command without treating banner rendering as a command failure
