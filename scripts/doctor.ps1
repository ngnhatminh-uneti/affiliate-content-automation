$ErrorActionPreference="SilentlyContinue"
Write-Host "Affiliate Studio local diagnostics`n" -ForegroundColor Cyan

$ollama=Get-Command ollama
$python=Get-Command python
$py=Get-Command py

Write-Host ("Ollama executable : " + ($(if($ollama){$ollama.Source}else{"NOT FOUND"})))
Write-Host ("Python executable : " + ($(if($python){$python.Source}elseif($py){$py.Source}else{"NOT FOUND"})))

try {
  $tags=Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/tags" -TimeoutSec 3
  $models=@($tags.models | ForEach-Object {$_.name})
  Write-Host "Ollama service    : READY" -ForegroundColor Green
  Write-Host ("qwen3:8b model    : " + ($(if($models -contains "qwen3:8b"){"READY"}else{"NOT INSTALLED"})))
} catch { Write-Host "Ollama service    : OFFLINE" -ForegroundColor Yellow }

$dataDir=Join-Path $env:APPDATA "Affiliate Studio"
$model=Join-Path $dataDir "models\vi_VN-vais1000-medium.onnx"
Write-Host ("Piper model       : " + ($(if(Test-Path $model){"READY"}else{"NOT INSTALLED"})))
Write-Host ("Data directory    : $dataDir")
Write-Host "`nRun setup with: npm run setup:local"
Write-Host "Run app with    : npm run desktop:dev"
