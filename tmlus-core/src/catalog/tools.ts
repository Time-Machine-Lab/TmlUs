import type { ToolDefinition } from '../core/types.js';

export const TOOL_CATALOG: ToolDefinition[] = [
  {
    id: 'codegraph',
    aliases: ['cg'],
    name: 'CodeGraph',
    purpose: 'Local code intelligence and MCP code map for AI agents.',
    recommendation: 5,
    installer: {
      strategy: 'external-cli',
      command: 'codegraph',
      packageName: '@colbymchenry/codegraph'
    },
    adapter: 'codegraph',
    supportedEnvironmentIds: ['codex', 'claude', 'cursor'],
    projectArtifacts: ['.codegraph/']
  },
  {
    id: 'skillclaw',
    aliases: ['sc', 'claw'],
    name: 'SkillClaw',
    purpose: 'Prepare Agent-readable SkillClaw setup and help documents.',
    recommendation: 4,
    installer: {
      strategy: 'document-package',
      documentPackageId: 'skillclaw',
      remoteSource: 'github:Time-Machine-Lab/TmlUs/data/tools/skillclaw',
      includePaths: ['install-runbook.md', 'skillclaw-help.md', 'manifest.json']
    },
    adapter: 'document-package',
    supportedEnvironmentIds: [],
    projectArtifacts: [],
    requiresEnv: true
  }
];

export function findToolById(id: string): ToolDefinition | undefined {
  const normalized = id.trim().toLowerCase();
  return TOOL_CATALOG.find((tool) => tool.id === normalized || tool.aliases?.includes(normalized));
}

export function supportedToolIds(): string {
  return TOOL_CATALOG.map((tool) => tool.id).join(', ');
}
