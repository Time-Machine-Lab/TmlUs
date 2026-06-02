# TmlUs 开发规范

## 1. 核心原则 (Core Principles)

TmlUs 的开发必须服务于“本地 AI Helper / AI Tools 工具箱”这一定位。所有代码组织、命令设计、文件写入和终端输出，都应围绕本地优先、可重复执行、可诊断、可扩展、可降级的 CLI 工具体验展开。

核心原则：

- **本地优先**：默认在用户本地项目和本地 AI IDE 环境中工作，不引入平台化依赖。
- **边界清晰**：CLI、Use Case、Core、Adapter、Workspace、UI 各层职责必须明确。
- **写入安全**：任何会修改用户项目的动作都必须可预期、可解释、可跳过、可确认。
- **配置驱动**：团队能力通过 Recipe、Catalog、Skill、Command、Tool 等结构化资源沉淀。
- **输出可用**：CLI 可以有 TML 个性和启动仪式，但必须遵守可读、可降级、可自动化的约束。
- **Wiki维护**: 涉及到新增命令，修改命令功能等需求时，必须优先维护命令Wiki文档。维护规则参考本文档 2.4 命令 Wiki 维护规则

### 1.1 开发技术栈 (Tech Stack)

- **运行环境**：Node.js，面向本地 CLI 使用场景。
- **主要语言**：TypeScript。
- **命令入口**：CLI-first，命令层只负责参数解析、交互收集和调用应用用例。
- **数据存储**：第一阶段不引入数据库。项目状态优先来自当前工作区文件、配置文件和资源目录。
- **配置与资源**：Recipe、Catalog、Skill、Command、Tool、Profile 等资源应结构化管理。
- **外部调用**：通过 Tool Adapter 调用 OpenSpec、spec-kit、harness、codegraph、npm、Git 等外部工具。
- **AI IDE 环境**：通过 Environment Adapter 适配 Codex、Claude、Cursor、Gemini、OpenCode、Trae 等用户开发环境。

### 1.2 项目结构与目录规范 (Project Structure)

项目源码应采用按职责边界组织的目录结构，禁止把核心逻辑散落在 CLI 命令文件中。

```text
src/                         /**/ TypeScript 源码根目录，只存放运行时代码。
├── cli/                      /**/ CLI 入口层。负责命令注册、参数解析、交互收集和调用 app 层；禁止直接写文件或直接调用外部工具。
│
├── app/                      /**/ 应用用例层。编排 init、doctor、sync、skill、command、tool、update 等用户流程；不处理具体终端样式。
│
├── core/                     /**/ 领域核心层。定义 Recipe、Profile、Resource、Skill、Command、Tool、Environment、Diagnostic 等稳定概念；禁止依赖 CLI 框架和具体文件系统实现。
│
├── catalog/                  /**/ 内置资源目录。存放 Skill、Command、Tool、Profile 的结构化元数据；禁止在 use case 中硬编码资源清单。
│
├── adapters/                 /**/ 适配器层。隔离 AI IDE 环境和外部工具差异。
│   ├── environments/         /**/ AI IDE 环境适配器，如 Codex、Claude、Cursor、Gemini、OpenCode、Trae；负责目标目录、文件格式和环境识别。
│   └── tools/                /**/ 外部工具适配器，如 OpenSpec、spec-kit、harness、codegraph、npm、Git；负责检测、安装、初始化、同步和诊断。
│
├── workspace/                /**/ 工作区文件操作层。统一处理路径解析、目录创建、文件写入、冲突检测、dry-run、force、备份和安全校验。
│
├── diagnostics/              /**/ 诊断规则层。每条 doctor 规则独立建模、可组合、可测试，并返回明确的结果和修复建议。
│
├── ui/                       /**/ CLI 输出层。统一处理 banner、颜色、进度条、日志层级、无色降级、CI 和非 TTY 输出。
│
└── utils/                    /**/ 无业务含义的通用工具函数。禁止在此放置项目流程、资源安装或适配器逻辑。
```

跨层调用规则：

- `cli/` 只能调用 `app/` 和 `ui/`，不能直接调用 `workspace/`、`adapters/` 或外部命令。
- `app/` 可以编排 `core/`、`catalog/`、`workspace/`、`diagnostics/`、`adapters/` 和 `ui/`。
- `core/` 不依赖任何具体 I/O、终端、文件系统或外部工具。
- `adapters/environments/` 和 `adapters/tools/` 不能互相直接调用；需要组合时由 `app/` 编排。
- `workspace/` 是唯一允许执行项目文件写入策略的模块。

### 1.3 Git 与代码流 (Git Workflow)

- **分支策略**：围绕 OpenSpec change 开发。开始实现前应有明确的 proposal、design、specs 和 tasks。
- **任务推进**：执行 change 时应按 `tasks.md` 勾选进度，完成一项立即更新 checkbox。
- **提交粒度**：提交应围绕单个 change 或单个清晰任务组组织，避免混入无关改动。
- **提交信息**：使用清晰的英文或中文摘要，说明用户可感知的变更，例如 `docs: add TmlUs architecture guidelines`。
- **评审重点**：优先检查文件写入安全、Adapter 边界、CLI 降级行为、测试覆盖和是否遵守 TML 文档。

### 1.4 命名与代码风格 (Naming & Code Style)

- **TypeScript 命名**：类型、接口、类使用 PascalCase；函数、变量使用 camelCase；常量使用清晰的 UPPER_SNAKE_CASE 或语义化 camelCase。
- **命令命名**：CLI 子命令使用小写中划线或单词形式，例如 `init`、`doctor`、`skill install`、`command install`、`tool check`。
- **资源 ID**：Skill、Command、Tool、Profile、Recipe 的 ID 使用 kebab-case，例如 `tml-docs-spec-generate`、`kawaii-spec-driven`。
- **文件命名**：源码文件优先使用 kebab-case；与单个类型强绑定的文件可使用语义化名称，但不得依赖大小写区分含义。
- **错误信息**：错误必须包含原因和修复建议。不要为了可爱化而牺牲问题定位。
- **注释规范**：只在复杂流程、边界规则、写入安全和适配差异处写简短注释，避免解释显而易见的代码。

### 1.5 CLI 输出与设计语言

所有 CLI 输出必须遵守 `docs/spec/DESIGN.md` 中的 TmlUs CLI 设计语言。

必须遵守的约束：

- **先可读，再可爱**：重要信息必须有稳定文本，不只依赖颜色表达。
- **装饰可关闭**：`--quiet`、`--no-banner`、`TMLUS_NO_BANNER=1` 必须关闭装饰性输出。
- **机器输出干净**：`version`、JSON 输出、CI、非 TTY、管道或重定向输出不得包含 banner、动画或 ANSI 残留。
- **动效短且不阻塞**：启动动效默认不超过 1 秒，不能影响命令执行。
- **终端原生**：不依赖图片、浏览器、外部渲染服务或 bitmap 资源。
- **宽度可降级**：窄终端使用 compact 输出，无色终端使用 monochrome 输出。
- **错误不卖萌**：错误信息必须清楚说明发生了什么、为什么发生、用户下一步怎么做。
- **结果少而准**：安装、初始化等结果列表默认只展示用户需要确认的对象、目标位置和状态图标。不要在普通结果区展示绝对路径、统计噪声、适配器长错误或重复说明；详细原因应进入诊断、verbose 或错误排查输出。

输出实现应集中在 `ui/`，业务模块不得直接拼接复杂颜色、banner 或动画。

#### 1.5.1 交互式选择器规范

交互式选择器是高风险 CLI 组件，必须按“单帧动态重绘”方式实现，并保证每次按键后的 UI 稳定。

必须遵守：

- **不得软换行**：动态重绘区域中的每一行都必须在写入终端前按当前 `stdout.columns` 裁剪，宽度上限应小于终端列数 1 列，避免终端自动换行。
- **按视觉宽度计算**：中文、日文、emoji、线框符号、ANSI 颜色码不能用 `string.length` 计算宽度，必须先剥离 ANSI，再按 Unicode/CJK 视觉宽度估算。
- **记录真实帧行数**：重绘时只能按上一帧实际写出的行数回退，禁止额外多回退或少回退。行数必须来自最终写入的 frame lines，而不是未裁剪的源数组。
- **先裁剪再写入**：表格列、详情行、标题行都要在写入前裁剪；不能依赖终端自动处理超长行。
- **清理输入状态**：退出选择器时必须恢复 raw mode、移除 keypress listener、恢复光标，并主动 `stdin.pause()`，避免命令完成后进程不退出。
- **支持连续选择器**：如果一个命令流程中会连续出现多个选择器，进入每个选择器时必须先 `stdin.resume()`，避免前一个选择器 `pause()` 后导致后一个选择器收不到按键并触发 unsettled top-level await。
- **取消语义明确**：`Esc` 是统一退出键，表示取消整个命令流程；取消结果必须与“空选择确认”区分，后续初始化或安装流程不得继续执行。
- **默认选择保守**：除非需求明确要求，选择器初始不应默认全选。`Enter` 空选择的业务含义必须由调用方显式定义。
- **提示低噪声**：不要在选择 UI 中展示冗长的 “Use ↑/↓ move” 操作说明。交互应通过常见键位和视觉状态表达。

已知问题沉淀：

- 上下键导致 UI 覆盖或残留，通常是因为某一行超过终端宽度发生软换行，而清屏逻辑仍按 `\n` 行数回退。修复方向不是增加清屏次数，而是禁止动态帧出现软换行，并为宽度计算添加测试。

### 1.6 文件写入与用户项目安全

TmlUs 会写入用户项目和 AI IDE 环境配置，因此文件操作必须保守。

- 所有写入必须经过 `workspace/` 层。
- 默认不得静默覆盖已有文件。
- 覆盖文件必须通过 `--force` 或交互确认。
- 支持 `--dry-run` 的命令必须展示将要创建、修改、跳过或冲突的文件。
- 写入前必须解析并校验目标路径，避免越界写入非目标工作区。
- 对用户已有内容的变更应尽量采用可合并策略；无法合并时应报告冲突并跳过。
- 安装 Skill、Command、Prompt、配置时应尽量幂等，重复执行不应生成重复内容。
- 失败时应给出已经完成和未完成的动作摘要。

### 1.7 Adapter 规范

Adapter 用于隔离外部差异，不应泄漏到核心用例中。

**Environment Adapter**

适配用户 AI IDE 环境，包括 Codex、Claude、Cursor、Gemini、OpenCode、Trae 等。

职责：

- 识别环境是否存在。
- 解析 Skill、Command、Prompt、配置的目标目录。
- 处理文件命名和格式差异。
- 返回计划写入动作，不直接绕过 `workspace/` 写文件。

**Tool Adapter**

适配外部工具，包括 OpenSpec、spec-kit、harness、codegraph、npm、Git 和远程仓库。

职责：

- 检测工具是否安装。
- 查询工具版本。
- 执行初始化、同步或诊断命令。
- 将命令结果转为结构化结果，供 Use Case 和 Diagnostic Engine 使用。

### 1.8 Resource Catalog 与 Recipe 规范

团队能力必须沉淀为结构化资源，而不是散落在流程代码中。

资源元数据至少应表达：

- 资源 ID。
- 资源类型：Skill、Command、Prompt、Tool、Profile、Recipe。
- 名称与描述。
- 来源位置或仓库路径。
- 支持的 AI IDE 环境。
- 安装目标或适配策略。
- 版本或更新策略。
- 依赖关系。

Skill Catalog 额外规则：

- 官方 Skill 目录应维护在仓库 `data/skills/catalog.json` 中。新增或调整默认展示的官方 Skill 时，优先更新该远程数据文件，而不是只修改 CLI 源码中的内置目录。
- CLI 源码中的内置 Skill Catalog 只作为离线、网络失败或远程数据校验失败时的 fallback；它应保持可用，但不再是团队新增官方 Skill 的唯一入口。
- 官方 Skill 目录必须进行结构校验后才能用于安装流程。校验内容至少包括 schema version、Skill ID、来源、分类、简介、安装策略和目标 AI IDE 元数据。
- 不得把本地开发目录中的临时 skill 作为默认公开资源，除非它已经被明确纳入团队维护的远程资源库。
- 每个 Skill 必须声明稳定 `id`、展示名、来源、分类、简介、支持的 AI IDE 目标和安装策略。
- Skill 来源优先使用远程仓库地址。对不同仓库结构必须通过 installer strategy 或 adapter 适配，禁止在安装流程中硬编码特殊仓库。
- 标准单 Skill 仓库可使用 `github-directory`：下载包含 `SKILL.md` 的目录。
- 根目录即 Skill 的仓库可使用 `github-root-skill`：只安装 `SKILL.md` 及 README 中声明的必要支持文件，避免复制整个应用仓库。
- 一个仓库包含多个 Skill 子目录时使用 `github-skill-bundle`：展开 bundle 目录下的多个 skill 到目标 AI IDE 的 skill 根目录，重复执行时跳过已存在子目录。
- 安装器必须幂等：已存在的目标目录默认跳过，不得静默覆盖用户已有 skill。
- GitHub 远程下载适配器必须支持 `GITHUB_TOKEN` 或 `GH_TOKEN`，并在 403 时展示 GitHub 返回的错误原因、rate limit reset 时间和 token 修复建议。
- GitHub 下载不得只依赖 `api.github.com/repos/.../contents`。当 Contents API 限流或失败时，应 fallback 到 `codeload.github.com` 的 zip archive，再从解压目录复制需要的文件或子目录。
- archive fallback 必须跨平台处理路径与跨盘符复制；不能依赖 `rename` 跨文件系统移动目录，应使用 copy 后清理临时目录。
- 远程 Skill 搜索来源必须配置化，来源注册表应维护在 `data/skills/search-sources.json`。TmlUs 官方目录不作为 Search Source 展示；`tmlus skills` 直接加载官方目录，`tmlus skills search` 用于搜索 TML-Skills 等额外远程仓库。搜索阶段只负责发现远程 skill 并生成资源定义，后续安装必须复用统一 Skill 安装流程和目标 AI IDE 适配器，禁止为搜索结果另写一套安装逻辑。
- 对大型 bundle 资源，常规测试不应每次全量下载；应至少测试安装策略解析、小型远程目录下载和一个代表性 bundle。

Recipe 表达一组团队认可的初始化组合，例如某类项目需要哪些文档目录、哪些 AI IDE 能力、哪些外部工具和哪些 OpenSpec 配置。Use Case 执行 Recipe，Catalog 描述资源，Adapter 处理差异。

### 1.9 其他开发事项 (Other Conventions)

- 不引入平台化、服务端账号、远程项目数据库或后台管理模块。
- 不在本项目中定义业务 API 契约或数据库表结构。
- 不把 Codex、Claude、Cursor 等称为外部工具；它们是用户 AI IDE 环境。
- 不把 OpenSpec、spec-kit、codegraph 等写成 AI IDE 环境；它们是外部工具或开发规范框架。
- 不在普通业务逻辑中直接调用 `console.log` 输出复杂内容，应通过 `ui/` 层表达。
- 不在 `utils/` 中放置带业务语义的安装、同步、诊断逻辑。

## 2. 治理与维护 (Governance & Maintenance)

TmlUs 的长期维护重点是保持本地工具行为稳定、资源目录可升级、适配器边界清晰、文件写入安全和 CLI 输出一致。

### 2.1 测试规范 (Testing Strategy)

测试应优先覆盖高风险边界，而不是追求形式化覆盖率。

#### 2.1.1 本地验收沙箱

每个新功能开发完成后，必须在仓库根目录下的 `./tmlus-test` 中完成自测验证，验证通过后才可以认为需求实现完毕。

`./tmlus-test` 是本地验收沙箱目录，必须加入 `.gitignore`，不得提交其中的任何测试产物、临时项目或生成文件。

标准自测流程：

1. 进入 `./tmlus-test` 作为测试工作区。
2. 运行清理脚本清空沙箱内容：`powershell -ExecutionPolicy Bypass -File ../scripts/clean-tmlus-test.ps1 -Force`。
3. 基于当前需求在 `./tmlus-test` 中执行对应测试用例。
4. 检查生成文件、CLI 输出、错误处理、幂等性和降级行为是否符合需求与规范。
5. 将关键验证结果记录到对应 OpenSpec change 的任务说明、最终回复或测试记录中。

清理脚本必须带路径保护，只允许清理仓库根目录下的 `tmlus-test`。禁止使用手写的递归删除命令替代清理脚本。

必须重点测试：

- **路径解析**：相对路径、绝对路径、工作区边界、用户主目录路径。
- **文件写入**：新建、跳过、冲突、force、dry-run、备份、重复执行。
- **Environment Adapter**：不同 AI IDE 环境的目标目录、文件命名和格式输出。
- **Tool Adapter**：外部工具缺失、版本检测失败、命令失败、输出解析。
- **Recipe 展开**：配方能稳定展开为预期资源和动作。
- **Resource Catalog**：资源 ID 唯一、类型正确、依赖可解析。
- **Diagnostic Rule**：pass、warn、fail、skip 状态和修复建议。
- **CLI 输出降级**：`--quiet`、`--no-banner`、CI、非 TTY、JSON、无色终端。
- **交互式选择器**：上下键、翻页、空格多选、回车确认、Esc 取消、终端窄宽度、中文/emoji/ANSI 宽度、动态重绘不残留。
- **Skill 安装策略**：标准 GitHub skill、根目录 skill、bundle skill、重复安装跳过、目标 AI IDE 不支持时跳过。

测试类型建议：

- 核心纯函数和领域模型使用单元测试。
- 文件写入计划使用临时目录测试。
- CLI 行为使用命令级集成测试。
- 动态 TTY 渲染应抽出纯渲染函数或测试 API，至少验证窄终端下每行视觉宽度不超过终端列数。
- 外部工具调用优先 mock，避免测试依赖用户机器环境。

### 2.2 部署与 CI/CD (Deployment & CI/CD)

TmlUs 是本地 CLI 包，不需要服务部署。CI/CD 只覆盖构建、测试、校验和发布。

发布前必须完成：

- TypeScript 编译通过。
- 单元测试和关键集成测试通过。
- OpenSpec change 校验通过。
- CLI 入口可执行。
- `version` 输出干净，不包含 banner 或装饰。
- CI 日志不包含装饰动画和 ANSI 残留。
- npm 包内容只包含运行所需文件、内置资源和文档入口。

版本发布应确保：

- changelog 或发布说明清楚描述用户可感知变化。
- 破坏性变更必须明确说明迁移方式。
- 涉及 Skill、Command、Recipe、Adapter 的资源变更应说明影响的 AI IDE 环境。

### 2.3 诊断规则维护

`doctor` 诊断规则必须独立建模，不得堆成一个大型流程函数。

每条规则应包含：

- `id`：稳定的规则 ID。
- `title`：面向用户的检查项名称。
- `severity`：问题等级。
- `check`：检查逻辑。
- `result`：pass、warn、fail 或 skip。
- `message`：明确说明检查结果。
- `suggestion`：失败或警告时的修复建议。
- `fix`：可选的自动修复动作，必须显式确认后执行。

诊断输出应按类别分组，例如环境、项目结构、OpenSpec、AI IDE 环境、Skill、Command、外部工具。诊断不得默认修改用户项目。

### 2.4 命令 Wiki 维护规则

[TmlUs 命令 Wiki](../TmlUs命令Wiki.md) 是面向用户和 Agent 的 `tmlus help` 扩展文档，也是命令行为的第一说明入口。

命令 Wiki 只保留三个章节：命令总览、全局选项、命令详解。新增命令、修改命令功能、调整参数语义、变更默认行为或删除命令时，必须优先围绕这三个章节更新该文档，再同步命令注册表、README 摘要、测试和相关 OpenSpec 规格。

命令文档维护必须遵守：

- **命令总览**：必须覆盖所有公开命令，并保持命令名、用途、常用场景与当前 CLI 行为一致。
- **全局选项**：只记录跨命令生效的选项和环境变量；命令专属参数不得写入该章节。
- **命令详解**：每个公开命令必须有独立条目，包含用途、示例、参数、行为说明和支持项。
- 涉及 AI IDE、Skill、Tool、工作模式或文档目录的命令，必须在命令详解中同步更新对应支持清单。
- README 的“功能魔法书”只保留摘要和命令 Wiki 链接，不替代完整说明。
- `tmlus help` 的命令注册表、命令 Wiki 和命令级测试必须保持一致。
- 命令 Wiki 不得新增维护规则、常见任务、Agent 约定、安装说明等额外章节；这些治理类内容应放入开发规范文档。
