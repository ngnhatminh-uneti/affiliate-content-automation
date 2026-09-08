import { NextResponse } from "next/server";
import path from "node:path";
import { promises as fs } from "node:fs";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { z } from "zod";
import { createJob, saveJob } from "@/lib/jobs";
import { buildSubtitles, estimateSpeechDuration } from "@/lib/subtitles";
import { generateSpeech } from "@/lib/tts";
import type { ContentVariant, Product } from "@/lib/types";
import { recordEvent } from "@/lib/analytics";

export const runtime = "nodejs";
export const maxDuration = 300;

const schema = z.object({
  product: z.object({
    id: z.string(), name: z.string(), description: z.string(), url: z.string().optional(), imageUrl: z.string().optional(),
  }),
  content: z.object({
    id: z.string(), productId: z.string(), angle: z.string(), hook: z.string(), script: z.string(), cta: z.string(), caption: z.string(), hashtags: z.array(z.string()), duration: z.number().int().min(10).max(60),
  }),
  voice: z.object({ enabled: z.boolean(), name: z.string().min(2).max(40), style: z.string().max(300).optional() }).optional(),
});

export async function POST(request: Request) {
  let job: Awaited<ReturnType<typeof createJob>> | null = null;
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Dữ liệu render không hợp lệ", details: parsed.error.flatten() }, { status: 400 });

    const product = parsed.data.product as Product;
    const content = parsed.data.content as ContentVariant;
    job = createJob({ productName: product.name, contentId: content.id });
    await saveJob(job);

    const publicDir = path.join(process.cwd(), "public", "generated");
    await fs.mkdir(publicDir, { recursive: true });
    const outputLocation = path.join(publicDir, `${job.id}.mp4`);
    const entryPoint = path.join(process.cwd(), "src", "remotion", "index.ts");

    await saveJob({ ...job, status: "rendering", updatedAt: new Date().toISOString() });
    let duration = Math.min(60, Math.max(10, content.duration));
    let audioUrl: string | undefined;

    if (parsed.data.voice?.enabled) {
      const estimated = estimateSpeechDuration(content.script);
      const audio = await generateSpeech(content.script, { voice: parsed.data.voice.name, style: parsed.data.voice.style });
      audioUrl = audio.publicPath;
      duration = Math.min(60, Math.max(duration, Math.ceil(Math.max(estimated, audio.durationSeconds) + 0.6)));
    }

    const subtitles = buildSubtitles(content.script, duration);
    const inputProps = { productName: product.name, hook: content.hook, script: content.script, cta: content.cta, imageUrl: product.imageUrl, audioUrl, subtitles };

    const serveUrl = await bundle({ entryPoint, webpackOverride: (config) => config });
    const composition = await selectComposition({ serveUrl, id: "AffiliateVideo", inputProps });
    const timedComposition = { ...composition, durationInFrames: duration * composition.fps };

    await renderMedia({
      composition: timedComposition,
      serveUrl,
      codec: "h264",
      outputLocation,
      inputProps,
      chromiumOptions: { disableWebSecurity: true },
    });

    const completed = { ...job, status: "completed" as const, updatedAt: new Date().toISOString(), outputPath: `/generated/${job.id}.mp4` };
    await saveJob(completed);
    await recordEvent({ type: "render_completed", jobId: job.id, productName: product.name });
    return NextResponse.json({ job: completed, videoUrl: completed.outputPath, audioUrl, duration });
  } catch (error) {
    if (job) await saveJob({ ...job, status: "failed", updatedAt: new Date().toISOString(), error: error instanceof Error ? error.message : "Render thất bại" });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không thể render video" }, { status: 500 });
  }
}
