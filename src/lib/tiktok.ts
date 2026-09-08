import { promises as fs } from "node:fs";
import path from "node:path";

const tokenFile = path.join(process.cwd(), "data", "tiktok.json");
const API = "https://open.tiktokapis.com/v2";

export type TikTokToken = { access_token:string; refresh_token?:string; expires_at?:number; open_id?:string; scope?:string; refresh_expires_at?:number };

async function saveToken(token: TikTokToken) {
  await fs.mkdir(path.dirname(tokenFile), { recursive:true });
  await fs.writeFile(tokenFile, JSON.stringify(token, null, 2), "utf8");
}

export async function getTikTokToken() {
  try { return JSON.parse(await fs.readFile(tokenFile, "utf8")) as TikTokToken; } catch { return null; }
}

async function ensureToken() {
  const token = await getTikTokToken();
  if (!token) throw new Error("Chưa kết nối TikTok");
  if (token.expires_at && token.expires_at > Date.now() + 60_000) return token;
  if (!token.refresh_token) throw new Error("TikTok access token đã hết hạn; hãy kết nối lại TikTok");
  const key = process.env.TIKTOK_CLIENT_KEY;
  const secret = process.env.TIKTOK_CLIENT_SECRET;
  if (!key || !secret) throw new Error("TikTok OAuth chưa được cấu hình đầy đủ");
  const body = new URLSearchParams({ client_key:key, client_secret:secret, grant_type:"refresh_token", refresh_token:token.refresh_token });
  const response = await fetch(`${API}/oauth/token/`, { method:"POST", headers:{"Content-Type":"application/x-www-form-urlencoded"}, body });
  const data = await response.json();
  if (!response.ok || data.error) throw new Error(data.error_description || data.error || "Không thể refresh TikTok token");
  const refreshed: TikTokToken = { access_token:data.access_token, refresh_token:data.refresh_token || token.refresh_token, open_id:data.open_id || token.open_id, scope:data.scope || token.scope, expires_at:data.expires_in ? Date.now() + Number(data.expires_in)*1000 : undefined, refresh_expires_at:data.refresh_expires_in ? Date.now() + Number(data.refresh_expires_in)*1000 : token.refresh_expires_at };
  await saveToken(refreshed);
  return refreshed;
}

export function getTikTokAuthorizeUrl(state:string) {
  const key = process.env.TIKTOK_CLIENT_KEY;
  const redirect = process.env.TIKTOK_REDIRECT_URI;
  if (!key || !redirect) throw new Error("TIKTOK_CLIENT_KEY và TIKTOK_REDIRECT_URI chưa được cấu hình");
  const params = new URLSearchParams({ client_key:key, response_type:"code", scope:"user.info.basic,video.publish", redirect_uri:redirect, state });
  return `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;
}

export async function exchangeTikTokCode(code:string) {
  const key = process.env.TIKTOK_CLIENT_KEY;
  const secret = process.env.TIKTOK_CLIENT_SECRET;
  const redirect = process.env.TIKTOK_REDIRECT_URI;
  if (!key || !secret || !redirect) throw new Error("TikTok OAuth chưa được cấu hình đầy đủ");
  const body = new URLSearchParams({ client_key:key, client_secret:secret, code, grant_type:"authorization_code", redirect_uri:redirect });
  const response = await fetch(`${API}/oauth/token/`, { method:"POST", headers:{"Content-Type":"application/x-www-form-urlencoded"}, body });
  const data = await response.json();
  if (!response.ok || data.error) throw new Error(data.error_description || data.error || "TikTok token exchange thất bại");
  const token: TikTokToken = { access_token:data.access_token, refresh_token:data.refresh_token, open_id:data.open_id, scope:data.scope, expires_at:data.expires_in ? Date.now() + Number(data.expires_in)*1000 : undefined, refresh_expires_at:data.refresh_expires_in ? Date.now() + Number(data.refresh_expires_in)*1000 : undefined };
  await saveToken(token);
  return token;
}

export async function getCreatorInfo() {
  const token = await ensureToken();
  const response = await fetch(`${API}/post/publish/creator_info/query/`, { method:"POST", headers:{ Authorization:`Bearer ${token.access_token}`, "Content-Type":"application/json; charset=UTF-8" } });
  const data = await response.json();
  if (!response.ok || data.error?.code !== "ok") throw new Error(data.error?.message || "Không thể đọc thông tin creator");
  return data.data;
}

export async function publishVideo(filePath:string, caption:string, privacyLevel:string="SELF_ONLY") {
  const token = await ensureToken();
  const stat = await fs.stat(filePath);
  const chunkSize = Math.min(10 * 1024 * 1024, stat.size);
  const totalChunks = Math.ceil(stat.size / chunkSize);
  const init = await fetch(`${API}/post/publish/video/init/`, { method:"POST", headers:{ Authorization:`Bearer ${token.access_token}`, "Content-Type":"application/json; charset=UTF-8" }, body:JSON.stringify({ post_info:{ title:caption.slice(0,2200), privacy_level:privacyLevel, disable_duet:false, disable_comment:false, disable_stitch:false }, source_info:{ source:"FILE_UPLOAD", video_size:stat.size, chunk_size:chunkSize, total_chunk_count:totalChunks } }) });
  const initData = await init.json();
  if (!init.ok || initData.error?.code !== "ok") throw new Error(initData.error?.message || "TikTok init upload thất bại");
  const handle = await fs.open(filePath, "r");
  try {
    for (let index=0; index<totalChunks; index++) {
      const size = Math.min(chunkSize, stat.size - index*chunkSize);
      const buffer = Buffer.alloc(size);
      await handle.read(buffer, 0, size, index*chunkSize);
      const start = index*chunkSize, end = start + size - 1;
      const upload = await fetch(initData.data.upload_url, { method:"PUT", headers:{ "Content-Type":"video/mp4", "Content-Length":String(size), "Content-Range":`bytes ${start}-${end}/${stat.size}` }, body:buffer });
      if (!upload.ok) throw new Error(`TikTok upload thất bại ở chunk ${index+1}`);
    }
  } finally { await handle.close(); }
  return { publishId:initData.data.publish_id };
}

export async function getPublishStatus(publishId:string) {
  const token = await ensureToken();
  const response = await fetch(`${API}/post/publish/status/fetch/`, { method:"POST", headers:{ Authorization:`Bearer ${token.access_token}`, "Content-Type":"application/json" }, body:JSON.stringify({ publish_id:publishId }) });
  const data = await response.json();
  if (!response.ok || data.error?.code !== "ok") throw new Error(data.error?.message || "Không thể đọc trạng thái TikTok");
  return data.data;
}
