import { NextResponse } from "next/server";
import { z } from "zod";
import { generateAffiliateContent } from "@/lib/ai";
import { upsertLibrary } from "@/lib/library";
import { recordEvent } from "@/lib/analytics";

export const runtime = "nodejs";
export const maxDuration = 300;

const productSchema = z.object({
  id:z.string(), name:z.string().min(1), description:z.string().min(1), price:z.string().optional(), imageUrl:z.string().optional(), features:z.array(z.string()).default([]), createdAt:z.string(), url:z.string().optional(),
});
const schema = z.object({ products:z.array(productSchema).min(1).max(20), variants:z.number().int().min(1).max(5).default(3), tone:z.enum(["viral","review","educational","story"]).default("viral") });

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const results = [];
    for (const product of body.products) {
      const contents = await generateAffiliateContent({ product, variants: body.variants, tone: body.tone });
      await upsertLibrary(product, contents);
      results.push({ productId: product.id, productName: product.name, variants: contents });
      await recordEvent({ type: "content_generated", productName: product.name, metadata: { variants: contents.length, batch: true } });
    }
    return NextResponse.json({ results, count: results.length });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Batch generation failed" }, { status: 400 });
  }
}
