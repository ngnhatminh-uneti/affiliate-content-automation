import { promises as dns } from "node:dns";
import net from "node:net";
import { z } from "zod";
import type { Product } from "./types";

export const productSchema = z.object({ name:z.string().min(2).max(300), description:z.string().min(2).max(12000), price:z.string().max(100).optional(), imageUrl:z.string().url().optional(), features:z.array(z.string().max(300)).max(30).default([]), url:z.string().url().optional() });

function blockedIp(ip:string) {
  if (net.isIPv4(ip)) {
    const [a,b]=ip.split(".").map(Number);
    return a===10 || a===127 || (a===169&&b===254) || a===0 || (a===172&&b>=16&&b<=31) || (a===192&&b===168);
  }
  if (net.isIPv6(ip)) return ip === "::1" || ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe80:");
  return true;
}

async function assertPublicHost(hostname:string) {
  const host=hostname.toLowerCase().replace(/^www\./,"");
  if (["localhost","localhost.localdomain"].includes(host) || host.endsWith(".local")) throw new Error("Private/local hosts are not allowed");
  const literal=net.isIP(host);
  if (literal && blockedIp(host)) throw new Error("Private/local IP addresses are not allowed");
  if (!literal) {
    const addresses=await dns.lookup(host,{all:true});
    if (!addresses.length || addresses.some((entry)=>blockedIp(entry.address))) throw new Error("Product host resolves to a private address");
  }
}

function meta(html:string, key:string, attribute:"name"|"property") {
  const re=new RegExp(`<meta[^>]+(?:${attribute}=["']${key}["'][^>]+content=["']([^"']+)["']|content=["']([^"']+)["'][^>]+${attribute}=["']${key}["'])[^>]*>`,"i");
  const match=html.match(re); return (match?.[1] || match?.[2])?.trim();
}

export async function importProduct(url:string):Promise<Product> {
  let current=new URL(url);
  if (!/^https?:$/.test(current.protocol)) throw new Error("Only HTTP(S) product URLs are supported");
  for (let redirect=0; redirect<=3; redirect++) {
    await assertPublicHost(current.hostname);
    const response=await fetch(current.toString(),{headers:{"User-Agent":"Mozilla/5.0 AffiliateStudio/1.0"},signal:AbortSignal.timeout(12000),redirect:"manual"});
    if (response.status>=300 && response.status<400) {
      const location=response.headers.get("location");
      if (!location) throw new Error("Product page redirect has no target");
      current=new URL(location,current);
      if (!/^https?:$/.test(current.protocol)) throw new Error("Redirected to an unsupported protocol");
      continue;
    }
    if (!response.ok) throw new Error(`Product page returned ${response.status}`);
    const html=(await response.text()).slice(0,2_000_000);
    const title=(html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || current.hostname).trim();
    const description=meta(html,"description","name") || meta(html,"og:description","property") || "Imported product page";
    const image=meta(html,"og:image","property");
    const product:Product={id:crypto.randomUUID(),name:title.replace(/\s+/g," ").slice(0,300),description:description.replace(/\s+/g," ").slice(0,12000),url:current.toString(),imageUrl:image,features:[],createdAt:new Date().toISOString()};
    return productSchema.parse(product) as Product;
  }
  throw new Error("Too many product page redirects");
}
