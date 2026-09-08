import { promises as fs } from "node:fs";
import path from "node:path";

export type RenderJobStatus = "queued" | "rendering" | "completed" | "failed";
export type RenderJob = {
  id: string;
  status: RenderJobStatus;
  productName: string;
  contentId: string;
  createdAt: string;
  updatedAt: string;
  outputPath?: string;
  error?: string;
};

const root = path.join(process.cwd(), "data", "jobs");
async function ensureRoot() { await fs.mkdir(root, { recursive: true }); }
function jobPath(id: string) { return path.join(root, `${id}.json`); }

export async function saveJob(job: RenderJob) { await ensureRoot(); await fs.writeFile(jobPath(job.id), JSON.stringify(job, null, 2), "utf8"); return job; }
export async function getJob(id: string) { try { return JSON.parse(await fs.readFile(jobPath(id), "utf8")) as RenderJob; } catch { return null; } }
export async function listJobs() {
  await ensureRoot();
  const files = await fs.readdir(root);
  const jobs: RenderJob[] = [];
  for (const file of files.filter((name) => name.endsWith(".json"))) {
    try { jobs.push(JSON.parse(await fs.readFile(path.join(root, file), "utf8")) as RenderJob); } catch { /* ignore corrupt metadata */ }
  }
  return jobs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export function createJob(input: Pick<RenderJob, "productName" | "contentId">): RenderJob {
  const now = new Date().toISOString();
  return { id: crypto.randomUUID(), status: "queued", productName: input.productName, contentId: input.contentId, createdAt: now, updatedAt: now };
}
