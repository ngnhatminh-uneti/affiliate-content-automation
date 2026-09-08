$ErrorActionPreference="Stop"
Set-Location (Join-Path $PSScriptRoot "..")

if(-not (Test-Path "node_modules")){npm install}

try { Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/tags" -TimeoutSec 2 | Out-Null }
catch {
  Write-Host "Ollama is not running. Starting local setup..." -ForegroundColor Yellow
  & powershell -ExecutionPolicy Bypass -File "scripts/setup-local-ai.ps1"
}

npm run desktop:dev
