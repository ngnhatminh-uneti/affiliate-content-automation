import { promises as fs } from "node:fs";
import path from "node:path";

const MODEL = "gemini-2.5-flash-preview-tts";
const API = "https://generativelanguage.googleapis.com/v1beta/interactions";

function pcmToWav(pcm: Buffer, sampleRate = 24000, channels = 1, bitsPerSample = 16) {
  const byteRate = sampleRate * channels * bitsPerSample / 8;
  const blockAlign = channels * bitsPerSample / 8;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

export async function generateSpeech(text: string, options?: { voice?: string; style?: string }) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not configured");
  const voice = options?.voice || "Kore";
  const style = options?.style || "natural, friendly, energetic Vietnamese TikTok creator; clear diction; medium-fast pace";

  const response = await fetch(API, {
    method: "POST",
    headers: {
      "x-goog-api-key": key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      input: `${style}. Read this Vietnamese script exactly as written:\n${text}`,
      response_format: { type: "audio" },
      generation_config: {
        speech_config: [{ voice, language: "vi" }],
      },
    }),
  });

  const data = await response.json() as any;
  if (!response.ok || data.error) {
    throw new Error(data.error?.message || "Gemini TTS generation failed");
  }

  const base64 = data.output_audio?.data ?? data.outputAudio?.data;
  if (!base64) throw new Error("Gemini TTS returned no audio data");

  const pcm = Buffer.from(base64, "base64");
  const wav = pcmToWav(pcm);
  const id = crypto.randomUUID();
  const dir = path.join(process.cwd(), "public", "generated", "audio");
  await fs.mkdir(dir, { recursive: true });
  const filename = `${id}.wav`;
  await fs.writeFile(path.join(dir, filename), wav);

  return {
    id,
    publicPath: `/generated/audio/${filename}`,
    durationSeconds: Math.max(1, pcm.length / (24000 * 2)),
  };
}
