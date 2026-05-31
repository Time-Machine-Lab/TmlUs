## Context

TmlUs is being shaped as a local-first AI Helper / AI Tools toolbox for the TML team. It is not a hosted platform and will not introduce server-side accounts, databases, dashboards, or team administration backends. Its first responsibility is to help team members initialize projects, install AI capabilities, sync TML conventions, and diagnose local project health.

Current state:

- The project already has a concept document at `docs/TmlUs项目概念介绍文档.md`.
- CLI visual language exists at `docs/spec/DESIGN.md`.
- `openspec/config.yaml` is still mostly scaffolded and does not yet mount TmlUs project context.
- Architecture and development guideline documents do not yet exist.
- `.codex/prompts/tml-covenant-sync.md` defines the intent of syncing TML public knowledge into an AI coding mode configuration.

Stakeholders:

- TML developers using Codex, Claude, Cursor, Gemini, OpenCode, Trae, or similar AI IDE environments.
- Maintainers who need TML skills, commands, recipes, and diagnostics to stay consistent across projects.
- AI agents operating through OpenSpec that need stable project context before generating proposals, specs, tasks, or code.

## Goals / Non-Goals

**Goals:**

- Create a TmlUs architecture design document under `docs/design/`.
- Create a TmlUs development guidelines document under `docs/spec/`.
- Ensure the development guidelines reference and enforce `docs/spec/DESIGN.md` for CLI output.
- Update `openspec/config.yaml` so OpenSpec artifacts receive the correct TmlUs project context and rules.
- Keep all new documentation focused on the local AI Helper / AI Tools toolbox model.

**Non-Goals:**

- Do not design or introduce a hosted platform, team backend, account system, database, or API server.
- Do not define business API contracts, database schemas, object fields, or endpoint details.
- Do not implement the runtime CLI features in this change; this change prepares the governing docs and OpenSpec context.
- Do not classify Codex, Claude, or Cursor as external tools. They are user AI IDE environments.

## Decisions

### Decision: Treat TmlUs as a local-first AI Helper toolbox

TmlUs documentation SHALL describe the system as a local CLI-centered helper, not a platform. This keeps the architecture aligned with the product intent: fast local setup, capability installation, context sync, and diagnostics.

Alternatives considered:

- **Hosted platform:** rejected because the user explicitly ruled out platformization and the project does not need accounts, services, or server-side data.
- **Generic scaffolding CLI:** rejected because TmlUs is broader than project file scaffolding; it manages TML AI capabilities and conventions.

### Decision: Separate AI IDE environments from external tools

Codex, Claude, Cursor, Gemini, OpenCode, and Trae SHALL be documented as AI IDE environments. TmlUs installs skills, commands, prompts, or config into those environments. OpenSpec, spec-kit, harness, codegraph, package managers, and remote repositories SHALL be treated as external tools or resource sources.

This distinction prevents a misleading architecture where user environments and installable external tools are mixed into one adapter category.

### Decision: Use architecture docs for system boundaries and development docs for coding rules

The architecture document SHALL follow the TML architecture template and focus on context, scenarios, module boundaries, runtime flows, local deployment shape, and trade-offs. The development guidelines SHALL follow the TML development guidelines template and focus on code organization, project structure, naming, testing, CI/release, file-writing safety, adapter rules, diagnostics, and CLI output.

This avoids duplicating code style details in the architecture document or adding system design diagrams to the development guidelines.

### Decision: Sync context into `openspec/config.yaml` using current OpenSpec config shape

The existing OpenSpec config scaffold describes project context as a top-level `context` block and per-artifact constraints as `rules`. The sync task SHALL preserve `schema: spec-driven`, add a concise context block referencing TmlUs concept, architecture, development guidelines, and CLI design language, and add rules for relevant artifact phases.

The `.codex/prompts/tml-covenant-sync.md` prompt remains the conceptual reference for what should be synced, but the actual YAML shape SHALL match this repository's OpenSpec config scaffold.

### Decision: Keep generated docs concise and scoped

The architecture and development guidelines SHALL include only the constraints necessary for TmlUs. They SHALL avoid unnecessary enterprise sections such as database operations, API governance, service monitoring, platform deployment, or frontend component systems.

## Risks / Trade-offs

- [Risk] Documentation becomes too broad and starts describing a platform.
  → Mitigation: Explicitly list platformization, server-side systems, accounts, databases, and hosted dashboards as non-goals.

- [Risk] AI IDE environments and external tools are conflated.
  → Mitigation: Use two naming categories throughout docs: Environment Adapters and Tool Adapters.

- [Risk] OpenSpec config syntax drifts from the local scaffold.
  → Mitigation: Preserve the generated `schema: spec-driven` config and use the config fields shown in the scaffold comments.

- [Risk] CLI design language is forgotten when later implementing output.
  → Mitigation: Add development guideline rules that require `docs/spec/DESIGN.md` for CLI output behavior, degradation, quiet mode, CI behavior, and non-TTY output.

- [Risk] Documentation over-specifies implementation before code exists.
  → Mitigation: Keep architecture at module-boundary level and development guidelines at coding-rule level; defer specific implementation details to later changes.

## Migration Plan

1. Generate `docs/design/TmlUs架构设计文档.md` from the TML architecture design template.
2. Generate `docs/spec/TmlUs开发规范文档.md` from the TML development guidelines template.
3. Update `openspec/config.yaml` to include TmlUs project context and lifecycle rules.
4. Validate the OpenSpec change and confirm the new docs contain no template frontmatter or placeholders.
5. Future implementation changes will use the new docs and config as governing context.

Rollback is straightforward because this change only adds documentation and updates OpenSpec configuration. Reverting the added docs and restoring the prior `openspec/config.yaml` removes the change.

## Open Questions

- Should the first architecture document include a minimal module diagram in Mermaid/ASCII, or keep the first version purely textual?
- Should OpenSpec context rules include `docs/api/*.yaml` and `docs/sql/*.sql` now, even though TmlUs is not currently defining business APIs or database schemas?
