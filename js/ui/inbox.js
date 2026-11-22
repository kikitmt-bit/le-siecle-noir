// Réception des données (salon, messages privés, état de la partie)
import * as A from "../audio.js?v=1795389300";
import { AI_REPLIES, WHISPERS } from "../content.js?v=1795389300";
import * as E from "../engine.js?v=1795389300";
import { ICON, term } from "../help.js?v=1795389300";
import { becomeHost, stopHost, syncInputListeners } from "../host.js?v=1795389300";
import { $, H, L, S, SOLO, esc, me, net, resetUi, setRollDiceAnim, store } from "../state.js?v=1795389300";
import { queueModal } from "./aides.js?v=1795389300";
import { playNewsSounds, restoreOrders, splash } from "./announce.js?v=1795389300";
import { houseColor, houseName, show, toast, tuto } from "./common.js?v=1795389300";
import { bindDiplomacy, diplomacyHtml } from "./diplomacy.js?v=1795389300";
import { shield } from "./draw.js?v=1795389300";
import { infoFromState, noteGame } from "./games.js?v=1795389300";
import { badFormat, renderLobby } from "./lobby.js?v=1795389300";
import { buildMap } from "./map.js?v=1795389300";
import { recordPalmares } from "./overlays.js?v=1795389300";
import { render } from "./render.js?v=1795389300";

// ---------------------------------------------------------------------
// réception des données
// ---------------------------------------------------------------------
export function onMeta() {
  const host = L.meta && L.meta.host;
  if (host && L.hostSeen && host !== L.hostSeen && host !== net.uid && L.state && L.state.phase !== "lobby") toast("L'arbitre a changé : un autre joueur fait maintenant tourner la partie.", "#75603F", 4000);
  if (host) L.hostSeen = host;
  if (!L.state || L.state.phase === "lobby") renderLobby();
  if (L.meta && L.meta.host === net.uid && !H.active) becomeHost();
  if (L.meta && L.meta.host !== net.uid && H.active) stopHost();
  render();
}

export function onMembers() {
  if (H.active) syncInputListeners();
  if (!L.state || L.state.phase === "lobby") renderLobby(); else render();
}

export function onTaunts(t) {
  for (const [k, v] of Object.entries(t)) {
    if (L.taunts[k]) continue;
    L.taunts[k] = v;
    if (v.t && v.t > net.now() - 8000 && v.t > L.joinedAt - 2000) {
      const pid = v.pid;
      toast(`<b style="color:${houseColor(pid) === "#241811" ? "#A9843A" : "#A9843A"}">${esc(houseName(pid))}</b> : « ${esc(v.text)} »`, houseColor(pid), 4500);
      A.play("taunt");
    }
  }
}

export function onWhispers(w) {
  for (const [k, v] of Object.entries(w)) {
    if (L.whispers[k]) continue;
    L.whispers[k] = v;
    if (!v.sent && (v.t || 0) > L.joinedAt - 2000) {
      L.unread++;
      toast(`<b>Message secret de ${esc(houseName(v.from))}</b><br>« ${esc(v.text)} »`, houseColor(v.from), 6000);
      A.play("taunt");
    }
  }
  if (L.state && L.state.phase !== "lobby") { renderMessages(); updateMsgBadge(); }
}


export function seatUidsOf(pid) { const st = S(); return Object.entries(st.seats || {}).filter(([, v]) => v === pid).map(([u]) => u); }

export function sendWhisper(to, text) {
  const st = S(), from = me();
  if (!from || !text.trim()) return;
  text = text.trim().slice(0, 160);
  for (const u of seatUidsOf(to)) net.sendWhisper(L.code, u, { from, to, text });
  net.sendWhisper(L.code, net.uid, { from, to, text, sent: true });
  const tp = st.players[to];
  if (tp && tp.isBot) {
    const pool = AI_REPLIES[tp.ai || "anglais"] || AI_REPLIES.anglais;
    setTimeout(() => net.sendWhisper(L.code, net.uid, { from: to, to: from, text: pool[Math.floor(Math.random() * pool.length)] }), 1500 + Math.random() * 2500);
  }
  A.play("click");
}

export function renderMessages() { renderDiplo(); }

export function renderDiplo() {
  const st = S(), pid = me();
  const el = $("#tab-diplo");
  if (!el || !st || !pid || st.phase === "lobby") return;
  if (!E.unlocked(st, "diplomacy")) {
    el.innerHTML = `<div class="locked-box">${ICON.ring}<br><b>La diplomatie se débloque à la manche ${E.UNLOCK.diplomacy}.</b><br>Mariages, trêves, or et messages secrets : tu pourras négocier avec les autres maisons.</div>`;
    return;
  }
  if (document.activeElement && document.activeElement.id === "msg-in") return;
  const others = st.order.filter((p) => p !== pid && st.players[p].house !== "anglais");
  if (!L.ui.msgTo || !others.includes(L.ui.msgTo)) L.ui.msgTo = others[0] || null;
  const list = Object.values(L.whispers).sort((a, b) => (b.t || 0) - (a.t || 0)).slice(0, 30);
  const diplo = ["dilemma", "orders"].includes(st.phase) ? diplomacyHtml() : `<div class="pbox"><p class="ph">Diplomatie</p><p class="ptext" style="margin:0">Les propositions (${term("mariage")}, ${term("treve", "trêve")}, or) se font pendant le dilemme et les ordres. Tu peux envoyer des messages à tout moment.</p></div>`;
  el.innerHTML = `${diplo}
    <div class="pbox"><p class="ph">Messages secrets</p><p class="hint" style="margin-top:0">Seul le destinataire les lit. Promesses, menaces, mensonges : tout est permis.</p>
    <div class="row wrap">${others.map((o) => `<button class="btn btn-small ${L.ui.msgTo === o ? "btn-dark" : ""}" data-msgto="${o}">${shield(st.players[o].house, 16)} ${esc(houseName(o))}</button>`).join("")}</div>
    <div class="presets">${WHISPERS.map((w) => `<button data-preset="${esc(w)}">${esc(w)}</button>`).join("")}</div>
    <div class="row"><input id="msg-in" class="msg-input grow" maxlength="160" placeholder="Ton message…" aria-label="Ton message"><button class="btn btn-red" id="msg-send">Envoyer</button></div>
    <div class="msg-list">${list.length ? list.map((m) => `<div class="msg-item ${m.sent ? "sent" : ""}"><b style="color:${houseColor(m.sent ? m.to : m.from)}">${m.sent ? `À ${esc(houseName(m.to))}` : `De ${esc(houseName(m.from))}`}</b>${esc(m.text)}</div>`).join("") : '<p class="wait">Aucun message pour l\'instant.</p>'}</div></div>`;
  if (["dilemma", "orders"].includes(st.phase)) bindDiplomacy();
  el.querySelectorAll("[data-msgto]").forEach((b) => (b.onclick = () => { L.ui.msgTo = b.dataset.msgto; renderDiplo(); }));
  el.querySelectorAll("[data-preset]").forEach((b) => (b.onclick = () => { $("#msg-in").value = b.dataset.preset; }));
  $("#msg-send").onclick = () => { if (L.ui.msgTo) { sendWhisper(L.ui.msgTo, $("#msg-in").value); $("#msg-in").value = ""; } };
  $("#msg-in").onkeydown = (e) => { if (e.key === "Enter") $("#msg-send").click(); };
}

export function updateMsgBadge() {
  const st = S(), pid = me();
  const b = $("#tab-diplo-btn");
  if (!b || !st) return;
  const props = pid ? Object.entries(st.proposals || {}).filter(([k, pr]) => pr.to === pid && (L.ui.answers[k] ?? (L.myInput.answers || {})[k]) === undefined).length : 0;
  const n = props + (L.unread || 0);
  b.innerHTML = `Diplomatie${n ? `<span class="badge">${n}</span>` : ""}`;
}

export function onState(st) {
  const prev = L.state;
  L.state = st;
  const prob = E.formatProblem(st);
  if (prob) { badFormat(prob, st); return; }
  if (!st || st.phase === "lobby") { L.ui = resetUi(); L.endClosed = false; renderLobby(); return; }
  show("game");
  if (!L.mapBuilt) buildMap();
  const pid = me();
  // transitions
  if (st.round !== L.last.round) {
    L.ui.orders = []; L.ui.build = null; L.ui.dChoice = null; L.ui.dTarget = null; L.ui.proposeTo = []; L.ui.answers = {};
    L.dilemmaClosed = false;
    if (st.round > 0) { A.play("bell"); setRollDiceAnim(true); }
    if (st.round === st.maxRounds) { A.play("drum"); tuto("round10", "Le Couronnement", "Dernière manche ! Chaque conquête rapporte 3 Prestige et les scores sont cachés jusqu'à la fin."); }
  }
  // fenêtres « Nouveau » de la première partie : au moment des ordres, quand on a le temps de lire
  if (st.tutorial && me() && st.phase === "orders") for (const [k, r] of Object.entries(E.UNLOCK)) if (st.round === r && !store.get(`sn_unl_${st.gameId}_${k}`)) { store.set(`sn_unl_${st.gameId}_${k}`, "1"); setTimeout(() => queueModal("unlock", k), 2600); }
  if (st.phase !== L.last.phase) {
    if (st.phase === "orders") restoreOrders();
    if (st.phase === "interlude") { A.play("bell"); L.modalOpen = null; }
    if (st.phase === "end") { A.play("fanfare"); L.endClosed = false; recordPalmares(st); }
    if (st.phase === "objectives") { L.objClosed = false; if (me() && (st.tutorial || !store.get("sn_intro_seen"))) { store.set("sn_intro_seen", "1"); queueModal("intro", 0); } }
    if (st.phase === "dilemma") { L.dilemmaClosed = false; playNewsSounds(st); }
    if (st.phase === "reveal") L.last.revealIdx = -1;
    if (st.phase === "draft") A.play("drum");
  }
  if (st.phase !== L.last.phase || st.round !== L.last.round) splash(st);
  if (st.phase !== L.last.phase && ["orders", "placement", "draft", "reveal"].includes(st.phase)) L.ui.tab = "panel";
  // alertes : la Colère qui va déclencher une révolte, le trésor qui ne paiera pas la solde
  if (st.phase === "dilemma" && (st.phase !== L.last.phase || st.round !== L.last.round) && pid && st.players[pid]) {
    const p = st.players[pid];
    if (p.colere >= 65) setTimeout(() => toast(`${ICON.colere}<b>Ta Colère du peuple est à ${p.colere}.</b> À 80 en fin de manche, une de tes provinces se révolte et devient neutre. Offre une fête au peuple (3 or, dans tes ordres) ou évite les choix cruels.`, "#A3221A", 9000), 3200);
    const up = E.upkeepOf(st, pid), inc = E.incomeOf(st, pid).total;
    if (p.gold + inc < up) setTimeout(() => toast(`${ICON.gold}<b>Ton trésor ne suffira pas à payer la solde</b> (${up} or) : des soldats vont déserter en fin de manche.`, "#A3221A", 8000), 3600);
  }
  if (st.phase === "placement" && me() && st.families && st.families[me()] && !store.get(`sn_fam_${st.gameId}`)) { store.set(`sn_fam_${st.gameId}`, "1"); setTimeout(() => queueModal("family", 0), 2400); }
  if (prev && prev.leader !== st.leader && st.leader && st.round > 1 && st.round < st.maxRounds && ["dilemma", "interlude"].includes(st.phase)) {
    setTimeout(() => { toast(`${ICON.prestige}<b>La couronne passe à ${esc(houseName(st.leader))}</b>${st.leader === me() ? " : c'est toi ! Tout le monde va vouloir te faire tomber." : ". Battre ses armées rapporte 2 Prestige."}`, "#A9843A", 6000); A.play("horn"); }, 2400);
  }
  if (!SOLO && L.code && (st.phase !== L.last.phase || st.round !== L.last.round || !L.noted)) { L.noted = true; noteGame(L.code, infoFromState(st, pid)); }
  L.last.round = st.round; L.last.phase = st.phase;
  render();
}
