import { promises as fs } from "node:fs";
import path from "node:path";
import type { ContentVariant, Product } from "./types";
import { getAppDataDir } from "./paths";
export type LibraryItem={product:Product;contents:ContentVariant[];updatedAt:string};
const file=path.join(getAppDataDir(),"library.json");
async function readAll(){try{return JSON.parse(await fs.readFile(file,"utf8")) as LibraryItem[]}catch{return[]}}
async function writeAll(items:LibraryItem[]){await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,JSON.stringify(items.slice(-1000),null,2),"utf8")}
export async function upsertLibrary(product:Product,contents:ContentVariant[]){const items=await readAll();const index=items.findIndex(i=>i.product.id===product.id||i.product.url===product.url);const next={product,contents,updatedAt:new Date().toISOString()};if(index>=0)items[index]=next;else items.push(next);await writeAll(items);return next;}
export async function listLibrary(){return(await readAll()).reverse();}
