// Panneau par phase : objectifs, choix des provinces, placement
import * as A from "../audio.js?v=1795389807";
import * as E from "../engine.js?v=1795389807";
import { PROVINCES, REGIONS } from "../map.js?v=1795389807";
import { $, L, MAP, S, esc, me, net } from "../state.js?v=1795389807";
import { houseColor, houseName, setInput, toast } from "./common.js?v=1795389807";
import { panelDilemma } from "./dilemmas.js?v=1795389807";
import { entryHtml } from "./house.js?v=1795389807";
import { updateMap } from "./map.js?v=1795389807";
import { panelOrders } from "./orders.js?v=1795389807";
import { render } from "./render.js?v=1795389807";
import { interludeLines, panelReveal } from "./reveal.js?v=1795389807";

// ---------------------------------------------------------------------
// PANNEAU PAR PHASE
// ---------------------------------------------------------------------
export function renderPanel() {
  const st = S(), pid = me();
  if (!pid) return { html: `<p class="ph">Spectateur</p><p class="ptext">Tu observes la partie. ${spectatorClaimHtml()}</p>`, bind: bindClaim };
  switch (st.phase) {
    case "objectives": return panelObjectives();
    case "draft": return panelDraft();
    case "placement": return panelPlacement();
    case "dilemma": return panelDilemma();
    case "orders": return panelOrders();
    case "reveal": return panelReveal();
    case "interlude": return { html: `<p class="ph">Chronique de l'an ${E.yearOf(st.round)}</p>${interludeLines().map((l) => `<p class="ptext ch-entry">${entryHtml(l)}</p>`).join("")}` };
    case "end": return { html: `<p class="ph">La partie est terminée</p><p class="ptext">${esc(st.result ? `${houseName(st.result.winner)} l'emporte.` : "")}</p><button class="btn btn-red btn-block" id="btn-end-open">Voir les résultats</button>`, bind: () => ($("#btn-end-open").onclick = () => { L.endClosed = false; render(); }) };
  }
  return { html: "" };
}

export function spectatorClaimHtml() {
  const st = S();
  const free = st.order.filter((pid) => !st.players[pid].isBot && !Object.entries(st.seats || {}).some(([u, v]) => v === pid && L.members[u] && L.members[u].online !== false));
  if (!free.length) return "";
  return `<br><br>Une place est libre : tu peux reprendre celle d'un joueur qui a changé d'appareil.</p><div class="row wrap">${free.map((pid) => `<button class="btn btn-small" data-claim="${pid}">Reprendre ${esc(st.players[pid].name)} (${esc(houseName(pid))})</button>`).join("")}</div><p>`;
}

export function bindClaim() { document.querySelectorAll("[data-claim]").forEach((b) => (b.onclick = () => net.updateMember(L.code, { claim: b.dataset.claim }))); }


export function panelObjectives() {
  const done = L.myInput.objPick && L.myInput.objPick.length === 2;
  return { html: `<p class="ph">Objectifs secrets</p><p class="ptext">${done ? "Tes objectifs sont choisis. On attend les autres seigneurs." : "Choisis 2 objectifs secrets parmi les 3 proposés."}</p><button class="btn btn-block" id="btn-obj">${done ? "Revoir mes objectifs" : "Choisir mes objectifs"}</button>`, bind: () => ($("#btn-obj").onclick = () => { L.objClosed = false; render(); }) };
}

export function confirmDraft() {
  const st = S(); const d = L.ui.draftSel;
  if (!d || d.idx !== st.draft.idx) return;
  setInput("draftPick", d); A.play("seal"); toast(`Tu prends ${esc(PROVINCES[d.prov].art)}.`, "#75603F", 2500); L.ui.draftSel = null; render();
}

export function panelDraft() {
  const st = S(), pid = me();
  const cur = E.currentDrafter(st);
  const mine = cur === pid;
  if (mine) {
    for (const id of E.PROV_IDS) if (!st.provinces[id].owner) MAP.sel.add(id);
    if (L.ui.draftSel && (L.ui.draftSel.idx !== st.draft.idx || st.provinces[L.ui.draftSel.prov].owner)) L.ui.draftSel = null;
    MAP.hl = L.ui.draftSel ? new Set([L.ui.draftSel.prov]) : new Set(MAP.sel);
    if (L.ui.draftSel) MAP.hlRed = new Set([L.ui.draftSel.prov]);
    MAP.onPick = (id) => { L.ui.draftSel = { idx: st.draft.idx, prov: id }; render(); };
  } else L.ui.draftSel = null;
  const sel = mine && L.ui.draftSel ? L.ui.draftSel.prov : null;
  const first = !st.players[pid].capital;
  const seq = st.draft.seq.map((p, i) => `<span style="background:${houseColor(p)}" class="${i === st.draft.idx ? "cur" : i < st.draft.idx ? "done" : ""}" title="${esc(houseName(p))}"></span>`).join("");
  return { html: `<p class="ph ${mine ? "red" : ""}">${mine ? "À toi de choisir !" : `Au tour de ${esc(st.players[cur]?.name || "")} (${esc(houseName(cur))})`}</p>
    <p class="ptext">${mine ? (first ? "Clique sur une province libre : <b>ce sera ta capitale</b>. Protège-la, la perdre coûte très cher." : "Clique sur une province libre. Regroupe tes terres et vise une région entière : elle rapporte des armées et du Prestige à chaque manche.") : "Chacun choisit une province à tour de rôle. L'ordre s'inverse à chaque tour."}</p><p class="hint">Chacun choisit ${E.provincesPerPlayer(st.order.length)} provinces. Ensuite, toutes les provinces restantes sont partagées automatiquement autour de vos terres.</p>
    ${sel ? `<div class="recap"><p class="ph">Ton choix : ${esc(PROVINCES[sel].name)}</p><p class="ptext" style="font-size:15px">${first ? "Ce sera ta <b>capitale</b>. " : ""}Région ${esc(REGIONS[PROVINCES[sel].region].name)} · voisines : ${PROVINCES[sel].adj.map((a) => esc(PROVINCES[a].name)).join(", ")}.</p></div>` : ""}
    <div class="draft-order">${seq}</div>
    ${regionsHelp()}`, bind: () => {} };
}

export function regionsHelp() {
  return `<div class="pbox"><p class="ph">Régions (bonus par manche)</p>${Object.values(REGIONS).map((r) => `<div style="font-size:14px;margin-bottom:4px;text-wrap:pretty"><b style="font-family:var(--caps);font-variant-caps:all-small-caps;font-size:14.5px">${r.name}</b> : ${r.provs.map((p) => PROVINCES[p].name).join(", ")} <i>(+${r.provs.length - 1} armées, +1 prestige)</i></div>`).join("")}</div>`;
}

export function panelPlacement() {
  const st = S(), pid = me();
  const mine = E.provincesOf(st, pid);
  if (!L.ui.placement) { L.ui.placement = {}; mine.forEach((id) => (L.ui.placement[id] = 1)); }
  const pl = L.ui.placement;
  const used = mine.reduce((s, id) => s + (pl[id] || 1), 0);
  const left = E.START_ARMIES - used;
  const sent = L.myInput.placement && L.myInput.placement.ok;
  if (!sent && left > 0) { mine.forEach((id) => MAP.sel.add(id)); MAP.onPick = (id) => { pl[id] = (pl[id] || 1) + 1; render(); }; }
  // affichage provisoire
  const view = JSON.parse(JSON.stringify(st.provinces));
  mine.forEach((id) => (view[id].armies = pl[id] || 1));
  setTimeout(() => updateMap(view), 0);
  return { html: `<p class="ph">Place tes ${E.START_ARMIES} armées</p><p class="ptext">${sent ? "Placement envoyé. On attend les autres." : `Clique sur tes provinces pour ajouter une armée. Il t'en reste <b>${left}</b>.`}</p>
    <ul class="orderlist placelist">${mine.map((id) => `<li><span>${esc(PROVINCES[id].name)}${id === st.players[pid].capital ? " <i>(capitale)</i>" : ""}</span><span class="stepper"><button data-m="${id}" aria-label="Retirer une armée" ${sent ? "disabled" : ""}>−</button><b>${pl[id] || 1}</b><button data-p="${id}" aria-label="Ajouter une armée" ${sent || left <= 0 ? "disabled" : ""}>+</button></span></li>`).join("")}</ul>
    <div class="row"><button class="btn grow" id="pl-auto" ${sent ? "disabled" : ""}>Automatique</button><button class="btn btn-red grow" id="pl-ok">${sent ? "Modifier" : "Valider"}</button></div>`,
    bind: () => {
      document.querySelectorAll("[data-p]").forEach((b) => (b.onclick = () => { pl[b.dataset.p] = (pl[b.dataset.p] || 1) + 1; render(); }));
      document.querySelectorAll("[data-m]").forEach((b) => (b.onclick = () => { pl[b.dataset.m] = Math.max(1, (pl[b.dataset.m] || 1) - 1); render(); }));
      $("#pl-auto").onclick = () => { setInput("placement", { ok: true }); A.play("seal"); render(); };
      $("#pl-ok").onclick = () => { if (sent) { setInput("placement", { ok: false }); } else { const alloc = { ok: true }; mine.forEach((id) => (alloc[id] = pl[id] || 1)); setInput("placement", alloc); A.play("seal"); } render(); };
    } };
}
