import type { CommandMetadata, Language } from '../core/types.js';

export const COMMAND_REGISTRY: CommandMetadata[] = [
  {
    flag: 'init',
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
    flag: '--help',
    aliases: ['-h'],
    name: {
      zh: '帮助',
      en: 'Help'
    },
    description: {
      zh: '查看当前所有命令功能，支持中文和英文说明。',
      en: 'Show all available commands with Chinese and English descriptions.'
    },
    examples: ['tmlus --help', 'tmlus --help --lang en']
  },
  {
    flag: '--version',
    aliases: ['-v'],
    name: {
      zh: '版本',
      en: 'Version'
    },
    description: {
      zh: '输出当前 tmlus 版本，保持干净无装饰。',
      en: 'Print the current tmlus version without decoration.'
    },
    examples: ['tmlus --version']
  },
  {
    flag: '--no-banner',
    name: {
      zh: '关闭启动视觉',
      en: 'Disable banner'
    },
    description: {
      zh: '关闭启动卡片和装饰性输出。',
      en: 'Disable startup card and decorative output.'
    },
    examples: ['tmlus --no-banner --help']
  },
  {
    flag: '--quiet',
    name: {
      zh: '安静模式',
      en: 'Quiet mode'
    },
    description: {
      zh: '只输出必要结果，适合脚本和自动化场景。',
      en: 'Only print essential results for scripts and automation.'
    },
    examples: ['tmlus --quiet --ide codex']
  },
  {
    flag: '--ide',
    valueHint: '[ideNames]',
    name: {
      zh: 'AI IDE 环境初始化',
      en: 'AI IDE environment initialization'
    },
    description: {
      zh: '检测并初始化 Codex、Claude Code、Cursor、Trae、CodeBuddy 等 AI IDE 必要目录。',
      en: 'Detect and initialize required folders for Codex, Claude Code, Cursor, Trae, CodeBuddy, and other AI IDE environments.'
    },
    examples: ['tmlus --ide', 'tmlus --ide codex', 'tmlus --ide codex,claude'],
    parameterNotes: [
      {
        zh: '可直接输入 AI IDE 名称或别名，跳过选择。',
        en: 'Pass AI IDE names or aliases directly to skip selection.'
      }
    ]
  },
  {
    flag: '--skills',
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
      'tmlus --skills',
      'tmlus --skills tml-docs-spec-generate',
      'tmlus --skills tml-docs-spec-generate --ide codex',
      'tmlus --skills search'
    ],
    parameterNotes: [
      {
        zh: '可通过列表底部 Search 或 `tmlus --skills search` 进入远程 Skill 搜索，目前支持 TML Team 来源。',
        en: 'Use the Search row or `tmlus --skills search` to discover remote skills. TML Team is supported for now.'
      },
      {
        zh: '不指定 IDE 时，默认安装到当前项目所有已存在的受支持 AI IDE 环境。',
        en: 'When no IDE is specified, installs to all existing supported AI IDE environments in the current project.'
      }
    ]
  },
  {
    flag: '--tml-spec',
    name: {
      zh: 'TML Docs structure initialization',
      en: 'TML Docs structure initialization'
    },
    description: {
      zh: 'Create or repair docs, docs/design, docs/api, docs/sql, docs/preview, and docs/spec with .gitkeep files.',
      en: 'Create or repair docs, docs/design, docs/api, docs/sql, docs/preview, and docs/spec with .gitkeep files.'
    },
    examples: ['tmlus --tml-spec', 'tmlus --tml-spec --quiet']
  },
  {
    flag: '--work-mode',
    valueHint: '[openspec|skip]',
    name: {
      zh: 'Project work mode initialization',
      en: 'Project work mode initialization'
    },
    description: {
      zh: 'Initialize project work mode. Supported modes are openspec and skip.',
      en: 'Initialize project work mode. Supported modes are openspec and skip.'
    },
    examples: ['tmlus --work-mode', 'tmlus --work-mode openspec --ide codex,claude'],
    parameterNotes: [
      {
        zh: 'openspec initializes OpenSpec only in the current project; skip performs no work-mode initialization.',
        en: 'openspec initializes OpenSpec only in the current project; skip performs no work-mode initialization.'
      }
    ]
  }
];

function text(value: { zh: string; en: string }, language: Language): string {
  return value[language];
}

export function renderHelp(language: Language): string {
  const usage = language === 'zh' ? '用法' : 'Usage';
  const commands = language === 'zh' ? '命令' : 'Commands';
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
    lines.push(`  ${command.flag}${valueHint}${aliases}`);
    lines.push(`    ${text(command.name, language)} - ${text(command.description, language)}`);
    if (command.parameterNotes?.length) {
      for (const note of command.parameterNotes) {
        lines.push(`    ${text(note, language)}`);
      }
    }
  }

  lines.push('', `${examples}:`);
  for (const command of COMMAND_REGISTRY) {
    for (const example of command.examples.slice(0, 2)) {
      lines.push(`  ${example}`);
    }
  }

  return lines.join('\n');
}
