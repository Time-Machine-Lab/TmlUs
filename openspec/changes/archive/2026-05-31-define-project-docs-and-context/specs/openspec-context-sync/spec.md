## ADDED Requirements

### Requirement: OpenSpec config includes TmlUs project context

The project SHALL update `openspec/config.yaml` so OpenSpec artifacts receive TmlUs project context.

The config MUST preserve `schema: spec-driven` and MUST include context that points agents to the TmlUs concept document, architecture design documents, development guideline documents, and CLI design language.

#### Scenario: Config includes project context

- **WHEN** this change is applied
- **THEN** `openspec/config.yaml` still contains `schema: spec-driven`
- **AND** it includes TmlUs project context referencing `docs/TmlUs项目概念介绍文档.md`, `docs/design/*.md`, `docs/spec/**/*.md`, and `docs/spec/DESIGN.md`

### Requirement: OpenSpec config includes lifecycle rules

The project SHALL add OpenSpec lifecycle rules to `openspec/config.yaml` based on the intent of `.codex/prompts/tml-covenant-sync.md`.

The rules MUST instruct agents to reference project concept, architecture, and development guideline documents when creating artifacts. The rules MUST also require implementation-phase work to follow `docs/spec/` and `docs/spec/DESIGN.md` before writing code or CLI output.

#### Scenario: Proposal and design use project context

- **WHEN** an OpenSpec proposal or design artifact is created after this change
- **THEN** the config rules instruct the agent to ground the artifact in the TmlUs concept and architecture/development docs

#### Scenario: Implementation uses development guidelines

- **WHEN** an OpenSpec apply-stage implementation runs after this change
- **THEN** the config rules instruct the agent to read relevant `docs/spec/` documents and comply with the CLI design language before implementing code or CLI output

### Requirement: OpenSpec sync remains local and documentation-focused

The OpenSpec context sync SHALL only update local repository configuration and documentation context.

The sync MUST NOT introduce platform services, remote account dependencies, database dependencies, API contracts, or hosted synchronization mechanisms.

#### Scenario: Config sync does not introduce platform dependencies

- **WHEN** `openspec/config.yaml` is updated by this change
- **THEN** the update only adds local project context and rules
- **AND** it does not add hosted service, account, database, or API dependency requirements

### Requirement: Config update follows current repository OpenSpec shape

The config update SHALL follow the current `openspec/config.yaml` scaffold used by this repository.

The update MUST use the scaffold's project context and rules structure rather than copying incompatible fields directly from `.codex/prompts/tml-covenant-sync.md`.

#### Scenario: Config shape remains compatible

- **WHEN** the updated `openspec/config.yaml` is reviewed
- **THEN** it preserves the repository's OpenSpec config style and avoids incompatible configuration fields
