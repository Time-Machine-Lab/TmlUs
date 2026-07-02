import { findToolById, TOOL_CATALOG, supportedToolIds } from '../catalog/tools.js';
import type { EnvironmentDefinition, ToolDefinition, ToolInstallProgressEvent, ToolInstallResult, ToolPromptActionDefinition } from '../core/types.js';
import { selectDefaultIdeTargets } from './ide-init.js';
import { installCodeGraphTool } from '../adapters/tools/codegraph.js';
import {
  inspectToolDocumentPackage,
  prepareToolDocumentPackage,
  readToolDocument
} from '../adapters/tools/document-package.js';

export function resolveToolIds(ids: string[]): { tools: ToolDefinition[]; unknown: string[] } {
  const tools: ToolDefinition[] = [];
  const unknown: string[] = [];
  const seen = new Set<string>();

  for (const id of ids) {
    const tool = findToolById(id);
    if (!tool) {
      unknown.push(id);
      continue;
    }

    if (!seen.has(tool.id)) {
      seen.add(tool.id);
      tools.push(tool);
    }
  }

  return { tools, unknown };
}

export async function installTool(
  projectRoot: string,
  tool: ToolDefinition,
  environments: EnvironmentDefinition[],
  options: { onProgress?: (event: ToolInstallProgressEvent) => void } = {}
): Promise<ToolInstallResult> {
  if (tool.adapter === 'codegraph') {
    return installCodeGraphTool(projectRoot, tool, {
      environments,
      onProgress: options.onProgress
    });
  }

  if (tool.adapter === 'document-package') {
    return prepareToolDocumentPackage(tool, {
      onProgress: options.onProgress
    });
  }

  return {
    tool,
    actions: [
      {
        label: tool.name,
        status: 'failed',
        message: `Unsupported Tool adapter: ${tool.adapter}`
      }
    ]
  };
}

export async function defaultToolTargets(projectRoot: string): Promise<EnvironmentDefinition[]> {
  return selectDefaultIdeTargets(projectRoot);
}

export function defaultTools(): ToolDefinition[] {
  return TOOL_CATALOG;
}

export function toolInstallHasFailure(result: ToolInstallResult): boolean {
  return result.actions.some((action) => action.status === 'failed');
}

export function toolRequiresIdeTargets(tool: ToolDefinition): boolean {
  return tool.installer.strategy === 'external-cli' && tool.supportedEnvironmentIds.length > 0;
}

export function findToolPromptAction(tool: ToolDefinition, actionId: string): ToolPromptActionDefinition | undefined {
  const normalized = actionId.trim().toLowerCase();
  return tool.installer.promptActions?.find((action) => (
    action.id === normalized || action.aliases?.includes(normalized)
  ));
}

export function supportedToolPromptActions(tool: ToolDefinition): string {
  return (tool.installer.promptActions ?? []).map((action) => action.id).join(', ');
}

export async function isToolDocumentPackagePrepared(tool: ToolDefinition): Promise<boolean> {
  if (tool.installer.strategy !== 'document-package') {
    return false;
  }

  return (await inspectToolDocumentPackage(tool.id)).status === 'complete';
}

export async function prepareToolDocuments(
  tool: ToolDefinition,
  options: { force?: boolean; onProgress?: (event: ToolInstallProgressEvent) => void } = {}
): Promise<ToolInstallResult> {
  return prepareToolDocumentPackage(tool, {
    force: options.force,
    onProgress: options.onProgress
  });
}

export async function readPreparedToolDocument(
  tool: ToolDefinition,
  fileName: 'install-runbook.md' | 'skillclaw-help.md'
): Promise<{ path: string; content: string }> {
  return readToolDocument(tool.id, fileName);
}

export function unknownToolMessage(unknown: string[]): string {
  return [
    `Unknown Tool: ${unknown.join(', ')}`,
    `Supported Tools: ${supportedToolIds()}`
  ].join('\n');
}
