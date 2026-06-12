## Context

TmlUs 的 Skill 搜索能力位于 Resource Catalog 与 GitHub Tool Adapter 之间：`tmlus skills search` 先读取远程搜索源注册表，再从 GitHub 来源发现可安装 Skill，最后复用现有 Skill 安装流程写入用户选择的 AI IDE 环境。

当前实现只列出搜索源目录下的一层子目录，并把每个目录名直接转换成远程 Skill。这适合 `Time-Machine-Lab/TML-Skills/skills/<skill-id>` 这种扁平结构，但不适合 `mattpocock/skills` 这种分类嵌套结构。该仓库的真实 Skill 位于 `skills/<category>/<skill-id>/SKILL.md`，其中 `SKILL.md` frontmatter 已包含 `name` 和 `description`。

用户验证结论：

- GitHub recursive tree API 可一次列出 `mattpocock/skills` 的文件树，`truncated=false`。
- 当前仓库内能发现 29 个 `SKILL.md`。
- 29 个 `SKILL.md` 都包含可解析的 `name` 和 `description`。
- 顺序读取 29 个 raw 文件约 14 秒；并发限制为 8 时约 2.5 秒。

因此最大设计问题不是能否解析，而是如何在不引入平台服务和新依赖的前提下控制网络请求、限流、缓存和降级体验。

## Goals / Non-Goals

**Goals:**

- 支持搜索源声明自身的中文描述，让用户在选择来源时理解该来源解决的问题。
- 支持对 GitHub 搜索源递归发现包含 `SKILL.md` 的真实 Skill 目录。
- 支持读取远程 `SKILL.md` frontmatter，用于生成远程 Skill 的名称、分类和中文能力描述。
- 接入 `mattpocock/skills` 作为可选搜索源，并展示中文来源描述。
- 对已有扁平搜索源保持兼容，`tml-skills` 仍为默认搜索源。
- 控制远程搜索的请求数、并发和缓存，保证 CLI 交互体验可接受。

**Non-Goals:**

- 不做语义搜索、排序推荐、个性化推荐或评分系统。
- 不引入远程服务、账号体系、数据库、托管 dashboard 或集中式索引服务。
- 不自动翻译任意第三方 Skill 描述；本次只要求搜索源描述使用中文，并允许对已知来源配置中文描述。
- 不默认展示 `deprecated`、`personal` 等不适合团队默认安装的分类，除非搜索源配置明确允许。

## Decisions

### 1. 搜索源模型增加描述和递归发现配置

在 `SkillSearchSource` 中增加可选字段：

- `description?: string`：搜索源中文描述，说明该来源解决的问题。
- `discovery?: { strategy: 'directory' | 'skill-manifest'; maxDepth?: number; includeCategories?: string[]; excludeCategories?: string[] }` 或等价结构。

默认策略保持现状：未声明 `discovery` 时仍按一层目录扫描，保证现有 `tml-skills` 搜索源行为不变。

备选方案是只增加 `skillDirectoryDepth`。这个字段更简单，但表达不了“只接受包含 `SKILL.md` 的目录”和分类过滤，后续接入其他第三方仓库时容易继续加散落字段。`discovery.strategy` 更清晰，也更符合 Resource Catalog 的元数据边界。

### 2. 使用 GitHub recursive tree 发现 Skill manifest

对 `discovery.strategy = 'skill-manifest'` 的 GitHub 来源，GitHub adapter 先通过 recursive tree 列出文件树，再筛选：

- 路径必须位于搜索源目录下。
- 文件名必须为 `SKILL.md`。
- 相对目录深度必须在 `maxDepth` 限制内。
- 若配置了 `includeCategories` 或 `excludeCategories`，按搜索源目录后的第一段路径作为 category 过滤。

备选方案是递归调用 GitHub contents API。它实现直观，但请求数随目录数量增长，不如 tree API 稳定。recursive tree 一次请求能覆盖已验证仓库，遇到 `truncated=true` 时再降级到 archive fallback 或现有一层扫描。

### 3. 读取 frontmatter 生成远程 SkillDefinition

发现 `SKILL.md` 后，读取 raw 文件并解析 frontmatter：

- `name` 优先用于显示名；缺失时使用目录名。
- `description` 用于远程 Skill 描述；缺失时使用搜索源描述或 displayName。
- `category` 优先使用路径分类，映射或回退到搜索源 category。
- `source` 指向 Skill 所在目录，而不是 `SKILL.md` 文件。
- `installer.strategy` 继续使用 `github-directory`。
- `targets` 使用 `COMMON_SKILL_TARGETS`。

frontmatter parser 保持轻量，只支持当前 Skill 生态需要的简单 YAML 子集：`key: value`、quoted string、`>`/`|` 多行字符串。这样不新增运行时依赖，也避免把 YAML 完整语义引入 CLI。

### 4. 搜索源描述和 Skill 描述展示

交互式搜索源选择中，`detail` 优先展示 `source.description`，没有描述时回退到 `source.source` 或 `category`。

远程 Skill 选择中，不再只显示名字和 id，而是展示至少：

- Skill name
- category
- 中文能力描述或 frontmatter description

对于 `mattpocock/skills`，搜索源自身必须配置中文描述，描述它解决 AI Coding 中的需求对齐、反馈环、TDD、诊断、架构治理、PRD/Issue 拆分、交接等问题。每个 Skill 的 description 可以先来自 frontmatter；如果后续希望全量中文化，可在 registry 中增加 source-level translation map，但本次不引入这层维护成本。

### 5. 网络请求、缓存和降级

远程 manifest 搜索需要两级数据：

1. tree/listing 结果。
2. 每个 `SKILL.md` 的 frontmatter。

实现应使用 bounded concurrency 读取 frontmatter，建议默认并发 6 到 8。manifest 搜索结果应进入现有 Skill catalog cache 体系或独立的 search-result cache，TTL 可复用 4 小时默认值。

降级顺序：

1. fresh cache。
2. 远程 tree + frontmatter。
3. stale cache。
4. 对该 source 回退到现有一层目录扫描。
5. 单个 source 失败时报告该 source，不影响其他 source 的搜索结果。

这种策略保持 TmlUs local-first 和可降级特性，不要求用户始终在线。

## Risks / Trade-offs

- GitHub API 限流 -> 使用 cache、bounded concurrency、`GITHUB_TOKEN`/`GH_TOKEN` 现有认证头，并在失败时回退 stale cache 或一层扫描。
- 第三方仓库结构不一致 -> 只有声明 `skill-manifest` 的 source 启用递归 manifest 发现；未声明的源保持原行为。
- frontmatter 格式过于复杂 -> 轻量 parser 只承诺支持 Skill frontmatter 常用子集；解析失败时回退目录名和搜索源描述。
- 中文描述维护成本 -> 本次只要求搜索源描述中文化；第三方 Skill 自身 description 先使用原始 frontmatter，避免维护大规模翻译表。
- 搜索结果太多 -> 通过 `includeCategories`、`excludeCategories`、`maxDepth` 控制范围，`mattpocock/skills` 默认排除 `deprecated`、`personal`，并可选择排除 `in-progress`。
- CLI 输出拥挤 -> 复用现有表格选择器和 detail 展示，长描述需要截断/换行，遵守 `docs/spec/DESIGN.md` 的可读性与降级要求。
