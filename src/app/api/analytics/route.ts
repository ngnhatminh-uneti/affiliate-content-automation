import { NextResponse } from "next/server";
import { getAnalytics, recordEvent } from "@/lib/analytics";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(await getAnalytics());
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await recordEvent(body);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Không thể ghi analytics" }, { status: 400 });
  }
}
