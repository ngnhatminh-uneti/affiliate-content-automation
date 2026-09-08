import { NextResponse } from "next/server";
import { listLibrary, upsertLibrary } from "@/lib/library";
import type { ContentVariant, Product } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ items: await listLibrary() });
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { product: Product; contents: ContentVariant[] };
    if (!body.product?.id || !Array.isArray(body.contents)) return NextResponse.json({ error: "Dữ liệu library không hợp lệ" }, { status: 400 });
    return NextResponse.json({ item: await upsertLibrary(body.product, body.contents) });
  } catch {
    return NextResponse.json({ error: "Không thể lưu library" }, { status: 500 });
  }
}
