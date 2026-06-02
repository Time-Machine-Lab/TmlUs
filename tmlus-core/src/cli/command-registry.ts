import type { CommandMetadata, Language } from '../core/types.js';

export const COMMAND_REGISTRY: CommandMetadata[] = [
  {
    command: 'init',
    valueHint: '[--from step]',
    name: {
      zh: 'Project initialization',
      en: 'Project initialization'
    },
    description: {
      zh: 'Guide project setup across workdir, AI IDE, TML Docs, Skills, and work mode.',
      en: 'Guide project setup across workdir, AI IDE, TML Docs, Skills, and work mode.'
    },
    examples: ['tmlus init', 'tmlus init --from tml-spec --ide codex --work-mode skip'],
    parameterNotes: [
      {
        zh: 'Use --from workdir|ide|tml-spec|skills|work-mode to resume from a step.',
        en: 'Use --from workdir|ide|tml-spec|skills|work-mode to resume from a step.'
      }
    ]
  },
  {
    command: 'help',
    name: {
      zh: '帮助',
      en: 'Help'
    },
    description: {
      zh: '查看当前所有命令功能，支持中文和英文说明。',
      en: 'Show all available commands with Chinese and English descriptions.'
    },
    examples: ['tmlus help', 'tmlus help --lang en']
  },
  {
    command: 'version',
    name: {
      zh: '版本',
      en: 'Version'
    },
    description: {
      zh: '输出当前 tmlus 版本，保持干净无装饰。',
      en: 'Print the current tmlus version without decoration.'
    },
    examples: ['tmlus version']
  },
  {
    command: 'update',
    name: {
      zh: '更新',
      en: 'Update'
    },
    description: {
      zh: '检查当前 tmlus 版本，并在 npm 有新版本时更新全局安装。',
      en: 'Check the current tmlus version and update the global npm installation when a newer release is available.'
    },
    examples: ['tmlus update', 'tmlus update --quiet'],
    parameterNotes: [
      {
        zh: 'npx 调用会显示使用最新版本的指引，而不是声明已更新当前调用。',
        en: 'npx invocations show guidance for using the latest release instead of claiming the active invocation was updated.'
      }
    ]
  },
  {
    command: 'ide',
    valueHint: '[ideNames]',
    name: {
      zh: 'AI IDE 环境初始化',
      en: 'AI IDE environment initialization'
    },
    description: {
      zh: '检测并初始化 Codex、Claude Code、Cursor、Trae、CodeBuddy 等 AI IDE 必要目录。',
      en: 'Detect and initialize required folders for Codex, Claude Code, Cursor, Trae, CodeBuddy, and other AI IDE environments.'
    },
    examples: ['tmlus ide', 'tmlus ide codex', 'tmlus ide codex,claude'],
    parameterNotes: [
      {
        zh: '可直接输入 AI IDE 名称或别名，跳过选择。',
        en: 'Pass AI IDE names or aliases directly to skip selection.'
      }
    ]
  },
  {
    command: 'skills',
    valueHint: '[skillIds]',
    name: {
      zh: 'AI Skill 发现与安装',
      en: 'AI Skill discovery and installation'
    },
    description: {
      zh: '展示 TmlUs 维护的 Skill 列表，并安装到一个或多个 AI IDE 环境。',
      en: 'List maintained TmlUs skills and install them to one or more AI IDE environments.'
    },
    examples: [
      'tmlus skills',
      'tmlus skills tml-docs-spec-generate',
      'tmlus skills tml-docs-spec-generate --ide codex',
      'tmlus skills search'
    ],
    parameterNotes: [
      {
        zh: '可通过列表底部 Search 或 `tmlus skills search` 进入远程 Skill 搜索，默认来源为 TmlUs 官方目录，也可选择其他配置化来源。',
        en: 'Use the Search row or `tmlus skills search` to discover remote skills. The default source is the TmlUs official catalog, and other configured sources can be selected.'
      },
      {
        zh: '不指定 IDE 时，默认安装到当前项目所有已存在的受支持 AI IDE 环境。',
        en: 'When no IDE is specified, installs to all existing supported AI IDE environments in the current project.'
      }
    ]
  },
  {
    command: 'tools',
    valueHint: '[toolIds]',
    name: {
      zh: 'External Tool discovery and installation',
      en: 'External Tool discovery and installation'
    },
    description: {
      zh: 'List maintained external tools and install or adapt one tool for the current project and AI IDE environment.',
      en: 'List maintained external tools and install or adapt one tool for the current project and AI IDE environment.'
    },
    examples: [
      'tmlus tools',
      'tmlus tools codegraph',
      'tmlus tools codegraph --ide codex'
    ],
    parameterNotes: [
      {
        zh: 'Pass a Tool ID such as codegraph to skip selection and start that Tool flow directly.',
        en: 'Pass a Tool ID such as codegraph to skip selection and start that Tool flow directly.'
      }
    ]
  },
  {
    command: 'tml-spec',
    name: {
      zh: 'TML Docs structure initialization',
      en: 'TML Docs structure initialization'
    },
    description: {
      zh: 'Create or repair docs, docs/design, docs/api, docs/sql, docs/preview, and docs/spec with .gitkeep files.',
      en: 'Create or repair docs, docs/design, docs/api, docs/sql, docs/preview, and docs/spec with .gitkeep files.'
    },
    examples: ['tmlus tml-spec', 'tmlus tml-spec --quiet']
  },
  {
    command: 'work-mode',
    valueHint: '[openspec|skip]',
    name: {
      zh: 'Project work mode initialization',
      en: 'Project work mode initialization'
    },
    description: {
      zh: 'Initialize project work mode. Supported modes are openspec and skip.',
      en: 'Initialize project work mode. Supported modes are openspec and skip.'
    },
    examples: ['tmlus work-mode', 'tmlus work-mode openspec --ide codex,claude'],
    parameterNotes: [
      {
        zh: 'openspec initializes OpenSpec only in the current project; skip performs no work-mode initialization.',
        en: 'openspec initializes OpenSpec only in the current project; skip performs no work-mode initialization.'
      }
    ]
  }
];

const GLOBAL_OPTIONS: Array<{
  option: string;
  valueHint?: string;
  name: { zh: string; en: string };
  description: { zh: string; en: string };
  examples: string[];
}> = [
  {
    option: '--no-banner',
    name: {
      zh: '关闭启动视觉',
      en: 'Disable banner'
    },
    description: {
      zh: '关闭启动卡片和装饰性输出。',
      en: 'Disable startup card and decorative output.'
    },
    examples: ['tmlus help --no-banner']
  },
  {
    option: '--quiet',
    name: {
      zh: '安静模式',
      en: 'Quiet mode'
    },
    description: {
      zh: '只输出必要结果，适合脚本和自动化场景。',
      en: 'Only print essential results for scripts and automation.'
    },
    examples: ['tmlus ide codex --quiet']
  },
  {
    option: '--lang',
    valueHint: '<zh|en>',
    name: {
      zh: '帮助语言',
      en: 'Help language'
    },
    description: {
      zh: '切换帮助输出语言。',
      en: 'Switch help output language.'
    },
    examples: ['tmlus help --lang en']
  }
];

function text(value: { zh: string; en: string }, language: Language): string {
  return value[language];
}

export function renderHelp(language: Language): string {
  const usage = language === 'zh' ? '用法' : 'Usage';
  const commands = language === 'zh' ? '命令' : 'Commands';
  const options = language === 'zh' ? '选项' : 'Options';
  const examples = language === 'zh' ? '示例' : 'Examples';

  const lines = [
    'TmlUs - TML AI development workspace toolkit',
    '',
    `${usage}:`,
    '  tmlus <command> [options]',
    '',
    `${commands}:`
  ];

  for (const command of COMMAND_REGISTRY) {
    const aliases = command.aliases?.length ? ` (${command.aliases.join(', ')})` : '';
    const valueHint = command.valueHint ? ` ${command.valueHint}` : '';
    lines.push(`  ${command.command}${valueHint}${aliases}`);
    lines.push(`    ${text(command.name, language)} - ${text(command.description, language)}`);
    if (command.parameterNotes?.length) {
      for (const note of command.parameterNotes) {
        lines.push(`    ${text(note, language)}`);
      }
    }
  }

  lines.push('', `${options}:`);
  for (const option of GLOBAL_OPTIONS) {
    const valueHint = option.valueHint ? ` ${option.valueHint}` : '';
    lines.push(`  ${option.option}${valueHint}`);
    lines.push(`    ${text(option.name, language)} - ${text(option.description, language)}`);
  }

  lines.push('', `${examples}:`);
  for (const command of COMMAND_REGISTRY) {
    for (const example of command.examples.slice(0, 2)) {
      lines.push(`  ${example}`);
    }
  }
  for (const option of GLOBAL_OPTIONS) {
    lines.push(`  ${option.examples[0]}`);
  }

  return lines.join('\n');
}
