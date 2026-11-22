// Famille : accesseurs et création des personnages
import { HOUSES, INFIRMITIES, NAMES, PORTRAITS, TRAIT_POOL } from "../content.js?v=1795368011";
import { pick, uid } from "./core.js?v=1795368011";

// ---------- famille ----------
export function family(state, pid) { return state.families[pid]; }

export function personById(state, ref) {
  if (!ref) return null;
  const f = state.families[ref.pid];
  return f ? f.members.find((m) => m.id === ref.id) : null;
}

export function king(state, pid) { const f = state.families[pid]; return f ? f.members.find((m) => m.id === f.kingId && m.alive) : null; }

export function consort(state, pid) { const f = state.families[pid]; const q = f && personById(state, f.queenRef); return q && q.alive ? q : null; }

// la reine (épouse d'un roi) ; null si le souverain est une femme
export function queen(state, pid) { const k = king(state, pid); const c = consort(state, pid); return k && k.sex === "m" && c && c.sex === "f" ? c : null; }

// la mère des futurs enfants du souverain
export function mother(state, pid) { const k = king(state, pid); if (!k) return null; if (k.sex === "f") return consort(state, pid) ? k : null; return queen(state, pid); }

export function ownerOf(state, person) { for (const p of Object.keys(state.families)) if (state.families[p].members.includes(person)) return p; return null; }

export function deName(state, pid) { const pl = state.players[pid]; if (!pl) return "des rebelles"; if (pl.house === "anglais") return "d'Angleterre"; const n = pl.hname || HOUSES[pl.house].name; return /^[AEIOUÂÉ]/i.test(n) ? "d'" + n : "de " + n; }

export const FEM = { "le Boucher": "la Bouchère", "l'Empoisonneur": "l'Empoisonneuse", "le Traître": "la Traîtresse", "le Cruel": "la Cruelle", "le Maudit": "la Maudite", "le Parricide": "la Parricide", "l'Étrangleur": "l'Étrangleuse", "le Pestilentiel": "la Pestilentielle", "le Tricheur": "la Tricheuse", "le Couard": "la Couarde" };

export function personTitle(p) {
  if (!p) return "personne";
  let ep = p.epithets && p.epithets.length ? p.epithets[p.epithets.length - 1] : p.infirm;
  if (ep && p.sex === "f" && FEM[ep]) ep = FEM[ep];
  return ep ? `${p.name} ${ep}` : p.name;
}

export function kingLabel(state, pid) {
  const k = king(state, pid);
  if (!k) return "le trône vacant";
  return `${k.sex === "f" ? "la reine" : "le roi"} ${personTitle(k)}`;
}

export function heirs(state, pid) {
  const f = state.families[pid];
  if (!f) return [];
  const c = f.members.filter((m) => m.alive && m.role === "child" && (!m.bastard || m.legit));
  return c.sort((a, b) => (a.sex === b.sex ? b.age - a.age : a.sex === "m" ? -1 : 1));
}

// tous les prénoms déjà portés dans la partie (pour ne jamais avoir deux « Guy » qu'on confond)
// (contient aussi les visages déjà attribués, sous la forme « face:<clé> »)
export function takenNames(state) { const s = new Set(); for (const f of Object.values(state.families || {})) for (const m of f.members) { s.add(m.name); if (m.face) s.add(`face:${m.face}`); } return s; }

// Visage gravé d'un personnage : choisi d'après son identifiant (aucun tirage aléatoire en plus),
// parmi les visages encore libres dans la partie s'il en reste, en préférant :
// - un visage qui montre son infirmité (le Gros a un visage gras, la Grêlée la peau grêlée…) ;
// - les cheveux d'un parent pour un enfant (air de famille) ;
// - pas de défaut voyant (louche, goitre, moustache, calvitie) chez qui n'a pas cette infirmité, ni chez un Séduisant.
const INFIRM_TAG = [[/Gros/, "gros"], [/Chauve/, "chauve"], [/Grêlée/, "grelee"], [/Bigleu/, "bigleux"], [/Goitreu/, "goitreux"], [/Moustachue/, "moustachue"]];
const LOUD = ["bigleux", "goitreux", "moustachue", "chauve"];
function hashStr(t) { let h = 2166136261; for (let i = 0; i < t.length; i++) h = Math.imul(h ^ t.charCodeAt(i), 16777619); return h >>> 0; }
export function faceTags(key) {
  if (!key) return [];
  for (const list of Object.values(PORTRAITS)) { const e = list.find((x) => x[0] === key); if (e) return e[1].split(" "); }
  return [];
}
export function faceHair(key) { return faceTags(key).find((t) => ["brun", "noir", "roux", "blond", "chatain"].includes(t)) || null; }
export function pickFace(id, sex, taken = null, { infirm = null, trait = null, hair = null, kid = false } = {}) {
  const pool = PORTRAITS[(kid ? "kid_" : "") + sex] || [];
  if (!pool.length) return null;
  const want = (INFIRM_TAG.find(([re]) => re.test(infirm || "")) || [])[1] || null;
  const score = ([, t]) => {
    const tags = t.split(" ");
    let v = 0;
    if (want && tags.includes(want)) v += 4;
    if (hair && tags.includes(hair)) v += 2;
    v -= tags.filter((x) => LOUD.includes(x) && x !== want).length * 2;
    if (trait === "Séduisant" && tags.includes("gros")) v -= 2;
    return v;
  };
  const free = taken ? pool.filter(([k]) => !taken.has(`face:${k}`)) : pool;
  const from = free.length ? free : pool;
  const best = Math.max(...from.map(score));
  const top = from.filter((e) => score(e) === best);
  const face = top[hashStr(String(id) + (kid ? "k" : "")) % top.length][0];
  if (taken) taken.add(`face:${face}`);
  return face;
}
// cheveux d'un des deux parents (choisi d'après l'identifiant de l'enfant)
function parentHair(id, parents) {
  const hs = (parents || []).filter(Boolean).map((p) => faceHair(p.face)).filter(Boolean);
  return hs.length ? hs[hashStr(String(id)) % hs.length] : null;
}

export function newPerson(rng, { sex, age, house, role, bastard = false, bastardOf = null, consanguin = false, taken = null, parents = null }) {
  const en = house === "anglais";
  const pool = sex === "m" ? (en ? NAMES.en_m : NAMES.m) : en ? NAMES.en_f : NAMES.f;
  let name = pick(rng, pool);
  if (taken) {
    const free = pool.filter((n) => !taken.has(n));
    name = free.length ? pick(rng, free) : `${pick(rng, pool)} le Jeune`;
    taken.add(name);
  }
  let trait = pick(rng, TRAIT_POOL);
  let infirm = rng() < 0.28 ? pick(rng, INFIRMITIES[sex]) : null;
  if (consanguin && rng() < 0.55) { trait = pick(rng, ["Simple d'esprit", "Fragile", "Cruel"]); if (!infirm) infirm = pick(rng, INFIRMITIES[sex]); }
  const health = trait === "Fragile" ? 2 : age < 40 ? 0 : age < 55 ? 1 : 2;
  const id = uid(rng);
  // visage adulte, puis visage d'enfant aux mêmes cheveux pour qu'il reste reconnaissable en grandissant
  const face = pickFace(id, sex, taken, { infirm, trait, hair: parentHair(id, parents) });
  const kid = age < 16 ? pickFace(id, sex, taken, { hair: faceHair(face), kid: true }) : null;
  return { id, name, sex, age, trait, infirm, epithets: [], health, alive: true, role, bastard, legit: !bastard, bastardOf, spouse: null, cause: null, face, kid };
}

export function makeFamily(rng, house, taken = new Set()) {
  const k = newPerson(rng, { sex: "m", age: 40 + Math.floor(rng() * 16), house, role: "king", taken });
  const q = newPerson(rng, { sex: "f", age: 25 + Math.floor(rng() * 11), house, role: "queen", taken });
  const c1 = newPerson(rng, { sex: rng() < 0.6 ? "m" : "f", age: 14 + Math.floor(rng() * 7), house, role: "child", taken, parents: [k, q] });
  const c2 = newPerson(rng, { sex: rng() < 0.5 ? "m" : "f", age: 6 + Math.floor(rng() * 9), house, role: "child", taken, parents: [k, q] });
  return { members: [k, q, c1, c2], kingId: k.id, queenRef: null, consanguin: false, house };
}
