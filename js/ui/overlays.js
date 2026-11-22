// Surcouches : objectifs, dilemme, interlude, fin de partie, règles
import * as A from "../audio.js?v=1795389300";
import { COUNCIL, DILEMMAS, OBJECTIVES } from "../content.js?v=1795389300";
import * as E from "../engine.js?v=1795389300";
import { GLOSSARY, ICON, UNLOCK_INFO, chipsHtml, term } from "../help.js?v=1795389300";
import { hostReplay } from "../host.js?v=1795389300";
import { PROVINCES } from "../map.js?v=1795389300";
import { $, L, S, esc, me, net, store } from "../state.js?v=1795389300";
import { introHtml, nextModal } from "./aides.js?v=1795389300";
import { houseColor, houseName, sealBreakHtml, sealStamp, setInput, toast, tuto } from "./common.js?v=1795389300";
import { dilCurrent, dilSealed, dilSlots } from "./dilemmas.js?v=1795389300";
import { shield, woodcut } from "./draw.js?v=1795389300";
import { GRAVURES } from "../gravures.js?v=1795389300";
import { chronicleHtml, crownMark, entryHtml, familyHtml, findPerson, houseSheetHtml, personHtml, portraitSvg, roleLabel, setLogFilter } from "./house.js?v=1795389300";
import { newsHtml, ragotsHtml } from "./news.js?v=1795389300";
import { colorize, peopleIn } from "./names.js?v=1795389300";
import { bindLivre, livreHtml } from "./livre.js?v=1795389300";
import { dropGame } from "./games.js?v=1795389300";
import { render } from "./render.js?v=1795389300";
import { interludeLines } from "./reveal.js?v=1795389300";
import { openPadTest } from "./maporders.js?v=1795389300";

// ---------------------------------------------------------------------
// SURCOUCHES : objectifs, dilemme, interlude, fin, maison, règles
// ---------------------------------------------------------------------
export function renderOverlays() {
  const st = S(), pid = me();
  const ov = $("#overlay");
  let html = "";
  if (st.phase === "objectives" && pid && !L.objClosed && L.priv && L.priv.objOffer && L.priv.objOffer.length) html = objectivesCard();
  else if (st.phase === "dilemma" && pid && !L.dilemmaClosed && dilSlots().length) html = dilemmaCard();
  else if (st.phase === "end" && !L.endClosed) html = endHtml();
  if (!html) { ov.classList.add("hidden"); ov.innerHTML = ""; L.ovKey = ""; return; }
  if (L.ovKey === html) return; // rien n'a changé : on ne relance pas les animations
  L.ovKey = html;
  ov.innerHTML = html; ov.classList.remove("hidden");
  // une carte qui arrive s'anime une fois ; un simple clic sur un choix ne la refait pas apparaître
  const card = ov.querySelector(".card");
  const k = st.phase === "dilemma" ? `d${st.round}:${dilCurrent()}` : `${st.phase}${st.round}`;
  if (card) {
    if (L.ovAnim === k) card.classList.add("still");
    else { L.ovAnim = k; if (st.phase === "dilemma") { card.classList.add("arrive"); card.insertAdjacentHTML("beforeend", sealBreakHtml()); A.play("card"); } }
  }
  bindOverlay();
}

export function cardTimer() { return `<span class="card-timer" data-timer></span>`; }

export function objectivesCard() {
  const offer = L.priv.objOffer;
  const pick = L.ui.objPick.length ? L.ui.objPick : (L.myInput.objPick || []);
  L.ui.objPick = pick.slice();
  const sent = (L.myInput.objPick || []).length === 2;
  return `<div class="card"><div class="card-top"><span class="card-kicker">OBJECTIFS SECRETS</span>${cardTimer()}</div><h2>Ce que tu désires vraiment</h2><p>Garde 2 de ces 3 ambitions. Elles rapportent des points à la fin, et personne d'autre ne les connaît.</p>
    <div class="choices">${offer.map((oid) => { const o = OBJECTIVES.find((x) => x.id === oid); return `<button class="choice" data-obj="${oid}" aria-pressed="${pick.includes(oid)}"><b>+${o.pts} points</b><span>${esc(o.text)}</span></button>`; }).join("")}</div>
    <div class="row" style="margin-top:14px"><button class="btn grow" id="ov-close">Voir la carte</button><button class="btn btn-red grow" id="obj-ok" ${pick.length === 2 ? "" : "disabled"}>${sent ? "Choix envoyé ✓" : "Valider ces 2 objectifs"}</button></div></div>`;
}

// Le Conseil du Roi : un vote public pour (ou contre) une autre maison
function councilCard(slot) {
  const st = S(), pid = me();
  const d = L.priv[slot];
  const m = COUNCIL.find((c) => c.id === d.id);
  if (!m) return "";
  const done = dilSealed(slot);
  const cur = L.ui.dChoice ?? (done ? L.myInput[slot].choice : null);
  const sl = dilSlots();
  const tabs = sl.length > 1 ? `<div class="dil-tabs">${sl.map((k, i) => `<button class="dil-tab ${k === slot ? "cur" : ""}" data-dslot="${k}">${dilSealed(k) ? "✓ " : `${i + 1}. `}${k === "dilemma" ? "Ta maison" : k === "dilemma2" ? "Un rival" : "Le Conseil"}</button>`).join("")}</div>` : "";
  const others = st.order.filter((p) => p !== pid && st.players[p].house !== "anglais");
  const opts = others.map((p) => `<button class="choice council-opt" data-ch="${esc(p)}" aria-pressed="${cur === p}" style="--hc:${houseColor(p)}">${shield(st.players[p].house, 28)}<b>${esc(houseName(p))}</b><span>${esc(st.players[p].name)} · score visible ${E.publicScore(st, p)}</span></button>`).join("");
  return `<div class="card dil-card council-card">${tabs}<div class="dil-grid"><div class="dil-left"><div class="card-top"><span class="card-kicker">${sl.indexOf(slot) + 1} SUR ${sl.length} · LE CONSEIL DU ROI · VOTE PUBLIC</span>${cardTimer()}</div><h2>${esc(m.title)}</h2>
    <p>${esc(m.text)}</p><div class="council-effect ${m.good ? "good" : "bad"}">${m.good ? "Un honneur" : "Une punition"} : ${esc(m.effect)}</div>
    <p class="ptext" style="font-size:15px"><b>Pour qui votes-tu ?</b> Tu ne peux pas voter pour toi. La maison qui a le plus de voix l'emporte ; en cas d'égalité, rien n'est décidé. <b>Tous les votes seront affichés</b> à la révélation : négociez, achetez des voix avec de l'or, promettez…</p></div>
    <div class="dil-right"><div class="choices">${opts}</div>
    <div class="row dil-btns"><button class="btn grow" id="ov-close">Voir la carte</button><button class="btn btn-red grow" id="dil-ok" ${cur ? "" : "disabled"}>${done ? "Vote scellé ✓ (changer)" : cur ? `Voter pour ${esc(houseName(cur))}` : "Choisis une maison"}</button></div></div></div></div>`;
}

// gravure du dilemme (img/gravures/) ; à défaut, une des 40 choisie d'après l'identifiant
const ALL_GRAVURES = [...new Set(Object.values(GRAVURES))].sort();
function gravure(id) {
  let g = GRAVURES[id];
  if (!g) { let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0; g = ALL_GRAVURES[h % ALL_GRAVURES.length]; }
  return `<img class="woodcut gravure" src="img/gravures/${g}.webp" width="960" height="640" alt="" decoding="async">`;
}

export function dilemmaCard() {
  const st = S(), pid = me();
  const slot = dilCurrent();
  if (slot === "council") return councilCard(slot);
  const d = L.priv[slot];
  const card = DILEMMAS.find((c) => c.id === d.id);
  if (!card) return "";
  const ctx = d.ctx || {};
  const done = dilSealed(slot);
  const cur = L.ui.dChoice ?? (done ? L.myInput[slot].choice : null);
  const curT = L.ui.dTarget ?? (done ? L.myInput[slot].target : null);
  const sl = dilSlots();
  const tabs = sl.length > 1 ? `<div class="dil-tabs">${sl.map((k, i) => `<button class="dil-tab ${k === slot ? "cur" : ""}" data-dslot="${k}">${dilSealed(k) ? "✓ " : `${i + 1}. `}${k === "dilemma" ? "Ta maison" : k === "dilemma2" ? "Un rival" : "Le Conseil"}</button>`).join("")}</div>` : "";
  const kicker = (sl.length > 1 ? `${sl.indexOf(slot) + 1} SUR ${sl.length} · ` : "") + (card.type === "pact" ? `PACTE AVEC ${esc(houseName(d.partner).toUpperCase())}` : card.type === "target" ? "AFFAIRE AVEC UNE MAISON RIVALE" : "AFFAIRE DE TA MAISON");
  let opts, extra = "";
  if (card.type === "pact") {
    const la = card.options[0].label, lb = card.options[1].label;
    opts = card.options.map((o) => `<button class="choice" data-ch="${o.id}" aria-pressed="${cur === o.id}"><b>${esc(o.label)}</b></button>`).join("");
    const cell = (k) => `<td><div class="fxline">${chipsHtml(card.outcomes[k].fx)}</div></td>`;
    extra = `<p class="ptext" style="font-size:15px;margin:10px 0 4px"><b>Comment ça marche :</b> ${esc(houseName(d.partner))} reçoit la même carte et choisit en même temps, en secret. Ce que tu gagnes ou perds dépend de <b>vos deux choix</b> :</p>
      <table class="pact-table"><tr><th>Toi \\ ${esc(houseName(d.partner))}</th><th>${esc(la)}</th><th>${esc(lb)}</th></tr><tr><th>${esc(la)}</th>${cell("aa")}${cell("ab")}</tr><tr><th>${esc(lb)}</th>${cell("ba")}${cell("bb")}</tr></table>
      <p class="hint">Astuce : négociez par message secret avant de choisir… et décidez si vous vous faites confiance.</p>`;
  } else {
    opts = card.options.map((o, i) => `<button class="choice" data-ch="${i}" aria-pressed="${cur === i}"><b>${esc(E.fill(o.label, ctx))}</b><span>${esc(E.fill(o.hint || "", ctx))}</span><span class="fxline">${chipsHtml(o.fx)}</span></button>${cur === i && o.needsTarget ? `<div class="target-row"><span class="ptext" style="width:100%;margin:4px 0 0;font-size:14px"><b>Choisis la maison visée :</b></span>${st.order.filter((p) => p !== pid).map((p) => `<button class="btn btn-small ${curT === p ? "btn-dark" : ""}" data-dt="${p}">${shield(st.players[p].house, 16)} ${esc(houseName(p))}</button>`).join("")}</div>` : ""}`).join("");
  }
  const opt = card.type !== "pact" && cur !== null ? card.options[cur] : null;
  const canSend = cur !== null && (!opt || !opt.needsTarget || curT);
  const secretNote = card.type === "solo" ? "Affaire privée : les autres n'apprendront qu'une rumeur de ce qui s'est passé." : "Ce choix sera révélé à tous à la fin de la manche.";
  // les visages des personnages dont parle l'affaire
  const said = [E.fill(card.title, ctx), E.fill(card.text, ctx), ...(card.options || []).flatMap((o) => [E.fill(o.label || "", ctx), E.fill(o.hint || "", ctx)])].join(" ");
  const faces = facesHtml(peopleIn(said, 3));
  return `<div class="card dil-card">${tabs}<div class="dil-grid"><div class="dil-left">${gravure(d.id)}${faces}${slot === "dilemma" ? newsHtml() + ragotsHtml() : ""}</div>
    <div class="dil-right"><div class="card-top"><span class="card-kicker">${kicker}</span>${cardTimer()}</div><h2>${esc(E.fill(card.title, ctx))}</h2><p class="dil-text">${colorize(E.fill(card.text, ctx))}</p><div class="choices">${opts}</div>${extra}
    <div class="row dil-btns"><button class="btn grow" id="ov-close">Voir la carte</button><button class="btn btn-red grow" id="dil-ok" ${canSend ? "" : "disabled"}>${done ? "Choix scellé ✓ (changer)" : cur === null ? "Choisis une option" : opt && opt.needsTarget && !curT ? "Choisis une maison" : (sl.length > 1 && sl.some((k) => k !== slot && !dilSealed(k)) ? "Sceller et passer à l'affaire suivante" : "Sceller ce choix")}</button></div><p class="hint">${secretNote}</p></div></div></div>`;
}

// les visages cités : portrait, nom, rôle (clic = fiche du personnage)
export function facesHtml(list) {
  const st = S();
  const items = list.map((r) => { const f = findPerson(st, r.id); if (!f) return ""; const { m, pid } = f; return `<button class="face" data-who="${esc(pid)}|${esc(m.id)}" style="--hc:${houseColor(pid)}">${portraitSvg(m, houseColor(pid))}<span class="face-n">${crownMark(m)}${esc(E.personTitle(m))}</span><span class="face-r">${roleLabel(st, pid, m)} · ${esc(houseName(pid))}</span></button>`; }).join("");
  return items ? `<div class="faces">${items}</div>` : "";
}

// à quoi servent les jauges, en une ligne
export function resLegend() {
  return `<div class="res-legend"><span>${ICON.prestige}<b>Prestige</b> = tes points de victoire</span><span>${ICON.gold}<b>Or</b> = solde des troupes, mercenaires, relances de dés, fêtes, intrigues</span><span>${ICON.colere}<b>Colère</b> : à 80, une province se révolte</span><span>${ICON.peur}<b>Peur</b> : +1 en défense tous les 25 pts</span></div>`;
}

export function summaryHtml() {
  const st = S(), pid = me();
  const a = st.roundStart && st.roundStart[pid];
  if (!pid || !a) return "";
  const now = E.snapshotPlayers(st)[pid];
  const chips = [];
  const d = (k, label, icon, invert) => { const v = now[k] - a[k]; if (v) chips.push([(v > 0) !== !!invert ? "good" : "bad", `${icon}${v > 0 ? "+" : ""}${v} ${label}`]); };
  d("prestige", "prestige", ICON.prestige); d("gold", "or", ICON.gold); d("armies", "armées", ICON.army); d("colere", "colère", ICON.colere, true);
  const gained = now.provs.filter((x) => !a.provs.includes(x)), lost = a.provs.filter((x) => !now.provs.includes(x));
  const fam = st.families[pid].members;
  const dead = a.family.filter((id) => !now.family.includes(id)).map((id) => fam.find((m) => m.id === id)).filter(Boolean);
  const born = now.family.filter((id) => !a.family.includes(id)).map((id) => fam.find((m) => m.id === id)).filter(Boolean);
  const lines = [];
  if (gained.length) lines.push(`<span class="fxchip good">${ICON.province}Gagné : ${gained.map((x) => esc(PROVINCES[x].name)).join(", ")}</span>`);
  if (lost.length) lines.push(`<span class="fxchip bad">${ICON.province}Perdu : ${lost.map((x) => esc(PROVINCES[x].name)).join(", ")}</span>`);
  dead.forEach((m) => lines.push(`<span class="fxchip bad">${ICON.death}${esc(E.personTitle(m))} est mort${m.sex === "f" ? "e" : ""}</span>`));
  born.forEach((m) => lines.push(`<span class="fxchip good">${ICON.family}Naissance : ${esc(m.name)}</span>`));
  const est = E.estimateScore(st, { [pid]: L.priv || {} }, pid);
  const rank = E.rankOf ? "" : "";
  return `<div class="summary"><h3>Ta manche en bref</h3><div class="srow">${chips.map(([k, t]) => `<span class="fxchip ${k}">${t}</span>`).join("") || '<span class="fxchip neutral">Rien n\'a changé pour toi</span>'}</div><div class="srow">${lines.join("")}</div><p class="ptext" style="margin:6px 0 0;font-size:15px">Ton score estimé : <b>${est.total} points</b>.</p></div>`;
}

export function interludeHtml() {
  const st = S(), pid = me();
  const waitAll = st.solo || st.timer === "none";
  const ready = L.myInput.next && L.myInput.next.round === st.round;
  return `<div class="interlude"><div class="il-left"><span class="kick">FIN DE LA MANCHE ${st.round} SUR ${st.maxRounds}</span>${woodcut(380, 210, st.round)}<h1>Anno Domini ${E.yearOf(st.round)}</h1>${summaryHtml()}
    ${pid ? `<button class="btn btn-red" id="btn-next" ${ready ? "disabled" : ""}>${ready ? "On attend les autres…" : st.round >= st.maxRounds ? "Voir le résultat" : `Passer à la manche ${st.round + 1}`}</button>` : ""}</div>
    <div class="il-right">${interludeLines().map((l, i) => `<p class="ch-entry" style="animation-delay:${0.3 + i * 0.9}s">${l.title ? `<b>${esc(houseName(l.pid))}</b> ` : ""}${entryHtml(l)}</p>`).join("")}</div></div>`;
}

export function momentsForts() {
  const st = S();
  const score = (c) => (c.kind === "betrayal" ? 6 : c.kind === "claim" ? 6 : /mise à sac/.test(c.text) ? 6 : c.kind === "death" && /trône|cousin|Guerre civile/.test(c.text) ? 5 : c.kind === "death" ? 4 : c.kind === "marriage" ? 3 : c.kind === "revolt" || c.kind === "exile" ? 4 : c.kind === "dilemma" && c.title && /tue|tuer|étrangl|brûl|empoison|exécut|massacr/i.test(c.choice || "") ? 4 : c.kind === "battle" && /prend/.test(c.text) ? 2 : 0);
  return (st.chronicle || []).filter((c) => score(c) > 0).map((c, i) => ({ c, v: score(c) + Math.random() * 0.5 })).sort((a, b) => b.v - a.v).filter((x, i, arr) => arr.findIndex((y) => y.c.kind === x.c.kind && y.c.round === x.c.round) === i).slice(0, 6).sort((a, b) => a.c.round - b.c.round).map((x) => x.c);
}

export function recordPalmares(st) {
  const pid = me();
  if (!pid || !st.result || store.get(`sn_done_${st.gameId}`)) return;
  store.set(`sn_done_${st.gameId}`, "1");
  let pal = {}; try { pal = JSON.parse(store.get("sn_palmares") || "{}"); } catch {}
  pal.games = (pal.games || 0) + 1;
  if (st.result.winner === pid) pal.wins = (pal.wins || 0) + 1;
  const row = st.result.rows.find((r) => r.pid === pid);
  if (row) pal.best = Math.max(pal.best || 0, row.total);
  store.set("sn_palmares", JSON.stringify(pal));
}

export function palmaresHtml() {
  let pal = {}; try { pal = JSON.parse(store.get("sn_palmares") || "{}"); } catch {}
  if (!pal.games) return "";
  return `<div class="palmares">${ICON.prestige}<b>Ton palmarès</b> : ${pal.games} partie${pal.games > 1 ? "s" : ""} · ${pal.wins || 0} victoire${(pal.wins || 0) > 1 ? "s" : ""} · meilleur score ${pal.best || 0} points</div>`;
}

// courbe des scores visibles, manche par manche (dessinée en SVG)
function scoreChart(st) {
  const h = (st.history || []).slice();
  if (h.length < 2) return "";
  const r = st.result;
  const pids = st.order.filter((p) => st.players[p].house !== "anglais");
  const W = 640, Hh = 220, L0 = 34, B = 26, T = 12, R0 = 110;
  const pts = h.map((x) => ({ round: x.round, s: x.s }));
  if (r) pts.push({ round: "Fin", s: Object.fromEntries(r.rows.map((x) => [x.pid, x.total])) });
  const all = pts.flatMap((x) => pids.map((p) => x.s[p] || 0));
  const max = Math.max(10, ...all), min = Math.min(0, ...all);
  const X = (i) => L0 + (i * (W - L0 - R0)) / (pts.length - 1);
  const Y = (v) => T + (Hh - T - B) * (1 - (v - min) / (max - min));
  const grid = [0, 0.25, 0.5, 0.75, 1].map((f) => { const v = min + (max - min) * f; return `<line x1="${L0}" x2="${W - R0}" y1="${Y(v)}" y2="${Y(v)}" stroke="#C9B48A" stroke-width="1"/><text x="${L0 - 6}" y="${Y(v) + 4}" text-anchor="end" font-size="11" fill="#75603F">${Math.round(v)}</text>`; }).join("");
  // étiquettes de fin écartées pour ne pas se chevaucher
  const lastY = {}; pids.map((p) => [p, Y(pts[pts.length - 1].s[p] || 0)]).sort((a, b) => a[1] - b[1]).reduce((prev, [p, y]) => { const yy = Math.max(y, prev + 14); lastY[p] = yy; return yy; }, -99);
  const xl = pts.map((x, i) => `<text x="${X(i)}" y="${Hh - 6}" text-anchor="middle" font-size="11" fill="#75603F">${x.round === "Fin" ? "Fin" : "M" + x.round}</text>`).join("");
  const lines = pids.map((p) => { const c = houseColor(p); const d = pts.map((x, i) => `${i ? "L" : "M"}${X(i).toFixed(1)},${Y(x.s[p] || 0).toFixed(1)}`).join(""); const last = pts[pts.length - 1].s[p] || 0; return `<path d="${d}" fill="none" stroke="${c}" stroke-width="${p === me() ? 4 : 2.5}" stroke-linejoin="round"/><circle cx="${X(pts.length - 1)}" cy="${Y(last)}" r="4" fill="${c}"/><text x="${X(pts.length - 1) + 8}" y="${Math.min(Hh - B + 4, lastY[p]) + 4}" font-size="12" font-weight="700" fill="${c}">${esc(houseName(p))} ${last}</text>`; }).join("");
  return `<p class="ph">La course à la couronne</p><svg viewBox="0 0 ${W} ${Hh}" class="score-chart" role="img" aria-label="Évolution des scores par manche">${grid}${xl}${lines}</svg><p class="hint">Score visible à la fin de chaque manche ; « Fin » ajoute les objectifs secrets.</p>`;
}

// qui a fait quoi à qui : attaques, trahisons, complots, votes, mariages
function relationsTable(st) {
  const rel = st.rel || [];
  if (!rel.length) return "";
  const pids = st.order.filter((p) => st.players[p].house !== "anglais");
  const count = (a, b) => rel.filter((x) => x.a === a && x.b === b && ["attaque", "trahison", "poison", "poison-rate", "corruption", "seduction", "vote", "accusation"].includes(x.k)).length;
  const head = `<tr><th>De ↓ / contre →</th>${pids.map((p) => `<th style="color:${houseColor(p)}">${esc(houseName(p))}</th>`).join("")}</tr>`;
  const body = pids.map((a) => `<tr><th style="color:${houseColor(a)}">${esc(houseName(a))}</th>${pids.map((b) => { if (a === b) return "<td class='self'>—</td>"; const n = count(a, b); const t = rel.filter((x) => x.a === a && x.b === b); const tip = ["attaque", "trahison", "poison", "corruption", "seduction", "vote", "accusation"].map((k) => { const c = t.filter((x) => x.k === k).length; return c ? `${c} ${k}` : ""; }).filter(Boolean).join(", "); return `<td class="${n >= 4 ? "hot" : n ? "warm" : ""}" title="${esc(tip)}">${n || ""}</td>`; }).join("")}</tr>`).join("");
  const facts = [];
  const top = (k) => { const m = {}; rel.filter((x) => x.k === k).forEach((x) => (m[x.a] = (m[x.a] || 0) + 1)); const best = Object.entries(m).sort((a, b) => b[1] - a[1])[0]; return best; };
  const tr = top("trahison"); if (tr) facts.push(`<b>Plus grand traître</b> : ${esc(houseName(tr[0]))} (${tr[1]} trahison${tr[1] > 1 ? "s" : ""})`);
  const at = top("attaque"); if (at) facts.push(`<b>Le plus belliqueux</b> : ${esc(houseName(at[0]))} (${at[1]} attaques)`);
  const pairs = {}; rel.filter((x) => x.k === "attaque").forEach((x) => { const k = [x.a, x.b].sort().join("|"); pairs[k] = (pairs[k] || 0) + 1; });
  const feud = Object.entries(pairs).sort((a, b) => b[1] - a[1])[0];
  if (feud) { const [a, b] = feud[0].split("|"); facts.push(`<b>La grande rivalité</b> : ${esc(houseName(a))} contre ${esc(houseName(b))} (${feud[1]} batailles)`); }
  const mar = rel.filter((x) => x.k === "treve").length; if (mar) facts.push(`<b>Trêves signées</b> : ${mar}`);
  return `<p class="ph">Qui a frappé qui</p><table class="relmatrix">${head}${body}</table><p class="hint">Attaques, trahisons, complots démasqués, votes contre au Conseil et accusations. Survole une case pour le détail.</p>${facts.length ? `<div class="relfacts">${facts.map((f) => `<span>${f}</span>`).join("")}</div>` : ""}`;
}

export function endHtml() {
  const st = S();
  const r = st.result;
  if (!r) return "";
  const w = r.winner;
  const rows = r.rows.map((x, i) => `<tr class="${i === 0 ? "win" : ""}"><td>${shield(st.players[x.pid].house, 18)} ${esc(st.players[x.pid].name)} · ${esc(houseName(x.pid))}</td><td>${x.prestige}</td><td>${x.provPts ?? x.provinces}</td><td>${x.regPts ?? x.regions * 3}</td><td>${x.objPts}</td><td>${x.family}</td><td>${x.goldPts || 0}</td><td><b>${x.total}</b></td></tr>`).join("");
  const objs = r.rows.filter((x) => x.objectives && x.objectives.length).map((x) => `<p style="font-size:15px;margin:4px 0"><b>${esc(houseName(x.pid))}</b> : ${x.objectives.map((o) => `${o.done ? "✓" : "✗"} ${esc(o.text)}`).join(" · ")}</p>`).join("");
  const titles = r.titles.map((t) => `<div class="title-card"><b>${esc(t.name)}</b>${esc(houseName(t.pid))}</div>`).join("");
  const isHost = L.meta && L.meta.host === net.uid;
  const tab = L.ui.endTab || "res";
  const T = [["res", "Le sacre"], ["course", "La course et les rivalités"], ["moments", "Moments forts et titres"], ["livre", "Le livre de la soirée"]];
  let body = "";
  if (tab === "res") body = coronationHtml(st, r) + `<div class="end-cols end-low"><div>${objs ? `<p class="ph">Les objectifs secrets</p>${objs}` : ""}</div><div>${palmaresHtml()}</div></div>`;
  if (tab === "livre") body = livreHtml();
  if (tab === "course") body = `<div class="end-cols"><div>${scoreChart(st)}</div><div>${relationsTable(st)}</div></div>`;
  if (tab === "moments") body = `<p class="ph">Les moments forts</p><div class="moments">${momentsForts().map((c) => `<div class="moment"><b>${c.year}</b>${c.title ? `« ${esc(c.title)} » — ${esc(c.choice || "")}. ` : ""}${esc(c.text)}</div>`).join("")}</div><p class="ph">Les titres</p><div class="titles">${titles}</div>`;
  return `<div class="card end-card"><div class="hs-head"><div class="grow"><span class="card-kicker">FIN DE LA PARTIE · AN ${E.yearOf(st.round)}</span><h2>${esc(houseName(w))} règne sur la France</h2></div></div>
    <div class="dil-tabs">${T.map(([k, t]) => `<button class="dil-tab ${tab === k ? "cur" : ""}" data-endtab="${k}">${t}</button>`).join("")}<button class="dil-tab" data-endchron="1">La Grande Chronique</button></div>
    <div class="end-body">${body}</div>
    <div class="row"><button class="btn grow" id="ov-close">Voir la carte</button>${isHost ? `<button class="btn btn-red grow" id="btn-replay">Rejouer avec les mêmes</button>` : ""}<button class="btn grow" id="btn-home">Retour à l'accueil</button></div></div>`;
}

// le sacre : le souverain vainqueur en grand, puis chaque maison avec le visage de son souverain
function rulerFace(st, pid, cls = "") {
  const k = E.king(st, pid);
  return k ? `<button class="er-face ${cls}" data-who="${esc(pid)}|${esc(k.id)}">${portraitSvg(k, houseColor(pid))}</button>` : `<span class="er-face er-none ${cls}">${shield(st.players[pid].house, cls ? 120 : 48)}</span>`;
}
function coronationHtml(st, r) {
  const w = r.winner, k = E.king(st, w);
  const endTxt = (st.chronicle || []).filter((c) => c.kind === "end").slice(-1)[0]?.text || "";
  const rows = r.rows.map((x, i) => {
    const p = st.players[x.pid], pts = [["Prestige", x.prestige], ["provinces", x.provPts ?? x.provinces], ["régions", x.regPts ?? x.regions * 3], ["objectifs", x.objPts], ["famille", x.family], ["or", x.goldPts || 0]];
    const kk = E.king(st, x.pid);
    return `<div class="er-row ${i === 0 ? "win" : ""}" style="--hc:${houseColor(x.pid)}"><span class="er-rank">${["I", "II", "III", "IV", "V"][i] || i + 1}</span>${rulerFace(st, x.pid)}<span class="er-id"><b>${shield(p.house, 22)} ${esc(houseName(x.pid))}</b><i>${esc(p.name)}${kk ? ` · ${esc(E.personTitle(kk))}` : " · lignée éteinte"}</i><span class="er-pts">${pts.map(([n, v]) => `${n} ${v}`).join(" · ")}</span></span><span class="er-total">${x.total}<small>pts</small></span></div>`;
  }).join("");
  return `<div class="coronation"><div class="er-hero" style="--hc:${houseColor(w)}">${rulerFace(st, w, "big")}<div class="er-hero-t"><span class="card-kicker">${k ? (k.sex === "f" ? "REINE DE FRANCE" : "ROI DE FRANCE") : "LA COURONNE"}</span><h3>${k ? esc(E.personTitle(k)) : esc(houseName(w))}</h3><p class="er-house">${shield(st.players[w].house, 26)} Maison ${esc(houseName(w))} · ${esc(st.players[w].name)}</p><p class="er-end">${colorize(endTxt)}</p></div></div><div class="er-list">${rows}</div></div>`;
}

export function bindOverlay() {
  const st = S();
  if ($("#ov-close")) $("#ov-close").onclick = () => { if (st.phase === "objectives") L.objClosed = true; if (st.phase === "dilemma") L.dilemmaClosed = true; if (st.phase === "end") L.endClosed = true; render(); };
  document.querySelectorAll("[data-obj]").forEach((b) => (b.onclick = () => {
    const id = b.dataset.obj; const p = L.ui.objPick;
    if (p.includes(id)) p.splice(p.indexOf(id), 1); else { p.push(id); if (p.length > 2) p.shift(); }
    A.play("click"); render();
  }));
  if ($("#obj-ok")) $("#obj-ok").onclick = () => { setInput("objPick", L.ui.objPick.slice()); A.play("seal"); L.objClosed = true; render(); };
  document.querySelectorAll("[data-ch]").forEach((b) => (b.onclick = () => { const v = b.dataset.ch; L.ui.dChoice = /^\d+$/.test(v) ? +v : v; A.play("click"); render(); }));
  $("#overlay").querySelectorAll("[data-who]").forEach((b) => (b.onclick = () => { const [pid, id] = b.dataset.who.split("|"); A.play("click"); openModal("person", { pid, id }); }));
  document.querySelectorAll("[data-dt]").forEach((b) => (b.onclick = () => { L.ui.dTarget = b.dataset.dt; A.play("click"); render(); }));
  document.querySelectorAll("[data-dslot]").forEach((b) => (b.onclick = () => { L.ui.dSlot = b.dataset.dslot; L.ui.dChoice = null; L.ui.dTarget = null; A.play("click"); render(); }));
  if ($("#dil-ok")) $("#dil-ok").onclick = () => {
    const slot = dilCurrent();
    const cur = L.ui.dChoice ?? L.myInput[slot]?.choice;
    setInput(slot, { round: st.round, choice: cur, target: L.ui.dTarget ?? L.myInput[slot]?.target ?? null });
    A.play("seal"); sealStamp(); L.ui.dChoice = null; L.ui.dTarget = null;
    const next = dilSlots().find((k) => k !== slot && !dilSealed(k));
    if (next) { L.ui.dSlot = next; L.ovKey = ""; toast(`${ICON.scroll}Choix scellé. Passe à l'affaire suivante.`, "#A9843A", 2200); }
    else { L.ui.dSlot = null; L.dilemmaClosed = true; }
    render();
  };
  bindLivre();
  document.querySelectorAll("[data-endtab]").forEach((b) => (b.onclick = () => { L.ui.endTab = b.dataset.endtab; A.play("click"); render(); }));
  document.querySelectorAll("[data-endchron]").forEach((b) => (b.onclick = () => { L.ui.chrPage = 0; openModal("chronicle"); }));
  if ($("#btn-replay")) $("#btn-replay").onclick = () => hostReplay();
  if ($("#btn-home")) $("#btn-home").onclick = () => { if (L.code) dropGame(L.code); L.leaving = true; location.href = location.pathname + (new URLSearchParams(location.search).has("test") ? "?test" : ""); };
  if ($("#btn-next")) $("#btn-next").onclick = () => { setInput("next", { round: st.round }); A.play("click"); L.ovKey = ""; render(); };
}

export function openModal(kind, data) {
  const m = $("#modal");
  let html = "";
  if (kind === "intro") html = introHtml(data || 0);
  if (kind === "family") html = familyHtml(data || 0);
  if (kind === "unlock") { const u = UNLOCK_INFO[data]; html = `<div class="card"><span class="card-kicker">PREMIÈRE PARTIE · MANCHE ${S().round}</span><div class="intro-icon">${u.icon.replace('width="16" height="16"', 'width="56" height="56"')}</div><h2 style="text-align:center">${u.title}</h2><p>${u.text}</p><button class="btn btn-red btn-block" id="md-close">Compris</button></div>`; }
  if (kind === "score") { const st = S(), pid = me(); const e = pid ? E.estimateScore(st, { [pid]: L.priv || {} }, pid) : null; html = `<div class="card"><span class="card-kicker">COMMENT GAGNER</span><h2>Le score</h2><p>${GLOSSARY.score[1]}</p>${e ? `<div class="score-box"><b>${e.total}</b> points aujourd'hui :<br>${ICON.prestige}Prestige ${e.prestige} · ${ICON.province}provinces ${e.provinces} · régions ${e.regions} · objectifs ${e.objectives} · ${ICON.family}famille ${e.family}</div>` : ""}<p class="hint">Les objectifs secrets ne comptent que s'ils sont réussis à la fin. Détail dans l'onglet « Ma maison ».</p><button class="btn btn-block" id="md-close">Fermer</button></div>`; }
  if (kind === "house") html = houseSheetHtml(L.ui.viewHouse);
  if (kind === "person") html = personHtml(data);
  if (kind === "chronicle") html = chronicleHtml();
  if (kind === "rules") html = `<div class="card rules"><span class="card-kicker">AIDE-MÉMOIRE</span><h2>Les règles</h2><div class="row wrap"><button class="btn btn-small" data-intro="0">Revoir l'introduction</button><button class="btn btn-small" data-padtest="1">Tester la manette</button></div>
    <p><b>But :</b> avoir le plus de points après la dernière manche (10, ou 7 en partie courte). Score = Prestige + <b>3 par province</b> + 3 par région complète + objectifs secrets + 1 par membre vivant de ta famille + 1 par tranche de 10 or. Quinze provinces = victoire immédiate.</p>
    <h3>Une manche</h3><ul><li><b>Dilemmes</b> secrets : une affaire de ta maison (les autres n'en apprennent qu'une rumeur), une affaire avec un rival (révélée à tous). Aux manches 3, 6 et 9, le <b>Conseil du Roi</b> : un vote public (on ne vote jamais pour soi).</li><li><b>Ordres</b> : chaque dé reçoit un ordre. Frapper (attaque, le dé s'ajoute à ta force), Marcher (déplace jusqu'à la valeur du dé), Lever (2 à 4 armées), Intriguer (poison, séduction, corruption). Un double donne un dé bonus. Tu peux relancer un dé (2 or) et offrir une fête au peuple (3 or, −15 Colère).</li><li><b>Révélation partagée</b> : tout le monde voit les mêmes cartes ; on passe à la suivante quand tous ont validé.</li><li><b>Trois ans passent</b> : revenus (1 or par province, +1 par mariage), solde des troupes (1 or pour 5 armées, sinon désertions), 2 armées dans ta capitale + bonus de régions, vieillissement, naissances, morts, révoltes, peste.</li></ul>
    <h3>Les maisons</h3><p>Bâtisseurs (Valcourt) : +1 en défense, solde +1. Marchands (Morlanges) : or des côtes, mercenaires à 2 or, +3 Colère par manche. Ombres (Ravenel) : intrigues meilleures et moins chères, mariages sans or. Lignée sacrée (Aubrac) : +1 Prestige par manche si Colère sous 50, −2 or par manche.</p>
    <h3>Batailles</h3><p>Force = armées + ton dé + bonus + un petit hasard (0 à 2). Le défenseur ajoute sa Peur (et ses forteresses) et gagne les égalités. Le vainqueur perd la moitié des armées adverses. Perdre sa capitale : −5 Prestige, +20 Colère, un tiers de l'or pillé.</p>
    <h3>Dynastie</h3><p>Chaque manche = 3 ans. Les rois vieillissent et meurent. L'aîné hérite (les fils d'abord). Sans héritier : guerre civile. Un bâtard semé chez l'ennemi te permet de revendiquer une province à la mort de son roi.</p>
    <h3>Bluff et diplomatie</h3><ul><li><b>Dé caché</b> : chaque joueur a un dé que les autres ne voient pas.</li><li><b>Mariage</b> : alliance permanente, +1 or par manche. <b>Trêve</b> : 3 manches. Attaquer un allié ou rompre une trêve = trahison (−5 Prestige).</li><li><b>Or</b> : tu peux envoyer de l'or à qui tu veux (cadeau, rançon, achat de voix).</li><li><b>Accusation</b> : un poison réussi est anonyme ; accuser juste rapporte, accuser à tort coûte.</li></ul>
    <h3>Jauges</h3><p>Colère à 80 en fin de manche : une province (pas la capitale) se révolte et devient neutre, puis la Colère retombe à 50. Peur : +1 en défense tous les 25 points, mais à 50 plus aucun mariage.</p>
    <h3>Le favori</h3><p>Le joueur au meilleur score visible porte la couronne : battre ses armées rapporte +2 Prestige. La maison la plus en retard reçoit chaque manche +2 armées et +2 or. Dernière manche : conquêtes à 3 Prestige, scores cachés, puis le Couronnement révèle les objectifs secrets.</p>
    <h3>À la manette</h3><ul><li><b>Croix</b> : passer d'une province à l'autre (ou d'un bouton à l'autre dans un menu). <b>A</b> : choisir. <b>B</b> : revenir ou fermer.</li><li><b>LT / RT</b> : changer de dé dans le menu d'une province, sinon zoomer la carte. <b>Stick droit</b> : déplacer la carte zoomée.</li><li><b>Y</b> : fiche de la province. <b>X</b> : onglet suivant du panneau. <b>Menu</b> : sceller tes ordres.</li></ul>
    <p class="hint">Bruitages : Kenney (CC0) et Wikimedia Commons, <a href="sons/CREDITS.md" target="_blank" rel="noopener">voir les auteurs</a>.</p>
    <button class="btn btn-block" id="md-close">Fermer</button></div>`;
  m.innerHTML = html; m.classList.remove("hidden");
  const close = () => { m.classList.add("hidden"); setTimeout(nextModal, 50); };
  m.querySelectorAll("#md-close").forEach((b) => (b.onclick = close));
  m.querySelectorAll("[data-padtest]").forEach((b) => (b.onclick = () => openPadTest()));
  m.querySelectorAll("[data-intro]").forEach((b) => (b.onclick = () => openModal("intro", +b.dataset.intro)));
  m.querySelectorAll("[data-fam]").forEach((b) => (b.onclick = () => { A.play("click"); openModal("family", +b.dataset.fam); }));
  m.querySelectorAll("[data-who]").forEach((b) => (b.onclick = () => { A.play("click"); const [pid, id] = b.dataset.who.split("|"); openModal("person", { pid, id }); }));
  m.querySelectorAll("[data-house]").forEach((b) => (b.onclick = () => { A.play("click"); L.ui.viewHouse = b.dataset.house; openModal("house"); }));
  m.querySelectorAll("[data-famintro]").forEach((b) => (b.onclick = () => openModal("family", 0)));
  m.querySelectorAll("[data-logf]").forEach((b) => (b.onclick = () => { setLogFilter(b.dataset.logf); openModal("chronicle"); }));
  m.querySelectorAll("[data-chr]").forEach((b) => (b.onclick = () => { A.play("click"); L.ui.chrPage += +b.dataset.chr; openModal("chronicle"); }));
  m.onclick = (e) => { if (e.target === m && !["intro", "unlock", "family"].includes(kind)) close(); };
}

export function phaseTutos() {
  const st = S();
  if (!st.tutorial || !me()) return;
  const T = {
    draft: ["Ta capitale", `Chacun choisit 3 provinces à tour de rôle. La première devient ta ${term("capitale")}. Ensuite, toutes les provinces restantes sont partagées automatiquement autour de vos terres : personne ne commence sur une carte vide. Une ${term("region")} complète rapporte des armées à chaque manche.`],
    placement: ["Les armées", `Le chiffre sur chaque bannière = les ${term("armees", "armées")} de la province. Mets-en plus là où tu touches tes voisins.`],
    reveal: ["La révélation", "Tout se dévoile une info à la fois : les affaires des cours, les intrigues, les troupes, puis chaque bataille. Regarde la carte (les provinces concernées sont surlignées), lis le récit dans le panneau, puis clique « Suivant ». Chacun va à son rythme ; à la fin, clique « J'ai tout vu »."],
    end: ["Fin de la partie", "Bravo, tu connais maintenant tout le jeu ! Pour les prochaines parties, décoche « Première partie » : toutes les règles seront actives dès le début."],
  };
  if (T[st.phase]) tuto(st.phase, T[st.phase][0], T[st.phase][1]);
}

// partout dans le jeu, cliquer le nom d'un personnage ouvre sa fiche avec son portrait
document.addEventListener("click", (e) => {
  const n = e.target.closest(".nm[data-who]");
  if (!n || n.closest("#modal .person-card")) return;
  e.preventDefault(); e.stopPropagation();
  const [pid, id] = n.dataset.who.split("|"); A.play("click"); openModal("person", { pid, id });
}, true);
