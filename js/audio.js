// =====================================================================
//  Sons générés à la volée (Web Audio) : aucun fichier à télécharger
// =====================================================================
let ctx = null, master = null;
let muted = false;
try { muted = localStorage.getItem("sn_muted") === "1"; } catch {}

export function isMuted() { return muted; }
export function setMuted(m) { muted = m; try { localStorage.setItem("sn_muted", m ? "1" : "0"); } catch {} if (master) master.gain.value = m ? 0 : 0.55; }
export function unlock() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = muted ? 0 : 0.55; master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
}

function env(node, t, a, d, peak = 1) { const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); node.connect(g); g.connect(master); return g; }
function osc(type, f, t, a, d, peak, detune = 0) { const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.detune.value = detune; env(o, t, a, d, peak); o.start(t); o.stop(t + a + d + 0.05); return o; }
function noise(t, d, peak, filterType = "bandpass", freq = 1000, q = 1) {
  const len = Math.floor(ctx.sampleRate * (d + 0.1));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource(); src.buffer = buf;
  const f = ctx.createBiquadFilter(); f.type = filterType; f.frequency.value = freq; f.Q.value = q;
  src.connect(f); env(f, t, 0.005, d, peak); src.start(t); src.stop(t + d + 0.1);
}
function bell(f, t, d = 2.5, peak = 0.35) {
  [1, 2.01, 2.76, 4.07, 5.43].forEach((m, i) => osc("sine", f * m, t, 0.005, d / (1 + i * 0.6), peak / (1 + i * 1.2)));
}

const SOUNDS = {
  bell: (t) => { bell(392, t); },
  knell: (t) => { bell(147, t, 4, 0.45); bell(147, t + 1.6, 4, 0.35); },
  drum: (t) => { for (let i = 0; i < 4; i++) { osc("sine", 70, t + i * 0.22, 0.005, 0.3, 0.7); noise(t + i * 0.22, 0.12, 0.25, "lowpass", 400); } },
  battle: (t) => { SOUNDS.drum(t); for (let i = 0; i < 3; i++) { noise(t + 0.5 + i * 0.18, 0.15, 0.35, "highpass", 3000); osc("triangle", 1800 + Math.random() * 600, t + 0.5 + i * 0.18, 0.002, 0.35, 0.12); } },
  seal: (t) => { osc("sine", 110, t, 0.005, 0.25, 0.8); noise(t, 0.08, 0.3, "lowpass", 600); },
  dice: (t) => { for (let i = 0; i < 7; i++) noise(t + i * 0.06 + Math.random() * 0.03, 0.03, 0.4, "bandpass", 2500 + Math.random() * 1500, 4); },
  horn: (t) => { [0, 0.25, 0.5].forEach((dt, i) => { const o = osc("sawtooth", [262, 330, 392][i], t + dt, 0.04, 0.5, 0.12); }); },
  conquest: (t) => { SOUNDS.horn(t); },
  crows: (t) => { for (let i = 0; i < 3; i++) { const tt = t + i * 0.35; const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.setValueAtTime(700, tt); o.frequency.exponentialRampToValueAtTime(380, tt + 0.22); env(o, tt, 0.01, 0.22, 0.08); o.start(tt); o.stop(tt + 0.3); } },
  fanfare: (t) => { [[262, 0], [330, 0.18], [392, 0.36], [523, 0.54], [392, 0.9], [523, 1.08]].forEach(([f, dt]) => { osc("sawtooth", f, t + dt, 0.03, 0.45, 0.1); osc("square", f / 2, t + dt, 0.03, 0.45, 0.04); }); },
  coins: (t) => { for (let i = 0; i < 5; i++) osc("sine", 2200 + i * 180, t + i * 0.07, 0.002, 0.25, 0.12); },
  poison: (t) => { const o = ctx.createOscillator(); o.type = "triangle"; o.frequency.setValueAtTime(600, t); o.frequency.exponentialRampToValueAtTime(90, t + 1.2); env(o, t, 0.02, 1.2, 0.2); o.start(t); o.stop(t + 1.3); },
  birth: (t) => { [784, 988, 1175].forEach((f, i) => osc("sine", f, t + i * 0.12, 0.005, 0.8, 0.12)); },
  bells: (t) => { [523, 659, 784, 659].forEach((f, i) => bell(f, t + i * 0.3, 1.5, 0.18)); },
  betrayal: (t) => { osc("sawtooth", 220, t, 0.02, 0.9, 0.12); osc("sawtooth", 233, t, 0.02, 0.9, 0.12); },
  tick: (t) => { osc("square", 1500, t, 0.001, 0.04, 0.08); },
  click: (t) => { osc("triangle", 900, t, 0.001, 0.05, 0.08); },
  taunt: (t) => { osc("triangle", 500, t, 0.005, 0.12, 0.12); osc("triangle", 750, t + 0.1, 0.005, 0.15, 0.1); },
  plague: (t) => { SOUNDS.crows(t); osc("sine", 55, t, 0.3, 1.5, 0.2); },
  revolt: (t) => { for (let i = 0; i < 6; i++) noise(t + i * 0.1, 0.12, 0.2, "bandpass", 500 + Math.random() * 400, 2); },
};

export function play(name) {
  if (muted || !ctx || !SOUNDS[name]) return;
  try { SOUNDS[name](ctx.currentTime + 0.02); } catch {}
}
export function vibrate(pattern) { try { if (navigator.vibrate) navigator.vibrate(pattern); } catch {} }
