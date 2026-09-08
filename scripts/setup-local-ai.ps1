$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

Write-Host "`nAffiliate Studio - Local AI setup`n" -ForegroundColor Cyan

function Test-Command($Name) { return [bool](Get-Command $Name -ErrorAction SilentlyContinue) }

# All local AI assets are kept on D:\ollama unless explicitly overridden.
$aiRoot = if ($env:AFFILIATE_AI_DIR) { $env:AFFILIATE_AI_DIR } else { "D:\ollama" }
$env:OLLAMA_MODELS = $aiRoot
[Environment]::SetEnvironmentVariable("OLLAMA_MODELS", $aiRoot, "User")
New-Item -ItemType Directory -Force -Path $aiRoot | Out-Null

Write-Host "Local AI directory: $aiRoot" -ForegroundColor DarkCyan

if (-not (Test-Command "ollama")) {
  if (Test-Command "winget") {
    Write-Host "Installing Ollama..." -ForegroundColor Yellow
    winget install --id Ollama.Ollama -e --accept-package-agreements --accept-source-agreements
  } else {
    throw "Ollama is not installed and winget is unavailable. Install Ollama first, then run this script again."
  }
}

if (-not (Test-Command "ollama")) {
  $possible = @("$env:LOCALAPPDATA\Programs\Ollama\ollama.exe", "$env:ProgramFiles\Ollama\ollama.exe")
  foreach ($candidate in $possible) {
    if (Test-Path $candidate) {
      $env:Path = "$(Split-Path $candidate);$env:Path"
      break
    }
  }
}
if (-not (Test-Command "ollama")) {
  throw "Ollama was installed but is not available in PATH yet. Restart PowerShell and run this script again."
}

try {
  Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/tags" -TimeoutSec 3 | Out-Null
}
catch {
  Write-Host "Starting Ollama service..." -ForegroundColor Yellow
  Start-Process -FilePath "ollama" -ArgumentList "serve" -WindowStyle Hidden
  Start-Sleep -Seconds 3
}

# Do not download the model again when it already exists in the configured Ollama store.
$modelName = "qwen3:8b"
$installed = $false
try {
  $tags = Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/tags" -TimeoutSec 5
  $installed = @($tags.models | Where-Object { $_.name -eq $modelName }).Count -gt 0
}
catch {
  $installed = $false
}

if ($installed) {
  Write-Host "Ollama model $modelName already exists. Skipping download." -ForegroundColor Green
} else {
  Write-Host "Pulling local language model $modelName..." -ForegroundColor Yellow
  ollama pull $modelName
}

if (-not (Test-Command "python")) {
  if (Test-Command "winget") {
    Write-Host "Installing Python 3.12..." -ForegroundColor Yellow
    winget install --id Python.Python.3.12 -e --accept-package-agreements --accept-source-agreements
  } else {
    throw "Python is required for local Piper TTS. Install Python 3.12 and rerun this script."
  }
}

$python = if (Test-Command "py") { "py" } else { "python" }
Write-Host "Installing Piper TTS..." -ForegroundColor Yellow
& $python -m pip install --upgrade "piper-tts==1.8.0"

# Keep the Piper voice/model beside the Ollama models so all local AI assets stay on the same drive.
$piperModelName = "vi_VN-vais1000-medium"
$modelDir = Join-Path $aiRoot "piper"
New-Item -ItemType Directory -Force -Path $modelDir | Out-Null
$piperModelPath = Join-Path $modelDir "$piperModelName.onnx"
$piperConfigPath = Join-Path $modelDir "$piperModelName.onnx.json"
$piperModelBase = "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/vi/vi_VN/vais1000/medium"

# Persist the Piper model location so Electron/Next uses the same D:\ollama location.
$env:PIPER_MODEL_NAME = $piperModelName
$env:PIPER_MODEL_PATH = $piperModelPath
[Environment]::SetEnvironmentVariable("PIPER_MODEL_NAME", $piperModelName, "User")
[Environment]::SetEnvironmentVariable("PIPER_MODEL_PATH", $piperModelPath, "User")

if (-not (Test-Path $piperModelPath)) {
  Write-Host "Downloading Vietnamese Piper voice..." -ForegroundColor Yellow
  Invoke-WebRequest -Uri "$piperModelBase/$piperModelName.onnx?download=true" -OutFile $piperModelPath
} else {
  Write-Host "Vietnamese Piper voice already exists. Skipping model download." -ForegroundColor Green
}

if (-not (Test-Path $piperConfigPath)) {
  Invoke-WebRequest -Uri "$piperModelBase/$piperModelName.onnx.json?download=true" -OutFile $piperConfigPath
} else {
  Write-Host "Vietnamese Piper voice config already exists. Skipping download." -ForegroundColor Green
}

Write-Host "`nLocal AI setup completed." -ForegroundColor Green
Write-Host "Ollama model: $modelName"
Write-Host "Piper voice: $piperModelName"
Write-Host "AI data: $aiRoot"
Write-Host "Piper model: $piperModelPath"
Write-Host "`nYou can now run: npm run desktop:dev`n" -ForegroundColor Cyan
