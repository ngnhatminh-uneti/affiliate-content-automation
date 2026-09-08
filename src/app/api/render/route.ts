import { NextResponse } from "next/server";
import { z } from "zod";
import type { ContentVariant, Product } from "@/lib/types";
import { recordEvent } from "@/lib/analytics";
import { renderAffiliateVideo } from "@/lib/render";

export const runtime = "nodejs";
export const maxDuration = 300;

const schema = z.object({
  product:z.object({id:z.string(),name:z.string(),description:z.string(),url:z.string().optional(),imageUrl:z.string().optional()}),
  content:z.object({id:z.string(),productId:z.string(),angle:z.string(),hook:z.string(),script:z.string(),cta:z.string(),caption:z.string(),hashtags:z.array(z.string()),duration:z.number().int().min(10).max(60)}),
  voice:z.object({enabled:z.boolean(),name:z.string().min(2).max(40),style:z.string().max(300).optional()}).optional(),
});

export async function POST(request:Request) {
  try {
    const parsed=schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({error:"Dữ liệu render không hợp lệ",details:parsed.error.flatten()},{status:400});
    const product=parsed.data.product as Product;
    const content=parsed.data.content as ContentVariant;
    const result=await renderAffiliateVideo(product,content,parsed.data.voice);
    await recordEvent({type:"render_completed",jobId:result.job.id,productName:product.name,metadata:{duration:result.duration,voice:Boolean(parsed.data.voice?.enabled)}});
    return NextResponse.json(result);
  } catch(error) {
    return NextResponse.json({error:error instanceof Error?error.message:"Không thể render video"},{status:500});
  }
}
