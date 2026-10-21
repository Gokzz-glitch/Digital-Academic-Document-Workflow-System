$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
$runtimeRoot = Join-Path $env:LOCALAPPDATA 'DigitalAcademicDocumentWorkflowSystem\app'

try {
    New-Item -ItemType Directory -Force -Path $runtimeRoot | Out-Null

    function Sync-ProjectTree([string]$relativePath) {
        $sourcePath = Join-Path $projectRoot $relativePath
        $runtimePath = Join-Path $runtimeRoot $relativePath
        if (!(Test-Path -LiteralPath $sourcePath -PathType Container)) { throw "Project source folder is missing: $sourcePath" }
        New-Item -ItemType Directory -Force -Path $runtimePath | Out-Null
        & robocopy.exe $sourcePath $runtimePath /E /NFL /NDL /NJH /NJS /NS /NC /NP | Out-Null
        if ($LASTEXITCODE -ge 8) { throw "Could not sync $relativePath (robocopy code $LASTEXITCODE)." }
    }

    Write-Host 'Preparing app files...' -ForegroundColor Cyan
    foreach ($path in @('client\src','client\public','server\config','server\controllers','server\middleware','server\models','server\routes','server\services')) { Sync-ProjectTree $path }
    foreach ($file in @('client\index.html','client\package.json','client\package-lock.json','client\postcss.config.js','client\tailwind.config.js','client\vite.config.js','server\server.js','server\seed.js','server\package.json','server\package-lock.json')) {
        $src = Join-Path $projectRoot $file
        $dst = Join-Path $runtimeRoot $file
        if (Test-Path -LiteralPath $src -PathType Leaf) {
            New-Item -ItemType Directory -Force -Path (Split-Path -Parent $dst) | Out-Null
            Copy-Item -LiteralPath $src -Destination $dst -Force
        }
    }

    $runtimeLauncher = Join-Path $runtimeRoot 'start-app.ps1'
    $runtimeLauncherSource = Join-Path $projectRoot 'scripts\start-app-runtime.ps1'
    if (!(Test-Path -LiteralPath $runtimeLauncherSource -PathType Leaf)) { throw "Runtime launcher source is missing: $runtimeLauncherSource" }
    Copy-Item -LiteralPath $runtimeLauncherSource -Destination $runtimeLauncher -Force

    $serverEnv = Join-Path $runtimeRoot 'server\.env'
    if (!(Test-Path -LiteralPath $serverEnv -PathType Leaf)) {
        $envExample = Join-Path $projectRoot 'server\.env.example'
        if (!(Test-Path -LiteralPath $envExample -PathType Leaf)) { throw "Environment template is missing: $envExample" }
        Copy-Item -LiteralPath $envExample -Destination $serverEnv
        $secretBytes = New-Object byte[] 48
        [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($secretBytes)
        $jwtSecret = [Convert]::ToBase64String($secretBytes)
        $envText = Get-Content -LiteralPath $serverEnv -Raw
        $envText = $envText -replace '(?m)^JWT_SECRET=.*$', "JWT_SECRET=$jwtSecret"
        Set-Content -LiteralPath $serverEnv -Value $envText -Encoding utf8
    }
    & $runtimeLauncher
} catch {
    Write-Host "`nAPP START FAILED: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Runtime logs: $runtimeRoot\runtime-logs" -ForegroundColor Yellow
    Write-Host 'Press Enter to close this window.' -ForegroundColor DarkGray
    [void](Read-Host)
    exit 1
}
