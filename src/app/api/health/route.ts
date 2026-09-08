import { NextResponse } from "next/server";
import { checkOllama } from "@/lib/ai";
import { checkPiper } from "@/lib/tts";

export const runtime="nodejs";

export async function GET(){
  const [ollama,piper]=await Promise.all([checkOllama(),checkPiper()]);
  return NextResponse.json({
    ok:ollama&&piper,
    service:"affiliate-content-automation-desktop",
    localAi:{
      ollama:{running:ollama,baseUrl:process.env.OLLAMA_BASE_URL||"http://127.0.0.1:11434",model:process.env.OLLAMA_MODEL||"qwen3:8b"},
      tts:{ready:piper,provider:"piper",model:process.env.PIPER_MODEL_NAME||"vi_VN-vais1000-medium"}
    },
    integrations:{tiktok:Boolean(process.env.TIKTOK_CLIENT_KEY&&process.env.TIKTOK_CLIENT_SECRET)},
    timestamp:new Date().toISOString()
  });
}
