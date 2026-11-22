// Distribution des dilemmes et fin de la phase dilemme, validation des ordres
import { COUNCIL, DILEMMAS, TRAITS } from "../content.js?v=1795358374";
import { PROVINCES } from "../map.js?v=1795358374";
import { aiCouncil, aiDilemma } from "./ai.js?v=1795358374";
import { allied, chron, ctxFor, noteRel, provincesOf, situationOf } from "./calc.js?v=1795358374";
import { capitalize, clamp, fill, maisonName, pick, shuffle } from "./core.js?v=1795358374";
import { applyFx, seedPlague } from "./effects.js?v=1795358374";
import { consort, heirs, king, queen } from "./people.js?v=1795358374";
import { realDice } from "./rounds.js?v=1795358374";
import { marriageable } from "./succession.js?v=1795358374";

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

// Le Conseil du Roi siège aux manches 3, 6 et 9 (jamais à la dernière)
export const councilRound = (state) => state.round % 3 === 0 && state.round < state.maxRounds;

export function dealDilemmas(state, priv, rng) {
  // deux cartes par manche : une affaire personnelle (slot « dilemma ») et une affaire qui implique un rival (slot « dilemma2 »)
  const players = state.order.filter((p) => !state.players[p].isBot || state.players[p].ai);
  for (const pid of players) { priv[pid].dilemma = null; priv[pid].dilemma2 = null; priv[pid].council = null; }
  // le Conseil du Roi : un vote public, même motion pour tous
  state.council = null;
  if (councilRound(state) && players.length >= 3) {
    state.councilsUsed = state.councilsUsed || [];
    let pool = COUNCIL.filter((c) => !state.councilsUsed.includes(c.id));
    if (!pool.length) pool = COUNCIL;
    const m = pick(rng, pool);
    state.councilsUsed.push(m.id);
    state.council = { id: m.id, round: state.round };
    for (const pid of players) priv[pid].council = { id: m.id, round: state.round, type: "council" };
  }
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
  // le Conseil du Roi : dépouillement public
  if (state.council && state.council.round === state.round) {
    const m = COUNCIL.find((c) => c.id === state.council.id);
    const voters = state.order.filter((p) => priv[p] && priv[p].council && priv[p].council.round === state.round);
    const votes = [];
    for (const p of voters) {
      const pl = state.players[p];
      let to = pl.isBot && pl.ai ? aiCouncil(state, priv, p, m, rng) : inputs[p] && inputs[p].council && inputs[p].council.round === state.round ? inputs[p].council.choice : null;
      if (!to || to === p || !state.players[to] || state.players[to].house === "anglais") to = null;
      votes.push({ from: p, to });
      if (to && !m.good) noteRel(state, "vote", p, to);
    }
    const tally = {};
    votes.forEach((v) => { if (v.to) tally[v.to] = (tally[v.to] || 0) + 1; });
    const max = Math.max(0, ...Object.values(tally));
    const top = Object.keys(tally).filter((k) => tally[k] === max);
    const winner = max > 0 && top.length === 1 ? top[0] : null;
    let t;
    if (winner) {
      const w = state.players[winner];
      const cap = w.capital && state.provinces[w.capital] && state.provinces[w.capital].owner === winner ? w.capital : provincesOf(state, winner)[0];
      const name = maisonName(state, winner);
      switch (m.id) {
        case "connetable": if (cap) state.provinces[cap].armies += 3; w.prestige += 2; t = `${capitalize(name)} reçoit l'épée de Connétable de France (+3 armées, +2 Prestige).`; break;
        case "impot": { const n = Math.min(8, w.gold); w.gold -= n; const others = state.order.filter((p) => p !== winner && state.players[p].house !== "anglais"); const share = Math.floor(n / Math.max(1, others.length)); others.forEach((p) => (state.players[p].gold += share)); t = `${capitalize(name)} doit payer l'impôt de guerre : ${n} or, partagés entre les autres maisons (${share} chacune).`; break; }
        case "excommunication": w.colere = clamp(w.colere + 20, 0, 100); w.prestige -= 3; t = `${capitalize(name)} est excommuniée. Les églises ferment, les cloches se taisent (+20 Colère, −3 Prestige).`; break;
        case "main": w.diceMod = (w.diceMod || 0) + 1; w.prestige += 2; t = `${capitalize(name)} devient la Main du Roi (+1 dé à la prochaine manche, +2 Prestige).`; break;
        case "bouc": if (cap) { state.provinces[cap].armies = Math.max(1, state.provinces[cap].armies - 3); seedPlague(state, cap); } w.colere = clamp(w.colere + 10, 0, 100); t = `${capitalize(name)} est désignée comme coupable de la peste. La foule brûle ses greniers et la maladie frappe sa capitale (−3 armées, +10 Colère).`; break;
        case "princesse": w.prestige += 4; w.gold += 6; t = `${capitalize(name)} épouse la princesse de France. Elle est laide, mais sa dot est superbe (+4 Prestige, +6 or).`; break;
        case "tribunal": { w.prestige -= 4; const cand = provincesOf(state, winner).filter((id) => id !== w.capital); if (cand.length) { const id = pick(rng, cand); state.provinces[id].owner = null; state.provinces[id].armies = 2; out.push({ kind: "revolt", text: `Condamnée par les pairs, ${name} perd ${PROVINCES[id].art}, qui se soulève et devient neutre.`, prov: id, set: { [id]: { ...state.provinces[id] } } }); } t = `Le tribunal des pairs condamne ${name} (−4 Prestige).`; break; }
      }
    } else t = max > 0 ? "Égalité : le Conseil se sépare dans les cris, sans rien décider." : "Personne n'a voté : le Conseil ne décide rien.";
    const voteTxt = votes.map((v) => `${capitalize(maisonName(state, v.from))} → ${v.to ? maisonName(state, v.to) : "abstention"}`).join(" · ");
    lines.unshift({ kind: "council", text: t, pid: winner, title: `Conseil du Roi : ${m.title}`, situation: m.text, choice: voteTxt, votes, winner, motion: m.id });
    chron(state, `Conseil du Roi (${m.title}) : ${t}`, "council");
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
