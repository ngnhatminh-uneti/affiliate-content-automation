import { NextResponse } from "next/server";
import { getPublishStatus } from "@/lib/tiktok";
import { z } from "zod";

export const runtime = "nodejs";

const schema = z.object({ publishId:z.string().min(1) });

export async function POST(request:Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error:"publishId không hợp lệ" }, { status:400 });
  try { return NextResponse.json(await getPublishStatus(parsed.data.publishId)); }
  catch (error) { return NextResponse.json({ error:error instanceof Error ? error.message : "Không thể đọc trạng thái" }, { status:500 }); }
}
