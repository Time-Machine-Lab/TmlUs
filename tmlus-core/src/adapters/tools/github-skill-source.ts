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

interface GitHubTreeItem {
  path: string;
  type: 'blob' | 'tree';
}

interface GitHubTreeResponse {
  tree: GitHubTreeItem[];
  truncated?: boolean;
}

interface GitHubErrorBody {
  message?: string;
  documentation_url?: string;
}

export interface GitHubSkillManifestDiscoveryOptions {
  maxDepth?: number;
  includeCategories?: string[];
  excludeCategories?: string[];
  concurrency?: number;
}

export interface GitHubSkillManifest {
  id: string;
  source: string;
  directory: string;
  manifestPath: string;
  category?: string;
  name?: string;
  description?: string;
}

interface GitHubSkillManifestPath {
  id: string;
  source: string;
  directory: string;
  manifestPath: string;
  category?: string;
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

function formatGitHubSource(source: GitHubSource, directory: string): string {
  const repo = source.ref ? `${source.repo}#${source.ref}` : source.repo;
  return `github:${source.owner}/${repo}${directory ? `/${directory}` : ''}`;
}

function normalizeGitHubPath(value: string): string {
  return value.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
}

function isUnderDirectory(filePath: string, directory: string): boolean {
  if (!directory) {
    return true;
  }

  return filePath === directory || filePath.startsWith(`${directory}/`);
}

function categoryAllowed(category: string | undefined, options: GitHubSkillManifestDiscoveryOptions): boolean {
  const normalized = category?.toLowerCase();
  const include = options.includeCategories?.map((item) => item.toLowerCase());
  const exclude = options.excludeCategories?.map((item) => item.toLowerCase());

  if (include?.length && (!normalized || !include.includes(normalized))) {
    return false;
  }

  if (normalized && exclude?.includes(normalized)) {
    return false;
  }

  return true;
}

function manifestPathsFromRepoPaths(
  source: GitHubSource,
  paths: string[],
  options: GitHubSkillManifestDiscoveryOptions
): GitHubSkillManifestPath[] {
  const sourceDirectory = normalizeGitHubPath(source.directory);
  const manifests: GitHubSkillManifestPath[] = [];

  for (const rawPath of paths) {
    const manifestPath = normalizeGitHubPath(rawPath);
    if (!manifestPath.endsWith('/SKILL.md') && manifestPath !== 'SKILL.md') {
      continue;
    }

    if (!isUnderDirectory(manifestPath, sourceDirectory)) {
      continue;
    }

    const relativePath = sourceDirectory
      ? manifestPath.slice(sourceDirectory.length + 1)
      : manifestPath;
    const parts = relativePath.split('/').filter(Boolean);
    if (parts.at(-1) !== 'SKILL.md' || parts.length < 2) {
      continue;
    }

    const directoryParts = parts.slice(0, -1);
    if (options.maxDepth && directoryParts.length > options.maxDepth) {
      continue;
    }

    const category = directoryParts.length > 1 ? directoryParts[0] : undefined;
    if (!categoryAllowed(category, options)) {
      continue;
    }

    const directory = sourceDirectory
      ? `${sourceDirectory}/${directoryParts.join('/')}`
      : directoryParts.join('/');

    manifests.push({
      id: directoryParts.at(-1) ?? directory,
      source: formatGitHubSource(source, directory),
      directory,
      manifestPath,
      ...(category ? { category } : {})
    });
  }

  return manifests.sort((left, right) => left.directory.localeCompare(right.directory));
}

async function getRecursiveTree(source: GitHubSource): Promise<{ branch: string; paths: string[] }> {
  const errors: string[] = [];

  for (const branch of branchCandidates(source)) {
    const url = `https://api.github.com/repos/${source.owner}/${source.repo}/git/trees/${branch}?recursive=1`;
    try {
      const tree = await getJson<GitHubTreeResponse>(url);
      if (tree.truncated) {
        throw new Error('GitHub tree response was truncated.');
      }

      return {
        branch,
        paths: tree.tree
          .filter((item) => item.type === 'blob')
          .map((item) => item.path)
      };
    } catch (error) {
      errors.push(`${branch}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  throw new Error(`GitHub recursive tree failed for ${source.owner}/${source.repo} (${errors.join(', ')})`);
}

async function collectManifestPaths(directoryPath: string, repoRelativeDirectory: string): Promise<string[]> {
  const entries = await readdir(directoryPath, { withFileTypes: true });
  const paths: string[] = [];

  for (const entry of entries) {
    const localPath = path.join(directoryPath, entry.name);
    const repoPath = repoRelativeDirectory
      ? `${repoRelativeDirectory}/${entry.name}`
      : entry.name;

    if (entry.isDirectory()) {
      paths.push(...await collectManifestPaths(localPath, repoPath));
      continue;
    }

    if (entry.isFile() && entry.name === 'SKILL.md') {
      paths.push(repoPath);
    }
  }

  return paths;
}

async function listGitHubSkillManifestPathsFromArchive(
  source: GitHubSource,
  options: GitHubSkillManifestDiscoveryOptions
): Promise<GitHubSkillManifestPath[]> {
  return withArchive(source, async (extractedRoot) => {
    const sourceDirectory = normalizeGitHubPath(source.directory);
    const directoryPath = sourceDirectory
      ? path.join(extractedRoot, ...sourceDirectory.split('/'))
      : extractedRoot;
    const paths = await collectManifestPaths(directoryPath, sourceDirectory);
    return manifestPathsFromRepoPaths(source, paths, options);
  });
}

async function listGitHubSkillManifestPaths(
  source: GitHubSource,
  options: GitHubSkillManifestDiscoveryOptions
): Promise<{ branch?: string; manifests: GitHubSkillManifestPath[] }> {
  try {
    const tree = await getRecursiveTree(source);
    return {
      branch: tree.branch,
      manifests: manifestPathsFromRepoPaths(source, tree.paths, options)
    };
  } catch {
    return {
      manifests: await listGitHubSkillManifestPathsFromArchive(source, options)
    };
  }
}

async function fetchRawGitHubFile(source: GitHubSource, filePath: string, branch?: string): Promise<string> {
  const branches = branch ? [branch] : branchCandidates(source);
  const encodedPath = filePath.split('/').map(encodeURIComponent).join('/');
  const errors: string[] = [];

  for (const candidate of branches) {
    const url = `https://raw.githubusercontent.com/${source.owner}/${source.repo}/${candidate}/${encodedPath}`;
    const response = await fetch(url, {
      headers: githubHeaders()
    });

    if (response.ok) {
      return response.text();
    }

    errors.push(`${candidate}: ${response.status}`);
  }

  throw new Error(`GitHub raw file request failed for ${filePath} (${errors.join(', ')})`);
}

export function parseSkillFrontmatter(raw: string): { name?: string; description?: string } {
  const match = raw.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  if (!match) {
    return {};
  }

  const lines = match[1].split(/\r?\n/);
  const fields: Record<string, string> = {};

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const keyValue = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!keyValue) {
      continue;
    }

    const key = keyValue[1];
    let value = keyValue[2].trim();
    if (value === '>' || value === '|') {
      const parts: string[] = [];
      while (index + 1 < lines.length && /^\s+/.test(lines[index + 1])) {
        index += 1;
        parts.push(lines[index].trim());
      }
      value = parts.join(' ').replace(/\s+/g, ' ').trim();
    }

    fields[key] = value.replace(/^['"]|['"]$/g, '').trim();
  }

  return {
    ...(fields.name ? { name: fields.name } : {}),
    ...(fields.description ? { description: fields.description } : {})
  };
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  callback: (item: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  const workerCount = Math.max(1, Math.min(concurrency, items.length));

  await Promise.all(Array.from({ length: workerCount }, async () => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await callback(items[currentIndex]);
    }
  }));

  return results;
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

export async function listGitHubSkillManifests(
  source: string,
  options: GitHubSkillManifestDiscoveryOptions = {}
): Promise<GitHubSkillManifest[] | undefined> {
  const parsed = parseGitHubSource(source);
  if (!parsed) {
    return undefined;
  }

  const { branch, manifests } = await listGitHubSkillManifestPaths(parsed, options);
  const concurrency = options.concurrency ?? 8;
  return mapWithConcurrency(manifests, concurrency, async (manifest) => {
    try {
      const raw = await fetchRawGitHubFile(parsed, manifest.manifestPath, branch);
      return {
        ...manifest,
        ...parseSkillFrontmatter(raw)
      };
    } catch {
      return manifest;
    }
  });
}
