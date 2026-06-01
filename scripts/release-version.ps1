param(
  [string]$Version,
  [switch]$Yes,
  [switch]$DryRun,
  [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'

function Invoke-Git {
  param(
    [Parameter(Mandatory = $true)]
    [string[]]$Arguments,
    [switch]$Capture
  )

  if ($Capture) {
    $output = & git @Arguments 2>&1
    if ($LASTEXITCODE -ne 0) {
      throw "git $($Arguments -join ' ') failed:`n$($output -join "`n")"
    }
    return ($output -join "`n").Trim()
  }

  & git @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "git $($Arguments -join ' ') failed."
  }
}

function Invoke-Npm {
  param(
    [Parameter(Mandatory = $true)]
    [string[]]$Arguments,
    [Parameter(Mandatory = $true)]
    [string]$WorkingDirectory
  )

  Push-Location -LiteralPath $WorkingDirectory
  try {
    & npm @Arguments
    if ($LASTEXITCODE -ne 0) {
      throw "npm $($Arguments -join ' ') failed."
    }
  }
  finally {
    Pop-Location
  }
}

function Assert-VersionFormat {
  param([Parameter(Mandatory = $true)][string]$Value)

  if ($Value -notmatch '^\d+\.\d+\.\d+$') {
    throw "Invalid version: $Value. Use x.x.x, where every x is a number."
  }
}

function Split-Version {
  param([Parameter(Mandatory = $true)][string]$Value)

  Assert-VersionFormat -Value $Value
  return [int[]]($Value -split '\.')
}

function Compare-VersionNumber {
  param(
    [Parameter(Mandatory = $true)][string]$Left,
    [Parameter(Mandatory = $true)][string]$Right
  )

  $leftParts = Split-Version -Value $Left
  $rightParts = Split-Version -Value $Right

  for ($i = 0; $i -lt 3; $i += 1) {
    if ($leftParts[$i] -gt $rightParts[$i]) {
      return 1
    }
    if ($leftParts[$i] -lt $rightParts[$i]) {
      return -1
    }
  }

  return 0
}

function Get-DefaultNextVersion {
  param([Parameter(Mandatory = $true)][string]$CurrentVersion)

  $parts = Split-Version -Value $CurrentVersion
  $major = $parts[0]
  $minor = $parts[1]

  if ($minor -eq 9) {
    $major += 1
    $minor = 0
  }
  else {
    $minor += 1
  }

  return "${major}.${minor}.0"
}

function Get-PackageVersion {
  param([Parameter(Mandatory = $true)][string]$PackageJsonPath)

  $package = Get-Content -LiteralPath $PackageJsonPath -Raw | ConvertFrom-Json
  if (-not $package.version) {
    throw "No version field found in $PackageJsonPath."
  }

  Assert-VersionFormat -Value $package.version
  return [string]$package.version
}

try {
  $repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
  $packageDirectory = Join-Path $repoRoot 'tmlus-core'
  $packageJsonPath = Join-Path $packageDirectory 'package.json'
  $packageLockPath = Join-Path $packageDirectory 'package-lock.json'
  $versionFiles = @(
    'tmlus-core/package.json',
    'tmlus-core/package-lock.json'
  )

  if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    throw 'git was not found. Install Git and make sure it is available in PATH.'
  }
  if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    throw 'npm was not found. Install Node.js/npm and make sure they are available in PATH.'
  }
  if (-not (Test-Path -LiteralPath $packageJsonPath)) {
    throw "package.json not found: $packageJsonPath"
  }
  if (-not (Test-Path -LiteralPath $packageLockPath)) {
    throw "package-lock.json not found: $packageLockPath"
  }

  Set-Location -LiteralPath $repoRoot

  $currentBranch = Invoke-Git -Arguments @('branch', '--show-current') -Capture
  if ($currentBranch -ne 'main') {
    throw "Current branch is $currentBranch. Switch to main before releasing."
  }

  Invoke-Git -Arguments @('remote', 'get-url', 'origin') -Capture | Out-Null

  $currentVersion = Get-PackageVersion -PackageJsonPath $packageJsonPath
  $defaultVersion = Get-DefaultNextVersion -CurrentVersion $currentVersion

  Write-Host ''
  Write-Host "Current version: $currentVersion"
  Write-Host "Default next version: $defaultVersion"
  Write-Host ''

  $dirtyVersionFiles = Invoke-Git -Arguments (@('status', '--porcelain', '--') + $versionFiles) -Capture
  if ($dirtyVersionFiles) {
    throw "Version files already have uncommitted changes. Commit or stash them before releasing:`n$dirtyVersionFiles"
  }

  if (-not $Version) {
    $Version = Read-Host 'Enter next version (press Enter to use the default)'
  }
  if (-not $Version) {
    $Version = $defaultVersion
  }

  Assert-VersionFormat -Value $Version

  if ((Compare-VersionNumber -Left $Version -Right $currentVersion) -le 0) {
    throw "Next version must be greater than the current version. Current: $currentVersion, input: $Version"
  }

  $tagName = "v$Version"
  $releaseDescription = "$([char]0x7248)$([char]0x672C)$([char]0x53D1)$([char]0x5E03)"
  $commitMessage = "release. $Version$releaseDescription"

  $existingLocalTag = & git rev-parse -q --verify "refs/tags/$tagName" 2>$null
  if ($LASTEXITCODE -eq 0 -and $existingLocalTag) {
    throw "Local tag already exists: $tagName"
  }

  $existingRemoteTag = & git ls-remote --tags origin "refs/tags/$tagName" 2>$null
  if ($LASTEXITCODE -ne 0) {
    throw 'Failed to check remote tags.'
  }
  if ($existingRemoteTag) {
    throw "Remote tag already exists: $tagName"
  }

  Write-Host ''
  Write-Host 'Release plan:'
  Write-Host "  Version files: $($versionFiles -join ', ')"
  Write-Host "  Commit: $commitMessage"
  Write-Host "  Tag: $tagName"
  Write-Host '  Push: origin main + tag (atomic)'
  Write-Host '  GitHub Actions: publish npm package and create GitHub Release after tag push'
  Write-Host ''

  if ($DryRun) {
    Write-Host 'DryRun mode: no files changed, no commit created, no push performed.'
    exit 0
  }

  if (-not $Yes) {
    $confirmation = Read-Host 'Continue? Type y to proceed'
    if ($confirmation -notin @('y', 'Y')) {
      Write-Host 'Canceled.'
      exit 0
    }
  }

  Invoke-Npm -Arguments @('version', $Version, '--no-git-tag-version') -WorkingDirectory $packageDirectory

  if (-not $SkipBuild) {
    Invoke-Npm -Arguments @('run', 'build') -WorkingDirectory $packageDirectory
  }

  $updatedVersion = Get-PackageVersion -PackageJsonPath $packageJsonPath
  if ($updatedVersion -ne $Version) {
    throw "Version update check failed. Expected: $Version, actual: $updatedVersion"
  }

  Invoke-Git -Arguments (@('add', '--') + $versionFiles)
  Invoke-Git -Arguments (@('commit', '-m', $commitMessage, '--') + $versionFiles)
  Invoke-Git -Arguments @('tag', '-a', $tagName, '-m', $commitMessage)
  Invoke-Git -Arguments @('push', '--atomic', 'origin', 'HEAD:refs/heads/main', "refs/tags/$tagName")

  Write-Host ''
  Write-Host "Release pushed: $tagName"
  Write-Host 'GitHub Actions will publish the npm package and create/update the matching GitHub Release.'
}
catch {
  Write-Host ''
  Write-Host "Release failed: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}
