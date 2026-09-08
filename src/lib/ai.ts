import { z } from "zod";
import type { ContentVariant, GenerationRequest } from "./types";

const variantSchema = z.object({
  id: z.string(), productId: z.string(), angle: z.string().min(2).max(120),
  hook: z.string().min(3).max(180), script: z.string().min(20).max(2500),
  cta: z.string().min(2).max(180), caption: z.string().max(2200),
  hashtags: z.array(z.string().min(1).max(60)).max(15), duration: z.number().int().min(10).max(60),
});
const outputSchema = z.array(variantSchema);
const OLLAMA_URL = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen3:8b";
const angles: Record<GenerationRequest["tone"], string> = {
  viral: "hook mạnh, nhanh, tò mò nhưng tuyệt đối không giật tít sai sự thật",
  review: "review cân bằng, nêu điểm phù hợp và giới hạn có trong dữ liệu",
  educational: "giải thích vấn đề và giá trị sản phẩm rõ ràng, dễ hiểu",
  story: "kể tình huống đời thường rồi dẫn tới vấn đề, giải pháp và CTA",
};
function extractJson(text: string) {
  const cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "").trim();
  const start = cleaned.indexOf("["); const end = cleaned.lastIndexOf("]");
  if (start < 0 || end < start) throw new Error("Ollama không trả về JSON hợp lệ");
  return JSON.parse(cleaned.slice(start, end + 1)) as unknown;
}
export async function checkOllama() {
  try { const response = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(2500) }); return response.ok; } catch { return false; }
}
export async function listOllamaModels() {
  const response = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error(`Không thể kết nối Ollama (${response.status})`);
  const data = await response.json() as { models?: Array<{ name?: string }> };
  return (data.models || []).map((m) => m.name).filter((n): n is string => Boolean(n));
}
export async function generateAffiliateContent(request: GenerationRequest): Promise<ContentVariant[]> {
  if (!(await checkOllama())) throw new Error("Ollama chưa chạy. Hãy mở Ollama hoặc chạy scripts/setup-local-ai.ps1.");
  const prompt = `Bạn là chuyên gia content affiliate TikTok Việt Nam. Tạo đúng ${request.variants} kịch bản khác nhau cho cùng một sản phẩm.\nGóc nội dung chính: ${angles[request.tone]}.\n\nQUY TẮC BẮT BUỘC:\n- Chỉ dùng thông tin xuất hiện trong dữ liệu sản phẩm; không bịa giá, thông số, chứng nhận, hiệu quả hoặc trải nghiệm cá nhân.\n- Không hứa hẹn thu nhập hoặc kết quả chắc chắn.\n- Hook phải tự nhiên và xuất hiện ngay đầu video.\n- Script là lời thoại tiếng Việt, dễ đọc thành giọng nói, 10-60 giây.\n- CTA trung lập.\n- Mỗi biến thể phải khác hook hoặc angle rõ rệt.\n- Trả về ONLY một JSON array, không markdown.\n\nSchema: [{"id":"uuid","productId":"${request.product.id}","angle":"...","hook":"...","script":"...","cta":"...","caption":"...","hashtags":["#..."],"duration":30}]\n\nDỮ LIỆU SẢN PHẨM:\n${JSON.stringify(request.product)}`;
  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST", headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(180000),
    body: JSON.stringify({ model: OLLAMA_MODEL, stream: false, format: "json", options: { temperature: 0.8 }, messages: [
      { role: "system", content: "Bạn chỉ trả về JSON hợp lệ." }, { role: "user", content: prompt },
    ] }),
  });
  const data = await response.json() as { message?: { content?: string }; error?: string };
  if (!response.ok) throw new Error(data.error || `Ollama lỗi HTTP ${response.status}`);
  if (!data.message?.content) throw new Error("Ollama không trả về nội dung");
  const parsed = outputSchema.safeParse(extractJson(data.message.content));
  if (!parsed.success) throw new Error(`Output Ollama không đúng schema: ${parsed.error.issues[0]?.message || "invalid"}`);
  return parsed.data;
}
