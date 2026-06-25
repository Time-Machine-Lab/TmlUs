# TmlUs 命令 Wiki

## 1. 命令总览 (Command Index)

| 命令 | 用途 | 常用场景 |
|------|------|----------|
| `tmlus init` | 引导完成项目目录、AI IDE、TML Docs、Skills 和工作模式初始化 | 新项目接入 TML AI 开发工作台 |
| `tmlus help` | 输出当前注册命令、全局选项和示例 | 用户或 Agent 快速查询命令 |
| `tmlus version` | 输出当前 CLI 版本，保持无装饰 | 脚本、发布和排查版本问题 |
| `tmlus update` | 检查当前 CLI 版本，并在 npm 有新版本时更新全局安装 | 保持本机 `tmlus` 与公开 npm 版本同步 |
| `tmlus refresh` | 清理 TmlUs 管理的本地 Skill 目录与远程搜索缓存 | 远程 Skill 列表异常或需要立即重建缓存 |
| `tmlus ide` | 检测并初始化 AI IDE 目录 | 为 Codex、Claude Code、Cursor、Trae、CodeBuddy 准备项目环境 |
| `tmlus skills` | 浏览、搜索并安装 TmlUs 维护的 AI Skills | 给当前项目安装团队认可的 Skill |
| `tmlus tools` | 浏览并安装外部工具适配 | 安装 CodeGraph 等可供 Agent 使用的外部工具 |
| `tmlus tml-spec` | 创建或修复 TML Docs 目录结构 | 为项目补齐 `docs/` 文档骨架 |
| `tmlus work-mode` | 初始化项目工作模式 | 接入 OpenSpec 或显式跳过工作模式初始化 |

## 2. 全局选项 (Global Options)

| 选项 | 说明 | 示例 |
|------|------|------|
| `--no-banner` | 关闭启动卡片和装饰性输出 | `tmlus help --no-banner` |
| `--quiet` | 只输出必要结果，适合脚本和自动化 | `tmlus ide codex --quiet` |
| `--lang <zh|en>` | 切换帮助输出语言 | `tmlus help --lang en` |
| `--language <zh|en>` | `--lang` 的等价写法 | `tmlus help --language en` |

环境变量：

- `TMLUS_NO_BANNER=1`：关闭启动视觉。
- `TMLUS_LANG=en`：默认使用英文帮助输出。
- `TMLUS_BANNER_STATIC=1`：在支持的交互式终端中使用静态启动视觉。
- `NO_COLOR=1`、`CI=1` 或非 TTY 输出：关闭颜色、动画或装饰性输出。

## 3. 命令详解 (Command Reference)

### 3.1 `tmlus init`

`tmlus init` 是项目初始化总入口，会按步骤处理工作目录、AI IDE、TML Docs、Skills 和工作模式。

```bash
tmlus init
tmlus init --from tml-spec --ide codex --work-mode skip
```

参数与选项：

| 参数 | 说明 |
|------|------|
| `--from <step>` | 从指定步骤继续初始化。支持 `workdir`、`ide`、`tml-spec`、`skills`、`work-mode` |
| `--ide <ideNames>` | 指定目标 AI IDE，多个值用逗号分隔，例如 `codex,claude` |
| `--work-mode <mode>` | 指定工作模式。支持 `openspec` 和 `skip` |

执行顺序：

1. `workdir`：选择或创建项目工作目录。
2. `ide`：初始化目标 AI IDE 环境目录。
3. `tml-spec`：创建或修复 TML Docs 目录结构。
4. `skills`：选择并安装 Skills。
5. `work-mode`：初始化 OpenSpec 或跳过。

适用建议：

- 新项目首选 `tmlus init`。
- 已经完成前置步骤时，使用 `--from` 从中间步骤继续。
- 自动化或脚本中建议显式传入 `--ide` 和 `--work-mode`，减少交互输入。

### 3.2 `tmlus help`

`tmlus help` 从命令注册表动态渲染帮助内容，包含命令、参数说明、全局选项和示例。

```bash
tmlus help
tmlus help --lang en
tmlus help --no-banner
```

说明：

- 默认输出中文友好的命令说明。
- 使用 `--lang en`、`--language en` 或 `TMLUS_LANG=en` 可以切换英文说明。
- 新命令必须先进入命令注册表，才能被 `tmlus help` 展示。

### 3.3 `tmlus version`

`tmlus version` 输出当前 CLI 包版本。

```bash
tmlus version
```

说明：

- 输出必须保持干净，不包含 banner、颜色、动画或额外说明。
- 适合发布脚本、CI 和用户排查本地版本。

### 3.4 `tmlus update`

`tmlus update` 用于检查当前安装的 TmlUs CLI 是否落后于 npm 公开发布版本，并在检测到新版本时尝试更新全局 npm 安装。

```bash
tmlus update
tmlus update --quiet
```

行为说明：

- 命令会读取当前 CLI 包版本，并通过 npm 查询 `@time-machine-lab/tmlus` 的 latest 版本。
- 当 latest 版本不高于当前版本时，命令报告 already-current，不会重复安装。
- 当 latest 版本高于当前版本，且当前调用可通过 npm 全局安装更新时，命令执行 `npm install -g @time-machine-lab/tmlus@latest`。
- 更新完成后会验证可见的 `tmlus version` 是否已经到达 latest 版本；如果验证失败，会提示重启终端或检查 npm global bin 是否在 `PATH` 中。
- 当命令从 `npx` 或 npm lifecycle 等无法确认可原地更新的调用方式运行时，只提供使用 latest 的指引，不会声明当前调用已更新。
- npm registry 查询失败、全局安装失败或验证失败时，命令会给出失败原因和可手动执行的恢复命令。
- `--quiet` 只输出必要状态或错误信息，适合脚本和自动化场景。

支持项：

| 项目 | 说明 |
|------|------|
| npm 包名 | `@time-machine-lab/tmlus` |
| 默认更新命令 | `npm install -g @time-machine-lab/tmlus@latest` |
| npx 最新版调用 | `npx @time-machine-lab/tmlus@latest <command>` |
| 失败退出码 | 查询、安装或验证失败时返回非零状态 |

### 3.5 `tmlus refresh`

`tmlus refresh` 用于清理 TmlUs 管理的本地缓存。它只删除 Skill 官方目录缓存、远程搜索源注册表缓存和远程 Skill 搜索结果缓存，不会更新 CLI 包，也不会删除项目文件、AI IDE 目录、已安装 Skill、`.codegraph/`、OpenSpec、npm 或 Git 缓存。

```bash
tmlus refresh
tmlus refresh --quiet
```

行为说明：

- 命令会使用与 `tmlus skills` 和 `tmlus skills search` 相同的缓存目录解析规则，支持 `TMLUS_SKILL_CACHE_DIR` 覆盖。
- 清理目标包括 `skills-catalog.json`、`skills-search-sources.json` 和 `skills-search-*.json`。
- 缓存文件不存在时会被视为 skipped，不会导致失败。
- 删除失败时会输出失败条目并返回非零退出码。
- `tmlus refresh` 不会主动请求远程数据；后续运行 `tmlus skills` 或 `tmlus skills search` 时会按现有远程加载与 fallback 流程重建缓存。
- 如需更新已安装的 CLI 包，请使用 `tmlus update`。

### 3.6 `tmlus ide`

`tmlus ide` 用于检测并初始化 AI IDE 环境目录。

```bash
tmlus ide
tmlus ide codex
tmlus ide codex,claude
tmlus ide cursor --quiet
```

参数：

| 参数 | 说明 |
|------|------|
| `[ideNames]` | 可选的 AI IDE 名称或别名，多个值用逗号分隔。不传时进入交互式选择 |

当前支持的 AI IDE：

| ID | 名称 | 别名 | 初始化目录 |
|----|------|------|------------|
| `codex` | Codex | `openai-codex`, `codex-cli` | `.codex/skills`, `.codex/prompts` |
| `claude` | Claude Code | `claude-code`, `claude` | `.claude/skills`, `.claude/commands` |
| `cursor` | Cursor | `cursor-ide` | `.cursor/rules`, `.cursor/commands`, `.cursor/skills` |
| `trae` | Trae | `trae-ide` | `.trae/rules`, `.trae/skills` |
| `codebuddy` | CodeBuddy | `code-buddy`, `tencent-codebuddy` | `.codebuddy/rules`, `.codebuddy/commands`, `.codebuddy/skills` |

行为说明：

- 目录已存在时会标记为 existing，不会重复创建。
- 未知 IDE 会返回错误，并提示支持的环境列表。
- `Esc` 取消交互式选择时，命令直接停止，不继续写入。

### 3.7 `tmlus skills`

`tmlus skills` 用于发现、搜索并安装 TmlUs 维护的 AI Skills。

```bash
tmlus skills
tmlus skills tml-docs-spec-generate
tmlus skills tml-docs-spec-generate --ide codex
tmlus skills search
tmlus skills search --search mattpocock-skills
tmlus skills search --ide codex
```

参数与选项：

| 参数 | 说明 |
|------|------|
| `[skillIds]` | 可选的 Skill ID 或别名，多个值可用逗号分隔。不传时进入交互式选择 |
| `search` | 进入远程 Skill 搜索流程 |
| `--search <source>` | 指定远程搜索来源。默认来源为 `tml-skills` |
| `--ide <ideNames>` | 指定安装目标 AI IDE，多个值用逗号分隔 |

Skill 目录：

- `tmlus skills` 默认读取 `Time-Machine-Lab/TmlUs` 仓库 `data/skills/catalog.json` 中维护的官方 Skill 目录，并使用本地缓存降低重复请求。
- 远程目录不可用、缓存不可用或数据校验失败时，会退回到 CLI 包内置的 Skill fallback 目录。
- `tmlus skills search` 默认搜索 `Time-Machine-Lab/TML-Skills/skills`。TmlUs 官方目录不作为 Search Source 展示，因为 `tmlus skills` 已经直接加载官方目录。
- Search Source 可以带有中文描述，交互式选择来源时会优先展示该来源能解决的问题。
- 支持的远程来源包括 `mattpocock-skills`，可通过 `tmlus skills search --search mattpocock-skills` 搜索 Matt Pocock 的工程工作流 Skills；默认不会展示 `deprecated`、`personal`、`in-progress` 分类。
- 对声明了 resolver 的远程来源，TmlUs 会按来源自己的仓库结构规则匹配 `SKILL.md`，并优先使用 `SKILL.md` Frontmatter 中的 `name`、`category` 和 `description` 展示远程 Skill。

当前官方 Skill：

| ID | 名称 | 分类 | 说明 |
|----|------|------|------|
| `skill-creator` | Skill Creator | Skill创作 | 创建、评估和持续优化 AI Skill |
| `tml-docs-spec-generate` | TML Docs Spec Generate | TML规范 | 基于 TML-Docs-Spec 模板生成标准化文档 |
| `humanizer-zh` | Humanizer-zh | 内容创作 | 中文文本人性化编辑，减少 AI 写作痕迹并优化表达节奏 |
| `frontend-slides` | Frontend Slides | 前端开发 | 生成高质量 HTML 演示文稿 |
| `gsap-skills` | GSAP Skills | 前端开发 | 安装 GSAP 官方技能集合 |
| `html-anything` | Html Anything | 前端开发 | 安装 HTML Anything 模板技能集合 |
| `design-extract` | Design Extract | 前端开发 | 从线上站点抽取设计语言和前端提示词 |
| `db-skills` | DB Skills | 商业方法论 | 安装 dontbesilent 商业方法论技能集合 |

行为说明：

- 不指定 `--ide` 时，默认安装到当前项目中已存在且受支持的 AI IDE 环境。
- 当前没有可用目标环境时，会提示先运行 `tmlus ide <ide>` 或显式传入 `--ide <ide>`。
- 安装流程默认幂等。目标 Skill 已存在时跳过，不静默覆盖用户已有内容。
- 远程搜索只负责发现远程 Skill，安装仍复用统一 Skill 安装流程。
- 远程 Skill 列表会展示名称、分类和功能描述；当 `SKILL.md` 描述不可用时，会退回到来源描述或来源名称。
- 交互式终端中，`tmlus skills` 加载 Skill 目录时会显示轻量 loading 反馈；`--quiet`、CI、非 TTY 和 dumb terminal 会保持干净输出。
- 可通过 `TMLUS_DISABLE_REMOTE_CATALOG=1` 禁用远程目录加载，或通过 `TMLUS_SKILL_CATALOG_URL`、`TMLUS_SKILL_SEARCH_SOURCES_URL`、`TMLUS_SKILL_CATALOG_TTL_HOURS` 调整远程目录与缓存行为。

### 3.8 `tmlus tools`

`tmlus tools` 用于发现并安装 TmlUs 维护的外部工具适配，也可以准备 Agent 可读的工具安装说明文档。

```bash
tmlus tools
tmlus tools codegraph
tmlus tools codegraph --ide codex
tmlus tools cg --ide codex,claude,cursor
tmlus tools skillclaw
tmlus tools skillclaw help
tmlus tools skillclaw start
tmlus tools skillclaw stop
tmlus tools skillclaw reinstall
```

参数与选项：

| 参数 | 说明 |
|------|------|
| `[toolIds]` | 可选的 Tool ID 或别名。不传时进入交互式选择。当前一次只处理一个 Tool |
| `--ide <ideNames>` | 指定需要写入工具适配配置的 AI IDE，多个值用逗号分隔 |

当前内置 Tool：

| ID | 别名 | 名称 | 适用环境 | 产物 |
|----|------|------|----------|------|
| `codegraph` | `cg` | CodeGraph | `codex`, `claude`, `cursor` | `.codegraph/`、对应 AI IDE 的 MCP 配置 |
| `skillclaw` | `sc`, `claw` | SkillClaw | 无需选择 IDE | `~/.tmlus/env/skillclaw` 文档环境 |

行为说明：

- CodeGraph 使用外部 CLI `codegraph`，安装包为 `@colbymchenry/codegraph`。
- SkillClaw 不由 TmlUs 直接安装；TmlUs 只准备 `install-runbook.md`、`skillclaw-help.md`、`tml-team-config-guide.md` 和 `manifest.json`，用户可把 Runbook 交给 Agent 执行真实安装与配置。
- SkillClaw 文档环境准备完成后，交互菜单只保留三类操作：重新安装（重新拉取 env 文档包）、启动/关闭 SkillClaw 代理、如何使用 SkillClaw（展示 `skillclaw-help.md` 路径与可复制给 Agent 的提示词）。
- `tmlus tools skillclaw start` 会以 daemon 模式启动本地 client proxy，并把 Codex 配置切换到 SkillClaw 代理；`tmlus tools skillclaw stop` 会关闭代理并把 Codex 配置切回上游服务。
- 如果未传 `--ide`，交互式终端会提示选择目标环境；非交互场景会使用当前项目中已存在且受支持的环境。
- 工具安装失败时会输出失败步骤和可手动执行的修复命令。

### 3.9 `tmlus tml-spec`

`tmlus tml-spec` 用于创建或修复 TML Docs 目录结构。

```bash
tmlus tml-spec
tmlus tml-spec --quiet
```

会确保存在的目录：

| 目录 | 用途 |
|------|------|
| `docs/` | 项目文档根目录 |
| `docs/design/` | 架构设计、技术方案和设计说明 |
| `docs/api/` | API 契约和接口说明 |
| `docs/sql/` | 数据库、SQL 和迁移说明 |
| `docs/preview/` | 预览、截图和可视化产物 |
| `docs/spec/` | 开发规范、设计规范和团队约束 |

行为说明：

- 每个目录会创建对应 `.gitkeep`，确保空目录可被 Git 追踪。
- 已存在目录和文件会被标记为 existing，不会重复写入。
- 任何目录或文件创建失败都会让命令以失败状态结束。

### 3.10 `tmlus work-mode`

`tmlus work-mode` 用于初始化项目工作模式。

```bash
tmlus work-mode
tmlus work-mode openspec --ide codex,claude
tmlus work-mode skip
```

参数与选项：

| 参数 | 说明 |
|------|------|
| `[openspec|skip]` | 指定工作模式。不传时交互式选择，非交互场景默认 `skip` |
| `--ide <ideNames>` | 指定 OpenSpec 初始化时要绑定的 AI IDE 工具目标 |

当前支持的工作模式：

| ID | 名称 | 说明 |
|----|------|------|
| `openspec` | OpenSpec | 在当前项目初始化 OpenSpec |
| `skip` | Skip | 不进行工作模式初始化 |

行为说明：

- `openspec` 会执行 `openspec init "<projectRoot>" --tools <tools>`。
- `--ide codex,claude` 会转换为 OpenSpec 的 `--tools codex,claude`。
- 已存在 `openspec/` 且没有工具目标时，会返回 existing。
- 未安装 OpenSpec 或执行失败时，会输出可手动运行的 `openspec init` 命令。
