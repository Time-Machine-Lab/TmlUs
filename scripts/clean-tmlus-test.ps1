param(
  [switch]$Force
)

$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$testRoot = Join-Path $repoRoot 'tmlus-test'

if (-not (Test-Path -LiteralPath $testRoot)) {
  New-Item -ItemType Directory -Path $testRoot | Out-Null
  Write-Host "created: $testRoot"
  exit 0
}

$resolvedTestRoot = Resolve-Path -LiteralPath $testRoot
$expectedRoot = Join-Path $repoRoot 'tmlus-test'

if ($resolvedTestRoot.Path -ne $expectedRoot) {
  throw "Refusing to clean unexpected path: $($resolvedTestRoot.Path)"
}

if (-not $Force) {
  Write-Host "This will remove all contents under: $testRoot"
  Write-Host "Re-run with -Force to continue."
  exit 1
}

Get-ChildItem -LiteralPath $testRoot -Force | Remove-Item -Recurse -Force
Write-Host "cleaned: $testRoot"
