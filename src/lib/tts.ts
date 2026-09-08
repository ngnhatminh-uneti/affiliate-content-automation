import { promises as fs } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import { getMediaDir, getModelsDir } from "./paths";

const MODEL_NAME = process.env.PIPER_MODEL_NAME || "vi_VN-vais1000-medium";
const MODEL_PATH = process.env.PIPER_MODEL_PATH || path.join(getModelsDir(), `${MODEL_NAME}.onnx`);

function commandCandidates() {
  if (process.platform === "win32") return [["piper"], ["py", "-m", "piper"], ["python", "-m", "piper"]];
  return [["piper"], ["python3", "-m", "piper"], ["python", "-m", "piper"]];
}

async function runPiper(text: string, outputFile: string, speed = 1) {
  let lastError = "Piper không khả dụng";
  for (const [command, ...prefix] of commandCandidates()) {
    const args = [...prefix, "--model", MODEL_PATH, "--output_file", outputFile, "--length_scale", String(1 / Math.max(0.7, Math.min(1.4, speed)))];
    const result = await new Promise<{ ok: boolean; error?: string }>((resolve) => {
      const child = spawn(command, args, { stdio: ["pipe", "ignore", "pipe"], windowsHide: true });
      let stderr = "";
      child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
      child.on("error", (error: NodeJS.ErrnoException) => resolve({ ok: false, error: error.message }));
      child.on("close", (code) => resolve({ ok: code === 0, error: stderr.trim() }));
      child.stdin.write(text);
      child.stdin.end();
    });
    if (result.ok) return;
    lastError = result.error || lastError;
  }
  throw new Error(`${lastError}. Hãy chạy scripts/setup-local-ai.ps1 để cài local TTS.`);
}

async function wavDuration(file: string) {
  const data = await fs.readFile(file);
  if (data.length < 44) return 1;
  const byteRate = data.readUInt32LE(28) || 32000;
  return Math.max(1, (data.length - 44) / byteRate);
}

export async function checkPiper() {
  try { await fs.access(MODEL_PATH); } catch { return false; }
  return new Promise<boolean>((resolve) => {
    const [command, ...prefix] = commandCandidates()[0];
    const child = spawn(command, [...prefix, "--help"], { stdio: "ignore", windowsHide: true });
    child.on("error", () => resolve(false));
    child.on("close", () => resolve(true));
  });
}

export async function generateSpeech(text: string, options?: { voice?: string; style?: string; speed?: number }) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) throw new Error("TTS nhận văn bản rỗng");
  try { await fs.access(MODEL_PATH); } catch { throw new Error(`Chưa có voice model ${MODEL_NAME}. Hãy chạy scripts/setup-local-ai.ps1.`); }
  const id = crypto.randomUUID();
  const dir = getMediaDir("audio");
  await fs.mkdir(dir, { recursive: true });
  const filename = `${id}.wav`;
  const outputFile = path.join(dir, filename);
  await runPiper(clean, outputFile, 1);
  const durationSeconds = await wavDuration(outputFile);
  return { id, publicPath: `/api/media/audio/${filename}`, durationSeconds, model: MODEL_NAME, local: true };
}
