#!/usr/bin/env bash
set -euo pipefail

OLLAMA_MODEL="${OLLAMA_MODEL:-qwen3:8b}"
MODEL_NAME="vi_VN-vais1000-medium"
DATA_DIR="${APP_DATA_DIR:-$HOME/.config/affiliate-studio}"
MODEL_DIR="$DATA_DIR/models"
BASE="https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/vi/vi_VN/vais1000/medium"

command -v curl >/dev/null || { echo "curl is required"; exit 1; }
command -v ollama >/dev/null || { echo "Install Ollama from https://ollama.com/download before running this script."; exit 1; }

if ! curl -fsS http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then
  echo "Starting Ollama..."
  (ollama serve >/tmp/affiliate-studio-ollama.log 2>&1 &)
  sleep 3
fi

echo "Pulling $OLLAMA_MODEL..."
ollama pull "$OLLAMA_MODEL"

python3 -m pip install --upgrade "piper-tts==1.8.0"
mkdir -p "$MODEL_DIR"

[ -f "$MODEL_DIR/$MODEL_NAME.onnx" ] || curl -L "$BASE/$MODEL_NAME.onnx?download=true" -o "$MODEL_DIR/$MODEL_NAME.onnx"
[ -f "$MODEL_DIR/$MODEL_NAME.onnx.json" ] || curl -L "$BASE/$MODEL_NAME.onnx.json?download=true" -o "$MODEL_DIR/$MODEL_NAME.onnx.json"

echo
printf 'Local AI setup completed.\n'
printf 'Ollama: %s\n' "$OLLAMA_MODEL"
printf 'Piper: %s\n' "$MODEL_NAME"
printf 'Data: %s\n' "$DATA_DIR"
printf '\nRun: npm run desktop:dev\n'
