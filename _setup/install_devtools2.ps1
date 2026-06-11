# Robust installer for the remaining tools. No output piping of winget
# (that mangled the first run); we only write our own clean status markers.

$results = 'C:\AI\RubiksCubeCoach\_setup\results.txt'
"START $(Get-Date)" | Set-Content $results -Encoding utf8

function Try-Install {
    param([string]$Id, [string[]]$Extra)
    $a = @('install','--id',$Id,'--exact','--silent',
           '--accept-package-agreements','--accept-source-agreements','--disable-interactivity')
    if ($Extra) { $a += $Extra }
    & winget @a | Out-Null
    $code = $LASTEXITCODE
    # winget: 0 = ok, 0x8A15002B = already installed / no upgrade
    Add-Content $results "$Id => exit $code"
}

Try-Install 'Microsoft.VisualStudioCode' @('--scope','machine')
Try-Install 'EclipseAdoptium.Temurin.21.JDK'
Try-Install 'GitHub.cli'
Try-Install 'Microsoft.VisualStudio.2022.BuildTools' @(
    '--override','--passive --norestart --wait --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended')

Add-Content $results "DONE $(Get-Date)"
