// Objectifs, score final, fin de partie
import { OBJECTIVES } from "../content.js?v=1795381958";
import { PROVINCES, REGIONS } from "../map.js?v=1795381958";
import { GOLD_PER_PT, PTS_PROVINCE, PTS_REGION, chron, provincesOf, regionsOf } from "./calc.js?v=1795381958";
import { capitalize, maisonName, yearOf } from "./core.js?v=1795381958";
import { deName, king, kingLabel } from "./people.js?v=1795381958";

// ---------- score final ----------
export function objectiveDone(state, pid, oid) {
  const pl = state.players[pid];
  const mine = provincesOf(state, pid);
  const fam = state.families[pid];
  const st = pl.stats;
  const region = (r) => REGIONS[r].provs.every((p) => state.provinces[p].owner === pid);
  switch (oid) {
    case "paris": return state.provinces.idf.owner === pid;
    case "huit": return mine.length >= 8;
    case "dix": return mine.length >= 10;
    case "deux_regions": return regionsOf(state, pid).length >= 2;
    case "poison2": return st.murders >= 2;
    case "capitale_rivale": return mine.some((id) => state.order.some((o) => o !== pid && state.players[o].firstCapital === id));
    case "colere_basse": return pl.colere < 30;
    case "peur_haute": return pl.peur >= 60;
    case "famille": return fam.members.filter((m) => m.alive && ["king", "queen", "child", "widow"].includes(m.role)).length >= 5;
    case "traitre": return st.betrayals >= 1;
    case "conquerant": return st.conquests >= 6;
    case "capitale_sauve": return !st.capitalLost;
    case "mer": return mine.filter((id) => PROVINCES[id].coast).length >= 5;
    case "riche": return pl.gold >= 20;
    case "marie": return st.married >= 1;
    case "reg_nord": return region("nord");
    case "reg_ouest": return region("ouest");
    case "reg_est": return region("est");
    case "reg_centre": return region("centre");
    case "reg_sudouest": return region("sudouest");
    case "reg_sudest": return region("sudest");
    case "treves": return (st.treaties || 0) >= 2;
    case "accusateur": return (st.accusationsOk || 0) >= 1;
    case "batards": return (st.bastardsSown || 0) >= 2;
    case "vieux_roi": { const k = king(state, pid); return !!k && k.id === st.firstKing; }
    case "trois_rois": return (st.kings || 1) >= 3;
    case "invaincu": return (st.attacks || 0) >= 3 && (st.attackLost || 0) === 0;
    case "genereux": return (st.goldGiven || 0) >= 10;
    case "pacifique": return (st.attacks || 0) === 0;
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
    const goldPts = Math.floor(Math.max(0, pl.gold) / GOLD_PER_PT);
    const total = pl.prestige + mine.length * PTS_PROVINCE + regs.length * PTS_REGION + objPts + alive + goldPts;
    rows.push({ pid, prestige: pl.prestige, provinces: mine.length, provPts: mine.length * PTS_PROVINCE, regions: regs.length, regPts: regs.length * PTS_REGION, objectives: objs, objPts, family: alive, gold: pl.gold, goldPts, total });
  }
  rows.sort((a, b) => b.total - a.total || b.provinces - a.provinces);
  if (state.instantWinner) { const i = rows.findIndex((r) => r.pid === state.instantWinner); const [w] = rows.splice(i, 1); rows.unshift(w); }
  return rows;
}

// résultat calculé dès la fin de la dernière manche (pour la cérémonie de la révélation), puis l'écran de fin
export function finishGame(state, priv) {
  if (!state.result) prepareResult(state, priv);
  state.phase = "end";
}

export function prepareResult(state, priv) {
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
}

export function estimateScore(state, priv, pid) {
  const pl = state.players[pid];
  const mine = provincesOf(state, pid);
  const regs = regionsOf(state, pid);
  const fam = state.families[pid];
  const alive = fam.members.filter((m) => m.alive && ["king", "queen", "child", "widow"].includes(m.role)).length;
  const objs = ((priv && priv[pid] && priv[pid].objectives) || []).reduce((s, oid) => { const o = OBJECTIVES.find((x) => x.id === oid); return s + (o && objectiveDone(state, pid, oid) ? o.pts : 0); }, 0);
  const goldPts = Math.floor(Math.max(0, pl.gold) / GOLD_PER_PT);
  return { total: pl.prestige + mine.length * PTS_PROVINCE + regs.length * PTS_REGION + objs + alive + goldPts, prestige: pl.prestige, provinces: mine.length * PTS_PROVINCE, provCount: mine.length, regions: regs.length * PTS_REGION, objectives: objs, family: alive, gold: goldPts };
}
