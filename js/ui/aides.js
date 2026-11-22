// Aides : fenêtres d'introduction, définitions, fiche province, coach
import * as E from "../engine.js?v=1795380938";
import { GLOSSARY, ICON, INTRO, term } from "../help.js?v=1795380938";
import { PROVINCES, REGIONS } from "../map.js?v=1795380938";
import { $, L, S, esc, me } from "../state.js?v=1795380938";
import { houseName } from "./common.js?v=1795380938";
import { dilLeft } from "./dilemmas.js?v=1795380938";
import { shield } from "./draw.js?v=1795380938";
import { openModal } from "./overlays.js?v=1795380938";
import { revealProvinces } from "./reveal.js?v=1795380938";

export function queueModal(kind, data) { L.modalQueue.push({ kind, data }); if ($("#modal").classList.contains("hidden")) nextModal(); }

export function nextModal() { const m = L.modalQueue.shift(); if (m) openModal(m.kind, m.data); }

export function introHtml(i) {
  const c = INTRO[i];
  return `<div class="card"><span class="card-kicker">COMMENT JOUER · ${i + 1} SUR ${INTRO.length}</span><div class="intro-icon">${c.icon.replace('width="16" height="16"', 'width="56" height="56"')}</div><h2 style="text-align:center">${c.title}</h2><p>${c.text}</p>
    <div class="intro-dots">${INTRO.map((_, j) => `<span class="${j === i ? "on" : ""}"></span>`).join("")}</div>
    <div class="row">${i > 0 ? `<button class="btn grow" data-intro="${i - 1}">← Précédent</button>` : `<button class="btn grow" id="md-close">Passer</button>`}${i < INTRO.length - 1 ? `<button class="btn btn-red grow" data-intro="${i + 1}">Suivant →</button>` : `<button class="btn btn-red grow" id="md-close">C'est parti !</button>`}</div></div>`;
}

// popover (définitions et fiches de province)
export function showPopover(html, x, y) {
  const p = $("#popover");
  p.innerHTML = `<button type="button" class="pop-x" aria-label="Fermer">×</button>${html}`; p.classList.remove("hidden");
  const w = p.offsetWidth, h = p.offsetHeight;
  p.style.left = Math.max(10, Math.min(window.innerWidth - w - 10, x - w / 2)) + "px";
  p.style.top = (y + h + 20 > window.innerHeight ? Math.max(10, y - h - 14) : y + 14) + "px";
}

export function hidePopover() { $("#popover").classList.add("hidden"); }

document.addEventListener("click", (e) => {
  const t = e.target.closest(".term");
  if (t) { e.preventDefault(); e.stopPropagation(); const g = GLOSSARY[t.dataset.term]; if (g) { const r = t.getBoundingClientRect(); showPopover(`<h5>${g[0]}</h5>${g[1]}`, r.left + r.width / 2, r.bottom); } return; }
  if (e.target.closest(".pop-x")) { hidePopover(); return; }
  if (!e.target.closest("#popover") && !e.target.closest("#map")) hidePopover();
}, true);

document.addEventListener("keydown", (e) => { if (e.key === "Escape") { hidePopover(); $("#legend").classList.add("hidden"); } });

export function provinceCard(id) {
  const st = S(), P = PROVINCES[id], p = (st.phase === "reveal" ? revealProvinces() : st.provinces)[id];
  const owner = p.owner ? `${shield(st.players[p.owner].house, 14)} ${esc(houseName(p.owner))}${p.owner === me() ? " (toi)" : ""}` : "Neutre (milice)";
  const isCap = st.order.find((o) => st.players[o].capital === id && p.owner === o);
  const reg = REGIONS[P.region];
  const regOwner = reg.provs.every((x) => st.provinces[x].owner && st.provinces[x].owner === st.provinces[reg.provs[0]].owner) ? st.provinces[reg.provs[0]].owner : null;
  const neigh = P.adj.map((a) => PROVINCES[a].name).join(", ");
  return `<h5>${ICON.province}${esc(P.name)} · ${esc(P.city)}</h5>
    <div class="pv-row"><span>Propriétaire</span><span>${owner}</span></div>
    <div class="pv-row"><span>${ICON.army}Armées</span><b>${p.armies}</b></div>
    <div class="pv-row"><span>${term("defense", "Défense")}</span><span>${E.defenseOf(st, id)} + petit hasard</span></div>
    ${isCap ? `<div class="pv-row"><span>${term("capitale", "Capitale")}</span><span>de ${esc(houseName(isCap))}</span></div>` : ""}
    ${p.plague ? `<div class="pv-row"><span>${ICON.plague}${term("peste", "Peste")}</span><span>−1 armée par manche</span></div>` : ""}
    <div class="pv-row"><span>${term("region", "Région")}</span><span>${reg.name} (${reg.provs.length} prov.)${regOwner ? ` · tenue par ${esc(houseName(regOwner))}` : ""}</span></div>
    <div class="pv-row"><span>Voisines</span><span style="text-align:right">${esc(neigh)}</span></div>`;
}

// coach : fait clignoter l'élément à utiliser (première partie)
export function applyCoach() {
  document.querySelectorAll(".coach").forEach((e) => e.classList.remove("coach"));
  const st = S(), pid = me();
  if (!st || !st.tutorial || !pid) return;
  let sel = null;
  const sealed = L.myInput.orders && L.myInput.orders.round === st.round && L.myInput.orders.sealed;
  if (st.phase === "placement" && !(L.myInput.placement && L.myInput.placement.ok)) sel = '[data-guide="plok"]';
  if (st.phase === "dilemma" && dilLeft()) sel = !$("#overlay").classList.contains("hidden") ? (L.ui.dChoice === null || L.ui.dChoice === undefined ? ".choice" : "#dil-ok:not([disabled])") : '[data-guide="dil"]';
  if (st.phase === "orders" && !sealed) {
    const b = L.ui.build;
    if (!b) sel = $('[data-die]:not(.used):not([disabled])') ? '[data-die]:not(.used):not([disabled])' : "#btn-seal";
    else if (!b.type) sel = '[data-act="levy"]';
    else if ($("#b-ok")) sel = "#b-ok";
  }
  if (st.phase === "interlude") sel = "#btn-next:not([disabled])";
  if (st.phase === "draft" && L.ui.draftSel) sel = '[data-guide="draftok"]';
  if (sel) { const el = document.querySelector(sel); if (el) el.classList.add("coach"); }
}
