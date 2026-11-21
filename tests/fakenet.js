// Faux réseau de test (même API que js/net.js) : parle au faux serveur au lieu de Firebase.
// Quand tu ajoutes une fonction à js/net.js, ajoute-la ici aussi.
export let uid = null;
export const now = () => Date.now();
const cid = "c" + Math.random().toString(36).slice(2);
const op = (o) => fetch("/__db/op", { method: "POST", body: JSON.stringify(o) }).then((r) => r.json());
const TS = { ".sv": "timestamp" };
const R = (code, p = "") => `rooms/${code}${p ? "/" + p : ""}`;
const parse = (v) => { if (v == null) return null; try { return JSON.parse(v); } catch { return null; } };
export async function init() {
  // comme Firebase (connexion anonyme), le joueur garde le même identifiant quand il revient sur le même navigateur
  try { uid = localStorage.getItem("fake_uid"); } catch {}
  if (!uid) { uid = "u" + Math.random().toString(36).slice(2, 9); try { localStorage.setItem("fake_uid", uid); } catch {} }
  return uid;
}
export async function roomExists(code) { return (await op({ op: "get", path: R(code, "meta") })).value; }
export async function createRoom(code, member) { await op({ op: "set", path: R(code, "meta"), value: { host: uid, created: TS } }); await joinRoom(code, member); }
// presence : le faux serveur passe le joueur hors ligne quand sa connexion se ferme (comme onDisconnect de Firebase)
export async function joinRoom(code, member) { ensure(); await op({ op: "update", path: R(code, `members/${uid}`), value: { ...member, online: true, seen: TS }, presence: cid }); }
export function updateMember(code, data) { return op({ op: "update", path: R(code, `members/${uid}`), value: data }); }
let es = null; const subs = {}; let sidN = 0;
function ensure() { if (es) return; es = new EventSource("/__db/stream?cid=" + cid); es.onmessage = (e) => { const m = JSON.parse(e.data); if (subs[m.sid]) subs[m.sid](m.v); }; }
export function listen(code, path, cb, json = false) { ensure(); const sid = "s" + (sidN++); subs[sid] = (v) => cb(json ? parse(v) : v); const go = () => fetch("/__db/sub", { method: "POST", body: JSON.stringify({ cid, sid, path: R(code, path) }) }); if (es.readyState === 1) go(); else es.addEventListener("open", go, { once: true }); return () => { delete subs[sid]; fetch("/__db/sub", { method: "POST", body: JSON.stringify({ sid, unsub: true }) }); }; }
export function setInput(code, field, value) { return op({ op: "set", path: R(code, `input/${uid}/${field}`), value: JSON.stringify(value) }); }
export function sendTaunt(code, data) { return op({ op: "push", path: R(code, "taunts"), value: { ...data, t: TS } }); }
export function writeState(code, state) { return op({ op: "set", path: R(code, "state"), value: { seq: state.seq, json: JSON.stringify(state) } }); }
export function writePrivate(code, seatUid, data) { return op({ op: "set", path: R(code, `private/${seatUid}`), value: JSON.stringify(data) }); }
export async function readState(code) { const v = (await op({ op: "get", path: R(code, "state") })).value; return v ? parse(v.json) : null; }
export async function readPrivate(code, seatUid) { return parse((await op({ op: "get", path: R(code, `private/${seatUid}`) })).value); }
export function listenInput(code, seatUid, cb) { return listen(code, `input/${seatUid}`, (v) => { v = v || {}; const o = {}; for (const k of Object.keys(v)) o[k] = parse(v[k]); cb(o); }); }
export function setHost(code, h) { return op({ op: "update", path: R(code, "meta"), value: { host: h } }); }
export function updateMeta(code, data) { return op({ op: "update", path: R(code, "meta"), value: data }); }
export function sendWhisper(code, to, data) { return op({ op: "push", path: R(code, `whispers/${to}`), value: { ...data, t: TS } }); }
export function listenWhispers(code, who, cb) { return listen(code, `whispers/${who}`, (v) => cb(v || {})); }
