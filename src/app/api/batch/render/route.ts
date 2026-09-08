import { NextResponse } from "next/server";
import { z } from "zod";
import type { ContentVariant, Product } from "@/lib/types";
import { renderAffiliateVideo } from "@/lib/render";
import { recordEvent } from "@/lib/analytics";

export const runtime = "nodejs";
export const maxDuration = 900;

const itemSchema = z.object({ product:z.object({id:z.string(),name:z.string(),description:z.string(),url:z.string().optional(),imageUrl:z.string().optional()}), content:z.object({id:z.string(),productId:z.string(),angle:z.string(),hook:z.string(),script:z.string(),cta:z.string(),caption:z.string(),hashtags:z.array(z.string()),duration:z.number().int().min(10).max(60)}) });
const schema = z.object({ items:z.array(itemSchema).min(1).max(10), voice:z.object({enabled:z.boolean(),name:z.string().min(2).max(40),style:z.string().max(300).optional()}).optional() });

export async function POST(request:Request) {
  try {
    const body=schema.parse(await request.json());
    const results=[] as unknown[];
    for (const item of body.items) {
      try {
        const result=await renderAffiliateVideo(item.product as Product,item.content as ContentVariant,body.voice);
        results.push({ok:true,...result});
        await recordEvent({type:"render_completed",jobId:result.job.id,productName:item.product.name,metadata:{batch:true}});
      } catch (error) {
        results.push({ok:false,productName:item.product.name,error:error instanceof Error?error.message:"Render failed"});
      }
    }
    return NextResponse.json({results,count:results.length});
  } catch(error) {
    return NextResponse.json({error:error instanceof Error?error.message:"Batch render failed"},{status:400});
  }
}
