$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

function Invoke-Step($Label, $ScriptBlock) {
    Write-Host "`n==> $Label" -ForegroundColor Cyan
    & $ScriptBlock
}

if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    throw 'Python is required and was not found on PATH.'
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    throw 'Node.js and npm are required and were not found on PATH.'
}

if (-not (Test-Path '.venv')) {
    Invoke-Step 'Creating virtual environment' { python -m venv .venv }
}

$pythonExe = Join-Path $PSScriptRoot '.venv\Scripts\python.exe'
$pipExe = Join-Path $PSScriptRoot '.venv\Scripts\pip.exe'

Invoke-Step 'Upgrading pip' { & $pythonExe -m pip install --upgrade pip }
Invoke-Step 'Installing Python dependencies' { & $pipExe install -r requirements.txt }

Push-Location (Join-Path $PSScriptRoot 'frontend')
try {
    Invoke-Step 'Installing frontend dependencies' { npm install }
    Invoke-Step 'Building frontend' { npm run build }
} finally {
    Pop-Location
}

$env:PYTHONPATH = $PSScriptRoot
$env:SE_EPHE_PATH = $PSScriptRoot

Invoke-Step 'Starting All Star Astrology on http://127.0.0.1:8892' {
    & $pythonExe -m uvicorn backend.main:app --host 0.0.0.0 --port 8892
}
