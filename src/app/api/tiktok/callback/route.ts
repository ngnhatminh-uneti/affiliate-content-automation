import { NextRequest, NextResponse } from "next/server";
import { exchangeTikTokCode } from "@/lib/tiktok";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const expected = request.cookies.get("tiktok_oauth_state")?.value;
  if (!code || !state || !expected || state !== expected) {
    return NextResponse.json({ error:"TikTok OAuth state không hợp lệ" }, { status:400 });
  }
  try {
    await exchangeTikTokCode(code);
    const response = NextResponse.redirect(new URL("/?tiktok=connected", request.url));
    response.cookies.delete("tiktok_oauth_state");
    return response;
  } catch (error) {
    return NextResponse.json({ error:error instanceof Error ? error.message : "TikTok OAuth thất bại" }, { status:500 });
  }
}
