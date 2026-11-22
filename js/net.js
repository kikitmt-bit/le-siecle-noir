// =====================================================================
//  Couche réseau Firebase (Realtime Database + connexion anonyme)
//  Toutes les données de jeu circulent en JSON texte pour éviter les surprises de Firebase
//  (tableaux vides supprimés, clés interdites…).
// =====================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged, setPersistence, inMemoryPersistence } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getDatabase, ref, set, get, update, onValue, push, onDisconnect, serverTimestamp, off } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";
import { firebaseConfig } from "./firebase-config.js?v=1795376900";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

export let uid = null;
let offset = 0;
export const now = () => Date.now() + offset;

export function init() {
  onValue(ref(db, ".info/serverTimeOffset"), (s) => { offset = s.val() || 0; });
  const test = new URLSearchParams(location.search).has("test");
  return (test ? setPersistence(auth, inMemoryPersistence) : Promise.resolve()).then(() => new Promise((resolve, reject) => {
    onAuthStateChanged(auth, (u) => { if (u) { uid = u.uid; resolve(uid); } });
    signInAnonymously(auth).catch(reject);
  }));
}

const R = (code, path = "") => ref(db, `rooms/${code}${path ? "/" + path : ""}`);
const parse = (v) => { if (v == null) return null; try { return JSON.parse(v); } catch { return null; } };

export async function roomExists(code) { const s = await get(R(code, "meta")); return s.exists() ? s.val() : null; }

export async function createRoom(code, member) {
  await set(R(code, "meta"), { host: uid, created: serverTimestamp() });
  await joinRoom(code, member);
}
export async function joinRoom(code, member) {
  const mref = R(code, `members/${uid}`);
  await update(mref, { ...member, online: true, seen: serverTimestamp() });
  onDisconnect(mref).update({ online: false, seen: serverTimestamp() });
  // présence : si la connexion revient, on se remet en ligne
  onValue(ref(db, ".info/connected"), (s) => {
    if (s.val() === true) { update(mref, { online: true, seen: serverTimestamp() }); onDisconnect(mref).update({ online: false, seen: serverTimestamp() }); }
  });
}
export function updateMember(code, data) { return update(R(code, `members/${uid}`), data); }

export function listen(code, path, cb, json = false) {
  const r = R(code, path);
  const h = onValue(r, (s) => cb(json ? parse(s.val()) : s.val()));
  return () => off(r, "value", h);
}

// ---- côté joueur ----
export function setInput(code, field, value) { return set(R(code, `input/${uid}/${field}`), JSON.stringify(value)); }
export function sendTaunt(code, data) { return push(R(code, "taunts"), { ...data, t: serverTimestamp() }); }

// ---- côté arbitre ----
export function writeState(code, state) { return set(R(code, "state"), { seq: state.seq, json: JSON.stringify(state) }); }
export function writePrivate(code, seatUid, data) { return set(R(code, `private/${seatUid}`), JSON.stringify(data)); }
export async function readState(code) { const s = await get(R(code, "state")); return s.exists() ? parse(s.val().json) : null; }
export async function readPrivate(code, seatUid) { const s = await get(R(code, `private/${seatUid}`)); return parse(s.val()); }
export function listenInput(code, seatUid, cb) {
  const r = R(code, `input/${seatUid}`);
  const h = onValue(r, (s) => { const v = s.val() || {}; const o = {}; for (const k of Object.keys(v)) o[k] = parse(v[k]); cb(o); });
  return () => off(r, "value", h);
}
export function setHost(code, newHost) { return update(R(code, "meta"), { host: newHost }); }
export function updateMeta(code, data) { return update(R(code, "meta"), data); }
export function sendWhisper(code, to, data) { return push(R(code, `whispers/${to}`), { ...data, t: serverTimestamp() }); }
export function listenWhispers(code, who, cb) { return listen(code, `whispers/${who}`, (v) => cb(v || {})); }
