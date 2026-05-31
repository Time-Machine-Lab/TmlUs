import type { EnvironmentDefinition } from '../core/types.js';

export const AI_IDE_ENVIRONMENTS: EnvironmentDefinition[] = [
  {
    id: 'codex',
    displayName: 'Codex',
    aliases: ['openai-codex', 'codex-cli'],
    markerDirectory: '.codex',
    requiredDirectories: ['.codex/skills', '.codex/prompts'],
    targetDirectories: {
      skills: '.codex/skills',
      prompts: '.codex/prompts'
    }
  },
  {
    id: 'claude',
    displayName: 'Claude Code',
    aliases: ['claude-code', 'claude'],
    markerDirectory: '.claude',
    requiredDirectories: ['.claude/skills', '.claude/commands'],
    targetDirectories: {
      skills: '.claude/skills',
      commands: '.claude/commands'
    }
  },
  {
    id: 'cursor',
    displayName: 'Cursor',
    aliases: ['cursor-ide'],
    markerDirectory: '.cursor',
    requiredDirectories: ['.cursor/rules', '.cursor/commands', '.cursor/skills'],
    targetDirectories: {
      rules: '.cursor/rules',
      commands: '.cursor/commands',
      skills: '.cursor/skills'
    }
  },
  {
    id: 'trae',
    displayName: 'Trae',
    aliases: ['trae-ide'],
    markerDirectory: '.trae',
    requiredDirectories: ['.trae/rules', '.trae/skills'],
    targetDirectories: {
      rules: '.trae/rules',
      skills: '.trae/skills'
    }
  },
  {
    id: 'codebuddy',
    displayName: 'CodeBuddy',
    aliases: ['code-buddy', 'tencent-codebuddy'],
    markerDirectory: '.codebuddy',
    requiredDirectories: ['.codebuddy/rules', '.codebuddy/commands', '.codebuddy/skills'],
    targetDirectories: {
      rules: '.codebuddy/rules',
      commands: '.codebuddy/commands',
      skills: '.codebuddy/skills'
    }
  }
];

export function findEnvironmentByName(name: string): EnvironmentDefinition | undefined {
  const normalized = name.trim().toLowerCase();

  return AI_IDE_ENVIRONMENTS.find((environment) => {
    return environment.id === normalized
      || environment.displayName.toLowerCase() === normalized
      || environment.aliases.includes(normalized);
  });
}

export function supportedEnvironmentNames(): string {
  return AI_IDE_ENVIRONMENTS
    .map((environment) => `${environment.id} (${environment.displayName})`)
    .join(', ');
}
