import { z } from "zod";
import type { Product } from "./types";

export const productSchema = z.object({ name:z.string().min(2), description:z.string().min(2), price:z.string().optional(), imageUrl:z.string().url().optional(), features:z.array(z.string()).default([]), url:z.string().url().optional() });

export async function importProduct(url: string): Promise<Product> {
  const parsed = new URL(url);
  if (!/^https?:$/.test(parsed.protocol)) throw new Error("Only HTTP(S) product URLs are supported");
  const response = await fetch(url, { headers:{"User-Agent":"AffiliateStudio/1.0"}, signal:AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`Product page returned ${response.status}`);
  const html = await response.text();
  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() || parsed.hostname;
  const description = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i)?.[1]?.trim() || "Imported product page";
  const imageUrl = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i)?.[1]?.trim();
  return { id:crypto.randomUUID(), name:title, description, url, imageUrl, features:[], createdAt:new Date().toISOString() };
}
