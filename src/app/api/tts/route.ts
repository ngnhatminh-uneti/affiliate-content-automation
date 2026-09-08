import { NextResponse } from "next/server";
import { z } from "zod";
import { generateSpeech } from "@/lib/tts";

export const runtime = "nodejs";
export const maxDuration = 180;

const schema = z.object({
  text: z.string().min(3).max(12000),
  voice: z.string().min(2).max(40).optional(),
  style: z.string().max(300).optional(),
});

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Dữ liệu TTS không hợp lệ" }, { status: 400 });
    const audio = await generateSpeech(parsed.data.text, parsed.data);
    return NextResponse.json({ audio });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "TTS thất bại" }, { status: 500 });
  }
}
