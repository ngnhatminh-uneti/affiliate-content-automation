import { NextResponse } from "next/server";
import path from "node:path";
import { getJob } from "@/lib/jobs";
import { publishVideo } from "@/lib/tiktok";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 300;

const schema = z.object({ jobId:z.string().uuid(), caption:z.string().max(2200), privacyLevel:z.string().default("SELF_ONLY"), confirm:z.literal(true) });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error:"Bạn phải xác nhận việc gửi video lên TikTok và cung cấp job hợp lệ." }, { status:400 });
  const job = await getJob(parsed.data.jobId);
  if (!job?.outputPath || job.status !== "completed") return NextResponse.json({ error:"Video chưa render xong." }, { status:409 });
  try {
    const localPath = path.join(process.cwd(), "public", job.outputPath.replace(/^\//, ""));
    const result = await publishVideo(localPath, parsed.data.caption, parsed.data.privacyLevel);
    return NextResponse.json({ ok:true, ...result });
  } catch (error) {
    return NextResponse.json({ error:error instanceof Error ? error.message : "TikTok publish thất bại" }, { status:500 });
  }
}
