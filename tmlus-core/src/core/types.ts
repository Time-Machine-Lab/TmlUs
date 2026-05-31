export type Language = 'zh' | 'en';

export interface LocalizedText {
  zh: string;
  en: string;
}

export interface CommandMetadata {
  flag: string;
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
