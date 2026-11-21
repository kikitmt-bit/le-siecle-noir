// =====================================================================
//  LE SIÈCLE NOIR — moteur de règles (pur JS, sans DOM ni réseau)
//  L'hôte (arbitre) est le seul à appeler ces fonctions.
// =====================================================================
import { PROVINCES, REGIONS } from "./map.js";
import { HOUSES, NAMES, INFIRMITIES, TRAITS, TRAIT_POOL, HEALTH, DEATH_CHANCE, DILEMMAS, EVENTS, OBJECTIVES } from "./content.js";

export const PROV_IDS = Object.keys(PROVINCES);
export const MAX_ROUNDS = 10;
export const START_YEAR = 1347;
export const COSTS = { poison: 5, seduction: 3, bribe: 7 };
export const NEED = { poison: 5, seduction: 4, bribe: 6 };
export const TIMES = { objectives: 30, draft: 15, placement: 45, dilemma: 35, orders: 75, interlude: 9 };
export const START_ARMIES = 12;
export const WIN_PROVINCES = 15;

// ---------- utilitaires ----------
export const yearOf = (round) => START_YEAR + (round - 1) * 3;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
const shuffle = (rng, arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const uid = (rng) => Math.floor(rng() * 36 ** 6).toString(36);
export const levyAmount = (d) => (d <= 2 ? 2 : d <= 4 ? 3 : 4);
export const peurBonus = (pl) => (pl ? Math.floor((pl.peur || 0) / 25) : 0);

export function maisonName(state, pid, article = "la maison") {
  const pl = state.players[pid];
  if (!pl) return "les rebelles";
  if (pl.house === "anglais") return "la couronne d'Angleterre";
  const n = HOUSES[pl.house].name;
  return `${article} ${/^[AEIOUÂÉ]/i.test(n) ? "d'" : "de "}${n}`;
}
export function capitalize(s) {
  return s.replace(/(^|[.!?…]\s+|«\s)([a-zàâéèêîôûç])/g, (m, a, b) => a + b.toUpperCase());
}
export function fill(tpl, ctx) {
  return capitalize(String(tpl).replace(/\{(\w+)\}/g, (m, k) => (ctx[k] !== undefined ? ctx[k] : m)));
}

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
export function deName(state, pid) { const pl = state.players[pid]; if (!pl) return "des rebelles"; if (pl.house === "anglais") return "d'Angleterre"; const n = HOUSES[pl.house].name; return /^[AEIOUÂÉ]/i.test(n) ? "d'" + n : "de " + n; }
const FEM = { "le Boucher": "la Bouchère", "l'Empoisonneur": "l'Empoisonneuse", "le Traître": "la Traîtresse", "le Cruel": "la Cruelle", "le Maudit": "la Maudite", "le Parricide": "la Parricide", "l'Étrangleur": "l'Étrangleuse", "le Pestilentiel": "la Pestilentielle", "le Tricheur": "la Tricheuse", "le Couard": "la Couarde" };
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
function newPerson(rng, { sex, age, house, role, bastard = false, bastardOf = null, consanguin = false }) {
  const en = house === "anglais";
  const name = pick(rng, sex === "m" ? (en ? NAMES.en_m : NAMES.m) : en ? NAMES.en_f : NAMES.f);
  let trait = pick(rng, TRAIT_POOL);
  let infirm = rng() < 0.28 ? pick(rng, INFIRMITIES[sex]) : null;
  if (consanguin && rng() < 0.55) { trait = pick(rng, ["Simple d'esprit", "Fragile", "Cruel"]); if (!infirm) infirm = pick(rng, INFIRMITIES[sex]); }
  const health = trait === "Fragile" ? 2 : age < 40 ? 0 : age < 55 ? 1 : 2;
  return { id: uid(rng), name, sex, age, trait, infirm, epithets: [], health, alive: true, role, bastard, legit: !bastard, bastardOf, spouse: null, cause: null };
}
function makeFamily(rng, house) {
  const k = newPerson(rng, { sex: "m", age: 40 + Math.floor(rng() * 16), house, role: "king" });
  const q = newPerson(rng, { sex: "f", age: 25 + Math.floor(rng() * 11), house, role: "queen" });
  const c1 = newPerson(rng, { sex: rng() < 0.6 ? "m" : "f", age: 14 + Math.floor(rng() * 7), house, role: "child" });
  const c2 = newPerson(rng, { sex: rng() < 0.5 ? "m" : "f", age: 6 + Math.floor(rng() * 9), house, role: "child" });
  return { members: [k, q, c1, c2], kingId: k.id, queenRef: null, consanguin: false, house };
}

// ---------- création de partie ----------
export function createGame({ players, tutorial = false, randomDraft = false, code = "" }, rng) {
  // players: [{pid, name, house, isBot}]
  const state = {
    v: 1, code, phase: "objectives", round: 0, maxRounds: MAX_ROUNDS, tutorial, randomDraft,
    deadline: 0, players: {}, order: [], provinces: {}, families: {}, alliances: [],
    chronicle: [], news: [], reveal: null, proposals: {}, leader: null, draft: null, result: null, seq: 0,
  };
  const priv = {};
  for (const p of players) {
    state.players[p.pid] = {
      pid: p.pid, name: p.name, house: p.house, isBot: !!p.isBot, gold: 10, colere: 10, peur: 10, prestige: 10,
      capital: null, dice: [], extraDie: false, intrigueBonus: 0, exiled: false,
      stats: { armiesKilled: 0, betrayals: 0, murders: 0, familyDeaths: 0, bastardsReceived: 0, conquests: 0, capitalLost: false, married: 0 },
    };
    const fam = makeFamily(rng, p.house);
    state.families[p.pid] = fam;
    fam.queenRef = { pid: p.pid, id: fam.members[1].id };
    priv[p.pid] = { used: [], objOffer: [], objectives: [], dilemma: null };
    if (!p.isBot) priv[p.pid].objOffer = shuffle(rng, OBJECTIVES.map((o) => o.id)).slice(0, 3);
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
export function provincesPerPlayer(n) { return n >= 4 ? 4 : n === 3 ? 5 : 6; }
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

// ---------- calculs ----------
export function provincesOf(state, pid) { return PROV_IDS.filter((id) => state.provinces[id].owner === pid); }
export function regionsOf(state, pid) { return Object.keys(REGIONS).filter((r) => REGIONS[r].provs.every((p) => state.provinces[p].owner === pid)); }
export function allied(state, a, b) { return state.alliances.some((x) => (x.a === a && x.b === b) || (x.a === b && x.b === a)); }
export function attackMod(state, pid) {
  const k = king(state, pid);
  if (!k) return 0;
  return (k.trait === "Brillant stratège" || k.trait === "Sanguinaire" ? 1 : 0) - (k.trait === "Lâche" ? 1 : 0);
}
// chance de réussite d'une intrigue : dé + bonus + (0 à 2) >= seuil + 1
export function intrigueProb(value, bonus, need) { let w = 0; for (let r = 0; r < 3; r++) if (value + bonus + r >= need + 1) w++; return w / 3; }
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
function chron(state, text, kind = "text") {
  state.chronicle.push({ round: state.round, year: yearOf(Math.max(1, state.round)), text, kind });
}
function ctxFor(state, pid, extra = {}) {
  const pl = state.players[pid];
  const cap = pl && pl.capital ? PROVINCES[pl.capital].city : "la capitale";
  const h = heirs(state, pid);
  const fam = state.families[pid];
  const daughter = fam ? fam.members.find((m) => m.alive && m.role === "child" && m.sex === "f" && m.age >= 14 && !m.spouse) : null;
  const bast = fam ? fam.members.find((m) => m.alive && m.role === "child" && m.bastard && !m.legit) : null;
  const q = queen(state, pid);
  return {
    roi: kingLabel(state, pid), maison: maisonName(state, pid), cap,
    heritier: h[0] ? personTitle(h[0]) : "l'héritier", heritier_trait: h[0] ? (h[0].trait || "").toLowerCase() : "",
    fille: daughter ? personTitle(daughter) : "ta fille", batard: bast ? personTitle(bast) : "le bâtard", reine: q ? `la reine ${personTitle(q)}` : "la reine",
    leader: state.leader ? maisonName(state, state.leader) : "le plus puissant",
    ...extra,
  };
}

// ---------- mort et succession ----------
export function killPerson(state, pid, person, cause, killer = null, out = []) {
  if (!person || !person.alive) return out;
  pid = ownerOf(state, person) || pid;
  person.alive = false; person.cause = cause;
  const pl = state.players[pid];
  if (pl) pl.stats.familyDeaths++;
  if (killer && state.players[killer]) state.players[killer].stats.murders++;
  // reine d'une autre maison ?
  for (const p of state.order) { const f = state.families[p]; if (f.queenRef && f.queenRef.id === person.id) f.queenRef = null; }
  const fam = state.families[pid];
  if (fam && fam.kingId === person.id) succession(state, pid, out);
  return out;
}
function succession(state, pid, out, rng = Math.random) {
  const fam = state.families[pid];
  const old = fam.members.find((m) => m.id === fam.kingId);
  const oldQueen = queen(state, pid);
  if (oldQueen && oldQueen.role === "queen") oldQueen.role = "widow";
  const h = heirs(state, pid);
  // revendications des bâtards de séduction
  claimsOnDeath(state, pid, out);
  if (h.length) {
    const nk = h[0];
    nk.role = "king"; fam.kingId = nk.id; fam.queenRef = nk.spouse ? { ...nk.spouse } : null;
    const reg = nk.age < 16 ? ` Il n'a que ${nk.age} ans : la régence s'annonce sanglante.` : "";
    let txt = `${old ? personTitle(old) : "Le roi"} est mort. ${nk.sex === "f" ? "Sa fille" : "Son fils"} ${personTitle(nk)} monte sur le trône de ${maisonName(state, pid)}.${reg}`;
    if (nk.bastardOf && state.players[nk.bastardOf]) txt += ` Mais toute la cour sait qu'il a les yeux de ${maisonName(state, nk.bastardOf)}.`;
    if (nk.trait === "Simple d'esprit") txt += " Le nouveau souverain bave sur son sceptre.";
    out.push({ kind: "death", text: txt, pid });
    chron(state, txt, "death");
  } else {
    civilWar(state, pid, out, rng);
  }
}
function claimsOnDeath(state, pid, out) {
  const fam = state.families[pid];
  const bast = fam.members.find((m) => m.alive && m.bastardOf && m.bastardOf !== pid && state.players[m.bastardOf]);
  if (!bast) return;
  const claimant = bast.bastardOf;
  const mine = provincesOf(state, pid).filter((id) => id !== state.players[pid].capital);
  if (!mine.length) return;
  const near = mine.filter((id) => PROVINCES[id].adj.some((a) => state.provinces[a].owner === claimant));
  const target = (near.length ? near : mine)[0];
  state.provinces[target].owner = claimant;
  const txt = `${capitalize(maisonName(state, claimant))} revendique ${PROVINCES[target].art} au nom de ${personTitle(bast)}, le bâtard qu'elle a semé dans le lit ${deName(state, pid).replace(/^de /,'des ').replace(/^d'/,'des ')}. La province change de maître.`;
  out.push({ kind: "claim", text: txt, set: { [target]: { ...state.provinces[target] } } });
  chron(state, txt, "claim");
}
function civilWar(state, pid, out, rng) {
  const pl = state.players[pid];
  const fam = state.families[pid];
  const mine = provincesOf(state, pid).filter((id) => id !== pl.capital);
  const lost = shuffle(rng, mine).slice(0, Math.floor(mine.length / 2));
  const ally = state.alliances.find((x) => x.a === pid || x.b === pid);
  const allyPid = ally ? (ally.a === pid ? ally.b : ally.a) : null;
  const set = {};
  lost.forEach((id, i) => { state.provinces[id].owner = i === 0 && allyPid ? allyPid : null; set[id] = { ...state.provinces[id] }; });
  pl.prestige -= 10;
  const cousin = newPerson(rng, { sex: "m", age: 30 + Math.floor(rng() * 10), house: pl.house, role: "king" });
  const wife = newPerson(rng, { sex: "f", age: 20 + Math.floor(rng() * 8), house: pl.house, role: "queen" });
  fam.members.push(cousin, wife); fam.kingId = cousin.id; fam.queenRef = { pid, id: wife.id };
  let txt = `Il n'y a plus d'héritier chez ${maisonName(state, pid)}. Guerre civile : les barons se partagent ${lost.length} province${lost.length > 1 ? "s" : ""}, et un lointain cousin, ${personTitle(cousin)}, ramasse la couronne dans la boue.`;
  if (allyPid && lost.length) txt += ` La belle-famille, ${maisonName(state, allyPid)}, en profite pour prendre ${PROVINCES[lost[0]].art}.`;
  out.push({ kind: "death", text: txt, set, pid });
  chron(state, txt, "death");
}

// ---------- effets des dilemmes ----------
function provForWhere(state, pid, where, rng) {
  const mine = provincesOf(state, pid);
  if (!mine.length) return null;
  if (where === "capital") return state.players[pid].capital && state.provinces[state.players[pid].capital].owner === pid ? state.players[pid].capital : mine[0];
  if (where === "strongest") return mine.slice().sort((a, b) => state.provinces[b].armies - state.provinces[a].armies)[0];
  return pick(rng, mine);
}
function seedPlague(state, prov) { if (prov && state.provinces[prov] && !state.provinces[prov].plague) state.provinces[prov].plague = 2; }

export function applyFx(state, pid, fxList, ctx, rng, out) {
  const pl = state.players[pid];
  if (!pl || !fxList) return;
  for (const fx of fxList) {
    if (fx.gold) pl.gold = Math.max(0, pl.gold + fx.gold);
    if (fx.colere) pl.colere = clamp(pl.colere + fx.colere, 0, 100);
    if (fx.peur) pl.peur = clamp(pl.peur + fx.peur, 0, 100);
    if (fx.prestige) pl.prestige += fx.prestige;
    if (fx.armies) {
      const prov = provForWhere(state, pid, fx.where, rng);
      if (prov) state.provinces[prov].armies = Math.max(1, state.provinces[prov].armies + fx.armies);
    }
    if (fx.plague) {
      const cap = pl.capital;
      if (fx.plague === "capital") seedPlague(state, cap);
      if (fx.plague === "random_own") seedPlague(state, provForWhere(state, pid, "random", rng));
      if (fx.plague === "around_capital" && cap) shuffle(rng, PROVINCES[cap].adj).slice(0, 2).forEach((p) => seedPlague(state, p));
    }
    if (fx.epithet) { const k = king(state, pid); if (k && !k.epithets.includes(fx.epithet)) k.epithets.push(fx.epithet); }
    if (fx.kill) {
      let victim = null;
      const fam = state.families[pid];
      if (fx.kill === "eldest") victim = heirs(state, pid)[0];
      if (fx.kill === "king") victim = king(state, pid);
      if (fx.kill === "queen") victim = queen(state, pid);
      if (fx.kill === "random_child") { const c = fam.members.filter((m) => m.alive && m.role === "child"); victim = c.length ? pick(rng, c) : null; }
      if (fx.kill === "bastard") victim = fam.members.find((m) => m.alive && m.role === "child" && m.bastard && !m.legit);
      if (victim) {
        const killer = ctx.actor && ctx.actor !== pid ? ctx.actor : null;
        out.push({ kind: "death", text: `${personTitle(victim)} est mort${victim.sex === "f" ? "e" : ""} : ${fx.cause || "on ne sait comment"}.`, pid });
        killPerson(state, pid, victim, fx.cause || "mort", killer, out);
      }
    }
    if (fx.disinherit) { const h = heirs(state, pid)[0]; if (h) h.role = "monk"; }
    if (fx.removePerson) { const fam = state.families[pid]; const d = fam.members.find((m) => m.alive && m.role === "child" && m.sex === "f" && m.age >= 14 && !m.spouse); if (d) { d.role = "gone"; d.cause = fx.cause; } }
    if (fx.health) { const k = king(state, pid); if (k) k.health = clamp(k.health + fx.health, 0, 4); }
    if (fx.intrigueBonus) pl.intrigueBonus = (pl.intrigueBonus || 0) + fx.intrigueBonus;
    if (fx.addBastard) state.families[pid].members.push(newPerson(rng, { sex: rng() < 0.5 ? "m" : "f", age: 0, house: pl.house, role: "child", bastard: true }));
    if (fx.addChildDoubt) state.families[pid].members.push(newPerson(rng, { sex: rng() < 0.5 ? "m" : "f", age: 0, house: pl.house, role: "child" }));
    if (fx.legitimize) { const b = state.families[pid].members.find((m) => m.alive && m.role === "child" && m.bastard && !m.legit); if (b) b.legit = true; }
    if (fx.consanguin) state.families[pid].consanguin = true;
    if (fx.loseProvince && ctx.provId && state.provinces[ctx.provId].owner === pid && ctx.provId !== pl.capital) {
      state.provinces[ctx.provId].owner = null;
    }
    if (fx.killLeaderKing && ctx.first && state.leader && state.leader !== pid && state.leader !== ctx.partnerPid) {
      if (rng() < fx.killLeaderKing) {
        const k = king(state, state.leader);
        if (k) {
          const t = `Au banquet, ${kingLabel(state, state.leader)} porta la coupe à ses lèvres et s'effondra. ${capitalize(maisonName(state, pid))} et ${maisonName(state, ctx.partnerPid)} échangèrent un regard.`;
          out.push({ kind: "death", text: t }); chron(state, t, "death");
          killPerson(state, state.leader, k, "empoisonné par un complot", pid, out);
          state.players[ctx.partnerPid].stats.murders++;
        }
      } else {
        const t = `Le complot contre ${maisonName(state, state.leader)} échoua : le goûteur mourut à la place du roi.`;
        out.push({ kind: "text", text: t }); chron(state, t);
      }
    }
    if (fx.leaderAlert && state.leader && state.players[state.leader]) state.players[state.leader].gold += 2;
    if (fx.marryPartner && ctx.first) marry(state, pid, ctx.partnerPid, out);
    if (fx.target && ctx.targetPid && state.players[ctx.targetPid]) applyFx(state, ctx.targetPid, fx.target, { ...ctx, actor: pid }, rng, out);
    if (fx.chance !== undefined) {
      if (rng() < fx.chance) { applyFx(state, pid, fx.then, ctx, rng, out); if (fx.thenChron) ctx.extraChron.push(fx.thenChron); }
      else { applyFx(state, pid, fx.else, ctx, rng, out); if (fx.elseChron) ctx.extraChron.push(fx.elseChron); }
    }
  }
}

export function marriageable(state, pid) {
  const f = state.families[pid];
  if (!f) return null;
  return f.members.filter((m) => m.alive && m.role === "child" && !m.spouse && m.age >= 10).sort((a, b) => b.age - a.age)[0] || null;
}
export function marry(state, a, b, out) {
  if (!state.players[a] || !state.players[b] || allied(state, a, b)) return false;
  const ca = marriageable(state, a), cb = marriageable(state, b);
  if (!ca || !cb) return false;
  ca.spouse = { pid: b, id: cb.id }; cb.spouse = { pid: a, id: ca.id };
  state.alliances.push({ a, b });
  state.players[a].stats.married++; state.players[b].stats.married++;
  const t = `Noces à ${PROVINCES[state.players[a].capital]?.city || "la cour"} : ${personTitle(ca)} (${maisonName(state, a)}) épouse ${personTitle(cb)} (${maisonName(state, b)}). Les deux maisons sont désormais alliées.`;
  out.push({ kind: "marriage", text: t });
  chron(state, t, "marriage");
  return true;
}

// ---------- début de manche ----------
export function startRound(state, priv, rng) {
  state.round++;
  state.news = [];
  state.proposals = {};
  const out = state.news;
  const first = state.round === 1;
  for (const pid of state.order) {
    const pl = state.players[pid];
    const mine = provincesOf(state, pid);
    if (!first) {
      const regs = regionsOf(state, pid);
      const allies = state.alliances.filter((x) => x.a === pid || x.b === pid).length;
      pl.gold += mine.length + allies;
      const cap = pl.capital && state.provinces[pl.capital].owner === pid ? pl.capital : mine[0];
      const bonus = 2 + regs.reduce((s, r) => s + REGIONS[r].provs.length - 1, 0);
      if (cap) state.provinces[cap].armies += bonus;
      pl.prestige += regs.length;
      pl.colere = clamp(pl.colere - 5, 0, 100);
      const k = king(state, pid);
      if (k) {
        if (k.trait === "Sanguinaire") pl.peur = clamp(pl.peur + 5, 0, 100);
        if (k.trait === "Pieux") pl.colere = clamp(pl.colere - 3, 0, 100);
        if (k.trait === "Débauché") pl.gold = Math.max(0, pl.gold - 1);
        if (k.trait === "Cruel") { pl.colere = clamp(pl.colere + 5, 0, 100); pl.peur = clamp(pl.peur + 5, 0, 100); }
      }
      // vieillissement, santé et morts
      const fam = state.families[pid];
      const capPlague = pl.capital && state.provinces[pl.capital].plague > 0;
      for (const m of fam.members.filter((x) => x.alive && ["king", "queen", "child", "widow"].includes(x.role))) {
        m.age += 3;
        let target = m.age < 40 ? 0 : m.age < 50 ? 1 : m.age < 60 ? 2 : m.age < 68 ? 3 : 4;
        if (m.trait === "Robuste") target--;
        if (m.trait === "Fragile") target++;
        if (m.health < target && rng() < 0.6) m.health++;
        let p = DEATH_CHANCE[clamp(m.health, 0, 4)] + (m.age < 6 ? 0.04 : 0) + (capPlague ? 0.04 : 0);
        if (m.role !== "king") p *= 0.8;
        if (rng() < p) {
          const e = m.sex === "f" ? "e" : "";
          const cause = capPlague ? `emporté${e} par la peste` : m.age < 6 ? `mort${e} au berceau` : m.health >= 3 ? `mort${e} de maladie` : pick(rng, ["une chute de cheval", "une fièvre soudaine", "une indigestion de lamproies", "un mal mystérieux", "une rage de dents qui tourna mal"]);
          if (m.role !== "king") { const t = `${personTitle(m)}, ${deName(state, pid)}, est ${/^(mort|emport)/.test(cause) ? cause : "mort" + e + " : " + cause}.`; out.push({ kind: "death", text: t, pid }); chron(state, t, "death"); }
          killPerson(state, pid, m, cause, null, out);
        }
      }
      // naissances
      const q = mother(state, pid);
      if (q && q.age < 40 && rng() < 0.25) {
        const c = newPerson(rng, { sex: rng() < 0.5 ? "m" : "f", age: 0, house: pl.house, role: "child", consanguin: fam.consanguin });
        fam.members.push(c);
        const t = `${capitalize(maisonName(state, pid))} célèbre une naissance : ${personTitle(c)}${c.infirm ? ", déjà surnommé" + (c.sex === "f" ? "e" : "") + " ainsi au berceau" : ""}.`;
        out.push({ kind: "birth", text: t, pid }); chron(state, t, "birth");
      }
      // jacquerie
      if (pl.colere >= 80) {
        const cand = mine.filter((id) => id !== pl.capital);
        if (cand.length) {
          const id = pick(rng, cand);
          state.provinces[id].owner = null; state.provinces[id].armies = 3;
          pl.colere = 50;
          const t = `Jacquerie ! Les paysans ${PROVINCES[id].de} massacrent leurs seigneurs et chassent ${maisonName(state, pid)}.`;
          out.push({ kind: "revolt", text: t, prov: id }); chron(state, t, "revolt");
        }
      }
    }
  }
  if (!first) {
    // peste
    const spread = [];
    for (const id of PROV_IDS) {
      const p = state.provinces[id];
      if (p.plague > 0) {
        if (p.armies > 1) p.armies--;
        for (const a of PROVINCES[id].adj) if (!state.provinces[a].plague && rng() < 0.15) spread.push(a);
        p.plague--;
      }
    }
    for (const a of spread) state.provinces[a].plague = 2;
    if (spread.length) { const t = `La peste gagne ${spread.map((a) => PROVINCES[a].art).join(", ")}.`; out.push({ kind: "plague", text: t }); chron(state, t, "plague"); }
    // événement du monde
    if (rng() < 0.45) worldEvent(state, rng, out);
  }
  computeLeader(state);
  rollDice(state, rng);
  dealDilemmas(state, priv, rng);
  state.phase = "dilemma";
}

function worldEvent(state, rng, out) {
  const pool = [];
  for (const e of EVENTS) for (let i = 0; i < e.weight; i++) pool.push(e);
  const ev = pick(rng, pool);
  const bot = state.order.find((p) => state.players[p].isBot);
  if (ev.id === "debarquement") {
    const coast = PROV_IDS.filter((id) => PROVINCES[id].coast && state.provinces[id].owner !== bot && id !== "corse");
    const id = pick(rng, coast);
    const p = state.provinces[id];
    const att = 4 + Math.floor(rng() * 3), def = p.armies + peurBonus(state.players[p.owner]) + Math.floor(rng() * 3);
    let t;
    if (att > def) {
      const prev = p.owner;
      p.owner = bot || null; p.armies = Math.max(1, 4 - Math.ceil(p.armies / 2));
      t = `Les Anglais débarquent ${PROVINCES[id].en} et écrasent ${prev ? maisonName(state, prev) : "la milice locale"}.`;
    } else {
      p.armies = Math.max(1, p.armies - 2);
      t = `Les Anglais débarquent ${PROVINCES[id].en}, mais sont rejetés à la mer.`;
    }
    out.push({ kind: "event", text: t, prov: id }); chron(state, t, "event");
  } else if (ev.id === "peste") {
    const id = pick(rng, PROV_IDS);
    seedPlague(state, id);
    const t = `La peste noire réapparaît ${PROVINCES[id].en}.`;
    out.push({ kind: "plague", text: t, prov: id }); chron(state, t, "plague");
  } else if (ev.id === "recolte") {
    for (const pid of state.order) state.players[pid].gold += 2;
    out.push({ kind: "event", text: "Une bonne récolte : chaque maison gagne 2 or." }); chron(state, ev.chron, "event");
  } else if (ev.id === "comete") {
    for (const pid of state.order) state.players[pid].colere = clamp(state.players[pid].colere + 10, 0, 100);
    out.push({ kind: "event", text: "Une comète traverse le ciel : la Colère monte partout (+10)." }); chron(state, ev.chron, "event");
  } else if (ev.id === "hiver") {
    for (const id of PROV_IDS) if (state.provinces[id].armies >= 4) state.provinces[id].armies--;
    out.push({ kind: "event", text: "Le grand hiver : les grosses armées perdent chacune 1 homme." }); chron(state, ev.chron, "event");
  }
}

export function rollDice(state, rng) {
  for (const pid of state.order) {
    const pl = state.players[pid];
    const k = king(state, pid);
    const n = pl.isBot ? 2 : k && k.trait === "Simple d'esprit" ? 2 : 3;
    pl.dice = Array.from({ length: n }, () => 1 + Math.floor(rng() * 6));
    pl.extraDie = new Set(pl.dice).size < pl.dice.length;
    if (pl.extraDie) pl.dice.push(2);
  }
}

// ---------- distribution des dilemmes ----------
function reqOk(state, pid, req, pair) {
  const fam = state.families[pid];
  const h = heirs(state, pid);
  switch (req) {
    case undefined: return true;
    case "eldestBad": return !!h[0] && TRAITS[h[0].trait] && !TRAITS[h[0].trait].good;
    case "adultDaughter": return fam.members.some((m) => m.alive && m.role === "child" && m.sex === "f" && m.age >= 14 && !m.spouse);
    case "kingSick": { const k = king(state, pid); return !!k && k.health >= 2; }
    case "ownBastard": return fam.members.some((m) => m.alive && m.role === "child" && m.bastard && !m.legit);
    case "queenAlive": return !!queen(state, pid);
    case "hasChild": return !!h[0];
    case "leaderNotInPact": return !!state.leader && !pair.includes(state.leader);
    case "bothMarriageable": return pair.every((p) => marriageable(state, p)) && !allied(state, pair[0], pair[1]);
    default: return true;
  }
}
function dealDilemmas(state, priv, rng) {
  const humans = state.order.filter((p) => !state.players[p].isBot);
  for (const pid of humans) priv[pid].dilemma = null;
  let free = shuffle(rng, humans);
  // un pacte (2 joueurs) presque chaque manche dès qu'on est au moins 2
  const pairs = [];
  if (free.length >= 2 && rng() < 0.75) pairs.push([free[0], free[1]]);
  if (free.length >= 4 && rng() < 0.35) pairs.push([free[2], free[3]]);
  for (const pair of pairs) {
    const usedA = priv[pair[0]].used, usedB = priv[pair[1]].used;
    const cards = DILEMMAS.filter((d) => d.type === "pact" && !usedA.includes(d.id) && !usedB.includes(d.id) && reqOk(state, pair[0], d.req, pair));
    if (!cards.length) continue;
    const card = pick(rng, cards);
    pair.forEach((pid, i) => {
      const partner = pair[1 - i];
      priv[pid].used.push(card.id);
      priv[pid].dilemma = { id: card.id, round: state.round, type: "pact", partner, ctx: ctxFor(state, pid, { partenaire: maisonName(state, partner) }) };
    });
    free = free.filter((p) => !pair.includes(p));
  }
  for (const pid of free) {
    let cards = DILEMMAS.filter((d) => d.type !== "pact" && !priv[pid].used.includes(d.id) && reqOk(state, pid, d.req, [pid]));
    if (!cards.length) { priv[pid].used = []; cards = DILEMMAS.filter((d) => d.type !== "pact" && reqOk(state, pid, d.req, [pid])); }
    // on favorise les cartes à cible pour garder l'interaction
    const weighted = [];
    for (const c of cards) { weighted.push(c); if (c.type === "target") weighted.push(c); if (c.req) weighted.push(c); }
    const card = pick(rng, weighted);
    priv[pid].used.push(card.id);
    const mine = provincesOf(state, pid);
    const nonCap = mine.filter((id) => id !== state.players[pid].capital);
    const provId = (nonCap.length ? pick(rng, nonCap) : mine[0]) || null;
    priv[pid].dilemma = { id: card.id, round: state.round, type: card.type, provId, ctx: ctxFor(state, pid, { prov: provId ? PROVINCES[provId].art : "la province", prov_en: provId ? PROVINCES[provId].en : "dans la province", prov_de: provId ? PROVINCES[provId].de : "de la province" }) };
  }
}

// ---------- fin de la phase dilemme ----------
export function finishDilemmas(state, priv, inputs, rng) {
  const lines = [];
  const out = [];
  const done = new Set();
  for (const pid of state.order) {
    const d = priv[pid] && priv[pid].dilemma;
    if (!d || done.has(pid)) continue;
    const card = DILEMMAS.find((c) => c.id === d.id);
    const inp = inputs[pid] && inputs[pid].dilemma && inputs[pid].dilemma.round === state.round ? inputs[pid].dilemma : null;
    if (card.type === "pact") {
      const partner = d.partner;
      const inpB = inputs[partner] && inputs[partner].dilemma && inputs[partner].dilemma.round === state.round ? inputs[partner].dilemma : null;
      const ca = inp && ["a", "b"].includes(inp.choice) ? inp.choice : pick(rng, ["a", "b"]);
      const cb = inpB && ["a", "b"].includes(inpB.choice) ? inpB.choice : pick(rng, ["a", "b"]);
      [[pid, partner, ca + cb], [partner, pid, cb + ca]].forEach(([me, other, key], i) => {
        const oc = card.outcomes[key];
        const ctx = { ...ctxFor(state, me, { partenaire: maisonName(state, other) }), partnerPid: other, first: i === 0, extraChron: [] };
        applyFx(state, me, oc.fx, ctx, rng, out);
        const t = [fill(oc.chron, ctx), ...ctx.extraChron.map((x) => fill(x, ctx))].join(" ");
        if (i === 0 || !["aa", "bb"].includes(key)) lines.push({ text: t, pid: me });
        priv[me].lastResult = { title: card.title, text: t, partnerChoice: i === 0 ? cb : ca };
      });
      done.add(pid); done.add(partner);
    } else {
      let ci = inp && Number.isInteger(inp.choice) && card.options[inp.choice] ? inp.choice : null;
      let target = inp && inp.target && state.players[inp.target] && inp.target !== pid ? inp.target : null;
      if (ci === null) ci = Math.floor(rng() * card.options.length);
      const opt = card.options[ci];
      if (opt.needsTarget && !target) {
        const others = state.order.filter((p) => p !== pid);
        target = state.leader && state.leader !== pid ? state.leader : pick(rng, others);
      }
      const ctx = { ...d.ctx, ...ctxFor(state, pid, { prov: d.ctx.prov, prov_en: d.ctx.prov_en, prov_de: d.ctx.prov_de }), cible: target ? maisonName(state, target) : "", targetPid: target, provId: d.provId, extraChron: [] };
      const fakeIntendant = !inp ? " (L'intendant choisit, faute d'ordres.)" : "";
      const t0 = fill(opt.chron, ctx);
      applyFx(state, pid, opt.fx, ctx, rng, out);
      const t = [t0, ...ctx.extraChron.map((x) => fill(x, ctx))].join(" ") + fakeIntendant;
      lines.push({ text: t, pid });
      priv[pid].lastResult = { title: fill(card.title, ctx), text: t };
      done.add(pid);
    }
  }
  state.pendingDilemma = { lines, out };
  state.phase = "orders";
}

// ---------- résolution des ordres ----------
export function validateOrders(state, pid, orders) {
  const pl = state.players[pid];
  const used = new Set();
  const res = [];
  for (const o of (orders && orders.actions) || []) {
    if (!o || !Number.isInteger(o.die) || o.die < 0 || o.die >= pl.dice.length || used.has(o.die)) continue;
    if (!["strike", "march", "levy", "intrigue"].includes(o.type)) continue;
    used.add(o.die);
    res.push({ ...o, value: pl.dice[o.die] });
  }
  return res;
}

export function resolveRound(state, priv, inputs, rng) {
  const steps = [];
  const P = state.provinces;
  state.revealFrom = JSON.parse(JSON.stringify(P));
  const snap = (...ids) => { const s = {}; for (const id of ids) if (id) s[id] = { owner: P[id].owner, armies: P[id].armies, plague: P[id].plague }; return s; };
  const lastRound = state.round === state.maxRounds;
  // 0. décisions des dilemmes, révélées maintenant
  if (state.pendingDilemma) {
    for (const l of state.pendingDilemma.lines) { steps.push({ kind: "dilemma", text: l.text, pid: l.pid }); chron(state, l.text, "dilemma"); }
    for (const o of state.pendingDilemma.out) if (o.kind !== "text" || true) steps.push({ ...o });
    state.pendingDilemma = null;
  }
  // ordres validés
  const orders = {};
  for (const pid of state.order) {
    const pl = state.players[pid];
    orders[pid] = pl.isBot ? validateOrders(state, pid, botOrders(state, pid, rng)) : validateOrders(state, pid, inputs[pid] && inputs[pid].orders && inputs[pid].orders.round === state.round ? inputs[pid].orders : null);
  }
  // 1. intrigues
  for (const pid of shuffle(rng, state.order)) {
    const pl = state.players[pid];
    for (const o of orders[pid].filter((x) => x.type === "intrigue")) {
      const kind = o.kind;
      if (!COSTS[kind]) continue;
      const tgt = o.target && state.players[o.target] && o.target !== pid ? o.target : null;
      if (!tgt) continue;
      if (pl.gold < COSTS[kind]) { steps.push({ kind: "intrigue", text: `${capitalize(maisonName(state, pid))} voulait intriguer, mais son trésor était vide.`, pid }); continue; }
      pl.gold -= COSTS[kind];
      const k = king(state, pid);
      let bonus = (k && k.trait === "Rusé" ? 1 : 0) + (pl.intrigueBonus || 0);
      if (kind === "seduction" && k && k.trait === "Séduisant") bonus++;
      let need = NEED[kind];
      if (kind === "poison") {
        const victim = state.families[tgt].members.find((m) => m.id === o.person && m.alive);
        if (!victim) { steps.push({ kind: "intrigue", text: `L'empoisonneur de ${maisonName(state, pid)} arriva trop tard : sa cible était déjà morte.`, pid }); continue; }
        if (victim.trait === "Paranoïaque") need++;
        if (o.value + bonus + Math.floor(rng() * 3) >= need + 1) {
          const t = `${personTitle(victim)}, ${deName(state, tgt)}, meurt dans d'atroces souffrances après le souper. Nul ne sait qui versa le poison.`;
          steps.push({ kind: "death", text: t, pid: tgt, sound: "poison" }); chron(state, t, "death");
          const out = [];
          killPerson(state, tgt, victim, "empoisonné", pid, out);
          out.forEach((x) => steps.push(x));
        } else {
          pl.prestige -= 2;
          const kk = king(state, pid); if (kk && !kk.epithets.includes("l'Empoisonneur")) kk.epithets.push("l'Empoisonneur");
          const t = `Un empoisonneur est arrêté à la cour ${deName(state, tgt)}. Sous la torture, il donne le nom de son maître : ${maisonName(state, pid)}.`;
          steps.push({ kind: "intrigue", text: t, pid }); chron(state, t, "intrigue");
        }
      } else if (kind === "seduction") {
        const q = mother(state, tgt);
        if (!q) { steps.push({ kind: "intrigue", text: `Le séducteur de ${maisonName(state, pid)} ne trouva pas de reine à séduire chez ${maisonName(state, tgt)}.`, pid }); continue; }
        if (o.value + bonus + Math.floor(rng() * 3) >= need + 1) {
          const c = newPerson(rng, { sex: rng() < 0.5 ? "m" : "f", age: 0, house: state.players[tgt].house, role: "child", bastardOf: pid });
          state.families[tgt].members.push(c);
          state.players[tgt].stats.bastardsReceived++;
          const t = `La reine ${personTitle(q)} donne naissance à ${c.sex === "f" ? "une fille" : "un fils"}, ${c.name}. L'enfant a, dit-on, les yeux de ${maisonName(state, pid)}.`;
          steps.push({ kind: "birth", text: t, pid: tgt, sound: "birth" }); chron(state, t, "intrigue");
        } else {
          pl.prestige -= 2;
          const t = `Le galant envoyé par ${maisonName(state, pid)} est surpris dans la chambre de la reine ${deName(state, tgt)}. On le rendit à son maître, castré.`;
          steps.push({ kind: "intrigue", text: t, pid }); chron(state, t, "intrigue");
        }
      } else if (kind === "bribe") {
        const prov = o.prov;
        if (!P[prov] || P[prov].owner !== tgt || prov === state.players[tgt].capital || P[prov].armies > 3) { steps.push({ kind: "intrigue", text: `L'or de ${maisonName(state, pid)} ne trouva preneur nulle part.`, pid }); continue; }
        if (o.value + bonus + Math.floor(rng() * 3) >= need + 1) {
          P[prov].owner = pid;
          const t = `La garnison de ${PROVINCES[prov].city} ouvre ses portes à ${maisonName(state, pid)}, contre une bourse bien pleine. ${capitalize(PROVINCES[prov].art)} change de camp sans un coup d'épée.`;
          steps.push({ kind: "bribe", text: t, prov, set: snap(prov), pid, sound: "coins" }); chron(state, t, "intrigue");
        } else {
          const t = `Le capitaine de ${PROVINCES[prov].city} prit l'or de ${maisonName(state, pid)}… et le remit à son seigneur.`;
          steps.push({ kind: "intrigue", text: t, pid }); chron(state, t, "intrigue");
        }
      }
      pl.intrigueBonus = 0;
    }
  }
  // 2. déplacements et levées (regroupés par maison)
  for (const pid of state.order) {
    const parts = [];
    const touched = [];
    for (const o of orders[pid].filter((x) => x.type === "march")) {
      if (!P[o.from] || !P[o.to] || P[o.from].owner !== pid || P[o.to].owner !== pid || !PROVINCES[o.from].adj.includes(o.to)) continue;
      const n = Math.min(Math.max(1, o.n | 0), o.value, P[o.from].armies - 1);
      if (n < 1) continue;
      P[o.from].armies -= n; P[o.to].armies += n;
      parts.push(`${n} armée${n > 1 ? "s" : ""} vers ${PROVINCES[o.to].art}`); touched.push(o.from, o.to);
    }
    for (const o of orders[pid].filter((x) => x.type === "levy")) {
      let to = P[o.to] && P[o.to].owner === pid ? o.to : state.players[pid].capital;
      if (!to || P[to].owner !== pid) to = provincesOf(state, pid)[0];
      if (!to) continue;
      const n = levyAmount(o.value);
      P[to].armies += n;
      parts.push(`lève ${n} armées ${PROVINCES[to].en}`); touched.push(to);
    }
    if (parts.length) steps.push({ kind: "move", text: `${capitalize(maisonName(state, pid))} : ${parts.join(", ")}.`, pid, set: snap(...touched), provs: touched });
  }
  // 3. batailles
  const strikes = [];
  for (const pid of state.order) {
    for (const o of orders[pid].filter((x) => x.type === "strike")) {
      if (state.tutorial && state.round === 1) continue;
      if (!P[o.from] || !P[o.to] || P[o.from].owner !== pid || P[o.to].owner === pid || !PROVINCES[o.from].adj.includes(o.to)) continue;
      const n = Math.min(Math.max(1, o.n | 0), P[o.from].armies - 1);
      if (n < 1) continue;
      P[o.from].armies -= n;
      // deux attaques du même seigneur sur la même province : une seule armée, le meilleur dé
      const same = strikes.find((s) => s.pid === pid && s.to === o.to);
      if (same) { same.n += n; same.bonus = Math.max(same.bonus, o.value + attackMod(state, pid)); same.froms.push(o.from); }
      else strikes.push({ pid, from: o.from, froms: [o.from], to: o.to, n, bonus: o.value + attackMod(state, pid) });
    }
  }
  const betrayed = new Set();
  const targets = shuffle(rng, [...new Set(strikes.map((s) => s.to))]);
  for (const to of targets) {
    const atts = strikes.filter((s) => s.to === to);
    const def = P[to].owner;
    const defArmies = P[to].armies;
    for (const a of atts) {
      if (def && allied(state, a.pid, def) && !betrayed.has(a.pid + def)) {
        betrayed.add(a.pid + def);
        const pl = state.players[a.pid];
        pl.prestige -= 5; pl.stats.betrayals++;
        state.alliances = state.alliances.filter((x) => !((x.a === a.pid && x.b === def) || (x.a === def && x.b === a.pid)));
        const k = king(state, a.pid); if (k && !k.epithets.includes("le Traître")) k.epithets.push("le Traître");
        const t = `Trahison ! ${capitalize(maisonName(state, a.pid))} attaque sa propre belle-famille, ${maisonName(state, def)}. Les noces sont oubliées.`;
        steps.push({ kind: "betrayal", text: t, pid: a.pid, sound: "betrayal" }); chron(state, t, "betrayal");
      }
    }
    const defTotal = defArmies + peurBonus(state.players[def]) + Math.floor(rng() * 3);
    const totals = atts.map((a) => ({ ...a, total: a.n + a.bonus + Math.floor(rng() * 3) })).sort((x, y) => y.total - x.total);
    const best = totals[0];
    const attWins = best.total > defTotal && (totals.length === 1 || best.total > totals[1].total);
    const defName = def ? maisonName(state, def) : "la milice";
    const leaderLost = (loser) => loser && state.leader && loser === state.leader;
    let text, set;
    const sumOthersN = totals.slice(1).reduce((s, a) => s + a.n, 0);
    const lostNames = totals.map((a) => maisonName(state, a.pid));
    if (attWins) {
      const remaining = Math.max(1, best.n - Math.ceil((defArmies + sumOthersN) / 2));
      const wasCapital = def && state.players[def].capital === to;
      P[to].owner = best.pid; P[to].armies = remaining;
      const wpl = state.players[best.pid];
      wpl.stats.conquests++;
      wpl.stats.armiesKilled += defArmies + sumOthersN;
      wpl.prestige += (def ? 2 : 1) * (lastRound ? 2 : 1);
      // survivants du défenseur
      if (def) {
        const survivors = Math.floor(defArmies / 2);
        const dcap = state.players[def].capital;
        if (survivors > 0 && dcap && dcap !== to && P[dcap].owner === def) P[dcap].armies += survivors;
      }
      text = `Bataille de ${PROVINCES[to].city} : ${lostNames.join(" et ")} (${best.n} armées, force ${best.total}) contre ${defName} (${defArmies} armées, force ${defTotal}). ${capitalize(maisonName(state, best.pid))} prend ${PROVINCES[to].art} !`;
      if (leaderLost(def) && best.pid !== state.leader) { wpl.prestige += 2; text += ` Le favori plie : +2 Prestige.`; }
      if (wasCapital) {
        const dpl = state.players[def];
        dpl.prestige -= 5; dpl.colere = clamp(dpl.colere + 20, 0, 100); dpl.stats.capitalLost = true;
        const loot = Math.floor(dpl.gold / 3); dpl.gold -= loot; wpl.gold += loot;
        const rest = provincesOf(state, def).sort((a, b) => P[b].armies - P[a].armies);
        dpl.capital = rest[0] || null;
        text += ` La capitale de ${maisonName(state, def)} est mise à sac (${loot} or pillés).`;
      }
      set = snap(to, ...totals.flatMap((a) => a.froms), def ? state.players[def].capital : null);
    } else {
      P[to].armies = Math.max(1, defArmies - Math.ceil(totals.reduce((s, a) => s + a.n, 0) / 2));
      if (def) { state.players[def].stats.armiesKilled += totals.reduce((s, a) => s + a.n, 0); }
      text = `Bataille de ${PROVINCES[to].city} : ${lostNames.join(" et ")} (${best.n} armées, force ${best.total}) contre ${defName} (${defArmies} armées, force ${defTotal}). ${capitalize(defName)} tient bon, l'assaillant est massacré.`;
      if (def && totals.some((a) => leaderLost(a.pid)) && def !== state.leader) { state.players[def].prestige += 2; text += ` Le favori plie : +2 Prestige.`; }
      set = snap(to, ...totals.flatMap((a) => a.froms));
    }
    steps.push({ kind: "battle", text, prov: to, from: totals.flatMap((a) => a.froms), winner: attWins ? best.pid : def, attWins, set, sound: "battle" });
    if (attWins || totals.length > 1) chron(state, text.replace(/ \(\d+ armées, force \d+\)/g, ""), "battle");
  }
  // 4. mariages proposés librement
  for (const key of Object.keys(state.proposals || {})) {
    const pr = state.proposals[key];
    const ans = inputs[pr.to] && inputs[pr.to].answers && inputs[pr.to].answers[key];
    if (ans === true && state.players[pr.from].peur < 50) {
      const out = [];
      if (marry(state, pr.from, pr.to, out)) out.forEach((x) => steps.push({ ...x, sound: "bells" }));
    } else if (ans === false) {
      const t = `${capitalize(maisonName(state, pr.to))} refuse avec mépris la demande en mariage de ${maisonName(state, pr.from)}.`;
      steps.push({ kind: "text", text: t }); chron(state, t);
    }
  }
  state.proposals = {};
  // 5. exil
  for (const pid of state.order) {
    const pl = state.players[pid];
    if (provincesOf(state, pid).length === 0) {
      pl.prestige -= 10;
      const neutral = PROV_IDS.filter((id) => !P[id].owner);
      const t0 = `${capitalize(maisonName(state, pid))} a perdu toutes ses terres.`;
      if (neutral.length) {
        const id = pick(rng, neutral);
        P[id].owner = pid; P[id].armies = 4; pl.capital = id; pl.exiled = true;
        const t = `${t0} Exilée, elle se réfugie ${PROVINCES[id].en} avec 4 armées et une rage intacte.`;
        steps.push({ kind: "exile", text: t, set: snap(id), prov: id }); chron(state, t, "exile");
      } else { steps.push({ kind: "exile", text: t0 }); chron(state, t0, "exile"); }
    }
  }
  computeLeader(state);
  // 6. fin de partie ?
  const winner = state.order.find((pid) => provincesOf(state, pid).length >= WIN_PROVINCES);
  state.reveal = { round: state.round, steps };
  state.phase = "reveal";
  state.gameOver = !!winner || state.round >= state.maxRounds;
  state.instantWinner = winner || null;
  return steps;
}
export function revealDuration(state) {
  const n = state.reveal ? state.reveal.steps.length : 0;
  return Math.min(26, Math.max(5, 2 + n * 1.6));
}

// ---------- ordres de l'ordinateur (Anglais) ----------
export function botOrders(state, pid, rng) {
  const pl = state.players[pid];
  const P = state.provinces;
  const mine = provincesOf(state, pid);
  const dice = pl.dice.map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v);
  const actions = [];
  if (!mine.length) return { actions };
  const used = new Set();
  // attaque(s) favorable(s)
  const outgoing = {};
  for (const d of dice) {
    let best = null;
    for (const from of mine) {
      const avail = P[from].armies - 1 - (outgoing[from] || 0);
      if (avail < 2) continue;
      for (const to of PROVINCES[from].adj) {
        if (P[to].owner === pid) continue;
        const prob = winProb(avail + d.v + attackMod(state, pid), defenseOf(state, to));
        const score = prob + (P[to].owner && P[to].owner === state.leader ? 0.12 : 0) + (P[to].owner ? 0.03 : 0);
        if (prob >= 0.66 && (!best || score > best.score)) best = { from, to, n: avail, score };
      }
    }
    if (best && actions.filter((a) => a.type === "strike").length < (state.round > 6 ? 2 : 1)) {
      actions.push({ die: d.i, type: "strike", from: best.from, to: best.to, n: best.n });
      outgoing[best.from] = (outgoing[best.from] || 0) + best.n;
      used.add(d.i);
    }
  }
  // levées sur la frontière la plus menacée
  const borders = mine.filter((id) => PROVINCES[id].adj.some((a) => P[a].owner !== pid));
  const threat = (id) => PROVINCES[id].adj.filter((a) => P[a].owner && P[a].owner !== pid).reduce((s, a) => s + P[a].armies, 0) - P[id].armies;
  for (const d of dice) {
    if (used.has(d.i)) continue;
    const to = (borders.length ? borders : mine).slice().sort((a, b) => threat(b) - threat(a))[0];
    actions.push({ die: d.i, type: "levy", to });
    used.add(d.i);
  }
  return { actions, round: state.round };
}

// ---------- score final ----------
export function objectiveDone(state, pid, oid) {
  const pl = state.players[pid];
  const mine = provincesOf(state, pid);
  const fam = state.families[pid];
  switch (oid) {
    case "paris": return state.provinces.idf.owner === pid;
    case "huit": return mine.length >= 8;
    case "deux_regions": return regionsOf(state, pid).length >= 2;
    case "poison2": return pl.stats.murders >= 2;
    case "capitale_rivale": return state.order.some((o) => o !== pid && state.players[o].capital && state.provinces[state.players[o].capital].owner === pid) || mine.some((id) => state.order.some((o) => o !== pid && state.players[o].firstCapital === id));
    case "colere_basse": return pl.colere < 30;
    case "peur_haute": return pl.peur >= 60;
    case "famille": return fam.members.filter((m) => m.alive && ["king", "queen", "child", "widow"].includes(m.role)).length >= 5;
    case "traitre": return pl.stats.betrayals >= 1;
    case "conquerant": return pl.stats.conquests >= 6;
    case "capitale_sauve": return !pl.stats.capitalLost;
    case "mer": return mine.filter((id) => PROVINCES[id].coast).length >= 5;
    case "riche": return pl.gold >= 20;
    case "marie": return pl.stats.married >= 1;
    default: return false;
  }
}
export function finalScore(state, priv) {
  const rows = [];
  for (const pid of state.order) {
    const pl = state.players[pid];
    const mine = provincesOf(state, pid);
    const regs = regionsOf(state, pid);
    const fam = state.families[pid];
    const alive = fam.members.filter((m) => m.alive && ["king", "queen", "child", "widow"].includes(m.role)).length;
    const objs = (priv[pid] && priv[pid].objectives || []).map((oid) => { const o = OBJECTIVES.find((x) => x.id === oid); return { id: oid, text: o.text, pts: o.pts, done: objectiveDone(state, pid, oid) }; });
    const objPts = objs.filter((o) => o.done).reduce((s, o) => s + o.pts, 0);
    const total = pl.prestige + mine.length + regs.length * 3 + objPts + alive;
    rows.push({ pid, prestige: pl.prestige, provinces: mine.length, regions: regs.length, objectives: objs, objPts, family: alive, total });
  }
  rows.sort((a, b) => b.total - a.total || b.provinces - a.provinces);
  if (state.instantWinner) { const i = rows.findIndex((r) => r.pid === state.instantWinner); const [w] = rows.splice(i, 1); rows.unshift(w); }
  return rows;
}
export function finishGame(state, priv) {
  const rows = finalScore(state, priv);
  // titres
  const titles = [];
  const stat = (pid, s) => (s === "peur" ? state.players[pid].peur : state.players[pid].stats[s] || 0);
  const defs = [
    ["Le Boucher", "armiesKilled", 1], ["Le Grand Traître", "betrayals", 1], ["L'Empoisonneur", "murders", 1], ["La Dynastie maudite", "familyDeaths", 1],
    ["Le Cocu du royaume", "bastardsReceived", 1], ["Le Conquérant", "conquests", 1], ["Le Tyran", "peur", 40],
  ];
  for (const [name, s, min] of defs) {
    let best = null, bv = min - 1;
    for (const pid of state.order) { const v = stat(pid, s); if (v > bv) { bv = v; best = pid; } }
    if (best) titles.push({ name, pid: best, value: bv, stat: s });
  }
  state.result = { rows, titles, winner: rows[0].pid, instant: !!state.instantWinner };
  const w = rows[0].pid;
  const t = state.instantWinner
    ? `${capitalize(kingLabel(state, w))}, ${deName(state, w)}, tient quinze provinces et se fait sacrer à Reims, sur les cendres des autres.`
    : `En l'an ${yearOf(state.round)}, après trente années de peste et de sang, ${maisonName(state, w)} l'emporte. ${capitalize(kingLabel(state, w))} est couronné${(king(state, w) || {}).sex === "f" ? "e" : ""} à Reims.`;
  chron(state, t, "end");
  state.phase = "end";
}

// ---------- validation des propositions de mariage (appelée par l'hôte) ----------
export function canPropose(state, from, to) {
  return from !== to && state.players[from] && state.players[to] && !state.players[to].isBot && !allied(state, from, to)
    && state.players[from].peur < 50 && marriageable(state, from) && marriageable(state, to);
}
