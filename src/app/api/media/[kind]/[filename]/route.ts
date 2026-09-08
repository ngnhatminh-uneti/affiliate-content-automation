import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { getMediaDir } from "@/lib/paths";

const types: Record<string, string> = { mp4: "video/mp4", wav: "audio/wav" };

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ kind: string; filename: string }> }) {
  const { kind, filename } = await context.params;
  if (kind !== "video" && kind !== "audio") return NextResponse.json({ error: "Media kind không hợp lệ" }, { status: 400 });
  if (!/^[A-Za-z0-9._-]+$/.test(filename)) return NextResponse.json({ error: "Tên file không hợp lệ" }, { status: 400 });
  const extension = path.extname(filename).slice(1).toLowerCase();
  const contentType = types[extension];
  if (!contentType) return NextResponse.json({ error: "Định dạng media không được hỗ trợ" }, { status: 415 });

  const root = path.resolve(getMediaDir(kind));
  const file = path.resolve(root, filename);
  if (!file.startsWith(`${root}${path.sep}`)) return NextResponse.json({ error: "Đường dẫn không hợp lệ" }, { status: 400 });
  try {
    const data = await fs.readFile(file);
    return new NextResponse(data, { headers: { "Content-Type": contentType, "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Không tìm thấy media" }, { status: 404 });
  }
}
