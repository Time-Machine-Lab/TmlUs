import path from 'node:path';
import type { TmlDocsStructureResult } from '../core/types.js';
import { ensureDirectory, ensureFile } from '../workspace/fs.js';

export const TML_DOCS_DIRECTORIES = [
  'docs',
  'docs/design',
  'docs/api',
  'docs/sql',
  'docs/preview',
  'docs/spec'
];

export async function initializeTmlDocsStructure(projectRoot: string): Promise<TmlDocsStructureResult> {
  const directories = [];
  const files = [];

  for (const directory of TML_DOCS_DIRECTORIES) {
    const directoryResult = await ensureDirectory(projectRoot, directory);
    directories.push(directoryResult);

    if (directoryResult.status !== 'failed') {
      files.push(await ensureFile(projectRoot, path.posix.join(directory, '.gitkeep')));
    }
  }

  return { directories, files };
}

export function tmlDocsStructureHasFailure(result: TmlDocsStructureResult): boolean {
  return result.directories.some((item) => item.status === 'failed')
    || result.files.some((item) => item.status === 'failed');
}
