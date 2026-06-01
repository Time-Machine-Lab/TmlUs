## Purpose

Specify the project guidance documents that define TmlUs architecture, development guidelines, CLI output rules, and tool categories.

## Requirements

### Requirement: Architecture design document

The project SHALL include a TmlUs architecture design document at `docs/design/TmlUs架构设计文档.md`.

The architecture document MUST describe TmlUs as a local-first AI Helper / AI Tools toolbox and MUST cover system context, core scenarios, logical module boundaries, runtime flows, local deployment shape, and key architecture trade-offs.

The architecture document MUST NOT introduce platformization, hosted services, account systems, database schemas, API contracts, object field definitions, or code style rules.

#### Scenario: Architecture document is generated

- **WHEN** this change is applied
- **THEN** `docs/design/TmlUs架构设计文档.md` exists and describes the TmlUs local-first toolbox architecture

#### Scenario: Architecture scope remains bounded

- **WHEN** the architecture document is reviewed
- **THEN** it does not define API request parameters, database tables, object fields, Git workflow, lint rules, or platform backend design

### Requirement: Development guidelines document

The project SHALL include a TmlUs development guidelines document at `docs/spec/TmlUs开发规范文档.md`.

The development guidelines MUST define only the development rules needed for a TypeScript/Node local CLI toolbox, including project structure, boundary rules, AI IDE environment adapters, external tool adapters, resource catalogs, safe file writing, diagnostics, tests, and release validation.

The development guidelines MUST NOT include database governance, business API contracts, hosted service monitoring, frontend component systems, or microservice deployment rules.

#### Scenario: Development guidelines document is generated

- **WHEN** this change is applied
- **THEN** `docs/spec/TmlUs开发规范文档.md` exists and defines development rules for TmlUs as a local TypeScript/Node CLI toolbox

#### Scenario: Unneeded server-side rules are excluded

- **WHEN** the development guidelines are reviewed
- **THEN** they do not require database operations, API endpoint governance, production service monitoring, or platform deployment practices

### Requirement: CLI design language reference

The development guidelines SHALL require all CLI output design and implementation to follow `docs/spec/DESIGN.md`.

The guidelines MUST preserve these CLI behavior constraints: decorative output is disabled for `version`, JSON or machine-readable output, CI logs, non-TTY output, and explicit quiet/no-banner modes; important information MUST remain understandable without color; startup animation MUST be short and non-blocking.

#### Scenario: CLI output rules reference DESIGN.md

- **WHEN** a developer reads `docs/spec/TmlUs开发规范文档.md`
- **THEN** they can find an explicit rule requiring CLI output to comply with `docs/spec/DESIGN.md`

#### Scenario: Machine-readable output remains clean

- **WHEN** future CLI commands support JSON, CI, non-TTY, `--quiet`, or `--no-banner` modes
- **THEN** those modes are governed by the development guidelines to suppress decorative output and preserve parseable text

### Requirement: AI environment and external tool categories

The project guidance documents SHALL distinguish AI IDE environments from external tools.

Codex, Claude, Cursor, Gemini, OpenCode, and Trae MUST be described as AI IDE environments that receive skills, commands, prompts, or configuration. OpenSpec, spec-kit, harness, codegraph, package managers, and remote repositories MUST be described as external tools or resource sources.

#### Scenario: AI IDE environment category is clear

- **WHEN** architecture or development guidelines describe Codex, Claude, or Cursor
- **THEN** they are categorized as user AI IDE environments rather than external tools

#### Scenario: External tool category is clear

- **WHEN** architecture or development guidelines describe OpenSpec, spec-kit, harness, or codegraph
- **THEN** they are categorized as external tools that TmlUs may detect, install, initialize, sync, or diagnose
