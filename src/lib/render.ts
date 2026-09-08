import path from "node:path";
import { promises as fs } from "node:fs";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { createJob, saveJob } from "@/lib/jobs";
import { buildSubtitles, estimateSpeechDuration } from "@/lib/subtitles";
import { generateSpeech } from "@/lib/tts";
import { getMediaDir } from "@/lib/paths";
import type { ContentVariant, Product } from "@/lib/types";

let bundlePromise: Promise<string> | null = null;

async function getBundle() {
  if (!bundlePromise) {
    bundlePromise = bundle({
      entryPoint: path.join(process.cwd(), "src", "remotion", "index.tsx"),
    });
  }
  return bundlePromise;
}

function baseUrl() {
  return process.env.APP_ORIGIN || `http://127.0.0.1:${process.env.PORT || 3210}`;
}

export async function renderAffiliateVideo(
  product: Product,
  content: ContentVariant,
  voice?: { enabled: boolean; name: string; style?: string },
) {
  const job = createJob({ productName: product.name, contentId: content.id });
  await saveJob({ ...job, status: "rendering", updatedAt: new Date().toISOString() });
  const outputDir = getMediaDir("video");
  await fs.mkdir(outputDir, { recursive: true });
  const filename = `${job.id}.mp4`;
  const outputLocation = path.join(outputDir, filename);

  try {
    let duration = Math.min(60, Math.max(10, content.duration));
    let audioUrl: string | undefined;

    if (voice?.enabled) {
      const audio = await generateSpeech(content.script, {
        voice: voice.name,
        style: voice.style,
      });
      audioUrl = `${baseUrl()}${audio.publicPath}`;
      duration = Math.min(
        60,
        Math.max(
          duration,
          Math.ceil(Math.max(estimateSpeechDuration(content.script), audio.durationSeconds) + 0.6),
        ),
      );
    }

    const subtitles = buildSubtitles(content.script, duration);
    const inputProps = {
      productName: product.name,
      hook: content.hook,
      script: content.script,
      cta: content.cta,
      imageUrl: product.imageUrl,
      audioUrl,
      subtitles,
    };

    const serveUrl = await getBundle();
    const composition = await selectComposition({
      serveUrl,
      id: "AffiliateVideo",
      inputProps,
    });

    await renderMedia({
      composition: {
        ...composition,
        durationInFrames: duration * composition.fps,
      },
      serveUrl,
      codec: "h264",
      outputLocation,
      inputProps,
      chromiumOptions: { disableWebSecurity: true },
    });

    const completed = {
      ...job,
      status: "completed" as const,
      updatedAt: new Date().toISOString(),
      outputPath: `/api/media/video/${filename}`,
    };
    await saveJob(completed);
    return { job: completed, videoUrl: completed.outputPath, audioUrl, duration };
  } catch (error) {
    const failed = {
      ...job,
      status: "failed" as const,
      updatedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Render failed",
    };
    await saveJob(failed);
    throw error;
  }
}
