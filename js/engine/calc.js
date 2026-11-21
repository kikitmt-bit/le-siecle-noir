// Calculs sur la carte, chronique, situation des dilemmes
import { PROVINCES, REGIONS } from "../map.js?v=1795297246";
import { PROV_IDS, maisonName, peurBonus, yearOf } from "./core.js?v=1795297246";
import { heirs, king, kingLabel, personTitle, queen } from "./people.js?v=1795297246";
import { bound, marriageable } from "./succession.js?v=1795297246";

// ---------- calculs ----------
export function provincesOf(state, pid) { return PROV_IDS.filter((id) => state.provinces[id].owner === pid); }

export function regionsOf(state, pid) { return Object.keys(REGIONS).filter((r) => REGIONS[r].provs.every((p) => state.provinces[p].owner === pid)); }

export function allied(state, a, b) { return state.alliances.some((x) => (x.a === a && x.b === b) || (x.a === b && x.b === a)); }

export function attackMod(state, pid) {
  const k = king(state, pid);
  if (!k) return 0;
  return (k.trait === "Brillant stratège" || k.trait === "Sanguinaire" ? 1 : 0) - (k.trait === "Lâche" ? 1 : 0);
}

export function winProb(att, def) {
  let w = 0;
  for (let a = 0; a < 3; a++) for (let d = 0; d < 3; d++) if (att + a > def + d) w++;
  return w / 9;
}

export function defenseOf(state, prov, outgoing = 0) {
  const p = state.provinces[prov];
  return Math.max(0, p.armies - outgoing) + peurBonus(state.players[p.owner]);
}

export function computeLeader(state) {
  let best = null, bv = -1e9, tie = false;
  for (const pid of state.order) {
    const v = state.players[pid].prestige + provincesOf(state, pid).length * 0.01;
    if (v > bv) { bv = v; best = pid; tie = false; } else if (v === bv) tie = true;
  }
  state.leader = tie ? null : best;
}


// ---------- chronique ----------
export function chron(state, text, kind = "text", extra = null) {
  state.chronicle.push({ round: state.round, year: yearOf(Math.max(1, state.round)), text, kind, ...(extra || {}) });
}

// la situation d'un dilemme en une ou deux phrases, pour que les autres joueurs comprennent
export function situationOf(text) {
  const parts = String(text).split(/(?<=[.!?…])\s+/);
  let out = parts[0] || "";
  if (out.length < 70 && parts[1]) out += " " + parts[1];
  return out;
}

export function ctxFor(state, pid, extra = {}) {
  const pl = state.players[pid];
  const cap = pl && pl.capital ? PROVINCES[pl.capital].city : "la capitale";
  const h = heirs(state, pid);
  const fam = state.families[pid];
  const alive = fam ? fam.members.filter((m) => m.alive) : [];
  const daughter = alive.find((m) => m.role === "child" && m.sex === "f" && m.age >= 14 && !m.spouse);
  const son = alive.find((m) => m.role === "child" && m.sex === "m" && m.age >= 16);
  const bast = alive.find((m) => m.role === "child" && m.bastard && !m.legit);
  const brecu = alive.find((m) => m.role === "child" && m.bastardOf && m.bastardOf !== pid);
  const q = queen(state, pid);
  return {
    roi: kingLabel(state, pid), maison: maisonName(state, pid), cap,
    heritier: h[0] ? personTitle(h[0]) : "l'héritier", heritier_trait: h[0] ? (h[0].trait || "").toLowerCase() : "",
    fille: daughter ? personTitle(daughter) : "ta fille", fils: son ? personTitle(son) : "ton fils",
    batard: bast ? personTitle(bast) : "le bâtard", batard_recu: brecu ? personTitle(brecu) : "cet enfant",
    reine: q ? `la reine ${personTitle(q)}` : "la reine", fille_ou_reine: daughter ? personTitle(daughter) : q ? `la reine ${personTitle(q)}` : "ta propre famille",
    leader: state.leader ? maisonName(state, state.leader) : "le plus puissant",
    ...extra,
  };
}

export function revealDuration(state) {
  const n = state.reveal ? state.reveal.steps.length : 0;
  return Math.min(26, Math.max(5, 2 + n * 1.6));
}


export function intrigueProb(value, bonus, need) { let w = 0; for (let r = 0; r < 4; r++) if (value + bonus + r >= need + 2) w++; return w / 4; }

export function canPropose(state, from, to, kind = "marriage") {
  if (from === to || !state.players[from] || !state.players[to]) return false;
  if (state.players[to].isBot && !state.players[to].ai) return false;
  if (kind === "treaty") return !bound(state, from, to);
  return !allied(state, from, to) && state.players[from].peur < 50 && !!marriageable(state, from) && !!marriageable(state, to);
}

export function ordersTime(round) { return round <= 3 ? 90 : 60; }
