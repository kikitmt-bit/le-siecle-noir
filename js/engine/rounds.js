// Début de manche : revenus, événements du monde, dés
import { DEATH_CHANCE, EVENTS } from "../content.js?v=1795389300";
import { PROVINCES, REGIONS } from "../map.js?v=1795389300";
import { aiOffers } from "./ai.js?v=1795389300";
import { canPropose, chron, computeLeader, housePower, provincesOf, regionsOf } from "./calc.js?v=1795389300";
import { PROV_IDS, capitalize, clamp, deC, maisonName, peurBonus, pick, shuffle, unlocked } from "./core.js?v=1795389300";
import { dealDilemmas } from "./dilemmas.js?v=1795389300";
import { seedPlague } from "./effects.js?v=1795389300";
import { deName, heirs, king, kingLabel, mother, naturalEpithet, newPerson, personTitle, takenNames } from "./people.js?v=1795389300";
import { estimateScore } from "./scoring.js?v=1795389300";
import { killPerson } from "./succession.js?v=1795389300";

// ---------- début de manche ----------
export function snapshotPlayers(state) {
  const snap = {};
  for (const pid of state.order) {
    const pl = state.players[pid];
    const mine = provincesOf(state, pid);
    snap[pid] = { gold: pl.gold, prestige: pl.prestige, colere: pl.colere, peur: pl.peur, provs: mine, armies: mine.reduce((s, id) => s + state.provinces[id].armies, 0), family: state.families[pid].members.filter((m) => m.alive && m.role !== "gone" && m.role !== "monk").map((m) => m.id) };
  }
  return snap;
}

// Début de manche : les dés et les dilemmes. (Le temps qui passe, revenus, morts, naissances, révoltes,
// est calculé à la fin de la manche précédente par passTime, pour être montré dans la même révélation.)
export function startRound(state, priv, rng) {
  state.roundStart = snapshotPlayers(state);
  state.round++;
  state.news = [];
  state.proposals = {};
  state.treaties = (state.treaties || []).filter((t) => t.until >= state.round);
  computeLeader(state);
  rollDice(state, rng, priv);
  dealDilemmas(state, priv, rng);
  aiOffers(state, priv, rng);
  state.phase = "dilemma";
}

// Solde des troupes : 1 or par tranche de 5 armées
export const upkeepOf = (state, pid) => Math.floor(provincesOf(state, pid).reduce((s, id) => s + state.provinces[id].armies, 0) / 5) + (housePower(state, pid).upkeep || 0);
// Revenu brut d'une maison (avant la solde)
export function incomeOf(state, pid) {
  const pl = state.players[pid];
  const mine = provincesOf(state, pid);
  const hp = housePower(state, pid);
  const allies = hp.noAllyGold ? 0 : state.alliances.filter((x) => x.a === pid || x.b === pid).length;
  const coast = hp.coastGold ? mine.filter((id) => PROVINCES[id].coast).length * hp.coastGold : 0;
  return { provinces: mine.length, allies, coast, foire: pl.flags && pl.flags.foire ? 1 : 0, house: hp.gold || 0, total: Math.max(0, mine.length + allies + coast + (pl.flags && pl.flags.foire ? 1 : 0) + (hp.gold || 0)) };
}

// Trois années passent : revenus et solde, vieillissement, morts, naissances, révoltes, peste, événements.
export function passTime(state, priv, rng, out) {
  const eco = [];
  for (const pid of state.order) {
    const pl = state.players[pid];
    const mine = provincesOf(state, pid);
    const hp = housePower(state, pid);
    {
      const regs = regionsOf(state, pid);
      // économie : revenu, puis solde des troupes ; sans or pour payer, des soldats désertent
      const inc = incomeOf(state, pid);
      const up = upkeepOf(state, pid);
      pl.gold += inc.total;
      let desert = 0;
      if (pl.gold >= up) pl.gold -= up;
      else {
        desert = (up - pl.gold) * 2; pl.gold = 0;
        let left = desert;
        for (const id of mine.slice().sort((a, b) => state.provinces[b].armies - state.provinces[a].armies)) { while (left > 0 && state.provinces[id].armies > 1) { state.provinces[id].armies--; left--; } }
        desert -= left;
      }
      if (pl.house !== "anglais") eco.push({ pid, income: inc.total, upkeep: up, desert, gold: pl.gold });
      const cap = pl.capital && state.provinces[pl.capital].owner === pid ? pl.capital : mine[0];
      const bonus = 2 + regs.reduce((s, r) => s + REGIONS[r].provs.length - 1, 0);
      if (cap) state.provinces[cap].armies += bonus;
      pl.prestige += regs.length + (hp.prestige && (!hp.prestigeIfCalm || pl.colere < 50) ? hp.prestige : 0);
      pl.colere = clamp(pl.colere - 5 + (hp.colere || 0), 0, 100);
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
        { const old = personTitle(m); if (naturalEpithet(state, pid, m)) { const t = `${old}, ${deName(state, pid)} : on ne l'appelle plus que ${personTitle(m)}.`; out.push({ kind: "event", text: t, pid }); chron(state, t, "text"); } }
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
        const volage = pl.flags && pl.flags.reine_volage && rng() < 0.35 ? pick(rng, state.order.filter((o) => o !== pid)) : null;
        const c = newPerson(rng, { sex: rng() < 0.5 ? "m" : "f", age: 0, house: pl.house, role: "child", consanguin: fam.consanguin, bastardOf: volage, taken: takenNames(state), parents: [q, king(state, pid)] });
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
          const t = `Jacquerie ! La Colère du peuple ${deName(state, pid)} a atteint 80 : les paysans ${PROVINCES[id].de} massacrent leurs seigneurs et chassent ${maisonName(state, pid)}. La province devient neutre, et la Colère retombe à 50.`;
          out.push({ kind: "revolt", text: t, prov: id, pid }); chron(state, t, "revolt");
        }
      }
    }
  }
  if (eco.length) out.push({ kind: "economy", text: "Le trésor : revenus des provinces et des mariages, moins la solde des troupes (1 or pour 5 armées).", rows: eco });
  {
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
    if (rng() < 0.6) worldEvent(state, rng, out);
    if (rng() < 0.15) worldEvent(state, rng, out);
  }
  computeLeader(state);
  // alerte : roi mourant sans héritier
  for (const pid of state.order) {
    const k = king(state, pid);
    if (k && k.health >= 3 && !heirs(state, pid).length) { const t = `${capitalize(kingLabel(state, pid))} est ${k.health >= 4 ? "mourant" : "gravement malade"}, et ${maisonName(state, pid)} n'a aucun héritier. Les barons affûtent leurs couteaux.`; out.push({ kind: "text", text: t, pid }); }
  }
  // sursaut des malmenés : la maison la plus en retard reçoit de l'aide (pour qu'un mauvais départ ne soit jamais perdu d'avance)
  if (state.round >= 3 && state.order.length >= 3) {
    const sc = state.order.filter((p) => !state.players[p].exiled && provincesOf(state, p).length).map((p) => ({ p, s: estimateScore(state, {}, p).total })).sort((a, b) => a.s - b.s);
    if (sc.length >= 2 && sc[sc.length - 1].s - sc[0].s >= 8) {
      const low = sc[0].p, pl = state.players[low];
      const cap = pl.capital && state.provinces[pl.capital] && state.provinces[pl.capital].owner === low ? pl.capital : provincesOf(state, low)[0];
      if (cap) state.provinces[cap].armies += 2;
      pl.gold += 2;
      const t = `Les déshérités, les routiers et les bannis se rallient à ${maisonName(state, low)}, la plus malmenée du royaume : +2 armées et +2 or.`;
      out.push({ kind: "text", text: t, pid: low }); chron(state, t, "text");
    }
  }
  computeLeader(state);
}


export function worldEvent(state, rng, out) {
  const pool = [];
  for (const e of EVENTS) for (let i = 0; i < e.weight; i++) pool.push(e);
  const ev = pick(rng, pool);
  const P = state.provinces;
  const all = state.order;
  const bot = all.find((p) => state.players[p].house === "anglais");
  const say = (t, kind = "event", extra = {}) => { out.push({ kind, text: t, ...extra }); chron(state, t, kind); };
  const randPlayer = () => pick(rng, all);
  const addAll = (k, v, min = 0, max = 100) => all.forEach((p) => (state.players[p][k] = clamp(state.players[p][k] + v, min, max)));
  switch (ev.id) {
    case "debarquement": {
      // les Anglais visent en priorité les côtes du joueur en tête
      let coast = PROV_IDS.filter((id) => PROVINCES[id].coast && P[id].owner !== bot && id !== "corse");
      const lead = coast.filter((id) => state.leader && P[id].owner === state.leader);
      if (lead.length && rng() < 0.7) coast = lead;
      const id = pick(rng, coast);
      const p = P[id];
      const att = 4 + Math.floor(rng() * 3), def = p.armies + peurBonus(state.players[p.owner]) + Math.floor(rng() * 3);
      if (att > def) { const prev = p.owner; p.owner = bot || null; p.armies = Math.max(1, 4 - Math.ceil(p.armies / 2)); say(`Les Anglais débarquent ${PROVINCES[id].en} et écrasent ${prev ? maisonName(state, prev) : "la milice locale"}.`, "event", { prov: id, set: { [id]: { ...p } } }); }
      else { p.armies = Math.max(1, p.armies - 2); say(`Les Anglais débarquent ${PROVINCES[id].en}, mais sont rejetés à la mer.`, "event", { prov: id }); }
      break;
    }
    case "peste": { const id = pick(rng, PROV_IDS); seedPlague(state, id); say(`La peste noire réapparaît ${PROVINCES[id].en}.`, "plague", { prov: id }); break; }
    case "recolte": all.forEach((p) => (state.players[p].gold += 2)); say("Les blés furent beaux cette année : chaque maison gagne 2 or."); break;
    case "comete": addAll("colere", 10); say("Une comète traverse le ciel. Les prêcheurs annoncent la fin du monde : la Colère monte partout."); break;
    case "hiver": PROV_IDS.forEach((id) => { if (P[id].armies >= 4) P[id].armies--; }); say("Le grand hiver gèle les rivières : les grosses armées perdent chacune un homme de froid."); break;
    case "famine": all.forEach((p) => { state.players[p].gold = Math.max(0, state.players[p].gold - 1); }); addAll("colere", 10); say("La grande famine : on mange les chats, puis les rats. Chaque maison perd 1 or et le peuple gronde."); break;
    case "croisade": all.forEach((p) => { const c = state.players[p].capital; if (c && P[c].owner === p && P[c].armies > 1) P[c].armies--; state.players[p].prestige += 1; }); say("Le pape prêche une croisade : chaque maison envoie des chevaliers mourir en Orient (−1 armée, +1 Prestige)."); break;
    case "schisme": { let t = "Le schisme déchire l'Église : deux papes s'excommunient."; all.forEach((p) => { const f = state.players[p].flags || {}; if (f.avignon) state.players[p].gold += 3; if (f.rome) state.players[p].prestige += 3; }); say(t + " Leurs partisans en profitent."); break; }
    case "compagnie": { const n = PROV_IDS.filter((id) => !P[id].owner); if (n.length) { const id = pick(rng, n); P[id].armies += 4; say(`La Grande Compagnie, une armée de mercenaires sans maître, s'installe ${PROVINCES[id].en} et rançonne la région.`, "event", { prov: id, set: { [id]: { ...P[id] } } }); } break; }
    case "foire": { const o = P.champagne.owner; if (o) { state.players[o].gold += 4; say(`Les foires de Champagne attirent les marchands de toute l'Europe : ${maisonName(state, o)} encaisse 4 or.`); } else say("Les foires de Champagne se tiennent sans seigneur : les marchands gardent tout."); break; }
    case "seisme": { const id = pick(rng, PROV_IDS); P[id].armies = Math.max(1, P[id].armies - 2); say(`Un tremblement de terre ravage ${PROVINCES[id].art} : les murailles s'effondrent sur la garnison.`, "event", { prov: id, set: { [id]: { ...P[id] } } }); break; }
    case "miracle": { const p = randPlayer(); state.players[p].prestige += 3; state.players[p].colere = clamp(state.players[p].colere - 10, 0, 100); say(`Une source miraculeuse jaillit sur les terres ${deName(state, p)}. Les pèlerins affluent (+3 Prestige).`); break; }
    case "sauterelles": all.forEach((p) => (state.players[p].gold = Math.max(0, state.players[p].gold - 2))); say("Une nuée de sauterelles dévore les récoltes du royaume : chaque maison perd 2 or."); break;
    case "vin": addAll("colere", -8); say("La meilleure vendange depuis cent ans : tout le royaume est ivre, et beaucoup moins en colère."); break;
    case "vacance": { const last = all.slice().sort((a, b) => state.players[a].prestige - state.players[b].prestige)[0]; if (state.leader) state.players[state.leader].prestige -= 2; state.players[last].prestige += 2; say(`Le roi de France meurt sans héritier. Les grands se méfient du plus puissant (${state.leader ? maisonName(state, state.leader) + " −2" : "personne"}) et courtisent le plus faible (${maisonName(state, last)} +2).`); break; }
    case "inondation": { shuffle(rng, PROV_IDS).slice(0, 3).forEach((id) => (P[id].armies = Math.max(1, P[id].armies - 1))); say("La Loire et le Rhône débordent : trois provinces voient leurs garnisons noyées."); break; }
    case "tournoi": { const p = randPlayer(); state.players[p].prestige += 2; say(`Au grand tournoi de Paris, le champion ${deName(state, p)} désarçonne tous ses adversaires (+2 Prestige).`); break; }
    case "bourgeois": { if (state.leader) { const c = state.players[state.leader].capital; if (c && P[c].owner === state.leader) P[c].armies = Math.max(1, P[c].armies - 2); state.players[state.leader].colere = clamp(state.players[state.leader].colere + 10, 0, 100); say(`Les bourgeois ${deC(PROVINCES[c].city)} se soulèvent contre ${maisonName(state, state.leader)}, trop riche, trop puissante.`); } break; }
    case "eclipse": addAll("peur", 10); say("Une éclipse plonge le royaume dans la nuit en plein midi. Les seigneurs en profitent pour faire régner la terreur."); break;
    case "fievre": all.forEach((p) => { const m = state.families[p].members.filter((x) => x.alive && x.role !== "gone" && x.role !== "monk"); if (m.length) { const t = pick(rng, m); t.health = clamp(t.health + 1, 0, 4); } }); say("Une fièvre maligne court les cours d'Europe : un membre de chaque famille tombe malade."); break;
    case "cathares": { const o = P.languedoc.owner; if (o) state.players[o].colere = clamp(state.players[o].colere + 15, 0, 100); else P.languedoc.armies += 2; say("Les derniers cathares prennent les armes dans le Languedoc."); break; }
    case "monstre": { const p = randPlayer(); state.players[p].colere = clamp(state.players[p].colere + 10, 0, 100); say(`Un enfant né avec deux têtes sur les terres ${deName(state, p)} sème la panique (+10 Colère).`); break; }
    case "templiers": { const p = randPlayer(); state.players[p].gold += 5; say(`Des paysans trouvent un coffre des Templiers sur les terres ${deName(state, p)} (+5 or).`); break; }
    case "espions": all.forEach((p) => (state.players[p].intrigueBonus = (state.players[p].intrigueBonus || 0) + 1)); say("Une saison de complots : toutes les cours recrutent des espions (+1 aux intrigues pour tous)."); break;
    case "noces": { const a = randPlayer(); const others = all.filter((o) => o !== a && canPropose(state, a, o, "marriage")); if (others.length) { const b = pick(rng, others); state.proposals = state.proposals || {}; state.proposals[`marriage:${a}__${b}`] = { kind: "marriage", from: a, to: b, forced: true }; say(`Le pape exige un mariage entre ${maisonName(state, a)} et ${maisonName(state, b)} pour sceller la paix. Encore faut-il que les deux acceptent.`); } else say("Le pape rêve de mariages et de paix. Personne ne l'écoute."); break; }
  }
}

export function rollDice(state, rng, priv) {
  for (const pid of state.order) {
    const pl = state.players[pid];
    const k = king(state, pid);
    let n = pl.house === "anglais" ? 2 : k && k.trait === "Simple d'esprit" ? 2 : 3;
    n = clamp(n + (pl.diceMod || 0), 1, 5);
    pl.diceMod = 0;
    const dice = Array.from({ length: n }, () => 1 + Math.floor(rng() * 6));
    pl.extraDie = new Set(dice).size < dice.length;
    if (pl.extraDie) dice.push(2);
    // un dé reste caché aux autres joueurs : c'est le bluff
    const hid = n >= 2 && unlocked(state, "hidden") ? Math.floor(rng() * n) : -1;
    pl.hiddenIdx = hid;
    if (priv && priv[pid]) priv[pid].hidden = hid >= 0 ? { round: state.round, idx: hid, v: dice[hid] } : null;
    pl.dice = dice.map((v, i) => (i === hid ? 0 : v));
  }
}

// Relancer un dé contre de l'or (une fois par manche). Renvoie la nouvelle valeur, ou null si impossible.
export const REROLL_COST = 2;
export function rerollDie(state, priv, pid, idx, rng) {
  const pl = state.players[pid];
  if (!pl || pl.rerolled === state.round || pl.gold < REROLL_COST || !Number.isInteger(idx) || idx < 0 || idx >= pl.dice.length) return null;
  const v = 1 + Math.floor(rng() * 6);
  pl.gold -= REROLL_COST; pl.rerolled = state.round;
  const h = priv && priv[pid] && priv[pid].hidden;
  if (h && h.idx === idx && h.round === state.round) h.v = v; else pl.dice[idx] = v;
  return v;
}

export function realDice(state, priv, pid) {
  const pl = state.players[pid];
  const h = priv && priv[pid] && priv[pid].hidden;
  return pl.dice.map((v, i) => (h && i === h.idx && h.round === state.round ? h.v : v));
}
