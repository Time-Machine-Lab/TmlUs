import { cp, mkdtemp, mkdir, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

interface GitHubContentItem {
  name: string;
  path: string;
  type: 'file' | 'dir';
  download_url: string | null;
}

interface GitHubSource {
  owner: string;
  repo: string;
  directory: string;
  ref?: string;
}

interface GitHubErrorBody {
  message?: string;
  documentation_url?: string;
}

export function parseGitHubSource(source: string): GitHubSource | undefined {
  if (!source.startsWith('github:')) {
    return undefined;
  }

  const parts = source.slice('github:'.length).split('/').filter(Boolean);
  if (parts.length < 2) {
    return undefined;
  }

  const [owner, rawRepo, ...directoryParts] = parts;
  const [repo, ref] = rawRepo?.split('#') ?? [];
  if (!owner || !repo) {
    return undefined;
  }

  return {
    owner,
    repo,
    directory: directoryParts.join('/'),
    ref
  };
}

function githubToken(): string | undefined {
  return process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
}

function githubHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const token = githubToken();
  return {
    'user-agent': 'tmlus-cli',
    ...(token ? { authorization: `Bearer ${token}` } : {}),
    ...extraHeaders
  };
}

function formatRateLimitReset(value: string | null): string | undefined {
  if (!value) {
    return undefined;
  }

  const timestamp = Number(value);
  if (!Number.isFinite(timestamp)) {
    return undefined;
  }

  return new Date(timestamp * 1000).toISOString();
}

async function githubError(response: Response, url: string): Promise<Error> {
  let message = '';
  try {
    const body = await response.json() as GitHubErrorBody;
    message = body.message ?? '';
  } catch {
    try {
      message = await response.text();
    } catch {
      message = '';
    }
  }

  const remaining = response.headers.get('x-ratelimit-remaining');
  const reset = formatRateLimitReset(response.headers.get('x-ratelimit-reset'));
  const rateLimitHint = response.status === 403 && remaining === '0'
    ? ` GitHub API rate limit is exhausted${reset ? ` until ${reset}` : ''}. Set GITHUB_TOKEN or GH_TOKEN to use authenticated requests.`
    : '';
  const detail = message ? ` - ${message}` : '';

  return new Error(`GitHub request failed (${response.status}) for ${url}${detail}.${rateLimitHint}`);
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: githubHeaders({
      accept: 'application/vnd.github+json'
    })
  });

  if (!response.ok) {
    throw await githubError(response, url);
  }

  return response.json() as Promise<T>;
}

async function downloadFile(url: string, destinationPath: string): Promise<void> {
  const response = await fetch(url, {
    headers: githubHeaders()
  });

  if (!response.ok) {
    throw new Error(`File download failed (${response.status}) for ${url}`);
  }

  await mkdir(path.dirname(destinationPath), { recursive: true });
  await writeFile(destinationPath, Buffer.from(await response.arrayBuffer()));
}

function branchCandidates(source: GitHubSource): string[] {
  return [...new Set([source.ref, 'main', 'master'].filter(Boolean) as string[])];
}

async function downloadArchive(source: GitHubSource, destinationFile: string): Promise<string> {
  const errors: string[] = [];

  for (const branch of branchCandidates(source)) {
    const url = `https://codeload.github.com/${source.owner}/${source.repo}/zip/refs/heads/${branch}`;
    const response = await fetch(url, {
      headers: githubHeaders()
    });

    if (response.ok) {
      await writeFile(destinationFile, Buffer.from(await response.arrayBuffer()));
      return branch;
    }

    errors.push(`${branch}: ${response.status}`);
  }

  throw new Error(`GitHub archive download failed for ${source.owner}/${source.repo} (${errors.join(', ')})`);
}

async function extractArchive(archivePath: string, destinationPath: string): Promise<void> {
  await mkdir(destinationPath, { recursive: true });

  const { spawn } = await import('node:child_process');
  await new Promise<void>((resolve, reject) => {
    const command = process.platform === 'win32' ? 'powershell' : 'unzip';
    const args = process.platform === 'win32'
      ? [
        '-NoProfile',
        '-ExecutionPolicy',
        'Bypass',
        '-Command',
        `Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::ExtractToDirectory('${archivePath.replace(/'/g, "''")}', '${destinationPath.replace(/'/g, "''")}')`
      ]
      : ['-q', archivePath, '-d', destinationPath];
    const child = spawn(command, args, {
      stdio: ['ignore', 'ignore', 'pipe']
    });
    let stderr = '';

    child.stderr.on('data', (chunk) => {
      stderr += String(chunk);
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`archive extraction failed (${code})${stderr ? `: ${stderr.trim()}` : ''}`));
    });
  });
}

async function copyExtractedPath(extractedRoot: string, sourcePath: string, destinationPath: string): Promise<void> {
  const normalizedSourcePath = sourcePath.replace(/\\/g, '/');
  const sourceFullPath = normalizedSourcePath
    ? path.join(extractedRoot, ...normalizedSourcePath.split('/'))
    : extractedRoot;
  const parentPath = path.dirname(destinationPath);
  const { cp } = await import('node:fs/promises');

  await mkdir(parentPath, { recursive: true });
  await cp(sourceFullPath, destinationPath, {
    force: true,
    recursive: true
  });
}

async function withArchive<T>(source: GitHubSource, callback: (extractedRoot: string) => Promise<T>): Promise<T> {
  const temporaryRoot = await mkdtemp(path.join(tmpdir(), 'tmlus-github-'));
  const archivePath = path.join(temporaryRoot, 'repo.zip');
  const extractPath = path.join(temporaryRoot, 'extract');

  try {
    const branch = await downloadArchive(source, archivePath);
    await extractArchive(archivePath, extractPath);
    const extractedRoot = path.join(extractPath, `${source.repo}-${branch}`);
    return await callback(extractedRoot);
  } finally {
    await rm(temporaryRoot, { force: true, recursive: true });
  }
}

async function listGitHubDirectoriesFromArchive(source: GitHubSource): Promise<string[]> {
  return withArchive(source, async (extractedRoot) => {
    const directoryPath = source.directory
      ? path.join(extractedRoot, ...source.directory.split('/'))
      : extractedRoot;
    const entries = await readdir(directoryPath, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort((left, right) => left.localeCompare(right));
  });
}

async function downloadGitHubDirectoryFromArchive(source: GitHubSource, sourceDirectory: string, destinationPath: string): Promise<void> {
  await withArchive(source, async (extractedRoot) => {
    await copyExtractedPath(extractedRoot, sourceDirectory, destinationPath);
  });
}

async function downloadGitHubPathsFromArchive(source: GitHubSource, includePaths: string[], destinationPath: string): Promise<void> {
  await withArchive(source, async (extractedRoot) => {
    await mkdir(destinationPath, { recursive: true });
    for (const includePath of includePaths) {
      const normalizedPath = includePath.replace(/\\/g, '/');
      const sourcePath = source.directory
        ? `${source.directory}/${normalizedPath}`
        : normalizedPath;
      await copyExtractedPath(extractedRoot, sourcePath, path.join(destinationPath, normalizedPath));
    }
  });
}

async function downloadGitHubSkillBundleFromArchive(source: GitHubSource, destinationPath: string, bundleDirectory: string): Promise<GitHubBundleInstallResult> {
  const sourceDirectory = source.directory
    ? `${source.directory}/${bundleDirectory}`.replace(/\/+/g, '/')
    : bundleDirectory;
  const installed: string[] = [];
  const skipped: string[] = [];

  await withArchive(source, async (extractedRoot) => {
    const bundlePath = path.join(extractedRoot, ...sourceDirectory.split('/'));
    await mkdir(destinationPath, { recursive: true });
    const entries = await readdir(bundlePath, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const targetPath = path.join(destinationPath, entry.name);
      try {
        await mkdir(targetPath);
        await rm(targetPath, { force: true, recursive: true });
      } catch {
        skipped.push(entry.name);
        continue;
      }

      await cp(path.join(bundlePath, entry.name), targetPath, {
        force: true,
        recursive: true
      });
      installed.push(entry.name);
    }
  });

  return { installed, skipped };
}

async function downloadGitHubDirectory(source: GitHubSource, sourceDirectory: string, destinationPath: string): Promise<void> {
  const apiUrl = `https://api.github.com/repos/${source.owner}/${source.repo}/contents/${sourceDirectory}`;
  const items = await getJson<GitHubContentItem[]>(apiUrl);

  for (const item of items) {
    const relative = path.relative(source.directory, item.path);
    const targetPath = path.join(destinationPath, relative);

    if (item.type === 'dir') {
      await downloadGitHubDirectory(source, item.path, destinationPath);
      continue;
    }

    if (item.type === 'file' && item.download_url) {
      await downloadFile(item.download_url, targetPath);
    }
  }
}

async function downloadGitHubPath(source: GitHubSource, sourcePath: string, destinationPath: string): Promise<void> {
  const apiUrl = `https://api.github.com/repos/${source.owner}/${source.repo}/contents/${sourcePath}`;
  const item = await getJson<GitHubContentItem | GitHubContentItem[]>(apiUrl);

  if (Array.isArray(item)) {
    const nestedSource = { ...source, directory: sourcePath };
    await mkdir(destinationPath, { recursive: true });
    await downloadGitHubDirectory(nestedSource, sourcePath, destinationPath);
    return;
  }

  if (item.type === 'file' && item.download_url) {
    await downloadFile(item.download_url, destinationPath);
    return;
  }

  throw new Error(`Unsupported GitHub content path: ${sourcePath}`);
}

export async function downloadGitHubPaths(source: string, includePaths: string[], destinationPath: string): Promise<boolean> {
  const parsed = parseGitHubSource(source);
  if (!parsed) {
    return false;
  }

  try {
    await mkdir(destinationPath, { recursive: true });
    for (const includePath of includePaths) {
      const normalizedPath = includePath.replace(/\\/g, '/');
      const sourcePath = parsed.directory
        ? `${parsed.directory}/${normalizedPath}`
        : normalizedPath;
      const targetPath = path.join(destinationPath, normalizedPath);
      await downloadGitHubPath(parsed, sourcePath, targetPath);
    }
  } catch (error) {
    await downloadGitHubPathsFromArchive(parsed, includePaths, destinationPath);
  }

  return true;
}

export interface GitHubBundleInstallResult {
  installed: string[];
  skipped: string[];
}

export async function downloadGitHubSkillBundle(source: string, destinationPath: string, bundleDirectory: string): Promise<GitHubBundleInstallResult | undefined> {
  const parsed = parseGitHubSource(source);
  if (!parsed) {
    return undefined;
  }

  const sourceDirectory = parsed.directory
    ? `${parsed.directory}/${bundleDirectory}`.replace(/\/+/g, '/')
    : bundleDirectory;
  const temporaryPath = `${destinationPath}.tmp-${Date.now()}`;
  const nestedSource = { ...parsed, directory: sourceDirectory };
  const installed: string[] = [];
  const skipped: string[] = [];

  try {
    await rm(temporaryPath, { force: true, recursive: true });
    await mkdir(destinationPath, { recursive: true });
    await mkdir(temporaryPath, { recursive: true });
    await downloadGitHubDirectory(nestedSource, sourceDirectory, temporaryPath);
  } catch (error) {
    await rm(temporaryPath, { force: true, recursive: true });
    return downloadGitHubSkillBundleFromArchive(parsed, destinationPath, bundleDirectory);
  }

  const entries = await readdir(temporaryPath, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const targetPath = path.join(destinationPath, entry.name);
    try {
      await mkdir(targetPath);
      await rm(targetPath, { force: true, recursive: true });
    } catch {
      skipped.push(entry.name);
      continue;
    }

    await rename(path.join(temporaryPath, entry.name), targetPath);
    installed.push(entry.name);
  }

  await rm(temporaryPath, { force: true, recursive: true });
  return { installed, skipped };
}

export async function downloadGitHubSource(source: string, destinationPath: string): Promise<boolean> {
  const parsed = parseGitHubSource(source);
  if (!parsed) {
    return false;
  }

  await mkdir(destinationPath, { recursive: true });
  try {
    await downloadGitHubDirectory(parsed, parsed.directory || '', destinationPath);
  } catch (error) {
    await rm(destinationPath, { force: true, recursive: true });
    await downloadGitHubDirectoryFromArchive(parsed, parsed.directory || '', destinationPath);
  }
  return true;
}

export async function listGitHubDirectories(source: string): Promise<string[] | undefined> {
  const parsed = parseGitHubSource(source);
  if (!parsed) {
    return undefined;
  }

  const apiUrl = `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/contents/${parsed.directory || ''}`;
  try {
    const items = await getJson<GitHubContentItem[]>(apiUrl);
    return items
      .filter((item) => item.type === 'dir')
      .map((item) => item.name)
      .sort((left, right) => left.localeCompare(right));
  } catch {
    return listGitHubDirectoriesFromArchive(parsed);
  }
}
