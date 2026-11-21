// Surcouches : objectifs, dilemme, interlude, fin de partie, règles
import * as A from "../audio.js?v=1795298173";
import { DILEMMAS, OBJECTIVES } from "../content.js?v=1795298173";
import * as E from "../engine.js?v=1795298173";
import { GLOSSARY, ICON, UNLOCK_INFO, chipsHtml, term } from "../help.js?v=1795298173";
import { hostReplay } from "../host.js?v=1795298173";
import { PROVINCES } from "../map.js?v=1795298173";
import { $, L, S, esc, me, net, store } from "../state.js?v=1795298173";
import { introHtml, nextModal } from "./aides.js?v=1795298173";
import { houseName, setInput, toast, tuto } from "./common.js?v=1795298173";
import { dilCurrent, dilSealed, dilSlots } from "./dilemmas.js?v=1795298173";
import { shield, woodcut } from "./draw.js?v=1795298173";
import { entryHtml, familyHtml, houseHtml } from "./house.js?v=1795298173";
import { newsHtml, ragotsHtml } from "./news.js?v=1795298173";
import { dropGame } from "./games.js?v=1795298173";
import { render } from "./render.js?v=1795298173";
import { interludeLines } from "./reveal.js?v=1795298173";

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

export function dilemmaCard() {
  const st = S(), pid = me();
  const slot = dilCurrent();
  const d = L.priv[slot];
  const card = DILEMMAS.find((c) => c.id === d.id);
  if (!card) return "";
  const ctx = d.ctx || {};
  const done = dilSealed(slot);
  const cur = L.ui.dChoice ?? (done ? L.myInput[slot].choice : null);
  const curT = L.ui.dTarget ?? (done ? L.myInput[slot].target : null);
  const sl = dilSlots();
  const tabs = sl.length > 1 ? `<div class="dil-tabs">${sl.map((k, i) => `<button class="dil-tab ${k === slot ? "cur" : ""}" data-dslot="${k}">${dilSealed(k) ? "✓ " : `${i + 1}. `}${k === "dilemma" ? "Ta maison" : "Un rival"}</button>`).join("")}</div>` : "";
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
  return `<div class="card">${tabs}${slot === "dilemma" ? newsHtml() + ragotsHtml() : ""}<div class="card-top"><span class="card-kicker">${kicker}</span>${cardTimer()}</div><h2>${esc(E.fill(card.title, ctx))}</h2>${woodcut(500, 220, (st.round + d.id.length) % 3)}<p>${esc(E.fill(card.text, ctx))}</p><div class="choices">${opts}</div>${extra}
    <div class="row" style="margin-top:14px"><button class="btn grow" id="ov-close">Voir la carte</button><button class="btn btn-red grow" id="dil-ok" ${canSend ? "" : "disabled"}>${done ? "Choix scellé ✓ (changer)" : cur === null ? "Choisis une option" : opt && opt.needsTarget && !curT ? "Choisis une maison" : (sl.length > 1 && sl.some((k) => k !== slot && !dilSealed(k)) ? "Sceller et passer à l'affaire suivante" : "Sceller ce choix")}</button></div><p class="hint">${secretNote}</p>${resLegend()}</div>`;
}

// à quoi servent les jauges, en une ligne
export function resLegend() {
  return `<div class="res-legend"><span>${ICON.prestige}<b>Prestige</b> = tes points de victoire</span><span>${ICON.gold}<b>Or</b> = mercenaires (4 or), intrigues, cadeaux</span><span>${ICON.colere}<b>Colère</b> : à 80, une province se révolte</span><span>${ICON.peur}<b>Peur</b> : +1 en défense tous les 25 pts</span></div>`;
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
  return `<div class="interlude"><span class="kick">FIN DE LA MANCHE ${st.round} SUR ${st.maxRounds}</span>${woodcut(380, 210, st.round)}<h1>Anno Domini ${E.yearOf(st.round)}</h1>${summaryHtml()}${interludeLines().map((l, i) => `<p class="ch-entry" style="animation-delay:${0.3 + i * 0.9}s">${l.title ? `<b>${esc(houseName(l.pid))}</b> ` : ""}${entryHtml(l)}</p>`).join("")}
    ${pid ? `<button class="btn btn-red" id="btn-next" ${ready ? "disabled" : ""}>${ready ? "On attend les autres…" : st.round >= st.maxRounds ? "Voir le résultat" : `Passer à la manche ${st.round + 1}`}</button>` : ""}</div>`;
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

export function endHtml() {
  const st = S();
  const r = st.result;
  if (!r) return "";
  const w = r.winner;
  const rows = r.rows.map((x, i) => `<tr class="${i === 0 ? "win" : ""}"><td>${shield(st.players[x.pid].house, 18)} ${esc(st.players[x.pid].name)} · ${esc(houseName(x.pid))}</td><td>${x.prestige}</td><td>${x.provinces}</td><td>${x.regions * 3}</td><td>${x.objPts}</td><td>${x.family}</td><td><b>${x.total}</b></td></tr>`).join("");
  const objs = r.rows.filter((x) => x.objectives && x.objectives.length).map((x) => `<p style="font-size:15px;margin:4px 0"><b>${esc(houseName(x.pid))}</b> : ${x.objectives.map((o) => `${o.done ? "✓" : "✗"} ${esc(o.text)}`).join(" · ")}</p>`).join("");
  const titles = r.titles.map((t) => `<div class="title-card"><b>${esc(t.name)}</b>${esc(houseName(t.pid))}</div>`).join("");
  const isHost = L.meta && L.meta.host === net.uid;
  return `<div class="card end-card"><span class="card-kicker">FIN DE LA PARTIE</span><h2>${esc(houseName(w))} règne sur la France</h2><p>${esc((st.chronicle || []).filter((c) => c.kind === "end").slice(-1)[0]?.text || "")}</p>
    <div class="scorewrap"><table class="scoretable"><thead><tr><th>Maison</th><th>Prestige</th><th>Provinces</th><th>Régions</th><th>Objectifs</th><th>Famille</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table></div>
    ${objs ? `<p class="ph">Les objectifs secrets</p>${objs}` : ""}
    <p class="ph" style="margin-top:14px">Les moments forts</p><div class="moments">${momentsForts().map((c) => `<div class="moment"><b>${c.year}</b>${c.title ? `« ${esc(c.title)} » — ${esc(c.choice || "")}. ` : ""}${esc(c.text)}</div>`).join("")}</div>
    <p class="ph">Les titres</p><div class="titles">${titles}</div>${palmaresHtml()}
    <p class="ph">La Grande Chronique</p><div class="chron-full">${(st.chronicle || []).map((e) => `<div class="log-entry ch-entry"><span class="yr">${e.year}</span>${entryHtml(e)}</div>`).join("")}</div>
    <div class="row"><button class="btn grow" id="ov-close">Voir la carte</button>${isHost ? `<button class="btn btn-red grow" id="btn-replay">Rejouer avec les mêmes</button>` : ""}<button class="btn grow" id="btn-home">Retour à l'accueil</button></div></div>`;
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
  document.querySelectorAll("[data-dt]").forEach((b) => (b.onclick = () => { L.ui.dTarget = b.dataset.dt; A.play("click"); render(); }));
  document.querySelectorAll("[data-dslot]").forEach((b) => (b.onclick = () => { L.ui.dSlot = b.dataset.dslot; L.ui.dChoice = null; L.ui.dTarget = null; A.play("click"); render(); }));
  if ($("#dil-ok")) $("#dil-ok").onclick = () => {
    const slot = dilCurrent();
    const cur = L.ui.dChoice ?? L.myInput[slot]?.choice;
    setInput(slot, { round: st.round, choice: cur, target: L.ui.dTarget ?? L.myInput[slot]?.target ?? null });
    A.play("seal"); L.ui.dChoice = null; L.ui.dTarget = null;
    const next = dilSlots().find((k) => k !== slot && !dilSealed(k));
    if (next) { L.ui.dSlot = next; L.ovKey = ""; toast(`${ICON.scroll}Choix scellé. Passe à l'affaire suivante.`, "#D9A441", 2200); }
    else { L.ui.dSlot = null; L.dilemmaClosed = true; }
    render();
  };
  if ($("#btn-replay")) $("#btn-replay").onclick = () => hostReplay();
  if ($("#btn-home")) $("#btn-home").onclick = () => { if (L.code) dropGame(L.code); location.href = location.pathname + (new URLSearchParams(location.search).has("test") ? "?test" : ""); };
  if ($("#btn-next")) $("#btn-next").onclick = () => { setInput("next", { round: st.round }); A.play("click"); L.ovKey = ""; render(); };
}

export function openModal(kind, data) {
  const m = $("#modal");
  let html = "";
  if (kind === "intro") html = introHtml(data || 0);
  if (kind === "family") html = familyHtml(data || 0);
  if (kind === "unlock") { const u = UNLOCK_INFO[data]; html = `<div class="card"><span class="card-kicker">PREMIÈRE PARTIE · MANCHE ${S().round}</span><div class="intro-icon">${u.icon.replace('width="16" height="16"', 'width="56" height="56"')}</div><h2 style="text-align:center">${u.title}</h2><p>${u.text}</p><button class="btn btn-red btn-block" id="md-close">Compris</button></div>`; }
  if (kind === "score") { const st = S(), pid = me(); const e = pid ? E.estimateScore(st, { [pid]: L.priv || {} }, pid) : null; html = `<div class="card"><span class="card-kicker">COMMENT GAGNER</span><h2>Le score</h2><p>${GLOSSARY.score[1]}</p>${e ? `<div class="score-box"><b>${e.total}</b> points aujourd'hui :<br>${ICON.prestige}Prestige ${e.prestige} · ${ICON.province}provinces ${e.provinces} · régions ${e.regions} · objectifs ${e.objectives} · ${ICON.family}famille ${e.family}</div>` : ""}<p class="hint">Les objectifs secrets ne comptent que s'ils sont réussis à la fin. Détail dans l'onglet « Ma maison ».</p><button class="btn btn-block" id="md-close">Fermer</button></div>`; }
  if (kind === "house") html = `<div class="card">${houseHtml(L.ui.viewHouse, false)}<button class="btn btn-block" id="md-close" style="margin-top:12px">Fermer</button></div>`;
  if (kind === "rules") html = `<div class="card rules"><span class="card-kicker">AIDE-MÉMOIRE</span><h2>Les règles</h2><button class="btn btn-small" data-intro="0">Revoir l'introduction en 5 cartes</button>
    <p><b>But :</b> avoir le plus de points après la dernière manche (10, ou 7 en partie courte) (Prestige + 1 par province + 3 par région complète + objectifs secrets + 1 par membre vivant de ta famille). Quinze provinces = victoire immédiate.</p>
    <h3>Une manche</h3><ul><li><b>Revenus</b> : 1 or par province, 2 armées dans ta capitale, bonus de régions.</li><li><b>Dilemme</b> secret (parfois avec un autre joueur).</li><li><b>Ordres</b> : chaque dé reçoit un ordre. Frapper (attaque, le dé s'ajoute à ta force), Marcher (déplace jusqu'à la valeur du dé), Lever (recrute 2 à 4 armées), Intriguer (poison, séduction, corruption).</li><li><b>Révélation</b> : dilemmes, intrigues, mouvements, puis batailles.</li></ul>
    <h3>Batailles</h3><p>Force = armées + bonus + un petit dé (0 à 2). Le défenseur gagne les égalités. Le vainqueur perd la moitié des armées adverses. Les survivants du défenseur rentrent à sa capitale. Perdre sa capitale : −5 Prestige, +20 Colère, un tiers de l'or pillé.</p>
    <h3>Dynastie</h3><p>Chaque manche = 3 ans. Les rois vieillissent et meurent. L'aîné hérite (les fils d'abord). Sans héritier : guerre civile. Un bâtard semé chez l'ennemi te permet de revendiquer une province à la mort de son roi.</p>
    <h3>Bluff et diplomatie</h3><ul><li><b>Dé caché</b> : chaque joueur a un dé que les autres ne voient pas.</li><li><b>Mariage</b> : alliance permanente, +1 or par manche. <b>Trêve</b> : 3 manches. Attaquer un allié ou rompre une trêve = trahison (−5 Prestige).</li><li><b>Or</b> : tu peux envoyer de l'or à qui tu veux (pot-de-vin, rançon, promesse).</li><li><b>Crimes anonymes</b> : un poison réussi ou un coup bas reste anonyme. Accuse la bonne maison (+2 / elle −4), ou passe pour un calomniateur (−2).</li><li><b>Messages secrets</b> : onglet Messages, lus seulement par le destinataire.</li></ul>
    <h3>Jauges</h3><p>Colère à 80 : une province se révolte. Peur : +1 en défense tous les 25 points, mais à 50 plus aucun mariage.</p>
    <h3>Le favori</h3><p>Le joueur en tête porte la couronne : battre ses armées rapporte +2 Prestige. Dernière manche : le Couronnement, conquêtes à 3 Prestige et scores cachés.</p>
    <button class="btn btn-block" id="md-close">Fermer</button></div>`;
  m.innerHTML = html; m.classList.remove("hidden");
  const close = () => { m.classList.add("hidden"); setTimeout(nextModal, 50); };
  m.querySelectorAll("#md-close").forEach((b) => (b.onclick = close));
  m.querySelectorAll("[data-intro]").forEach((b) => (b.onclick = () => openModal("intro", +b.dataset.intro)));
  m.querySelectorAll("[data-fam]").forEach((b) => (b.onclick = () => { A.play("click"); openModal("family", +b.dataset.fam); }));
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
