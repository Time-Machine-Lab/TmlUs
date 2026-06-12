## 1. Search Source Schema

- [x] 1.1 Extend `SkillSearchSource` normalization to accept optional `description`.
- [x] 1.2 Add opt-in discovery metadata for manifest-based GitHub Skill discovery, including depth and category filtering.
- [x] 1.3 Keep existing search source JSON without discovery metadata valid and behavior-compatible.
- [x] 1.4 Update bundled search source fallback data to include the new optional fields where needed.

## 2. GitHub Manifest Discovery

- [x] 2.1 Add a GitHub adapter function that lists `SKILL.md` manifest paths under a source directory using recursive tree discovery.
- [x] 2.2 Filter manifest paths by configured max depth, include categories, and exclude categories.
- [x] 2.3 Add archive or existing directory-scan fallback when recursive tree discovery fails or is truncated.
- [x] 2.4 Add a lightweight frontmatter parser for `name` and `description`, including simple multiline `>` and `|` values.
- [x] 2.5 Fetch multiple remote manifests with bounded concurrency and source-specific error handling.

## 3. Search Flow Integration

- [x] 3.1 Update `searchRemoteSkills` to branch between existing one-level discovery and manifest-based discovery per source.
- [x] 3.2 Construct remote `SkillDefinition` values from manifest metadata, with safe fallbacks for missing or invalid frontmatter.
- [x] 3.3 Point each discovered Skill source to the containing Skill directory, not the `SKILL.md` file.
- [x] 3.4 Cache manifest-based search metadata or integrate it with the existing remote catalog cache policy.
- [x] 3.5 Ensure a failed source does not prevent successful sources from returning results.

## 4. Matt Pocock Source Metadata

- [x] 4.1 Add `mattpocock-skills` to `data/skills/search-sources.json`.
- [x] 4.2 Write the source `description` in Chinese, explaining the engineering problems it solves.
- [x] 4.3 Configure manifest discovery for `github:mattpocock/skills/skills`.
- [x] 4.4 Exclude `deprecated` and `personal` categories by default; decide whether `in-progress` is excluded or clearly marked before implementation.
- [x] 4.5 Update fixture search source data to cover source descriptions and manifest discovery metadata.

## 5. CLI Display

- [x] 5.1 Update search source selection detail text to prefer source description.
- [x] 5.2 Update remote Skill selection to show name, category, and functional description instead of only the Skill name.
- [x] 5.3 Ensure long Chinese descriptions wrap or truncate cleanly in the existing selector.
- [x] 5.4 Preserve readable output in no-color, non-TTY, CI, and `--quiet` contexts.

## 6. Tests and Validation

- [x] 6.1 Extend `check-skill-catalog.mjs` coverage for search source descriptions.
- [x] 6.2 Add fixture coverage for manifest-based discovery metadata normalization.
- [x] 6.3 Add tests or checks for frontmatter parsing fallback behavior.
- [x] 6.4 Add tests or checks that excluded categories do not appear in manifest search results.
- [x] 6.5 Run `npm run build` and `npm run check:skill-catalog` from `tmlus-core`.

## 7. Documentation

- [x] 7.1 Update `docs/TmlUs命令Wiki.md` to explain search source descriptions.
- [x] 7.2 Document that `mattpocock-skills` can be selected through `tmlus skills search --search mattpocock-skills`.
- [x] 7.3 Document that remote Skill descriptions come from `SKILL.md` frontmatter when available.
