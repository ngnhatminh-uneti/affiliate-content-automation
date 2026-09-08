$ErrorActionPreference="SilentlyContinue"
Set-StrictMode -Version Latest

Write-Host "Affiliate Studio local diagnostics`n" -ForegroundColor Cyan

$defaultDataDir = if ($env:APP_DATA_DIR) { $env:APP_DATA_DIR } else { "D:\ollama" }
$ollamaModelsDir = if ($env:OLLAMA_MODELS) { $env:OLLAMA_MODELS } else { $defaultDataDir }
$piperDir = if ($env:PIPER_DATA_DIR) { $env:PIPER_DATA_DIR } else { Join-Path $defaultDataDir "piper" }
$piperModelName = if ($env:PIPER_MODEL_NAME) { $env:PIPER_MODEL_NAME } else { "vi_VN-vais1000-medium" }
$piperModel = if ($env:PIPER_MODEL_PATH) { $env:PIPER_MODEL_PATH } else { Join-Path $piperDir "$piperModelName.onnx" }

$ollama=Get-Command ollama
$python=Get-Command python
$py=Get-Command py

Write-Host ("Ollama executable : " + ($(if($ollama){$ollama.Source}else{"NOT FOUND"})))
Write-Host ("Python executable : " + ($(if($python){$python.Source}elseif($py){$py.Source}else{"NOT FOUND"})))

Write-Host ("Ollama models dir : $ollamaModelsDir")
Write-Host ("Piper model path  : $piperModel")

try {
  $tags=Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/tags" -TimeoutSec 3
  $models=@($tags.models | ForEach-Object {$_.name})
  Write-Host "Ollama service    : READY" -ForegroundColor Green
  Write-Host ("qwen3:8b model    : " + ($(if($models -contains "qwen3:8b"){"READY"}else{"NOT INSTALLED"})))
} catch { Write-Host "Ollama service    : OFFLINE" -ForegroundColor Yellow }

Write-Host ("Piper model       : " + ($(if(Test-Path $piperModel){"READY"}else{"NOT INSTALLED"})))
Write-Host ("AI data directory : $defaultDataDir")
Write-Host "`nRun setup with: npm run setup:local"
Write-Host "Run app with    : npm run desktop:dev"
