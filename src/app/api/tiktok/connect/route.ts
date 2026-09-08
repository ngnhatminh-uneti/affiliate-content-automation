import { NextResponse } from "next/server";
import { getTikTokAuthorizeUrl } from "@/lib/tiktok";

export const runtime = "nodejs";

export async function GET() {
  const state = crypto.randomUUID();
  const url = getTikTokAuthorizeUrl(state);
  const response = NextResponse.redirect(url);
  response.cookies.set("tiktok_oauth_state", state, { httpOnly:true, secure:true, sameSite:"lax", maxAge:600, path:"/" });
  return response;
}
