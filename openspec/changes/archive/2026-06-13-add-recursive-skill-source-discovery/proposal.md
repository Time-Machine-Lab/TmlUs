## Why

TmlUs 的远程 Skill 搜索目前只能把搜索源下的一层子目录当作 Skill，无法正确接入 `mattpocock/skills` 这类按分类嵌套组织的高价值仓库。用户在选择远程来源和远程 Skill 时，也缺少中文化的问题描述，难以判断某个来源或 Skill 能解决什么工程问题。

这个改动让 TmlUs 能发现第三方仓库中真实包含 `SKILL.md` 的目录，并把 Skill frontmatter 中的能力描述转换为面向中文用户的展示说明，降低团队探索和安装外部 Skill 的成本。

## What Changes

- 扩展远程 Skill Search Source 元数据，支持搜索源自身的中文 `description`，用于说明该来源能解决的问题。
- 扩展 GitHub Skill 搜索能力，支持递归发现包含 `SKILL.md` 的 Skill 目录，而不是只扫描搜索源下第一层目录。
- 读取远程 `SKILL.md` frontmatter 中的 `name`、`description` 等元数据，并用于远程 Skill 列表展示和安装定义生成。
- 为 `mattpocock/skills` 增加搜索源，默认面向用户展示中文描述，说明它解决 AI Coding 中需求对齐、反馈环、TDD、诊断、架构治理、PRD/Issue 拆分、交接等工程问题。
- 搜索源和远程 Skill 展示遵守现有 CLI 输出规范，在交互式选择、无色输出、CI/non-TTY、`--quiet` 等场景下保持可读。
- 保持现有一层目录搜索源兼容；不改变已配置的 `tml-skills` 默认搜索来源行为。
- 非目标：不引入语义搜索、个性化推荐、在线排名、远程服务、账号体系、数据库或托管平台。

## Capabilities

### New Capabilities

### Modified Capabilities

- `remote-skill-catalog`: 远程搜索源注册表需要支持来源中文描述、递归 Skill manifest 发现配置，并纳入 `mattpocock/skills` 作为可选搜索源。
- `skill-discovery-install`: `tmlus skills search` 需要展示搜索源描述，并在远程 Skill 结果中展示来自 `SKILL.md` 的中文能力描述。

## Impact

- 影响代码：
  - `tmlus-core/src/catalog/skill-catalog.ts`
  - `tmlus-core/src/app/skill-search.ts`
  - `tmlus-core/src/adapters/tools/github-skill-source.ts`
  - `tmlus-core/src/ui/selection.ts`
  - `tmlus-core/src/catalog/skills.ts` 或相关 fallback 数据
  - `data/skills/search-sources.json`
  - `tmlus-core/scripts/fixtures/remote-skill-search-sources.json`
  - `tmlus-core/scripts/check-skill-catalog.mjs`
- 影响文档：
  - `docs/TmlUs命令Wiki.md`
- 影响行为：
  - `tmlus skills search` 可从嵌套 Skill 仓库发现真实 Skill。
  - 远程 Skill 选择列表展示每个 Skill 解决的问题，而不是只显示目录名。
  - 搜索源选择列表展示来源解决的问题，帮助用户判断是否要搜索该来源。
- 外部依赖：
  - 继续使用 GitHub HTTP/API 与 raw 文件访问，不新增 npm 运行时依赖。
  - 需要 bounded concurrency 和缓存/降级策略，避免搜索体验过慢或 GitHub API 限流影响 CLI 可用性。
