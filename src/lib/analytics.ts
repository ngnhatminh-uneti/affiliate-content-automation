import { promises as fs } from "node:fs";
import path from "node:path";

export type AnalyticsEvent = {
  id: string;
  type: "product_imported" | "content_generated" | "render_completed" | "tiktok_publish_started" | "tiktok_publish_completed" | "tiktok_publish_failed";
  createdAt: string;
  productName?: string;
  jobId?: string;
  metadata?: Record<string, string | number | boolean>;
};

const file = path.join(process.cwd(), "data", "analytics.json");

async function readEvents(): Promise<AnalyticsEvent[]> {
  try { return JSON.parse(await fs.readFile(file, "utf8")) as AnalyticsEvent[]; } catch { return []; }
}

export async function recordEvent(input: Omit<AnalyticsEvent, "id" | "createdAt">) {
  const events = await readEvents();
  events.push({ ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() });
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(events.slice(-5000), null, 2), "utf8");
}

export async function getAnalytics() {
  const events = await readEvents();
  const count = (type: AnalyticsEvent["type"]) => events.filter((event) => event.type === type).length;
  return {
    productsImported: count("product_imported"),
    contentGenerated: count("content_generated"),
    rendersCompleted: count("render_completed"),
    publishStarted: count("tiktok_publish_started"),
    publishCompleted: count("tiktok_publish_completed"),
    publishFailed: count("tiktok_publish_failed"),
    recent: events.slice(-20).reverse(),
  };
}
