// Effets des dilemmes
import { PROVINCES } from "../map.js?v=1795381958";
import { chron, provincesOf } from "./calc.js?v=1795381958";
import { PROV_IDS, capitalize, clamp, maisonName, pick, shuffle } from "./core.js?v=1795381958";
import { deName, heirs, king, kingLabel, newPerson, personTitle, queen, takenNames } from "./people.js?v=1795381958";
import { addTreaty, killPerson, marry, sowBastard } from "./succession.js?v=1795381958";

// ---------- effets des dilemmes ----------
export function provForWhere(state, pid, where, rng) {
  const mine = provincesOf(state, pid);
  if (!mine.length) return null;
  const P = state.provinces;
  if (where === "capital") return state.players[pid].capital && P[state.players[pid].capital].owner === pid ? state.players[pid].capital : mine[0];
  if (where === "strongest") return mine.slice().sort((a, b) => P[b].armies - P[a].armies)[0];
  if (where === "border") {
    const threat = (id) => PROVINCES[id].adj.filter((a) => P[a].owner && P[a].owner !== pid).reduce((s, a) => s + P[a].armies, 0) - P[id].armies;
    const b = mine.filter((id) => PROVINCES[id].adj.some((a) => P[a].owner !== pid));
    return (b.length ? b : mine).sort((x, y) => threat(y) - threat(x))[0];
  }
  return pick(rng, mine);
}

export function seedPlague(state, prov) { if (prov && state.provinces[prov] && !state.provinces[prov].plague) state.provinces[prov].plague = 2; }


export function applyFx(state, pid, fxList, ctx, rng, out) {
  const pl = state.players[pid];
  if (!pl || !fxList) return;
  const fam = state.families[pid];
  const priv = ctx.priv || {};
  const findKid = (kind) => {
    const kids = fam.members.filter((m) => m.alive && m.role === "child");
    if (kind === "eldest") return heirs(state, pid)[0];
    if (kind === "son") return kids.filter((m) => m.sex === "m" && m.age >= 16).sort((a, b) => b.age - a.age)[0];
    if (kind === "youngest") return kids.sort((a, b) => a.age - b.age)[0];
    if (kind === "daughter") return kids.find((m) => m.sex === "f" && m.age >= 14 && !m.spouse);
    if (kind === "random_child") return kids.length ? pick(rng, kids) : null;
    if (kind === "bastard") return kids.find((m) => m.bastard && !m.legit);
    return null;
  };
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
    if (fx.epithet) addEpithet(state, pid, fx.epithet);
    if (fx.kill) {
      const victim = fx.kill === "king" ? king(state, pid) : fx.kill === "queen" ? queen(state, pid) : findKid(fx.kill);
      if (victim) {
        const killer = ctx.actor && ctx.actor !== pid ? ctx.actor : null;
        out.push({ kind: "death", text: `${personTitle(victim)} ${deName(state, pid)} est mort${victim.sex === "f" ? "e" : ""} : ${fx.cause || "on ne sait comment"}.`, pid });
        killPerson(state, pid, victim, fx.cause || "mort", killer, out);
      }
    }
    if (fx.disinherit) { const h = findKid(fx.disinherit === "son" ? "son" : "eldest"); if (h) h.role = "monk"; }
    if (fx.removePerson) { const d = findKid(fx.removePerson); if (d) { d.role = "gone"; d.cause = fx.cause; } }
    if (fx.health) { const k = king(state, pid); if (k) k.health = clamp(k.health + fx.health, 0, 4); }
    if (fx.intrigueBonus) pl.intrigueBonus = (pl.intrigueBonus || 0) + fx.intrigueBonus;
    if (fx.nextDice) pl.diceMod = (pl.diceMod || 0) + fx.nextDice;
    if (fx.flag) { pl.flags = pl.flags || {}; pl.flags[fx.flag] = state.round; }
    if (fx.addBastard) fam.members.push(newPerson(rng, { sex: rng() < 0.5 ? "m" : "f", age: 0, house: pl.house, role: "child", bastard: true, taken: takenNames(state) }));
    if (fx.addChildDoubt) fam.members.push(newPerson(rng, { sex: rng() < 0.5 ? "m" : "f", age: 0, house: pl.house, role: "child", taken: takenNames(state), parents: [king(state, pid), queen(state, pid)] }));
    if (fx.addChild) for (let i = 0; i < fx.addChild; i++) fam.members.push(newPerson(rng, { sex: rng() < 0.5 ? "m" : "f", age: fx.age || 0, house: pl.house, role: "child", bastard: !!fx.bastard, consanguin: fam.consanguin, taken: takenNames(state), parents: [king(state, pid), queen(state, pid)] }));
    if (fx.newQueen) { const q = newPerson(rng, { sex: "f", age: 18 + Math.floor(rng() * 8), house: pl.house, role: "queen", taken: takenNames(state) }); fam.members.push(q); fam.queenRef = { pid, id: q.id }; }
    if (fx.legitimize) { const b = findKid("bastard"); if (b) b.legit = true; }
    if (fx.removeBastardRecu || fx.killBastardRecu) {
      const b = fam.members.find((m) => m.alive && m.role === "child" && m.bastardOf && m.bastardOf !== pid);
      if (b) { if (fx.killBastardRecu) killPerson(state, pid, b, "noyé dans un bassin", null, out); else { b.role = "monk"; } }
    }
    if (fx.consanguin) fam.consanguin = true;
    if (fx.loseProvince) {
      let id = fx.loseProvince === "named" ? ctx.provId : null;
      if (fx.loseProvince === "random") { const c = provincesOf(state, pid).filter((x) => x !== pl.capital); id = c.length ? pick(rng, c) : null; }
      if (id && state.provinces[id].owner === pid && id !== pl.capital) state.provinces[id].owner = null;
    }
    if (fx.gainNeutral) {
      const mine = provincesOf(state, pid);
      const cands = PROV_IDS.filter((id) => !state.provinces[id].owner && PROVINCES[id].adj.some((a) => mine.includes(a)));
      const any = cands.length ? cands : PROV_IDS.filter((id) => !state.provinces[id].owner);
      if (!any.length) {
        // plus aucune terre libre : les colons rejoignent l'armée
        const b = provForWhere(state, pid, "border", rng);
        if (b) { state.provinces[b].armies += 3; out.push({ kind: "text", text: `Plus aucune terre libre en France : les colons de ${maisonName(state, pid)} prennent les armes (+3 armées ${PROVINCES[b].en}).`, set: { [b]: { ...state.provinces[b] } } }); }
      }
      if (any.length) { const id = pick(rng, any); state.provinces[id].owner = pid; state.provinces[id].armies = Math.max(2, state.provinces[id].armies); out.push({ kind: "text", text: `${capitalize(maisonName(state, pid))} prend possession ${PROVINCES[id].de.replace(/^de /, "de la province de ").replace(/^du /, "du ").replace(/^d'/, "de la province d'")}.`, set: { [id]: { ...state.provinces[id] } } }); }
    }
    if (fx.others) for (const o of state.order) if (o !== pid) applyFx(state, o, fx.others, { ...ctx, actor: pid, others: null }, rng, out);
    if (fx.steal && ctx.targetPid && state.players[ctx.targetPid]) { const t = state.players[ctx.targetPid]; const n = Math.min(fx.steal, t.gold); t.gold -= n; pl.gold += n; }
    if (fx.seduceTarget && ctx.targetPid) sowBastard(state, pid, ctx.targetPid, rng, out);
    if (fx.marryTarget && ctx.targetPid) marry(state, pid, ctx.targetPid, out);
    if (fx.treatyTarget && ctx.targetPid) addTreaty(state, pid, ctx.targetPid, fx.treatyTarget, out);
    if (fx.treatyPartner && ctx.partnerPid && ctx.first) addTreaty(state, pid, ctx.partnerPid, fx.treatyPartner, out);
    if (fx.breakAlliance && ctx.partnerPid) state.alliances = state.alliances.filter((x) => !((x.a === pid && x.b === ctx.partnerPid) || (x.b === pid && x.a === ctx.partnerPid)));
    if (fx.breakAllAlliances) state.alliances = state.alliances.filter((x) => x.a !== pid && x.b !== pid);
    if (fx.leaderLose && ctx.first && state.leader && state.leader !== pid) applyFx(state, state.leader, [{ armies: -fx.leaderLose * 2, where: "border" }], { ...ctx }, rng, out);
    if (fx.leaderRevolt && ctx.first && state.leader && state.leader !== pid) {
      const L = state.leader; applyFx(state, L, [{ colere: 20 }, { loseProvince: "random" }], { ...ctx }, rng, out);
      const t = `Les barons ${deName(state, L)} se révoltent et livrent une province aux rebelles.`; out.push({ kind: "revolt", text: t }); chron(state, t, "revolt");
    }
    if (fx.murder) pl.stats.murders++;
    if (fx.familyDeaths) { pl.stats.familyDeaths += fx.familyDeaths; pl.lostRound = state.round; }
    if (fx.betrayal) { pl.stats.betrayals++; addEpithet(state, pid, "le Traître"); }
    if (fx.spyObjectives && ctx.targetPid && priv[pid]) priv[pid].spied = { target: ctx.targetPid, objectives: (priv[ctx.targetPid] && priv[ctx.targetPid].objectives) || [], round: state.round };
    if (fx.chain && priv[pid]) { priv[pid].chains = priv[pid].chains || []; priv[pid].chains.push({ id: fx.chain, at: state.round + (fx.delay || 2) }); }
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
      if (rng() < fx.chance) { applyFx(state, pid, fx.then, ctx, rng, out); if (fx.thenChron && ctx.extraChron) ctx.extraChron.push(fx.thenChron); }
      else { applyFx(state, pid, fx.else, ctx, rng, out); if (fx.elseChron && ctx.extraChron) ctx.extraChron.push(fx.elseChron); }
    }
  }
}

export function addEpithet(state, pid, ep) { const k = king(state, pid); if (k && !k.epithets.includes(ep)) k.epithets.push(ep); }
