import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import type { ContentVariant, GenerationRequest } from "./types";

const variantSchema = z.object({
  id:z.string(), productId:z.string(), angle:z.string().min(2), hook:z.string().min(3).max(180), script:z.string().min(20).max(2500), cta:z.string().min(2).max(180), caption:z.string().max(2200), hashtags:z.array(z.string().min(1).max(60)).max(15), duration:z.number().int().min(10).max(60),
});

export async function generateAffiliateContent(request:GenerationRequest):Promise<ContentVariant[]> {
  const key=process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not configured");
  const ai=new GoogleGenAI({apiKey:key});
  const angles={viral:"hook mạnh, nhanh, tò mò nhưng không giật tít sai sự thật",review:"review cân bằng, nêu cả điểm phù hợp và giới hạn nếu có",educational:"giải thích vấn đề và giá trị sản phẩm dễ hiểu",story:"kể một tình huống đời thường → vấn đề → giải pháp → CTA"};
  const prompt=`Bạn là content strategist cho affiliate TikTok Việt Nam. Tạo đúng ${request.variants} kịch bản khác nhau cho cùng một sản phẩm. Tone/angle chính: ${angles[request.tone]}.\n\nQUY TẮC:\n- Chỉ dùng thông tin có trong dữ liệu sản phẩm; không bịa thông số, giá, chứng nhận, hiệu quả hoặc trải nghiệm cá nhân.\n- Không hứa hẹn thu nhập hay kết quả chắc chắn.\n- Hook trong 1-2 câu đầu, lời thoại tự nhiên như người Việt nói.\n- Script phù hợp video 10-60 giây.\n- CTA trung lập, khuyến khích người xem tự xem chi tiết.\n- Hashtag ngắn, liên quan trực tiếp.\n- Trả về ONLY một JSON array, không markdown.\n\nSẢN PHẨM:\n${JSON.stringify(request.product)}`;
  const result=await ai.models.generateContent({model:"gemini-2.5-flash",contents:prompt});
  const raw=result.text?.replace(/^```(?:json)?\s*/i,"").replace(/```$/i,"").trim()||"[]";
  let parsed:unknown;
  try { parsed=JSON.parse(raw); } catch { throw new Error("Gemini returned invalid JSON"); }
  const list=z.array(variantSchema).safeParse(parsed);
  if (!list.success) throw new Error(`Gemini output validation failed: ${list.error.issues[0]?.message || "invalid schema"}`);
  return list.data as ContentVariant[];
}
