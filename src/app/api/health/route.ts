import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok:true, service:"affiliate-content-automation", timestamp:new Date().toISOString(), integrations:{ gemini:Boolean(process.env.GEMINI_API_KEY), tiktok:Boolean(process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET) } });
}
