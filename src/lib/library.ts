import { promises as fs } from "node:fs";
import path from "node:path";
import type { ContentVariant, Product } from "@/lib/types";

export type LibraryItem = { product: Product; contents: ContentVariant[]; updatedAt: string };
const file = path.join(process.cwd(), "data", "library.json");

async function readAll(): Promise<LibraryItem[]> {
  try { return JSON.parse(await fs.readFile(file, "utf8")) as LibraryItem[]; } catch { return []; }
}

async function writeAll(items: LibraryItem[]) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(items.slice(-1000), null, 2), "utf8");
}

export async function upsertLibrary(product: Product, contents: ContentVariant[]) {
  const items = await readAll();
  const index = items.findIndex((item) => item.product.id === product.id || item.product.url === product.url);
  const next: LibraryItem = { product, contents, updatedAt: new Date().toISOString() };
  if (index >= 0) items[index] = next; else items.push(next);
  await writeAll(items);
  return next;
}

export async function listLibrary() { return (await readAll()).reverse(); }
