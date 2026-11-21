// =====================================================================
//  Réseau « local » pour le mode solo : même interface que net.js,
//  mais tout reste dans la mémoire du navigateur (aucun serveur).
// =====================================================================
export let uid = "solo-joueur";
export const now = () => Date.now();
let tree = {};
const subs = new Set();
const parts = (p) => p.split("/").filter(Boolean);
function getAt(p) { let n = tree; for (const k of parts(p)) { if (n == null || typeof n !== "object") return null; n = n[k]; } return n === undefined ? null : n; }
function setAt(p, v) {
  const ks = parts(p); let n = tree;
  for (let i = 0; i < ks.length - 1; i++) { if (typeof n[ks[i]] !== "object" || n[ks[i]] == null) n[ks[i]] = {}; n = n[ks[i]]; }
  if (v === null || v === undefined) delete n[ks[ks.length - 1]]; else n[ks[ks.length - 1]] = v;
}
const clone = (v) => (v == null ? null : JSON.parse(JSON.stringify(v)));
function notify(p) { for (const s of subs) if (s.path.startsWith(p) || p.startsWith(s.path)) { const v = clone(getAt(s.path)); setTimeout(() => s.cb(v), 0); } }
const R = (code, p = "") => `rooms/${code}${p ? "/" + p : ""}`;
const parse = (v) => { if (v == null) return null; try { return JSON.parse(v); } catch { return null; } };
let pushN = 0;

export async function init() { return uid; }
export async function roomExists(code) { return clone(getAt(R(code, "meta"))); }
export async function createRoom(code, member) { tree = {}; setAt(R(code, "meta"), { host: uid, created: Date.now() }); notify(R(code, "meta")); await joinRoom(code, member); }
export async function joinRoom(code, member) { const p = R(code, `members/${uid}`); setAt(p, { ...(getAt(p) || {}), ...member, online: true, seen: Date.now() }); notify(p); }
export async function updateMember(code, data) { const p = R(code, `members/${uid}`); setAt(p, { ...(getAt(p) || {}), ...data }); notify(p); }
export async function updateMeta(code, data) { const p = R(code, "meta"); setAt(p, { ...(getAt(p) || {}), ...data }); notify(p); }
export function listen(code, path, cb, json = false) {
  const s = { path: R(code, path), cb: (v) => cb(json ? parse(v) : v) };
  subs.add(s); const v = clone(getAt(s.path)); setTimeout(() => s.cb(v), 0);
  return () => subs.delete(s);
}
export async function setInput(code, field, value) { const p = R(code, `input/${uid}/${field}`); setAt(p, JSON.stringify(value)); notify(p); }
export async function sendTaunt(code, data) { const p = R(code, `taunts/t${Date.now()}_${pushN++}`); setAt(p, { ...data, t: Date.now() }); notify(p); }
export async function sendWhisper(code, to, data) { const p = R(code, `whispers/${to}/w${Date.now()}_${pushN++}`); setAt(p, { ...data, t: Date.now() }); notify(p); }
export function listenWhispers(code, who, cb) { return listen(code, `whispers/${who}`, (v) => cb(v || {})); }
export async function writeState(code, state) { const p = R(code, "state"); setAt(p, { seq: state.seq, json: JSON.stringify(state) }); notify(p); }
export async function writePrivate(code, seatUid, data) { const p = R(code, `private/${seatUid}`); setAt(p, JSON.stringify(data)); notify(p); }
export async function readState(code) { const v = getAt(R(code, "state")); return v ? parse(v.json) : null; }
export async function readPrivate(code, seatUid) { return parse(getAt(R(code, `private/${seatUid}`))); }
export function listenInput(code, seatUid, cb) { return listen(code, `input/${seatUid}`, (v) => { v = v || {}; const o = {}; for (const k of Object.keys(v)) o[k] = parse(v[k]); cb(o); }); }
export async function setHost(code, h) { await updateMeta(code, { host: h }); }
