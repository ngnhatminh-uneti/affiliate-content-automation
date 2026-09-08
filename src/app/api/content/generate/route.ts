import { NextResponse } from "next/server";
import { z } from "zod";
import { generateAffiliateContent } from "@/lib/ai";

const schema = z.object({ product: z.object({ id:z.string(), name:z.string(), description:z.string(), price:z.string().optional(), imageUrl:z.string().optional(), features:z.array(z.string()), createdAt:z.string(), url:z.string().optional() }), variants:z.number().int().min(1).max(10), tone:z.enum(["viral","review","educational","story"]) });

export async function POST(request: Request) {
  try { const body = schema.parse(await request.json()); const variants = await generateAffiliateContent(body); return NextResponse.json({ variants }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Generation failed" }, { status: 400 }); }
}
