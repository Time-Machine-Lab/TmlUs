# TmlUs 命令 Wiki

## 1. 命令总览 (Command Index)

| 命令 | 用途 | 常用场景 |
|------|------|----------|
| `tmlus init` | 引导完成项目目录、AI IDE、TML Docs、Skills 和工作模式初始化 | 新项目接入 TML AI 开发工作台 |
| `tmlus help` | 输出当前注册命令、全局选项和示例 | 用户或 Agent 快速查询命令 |
| `tmlus version` | 输出当前 CLI 版本，保持无装饰 | 脚本、发布和排查版本问题 |
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

### 3.4 `tmlus ide`

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

### 3.5 `tmlus skills`

`tmlus skills` 用于发现、搜索并安装 TmlUs 维护的 AI Skills。

```bash
tmlus skills
tmlus skills tml-docs-spec-generate
tmlus skills tml-docs-spec-generate --ide codex
tmlus skills search
tmlus skills search --ide codex
```

参数与选项：

| 参数 | 说明 |
|------|------|
| `[skillIds]` | 可选的 Skill ID 或别名，多个值可用逗号分隔。不传时进入交互式选择 |
| `search` | 进入远程 Skill 搜索流程 |
| `--search <source>` | 指定远程搜索来源。目前支持 TML Team 来源 |
| `--ide <ideNames>` | 指定安装目标 AI IDE，多个值用逗号分隔 |

当前内置 Skill：

| ID | 名称 | 分类 | 说明 |
|----|------|------|------|
| `skill-creator` | Skill Creator | Skill创作 | 创建、评估和持续优化 AI Skill |
| `tml-docs-spec-generate` | TML Docs Spec Generate | TML规范 | 基于 TML-Docs-Spec 模板生成标准化文档 |
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

### 3.6 `tmlus tools`

`tmlus tools` 用于发现并安装 TmlUs 维护的外部工具适配。

```bash
tmlus tools
tmlus tools codegraph
tmlus tools codegraph --ide codex
tmlus tools cg --ide codex,claude,cursor
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

行为说明：

- CodeGraph 使用外部 CLI `codegraph`，安装包为 `@colbymchenry/codegraph`。
- 如果未传 `--ide`，交互式终端会提示选择目标环境；非交互场景会使用当前项目中已存在且受支持的环境。
- 工具安装失败时会输出失败步骤和可手动执行的修复命令。

### 3.7 `tmlus tml-spec`

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

### 3.8 `tmlus work-mode`

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
