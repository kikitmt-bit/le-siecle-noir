// Distribution des dilemmes et fin de la phase dilemme, validation des ordres
import { DILEMMAS, TRAITS } from "../content.js?v=1795295887";
import { PROVINCES } from "../map.js?v=1795295887";
import { aiDilemma } from "./ai.js?v=1795295887";
import { allied, ctxFor, provincesOf, situationOf } from "./calc.js?v=1795295887";
import { capitalize, fill, maisonName, pick, shuffle } from "./core.js?v=1795295887";
import { applyFx } from "./effects.js?v=1795295887";
import { consort, heirs, king, queen } from "./people.js?v=1795295887";
import { realDice } from "./rounds.js?v=1795295887";
import { marriageable } from "./succession.js?v=1795295887";

// ---------- distribution des dilemmes ----------
export function reqOk(state, pid, req, pair) {
  if (!req) return true;
  const pl = state.players[pid];
  const fam = state.families[pid];
  const alive = fam.members.filter((m) => m.alive);
  const h = heirs(state, pid);
  const k = king(state, pid);
  const mine = provincesOf(state, pid);
  const P = state.provinces;
  if (req.startsWith("flag:")) return !!(pl.flags && pl.flags[req.slice(5)]);
  switch (req) {
    case "eldestBad": return !!h[0] && TRAITS[h[0].trait] && !TRAITS[h[0].trait].good;
    case "adultDaughter": return alive.some((m) => m.role === "child" && m.sex === "f" && m.age >= 14 && !m.spouse);
    case "adultSon": return alive.some((m) => m.role === "child" && m.sex === "m" && m.age >= 16);
    case "kingSick": return !!k && k.health >= 2;
    case "kingOld": return !!k && k.age >= 58;
    case "kingYoung": return !!k && k.age < 32;
    case "ownBastard": return alive.some((m) => m.role === "child" && m.bastard && !m.legit);
    case "receivedBastard": return alive.some((m) => m.role === "child" && m.bastardOf && m.bastardOf !== pid);
    case "queenAlive": return !!queen(state, pid);
    case "widowKing": return !!k && k.sex === "m" && !consort(state, pid);
    case "hasChild": return !!h[0];
    case "noHeir": return !h[0];
    case "heirMinor": return !!h[0] && h[0].age < 16;
    case "manyChildren": return alive.filter((m) => m.role === "child").length >= 3;
    case "rich": return pl.gold >= 15;
    case "poor": return pl.gold <= 4;
    case "colereHigh": return pl.colere >= 55;
    case "peurHigh": return pl.peur >= 45;
    case "leader": return state.leader === pid;
    case "notLeader": return state.leader !== pid;
    case "last": { const min = Math.min(...state.order.map((p) => state.players[p].prestige)); return pl.prestige === min && state.round > 2; }
    case "lostCapital": return !!pl.stats.capitalLost;
    case "plagueOwn": return mine.some((id) => P[id].plague > 0);
    case "neighborStronger": return mine.some((id) => PROVINCES[id].adj.some((a) => P[a].owner && P[a].owner !== pid && P[a].armies > P[id].armies + 1));
    case "big": return mine.length >= 8;
    case "small": return mine.length <= 4 && state.round > 2;
    case "early": return state.round <= 3;
    case "late": return state.round >= 7;
    case "hasAlly": return state.alliances.some((x) => x.a === pid || x.b === pid);
    case "hasLostFamily": return pl.lostRound >= state.round - 1;
    case "leaderNotInPact": return !!state.leader && !pair.includes(state.leader);
    case "bothMarriageable": return pair.every((p) => marriageable(state, p)) && !allied(state, pair[0], pair[1]);
    case "bothHaveChild": return pair.every((p) => state.families[p].members.some((m) => m.alive && m.role === "child"));
    case "neighbors": return provincesOf(state, pair[0]).some((id) => PROVINCES[id].adj.some((a) => P[a].owner === pair[1]));
    case "allied": return allied(state, pair[0], pair[1]);
    case "oneLeader": return pair.includes(state.leader);
    default: return true;
  }
}

export function dealDilemmas(state, priv, rng) {
  // deux cartes par manche : une affaire personnelle (slot « dilemma ») et une affaire qui implique un rival (slot « dilemma2 »)
  const players = state.order.filter((p) => !state.players[p].isBot || state.players[p].ai);
  for (const pid of players) { priv[pid].dilemma = null; priv[pid].dilemma2 = null; }
  const usedOk = (pid, d) => !priv[pid].used.includes(d.id);
  // suites en chaîne dues cette manche
  for (const pid of shuffle(rng, players)) {
    const ch = (priv[pid].chains || []).find((c) => c.at <= state.round);
    if (!ch) continue;
    const card = DILEMMAS.find((d) => d.id === ch.id);
    if (!card) continue;
    priv[pid].chains = priv[pid].chains.filter((c) => c !== ch);
    if (card.type === "pact") continue;
    giveCard(state, priv, pid, card, rng, card.type === "target" ? "dilemma2" : "dilemma");
  }
  // 1. affaire personnelle
  for (const pid of players) {
    if (priv[pid].dilemma) continue;
    let cards = DILEMMAS.filter((d) => d.type === "solo" && !d.chainOnly && usedOk(pid, d) && reqOk(state, pid, d.req, [pid]));
    if (!cards.length) { priv[pid].used = priv[pid].used.filter((id) => (DILEMMAS.find((d) => d.id === id) || {}).type !== "solo"); cards = DILEMMAS.filter((d) => d.type === "solo" && !d.chainOnly && reqOk(state, pid, d.req, [pid])); }
    const weighted = [];
    for (const c of cards) { weighted.push(c); if (c.req) { weighted.push(c); weighted.push(c); } }
    giveCard(state, priv, pid, pick(rng, weighted), rng, "dilemma");
  }
  // 2. affaire avec un rival : pactes à deux, sinon carte à cible
  let free = shuffle(rng, players.filter((pid) => !priv[pid].dilemma2));
  const pairs = [];
  while (free.length >= 2 && rng() < 0.6) { pairs.push([free[0], free[1]]); free = free.slice(2); }
  for (const pair of pairs) {
    const used = [...priv[pair[0]].used, ...priv[pair[1]].used];
    let cards = DILEMMAS.filter((d) => d.type === "pact" && !used.includes(d.id) && reqOk(state, pair[0], d.req, pair));
    if (!cards.length) cards = DILEMMAS.filter((d) => d.type === "pact" && reqOk(state, pair[0], d.req, pair));
    if (!cards.length) { free.push(...pair); continue; }
    const card = pick(rng, cards);
    pair.forEach((pid, i) => {
      const partner = pair[1 - i];
      priv[pid].used.push(card.id);
      priv[pid].dilemma2 = { id: card.id, round: state.round, type: "pact", partner, ctx: ctxFor(state, pid, { partenaire: maisonName(state, partner) }) };
    });
  }
  for (const pid of free) {
    let cards = DILEMMAS.filter((d) => d.type === "target" && !d.chainOnly && usedOk(pid, d) && reqOk(state, pid, d.req, [pid]));
    if (!cards.length) { priv[pid].used = priv[pid].used.filter((id) => (DILEMMAS.find((d) => d.id === id) || {}).type !== "target"); cards = DILEMMAS.filter((d) => d.type === "target" && !d.chainOnly && reqOk(state, pid, d.req, [pid])); }
    if (cards.length) giveCard(state, priv, pid, pick(rng, cards), rng, "dilemma2");
  }
}

export function giveCard(state, priv, pid, card, rng, slot = "dilemma") {
  priv[pid].used.push(card.id);
  const mine = provincesOf(state, pid);
  const nonCap = mine.filter((id) => id !== state.players[pid].capital);
  const provId = (nonCap.length ? pick(rng, nonCap) : mine[0]) || null;
  priv[pid][slot] = { id: card.id, round: state.round, type: card.type, provId, ctx: ctxFor(state, pid, { prov: provId ? PROVINCES[provId].art : "la province", prov_en: provId ? PROVINCES[provId].en : "dans la province", prov_de: provId ? PROVINCES[provId].de : "de la province" }) };
}

// ---------- fin de la phase dilemme ----------
export function finishDilemmas(state, priv, inputs, rng) {
  const lines = [];
  const out = [];
  priv.__crimes = priv.__crimes || [];
  state.unsolved = state.unsolved || [];
  for (const slot of ["dilemma", "dilemma2"]) {
  const done = new Set();
  const inp = (p) => {
    const pl = state.players[p];
    if (pl.isBot && pl.ai) return aiDilemma(state, priv, p, rng, slot);
    return inputs[p] && inputs[p][slot] && inputs[p][slot].round === state.round ? inputs[p][slot] : null;
  };
  for (const pid of state.order) {
    const d = priv[pid] && priv[pid][slot];
    if (!d || done.has(pid) || d.round !== state.round) continue;
    const card = DILEMMAS.find((c) => c.id === d.id);
    if (!card) continue;
    const a = inp(pid);
    if (card.type === "pact") {
      const partner = d.partner;
      const b = inp(partner);
      const ca = a && ["a", "b"].includes(a.choice) ? a.choice : pick(rng, ["a", "b"]);
      const cb = b && ["a", "b"].includes(b.choice) ? b.choice : pick(rng, ["a", "b"]);
      [[pid, partner, ca + cb], [partner, pid, cb + ca]].forEach(([me, other, key], i) => {
        const oc = card.outcomes[key];
        const ctx = { ...ctxFor(state, me, { partenaire: maisonName(state, other) }), partnerPid: other, first: i === 0, extraChron: [], priv };
        applyFx(state, me, oc.fx, ctx, rng, out);
        const t = [fill(oc.chron, ctx), ...ctx.extraChron.map((x) => fill(x, ctx))].join(" ");
        const optA = card.options.find((o) => o.id === key[0]).label, optB = card.options.find((o) => o.id === key[1]).label;
        if (i === 0 || !["aa", "bb"].includes(key)) lines.push({ text: t, pid: me, title: fill(card.title, ctx), situation: fill(situationOf(card.text), ctx), choice: `${capitalize(maisonName(state, me))} : « ${optA} » · ${capitalize(maisonName(state, other))} : « ${optB} »`, pact: true });
        priv[me].lastResult = { title: card.title, text: t, partnerChoice: i === 0 ? cb : ca };
      });
      done.add(pid); done.add(partner);
    } else {
      let ci = a && Number.isInteger(a.choice) && card.options[a.choice] ? a.choice : null;
      let target = a && a.target && state.players[a.target] && a.target !== pid ? a.target : null;
      if (ci === null) ci = Math.floor(rng() * card.options.length);
      const opt = card.options[ci];
      if (opt.needsTarget && !target) {
        const others = state.order.filter((p) => p !== pid);
        target = state.leader && state.leader !== pid ? state.leader : pick(rng, others);
      }
      const ctx = { ...d.ctx, ...ctxFor(state, pid, { prov: d.ctx.prov, prov_en: d.ctx.prov_en, prov_de: d.ctx.prov_de }), cible: target ? maisonName(state, target) : "", targetPid: target, provId: d.provId, extraChron: [], priv };
      const intendant = !a ? " (L'intendant choisit, faute d'ordres.)" : "";
      const t0 = opt.anon ? fill(opt.anonChron, ctx) : fill(opt.chron, ctx);
      applyFx(state, pid, opt.fx, ctx, rng, out);
      const t = [t0, ...ctx.extraChron.map((x) => fill(x, ctx))].filter(Boolean).join(" ") + (opt.anon ? "" : intendant);
      if (opt.anon && target) {
        const id = "c" + Math.floor(rng() * 1e9).toString(36);
        priv.__crimes.push({ id, round: state.round, culprit: pid, victim: target });
        state.unsolved.push({ id, round: state.round, victim: target, text: t0 });
      }
      lines.push(opt.anon ? { text: t, pid: null } : { text: t, pid, secret: card.type === "solo" && !opt.needsTarget, title: fill(card.title, ctx), situation: fill(situationOf(card.text), ctx), choice: `${capitalize(maisonName(state, pid))} : « ${fill(opt.label, ctx)} »${target && opt.needsTarget ? ` (contre ${maisonName(state, target)})` : ""}` });
      priv[pid].lastResult = { title: fill(card.title, ctx), text: t };
      done.add(pid);
    }
  }
  }
  state.pendingDilemma = { lines, out };
  state.phase = "orders";
}

// ---------- résolution des ordres ----------
export function validateOrders(state, pid, orders, priv) {
  const dice = realDice(state, priv, pid);
  const used = new Set();
  const res = [];
  for (const o of (orders && orders.actions) || []) {
    if (!o || !Number.isInteger(o.die) || o.die < 0 || o.die >= dice.length || used.has(o.die)) continue;
    if (!["strike", "march", "levy", "intrigue"].includes(o.type)) continue;
    if (!dice[o.die]) continue;
    used.add(o.die);
    res.push({ ...o, value: dice[o.die] });
  }
  return res;
}
