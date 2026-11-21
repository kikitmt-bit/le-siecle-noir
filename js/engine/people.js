// Famille : accesseurs et création des personnages
import { HOUSES, INFIRMITIES, NAMES, TRAIT_POOL } from "../content.js?v=1795297295";
import { pick, uid } from "./core.js?v=1795297295";

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

export function newPerson(rng, { sex, age, house, role, bastard = false, bastardOf = null, consanguin = false }) {
  const en = house === "anglais";
  const name = pick(rng, sex === "m" ? (en ? NAMES.en_m : NAMES.m) : en ? NAMES.en_f : NAMES.f);
  let trait = pick(rng, TRAIT_POOL);
  let infirm = rng() < 0.28 ? pick(rng, INFIRMITIES[sex]) : null;
  if (consanguin && rng() < 0.55) { trait = pick(rng, ["Simple d'esprit", "Fragile", "Cruel"]); if (!infirm) infirm = pick(rng, INFIRMITIES[sex]); }
  const health = trait === "Fragile" ? 2 : age < 40 ? 0 : age < 55 ? 1 : 2;
  return { id: uid(rng), name, sex, age, trait, infirm, epithets: [], health, alive: true, role, bastard, legit: !bastard, bastardOf, spouse: null, cause: null };
}

export function makeFamily(rng, house) {
  const k = newPerson(rng, { sex: "m", age: 40 + Math.floor(rng() * 16), house, role: "king" });
  const q = newPerson(rng, { sex: "f", age: 25 + Math.floor(rng() * 11), house, role: "queen" });
  const c1 = newPerson(rng, { sex: rng() < 0.6 ? "m" : "f", age: 14 + Math.floor(rng() * 7), house, role: "child" });
  const c2 = newPerson(rng, { sex: rng() < 0.5 ? "m" : "f", age: 6 + Math.floor(rng() * 9), house, role: "child" });
  return { members: [k, q, c1, c2], kingId: k.id, queenRef: null, consanguin: false, house };
}
