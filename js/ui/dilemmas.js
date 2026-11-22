// Panneau des dilemmes
import * as E from "../engine.js?v=1795389807";
import { ICON, term } from "../help.js?v=1795389807";
import { L, S, esc, me } from "../state.js?v=1795389807";
import { houseName } from "./common.js?v=1795389807";
import { dieSvg, shield } from "./draw.js?v=1795389807";
import { newsHtml, ragotsHtml } from "./news.js?v=1795389807";
import { myDice } from "./orders.js?v=1795389807";
import { render } from "./render.js?v=1795389807";

export const DSLOTS = ["dilemma", "dilemma2", "council"];

export function dilHas(k) { const st = S(); return !!(L.priv && L.priv[k] && L.priv[k].round === st.round); }

export function dilSealed(k) { const st = S(); return !!(L.myInput[k] && L.myInput[k].round === st.round); }

export function dilSlots() { return DSLOTS.filter(dilHas); }

export function dilLeft() { return dilSlots().filter((k) => !dilSealed(k)).length; }

export function dilCurrent() { const sl = dilSlots(); if (L.ui.dSlot && sl.includes(L.ui.dSlot)) return L.ui.dSlot; return sl.find((k) => !dilSealed(k)) || sl[0]; }

export function panelDilemma() {
  const st = S();
  const sl = dilSlots(), left = dilLeft();
  const names = { dilemma: "Affaire de ta maison", dilemma2: "Affaire avec un rival", council: "Vote au Conseil du Roi" };
  return { html: `${newsHtml()}${ragotsHtml()}<p class="ph">1. Les ${term("dilemme", "dilemmes")}</p><p class="ptext">${sl.length ? (left ? `Tes décisions secrètes : une <b>affaire de ta maison</b> (les autres n'en sauront qu'une rumeur) et une <b>affaire avec un rival</b> (révélée à tous)${sl.includes("council") ? ", plus le <b>vote public du Conseil du Roi</b>" : ""}. Il en reste <b>${left}</b>.` : "Tes choix sont scellés. Tu peux encore les changer tant que tout le monde n'a pas fini.") : "Pas de dilemme pour toi cette manche."}</p>
    ${sl.map((k) => `<button class="btn btn-block ${dilSealed(k) ? "" : "btn-red"}" data-opendil="${k}" style="margin-bottom:6px">${dilSealed(k) ? "✓ " : ""}${names[k]}${dilSealed(k) ? " (revoir)" : ""}</button>`).join("")}
    <div class="pbox" style="margin-top:12px"><p class="ph">Ensuite : 2. les ordres</p><p class="ptext" style="font-size:15px;margin:0">Quand tout le monde a choisi, tu donneras un ordre à chacun de tes dés : ${ICON.frapper}${term("frapper")}, ${ICON.marcher}${term("marcher")}, ${ICON.lever}${term("lever")}${E.unlocked(st, "intrigue") ? `, ${ICON.intrigue}${term("intriguer")}` : ""}.</p></div>`,
    bind: () => { document.querySelectorAll("[data-opendil]").forEach((b) => (b.onclick = () => { L.ui.dSlot = b.dataset.opendil; L.ui.dChoice = null; L.ui.dTarget = null; L.dilemmaClosed = false; L.ovKey = ""; render(); })); } };
}

export function dicePreview() {
  const st = S();
  return `<div class="pbox"><p class="ph">Les dés de cette manche</p>${st.order.map((pid) => `<div class="row" style="margin-bottom:6px">${shield(st.players[pid].house, 18)}<span style="min-width:90px;font-family:var(--caps);font-variant-caps:all-small-caps;font-size:14.5px">${esc(houseName(pid))}</span><span class="row" style="gap:4px">${(pid === me() ? myDice() : st.players[pid].dice).map((v, i) => (v ? dieSvg(v, 26, true) : '<span class="qdie" title="Dé caché">?</span>')).join("")}</span></div>`).join("")}<p class="hint">Chacun voit les dés des autres, sauf un dé caché par joueur. Un double donne un dé de 2 en plus.</p></div>`;
}
