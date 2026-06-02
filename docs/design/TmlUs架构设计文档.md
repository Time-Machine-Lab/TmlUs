# TmlUs 架构设计

## 1. 架构引言与业务上下文 (Introduction & Context)

TmlUs 的架构目标，是为 TML 团队提供一个本地优先、CLI-first 的 AI Helper / AI Tools 工具箱，让团队成员可以在自己的项目和 AI IDE 环境中快速完成初始化、能力安装、规范同步和健康诊断。

本项目不走平台化路线，不引入服务端账号体系、后台管理系统、团队数据库或远程控制面板。TmlUs 的核心价值在于把团队沉淀的 AI 开发能力、规范文档、Skill、Command、工具配方和诊断规则，以本地工具的方式稳定装配到每个项目中。

### 1.1 系统上下文 (System Context)

TmlUs 位于 TML 团队 AI 开发生态的本地工具层，连接团队规范资源、用户本地项目、用户 AI IDE 环境和外部 AI 开发工具。

```text
TML 团队成员
  使用
    TmlUs CLI
      读取/写入
        当前项目工作区
          - docs/
          - openspec/
          - .codex/
          - .claude/
          - .cursor/
          - package.json
      装配能力到
        AI IDE 环境
          - Codex
          - Claude
          - Cursor
          - Gemini
          - OpenCode
          - Trae
      检测/调用
        外部工具与资源
          - OpenSpec
          - spec-kit
          - harness
          - codegraph
          - npm / Git / 远程资源仓库
```

系统边界说明：

- **TmlUs CLI**：用户直接执行的本地入口，负责收集参数、展示交互和编排应用用例。
- **当前项目工作区**：TmlUs 的主要写入目标，包含文档、OpenSpec 配置、AI IDE 配置、Skill、Command 等项目级资源。
- **AI IDE 环境**：Codex、Claude、Cursor、Gemini、OpenCode、Trae 等用户已经使用的 AI 开发环境。它们不是外部工具，而是 TmlUs 安装 Skill、Command、Prompt 和配置的目标环境。
- **外部工具与资源**：OpenSpec、spec-kit、harness、codegraph、包管理器和远程仓库等，TmlUs 对它们执行检测、安装、初始化、同步或诊断。

### 1.2 场景视图 (+1 View / Scenarios)

架构必须首先跑通以下核心场景：

**场景一：新项目初始化**

团队成员在一个项目目录中运行 TmlUs，选择团队标准配方。系统根据配方生成 TML 文档目录、安装 AI IDE 环境所需的 Skill 和 Command、初始化或同步 OpenSpec 配置，并输出初始化报告。

**场景二：AI 能力安装与同步**

团队成员希望为当前项目补充或更新某类 AI 能力，例如安装 TML Skill、同步 Command、更新规范配置。系统从资源目录中解析目标资源，通过对应环境适配器写入到 Codex、Claude、Cursor 等 AI IDE 环境。

**场景三：项目健康诊断**

团队成员运行诊断命令。系统检查本地依赖、文档目录、OpenSpec 配置、AI IDE 环境资源、Skill/Command 安装状态和团队规范同步状态，并输出明确的问题说明与修复建议。

## 2. 逻辑视图：系统结构与模块边界 (Logical View)

TmlUs 采用模块化单体架构。所有核心能力运行在本地 CLI 进程中，模块之间通过清晰边界协作，不拆分为服务。

```text
CLI Shell
  -> Application Use Cases
      -> Core Domain
      -> Recipe Engine
      -> Resource Catalog
      -> Diagnostic Engine
      -> Workspace Writer
      -> Environment Adapters
      -> Tool Adapters
      -> CLI UI Renderer
```

核心模块职责如下：

- **CLI Shell**
  负责命令注册、参数解析、交互收集和结果展示。不直接写入项目文件，不直接调用外部工具，不承载核心业务判断。

- **Application Use Cases**
  负责编排用户动作，例如 `init`、`doctor`、`sync`、`skill install`、`command install`、`tool check`、`update`。该层决定流程顺序，但不直接关心各个 AI IDE 的具体目录格式。

- **Core Domain**
  定义 TmlUs 的核心概念，包括 Project Profile、Recipe、Resource、Skill、Command、Tool、Environment、Diagnostic Result 等。该层应保持稳定，不依赖具体 CLI 框架和具体文件系统实现。

- **Recipe Engine**
  负责将团队标准配方展开为一组可执行动作。配方表达“要为这个项目装配哪些能力”，而不是把初始化流程写死在命令中。

- **Resource Catalog**
  负责管理 Skill、Command、Prompt、Tool、Profile 等资源元数据。资源目录应成为团队能力沉淀的入口，避免资源定义散落在流程代码中。Skill 等可快速变化的官方目录可以来自 GitHub 上的静态数据文件，并由本地缓存和内置 fallback 保证离线可用性。

- **Environment Adapters**
  负责适配用户 AI IDE 环境，包括 Codex、Claude、Cursor、Gemini、OpenCode、Trae 等。它们处理目标目录、文件命名、格式差异和环境识别。

- **Tool Adapters**
  负责适配外部工具，包括 OpenSpec、spec-kit、harness、codegraph、npm、Git 和远程资源仓库等。它们处理工具检测、安装、初始化、同步和诊断。

- **Workspace Writer**
  负责所有项目文件写入，包括目录创建、文件生成、覆盖策略、冲突处理、dry-run、force、备份和路径安全。任何写入当前项目的动作都应经过该模块。

- **Diagnostic Engine**
  负责执行项目健康检查。每条诊断规则应独立建模，可组合、可测试，并输出明确的问题等级、原因和修复建议。

- **CLI UI Renderer**
  负责终端输出、颜色、banner、进度条、日志层级、无色降级、CI 降级、quiet/no-banner 行为。其视觉表现必须遵守 `docs/spec/DESIGN.md`。

模块依赖原则：

- CLI Shell 可以调用 Application Use Cases，但不得绕过 Use Case 直接写文件或直接调用 Adapter。
- Application Use Cases 可以编排 Core、Recipe、Catalog、Diagnostic、Workspace 和 Adapter。
- Core Domain 不依赖 CLI UI、文件系统、外部工具或具体环境适配器。
- Environment Adapters 和 Tool Adapters 不互相依赖；需要组合时由 Application Use Cases 编排。
- Workspace Writer 是唯一负责项目文件写入策略的模块。

## 3. 过程视图：运行时与数据流 (Process View)

### 3.1 初始化流程

```text
用户运行 tmlus init
  -> CLI Shell 收集 projectRoot / profile / target environments
  -> Application Use Case 加载 Profile
  -> Recipe Engine 展开初始化动作
  -> Resource Catalog 解析 Skill / Command / Tool / Spec Framework 元数据
  -> Environment Adapters 计算 AI IDE 环境目标路径和文件格式
  -> Tool Adapters 检测或初始化 OpenSpec 等外部工具
  -> Workspace Writer 写入 docs / config / skill / command / prompt
  -> Diagnostic Engine 执行初始化后检查
  -> CLI UI Renderer 输出结果和下一步建议
```

关键数据流：

- 用户输入只进入 CLI Shell 和 Application Use Cases。
- 配方展开结果进入 Catalog、Adapters 和 Workspace Writer。
- 所有文件写入请求集中进入 Workspace Writer。
- 诊断结果统一进入 CLI UI Renderer，保证输出风格一致。

### 3.2 能力安装流程

```text
用户运行 tmlus skill install <name>
  -> Use Case 请求 Resource Catalog 查找资源
  -> Catalog 返回资源来源、版本、目标环境和安装策略
  -> Environment Adapter 解析目标 AI IDE 环境
  -> Workspace Writer 执行写入或冲突处理
  -> Diagnostic Engine 可选校验安装结果
  -> CLI UI Renderer 输出安装摘要
```

该流程同样适用于 Command、Prompt 和工具配方，只是资源类型和目标 Adapter 不同。

### 3.3 诊断流程

```text
用户运行 tmlus doctor
  -> Diagnostic Engine 加载诊断规则
  -> 规则检查项目目录、OpenSpec、AI IDE 环境、资源安装状态和外部工具
  -> 每条规则返回 pass / warn / fail / skip
  -> CLI UI Renderer 按分组输出结果
  -> 如规则提供修复建议，则展示可执行下一步
```

诊断流程不应静默修改项目。自动修复必须作为显式命令或经用户确认后执行。

## 4. 物理视图：基础设施与部署 (Physical View)

TmlUs 的物理部署保持极简：

```text
开发者本机
  Node.js Runtime
    TmlUs CLI
      当前项目目录
      用户 AI IDE 配置目录
      本地 npm / Git / OpenSpec 等 CLI 工具
      远程资源仓库或包注册表
```

部署特点：

- TmlUs 作为本地 CLI 包运行，不需要常驻服务。
- 第一阶段不需要数据库、消息队列、缓存、容器编排或云端服务。
- 可通过 npm / npx / 全局安装等方式分发。
- 网络只用于安装依赖、获取远程资源或查询版本；核心诊断和配置检查应尽量支持离线场景。
- CI 或非 TTY 场景中应关闭装饰性输出，保证日志可读和可解析。

## 5. 关键架构决策与权衡 (Design Decisions & Trade-offs)

**决策一：选择本地优先 CLI，而不是平台化系统**

- **背景**：TmlUs 的目标是给团队成员提供便捷的 AI Helper 和 AI Tools，而不是管理团队账号或远程项目状态。
- **决策**：采用本地 CLI 工具箱架构，不建设服务端平台。
- **理由**：本地 CLI 更贴近项目初始化、文件写入、环境检测和 AI IDE 配置安装这些核心动作。
- **权衡/代价**：团队级统一视图和远程统计能力不会在第一阶段出现，但换来更低复杂度、更少依赖和更快落地。

**决策二：将 Codex、Claude、Cursor 等定义为 AI IDE 环境**

- **背景**：这些工具是用户日常开发环境，TmlUs 的职责是为它们安装 Skill、Command、Prompt 和配置。
- **决策**：将它们归入 Environment Adapter，而不是 External Tool Adapter。
- **理由**：这样可以清晰区分“能力安装目标”和“可检测/可调用的外部工具”。
- **权衡/代价**：Environment Adapter 需要维护不同 IDE 的目录和格式差异，但概念边界更稳定。

**决策三：用 Recipe 驱动初始化流程**

- **背景**：团队会有不同类型的项目和工具组合，如果把流程写死在命令里，后续维护成本高。
- **决策**：使用 Profile / Recipe 表达标准项目配方，由 Recipe Engine 展开为安装和同步动作。
- **理由**：团队经验可以沉淀为可复用配方，减少重复交互和硬编码流程。
- **权衡/代价**：需要维护配方 schema 和校验规则，但能显著提升可扩展性。

**决策四：所有文件写入集中到 Workspace Writer**

- **背景**：TmlUs 会频繁创建目录、写入配置、安装 Skill 和 Command，写入错误会直接影响用户项目。
- **决策**：禁止 CLI、Adapter 或 Use Case 随意写文件，统一通过 Workspace Writer 处理。
- **理由**：可以集中实现 dry-run、force、冲突检测、路径安全、备份和日志。
- **权衡/代价**：写入流程多一层抽象，但能降低破坏用户项目的风险。

**决策五：CLI 视觉由独立 UI Renderer 承载**

- **背景**：TmlUs 有明确的 kawaii terminal 设计语言，但命令输出仍必须可读、可降级、可自动化。
- **决策**：终端视觉、banner、颜色、进度、quiet/no-banner、CI 和非 TTY 降级由 CLI UI Renderer 统一处理。
- **理由**：保证所有命令输出一致，并严格遵守 `docs/spec/DESIGN.md`。
- **权衡/代价**：普通命令不能随意输出彩色装饰，需要通过统一渲染接口表达状态。
