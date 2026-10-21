$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$runtimeRoot = Join-Path $env:LOCALAPPDATA 'DigitalAcademicDocumentWorkflowSystem\app'
$node = (Get-Command node.exe -ErrorAction Stop).Source
$port = Get-Random -Minimum 20000 -Maximum 60000
while (Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue) {
    $port = Get-Random -Minimum 20000 -Maximum 60000
}
$testData = Join-Path $env:TEMP ('DADWS-Functional-' + [guid]::NewGuid().ToString('N'))
$logs = Join-Path $env:TEMP ('DADWS-Logs-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Force -Path $logs | Out-Null
$serverProcess = $null
$mongoProcess = $null
$environmentNames = @('PORT','APP_DATA_DIR','CLIENT_URL','NODE_ENV','APP_RUNTIME_ROOT','TEST_API_URL','TEST_MONGO_URI','SMTP_HOST','SMTP_USER','SMTP_PASS')
$savedEnvironment = @{}
foreach ($name in $environmentNames) {
    $item = Get-Item -Path "Env:$name" -ErrorAction SilentlyContinue
    $savedEnvironment[$name] = if ($item) { $item.Value } else { $null }
}

try {
    $env:PORT = "$port"
    $env:APP_DATA_DIR = $testData
    $env:CLIENT_URL = 'http://127.0.0.1:5174'
    $env:NODE_ENV = 'development'
    # These empty values override any secrets in the runtime .env so smoke tests never send email.
    $env:SMTP_HOST = ''
    $env:SMTP_USER = ''
    $env:SMTP_PASS = ''
    $serverProcess = Start-Process -FilePath $node -ArgumentList 'server.js' `
        -WorkingDirectory (Join-Path $runtimeRoot 'server') -PassThru -WindowStyle Hidden `
        -RedirectStandardOutput (Join-Path $logs 'server.out.log') `
        -RedirectStandardError (Join-Path $logs 'server.err.log')

    $ready = $false
    for ($i = 0; $i -lt 45; $i++) {
        try {
            $health = Invoke-RestMethod "http://127.0.0.1:$port/api/health" -TimeoutSec 2
            if ($health.status -eq 'ready') { $ready = $true; break }
        } catch {}
        Start-Sleep -Seconds 1
    }
    if (!$ready) {
        Get-Content (Join-Path $logs 'server.out.log') -ErrorAction SilentlyContinue
        Get-Content (Join-Path $logs 'server.err.log') -ErrorAction SilentlyContinue
        throw 'Isolated functional-test server did not become ready.'
    }

    $mongoProcess = Get-CimInstance Win32_Process |
        Where-Object { $_.Name -like 'mongod*.exe' -and $_.ParentProcessId -eq $serverProcess.Id } |
        Select-Object -First 1
    if (!$mongoProcess) {
        throw 'Could not find the isolated MongoDB port needed for test cleanup.'
    }
    if ($mongoProcess.CommandLine -notmatch '--port\s+(\d+)') { throw 'Could not parse the isolated MongoDB port.' }
    $mongoPort = $Matches[1]

    $env:APP_RUNTIME_ROOT = $runtimeRoot
    $env:TEST_API_URL = "http://127.0.0.1:$port/api"
    $env:TEST_MONGO_URI = "mongodb://127.0.0.1:$mongoPort/test"
    & $node (Join-Path $PSScriptRoot 'functional-smoke.js')
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Test server logs: $logs" -ForegroundColor Yellow
        Get-Content (Join-Path $logs 'server.out.log') -Tail 80 -ErrorAction SilentlyContinue
        Get-Content (Join-Path $logs 'server.err.log') -Tail 80 -ErrorAction SilentlyContinue
        throw "Functional smoke tests failed (exit $LASTEXITCODE)."
    }
    & $node (Join-Path $PSScriptRoot 'email-timeout-smoke.js')
    if ($LASTEXITCODE -ne 0) { throw "SMTP timeout smoke test failed (exit $LASTEXITCODE)." }
}
finally {
    if ($mongoProcess) { Stop-Process -Id $mongoProcess.ProcessId -Force -ErrorAction SilentlyContinue }
    if ($serverProcess) { Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue }
    Start-Sleep -Milliseconds 500

    $fullTestData = [IO.Path]::GetFullPath($testData)
    $tempRoot = [IO.Path]::GetFullPath($env:TEMP).TrimEnd('\') + '\'
    if ($fullTestData.StartsWith($tempRoot, [StringComparison]::OrdinalIgnoreCase) -and
        (Split-Path -Leaf $fullTestData).StartsWith('DADWS-Functional-', [StringComparison]::Ordinal)) {
        Remove-Item -LiteralPath $fullTestData -Recurse -Force -ErrorAction SilentlyContinue
    }
    foreach ($name in $environmentNames) {
        if ($null -eq $savedEnvironment[$name]) { Remove-Item -Path "Env:$name" -ErrorAction SilentlyContinue }
        else { Set-Item -Path "Env:$name" -Value $savedEnvironment[$name] }
    }
}
