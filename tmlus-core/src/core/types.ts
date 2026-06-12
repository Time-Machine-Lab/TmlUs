export type Language = 'zh' | 'en';

export interface LocalizedText {
  zh: string;
  en: string;
}

export interface CommandMetadata {
  command: string;
  aliases?: string[];
  valueHint?: string;
  name: LocalizedText;
  description: LocalizedText;
  examples: string[];
  parameterNotes?: LocalizedText[];
}

export type ResourceTargetType = 'skills' | 'commands' | 'prompts' | 'rules';

export interface EnvironmentDefinition {
  id: string;
  displayName: string;
  aliases: string[];
  markerDirectory: string;
  requiredDirectories: string[];
  targetDirectories: Partial<Record<ResourceTargetType, string>>;
}

export type EnvironmentStatusKind = 'missing' | 'complete' | 'incomplete';

export interface EnvironmentStatus {
  environment: EnvironmentDefinition;
  kind: EnvironmentStatusKind;
  markerExists: boolean;
  existingDirectories: string[];
  missingDirectories: string[];
}

export interface SkillInstallTarget {
  environmentId: string;
  targetType: ResourceTargetType;
  targetSubdirectory?: string;
}

export type SkillInstallStrategy = 'github-directory' | 'github-root-skill' | 'github-skill-bundle' | 'local-directory';

export interface SkillInstallerDefinition {
  strategy: SkillInstallStrategy;
  includePaths?: string[];
  bundleDirectory?: string;
}

export interface SkillDefinition {
  id: string;
  aliases?: string[];
  name: string;
  source: string;
  category: string;
  description: string;
  installer?: SkillInstallerDefinition;
  targets: SkillInstallTarget[];
}

export type ToolRecommendation = 1 | 2 | 3 | 4 | 5;

export type ToolInstallStrategy = 'external-cli';

export interface ToolInstallerDefinition {
  strategy: ToolInstallStrategy;
  command: string;
  packageName?: string;
}

export interface ToolDefinition {
  id: string;
  aliases?: string[];
  name: string;
  purpose: string;
  recommendation: ToolRecommendation;
  installer: ToolInstallerDefinition;
  adapter: string;
  supportedEnvironmentIds: string[];
  projectArtifacts: string[];
}

export type ToolInstallActionStatus =
  | 'installed'
  | 'existing'
  | 'initialized'
  | 'configured'
  | 'skipped'
  | 'failed';

export interface ToolInstallActionResult {
  label: string;
  status: ToolInstallActionStatus;
  message: string;
  target?: string;
}

export interface ToolInstallResult {
  tool: ToolDefinition;
  actions: ToolInstallActionResult[];
}

export type ToolInstallProgressEvent =
  | {
    type: 'plan';
    title: string;
    lines: string[];
  }
  | {
    type: 'step-start';
    step: number;
    total: number;
    title: string;
    detail?: string;
  }
  | {
    type: 'step-result';
    action: ToolInstallActionResult;
  }
  | {
    type: 'note';
    message: string;
  };

export interface DirectoryEnsureResult {
  path: string;
  status: 'created' | 'existing' | 'failed';
  error?: string;
}

export interface FileEnsureResult {
  path: string;
  status: 'created' | 'existing' | 'failed';
  error?: string;
}

export interface IdeInitializationResult {
  environment: EnvironmentDefinition;
  statusBefore: EnvironmentStatusKind;
  directories: DirectoryEnsureResult[];
}

export interface SkillInstallResult {
  skill: SkillDefinition;
  environment: EnvironmentDefinition;
  status: 'installed' | 'skipped' | 'failed';
  targetPath?: string;
  message: string;
}

export interface TmlDocsStructureResult {
  directories: DirectoryEnsureResult[];
  files: FileEnsureResult[];
}

export type WorkModeId = 'openspec' | 'skip';

export interface WorkModeDefinition {
  id: WorkModeId;
  name: string;
  description: string;
}

export interface WorkModeInitializationResult {
  mode: WorkModeDefinition;
  status: 'initialized' | 'existing' | 'skipped' | 'failed';
  message: string;
}

export type TmlusUpdateStatus =
  | 'already-current'
  | 'update-available'
  | 'updated'
  | 'verification-failed'
  | 'unsupported-invocation'
  | 'failed';

export type TmlusUpdateFailureStage = 'latest-version' | 'install' | 'verification';

export interface TmlusUpdateResult {
  status: TmlusUpdateStatus;
  currentVersion: string;
  latestVersion?: string;
  verifiedVersion?: string;
  message: string;
  manualCommand?: string;
  failureStage?: TmlusUpdateFailureStage;
}

export type TmlusRefreshEntryStatus = 'deleted' | 'skipped' | 'failed';

export interface TmlusRefreshEntryResult {
  label: string;
  path: string;
  status: TmlusRefreshEntryStatus;
  error?: string;
}

export interface TmlusRefreshResult {
  cacheDirectory: string;
  entries: TmlusRefreshEntryResult[];
}
