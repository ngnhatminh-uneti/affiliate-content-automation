$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

Write-Host "`nAffiliate Studio - Local AI setup`n" -ForegroundColor Cyan

function Test-Command($Name) { return [bool](Get-Command $Name -ErrorAction SilentlyContinue) }

if (-not (Test-Command "ollama")) {
  if (Test-Command "winget") {
    Write-Host "Installing Ollama..." -ForegroundColor Yellow
    winget install --id Ollama.Ollama -e --accept-package-agreements --accept-source-agreements
  } else {
    throw "Ollama is not installed and winget is unavailable. Install Ollama from https://ollama.com/download/windows then run this script again."
  }
}

if (-not (Test-Command "ollama")) {
  $possible = @("$env:LOCALAPPDATA\Programs\Ollama\ollama.exe", "$env:ProgramFiles\Ollama\ollama.exe")
  foreach ($candidate in $possible) { if (Test-Path $candidate) { $env:Path = "$(Split-Path $candidate);$env:Path"; break } }
}
if (-not (Test-Command "ollama")) { throw "Ollama was installed but is not available in PATH yet. Restart PowerShell and run this script again." }

try { Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/tags" -TimeoutSec 3 | Out-Null }
catch {
  Write-Host "Starting Ollama service..." -ForegroundColor Yellow
  Start-Process -FilePath "ollama" -ArgumentList "serve" -WindowStyle Hidden
  Start-Sleep -Seconds 3
}

Write-Host "Pulling local language model qwen3:8b..." -ForegroundColor Yellow
ollama pull qwen3:8b

if (-not (Test-Command "python")) {
  if (Test-Command "winget") {
    Write-Host "Installing Python 3.12..." -ForegroundColor Yellow
    winget install --id Python.Python.3.12 -e --accept-package-agreements --accept-source-agreements
  } else { throw "Python is required for local Piper TTS. Install Python 3.12 and rerun this script." }
}

$python = if (Test-Command "py") { "py" } else { "python" }
Write-Host "Installing Piper TTS..." -ForegroundColor Yellow
& $python -m pip install --upgrade "piper-tts==1.8.0"

$dataDir = Join-Path $env:APPDATA "Affiliate Studio"
$modelDir = Join-Path $dataDir "models"
New-Item -ItemType Directory -Force -Path $modelDir | Out-Null

$modelName = "vi_VN-vais1000-medium"
$modelPath = Join-Path $modelDir "$modelName.onnx"
$configPath = Join-Path $modelDir "$modelName.onnx.json"
$modelBase = "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/vi/vi_VN/vais1000/medium"

if (-not (Test-Path $modelPath)) {
  Write-Host "Downloading Vietnamese Piper voice..." -ForegroundColor Yellow
  Invoke-WebRequest -Uri "$modelBase/$modelName.onnx?download=true" -OutFile $modelPath
}
if (-not (Test-Path $configPath)) {
  Invoke-WebRequest -Uri "$modelBase/$modelName.onnx.json?download=true" -OutFile $configPath
}

Write-Host "`nLocal AI setup completed." -ForegroundColor Green
Write-Host "Ollama model: qwen3:8b"
Write-Host "Piper voice: $modelName"
Write-Host "Data: $dataDir"
Write-Host "`nYou can now run: npm run desktop:dev`n" -ForegroundColor Cyan
