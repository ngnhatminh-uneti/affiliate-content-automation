"use client";

import { useState } from "react";
import { Sparkles, Video, Package, Wand2, Download, RefreshCw, Link2 } from "lucide-react";
import type { ContentVariant, Product } from "@/lib/types";

export default function Home() {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [variants, setVariants] = useState(3);
  const [tone, setTone] = useState<"viral"|"review"|"educational"|"story">("viral");
  const [contents, setContents] = useState<ContentVariant[]>([]);
  const [selected, setSelected] = useState<ContentVariant | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function importProduct() {
    if (!url) return setStatus("Hãy nhập Product URL trước.");
    setBusy(true); setStatus("Đang đọc thông tin sản phẩm…");
    try {
      const res = await fetch("/api/products/import", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ url }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể import sản phẩm");
      setName(data.product.name || "");
      setDescription(data.product.description || "");
      setStatus("Đã import sản phẩm. Bạn có thể chỉnh sửa trước khi tạo nội dung.");
    } catch (e) { setStatus(e instanceof Error ? e.message : "Import thất bại."); }
    finally { setBusy(false); }
  }

  async function generate() {
    const product: Product = { id: crypto.randomUUID(), name:name||"Sản phẩm mới", url:url||undefined, description:description||"Chưa có mô tả", features:[], createdAt:new Date().toISOString() };
    setBusy(true); setVideoUrl(""); setStatus("AI đang tạo hook, script, CTA và caption…");
    try {
      const res = await fetch("/api/content/generate", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ product, variants, tone }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể tạo nội dung");
      setContents(data.variants); setSelected(data.variants[0] || null);
      setStatus(`Đã tạo ${data.variants.length} biến thể. Chọn một biến thể để render video.`);
    } catch (e) { setStatus(e instanceof Error ? e.message : "Tạo nội dung thất bại."); }
    finally { setBusy(false); }
  }

  async function render() {
    if (!selected) return setStatus("Hãy tạo và chọn một biến thể nội dung trước.");
    const product: Product = { id:selected.productId, name:name||"Sản phẩm mới", url:url||undefined, description:description||"", features:[], createdAt:new Date().toISOString() };
    setBusy(true); setVideoUrl(""); setStatus("Remotion đang render video dọc 9:16…");
    try {
      const res = await fetch("/api/render", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ product, content:selected }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Render thất bại");
      setVideoUrl(data.videoUrl); setStatus("Render hoàn tất. Video đã sẵn sàng để xem và đăng.");
    } catch (e) { setStatus(e instanceof Error ? e.message : "Render thất bại."); }
    finally { setBusy(false); }
  }

  return <main className="min-h-screen"><header className="border-b border-zinc-800 px-8 py-5 flex items-center justify-between"><div className="flex items-center gap-3"><div className="rounded-xl bg-white text-black p-2"><Sparkles size={20}/></div><div><div className="font-bold">Affiliate Studio</div><div className="text-xs text-zinc-500">AI Content Automation</div></div></div><div className="text-sm text-zinc-400">Products · Content · Videos · Analytics</div></header>
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="max-w-3xl"><div className="text-sm text-zinc-400 mb-3">AFFILIATE CONTENT ENGINE</div><h1 className="text-5xl font-bold tracking-tight">Biến sản phẩm thành <span className="text-zinc-400">video bán hàng.</span></h1><p className="mt-5 text-lg text-zinc-400">Nhập sản phẩm một lần. AI tạo nhiều góc nội dung, sau đó Remotion dựng video TikTok 9:16 để bạn sản xuất hàng loạt.</p></div>
      <section className="card mt-10 p-6"><div className="flex items-center gap-2 font-semibold"><Package size={18}/> Product intake</div><div className="grid md:grid-cols-2 gap-5 mt-6"><label className="text-sm text-zinc-400">Product URL<div className="mt-2 flex gap-2"><input value={url} onChange={e=>setUrl(e.target.value)} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none" placeholder="https://..."/><button disabled={busy} onClick={importProduct} className="rounded-xl border border-zinc-700 px-4" title="Import sản phẩm"><Link2 size={18}/></button></div></label><label className="text-sm text-zinc-400">Tên sản phẩm<input value={name} onChange={e=>setName(e.target.value)} className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none" placeholder="Ví dụ: Máy hút bụi mini"/></label><label className="md:col-span-2 text-sm text-zinc-400">Mô tả / điểm nổi bật<textarea value={description} onChange={e=>setDescription(e.target.value)} className="mt-2 min-h-28 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none" placeholder="Nhập thông tin sản phẩm nếu chưa có URL..."/></label></div></section>
      <section className="grid md:grid-cols-3 gap-4 mt-5"><div className="card p-5"><div className="text-sm muted">Video variants</div><select value={variants} onChange={e=>setVariants(Number(e.target.value))} className="mt-3 w-full rounded-lg bg-zinc-900 p-3"><option value={1}>1 variant</option><option value={3}>3 variants</option><option value={5}>5 variants</option><option value={10}>10 variants</option></select></div><div className="card p-5"><div className="text-sm muted">Content angle</div><select value={tone} onChange={e=>setTone(e.target.value as typeof tone)} className="mt-3 w-full rounded-lg bg-zinc-900 p-3"><option value="viral">Viral hook</option><option value="review">Review</option><option value="educational">Educational</option><option value="story">Story</option></select></div><div className="card p-5 flex flex-col justify-between"><div><div className="text-sm muted">Automation</div><div className="mt-3 font-medium">AI → Script → Render</div></div><button disabled={busy} onClick={generate} className="mt-5 rounded-xl bg-white text-black px-5 py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"><Wand2 size={17}/>{busy ? "Đang xử lý…" : "Generate content"}</button></div></section>
      {status && <div className="mt-5 rounded-xl border border-zinc-800 p-4 text-sm text-zinc-300">{status}</div>}
      {contents.length > 0 && <section className="mt-8 grid lg:grid-cols-[1.2fr_.8fr] gap-5"><div className="card p-6"><div className="flex items-center justify-between"><div className="font-semibold">Content variants</div><button onClick={generate} disabled={busy} className="text-sm text-zinc-400 hover:text-white"><RefreshCw size={16}/></button></div><div className="mt-4 space-y-3">{contents.map((item, i)=><button key={item.id} onClick={()=>{setSelected(item);setVideoUrl("")}} className={`w-full text-left rounded-xl border p-4 transition ${selected?.id===item.id ? "border-white bg-white/5" : "border-zinc-800 hover:border-zinc-600"}`}><div className="text-xs uppercase text-zinc-500">Variant {i+1} · {item.angle}</div><div className="mt-2 font-semibold">{item.hook}</div><div className="mt-2 text-sm text-zinc-400 line-clamp-2">{item.script}</div></button>)}</div></div><div className="card p-6"><div className="font-semibold">Video output</div>{selected ? <><div className="mt-4 aspect-[9/16] max-h-[620px] rounded-2xl border border-zinc-800 bg-black overflow-hidden flex items-center justify-center">{videoUrl ? <video src={videoUrl} controls className="h-full w-full object-cover" /> : <div className="p-6 text-center text-zinc-500"><Video className="mx-auto mb-4"/><div className="text-sm">{selected.hook}</div><button onClick={render} disabled={busy} className="mt-5 rounded-xl bg-white text-black px-5 py-3 font-semibold disabled:opacity-50">{busy ? "Rendering…" : "Render 9:16 video"}</button></div>}</div>{videoUrl && <a href={videoUrl} download className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-zinc-700 px-4 py-3 font-medium"><Download size={17}/> Download MP4</a>}</> : <div className="mt-4 rounded-xl border border-dashed border-zinc-800 p-10 text-center text-zinc-500">Chọn một content variant để render.</div>}</div></section>}
      <section className="mt-12 grid md:grid-cols-3 gap-4"><Feature icon={<Sparkles/>} title="AI Content" text="Hook, script, CTA, caption và hashtag theo từng góc bán hàng."/><Feature icon={<Video/>} title="Video Engine" text="Remotion render dọc 1080×1920, sẵn sàng mở rộng thành batch rendering."/><Feature icon={<Package/>} title="Batch & A/B" text="Một sản phẩm tạo nhiều biến thể để thử hook, angle và CTA khác nhau."/></section>
    </div></main>
}
function Feature({icon,title,text}:{icon:React.ReactNode;title:string;text:string}) { return <div className="card p-5"><div className="text-zinc-400">{icon}</div><h3 className="mt-4 font-semibold">{title}</h3><p className="mt-2 text-sm text-zinc-500 leading-6">{text}</p></div> }
