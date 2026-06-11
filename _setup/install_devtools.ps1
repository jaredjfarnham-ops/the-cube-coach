# Elevated dev-tools installer for the STRIX z890.
# Installs the remaining stack via winget (machine scope) and logs results.
# Run elevated (the launcher does this). One UAC prompt covers everything here.

$ErrorActionPreference = 'Continue'
$log = Join-Path $PSScriptRoot 'install_log.txt'
"==== Dev tools install started $(Get-Date) ====" | Out-File $log -Encoding utf8

function Install-Pkg {
    param([string]$Id, [string[]]$Extra)
    "`n---- Installing $Id ----" | Tee-Object -FilePath $log -Append
    $args = @('install','--id',$Id,'--exact','--silent',
              '--accept-package-agreements','--accept-source-agreements',
              '--disable-interactivity')
    if ($Extra) { $args += $Extra }
    & winget @args 2>&1 | Tee-Object -FilePath $log -Append
    "Exit code for ${Id}: $LASTEXITCODE" | Tee-Object -FilePath $log -Append
}

# .NET SDK (LTS). Try 10 first, fall back to 9.
& winget show --id Microsoft.DotNet.SDK.10 --exact 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) { Install-Pkg 'Microsoft.DotNet.SDK.10' } else { Install-Pkg 'Microsoft.DotNet.SDK.9' }

# Visual Studio Code (system-wide, adds 'code' to PATH)
Install-Pkg 'Microsoft.VisualStudioCode' @('--scope','machine')

# Java JDK (Eclipse Temurin 21 LTS)
Install-Pkg 'EclipseAdoptium.Temurin.21.JDK'

# GitHub CLI
Install-Pkg 'GitHub.cli'

# C++ build tools (MSVC) with the C++ workload
Install-Pkg 'Microsoft.VisualStudio.2022.BuildTools' @(
    '--override','--passive --wait --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended')

"`n==== Dev tools install finished $(Get-Date) ====" | Tee-Object -FilePath $log -Append
