// Intelligence artificielle
import { DILEMMAS } from "../content.js?v=1795309716";
import { PROVINCES } from "../map.js?v=1795309716";
import { attackMod, canPropose, defenseOf, provincesOf, winProb } from "./calc.js?v=1795309716";
import { COSTS, MERC_COST, pick, unlocked } from "./core.js?v=1795309716";
import { heirs, mother } from "./people.js?v=1795309716";
import { realDice } from "./rounds.js?v=1795309716";
import { bound } from "./succession.js?v=1795309716";

// ---------- intelligence artificielle ----------
export const PERSONAS = {
  conquerant: { name: "le Conquérant", thr: 0.55, maxStrikes: 3, intrigue: 0.15, betray: 0.6, marry: 0.45, treaty: 0.3, w: { gold: 0.6, prestige: 1.2, armies: 1.6, colere: -0.06, peur: 0.04 } },
  intrigant: { name: "l'Intrigant", thr: 0.64, maxStrikes: 2, intrigue: 0.75, betray: 0.55, marry: 0.75, treaty: 0.65, w: { gold: 1.1, prestige: 1.5, armies: 0.8, colere: -0.1, peur: 0.02 } },
  prudent: { name: "le Prudent", thr: 0.78, maxStrikes: 1, intrigue: 0.1, betray: 0.2, marry: 0.85, treaty: 0.85, w: { gold: 1, prestige: 1.3, armies: 1.2, colere: -0.2, peur: -0.03 } },
  anglais: { name: "l'Anglais", thr: 0.66, maxStrikes: 2, intrigue: 0, betray: 0.7, marry: 0, treaty: 0, w: { gold: 0.5, prestige: 1, armies: 1.5, colere: -0.05, peur: 0 } },
};

export const persOf = (state, pid) => PERSONAS[state.players[pid].ai] || PERSONAS.anglais;

export function fxValue(list, w) {
  let v = 0;
  for (const fx of list || []) {
    if (fx.gold) v += fx.gold * w.gold;
    if (fx.prestige) v += fx.prestige * w.prestige;
    if (fx.armies) v += fx.armies * w.armies;
    if (fx.colere) v += fx.colere * w.colere;
    if (fx.peur) v += fx.peur * w.peur;
    if (fx.kill) v -= fx.kill === "king" ? 9 : fx.kill === "eldest" ? 6 : 3;
    if (fx.disinherit) v -= 2;
    if (fx.plague) v -= 3;
    if (fx.nextDice) v += fx.nextDice * 2;
    if (fx.intrigueBonus) v += fx.intrigueBonus * 0.7;
    if (fx.loseProvince) v -= 5;
    if (fx.gainNeutral) v += 5;
    if (fx.steal) v += fx.steal * w.gold;
    if (fx.health) v -= fx.health * 1.5;
    if (fx.marryTarget || fx.marryPartner) v += 2;
    if (fx.treatyTarget || fx.treatyPartner) v += 1;
    if (fx.seduceTarget) v += 2;
    if (fx.target) v -= 0.6 * fxValue(fx.target, w);
    if (fx.others) v -= 0.4 * fxValue(fx.others, w);
    if (fx.epithet) v -= 0.3;
    if (fx.chance !== undefined) v += fx.chance * fxValue(fx.then, w) + (1 - fx.chance) * fxValue(fx.else, w);
  }
  return v;
}

export function aiDilemma(state, priv, pid, rng, slot = "dilemma") {
  const d = priv[pid] && priv[pid][slot];
  if (!d) return null;
  const card = DILEMMAS.find((c) => c.id === d.id);
  const P = persOf(state, pid);
  if (card.type === "pact") {
    let p = P.betray + (state.leader === d.partner ? 0.15 : 0) - (bound(state, pid, d.partner) ? 0.2 : 0);
    // l'IA retient qui l'a trahie
    if ((priv[pid].grudges || []).includes(d.partner)) p += 0.3;
    // pour la plupart des pactes, « b » est la trahison ou l'option égoïste
    return { round: state.round, choice: rng() < p ? "b" : "a" };
  }
  let best = 0, bv = -1e9;
  card.options.forEach((o, i) => { const v = fxValue(o.fx, P.w) + rng() * 2.5; if (v > bv) { bv = v; best = i; } });
  const others = state.order.filter((p) => p !== pid);
  const target = state.leader && state.leader !== pid ? state.leader : pick(rng, others);
  return { round: state.round, choice: best, target };
}

export function aiAnswer(state, priv, pid, pr, rng) {
  const P = persOf(state, pid);
  let p = pr.kind === "treaty" ? P.treaty : P.marry;
  if (state.leader === pr.from) p -= 0.3;
  if ((priv[pid] && priv[pid].grudges || []).includes(pr.from)) p -= 0.5;
  return rng() < p;
}

export function aiOffers(state, priv, rng) {
  // les IA proposent parfois mariages et trêves (surtout aux humains)
  state.proposals = state.proposals || {};
  if (!unlocked(state, "diplomacy")) return;
  for (const pid of state.order) {
    const pl = state.players[pid];
    if (!pl.isBot || !pl.ai || rng() > 0.35) continue;
    const others = state.order.filter((o) => o !== pid && !(state.players[o].isBot && !state.players[o].ai));
    if (!others.length) continue;
    const to = pick(rng, others);
    const kind = rng() < 0.5 && canPropose(state, pid, to, "marriage") ? "marriage" : canPropose(state, pid, to, "treaty") ? "treaty" : null;
    if (kind) state.proposals[`${kind}:${pid}__${to}`] = { kind, from: pid, to };
  }
}

export function aiOrders(state, pid, rng, priv) {
  const pl = state.players[pid];
  const P = state.provinces;
  const Pers = persOf(state, pid);
  const mine = provincesOf(state, pid);
  const dice = realDice(state, priv, pid).map((v, i) => ({ v, i })).filter((d) => d.v > 0).sort((a, b) => b.v - a.v);
  const actions = [];
  if (!mine.length) return { actions, round: state.round };
  const used = new Set();
  const outgoing = {};
  let strikes = 0;
  const maxStrikes = pl.house === "anglais" ? (state.round > 6 ? 2 : 1) : Pers.maxStrikes;
  // 1. intrigues
  let gold = pl.gold;
  if (Pers.intrigue > 0 && unlocked(state, "intrigue")) for (const d of dice) {
    if (used.has(d.i) || d.v < 4 || rng() > Pers.intrigue) continue;
    const others = state.order.filter((o) => o !== pid);
    const tgt = state.leader && state.leader !== pid ? state.leader : pick(rng, others);
    if (gold >= COSTS.poison && d.v >= 5) {
      const fam = state.families[tgt].members.filter((m) => m.alive && ["king", "child"].includes(m.role));
      const victim = fam.find((m) => m.role === "child" && heirs(state, tgt)[0] === m) || fam[0];
      if (victim) { actions.push({ die: d.i, type: "intrigue", kind: "poison", target: tgt, person: victim.id }); used.add(d.i); gold -= COSTS.poison; continue; }
    }
    if (gold >= COSTS.bribe && d.v >= 6) {
      const prov = provincesOf(state, tgt).find((id) => id !== state.players[tgt].capital && P[id].armies <= 3);
      if (prov) { actions.push({ die: d.i, type: "intrigue", kind: "bribe", target: tgt, prov }); used.add(d.i); gold -= COSTS.bribe; continue; }
    }
    if (gold >= COSTS.seduction && mother(state, tgt)) { actions.push({ die: d.i, type: "intrigue", kind: "seduction", target: tgt }); used.add(d.i); gold -= COSTS.seduction; }
  }
  // 2. attaques
  for (const d of dice) {
    if (used.has(d.i) || strikes >= maxStrikes) continue;
    let best = null;
    for (const from of mine) {
      const avail = P[from].armies - 1 - (outgoing[from] || 0);
      if (avail < 2) continue;
      for (const to of PROVINCES[from].adj) {
        const o = P[to].owner;
        if (o === pid) continue;
        if (o && bound(state, pid, o) && rng() > (Pers === PERSONAS.conquerant ? 0.25 : 0.05)) continue;
        const prob = winProb(avail + d.v + attackMod(state, pid), defenseOf(state, to));
        const score = prob + (o && o === state.leader ? 0.12 : 0) + (o ? 0.03 : 0) + ((priv[pid] && priv[pid].grudges || []).includes(o) ? 0.1 : 0);
        if (prob >= Pers.thr && (!best || score > best.score)) best = { from, to, n: avail, score };
      }
    }
    if (best) { actions.push({ die: d.i, type: "strike", from: best.from, to: best.to, n: best.n }); outgoing[best.from] = (outgoing[best.from] || 0) + best.n; used.add(d.i); strikes++; }
  }
  // 3. renforts et déplacements
  const borders = mine.filter((id) => PROVINCES[id].adj.some((a) => P[a].owner !== pid));
  const threat = (id) => PROVINCES[id].adj.filter((a) => P[a].owner && P[a].owner !== pid).reduce((s, a) => s + P[a].armies, 0) - P[id].armies;
  for (const d of dice) {
    if (used.has(d.i)) continue;
    const interior = mine.filter((id) => !borders.includes(id) && P[id].armies - (outgoing[id] || 0) > 2);
    if (interior.length && rng() < 0.4) {
      const from = interior[0];
      const to = PROVINCES[from].adj.find((a) => P[a].owner === pid && borders.includes(a));
      if (to) { actions.push({ die: d.i, type: "march", from, to, n: Math.min(d.v, P[from].armies - 1 - (outgoing[from] || 0)) }); used.add(d.i); continue; }
    }
    const to = (borders.length ? borders : mine).slice().sort((a, b) => threat(b) - threat(a))[0];
    const merc = pl.gold >= MERC_COST + 6 && !actions.some((x) => x.merc);
    actions.push({ die: d.i, type: "levy", to, merc });
    used.add(d.i);
  }
  return { actions, round: state.round };
}

export const botOrders = (state, pid, rng, priv) => aiOrders(state, pid, rng, priv);

// vote de l'ordinateur au Conseil du Roi : honneurs à un allié ou au plus faible, punitions au favori ou à un ennemi juré
export function aiCouncil(state, priv, pid, motion, rng) {
  const others = state.order.filter((p) => p !== pid && state.players[p].house !== "anglais");
  if (!others.length) return null;
  const grudges = (priv[pid] && priv[pid].grudges) || [];
  const allies = others.filter((p) => state.alliances.some((x) => (x.a === pid && x.b === p) || (x.b === pid && x.a === p)));
  const score = (p) => state.players[p].prestige + provincesOf(state, p).length * 2;
  if (motion.good) return allies[0] || others.slice().sort((a, b) => score(a) - score(b))[0];
  const g = grudges.find((p) => others.includes(p));
  if (g && rng() < 0.7) return g;
  if (state.leader && state.leader !== pid) return state.leader;
  return others.slice().sort((a, b) => score(b) - score(a))[0];
}
