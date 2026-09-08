import { NextResponse } from "next/server";
import { z } from "zod";
import { importProduct } from "@/lib/product";

const schema = z.object({ url:z.string().url() });
export async function POST(request:Request) {
  try { const {url}=schema.parse(await request.json()); return NextResponse.json({product:await importProduct(url)}); }
  catch(error){ return NextResponse.json({error:error instanceof Error?error.message:"Import failed"},{status:400}); }
}
