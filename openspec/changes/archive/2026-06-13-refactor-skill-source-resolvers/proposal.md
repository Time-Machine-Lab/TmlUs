## Why

`tmlus skills search` 需要接入多个结构不同的第三方 Skill 仓库，但当前搜索源配置只能表达少数内置 discovery strategy。结果是 TML-Skills、Matt Pocock Skills 等来源容易被错误套用同一种扫描逻辑，出现把分类目录当作 Skill、无法按来源结构展示 `category + description`、以及需要频繁修改 CLI 代码才能支持新仓库结构的问题。

这个改动把远程 Skill 搜索从“固定 strategy 字段”升级为“声明式 source resolver 规则”：TmlUs 维护每个来源的结构解析规则，第三方仓库无需配合维护 manifest，CLI 也不执行远端 JS。

## What Changes

- 将 search source 的 `discovery.strategy` 升级为正式的 `resolver` 配置，允许每个来源声明自己的仓库结构、匹配 pattern、metadata 映射、过滤规则和安装路径模板。
- 支持基于 GitHub tree 的通用 `github-skill-files` resolver，用 pattern 描述 flat、category、root skill 等仓库布局。
- 支持从路径变量、`SKILL.md` frontmatter、source 默认值中组合 Skill 的 `id`、`name`、`category`、`description` 和 `source`。
- TML-Skills 使用 flat layout 规则，例如 `skills/{id}/SKILL.md`，按真实 Skill 展示名称、分类和描述。
- Matt Pocock Skills 使用 category layout 规则，例如 `skills/{category}/{id}/SKILL.md`，并继续排除 `deprecated`、`personal`、`in-progress`。
- 保留现有搜索源缓存、降级和安装流程；已有目录扫描能力可作为兼容 resolver 或 fallback。
- 非目标：不要求第三方仓库新增 `tmlus-source.json` 或 manifest，不执行远端 JS，不引入账号、服务端索引、数据库、托管 dashboard、语义搜索或个性化推荐。

## Capabilities

### New Capabilities

### Modified Capabilities

- `remote-skill-catalog`: 远程搜索源注册表需要支持声明式 resolver 规则，用结构化配置描述每个来源的扫描方式、元数据映射和过滤规则。
- `skill-discovery-install`: `tmlus skills search` 需要按每个 source 的 resolver 生成可安装 Skill，并正确展示 Skill 名称、分类和描述。

## Impact

- 影响代码：
  - `tmlus-core/src/catalog/skill-catalog.ts`
  - `tmlus-core/src/app/skill-search.ts`
  - `tmlus-core/src/adapters/tools/github-skill-source.ts`
  - `data/skills/search-sources.json`
  - `tmlus-core/scripts/fixtures/remote-skill-search-sources.json`
  - `tmlus-core/scripts/check-skill-catalog.mjs`
- 影响文档：
  - `docs/TmlUs命令Wiki.md`
- 行为变化：
  - 每个搜索源可以独立定义结构规则，不再被统一的一层目录扫描或固定 manifest strategy 误伤。
  - TML-Skills 和 Matt Pocock Skills 都能在不改第三方仓库内容的前提下展示真实 Skill。
  - `deprecated` 等不应展示的分类可由来源规则显式排除。
- 兼容性：
  - 现有 `discovery.strategy` 可在实现中被迁移或兼容解析为新的 `resolver` 配置。
  - 旧 search source JSON 缺少 resolver 时必须保留可用 fallback。
