// Création de partie, choix des provinces (draft) et placement
import { OBJECTIVES } from "../content.js?v=1795295887";
import { PROVINCES, REGIONS } from "../map.js?v=1795295887";
import { MAX_ROUNDS, PROV_IDS, START_ARMIES, cleanHouseName, shuffle } from "./core.js?v=1795295887";
import { makeFamily } from "./people.js?v=1795295887";

export function createGame({ players, tutorial = false, randomDraft = false, code = "", rounds = MAX_ROUNDS }, rng) {
  // players: [{pid, name, house, isBot}]
  const state = {
    v: 1, code, phase: "objectives", round: 0, maxRounds: Math.max(5, Math.min(MAX_ROUNDS, rounds | 0 || MAX_ROUNDS)), tutorial, randomDraft,
    deadline: 0, players: {}, order: [], provinces: {}, families: {}, alliances: [],
    chronicle: [], news: [], reveal: null, proposals: {}, treaties: [], unsolved: [], leader: null, draft: null, result: null, seq: 0,
  };
  const priv = {};
  for (const p of players) {
    state.players[p.pid] = {
      pid: p.pid, name: p.name, house: p.house, hname: cleanHouseName(p.hname), isBot: !!p.isBot, gold: 10, colere: 10, peur: 10, prestige: 10,
      capital: null, dice: [], extraDie: false, intrigueBonus: 0, exiled: false,
      ai: p.ai || (p.house === "anglais" ? null : null), flags: {}, diceMod: 0, hiddenIdx: -1,
      stats: { armiesKilled: 0, betrayals: 0, murders: 0, familyDeaths: 0, bastardsReceived: 0, conquests: 0, capitalLost: false, married: 0, treaties: 0, accusationsOk: 0, bastardsSown: 0, goldGiven: 0, attacks: 0, attackLost: 0, kings: 1, firstKing: null },
    };
    const fam = makeFamily(rng, p.house);
    state.families[p.pid] = fam;
    fam.queenRef = { pid: p.pid, id: fam.members[1].id };
    state.players[p.pid].stats.firstKing = fam.kingId;
    priv[p.pid] = { used: [], objOffer: [], objectives: [], dilemma: null, dilemma2: null, chains: [], grudges: [] };
    if (!p.isBot || p.ai) priv[p.pid].objOffer = shuffle(rng, OBJECTIVES.map((o) => o.id)).slice(0, 3);
  }
  state.order = shuffle(rng, players.map((p) => p.pid));
  for (const id of PROV_IDS) state.provinces[id] = { owner: null, armies: 2, plague: 0 };
  return { state, priv };
}


export function finishObjectives(state, priv, inputs) {
  for (const pid of Object.keys(priv)) {
    const offer = priv[pid].objOffer;
    if (!offer.length) continue;
    let chosen = (inputs[pid] && inputs[pid].objPick) || [];
    chosen = chosen.filter((o) => offer.includes(o)).slice(0, 2);
    for (const o of offer) if (chosen.length < 2 && !chosen.includes(o)) chosen.push(o);
    priv[pid].objectives = chosen;
  }
}


// ---------- draft ----------
export function provincesPerPlayer(n) { return n >= 3 ? 3 : 4; }

// après le choix des provinces, toutes les provinces restantes sont réparties : pas de terres vides
export function finishDraft(state, rng) {
  const P = state.provinces;
  const count = (pid) => PROV_IDS.filter((id) => P[id].owner === pid).length;
  let guard = 0;
  while (PROV_IDS.some((id) => !P[id].owner) && guard++ < 100) {
    // le moins pourvu reçoit d'abord (à égalité, le dernier à avoir choisi)
    const order = state.order.slice().reverse().sort((a, b) => count(a) - count(b));
    // le moins pourvu reçoit toujours : une voisine si possible, sinon la province libre la plus proche
    const pid = order[0];
    let free = PROV_IDS.filter((id) => !P[id].owner && PROVINCES[id].adj.some((a) => P[a].owner === pid));
    if (!free.length) {
      const dist = {}; const q = PROV_IDS.filter((id) => P[id].owner === pid); q.forEach((id) => (dist[id] = 0));
      for (let h = 0; h < q.length; h++) for (const a of PROVINCES[q[h]].adj) if (dist[a] === undefined) { dist[a] = dist[q[h]] + 1; q.push(a); }
      const cands = PROV_IDS.filter((id) => !P[id].owner);
      const md = Math.min(...cands.map((id) => dist[id] ?? 99));
      free = cands.filter((id) => (dist[id] ?? 99) === md);
    }
    const best = free.map((id) => ({ id, s: REGIONS[PROVINCES[id].region].provs.filter((r) => P[r].owner === pid).length * 3 + PROVINCES[id].adj.filter((a) => P[a].owner === pid).length + rng() })).sort((a, b) => b.s - a.s)[0].id;
    P[best].owner = pid; P[best].armies = 1;
  }
  state.phase = "placement";
}

export function startDraft(state, rng) {
  const n = state.order.length, per = provincesPerPlayer(n);
  const seq = [];
  for (let r = 0; r < per; r++) { const row = r % 2 === 0 ? state.order : state.order.slice().reverse(); seq.push(...row); }
  state.draft = { seq, idx: 0 };
  state.phase = "draft";
  if (state.randomDraft) {
    for (const pid of seq) draftPick(state, pid, autoPickProvince(state, pid, rng));
  }
}

export function currentDrafter(state) { return state.draft && state.draft.idx < state.draft.seq.length ? state.draft.seq[state.draft.idx] : null; }

export function draftPick(state, pid, prov) {
  if (currentDrafter(state) !== pid) return false;
  const p = state.provinces[prov];
  if (!p || p.owner) return false;
  p.owner = pid; p.armies = 1;
  const pl = state.players[pid];
  if (!pl.capital) { pl.capital = prov; pl.firstCapital = prov; }
  state.draft.idx++;
  return true;
}

export function draftDone(state) { return state.draft && state.draft.idx >= state.draft.seq.length; }

export function autoPickProvince(state, pid, rng) {
  const free = PROV_IDS.filter((id) => !state.provinces[id].owner);
  const mine = PROV_IDS.filter((id) => state.provinces[id].owner === pid);
  if (!mine.length) {
    // capitale : une province libre loin des autres capitales
    const caps = Object.values(state.players).map((p) => p.capital).filter(Boolean);
    const scored = free.map((id) => {
      const d = caps.length ? Math.min(...caps.map((c) => Math.hypot(PROVINCES[c].cx - PROVINCES[id].cx, PROVINCES[c].cy - PROVINCES[id].cy))) : 500;
      return { id, s: d + rng() * 80 - (id === "corse" ? 400 : 0) };
    }).sort((a, b) => b.s - a.s);
    return scored[0].id;
  }
  const scored = free.map((id) => {
    const adjMine = PROVINCES[id].adj.filter((a) => state.provinces[a].owner === pid).length;
    const reg = REGIONS[PROVINCES[id].region].provs;
    const regMine = reg.filter((r) => state.provinces[r].owner === pid).length;
    return { id, s: adjMine * 10 + regMine * 4 + rng() * 3 };
  }).sort((a, b) => b.s - a.s);
  return scored[0].id;
}


// ---------- placement ----------
export function finishPlacement(state, inputs) {
  for (const pid of state.order) {
    const mine = PROV_IDS.filter((id) => state.provinces[id].owner === pid);
    let place = inputs[pid] && inputs[pid].placement;
    const alloc = {};
    let total = 0;
    if (place && !state.players[pid].isBot) {
      for (const id of mine) { const v = Math.max(1, Math.floor(Number(place[id]) || 1)); alloc[id] = v; total += v; }
      if (total > START_ARMIES) place = null;
    } else place = null;
    if (!place) {
      for (const id of mine) alloc[id] = 1;
      total = mine.length;
      // les armées restantes vont aux frontières, la capitale d'abord
      const borders = mine.filter((id) => PROVINCES[id].adj.some((a) => state.provinces[a].owner !== pid));
      const cap = state.players[pid].capital;
      const order = [cap, ...borders.filter((b) => b !== cap)];
      let i = 0;
      while (total < START_ARMIES) { alloc[order[i % order.length] || cap]++; total++; i++; }
    } else {
      // compléter jusqu'à 12 sur la capitale
      alloc[state.players[pid].capital] += START_ARMIES - total;
    }
    for (const id of mine) state.provinces[id].armies = alloc[id];
  }
  for (const id of PROV_IDS) if (!state.provinces[id].owner) state.provinces[id].armies = 2;
}
