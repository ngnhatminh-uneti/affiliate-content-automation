import { NextResponse } from "next/server";
import { getPublishStatus } from "@/lib/tiktok";
import { recordEvent } from "@/lib/analytics";
import { z } from "zod";

export const runtime = "nodejs";
const schema = z.object({ publishId: z.string().min(1).max(64) });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "publishId không hợp lệ" }, { status: 400 });
  try {
    const status = await getPublishStatus(parsed.data.publishId);
    if (status.status === "PUBLISH_COMPLETE") await recordEvent({ type: "tiktok_publish_completed", metadata: { publishId: parsed.data.publishId } });
    if (status.status === "FAILED") await recordEvent({ type: "tiktok_publish_failed", metadata: { publishId: parsed.data.publishId, reason: String(status.fail_reason || "unknown") } });
    return NextResponse.json({ status });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không thể đọc trạng thái" }, { status: 500 });
  }
}
