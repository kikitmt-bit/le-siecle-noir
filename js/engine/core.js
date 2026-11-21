// Constantes et petits utilitaires du moteur
import { HOUSES } from "../content.js?v=1795296252";
import { PROVINCES } from "../map.js?v=1795296252";

export const PROV_IDS = Object.keys(PROVINCES);

export const MAX_ROUNDS = 10;

export const START_YEAR = 1347;

export const COSTS = { poison: 4, seduction: 3, bribe: 6 };

export const NEED = { poison: 5, seduction: 4, bribe: 6 };

export const TIMES = { objectives: 30, draft: 15, placement: 45, dilemma: 35, orders: 75, interlude: 4 };

export const START_ARMIES = 12;

// Première partie : les règles se débloquent manche après manche
export const UNLOCK = { diplomacy: 1, intrigue: 2, hidden: 3 };

export const unlocked = (state, feature) => !state.tutorial || state.round >= UNLOCK[feature];

export const WIN_PROVINCES = 15;


// ---------- utilitaires ----------
export const deC = (c) => (/^[AEIOUÉÈÂ]/i.test(c) ? "d'" + c : "de " + c);

export const yearOf = (round) => START_YEAR + (round - 1) * 3;

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];

export const shuffle = (rng, arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export const uid = (rng) => Math.floor(rng() * 36 ** 6).toString(36);

export const MERC_COST = 4, MERC_ARMIES = 2;

export const levyAmount = (d) => (d <= 2 ? 2 : d <= 4 ? 3 : 4);

export const peurBonus = (pl) => (pl ? Math.floor((pl.peur || 0) / 25) : 0);


export function maisonName(state, pid, article = "la maison") {
  const pl = state.players[pid];
  if (!pl) return "les rebelles";
  if (pl.house === "anglais") return "la couronne d'Angleterre";
  const n = pl.hname || HOUSES[pl.house].name;
  return `${article} ${/^[AEIOUÂÉ]/i.test(n) ? "d'" : "de "}${n}`;
}

export function capitalize(s) {
  return s.replace(/(^|[.!?]\s+|«\s)([a-zàâéèêîôûç])/g, (m, a, b) => a + b.toUpperCase());
}

export function fill(tpl, ctx) {
  // contractions françaises après remplacement (« de le roi » → « du roi »)
  const t = String(tpl).replace(/\{(\w+)\}/g, (m, k) => (ctx[k] !== undefined ? ctx[k] : m))
    .replace(/\b([Dd])e le /g, "$1u ").replace(/\b([Dd])e les /g, "$1es ").replace(/(^|\s)([Àà]) le /g, (m, sp, a) => sp + (a === "À" ? "Au " : "au ")).replace(/(^|\s)([Àà]) les /g, (m, sp, a) => sp + (a === "À" ? "Aux " : "aux "));
  return capitalize(t);
}


// ---------- création de partie ----------
export function cleanHouseName(n) {
  n = String(n || "").replace(/^\s*(la\s+)?maison\s+(de\s+|d['’]\s*)?/i, "").replace(/[<>"]/g, "").trim().slice(0, 18);
  return n ? n.charAt(0).toUpperCase() + n.slice(1) : null;
}
