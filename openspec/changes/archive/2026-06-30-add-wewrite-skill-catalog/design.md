## Context

`tmlus skills` loads the maintained Skill catalog from `data/skills/catalog.json`, with cache and bundled fallback behavior defined by the existing Resource Catalog architecture. The CLI also ships a fallback catalog in `tmlus-core/src/catalog/skills.ts` for offline use or when remote catalog loading is disabled.

WeWrite (`github:oaker-io/wewrite`) is already structured as a Skill repository with a root `SKILL.md` plus supporting `references/`, `scripts/`, `toolkit/`, `personas/`, and configuration templates. The existing installer strategy `github-root-skill` can install this shape by copying explicit include paths into the target Skill directory.

## Goals / Non-Goals

**Goals:**

- Make WeWrite discoverable through `tmlus skills` as an official content creation Skill.
- Keep remote catalog and bundled fallback behavior consistent.
- Install WeWrite through existing Skill installation code without a new installer strategy.
- Keep docs and development checks aligned with the expanded catalog.

**Non-Goals:**

- Do not vendor the WeWrite repository into this repository.
- Do not add hosted services, accounts, dashboards, databases, or new APIs.
- Do not change `tmlus skills search` sources.
- Do not install WeWrite dependencies during catalog installation; dependency setup remains WeWrite's own `install.sh` responsibility after Skill installation.

## Decisions

1. Use `github-root-skill` with explicit `includePaths`.

   Rationale: WeWrite is a single root Skill rather than a bundle under a `skills/` directory. Explicit include paths keep installation bounded and avoid copying runtime-generated user data such as `config.yaml`, `style.yaml`, `history.yaml`, `output/`, `.venv/`, or exemplar content.

   Alternative considered: use `github-directory` to clone/copy the whole repository. This would include more source material than needed and risks pulling generated or development-only directories.

2. Add the entry to both official catalog data and bundled fallback source.

   Rationale: The remote catalog path lets maintainers update the default catalog without a CLI release, while the bundled fallback preserves local-first behavior when remote loading is disabled or unavailable.

   Alternative considered: update only `data/skills/catalog.json`. This would work for normal remote catalog loading but would make `TMLUS_DISABLE_REMOTE_CATALOG=1` and offline fallback inconsistent.

3. Keep the category aligned with existing content creation Skills.

   Rationale: WeWrite belongs with `humanizer-zh` as a content creation capability. Using the same category keeps interactive browsing and docs coherent.

4. Remove the interrupted local `.codex/skills/wewrite` placeholder.

   Rationale: That directory is an accidental project-local installed Skill stub, not catalog source data. Leaving it in the repository would confuse catalog maintenance with installation output.

## Risks / Trade-offs

- Upstream WeWrite may add new required resource directories → Mitigation: include the stable runtime directories currently used by `SKILL.md` and keep catalog checks focused on installer strategy and ID resolution; update include paths when upstream changes require it.
- WeWrite has Python dependencies and optional WeChat/image API credentials → Mitigation: catalog installation only installs the Skill files; WeWrite's own onboarding and `install.sh` handle dependency and credential setup.
- Existing documentation uses a manually maintained official Skill table → Mitigation: update the table and checks in the same change so the command reference remains accurate.
