"use client";

/* ═══════════════════════════════════════════════════════════════════════
   J.A.R.V.I.S. → HARLY — live-talking wolf control room (beast edition).
   Chat protocol from VPS /root/harly-docker/dashboard.html: POST {prompt} →
   {response|reply|output}. Plus a LIP-SYNC wolf avatar: mouth animates from
   MIC input when you talk (Web Audio AnalyserNode) AND from TTS boundary
   events when the wolf replies. Controls: voice on/off, wolf voice, speed,
   glow, endpoint. Speech via native SpeechSynthesis + SpeechRecognition.
   All client-side, zero model cost. Nothing fabricated: wolf replies come
   from the real backend (or a clear offline notice).
   ═══════════════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, Mic, Send, Cpu, Radio, RefreshCw, Settings2 } from "lucide-react";

const ACCENT = { cyan: "#22d3ee", gold: "#c8a86b", goldD: "#8a6d3b", blue: "#0f172a", blueL: "#1e293b", on: "#e2e8f0", mut: "#64748b" };

type Msg = { role: "user" | "wolf"; text: string };

export default function HarlyWolfRoom() {
  const [voice, setVoice] = useState(true);
  const [glow, setGlow] = useState<"cyan" | "gold">("gold");
  const [endpoint, setEndpoint] = useState("/api/execute");
  const [messages, setMessages] = useState<Msg[]>([{ role: "wolf", text: "The wolf is online. Ask me anything." }]);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [wolfVoice, setWolfVoice] = useState("");
  const [speed, setSpeed] = useState(1.0);

  // lip-sync amplitude refs + canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouthRef = useRef(0);          // 0..1 current mouth openness
  const targetMouthRef = useRef(0);
  const audioRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const bootSpoke = useRef(false);

  const ring = glow === "gold" ? ACCENT.gold : ACCENT.cyan;

  /* ── wolf avatar render loop (canvas) ── */
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = w * DPR; canvas.height = h * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    let raf = 0, i = 0;
    const draw = () => {
      i++;
      // ease mouth toward target
      mouthRef.current += (targetMouthRef.current - mouthRef.current) * 0.35;
      const cx = w / 2, cy = h / 2, m = mouthRef.current;
      ctx.clearRect(0, 0, w, h);
      // glow aura
      ctx.beginPath(); ctx.arc(cx, cy, 130 + m * 8, 0, Math.PI * 2);
      ctx.fillStyle = ring === ACCENT.gold ? "rgba(200,168,107,0.08)" : "rgba(34,211,238,0.08)"; ctx.fill();
      // head
      ctx.beginPath(); ctx.ellipse(cx, cy, 95, 105, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#111827"; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = ring; ctx.stroke();
      // ears
      for (const [ex, ey, rot] of [[-55, -70, -0.5], [55, -70, 0.5]] as const) {
        ctx.save(); ctx.translate(cx + ex, cy + ey); ctx.rotate(rot);
        ctx.beginPath(); ctx.moveTo(0, -38); ctx.lineTo(-24, 28); ctx.lineTo(24, 28); ctx.closePath();
        ctx.fillStyle = "#1e293b"; ctx.fill(); ctx.strokeStyle = ring; ctx.lineWidth = 2; ctx.stroke();
        ctx.restore();
      }
      // eyes
      for (const ex of [-42, 42]) {
        const eyelid = Math.sin(i * 0.05) * 1.5;
        ctx.beginPath(); ctx.arc(cx + ex, cy - 18, 13, 0, Math.PI * 2);
        ctx.fillStyle = "#0b1220"; ctx.fill(); ctx.strokeStyle = ring; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.beginPath(); ctx.arc(cx + ex, cy - 18 + eyelid, 5, 0, Math.PI * 2); ctx.fillStyle = ring; ctx.fill();
      }
      // brows glow when talking
      if (m > 0.1) {
        ctx.strokeStyle = ring; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(cx - 62, cy - 42); ctx.lineTo(cx - 22, cy - 38); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + 62, cy - 42); ctx.lineTo(cx + 22, cy - 38); ctx.stroke();
      }
      // mouth — opens with amplitude
      const mw = 34 + m * 18, mh = 2 + m * 30;
      ctx.beginPath(); ctx.ellipse(cx, cy + 36, mw, mh, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#450a0a"; ctx.fill(); ctx.strokeStyle = ring; ctx.lineWidth = 2; ctx.stroke();
      // inner tongue hint when open
      if (m > 0.45) { ctx.beginPath(); ctx.ellipse(cx, cy + 46, mw * 0.5, mh * 0.5, 0, 0, Math.PI); ctx.fillStyle = "rgba(220,38,38,0.7)"; ctx.fill(); }
      // bot label
      ctx.fillStyle = ACCENT.gold; ctx.font = "700 22px sans-serif"; ctx.textAlign = "center";
      ctx.fillText("HARLY", cx, cy + 118);
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [glow]);

  /* ── mic → mouth (you talk) ── */
  async function toggleMic() {
    if (micOn) { streamRef.current?.getTracks().forEach(t => t.stop()); audioCtxRef.current?.close(); audioRef.current = null; setMicOn(false); targetMouthRef.current = 0; return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const actx = new Ctx();
      const src = actx.createMediaStreamSource(stream);
      const analyser = actx.createAnalyser(); analyser.fftSize = 256;
      src.connect(analyser);
      audioCtxRef.current = actx; streamRef.current = stream; audioRef.current = analyser;
      setMicOn(true);
      // analyser loop
      const data = new Uint8Array(analyser.frequencyBinCount);
      const listen = () => {
        const an = audioRef.current;
        if (!an) return;
        an.getByteFrequencyData(data);
        let avg = 0; for (let j = 0; j < data.length; j++) avg += data[j]; avg /= data.length;
        const norm = Math.min(1, avg / 70);
        targetMouthRef.current = micOn ? Math.max(targetMouthRef.current, norm) : 0;
        requestAnimationFrame(listen);
      };
      listen();
    } catch { alert("Microphone access denied — lip-sync needs your mic for 'you talk'."); }
  }

  /* ── TTS wolf voice + lip-sync when he speaks ── */
  function speak(text: string) {
    if (!voice || !("speechSynthesis" in window)) return;
    // prime browser audio once (user gesture already happened — send click)
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (wolfVoice) u.voice = window.speechSynthesis.getVoices().find(v => v.name === wolfVoice) || u.voice;
    u.rate = speed;
    // mouth tracks speech — use a pulse during utterance with boundary refinement
    u.onstart = () => { targetMouthRef.current = 0.8; };
    u.onboundary = () => { targetMouthRef.current = 0.45 + Math.random() * 0.4; };
    u.onend = () => { targetMouthRef.current = 0; };
    u.onerror = () => { targetMouthRef.current = 0; };
    window.speechSynthesis.speak(u);
  }

  function push(msg: Msg) {
    setMessages(prev => [...prev.slice(-60), msg]);
    setTimeout(() => logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" }), 60);
  }

  const sendWrapped = async () => {
    const msg = prompt.trim(); if (!msg || busy) return;
    push({ role: "user", text: msg }); setPrompt(""); setBusy(true);
    targetMouthRef.current = 0.5; // user typed, brief mouth pulse
    try {
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: msg, message: msg }) });
      const data = await res.json().catch(() => ({}));
      const reply = data.response ?? data.reply ?? data.output ?? data.message ?? JSON.stringify(data);
      push({ role: "wolf", text: String(reply) });
      speak(String(reply));
    } catch (e) {
      push({ role: "wolf", text: "Request failed: " + (e instanceof Error ? e.message : e) });
    } finally { setBusy(false); }
  };

  // boot wolf greeting (after first click to satisfy autoplay)
  useEffect(() => {
    if (voice && !bootSpoke.current && "speechSynthesis" in window) {
      const prime = () => { if (bootSpoke.current) return; bootSpoke.current = true; speak("The wolf is online."); window.removeEventListener("pointerdown", prime); };
      window.addEventListener("pointerdown", prime);
      return () => window.removeEventListener("pointerdown", prime);
    }
  }, [voice]);

  return (
    <main className="min-h-screen relative overflow-hidden" style={{ background: `radial-gradient(1300px 700px at 20% -10%, ${ACCENT.blue} 0%, #05070d 50%, #02040a 100%)`, color: ACCENT.on }}>
      {/* grid + glow */}
      <div className="absolute inset-0 pointer-events-none opacity-35" style={{ backgroundImage: `linear-gradient(rgba(34,211,238,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(34,211,238,0.05) 1px,transparent 1px)`, backgroundSize: "44px 44px" }} />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-3xl opacity-25 pointer-events-none" style={{ background: `radial-gradient(circle, ${ring}, transparent 70%)` }} />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-6">
        {/* top bar */}
        <header className="flex items-center justify-between border-b pb-4" style={{ borderColor: ACCENT.blueL }}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl border flex items-center justify-center relative" style={{ borderColor: ring, boxShadow: `0 0 26px ${ring}66`, background: ACCENT.blue }}>
              <Cpu size={20} style={{ color: ring }} />
              <span className="absolute -inset-1 rounded-xl border opacity-40 animate-ping" style={{ borderColor: ring }} />
            </div>
            <div>
              <div className="text-[11px] font-mono uppercase tracking-[0.3em]" style={{ color: ACCENT.mut }}>Agent OS · Talk Interface</div>
              <div className="text-xl font-bold tracking-widest" style={{ color: ACCENT.gold }}>HARLY — The Wolf</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border" style={{ borderColor: ACCENT.blueL, background: "#0a0f1c", color: ACCENT.cyan }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: ACCENT.gold }} /> {micOn ? "MIC ON" : "ONLINE"}
            </span>
            <button onClick={() => setGlow(g => g === "gold" ? "cyan" : "gold")} style={{ borderColor: ACCENT.blueL, color: ACCENT.mut, background: "#0a0f1c" }} className="px-3 py-1 rounded-full border">{glow.toUpperCase()}</button>
            <button onClick={() => setVoice(v => !v)} style={{ borderColor: ACCENT.blueL, color: voice ? ring : ACCENT.mut, background: "#0a0f1c" }} className="px-3 py-1 rounded-full border inline-flex items-center gap-1.5">{voice ? <Volume2 size={13}/> : <VolumeX size={13}/>} VOICE {voice ? "ON":"OFF"}</button>
          </div>
        </header>

        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          {/* wolf avatar */}
          <div className="rounded-2xl border p-4 flex flex-col items-center justify-center" style={{ borderColor: ACCENT.blueL, background: "linear-gradient(180deg,#0a0f1c,#060a12)" }}>
            <div className="relative w-[220px] h-[240px]">
              <canvas ref={canvasRef} className="w-full h-full" />
              {!micOn && <div className="absolute bottom-1 inset-x-0 text-center text-[10px] font-mono" style={{ color: ACCENT.mut }}>toggle mic to make the wolf hear you</div>}
            </div>
            <button onClick={toggleMic} className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold border transition-colors" style={{ borderColor: ring, color: micOn ? "#02040a" : "#fff", background: micOn ? ring : "transparent", boxShadow: micOn ? `0 0 24px ${ring}55` : "none" }}>
              <Mic size={16} /> {micOn ? "Stop listening" : "Talk to the wolf"}
            </button>
          </div>

          {/* chat + controls */}
          <div className="flex flex-col gap-4">
            {/* controls */}
            <div className="rounded-xl border p-4 grid grid-cols-2 md:grid-cols-4 gap-3" style={{ borderColor: ACCENT.blueL, background: "linear-gradient(180deg,#0a0f1c,#060a12)" }}>
              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider" style={{ color: ACCENT.mut }}>Wolf voice</label>
                <select value={wolfVoice} onChange={e => setWolfVoice(e.target.value)} style={{ background: "#0f172a", color: ACCENT.on, borderColor: ACCENT.blueL }} className="mt-1 w-full px-2 py-1.5 rounded border text-sm">
                  <option value="">Default</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider" style={{ color: ACCENT.mut }}>Speed</label>
                <input type="range" min="0.7" max="1.5" step="0.1" value={speed} onChange={e => setSpeed(parseFloat(e.target.value))} className="mt-1 w-full" />
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider" style={{ color: ACCENT.mut }}>Endpoint</label>
                <input value={endpoint} onChange={e => setEndpoint(e.target.value)} className="mt-1 w-full px-2 py-1.5 rounded border text-sm" style={{ background: "#0f172a", color: ACCENT.on, borderColor: ACCENT.blueL }} />
              </div>
              <div className="flex items-end">
                <button onClick={() => setMessages([{ role: "wolf", text: "The wolf is online. Ask me anything." }])} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-semibold" style={{ background: ACCENT.blueL, color: ACCENT.on }}>
                  <RefreshCw size={13} /> Clear
                </button>
              </div>
            </div>

            {/* conversation log */}
            <div ref={logRef} className="rounded-xl border p-4 flex-1 overflow-auto space-y-2.5 min-h-[320px] max-h-[380px]" style={{ borderColor: ACCENT.blueL, background: "linear-gradient(180deg,#0a0f1c,#060a12)" }}>
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[85%] px-3.5 py-2.5 rounded-xl text-sm leading-relaxed" style={{ background: m.role === "user" ? ACCENT.blueL : "#081225", border: `1px solid ${m.role === "user" ? ACCENT.blueL : "rgba(200,168,107,0.25)"}`, color: ACCENT.on }}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            {/* composer */}
            <div className="flex items-center gap-2">
              <input
                value={prompt} onChange={e => setPrompt(e.target.value)} onKeyDown={e => { if (e.key === "Enter") sendWrapped(); }}
                placeholder="Talk to the wolf…" disabled={busy}
                className="flex-1 px-4 py-3 rounded-xl border text-sm" style={{ background: "#0f172a", color: ACCENT.on, borderColor: ACCENT.blueL, boxShadow: `inset 0 0 0 1px transparent` }}
              />
              <button onClick={sendWrapped} disabled={busy || !prompt.trim()} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50" style={{ background: ring, color: "#02040a", boxShadow: `0 0 22px ${ring}44` }}>
                {busy ? <Radio size={16} className="animate-pulse"/> : <Send size={16} />} {busy ? "Working…" : "Send"}
              </button>
            </div>
          </div>
        </div>

        <footer className="mt-6 border-t pt-3 flex justify-between text-[10px] font-mono" style={{ borderColor: ACCENT.blueL, color: ACCENT.mut }}>
          <span>lip-sync via mic (you) + TTS (wolf) · backend: {endpoint}</span>
          <span className="inline-flex items-center gap-1"><Settings2 size={11}/> CHV000 · HotelsVendors Agent OS</span>
        </footer>
      </div>
    </main>
  );
}