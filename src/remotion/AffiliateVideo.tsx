import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { SubtitleCue } from "@/lib/subtitles";

export type AffiliateVideoProps = {
  productName: string;
  hook: string;
  script: string;
  cta: string;
  imageUrl?: string;
  accent?: string;
  audioUrl?: string;
  subtitles?: SubtitleCue[];
};

const font = "Arial, Helvetica, sans-serif";

export const AffiliateVideo: React.FC<AffiliateVideoProps> = ({ productName, hook, script, cta, imageUrl, accent = "#a78bfa", audioUrl, subtitles = [] }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const progress = interpolate(frame, [0, durationInFrames], [0, 100], { extrapolateRight: "clamp" });
  const enter = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const outro = interpolate(frame, [Math.max(0, durationInFrames - 18), durationInFrames], [1, 0], { extrapolateLeft: "clamp" });
  const imageScale = interpolate(frame, [0, durationInFrames], [1.02, 1.12], { extrapolateRight: "clamp" });
  const body = script.replace(/\s+/g, " ").trim();

  return (
    <AbsoluteFill style={{ background: "#09090b", color: "white", fontFamily: font }}>
      {imageUrl ? <AbsoluteFill style={{ opacity: 0.32, overflow: "hidden" }}><Img src={imageUrl} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${imageScale})` }} /></AbsoluteFill> : null}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(9,9,11,.18) 0%, rgba(9,9,11,.62) 52%, #09090b 100%)" }} />
      <AbsoluteFill style={{ padding: 56, justifyContent: "space-between", opacity: enter * outro }}>
        <div><div style={{ fontSize: 28, fontWeight: 700, letterSpacing: 1, opacity: 0.75 }}>AFFILIATE STUDIO</div><div style={{ marginTop: 26, fontSize: 64, lineHeight: 1.05, fontWeight: 900, maxWidth: 960 }}>{productName}</div></div>
        <div style={{ marginBottom: 70 }}><div style={{ fontSize: 62, lineHeight: 1.05, fontWeight: 900, maxWidth: 930 }}>{hook}</div><div style={{ marginTop: 26, fontSize: 31, lineHeight: 1.35, maxWidth: 900, opacity: 0.9 }}>{body}</div><div style={{ marginTop: 30, display: "inline-block", padding: "18px 26px", borderRadius: 999, background: accent, color: "#0b0710", fontWeight: 900, fontSize: 30 }}>{cta}</div></div>
      </AbsoluteFill>
      {subtitles.map((cue, index) => {
        const start = Math.max(0, Math.floor(cue.start * fps));
        const duration = Math.max(1, Math.ceil((cue.end - cue.start) * fps));
        return <Sequence key={`${cue.start}-${index}`} from={start} durationInFrames={duration}><div style={{ position: "absolute", left: 70, right: 70, bottom: 270, textAlign: "center" }}><span style={{ display: "inline-block", maxWidth: 900, padding: "14px 20px", borderRadius: 18, background: "rgba(0,0,0,.68)", color: "white", fontSize: 38, lineHeight: 1.2, fontWeight: 900 }}>{cue.text}</span></div></Sequence>;
      })}
      {audioUrl ? <Audio src={audioUrl} volume={1} /> : null}
      <AbsoluteFill style={{ top: "auto", height: 10, background: "rgba(255,255,255,.15)" }}><div style={{ width: `${progress}%`, height: "100%", background: accent }} /></AbsoluteFill>
      <div style={{ position: "absolute", right: 42, bottom: 28, fontSize: 21, opacity: 0.7 }}>9:16 • {Math.round(frame / fps)}s</div>
    </AbsoluteFill>
  );
};
