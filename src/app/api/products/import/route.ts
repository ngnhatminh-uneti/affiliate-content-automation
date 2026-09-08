import { NextResponse } from "next/server";
import { z } from "zod";
import { importProduct } from "@/lib/product";
import { recordEvent } from "@/lib/analytics";

export const runtime = "nodejs";
const schema = z.object({ url:z.string().url() });

export async function POST(request:Request) {
  try {
    const {url}=schema.parse(await request.json());
    const product=await importProduct(url);
    await recordEvent({ type:"product_imported", productName:product.name });
    return NextResponse.json({product});
  } catch(error) {
    return NextResponse.json({error:error instanceof Error?error.message:"Import failed"},{status:400});
  }
}
