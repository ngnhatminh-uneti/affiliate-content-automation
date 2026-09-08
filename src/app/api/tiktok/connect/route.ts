import { NextRequest, NextResponse } from "next/server";
import { getTikTokAuthorizeUrl } from "@/lib/tiktok";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const state = crypto.randomUUID();
    const target = getTikTokAuthorizeUrl(state);
    const requestUrl = new URL(request.url);
    const response = NextResponse.redirect(target);
    response.cookies.set("tiktok_oauth_state", state, { httpOnly:true, secure:requestUrl.protocol === "https:", sameSite:"lax", maxAge:600, path:"/" });
    return response;
  } catch (error) {
    return NextResponse.json({ error:error instanceof Error ? error.message : "TikTok OAuth chưa sẵn sàng" }, { status:500 });
  }
}
