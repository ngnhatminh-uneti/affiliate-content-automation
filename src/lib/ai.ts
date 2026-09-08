import { GoogleGenAI } from "@google/genai";
import type { ContentVariant, GenerationRequest } from "./types";

export async function generateAffiliateContent(request: GenerationRequest): Promise<ContentVariant[]> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not configured");
  const ai = new GoogleGenAI({ apiKey: key });
  const prompt = `Create ${request.variants} Vietnamese short-form affiliate video scripts for this product. Return ONLY valid JSON array. Each item: {id,productId,angle,hook,script,cta,caption,hashtags,duration}. Tone: ${request.tone}. Product: ${JSON.stringify(request.product)}. Avoid unsupported claims; be persuasive but honest.`;
  const result = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
  const text = result.text?.replace(/^```json\s*/i, "").replace(/```$/i, "").trim() ?? "[]";
  return JSON.parse(text) as ContentVariant[];
}
