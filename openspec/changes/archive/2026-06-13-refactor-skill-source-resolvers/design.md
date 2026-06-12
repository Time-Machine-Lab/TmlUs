## Context

TmlUs 的 Skill 搜索能力属于 Resource Catalog 与 GitHub Tool Adapter 的协作边界：`tmlus skills search` 从 `data/skills/search-sources.json` 读取来源，再按来源规则发现远程 Skill，最后把发现结果交给既有 Skill 安装流程处理。

上一版递归发现已经验证了 `mattpocock/skills` 的可行性，但它仍把来源差异压缩到少数 `discovery.strategy`。这会继续产生两个问题：一是不同仓库结构很容易被错误套用同一种扫描逻辑；二是每接入一种新布局都需要往 CLI 代码里追加策略分支。

用户明确约束如下：

- 第三方仓库不是 TmlUs 自己维护的仓库，不能要求它们新增 `tmlus-source.json` 或 manifest。
- 远端 JS 虽然灵活，但会把搜索逻辑变成远端可执行代码；当前需求不需要引入这个安全和调试复杂度。
- TmlUs 应在自己的来源注册表中维护每个 source 的解析规则，并以结构化方式描述这个 source 能解决的问题。
- `deprecated` 等不适合默认展示的 Skill 不应出现在 Matt Pocock 来源结果中。

## Goals / Non-Goals

**Goals:**

- 将搜索来源配置从有限 `discovery.strategy` 升级为声明式 `resolver` 规则。
- 支持每个 source 用自己的 resolver 描述仓库布局、匹配 pattern、metadata 映射、过滤规则和安装路径模板。
- 支持 `TML-Skills` 的扁平布局，例如 `skills/{id}/SKILL.md`。
- 支持 `mattpocock/skills` 的分类布局，例如 `skills/{category}/{id}/SKILL.md`，并默认排除 `deprecated`、`personal`、`in-progress`。
- 不要求第三方仓库维护 TmlUs 专用 manifest。
- 不执行远端 JS，保持本地 CLI 可审计、可测试、可降级。
- 保留现有缓存、GitHub token、失败降级和 Skill 安装流程。

**Non-Goals:**

- 不做语义搜索、推荐排序、个性化推荐或评分系统。
- 不引入服务端索引、数据库、账号体系、远程 dashboard 或 API 服务。
- 不自动翻译第三方 Skill 的所有描述；来源描述由 TmlUs 注册表维护为中文，Skill 描述优先来自 `SKILL.md` frontmatter。
- 不把 resolver 设计成通用脚本插件系统。

## Decisions

### 1. 使用声明式 resolver，而不是远端 JS

`search-sources.json` 中每个 source 增加 `resolver` 字段，用声明式规则表达搜索逻辑。示例：

```json
{
  "id": "mattpocock-skills",
  "source": "github:mattpocock/skills",
  "description": "提供 AI Coding 工作流 Skill，覆盖需求对齐、反馈循环、TDD、调试、架构治理、PRD/Issue 拆分和会话交接等问题。",
  "resolver": {
    "type": "github-skill-files",
    "patterns": ["skills/{category}/{id}/SKILL.md"],
    "metadata": {
      "name": "frontmatter.name",
      "description": "frontmatter.description",
      "category": "path.category"
    },
    "installSource": "skills/{category}/{id}",
    "excludeCategories": ["deprecated", "personal", "in-progress"]
  }
}
```

远端 JS 的替代方案被排除，因为它会让 CLI 在搜索阶段执行仓库提供的代码，带来供应链风险、调试困难、缓存失效不可控和跨 Node 版本兼容问题。当前问题本质是仓库路径结构差异，声明式 pattern 足够表达。

第三方 manifest 的替代方案也被排除，因为外部仓库没有义务维护 TmlUs 专用文件。TmlUs 可以维护“如何理解该仓库”的规则，但不要求对方修改仓库。

### 2. resolver 首期只支持 GitHub Skill 文件模式

首期定义 `github-skill-files` resolver：

- 通过 GitHub tree 或等价目录枚举获取仓库文件路径。
- 使用 `patterns` 匹配 `SKILL.md` 文件路径。
- 从 pattern 中提取 `{id}`、`{category}` 等 path variables。
- 只在 metadata 映射需要 frontmatter 时读取对应 `SKILL.md`。
- 根据 `installSource` 模板生成安装来源目录。

可接受的 resolver 类型可以预留为：

```ts
type SkillSearchResolverType =
  | 'github-skill-files'
  | 'github-directory'
  | 'github-root-skill';
```

但本次核心实现应优先落地 `github-skill-files`，并将旧的一层目录发现映射为兼容 resolver 或 fallback，避免同时扩散多个新分支。

### 3. metadata 映射限制为可审计表达式

resolver 的 `metadata` 字段只允许引用受控来源：

- `path.<name>`：来自 pattern 捕获变量，例如 `path.id`、`path.category`。
- `frontmatter.<name>`：来自 `SKILL.md` frontmatter，例如 `frontmatter.name`、`frontmatter.description`。
- `source.<name>`：来自搜索源自身配置，例如 `source.description`、`source.category`。
- 字面 fallback 可由实现中的默认顺序处理，不在本次引入复杂表达式语言。

SkillDefinition 构造建议顺序：

- `id`：`metadata.id`，否则 `path.id`。
- `name`：`frontmatter.name`，否则 `path.id`。
- `category`：`metadata.category`，否则 `path.category`，否则 source category。
- `description`：`frontmatter.description`，否则 source description，最后回退到 name。
- `source`：`github:<owner>/<repo>/<installSource>`。
- `installer.strategy`：默认复用 `github-directory`。

这种设计比远端函数少了完全自由度，但换来可校验、可缓存、可测试和可解释。

### 4. 过滤规则属于 source resolver

`includeCategories`、`excludeCategories` 等过滤规则放在 resolver 中，由每个 source 自己声明。对 Matt Pocock 来源，默认排除：

- `deprecated`
- `personal`
- `in-progress`

这样不会把“哪些分类适合展示”写死到全局搜索逻辑里，也不会影响 TML-Skills 等其他来源。

### 5. 缓存键必须包含 resolver 配置

远程搜索结果缓存不能只按 source URL 命中。缓存 key 必须包含：

- source id 或 source URL
- resolver type
- patterns
- metadata 映射
- include/exclude 过滤规则
- installSource 模板

否则修改 resolver 后可能继续展示旧结果。TTL 可以沿用现有 4 小时远程目录缓存策略；live fetch 失败时优先使用 fresh/stale cache，再进行 source 级 fallback 或报告失败。

### 6. 旧 discovery 配置保持兼容但不继续扩展

实现阶段可以接受现有 `discovery.strategy`，并在加载时转换为等价 resolver：

- 无 discovery：继续使用既有一层目录扫描 fallback。
- `skill-manifest`：转换为 `github-skill-files` resolver。

新增来源应使用 `resolver`，旧字段只作为迁移兼容层。这样可以避免一次性破坏已有数据，同时把后续扩展入口统一到 resolver。

## Risks / Trade-offs

- [Risk] resolver DSL 表达能力不足，未来仓库布局仍有特殊情况 -> 先用 pattern、metadata、filter 覆盖已知布局；只有出现真实需求时再扩展受控表达式，不提前做脚本系统。
- [Risk] GitHub tree API 结果过大或被截断 -> 保留现有目录扫描和 archive fallback；单个 source 失败不影响其他 source。
- [Risk] 读取多个 `SKILL.md` 增加网络请求 -> 只在 metadata 需要 frontmatter 时读取文件，并使用 bounded concurrency 与缓存。
- [Risk] metadata 映射配置错误导致结果缺字段 -> 加载 search source 时做 schema 校验；单个 Skill 映射失败时跳过或使用 fallback，并在 verbose/诊断中暴露原因。
- [Risk] 中文来源描述仍需 TmlUs 维护 -> 维护的是 source 级问题描述，不是第三方仓库的逐 Skill manifest，成本可控。
- [Risk] 兼容旧 discovery 会短期存在两套字段 -> 文档和 fixtures 标注 `resolver` 为新入口，旧字段只读不写，后续可单独归档迁移。

## Migration Plan

1. 在 source registry 类型和校验中加入 `resolver`。
2. 为旧 `discovery.strategy` 增加内部转换或 fallback。
3. 将 `tml-skills` 配置为 `skills/{id}/SKILL.md` 的 flat resolver。
4. 将 `mattpocock-skills` 配置为 `skills/{category}/{id}/SKILL.md` 的 category resolver，并排除不展示分类。
5. 更新 search flow 以 resolver 为主路径，旧 discovery 为兼容路径。
6. 更新 fixtures、命令 Wiki 和 catalog 校验脚本。

Rollback 策略：保留旧 discovery/fallback 路径；如果 resolver 搜索出现严重问题，可以临时移除 source 的 resolver 配置，让该 source 回到旧行为或禁用该 source，而不影响官方 Skill catalog 与既有安装流程。

## Open Questions

- 是否需要在 CLI 中暴露 `--include-category deprecated` 之类的高级参数，临时覆盖 source resolver 过滤规则？本次默认不做。
- 是否需要为 source-level 中文描述增加独立文档字段，例如 `problemDescription`，以区别普通说明？本次先复用 `description`。
