## 1. Prepare Source Context

- [x] 1.1 Review `docs/TmlUs项目概念介绍文档.md` and confirm the local AI Helper / AI Tools toolbox positioning is reflected.
- [x] 1.2 Review `docs/spec/DESIGN.md` and extract the CLI output constraints that must be referenced by the development guidelines.
- [x] 1.3 Review `.codex/prompts/tml-covenant-sync.md` and map its TML public-knowledge sync intent to the current `openspec/config.yaml` scaffold.

## 2. Create Project Guidance Documents

- [x] 2.1 Generate `docs/design/TmlUs架构设计文档.md` from the TML architecture design template.
- [x] 2.2 Ensure the architecture document describes TmlUs as local-first, CLI-first, Recipe-driven, Environment-adaptive, and Catalog-based.
- [x] 2.3 Ensure the architecture document distinguishes AI IDE environments from external tools and excludes platform/backend/database/API details.
- [x] 2.4 Generate `docs/spec/TmlUs开发规范文档.md` from the TML development guidelines template.
- [x] 2.5 Ensure the development guidelines define TypeScript/Node CLI structure, safe file writing, adapters, catalogs, diagnostics, tests, and release validation.
- [x] 2.6 Ensure the development guidelines explicitly require CLI output to comply with `docs/spec/DESIGN.md`.

## 3. Sync OpenSpec Context

- [x] 3.1 Update `openspec/config.yaml` while preserving `schema: spec-driven`.
- [x] 3.2 Add project context references for `docs/TmlUs项目概念介绍文档.md`, `docs/design/*.md`, `docs/spec/**/*.md`, and `docs/spec/DESIGN.md`.
- [x] 3.3 Add OpenSpec lifecycle rules requiring proposal/design/tasks/apply artifacts to use the TmlUs concept, architecture, development guidelines, and CLI design language.
- [x] 3.4 Confirm the config uses the repository's current OpenSpec config shape rather than incompatible fields copied directly from the covenant prompt.

## 4. Verify

- [x] 4.1 Verify generated docs contain no YAML frontmatter, template placeholders, or `example` fields.
- [x] 4.2 Verify docs do not introduce platformization, account systems, hosted services, database schemas, API contracts, or unrelated frontend UI rules.
- [x] 4.3 Run OpenSpec validation for `define-project-docs-and-context`.
- [x] 4.4 Review `openspec status --change define-project-docs-and-context` and confirm the change is apply-ready.
