import { NextResponse } from "next/server";
import path from "node:path";
import { promises as fs } from "node:fs";
import { bundle } from "@remotion/bundler";
import { getCompositions, renderMedia, selectComposition } from "@remotion/renderer";
import { z } from "zod";
import { createJob, saveJob } from "@/lib/jobs";
import type { ContentVariant, Product } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const schema = z.object({
  product: z.object({
    id: z.string(), name: z.string(), description: z.string(),
    url: z.string().optional(), imageUrl: z.string().optional(),
  }),
  content: z.object({
    id: z.string(), productId: z.string(), angle: z.string(), hook: z.string(),
    script: z.string(), cta: z.string(), caption: z.string(), hashtags: z.array(z.string()), duration: z.number().int().min(10).max(60),
  }),
});

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Dữ liệu render không hợp lệ", details: parsed.error.flatten() }, { status: 400 });

    const product = parsed.data.product as Product;
    const content = parsed.data.content as ContentVariant;
    const job = createJob({ productName: product.name, contentId: content.id });
    await saveJob(job);

    const publicDir = path.join(process.cwd(), "public", "generated");
    await fs.mkdir(publicDir, { recursive: true });
    const outputLocation = path.join(publicDir, `${job.id}.mp4`);
    const entryPoint = path.join(process.cwd(), "src", "remotion", "index.ts");

    await saveJob({ ...job, status: "rendering", updatedAt: new Date().toISOString() });
    const serveUrl = await bundle({ entryPoint, webpackOverride: (config) => config });
    const composition = await selectComposition({ serveUrl, id: "AffiliateVideo", inputProps: {
      productName: product.name,
      hook: content.hook,
      script: content.script,
      cta: content.cta,
      imageUrl: product.imageUrl,
    }});

    const duration = Math.min(60, Math.max(10, content.duration));
    const inputProps = { productName: product.name, hook: content.hook, script: content.script, cta: content.cta, imageUrl: product.imageUrl };
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
    return NextResponse.json({ job: completed, videoUrl: completed.outputPath });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không thể render video" }, { status: 500 });
  }
}
