// Mort, succession, guerre civile, mariages, traités
import { PROVINCES } from "../map.js?v=1795349588";
import { allied, chron, provincesOf } from "./calc.js?v=1795349588";
import { capitalize, maisonName, shuffle, yearOf } from "./core.js?v=1795349588";
import { deName, heirs, mother, newPerson, ownerOf, personTitle, queen, takenNames } from "./people.js?v=1795349588";

// ---------- mort et succession ----------
export function killPerson(state, pid, person, cause, killer = null, out = []) {
  if (!person || !person.alive) return out;
  pid = ownerOf(state, person) || pid;
  person.alive = false; person.cause = cause;
  const pl = state.players[pid];
  if (pl) { pl.stats.familyDeaths++; pl.lostRound = state.round; }
  if (killer && state.players[killer]) state.players[killer].stats.murders++;
  // reine d'une autre maison ?
  for (const p of state.order) { const f = state.families[p]; if (f.queenRef && f.queenRef.id === person.id) f.queenRef = null; }
  const fam = state.families[pid];
  if (fam && fam.kingId === person.id) succession(state, pid, out);
  return out;
}

export function succession(state, pid, out, rng = Math.random) {
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
    if (state.players[pid]) state.players[pid].stats.kings = (state.players[pid].stats.kings || 1) + 1;
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

export function claimsOnDeath(state, pid, out) {
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

export function civilWar(state, pid, out, rng) {
  const pl = state.players[pid];
  const fam = state.families[pid];
  const mine = provincesOf(state, pid).filter((id) => id !== pl.capital);
  const lost = shuffle(rng, mine).slice(0, Math.floor(mine.length / 3));
  const ally = state.alliances.find((x) => x.a === pid || x.b === pid);
  const allyPid = ally ? (ally.a === pid ? ally.b : ally.a) : null;
  const set = {};
  lost.forEach((id, i) => { state.provinces[id].owner = i === 0 && allyPid ? allyPid : null; set[id] = { ...state.provinces[id] }; });
  pl.prestige -= 5;
  pl.stats.kings = (pl.stats.kings || 1) + 1;
  const cousin = newPerson(rng, { sex: "m", age: 30 + Math.floor(rng() * 10), house: pl.house, role: "king", taken: takenNames(state) });
  const wife = newPerson(rng, { sex: "f", age: 20 + Math.floor(rng() * 8), house: pl.house, role: "queen", taken: takenNames(state) });
  fam.members.push(cousin, wife); fam.kingId = cousin.id; fam.queenRef = { pid, id: wife.id };
  let txt = `Il n'y a plus d'héritier chez ${maisonName(state, pid)}. Guerre civile : les barons se partagent ${lost.length} province${lost.length > 1 ? "s" : ""}, et un lointain cousin, ${personTitle(cousin)}, ramasse la couronne dans la boue.`;
  if (allyPid && lost.length) txt += ` La belle-famille, ${maisonName(state, allyPid)}, en profite pour prendre ${PROVINCES[lost[0]].art}.`;
  out.push({ kind: "death", text: txt, set, pid });
  chron(state, txt, "death");
}

export function sowBastard(state, from, to, rng, out) {
  const q = mother(state, to);
  if (!q) return false;
  const c = newPerson(rng, { sex: rng() < 0.5 ? "m" : "f", age: 0, house: state.players[to].house, role: "child", bastardOf: from, taken: takenNames(state) });
  state.families[to].members.push(c);
  state.players[to].stats.bastardsReceived++;
  state.players[from].stats.bastardsSown = (state.players[from].stats.bastardsSown || 0) + 1;
  return true;
}

export function bound(state, a, b) { return allied(state, a, b) || (state.treaties || []).some((t) => ((t.a === a && t.b === b) || (t.a === b && t.b === a)) && t.until >= state.round); }

export function addTreaty(state, a, b, rounds, out) {
  if (!state.players[a] || !state.players[b] || a === b) return;
  state.treaties = (state.treaties || []).filter((t) => !((t.a === a && t.b === b) || (t.a === b && t.b === a)));
  state.treaties.push({ a, b, until: state.round + rounds });
  state.players[a].stats.treaties = (state.players[a].stats.treaties || 0) + 1;
  state.players[b].stats.treaties = (state.players[b].stats.treaties || 0) + 1;
  const t = `${capitalize(maisonName(state, a))} et ${maisonName(state, b)} signent une trêve jusqu'en ${yearOf(state.round + rounds)}. La rompre serait une trahison.`;
  out.push({ kind: "treaty", text: t }); chron(state, t, "treaty");
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
