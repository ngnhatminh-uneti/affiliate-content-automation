"use client";

import { useEffect, useState } from "react";
import { Sparkles, Video, Package, Wand2, Download, RefreshCw, Link2, Mic2, Upload, BarChart3 } from "lucide-react";
import type { ContentVariant, Product } from "@/lib/types";

type Analytics = { productsImported:number; contentGenerated:number; rendersCompleted:number; publishStarted:number; publishCompleted:number; publishFailed:number };

const voices = ["Kore", "Puck", "Charon", "Leda", "Aoede", "Achernar", "Sulafat"];

export default function Home() {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [variants, setVariants] = useState(3);
  const [tone, setTone] = useState<"viral"|"review"|"educational"|"story">("viral");
  const [contents, setContents] = useState<ContentVariant[]>([]);
  const [selected, setSelected] = useState<ContentVariant | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [currentJobId, setCurrentJobId] = useState("");
  const [publishId, setPublishId] = useState("");
  const [publishStatus, setPublishStatus] = useState("");
  const [privacy, setPrivacy] = useState("SELF_ONLY");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voice, setVoice] = useState("Kore");
  const [connected, setConnected] = useState(false);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { void refreshDashboard(); }, []);

  async function refreshDashboard() {
    try {
      const [a, t] = await Promise.all([fetch("/api/analytics"), fetch("/api/tiktok/creator")]);
      if (a.ok) setAnalytics(await a.json());
      const td = await t.json(); setConnected(Boolean(td.connected));
    } catch { /* dashboard can work without analytics/TikTok */ }
  }

  async function importProduct() {
    if (!url) return setStatus("Hãy nhập Product URL trước.");
    setBusy(true); setStatus("Đang đọc thông tin sản phẩm…");
    try {
      const res = await fetch("/api/products/import", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ url }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể import sản phẩm");
      setName(data.product.name || ""); setDescription(data.product.description || "");
      setStatus("Đã import sản phẩm. Bạn có thể chỉnh sửa trước khi tạo nội dung.");
    } catch (e) { setStatus(e instanceof Error ? e.message : "Import thất bại."); }
    finally { setBusy(false); void refreshDashboard(); }
  }

  async function generate() {
    const product: Product = { id:crypto.randomUUID(), name:name||"Sản phẩm mới", url:url||undefined, description:description||"Chưa có mô tả", features:[], createdAt:new Date().toISOString() };
    setBusy(true); setVideoUrl(""); setPublishId(""); setStatus("AI đang tạo hook, script, CTA và caption…");
    try {
      const res = await fetch("/api/content/generate", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ product, variants, tone }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể tạo nội dung");
      setContents(data.variants); setSelected(data.variants[0] || null);
      setStatus(`Đã tạo ${data.variants.length} biến thể. Chọn một biến thể để render video.`);
    } catch (e) { setStatus(e instanceof Error ? e.message : "Tạo nội dung thất bại."); }
    finally { setBusy(false); void refreshDashboard(); }
  }

  async function render() {
    if (!selected) return setStatus("Hãy tạo và chọn một biến thể nội dung trước.");
    const product: Product = { id:selected.productId, name:name||"Sản phẩm mới", url:url||undefined, description:description||"", features:[], createdAt:new Date().toISOString() };
    setBusy(true); setVideoUrl(""); setPublishId(""); setStatus(voiceEnabled ? "Đang tạo giọng đọc tiếng Việt và render video…" : "Remotion đang render video dọc 9:16…");
    try {
      const res = await fetch("/api/render", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ product, content:selected, voice:{ enabled:voiceEnabled, name:voice, style:"người làm nội dung TikTok Việt Nam; tự nhiên, đáng tin, hơi nhanh và giàu năng lượng" } }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Render thất bại");
      setVideoUrl(data.videoUrl); setCurrentJobId(data.job.id); setStatus("Render hoàn tất. Hãy xem preview trước khi đăng.");
    } catch (e) { setStatus(e instanceof Error ? e.message : "Render thất bại."); }
    finally { setBusy(false); void refreshDashboard(); }
  }

  async function publish() {
    if (!currentJobId || !videoUrl || !selected) return setStatus("Bạn cần render video trước.");
    if (!connected) { window.location.href = "/api/tiktok/connect"; return; }
    if (!window.confirm("Bạn đã xem preview và đồng ý gửi video này lên TikTok?")) return;
    setBusy(true); setPublishStatus("Đang upload video lên TikTok…");
    try {
      const caption = `${selected.caption}\n\n${selected.hashtags.join(" ")}`.slice(0, 2200);
      const res = await fetch("/api/tiktok/publish", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ jobId:currentJobId, caption, privacyLevel:privacy, confirm:true }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "TikTok publish thất bại");
      setPublishId(data.publishId); setPublishStatus(`Đã gửi lên TikTok. Publish ID: ${data.publishId}`); setStatus("TikTok đang xử lý bài đăng. Bạn có thể kiểm tra trạng thái.");
    } catch (e) { setPublishStatus(e instanceof Error ? e.message : "TikTok publish thất bại."); }
    finally { setBusy(false); void refreshDashboard(); }
  }

  async function checkPublish() {
    if (!publishId) return;
    setBusy(true);
    try { const res = await fetch("/api/tiktok/status", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ publishId }) }); const data = await res.json(); if (!res.ok) throw new Error(data.error); setPublishStatus(`Trạng thái: ${data.status?.status || "unknown"}${data.status?.fail_reason ? ` — ${data.status.fail_reason}` : ""}`); }
    catch (e) { setPublishStatus(e instanceof Error ? e.message : "Không thể kiểm tra trạng thái"); }
    finally { setBusy(false); void refreshDashboard(); }
  }

  return <main className="min-h-screen"><header className="border-b border-zinc-800 px-8 py-5 flex items-center justify-between"><div className="flex items-center gap-3"><div className="rounded-xl bg-white text-black p-2"><Sparkles size={20}/></div><div><div className="font-bold">Affiliate Studio</div><div className="text-xs text-zinc-500">AI Content Automation</div></div></div><div className="flex items-center gap-4 text-sm text-zinc-400"><span>{connected ? "TikTok connected" : "TikTok not connected"}</span>{analytics && <span className="hidden md:inline">{analytics.rendersCompleted} renders</span>}</div></header>
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="max-w-3xl"><div className="text-sm text-zinc-400 mb-3">AFFILIATE CONTENT ENGINE</div><h1 className="text-5xl font-bold tracking-tight">Biến sản phẩm thành <span className="text-zinc-400">video bán hàng.</span></h1><p className="mt-5 text-lg text-zinc-400">Nhập sản phẩm một lần → AI tạo nhiều góc nội dung → TTS + phụ đề → Remotion render TikTok 9:16 → preview → đăng.</p></div>

      {analytics && <section className="mt-8 grid grid-cols-2 md:grid-cols-6 gap-3">{[["Products",analytics.productsImported],["Scripts",analytics.contentGenerated],["Renders",analytics.rendersCompleted],["Started",analytics.publishStarted],["Published",analytics.publishCompleted],["Failed",analytics.publishFailed]].map(([label,value])=><div key={label} className="card p-4"><div className="text-xs text-zinc-500">{label}</div><div className="mt-2 text-xl font-bold">{value}</div></div>)}</section>}

      <section className="card mt-10 p-6"><div className="flex items-center gap-2 font-semibold"><Package size={18}/> Product intake</div><div className="grid md:grid-cols-2 gap-5 mt-6"><label className="text-sm text-zinc-400">Product URL<div className="mt-2 flex gap-2"><input value={url} onChange={e=>setUrl(e.target.value)} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none" placeholder="https://..."/><button disabled={busy} onClick={importProduct} className="rounded-xl border border-zinc-700 px-4" title="Import sản phẩm"><Link2 size={18}/></button></div></label><label className="text-sm text-zinc-400">Tên sản phẩm<input value={name} onChange={e=>setName(e.target.value)} className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none" placeholder="Ví dụ: Máy hút bụi mini"/></label><label className="md:col-span-2 text-sm text-zinc-400">Mô tả / điểm nổi bật<textarea value={description} onChange={e=>setDescription(e.target.value)} className="mt-2 min-h-28 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none" placeholder="Nhập thông tin sản phẩm nếu chưa có URL..."/></label></div></section>

      <section className="grid md:grid-cols-4 gap-4 mt-5"><div className="card p-5"><div className="text-sm muted">Video variants</div><select value={variants} onChange={e=>setVariants(Number(e.target.value))} className="mt-3 w-full rounded-lg bg-zinc-900 p-3"><option value={1}>1 variant</option><option value={3}>3 variants</option><option value={5}>5 variants</option><option value={10}>10 variants</option></select></div><div className="card p-5"><div className="text-sm muted">Content angle</div><select value={tone} onChange={e=>setTone(e.target.value as typeof tone)} className="mt-3 w-full rounded-lg bg-zinc-900 p-3"><option value="viral">Viral hook</option><option value="review">Review</option><option value="educational">Educational</option><option value="story">Story</option></select></div><div className="card p-5"><div className="text-sm muted">Voice</div><div className="mt-3 flex gap-2"><select value={voice} disabled={!voiceEnabled} onChange={e=>setVoice(e.target.value)} className="w-full rounded-lg bg-zinc-900 p-3">{voices.map(v=><option key={v}>{v}</option>)}</select><button onClick={()=>setVoiceEnabled(!voiceEnabled)} className={`rounded-lg px-3 ${voiceEnabled?"bg-white text-black":"border border-zinc-700 text-zinc-500"}`} title="Bật/tắt narration"><Mic2 size={18}/></button></div></div><div className="card p-5 flex flex-col justify-between"><div><div className="text-sm muted">Automation</div><div className="mt-3 font-medium">AI → TTS → Render → TikTok</div></div><button disabled={busy} onClick={generate} className="mt-5 rounded-xl bg-white text-black px-5 py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"><Wand2 size={17}/>{busy ? "Đang xử lý…" : "Generate content"}</button></div></section>

      {status && <div className="mt-5 rounded-xl border border-zinc-800 p-4 text-sm text-zinc-300">{status}</div>}
      {contents.length > 0 && <section className="mt-8 grid lg:grid-cols-[1.15fr_.85fr] gap-5"><div className="card p-6"><div className="flex items-center justify-between"><div className="font-semibold">Content variants</div><button onClick={generate} disabled={busy} className="text-sm text-zinc-400 hover:text-white"><RefreshCw size={16}/></button></div><div className="mt-4 space-y-3">{contents.map((item, i)=><button key={item.id} onClick={()=>{setSelected(item);setVideoUrl("")}} className={`w-full text-left rounded-xl border p-4 transition ${selected?.id===item.id ? "border-white bg-white/5" : "border-zinc-800 hover:border-zinc-600"}`}><div className="text-xs uppercase text-zinc-500">Variant {i+1} · {item.angle}</div><div className="mt-2 font-semibold">{item.hook}</div><div className="mt-2 text-sm text-zinc-400 line-clamp-2">{item.script}</div><div className="mt-3 text-xs text-zinc-500">{item.duration}s · {item.hashtags.slice(0,4).join(" ")}</div></button>)}</div></div><div className="card p-6"><div className="flex items-center justify-between"><div className="font-semibold">Video output</div><div className="text-xs text-zinc-500">1080×1920 H.264</div></div>{selected ? <><div className="mt-4 aspect-[9/16] max-h-[620px] rounded-2xl border border-zinc-800 bg-black overflow-hidden flex items-center justify-center">{videoUrl ? <video src={videoUrl} controls className="h-full w-full object-cover" /> : <div className="p-6 text-center text-zinc-500"><Video className="mx-auto mb-4"/><div className="text-sm">{selected.hook}</div><button onClick={render} disabled={busy} className="mt-5 rounded-xl bg-white text-black px-5 py-3 font-semibold disabled:opacity-50">{busy ? "Rendering…" : "Render video + voice"}</button></div>}</div>{videoUrl && <><div className="grid grid-cols-2 gap-3 mt-4"><a href={videoUrl} download className="flex items-center justify-center gap-2 rounded-xl border border-zinc-700 px-4 py-3 font-medium"><Download size={17}/> Download</a><button onClick={render} disabled={busy} className="flex items-center justify-center gap-2 rounded-xl border border-zinc-700 px-4 py-3 font-medium"><RefreshCw size={17}/> Re-render</button></div><div className="mt-4 rounded-xl border border-zinc-800 p-4"><div className="flex items-center gap-2 font-medium"><Upload size={17}/> TikTok</div>{!connected ? <button onClick={()=>{window.location.href="/api/tiktok/connect"}} className="mt-3 w-full rounded-xl bg-white text-black px-4 py-3 font-semibold">Connect TikTok</button> : <><label className="block mt-3 text-sm text-zinc-400">Privacy<select value={privacy} onChange={e=>setPrivacy(e.target.value)} className="mt-2 w-full rounded-lg bg-zinc-900 p-3"><option value="SELF_ONLY">Only me</option><option value="MUTUAL_FOLLOW_FRIENDS">Friends</option><option value="FOLLOWER_OF_CREATOR">Followers</option><option value="PUBLIC_TO_EVERYONE">Public</option></select></label><button onClick={publish} disabled={busy} className="mt-3 w-full rounded-xl bg-white text-black px-4 py-3 font-semibold disabled:opacity-50">Preview confirmed → Publish</button>{publishId && <button onClick={checkPublish} disabled={busy} className="mt-2 w-full rounded-xl border border-zinc-700 px-4 py-3">Check publish status</button>}{publishStatus && <div className="mt-3 text-xs text-zinc-400 break-words">{publishStatus}</div>}</>}</div></>}</> : <div className="mt-4 rounded-xl border border-dashed border-zinc-800 p-10 text-center text-zinc-500">Chọn một content variant để render.</div>}</div></section>}

      <section className="mt-12 grid md:grid-cols-3 gap-4"><Feature icon={<Sparkles/>} title="AI Content" text="Hook, script, CTA, caption và hashtag theo từng góc bán hàng."/><Feature icon={<Mic2/>} title="Voice + Captions" text="Gemini TTS tiếng Việt và subtitle động theo timeline video."/><Feature icon={<BarChart3/>} title="Batch & Analytics" text="Sinh hàng loạt, lưu job, theo dõi render và trạng thái publish."/></section>
    </div></main>
}
function Feature({icon,title,text}:{icon:React.ReactNode;title:string;text:string}) { return <div className="card p-5"><div className="text-zinc-400">{icon}</div><h3 className="mt-4 font-semibold">{title}</h3><p className="mt-2 text-sm text-zinc-500 leading-6">{text}</p></div> }
