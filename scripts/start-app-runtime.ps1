$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$server = Join-Path $root 'server'
$client = Join-Path $root 'client'
$logs = Join-Path $root 'runtime-logs'
$url = 'http://127.0.0.1:5173/'

$node = (Get-Command node.exe -ErrorAction Stop).Source
$npm = (Get-Command npm.cmd -ErrorAction Stop).Source
New-Item -ItemType Directory -Force -Path $logs | Out-Null

function Test-Port([int]$port) {
    return [bool](Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue)
}
function Test-UsableFile([string]$path) {
    if (!(Test-Path -LiteralPath $path -PathType Leaf)) { return $false }
    return (Get-Item -LiteralPath $path).Length -gt 0
}

if (!(Test-UsableFile (Join-Path $client 'node_modules\vite\bin\vite.js'))) {
    Push-Location $client
    try { & $npm install; if ($LASTEXITCODE -ne 0) { throw 'Frontend npm install failed' } } finally { Pop-Location }
}
if (!(Test-UsableFile (Join-Path $server 'node_modules\express\index.js'))) {
    Push-Location $server
    try { & $npm install; if ($LASTEXITCODE -ne 0) { throw 'Backend npm install failed' } } finally { Pop-Location }
}
if (!(Test-UsableFile (Join-Path $server 'node_modules\mongodb-memory-server\package.json'))) {
    Push-Location $server
    try { & $npm install mongodb-memory-server --no-save; if ($LASTEXITCODE -ne 0) { throw 'MongoDB fallback install failed' } } finally { Pop-Location }
}

$env:CLIENT_URL = 'http://127.0.0.1:5173'
$env:APP_DATA_DIR = Join-Path $env:LOCALAPPDATA 'DigitalAcademicDocumentWorkflowSystem'
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$serverOut = Join-Path $logs "server-$stamp.out.log"
$serverErr = Join-Path $logs "server-$stamp.err.log"
$clientOut = Join-Path $logs "client-$stamp.out.log"
$clientErr = Join-Path $logs "client-$stamp.err.log"
$startServer = -not (Test-Port 5000)
$startClient = -not (Test-Port 5173)

if ($startServer) {
    Start-Process -FilePath $node -ArgumentList 'server.js' -WorkingDirectory $server -WindowStyle Hidden -RedirectStandardOutput $serverOut -RedirectStandardError $serverErr | Out-Null
}
if ($startClient) {
    Start-Process -FilePath $node -ArgumentList @('node_modules/vite/bin/vite.js', '--host', '127.0.0.1') -WorkingDirectory $client -WindowStyle Hidden -RedirectStandardOutput $clientOut -RedirectStandardError $clientErr | Out-Null
}

if ($startServer) {
    $dbReady = $false
    for ($i = 0; $i -lt 180; $i++) {
        if (Test-Path $serverOut) {
            $text = Get-Content $serverOut -Raw -ErrorAction SilentlyContinue
            if ($text -match 'MongoDB Connected:|In-Memory MongoDB Connected:') { $dbReady = $true; break }
            $errorText = Get-Content $serverErr -Raw -ErrorAction SilentlyContinue
            if ($text -match 'Application startup failed|Error connecting to MongoDB:' -or $errorText -match 'Application startup failed|Error connecting to MongoDB:') { throw "Backend startup failed. See $serverErr" }
        }
        Start-Sleep -Seconds 1
    }
    if (-not $dbReady) { throw "Database is still starting. Check $serverOut" }
}

$uiReady = $false
for ($i = 0; $i -lt 45; $i++) {
    try {
        $response = Invoke-WebRequest $url -UseBasicParsing -TimeoutSec 2
        if ($response.StatusCode -eq 200) { $uiReady = $true; break }
    } catch {}
    Start-Sleep -Seconds 1
}
if (-not $uiReady) { throw "Frontend did not start. Check $clientErr" }

$browser = Get-Command msedge.exe, chrome.exe, brave.exe -ErrorAction SilentlyContinue | Select-Object -First 1
if ($browser) { Start-Process -FilePath $browser.Source -ArgumentList @('--new-window', $url) } else { Start-Process $url }
Write-Host "App is running at $url"
Write-Host 'Backend API: http://127.0.0.1:5000'
Write-Host "Logs: $logs"
