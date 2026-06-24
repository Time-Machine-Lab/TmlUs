import type { SkillDefinition, SkillInstallTarget } from '../core/types.js';

export const COMMON_SKILL_TARGETS: SkillInstallTarget[] = [
  { environmentId: 'codex', targetType: 'skills' },
  { environmentId: 'claude', targetType: 'skills' },
  { environmentId: 'cursor', targetType: 'skills' },
  { environmentId: 'trae', targetType: 'skills' },
  { environmentId: 'codebuddy', targetType: 'skills' }
];

export const SKILL_CATALOG: SkillDefinition[] = [
  {
    id: 'skill-creator',
    name: 'Skill Creator',
    source: 'github:anthropics/skills/skills/skill-creator',
    category: 'Skill创作',
    description: '创建、评估和持续优化 AI Skill，适合沉淀团队自己的工作流能力。',
    installer: {
      strategy: 'github-directory'
    },
    targets: COMMON_SKILL_TARGETS
  },
  {
    id: 'tml-docs-spec-generate',
    name: 'TML Docs Spec Generate',
    source: 'github:Time-Machine-Lab/TML-Skills/skills/tml-docs-spec-generate',
    category: 'TML规范',
    description: '基于 TML-Docs-Spec 模板生成项目概念、架构设计、开发规范等标准化文档。',
    installer: {
      strategy: 'github-directory'
    },
    targets: COMMON_SKILL_TARGETS
  },
  {
    id: 'humanizer-zh',
    aliases: ['humanizer'],
    name: 'Humanizer-zh',
    source: 'github:op7418/Humanizer-zh',
    category: '内容创作',
    description: '中文文本人性化编辑 Skill，用于减少 AI 写作痕迹、优化表达节奏和真实感。',
    installer: {
      strategy: 'github-root-skill',
      includePaths: [
        'SKILL.md',
        'README.md',
        'LICENSE'
      ]
    },
    targets: COMMON_SKILL_TARGETS
  },
  {
    id: 'frontend-slides',
    name: 'Frontend Slides',
    source: 'github:zarazhangrui/frontend-slides',
    category: '前端开发',
    description: '生成高质量 HTML 演示文稿，并支持 PPT 转 Web、样式探索和导出脚本。',
    installer: {
      strategy: 'github-root-skill',
      includePaths: [
        'SKILL.md',
        'README.md',
        'STYLE_PRESETS.md',
        'viewport-base.css',
        'html-template.md',
        'animation-patterns.md',
        'bold-template-pack',
        'scripts/extract-pptx.py',
        'scripts/deploy.sh',
        'scripts/export-pdf.sh'
      ]
    },
    targets: COMMON_SKILL_TARGETS
  },
  {
    id: 'gsap-skills',
    aliases: ['gsap'],
    name: 'GSAP Skills',
    source: 'github:greensock/gsap-skills',
    category: '前端开发',
    description: '安装 GSAP 官方技能集合，覆盖核心 API、时间线、ScrollTrigger、框架集成和性能实践。',
    installer: {
      strategy: 'github-skill-bundle',
      bundleDirectory: 'skills'
    },
    targets: COMMON_SKILL_TARGETS
  },
  {
    id: 'html-anything',
    aliases: ['html-anythins'],
    name: 'Html Anything',
    source: 'github:nexu-io/html-anything',
    category: '前端开发',
    description: '安装 HTML Anything 模板技能集合，用于生成网页原型、演示、海报、报告和社媒卡片等 HTML 交付物。',
    installer: {
      strategy: 'github-skill-bundle',
      bundleDirectory: 'next/src/lib/templates/skills'
    },
    targets: COMMON_SKILL_TARGETS
  },
  {
    id: 'design-extract',
    aliases: ['extract-design'],
    name: 'Design Extract',
    source: 'github:Manavarya09/design-extract/skills/extract-design',
    category: '前端开发',
    description: '从线上站点抽取设计语言、设计 Token、Tailwind/shadcn 主题和可复用前端提示词。',
    installer: {
      strategy: 'github-directory'
    },
    targets: COMMON_SKILL_TARGETS
  },

  {
    id: 'frontend-design',
    aliases: ['front-end-design', 'anthropic-frontend-design'],
    name: 'Frontend Design',
    source: 'github:anthropics/skills/skills/frontend-design',
    category: 'Frontend Design',
    description: 'Anthropic frontend design skill for distinctive visual direction, typography, layout, and non-templated UI execution.',
    installer: {
      strategy: 'github-directory'
    },
    targets: COMMON_SKILL_TARGETS
  },
  {
    id: 'ui-ux-pro-max',
    aliases: ['uiux-pro-max', 'uupm'],
    name: 'UI/UX Pro Max',
    source: 'github:nextlevelbuilder/ui-ux-pro-max-skill',
    category: 'Frontend Design',
    description: 'Installs the UI/UX Pro Max design skill bundle for UI styling, design systems, brand identity, slides, banners, and visual assets.',
    installer: {
      strategy: 'github-skill-bundle',
      bundleDirectory: '.claude/skills'
    },
    targets: COMMON_SKILL_TARGETS
  },
  {
    id: 'impeccable',
    name: 'Impeccable',
    source: 'github:pbakaus/impeccable/.agents/skills/impeccable',
    category: 'Frontend Design',
    description: 'Design craft skill for shaping, auditing, polishing, hardening, and iterating production-grade frontend interfaces.',
    installer: {
      strategy: 'github-directory'
    },
    targets: COMMON_SKILL_TARGETS
  },
  {
    id: 'taste-skill',
    aliases: ['taste', 'tasteskill', 'design-taste-frontend'],
    name: 'Taste Skill',
    source: 'github:Leonxlnx/taste-skill/skills/taste-skill',
    category: 'Frontend Design',
    description: 'Anti-slop frontend design skill for landing pages, portfolios, and redesigns that should avoid templated AI-looking UI.',
    installer: {
      strategy: 'github-root-skill',
      includePaths: [
        'SKILL.md'
      ]
    },
    targets: COMMON_SKILL_TARGETS
  },
  {
    id: 'ui-skills',
    aliases: ['ibelick-ui-skills', 'ui-skills-bundle'],
    name: 'UI Skills',
    source: 'github:ibelick/ui-skills',
    category: 'Frontend Design',
    description: 'Installs the UI Skills bundle for routing and focused UI work such as accessibility, metadata, motion performance, and baseline UI polish.',
    installer: {
      strategy: 'github-skill-bundle',
      bundleDirectory: 'skills'
    },
    targets: COMMON_SKILL_TARGETS
  },
  {
    id: 'db-skills',
    aliases: ['dbskill', 'dontbesilent'],
    name: 'DB Skills',
    source: 'github:dontbesilent2025/dbskill',
    category: '商业方法论',
    description: '安装 dontbesilent 商业方法论技能集合，覆盖商业诊断、对标、内容、决策和执行力等场景。',
    installer: {
      strategy: 'github-skill-bundle',
      bundleDirectory: 'skills'
    },
    targets: COMMON_SKILL_TARGETS
  }
];

export function findSkillById(id: string): SkillDefinition | undefined {
  const normalized = id.trim().toLowerCase();
  return SKILL_CATALOG.find((skill) => skill.id === normalized || skill.aliases?.includes(normalized));
}

export function supportedSkillIds(): string {
  return SKILL_CATALOG.map((skill) => skill.id).join(', ');
}
