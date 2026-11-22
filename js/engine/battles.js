// Résolution des ordres : mouvements, batailles, intrigues
import { PROVINCES } from "../map.js?v=1795342564";
import { aiAnswer, aiOrders } from "./ai.js?v=1795342564";
import { allied, attackMod, chron, computeLeader, costOf, defBonusOf, housePower, levyFor, mercCostOf, noteRel, provincesOf, publicScore } from "./calc.js?v=1795342564";
import { COSTS, MERC_ARMIES, MERC_COST, NEED, PROV_IDS, WIN_PROVINCES, capitalize, clamp, deC, levyAmount, maisonName, peurBonus, pick, shuffle, unlocked } from "./core.js?v=1795342564";
import { validateOrders } from "./dilemmas.js?v=1795342564";
import { addEpithet } from "./effects.js?v=1795342564";
import { deName, king, mother, newPerson, personTitle, takenNames } from "./people.js?v=1795342564";
import { passTime } from "./rounds.js?v=1795342564";
import { prepareResult } from "./scoring.js?v=1795342564";
import { addTreaty, bound, killPerson, marry } from "./succession.js?v=1795342564";

export const FEAST_COST = 3;
// La révélation en quelques grandes cartes, les mêmes pour tous (on passe à la suivante quand tout le monde a validé)
export function revealCards(steps, gameOver) {
  const groups = [["court", ["dil"]], ["intrigue", ["intr"]], ["move", ["move"]], ["battle", ["battle"]], ["diplo", ["diplo", "end"]], ["time", ["time"]]];
  const cards = [];
  for (const [type, chs] of groups) {
    const ks = steps.map((s, k) => (chs.includes(s.ch) ? k : -1)).filter((k) => k >= 0);
    if (ks.length) cards.push({ type, ks });
  }
  cards.push({ type: "summary", ks: [] });
  if (gameOver) { cards.push({ type: "objectives", ks: [] }); cards.push({ type: "final", ks: [] }); }
  return cards;
}

export function resolveRound(state, priv, inputs, rng) {
  const steps = [];
  const P = state.provinces;
  state.revealFrom = JSON.parse(JSON.stringify(P));
  const snap = (...ids) => { const s = {}; for (const id of ids) if (id) s[id] = { owner: P[id].owner, armies: P[id].armies, plague: P[id].plague }; return s; };
  const lastRound = state.round === state.maxRounds;
  const marks = [];
  const mark = (c) => marks.push({ c, at: steps.length });
  mark("dil");
  // 0. décisions des dilemmes, révélées maintenant
  if (state.pendingDilemma) {
    for (const l of state.pendingDilemma.lines) {
      const extra = l.title ? { title: l.title, situation: l.situation, choice: l.choice, secret: !!l.secret } : null;
      steps.push({ kind: l.kind || "dilemma", text: l.text, pid: l.pid, ...(extra || {}), ...(l.votes ? { votes: l.votes, winner: l.winner, motion: l.motion } : {}) });
      chron(state, l.text, "dilemma", extra);
    }
    for (const o of state.pendingDilemma.out) if (o.kind !== "text" || true) steps.push({ ...o });
    state.pendingDilemma = null;
  }
  // ordres validés
  const orders = {};
  for (const pid of state.order) {
    const pl = state.players[pid];
    orders[pid] = pl.isBot ? validateOrders(state, pid, aiOrders(state, pid, rng, priv), priv) : validateOrders(state, pid, inputs[pid] && inputs[pid].orders && inputs[pid].orders.round === state.round ? inputs[pid].orders : null, priv);
  }
  // fêtes données au peuple (3 or : −15 Colère)
  for (const pid of state.order) {
    const pl = state.players[pid];
    const wants = pl.isBot ? pl.ai && pl.colere >= 55 && pl.gold >= 8 : !!(inputs[pid] && inputs[pid].orders && inputs[pid].orders.round === state.round && inputs[pid].orders.feast);
    if (wants && pl.gold >= FEAST_COST) {
      pl.gold -= FEAST_COST; pl.colere = clamp(pl.colere - 15, 0, 100);
      const t = `${capitalize(maisonName(state, pid))} offre une grande fête au peuple : vin, porcs rôtis et pendaisons de voleurs. La Colère retombe (−15, pour ${FEAST_COST} or).`;
      steps.push({ kind: "feast", text: t, pid }); chron(state, t, "text");
    }
  }
  mark("intr");
  // 1. intrigues
  for (const pid of shuffle(rng, state.order)) {
    const pl = state.players[pid];
    for (const o of orders[pid].filter((x) => x.type === "intrigue" && unlocked(state, "intrigue"))) {
      const kind = o.kind;
      if (!COSTS[kind]) continue;
      const tgt = o.target && state.players[o.target] && o.target !== pid ? o.target : null;
      if (!tgt) continue;
      if (pl.gold < costOf(state, pid, kind)) { steps.push({ kind: "intrigue", text: `${capitalize(maisonName(state, pid))} voulait intriguer, mais son trésor était vide.`, pid }); continue; }
      pl.gold -= costOf(state, pid, kind);
      const k = king(state, pid);
      let bonus = (k && k.trait === "Rusé" ? 1 : 0) + (pl.intrigueBonus || 0) + (housePower(state, pid).intr || 0);
      if (kind === "seduction" && k && k.trait === "Séduisant") bonus++;
      let need = NEED[kind];
      if (kind === "poison") {
        const victim = state.families[tgt].members.find((m) => m.id === o.person && m.alive);
        if (!victim) { steps.push({ kind: "intrigue", text: `L'empoisonneur de ${maisonName(state, pid)} arriva trop tard : sa cible était déjà morte.`, pid }); continue; }
        if (victim.trait === "Paranoïaque") need++;
        if (state.players[tgt].flags && state.players[tgt].flags.gardes) need++;
        if (o.value + bonus + Math.floor(rng() * 4) >= need + 2) {
          const t = `${personTitle(victim)}, ${deName(state, tgt)}, meurt dans d'atroces souffrances après le souper. Nul ne sait qui versa le poison.`;
          steps.push({ kind: "death", text: t, pid: tgt, sound: "poison" }); chron(state, t, "death");
          const out = [];
          killPerson(state, tgt, victim, "empoisonné", pid, out);
          noteRel(state, "poison", pid, tgt);
          out.forEach((x) => steps.push(x));
          const cid = "c" + Math.floor(rng() * 1e9).toString(36);
          priv.__crimes = priv.__crimes || []; priv.__crimes.push({ id: cid, round: state.round, culprit: pid, victim: tgt });
          state.unsolved = state.unsolved || []; state.unsolved.push({ id: cid, round: state.round, victim: tgt, text: t });
        } else {
          pl.prestige -= 2;
          const kk = king(state, pid); if (kk && !kk.epithets.includes("l'Empoisonneur")) kk.epithets.push("l'Empoisonneur");
          noteRel(state, "poison-rate", pid, tgt);
          const t = `Un empoisonneur est arrêté à la cour ${deName(state, tgt)} avant d'atteindre ${personTitle(victim)}. Sous la torture, il donne le nom de son maître : ${maisonName(state, pid)} (−2 Prestige, surnom « l'Empoisonneur »).`;
          steps.push({ kind: "intrigue", text: t, pid }); chron(state, t, "intrigue");
        }
      } else if (kind === "seduction") {
        const q = mother(state, tgt);
        if (!q) { steps.push({ kind: "intrigue", text: `Le séducteur de ${maisonName(state, pid)} ne trouva pas de reine à séduire chez ${maisonName(state, tgt)}.`, pid }); continue; }
        if (o.value + bonus + Math.floor(rng() * 4) >= need + 2) {
          const c = newPerson(rng, { sex: rng() < 0.5 ? "m" : "f", age: 0, house: state.players[tgt].house, role: "child", bastardOf: pid, taken: takenNames(state) });
          state.families[tgt].members.push(c);
          state.players[tgt].stats.bastardsReceived++;
          noteRel(state, "seduction", pid, tgt);
          const t = `La reine ${personTitle(q)} donne naissance à ${c.sex === "f" ? "une fille" : "un fils"}, ${c.name}. L'enfant a, dit-on, les yeux de ${maisonName(state, pid)}.`;
          steps.push({ kind: "birth", text: t, pid: tgt, sound: "birth" }); chron(state, t, "intrigue");
        } else {
          pl.prestige -= 2;
          const t = `Le galant envoyé par ${maisonName(state, pid)} est surpris dans la chambre de la reine ${deName(state, tgt)}. On le rendit à son maître, castré (−2 Prestige pour ${maisonName(state, pid)}).`;
          steps.push({ kind: "intrigue", text: t, pid }); chron(state, t, "intrigue");
        }
      } else if (kind === "bribe") {
        const prov = o.prov;
        if (!P[prov] || P[prov].owner !== tgt || prov === state.players[tgt].capital || P[prov].armies > 3) { steps.push({ kind: "intrigue", text: `L'or de ${maisonName(state, pid)} ne trouva preneur nulle part.`, pid }); continue; }
        if (o.value + bonus + Math.floor(rng() * 4) >= need + 2) {
          P[prov].owner = pid;
          noteRel(state, "corruption", pid, tgt);
          const t = `La garnison ${deC(PROVINCES[prov].city)} ouvre ses portes à ${maisonName(state, pid)}, contre une bourse bien pleine. ${capitalize(PROVINCES[prov].art)} change de camp sans un coup d'épée.`;
          steps.push({ kind: "bribe", text: t, prov, set: snap(prov), pid, sound: "coins" }); chron(state, t, "intrigue");
        } else {
          const t = `Le capitaine ${deC(PROVINCES[prov].city)} prit l'or de ${maisonName(state, pid)}… et le remit à son seigneur.`;
          steps.push({ kind: "intrigue", text: t, pid }); chron(state, t, "intrigue");
        }
      }
      pl.intrigueBonus = 0;
    }
  }
  mark("move");
  // 2. déplacements et levées (regroupés par maison)
  for (const pid of state.order) {
    const parts = [];
    const touched = [];
    const mv = [], lv = [];
    for (const o of orders[pid].filter((x) => x.type === "march")) {
      if (!P[o.from] || !P[o.to] || P[o.from].owner !== pid || P[o.to].owner !== pid || !PROVINCES[o.from].adj.includes(o.to)) continue;
      const n = Math.min(Math.max(1, o.n | 0), o.value, P[o.from].armies - 1);
      if (n < 1) continue;
      P[o.from].armies -= n; P[o.to].armies += n;
      parts.push(`${n} armée${n > 1 ? "s" : ""} ${PROVINCES[o.from].de.replace(/^de /, "de ").replace(/^du /, "du ")} vers ${PROVINCES[o.to].art}`); touched.push(o.from, o.to); mv.push({ from: o.from, to: o.to, n });
    }
    for (const o of orders[pid].filter((x) => x.type === "levy")) {
      let to = P[o.to] && P[o.to].owner === pid ? o.to : state.players[pid].capital;
      if (!to || P[to].owner !== pid) to = provincesOf(state, pid)[0];
      if (!to) continue;
      let n = levyFor(state, pid, o.value), merc = false;
      const mc = mercCostOf(state, pid);
      // mercenaires : de l'or pour 2 armées de plus
      if (o.merc && state.players[pid].gold >= mc) { state.players[pid].gold -= mc; n += MERC_ARMIES; merc = true; }
      P[to].armies += n;
      parts.push(`lève ${n} armées ${PROVINCES[to].en}${merc ? " (dont des mercenaires payés " + mc + " or)" : ""}`); touched.push(to); lv.push({ to, n });
    }
    if (parts.length) steps.push({ kind: "move", text: `${capitalize(maisonName(state, pid))} : ${parts.join(", ")}.`, pid, set: snap(...touched), provs: touched, mv, lv });
  }
  mark("battle");
  // 3. batailles
  const strikes = [];
  for (const pid of state.order) {
    for (const o of orders[pid].filter((x) => x.type === "strike")) {
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
      if (def && bound(state, a.pid, def) && !betrayed.has(a.pid + def)) {
        betrayed.add(a.pid + def);
        const pl = state.players[a.pid];
        const wasAllied = allied(state, a.pid, def);
        pl.prestige -= 5; pl.stats.betrayals++;
        noteRel(state, "trahison", a.pid, def);
        state.alliances = state.alliances.filter((x) => !((x.a === a.pid && x.b === def) || (x.a === def && x.b === a.pid)));
        state.treaties = (state.treaties || []).filter((x) => !((x.a === a.pid && x.b === def) || (x.a === def && x.b === a.pid)));
        if (priv[def]) { priv[def].grudges = priv[def].grudges || []; if (!priv[def].grudges.includes(a.pid)) priv[def].grudges.push(a.pid); }
        const k = king(state, a.pid); if (k && !k.epithets.includes("le Traître")) k.epithets.push("le Traître");
        const t = wasAllied ? `Trahison ! ${capitalize(maisonName(state, a.pid))} attaque sa propre belle-famille, ${maisonName(state, def)}. Les noces sont oubliées.` : `Trahison ! ${capitalize(maisonName(state, a.pid))} rompt sa trêve et attaque ${maisonName(state, def)}. Sa parole ne vaut plus rien.`;
        steps.push({ kind: "betrayal", text: t, pid: a.pid, sound: "betrayal" }); chron(state, t, "betrayal");
      }
    }
    const defTotal = defArmies + defBonusOf(state, def) + Math.floor(rng() * 3);
    for (const a of atts) if (def) noteRel(state, "attaque", a.pid, def);
    const totals = atts.map((a) => ({ ...a, total: a.n + a.bonus + Math.floor(rng() * 3) })).sort((x, y) => y.total - x.total);
    const best = totals[0];
    const attWins = best.total > defTotal && (totals.length === 1 || best.total > totals[1].total);
    const defName = def ? maisonName(state, def) : "la milice";
    const leaderLost = (loser) => loser && state.leader && loser === state.leader;
    for (const a of totals) { state.players[a.pid].stats.attacks = (state.players[a.pid].stats.attacks || 0) + 1; if (!(attWins && a === best)) state.players[a.pid].stats.attackLost = (state.players[a.pid].stats.attackLost || 0) + 1; }
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
      wpl.prestige += lastRound ? 3 : 1;
      // survivants du défenseur
      if (def) {
        const survivors = Math.floor(defArmies / 2);
        const dcap = state.players[def].capital;
        if (survivors > 0 && dcap && dcap !== to && P[dcap].owner === def) P[dcap].armies += survivors;
      }
      text = `Bataille ${deC(PROVINCES[to].city)} : ${lostNames.join(" et ")} (${best.n} armées, force ${best.total}) contre ${defName} (${defArmies} armées, force ${defTotal}). ${capitalize(maisonName(state, best.pid))} prend ${PROVINCES[to].art} !`;
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
      text = `Bataille ${deC(PROVINCES[to].city)} : ${lostNames.join(" et ")} (${best.n} armées, force ${best.total}) contre ${defName} (${defArmies} armées, force ${defTotal}). ${capitalize(defName)} tient bon, l'assaillant est massacré.`;
      if (def && totals.some((a) => leaderLost(a.pid)) && def !== state.leader) { state.players[def].prestige += 2; text += ` Le favori plie : +2 Prestige.`; }
      set = snap(to, ...totals.flatMap((a) => a.froms));
    }
    steps.push({ kind: "battle", text, prov: to, from: totals.flatMap((a) => a.froms), winner: attWins ? best.pid : def, attWins, set, sound: "battle",
      atk: totals.map((a) => ({ pid: a.pid, n: a.n, bonus: a.bonus, total: a.total })), def, defArmies, defTotal, defBonus: defBonusOf(state, def) });
    if (attWins && def) noteRel(state, "conquete", best.pid, def);
    if (attWins || totals.length > 1) chron(state, text.replace(/ \(\d+ armées, force \d+\)/g, ""), "battle");
  }
  mark("diplo");
  // 4. diplomatie : mariages, trêves, dons, accusations
  if (!unlocked(state, "diplomacy")) state.proposals = {};
  for (const key of Object.keys(state.proposals || {})) {
    const pr = state.proposals[key];
    const kind = pr.kind || "marriage";
    const toPl = state.players[pr.to];
    let ans = inputs[pr.to] && inputs[pr.to].answers && inputs[pr.to].answers[key];
    if (toPl && toPl.isBot && toPl.ai) ans = aiAnswer(state, priv, pr.to, pr, rng);
    if (state.players[pr.from] && state.players[pr.from].isBot && state.players[pr.from].ai && state.players[pr.to] && state.players[pr.to].isBot) ans = ans ?? aiAnswer(state, priv, pr.to, pr, rng);
    const out = [];
    if (ans === true) {
      if (kind === "marriage" && state.players[pr.from].peur < 50) { if (marry(state, pr.from, pr.to, out)) out.forEach((x) => steps.push({ ...x, sound: "bells" })); }
      if (kind === "treaty") { addTreaty(state, pr.from, pr.to, 3, out); noteRel(state, "treve", pr.from, pr.to); out.forEach((x) => steps.push({ ...x, sound: "seal" })); }
    } else if (ans === false) {
      const t = kind === "treaty" ? `${capitalize(maisonName(state, pr.to))} refuse la trêve proposée par ${maisonName(state, pr.from)}.` : `${capitalize(maisonName(state, pr.to))} refuse avec mépris la demande en mariage de ${maisonName(state, pr.from)}.`;
      steps.push({ kind: "text", text: t }); chron(state, t);
    }
  }
  state.proposals = {};
  for (const pid of state.order) {
    const gifts = unlocked(state, "diplomacy") && inputs[pid] && inputs[pid].gifts && inputs[pid].gifts.round === state.round ? inputs[pid].gifts.items || [] : [];
    for (const g of gifts.slice(0, 3)) {
      const to = state.players[g.to];
      const n = Math.min(Math.max(0, g.amount | 0), state.players[pid].gold);
      if (!to || g.to === pid || n <= 0) continue;
      state.players[pid].gold -= n; to.gold += n; state.players[pid].stats.goldGiven = (state.players[pid].stats.goldGiven || 0) + n;
      noteRel(state, "or", pid, g.to);
      const t = `${capitalize(maisonName(state, pid))} fait porter ${n} pièce${n > 1 ? "s" : ""} d'or à ${maisonName(state, g.to)}. Cadeau, pot-de-vin ou promesse ?`;
      steps.push({ kind: "gift", text: t, pid, sound: "coins" }); chron(state, t, "gift");
    }
    const acc = unlocked(state, "hidden") && inputs[pid] && inputs[pid].accuse && inputs[pid].accuse.round === state.round ? inputs[pid].accuse : null;
    if (acc && state.players[acc.target] && acc.target !== pid) {
      const crime = (priv.__crimes || []).find((c) => c.id === acc.crime);
      const uns = (state.unsolved || []).find((u) => u.id === acc.crime);
      if (!uns) continue;
      if (crime && crime.culprit === acc.target) {
        state.players[acc.target].prestige -= 4; state.players[pid].prestige += 2;
        state.players[pid].stats.accusationsOk = (state.players[pid].stats.accusationsOk || 0) + 1;
        noteRel(state, "accusation", pid, acc.target);
        addEpithet(state, acc.target, "l'Assassin");
        state.unsolved = state.unsolved.filter((u) => u.id !== acc.crime);
        if (priv[crime.victim]) { priv[crime.victim].grudges = priv[crime.victim].grudges || []; priv[crime.victim].grudges.push(acc.target); }
        const t = `${capitalize(maisonName(state, pid))} accuse ${maisonName(state, acc.target)} devant toutes les cours… et apporte les preuves. Le crime est démasqué : ${maisonName(state, acc.target)} est couverte de honte (−4 Prestige).`;
        steps.push({ kind: "betrayal", text: t, pid, sound: "betrayal" }); chron(state, t, "betrayal");
      } else {
        state.players[pid].prestige -= 2;
        const t = `${capitalize(maisonName(state, pid))} accuse ${maisonName(state, acc.target)} d'un crime… sans la moindre preuve. Calomnie ! (−2 Prestige)`;
        steps.push({ kind: "text", text: t, pid }); chron(state, t);
      }
    }
  }
  // les crimes trop anciens sont oubliés
  state.unsolved = (state.unsolved || []).filter((u) => u.round >= state.round - 2);
  mark("end");
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
  state.gameOver = !!winner || state.round >= state.maxRounds;
  state.instantWinner = winner || null;
  // 7. trois années passent (sauf à la toute fin) : montrées dans la même révélation
  if (!state.gameOver) {
    mark("time");
    const out = [];
    passTime(state, priv, rng, out);
    const all = snap(...PROV_IDS);
    out.forEach((x) => steps.push({ ...x, set: all }));
  }
  marks.forEach((m, i) => { const end = i + 1 < marks.length ? marks[i + 1].at : steps.length; for (let k = m.at; k < end; k++) steps[k].ch = m.c; });
  // historique des scores visibles, manche par manche
  state.history = state.history || [];
  state.history.push({ round: state.round, s: Object.fromEntries(state.order.map((pid) => [pid, publicScore(state, pid)])) });
  if (state.gameOver) prepareResult(state, priv);
  state.reveal = { round: state.round, steps, cards: revealCards(steps, state.gameOver) };
  state.revCard = 0;
  state.phase = "reveal";
  return steps;
}
