import { NextResponse } from "next/server";
import { getCreatorInfo } from "@/lib/tiktok";

export const runtime = "nodejs";

export async function GET() {
  try { return NextResponse.json({ connected:true, creator:await getCreatorInfo() }); }
  catch (error) { return NextResponse.json({ connected:false, error:error instanceof Error ? error.message : "TikTok chưa kết nối" }, { status:401 }); }
}
