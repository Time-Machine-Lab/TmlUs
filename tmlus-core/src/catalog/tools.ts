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
  }
];

export function findToolById(id: string): ToolDefinition | undefined {
  const normalized = id.trim().toLowerCase();
  return TOOL_CATALOG.find((tool) => tool.id === normalized || tool.aliases?.includes(normalized));
}

export function supportedToolIds(): string {
  return TOOL_CATALOG.map((tool) => tool.id).join(', ');
}
