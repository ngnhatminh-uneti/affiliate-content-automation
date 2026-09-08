import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";

export const runtime = "nodejs";
const file = path.join(process.cwd(), "data", "tiktok-webhooks.json");

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const events = await (async () => { try { return JSON.parse(await fs.readFile(file, "utf8")) as unknown[]; } catch { return []; } })();
    events.push({ receivedAt: new Date().toISOString(), payload });
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify(events.slice(-1000), null, 2), "utf8");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
