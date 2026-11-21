// =====================================================================
//  LE SIÈCLE NOIR — application (interface + arbitre)
// =====================================================================
import * as remote from "./net.js?v=1795295887";
import * as local from "./localnet.js?v=1795295887";
import * as E from "./engine.js?v=1795295887";
import { PROVINCES, REGIONS } from "./map.js?v=1795295887";
import { HOUSES, HUMAN_HOUSES, DILEMMAS, OBJECTIVES, TAUNTS, TRAITS, HEALTH, WHISPERS, AI_REPLIES } from "./content.js?v=1795295887";
import * as A from "./audio.js?v=1795295887";
import { ICON, GLOSSARY, term, chipsHtml, INTRO, UNLOCK_INFO, LEGEND } from "./help.js?v=1795295887";
const H_ICON = ICON;

let net = remote; // en solo, on bascule sur le réseau local
let SOLO = false;
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} } };
const STEP_MS = 1600;
const SPEED = new URLSearchParams(location.search).has("fast") ? 0.12 : 1; // pour les tests automatiques

// ---------------------------------------------------------------------
// état local
// ---------------------------------------------------------------------
const L = {
  code: null, meta: null, members: {}, state: null, priv: null, myInput: {}, taunts: {}, joinedAt: 0, unsub: [],
  last: { round: -1, phase: null, revealIdx: -1, revealKey: "", seq: -1, newsSeen: -1 },
  ui: resetUi(), modalOpen: null, endClosed: false, dilemmaClosed: false, objClosed: false, tutoQueue: [],
};
function resetUi() { return { tab: "panel", objPick: [], placement: null, dChoice: null, dTarget: null, dSlot: null, orders: [], build: null, offers: [], answers: {}, gifts: [], giftTo: null, giftAmt: 1, accuse: null, accuseCrime: null, msgTo: null, viewHouse: null }; }
const me = () => (L.state && L.state.seats && L.state.seats[net.uid]) || null;
const S = () => L.state;
const tm = () => (L.state && L.state.tutorial ? 1.5 : 1);

// ---------------------------------------------------------------------
// dessins (blasons, dés, gravures)
// ---------------------------------------------------------------------
function shield(house, size = 32) {
  const h = HOUSES[house] || HOUSES.valcourt;
  const ch = {
    tower: '<path d="M22,46 V24 h4 v-5 h4 v5 h4 v-5 h4 v5 h4 V46 Z" fill="#E8C66A"/>',
    fish: '<path d="M18,34 q14,-14 28,0 q-14,14 -28,0 Z M46,34 l7,-7 v14 Z" fill="#E8C66A"/>',
    star: '<path d="M32,16 l4.5,10.5 h11 l-9,6.5 3.5,11 -10,-6.5 -10,6.5 3.5,-11 -9,-6.5 h11 Z" fill="#E8C66A"/>',
    key: '<circle cx="32" cy="24" r="7" fill="none" stroke="#E8C66A" stroke-width="3.5"/><path d="M32,31 v18 M32,42 h6 M32,48 h6" stroke="#E8C66A" stroke-width="3.5"/>',
    lion: '<path d="M18,22 h22 l4,-4 l3,4 h-3 v3 h-26 Z M18,34 h22 l4,-4 l3,4 h-3 v3 h-26 Z M22,46 h18 l4,-4 l3,4 h-3 v3 h-22 Z" fill="#E8C66A"/>',
  }[h.charge];
  return `<svg width="${size}" height="${Math.round(size * 1.15)}" viewBox="0 0 64 74" aria-hidden="true"><path d="M4,4 H60 V34 C60,54 46,66 32,70 C18,66 4,54 4,34 Z" fill="${h.color}" stroke="#2B1D12" stroke-width="3"/>${ch}</svg>`;
}
function dieSvg(v, size = 44, frame = false) {
  const pos = { 1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]], 4: [[0, 0], [2, 0], [0, 2], [2, 2]], 5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]], 6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]] }[v] || [];
  return `<svg width="${size}" height="${size}" viewBox="0 0 42 42" role="img" aria-label="Dé ${v}">${frame ? '<rect x="1" y="1" width="40" height="40" rx="7" fill="#F6ECD6" stroke="#2B1D12" stroke-width="2"/>' : ""}${pos.map(([x, y]) => `<circle cx="${9 + x * 12}" cy="${9 + y * 12}" r="4" fill="#2B1D12"/>`).join("")}</svg>`;
}
function woodcut(w = 460, h = 300, scene = 0) {
  const lines = [];
  for (let i = 0; i < 300; i += 7) lines.push(`<line x1="0" y1="${i}" x2="460" y2="${i}" stroke="#2B1D12" stroke-width="0.6" opacity="${(0.1 + 0.25 * (1 - i / 300)).toFixed(2)}"/>`);
  const crows = [[150, 60, 1], [178, 48, 0.8], [290, 110, 1.1], [120, 96, 0.7], [400, 150, 0.9]].map(([x, y, s]) => `<path transform="translate(${x},${y}) scale(${s})" d="M-14,0 Q-7,-8 0,0 Q7,-8 14,0 Q7,-3 0,3 Q-7,-3 -14,0 Z" fill="#1A120C"/>`).join("");
  let wall = "M60,250 V170";
  for (let x = 72; x < 400; x += 24) wall += ` h12 v-10 h12 v10`;
  wall += " h4 V250 Z";
  const scenes = [
    // ville murée
    `<path d="${wall}" fill="#1A120C"/><path d="M70,250 V120 h40 V250 Z M66,122 L90,72 L114,122 Z" fill="#1A120C"/><path d="M330,250 V130 h40 V250 Z M326,132 L350,84 L374,132 Z" fill="#1A120C"/><path d="M214,170 V100 h32 V170 Z M210,102 L230,30 L250,102 Z M228,14 h4 v18 h-4 Z M222,20 h16 v4 h-16 Z" fill="#1A120C"/><path d="M196,250 V214 Q230,186 264,214 V250 Z" fill="#E9DCBD"/>${[206, 215, 224, 233, 242].map((y) => `<line x1="196" y1="${y}" x2="264" y2="${y}" stroke="#1A120C" stroke-width="2"/>`).join("")}`,
    // gibets
    `${[90, 200, 310].map((x) => `<path d="M${x},250 V120 h70 v8 h-62 V250 Z" fill="#1A120C"/><line x1="${x + 56}" y1="128" x2="${x + 56}" y2="150" stroke="#1A120C" stroke-width="2"/><path d="M${x + 50},150 h12 v34 h-12 Z M${x + 52},184 v26 h3 v-26 Z M${x + 57},184 v26 h3 v-26 Z" fill="#1A120C"/><circle cx="${x + 56}" cy="146" r="7" fill="#1A120C"/>`).join("")}`,
    // champ de bataille
    `${[60, 110, 170, 240, 300, 360, 410].map((x, i) => `<path d="M${x},250 L${x + 4},${120 + (i % 3) * 20} L${x + 8},250 Z" fill="#1A120C"/><path d="M${x + 4},${120 + (i % 3) * 20} l18,8 l-18,8 Z" fill="${i % 2 ? "#1A120C" : "#8E1B1B"}"/>`).join("")}<path d="M180,250 l40,-60 l6,4 l-40,60 Z M260,250 l-40,-60 l-6,4 l40,60 Z" fill="#1A120C"/>`,
  ];
  return `<svg class="woodcut" width="${w}" height="${h}" viewBox="0 0 460 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="460" height="300" fill="#E9DCBD"/>${lines.join("")}<circle cx="350" cy="70" r="38" fill="#8E1B1B"/><path d="M0,250 Q120,232 230,246 T460,240 V300 H0 Z" fill="#1A120C"/>${scenes[scene % scenes.length]}${crows}<path d="M410,250 V200 h6 V250 Z M398,212 h30 v6 h-30 Z" fill="#1A120C"/></svg>`;
}

// ---------------------------------------------------------------------
// utilitaires d'interface
// ---------------------------------------------------------------------
function show(screen) { for (const s of ["home", "lobby", "game"]) $(`#screen-${s}`).classList.toggle("hidden", s !== screen); }
function toast(html, color = "#6B5638", ms = 5000) {
  const t = document.createElement("div");
  t.className = "toast"; t.style.borderLeftColor = color; t.innerHTML = html;
  $("#toasts").appendChild(t);
  setTimeout(() => t.remove(), ms);
}
function houseName(pid) { const p = S() && S().players[pid]; return p ? p.hname || HOUSES[p.house].name : "?"; }
function houseColor(pid) { const p = S() && S().players[pid]; return p ? HOUSES[p.house].color : "#6B5638"; }
function fmtTime(ms) { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; }
function setInput(field, value) { if (!L.code) return; L.myInput[field] = value; net.setInput(L.code, field, value).catch((e) => console.warn(e)); }
function tuto(key, title, text) {
  if (!S() || !S().tutorial) return;
  const k = `sn_tuto_${S().gameId || L.code}_${key}`;
  if (store.get(k)) return;
  if (L.tutoQueue.some((t) => t.key === key)) return;
  L.tutoQueue.push({ key, title, text, k });
  renderTuto();
}
function renderTuto() {
  const el = $("#tuto");
  const t = L.tutoQueue[0];
  if (!t) { el.classList.add("hidden"); return; }
  el.innerHTML = `<h4>${esc(t.title)}</h4><p>${t.text}</p><button class="btn btn-small btn-dark" id="tuto-ok">Compris</button>`;
  el.classList.remove("hidden");
  $("#tuto-ok").onclick = () => { store.set(t.k, "1"); L.tutoQueue.shift(); renderTuto(); };
}

// ---------------------------------------------------------------------
// ACCUEIL ET SALON
// ---------------------------------------------------------------------
function initHome() {
  $("#home-crest").innerHTML = HUMAN_HOUSES.map((h) => shield(h, 34)).join("");
  const ph = palmaresHtml(); if (ph) $("#home-msg").insertAdjacentHTML("afterend", ph);
  $("#in-name").value = store.get("sn_name") || "";
  $("#in-hname").value = store.get("sn_hname") || "";
  $("#in-hname").addEventListener("change", () => store.set("sn_hname", E.cleanHouseName($("#in-hname").value) || ""));
  const params = new URLSearchParams(location.search);
  const r = (params.get("r") || "").toUpperCase();
  if (r) $("#in-code").value = r;
  $("#btn-create").onclick = () => { A.unlock(); createGame(); };
  $("#btn-join").onclick = () => { A.unlock(); joinGame(($("#in-code").value || "").trim().toUpperCase()); };
  $("#in-code").addEventListener("keydown", (e) => { if (e.key === "Enter") $("#btn-join").click(); });
  $("#btn-solo").onclick = () => { A.unlock(); $("#solo-opts").classList.toggle("hidden"); };
  document.querySelectorAll("[data-solo]").forEach((b) => (b.onclick = () => { document.querySelectorAll("[data-solo]").forEach((x) => x.setAttribute("aria-pressed", x === b)); }));
  $("#btn-solo-go").onclick = () => { A.unlock(); soloStart(); };
}
function nameOk() {
  const n = ($("#in-name").value || "").trim();
  if (!n) { $("#home-msg").textContent = "Donne d'abord un nom à ton seigneur."; $("#in-name").focus(); return null; }
  store.set("sn_name", n);
  store.set("sn_hname", E.cleanHouseName($("#in-hname").value) || "");
  return n;
}
async function soloStart() {
  const name = nameOk(); if (!name) return;
  const n = +(document.querySelector('[data-solo][aria-pressed="true"]') || { dataset: { solo: 3 } }).dataset.solo;
  SOLO = true; net = local;
  await net.init();
  const code = "SOLO";
  await net.createRoom(code, { name, house: "valcourt", hname: store.get("sn_hname") || "", joined: Date.now() });
  const pers = ["conquerant", "intrigant", "prudent"].sort(() => Math.random() - 0.5);
  const ais = {};
  ["morlanges", "ravenel", "aubrac"].slice(0, n).forEach((h, i) => { ais[`ia-${h}`] = { name: aiName(pers[i % 3]), house: h, ai: pers[i % 3] }; });
  await net.updateMeta(code, { ais });
  enterRoom(code);
  const tuto = $("#solo-tuto").checked;
  const wait = setInterval(() => { if (H.active && L.meta && L.meta.ais) { clearInterval(wait); hostStart({ tutorial: tuto, randomDraft: false, rounds: $("#solo-rounds").value }); } }, 100);
}
function aiName(p) { return { conquerant: "Le Conquérant", intrigant: "L'Intrigant", prudent: "Le Prudent" }[p] || "Ordinateur"; }
async function createGame() {
  const name = nameOk(); if (!name) return;
  $("#home-msg").textContent = "Fondation du royaume…";
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 10; i++) { code = Array.from({ length: 4 }, () => letters[Math.floor(Math.random() * letters.length)]).join(""); if (!(await net.roomExists(code))) break; }
  try { await net.createRoom(code, { name, house: "valcourt", hname: store.get("sn_hname") || "", joined: Date.now() }); enterRoom(code); }
  catch (e) { console.error(e); $("#home-msg").textContent = "Impossible de créer la partie (connexion ?)."; }
}
async function joinGame(code, silent = false) {
  if (!/^[A-Z]{4}$/.test(code)) { if (!silent) $("#home-msg").textContent = "Le code fait 4 lettres."; return; }
  const name = silent ? store.get("sn_name") : nameOk(); if (!name) return;
  const meta = await net.roomExists(code).catch(() => null);
  if (!meta) { if (!silent) $("#home-msg").textContent = "Aucune partie avec ce code."; return; }
  try { await net.joinRoom(code, { name, hname: store.get("sn_hname") || "", joined: Date.now() }); enterRoom(code); }
  catch (e) { console.error(e); if (!silent) $("#home-msg").textContent = "Impossible de rejoindre."; }
}
function enterRoom(code) {
  L.code = code; L.joinedAt = Date.now();
  if (!SOLO) { store.set("sn_room", code); history.replaceState(null, "", `${location.pathname}${new URLSearchParams(location.search).has("test") ? "?test" : ""}`); }
  L.unsub.forEach((u) => u());
  L.unsub = [
    net.listen(code, "meta", (m) => { L.meta = m || {}; onMeta(); }),
    net.listen(code, "members", (m) => { L.members = m || {}; onMembers(); }),
    net.listen(code, "state", (s) => { onState(s && s.json ? JSON.parse(s.json) : null); }),
    net.listen(code, `private/${net.uid}`, (p) => { L.priv = p; render(); }, true),
    net.listenInput(code, net.uid, (o) => { L.myInput = o || {}; }),
    net.listen(code, "taunts", (t) => onTaunts(t || {})),
    net.listenWhispers(code, net.uid, (w) => onWhispers(w)),
  ];
  renderLobby();
}

function renderLobby() {
  if (L.state && L.state.phase && L.state.phase !== "lobby") return;
  show("lobby");
  $("#lobby-code").textContent = L.code;
  const mine = L.members[net.uid] || {};
  const taken = [...Object.entries(L.members).filter(([u, m]) => u !== net.uid && m.online !== false).map(([, m]) => m.house), ...Object.values((L.meta && L.meta.ais) || {}).map((a) => a.house)];
  $("#house-pick").innerHTML = HUMAN_HOUSES.map((h) => `<button class="house-opt" data-h="${h}" aria-pressed="${mine.house === h}" ${taken.includes(h) ? "disabled" : ""}>${shield(h, 40)}${HOUSES[h].name}<small>${esc(HOUSES[h].motto)}</small></button>`).join("");
  $("#house-pick").querySelectorAll("button").forEach((b) => (b.onclick = () => { A.play("click"); net.updateMember(L.code, { house: b.dataset.h }); }));
  if (document.activeElement !== $("#lobby-hname")) $("#lobby-hname").value = mine.hname || "";
  $("#lobby-hname").onchange = () => { const v = E.cleanHouseName($("#lobby-hname").value) || ""; store.set("sn_hname", v); $("#lobby-hname").value = v; net.updateMember(L.code, { hname: v }); };
  const list = Object.entries(L.members).sort((a, b) => (a[1].joined || 0) - (b[1].joined || 0));
  const ais = (L.meta && L.meta.ais) || {};
  const isHost = L.meta && L.meta.host === net.uid;
  $("#lobby-members").innerHTML = list.map(([u, m]) => `<li>${m.house ? shield(m.house, 24) : ""}<span>${esc(m.name || "?")}${m.hname ? ` <i>· maison ${esc(m.hname)}</i>` : ""}</span><span class="tag">${u === (L.meta && L.meta.host) ? "hôte" : ""}${m.online === false ? " · hors ligne" : ""}</span></li>`).join("")
    + Object.entries(ais).map(([k, a]) => `<li>${shield(a.house, 24)}<span>${esc(a.name)}</span><span class="tag">ordinateur${isHost ? ` <button class="btn btn-small" data-rmai="${k}" style="min-height:30px">Retirer</button>` : ""}</span></li>`).join("");
  document.querySelectorAll("[data-rmai]").forEach((b) => (b.onclick = () => { const a = { ...ais }; delete a[b.dataset.rmai]; net.updateMeta(L.code, { ais: a }); }));
  $("#lobby-ai").classList.toggle("hidden", !isHost || list.filter(([, m]) => m.online !== false).length + Object.keys(ais).length >= 4);
  $("#btn-add-ai").onclick = () => {
    const usedH = new Set([...Object.values(L.members).map((m) => m.house), ...Object.values(ais).map((a) => a.house)]);
    const h = HUMAN_HOUSES.find((x) => !usedH.has(x)); if (!h) return;
    const usedP = Object.values(ais).map((a) => a.ai);
    const pers = ["conquerant", "intrigant", "prudent"].find((x) => !usedP.includes(x)) || "intrigant";
    net.updateMeta(L.code, { ais: { ...ais, [`ia-${h}`]: { name: aiName(pers), house: h, ai: pers } } });
  };
  $("#lobby-host").classList.toggle("hidden", !isHost);
  $("#lobby-wait").classList.toggle("hidden", isHost);
  const n = list.filter(([, m]) => m.online !== false).length + Object.keys(ais).length;
  $("#btn-start").disabled = n < 2;
  const fill = $("#opt-fill").checked;
  $("#btn-start").textContent = n < 2 && !fill ? "Il faut au moins 2 joueurs" : `Lancer la partie à ${fill ? 4 : Math.min(n, 4)}`;
  $("#btn-start").disabled = n < 2 && !fill;
  $("#opt-fill").onchange = () => renderLobby();
}
$("#btn-share").onclick = async () => {
  const url = `${location.origin}${location.pathname}?r=${L.code}`;
  try { if (navigator.share && /Android|iPhone|iPad/i.test(navigator.userAgent)) await navigator.share({ title: "Le Siècle Noir", text: `Rejoins ma partie du Siècle Noir (code ${L.code})`, url }); else { await navigator.clipboard.writeText(url); toast("Lien copié. Envoie-le à tes amis."); } }
  catch { prompt("Copie ce lien :", url); }
};
$("#btn-start").onclick = () => { A.unlock(); hostStart({ tutorial: $("#opt-tuto").checked, randomDraft: $("#opt-random").checked, timer: $("#opt-timer").value, fill: $("#opt-fill").checked, rounds: $("#opt-rounds").value }); };

// ---------------------------------------------------------------------
// réception des données
// ---------------------------------------------------------------------
function onMeta() {
  if (!L.state || L.state.phase === "lobby") renderLobby();
  if (L.meta && L.meta.host === net.uid && !H.active) becomeHost();
  if (L.meta && L.meta.host !== net.uid && H.active) stopHost();
  render();
}
function onMembers() {
  if (H.active) syncInputListeners();
  if (!L.state || L.state.phase === "lobby") renderLobby(); else render();
}
function onTaunts(t) {
  for (const [k, v] of Object.entries(t)) {
    if (L.taunts[k]) continue;
    L.taunts[k] = v;
    if (v.t && v.t > net.now() - 8000 && v.t > L.joinedAt - 2000) {
      const pid = v.pid;
      toast(`<b style="color:${houseColor(pid) === "#2B1D12" ? "#D9A441" : "#D9A441"}">${esc(houseName(pid))}</b> : « ${esc(v.text)} »`, houseColor(pid), 4500);
      A.play("taunt");
    }
  }
}
// ---- messages privés ----
L.whispers = {}; L.unread = 0;
function onWhispers(w) {
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

function seatUidsOf(pid) { const st = S(); return Object.entries(st.seats || {}).filter(([, v]) => v === pid).map(([u]) => u); }
function sendWhisper(to, text) {
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
function renderMessages() { renderDiplo(); }
function renderDiplo() {
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
function updateMsgBadge() {
  const st = S(), pid = me();
  const b = $("#tab-diplo-btn");
  if (!b || !st) return;
  const props = pid ? Object.entries(st.proposals || {}).filter(([k, pr]) => pr.to === pid && (L.ui.answers[k] ?? (L.myInput.answers || {})[k]) === undefined).length : 0;
  const n = props + (L.unread || 0);
  b.innerHTML = `Diplomatie${n ? `<span class="badge">${n}</span>` : ""}`;
}
function onState(st) {
  const prev = L.state;
  L.state = st;
  if (!st || st.phase === "lobby") { L.ui = resetUi(); L.endClosed = false; renderLobby(); return; }
  show("game");
  if (!L.mapBuilt) buildMap();
  const pid = me();
  // transitions
  if (st.round !== L.last.round) {
    L.ui.orders = []; L.ui.build = null; L.ui.dChoice = null; L.ui.dTarget = null; L.ui.proposeTo = []; L.ui.answers = {};
    L.dilemmaClosed = false;
    if (st.round > 0) { A.play("bell"); rollDiceAnim = true; }
    if (st.round === st.maxRounds) { A.play("drum"); tuto("round10", "Le Couronnement", "Dernière manche ! Chaque conquête rapporte 3 Prestige et les scores sont cachés jusqu'à la fin."); }
  }
  // fenêtres « Nouveau » de la première partie : au moment des ordres, quand on a le temps de lire
  if (st.tutorial && me() && st.phase === "orders") for (const [k, r] of Object.entries(E.UNLOCK)) if (st.round === r && !store.get(`sn_unl_${st.gameId}_${k}`)) { store.set(`sn_unl_${st.gameId}_${k}`, "1"); queueModal("unlock", k); }
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
  if (st.phase === "placement" && me() && st.families && st.families[me()] && !store.get(`sn_fam_${st.gameId}`)) { store.set(`sn_fam_${st.gameId}`, "1"); setTimeout(() => queueModal("family", 0), 2400); }
  if (prev && prev.leader !== st.leader && st.leader && st.round > 1 && st.round < st.maxRounds && ["dilemma", "interlude"].includes(st.phase)) {
    setTimeout(() => { toast(`${ICON.prestige}<b>La couronne passe à ${esc(houseName(st.leader))}</b>${st.leader === me() ? " : c'est toi ! Tout le monde va vouloir te faire tomber." : ". Battre ses armées rapporte 2 Prestige."}`, "#D9A441", 6000); A.play("horn"); }, 2400);
  }
  L.last.round = st.round; L.last.phase = st.phase;
  render();
}
let rollDiceAnim = false;
// ---- écrans d'annonce animés ----
function splash(st) {
  if (!L.lastSplash) L.lastSplash = "";
  const key = st.phase + st.round;
  if (L.lastSplash === key) return;
  L.lastSplash = key;
  const N = st.round;
  const D = {
    objectives: ["PRÉPARATIFS", "Tes ambitions", "Choisis 2 objectifs secrets. Personne d'autre ne les connaît."],
    draft: ["PRÉPARATIFS", "Le partage de la France", "Chacun choisit 3 provinces à tour de rôle (la première sera ta capitale). Le reste du royaume est ensuite partagé autour de vos terres."],
    placement: ["PRÉPARATIFS", "Aux armes", "Répartis tes 12 armées sur tes provinces."],
    dilemma: [`MANCHE ${N} SUR ${st.maxRounds}${N === st.maxRounds ? " · LE COURONNEMENT" : ""}`, "Les dilemmes", "Deux décisions secrètes : une affaire de ta maison, une affaire avec un rival. Négociez à voix haute si vous osez."],
    orders: [`MANCHE ${N} · ÉTAPE 2`, "Les ordres", "Un ordre par dé. Bluffez, promettez, trahissez : tout se révèle en même temps."],
    interlude: [`FIN DE LA MANCHE ${N}`, `An ${E.yearOf(N)}`, "Trois années ont passé."],
    end: ["FIN DE LA PARTIE", "Le Couronnement", ""],
  };
  if (st.phase === "reveal") return countdown(st);
  const d = D[st.phase]; if (!d) return;
  document.querySelectorAll(".splash").forEach((x) => x.remove());
  const el = document.createElement("div");
  el.className = "splash";
  el.innerHTML = `<div class="sp-card"><div class="sp-kick">${d[0]}</div><div class="sp-title">${d[1]}</div>${d[2] ? `<div class="sp-sub">${d[2]}</div>` : ""}</div>`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2300);
}
function countdown(st) {
  document.querySelectorAll(".splash").forEach((x) => x.remove());
  const el = document.createElement("div");
  el.className = "splash"; el.style.animationDuration = "2.6s";
  el.innerHTML = `<div class="sp-card" style="animation-duration:2.6s"><div class="sp-kick">LES SCEAUX SE BRISENT</div><div class="sp-count">3</div><div class="sp-sub">Révélation des choix de chacun…</div></div>`;
  document.body.appendChild(el);
  const c = el.querySelector(".sp-count");
  A.play("drum");
  setTimeout(() => { c.textContent = "2"; c.style.animation = "none"; void c.offsetWidth; c.style.animation = ""; }, 800);
  setTimeout(() => { c.textContent = "1"; c.style.animation = "none"; void c.offsetWidth; c.style.animation = ""; }, 1600);
  setTimeout(() => el.remove(), 2600);
}
// ---- narrateur vocal (optionnel) ----
let narrator = store.get("sn_narrator") === "1";
function speak(text) {
  if (!narrator || !window.speechSynthesis) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/[«»]/g, ""));
    u.lang = "fr-FR"; u.rate = 1.05;
    const v = speechSynthesis.getVoices().find((x) => /^fr/i.test(x.lang));
    if (v) u.voice = v;
    speechSynthesis.speak(u);
  } catch {}
}
function playNewsSounds(st) {
  const kinds = new Set((st.news || []).map((n) => n.kind));
  if (kinds.has("death")) setTimeout(() => A.play("knell"), 400);
  else if (kinds.has("plague")) setTimeout(() => A.play("plague"), 400);
  else if (kinds.has("birth")) setTimeout(() => A.play("birth"), 400);
  const pid = me();
  if (pid && (st.news || []).some((n) => n.kind === "death" && n.pid === pid)) A.vibrate([200, 100, 200]);
}
function restoreOrders() {
  const o = L.myInput.orders;
  if (o && o.round === S().round && !L.ui.orders.length) L.ui.orders = o.actions || [];
}

// ---------------------------------------------------------------------
// CARTE
// ---------------------------------------------------------------------
const MAP = { sel: new Set(), hl: new Set(), hlRed: new Set(), onPick: null, display: null, badges: [] };
function buildMap() {
  const svg = $("#map");
  let h = `<defs>
    <pattern id="spots" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="2.4" fill="#140E09"/><circle cx="11" cy="10" r="1.5" fill="#140E09"/></pattern>
    <marker id="ah-red" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#8E1B1B"/></marker>
    <marker id="ah-ink" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#2B1D12"/></marker>
  </defs><rect width="840" height="780" fill="#E4D5B3"/>`;
  for (let y = 40; y < 780; y += 46) for (let x = 20; x < 840; x += 120) { const xx = x + ((y / 46) % 2) * 60; h += `<path d="M${xx},${y} q8,-6 16,0 t16,0" fill="none" stroke="#8C7B5A" stroke-width="1" opacity="0.45"/>`; }
  h += `<g id="m-provs">`;
  for (const [id, p] of Object.entries(PROVINCES)) h += `<path d="${p.d}" fill="#EFE3C8"/><path class="prov" id="p-${id}" data-id="${id}" d="${p.d}" fill="#D9C9A3"/>`;
  h += `</g><g id="m-plague"></g><g id="m-hl"></g><g id="m-arrows"></g><g id="m-labels">`;
  for (const [id, p] of Object.entries(PROVINCES)) h += `<text class="plabel" x="${p.cx}" y="${p.cy - 16}" text-anchor="middle">${esc(p.name.toUpperCase())}</text>`;
  h += `</g><g id="m-caps"></g><g id="m-banners">`;
  for (const [id, p] of Object.entries(PROVINCES)) h += `<g class="banner-g" id="b-${id}" transform="translate(${p.cx},${p.cy - 6})"><path d="M-13,0 L13,0 L13,23 L0,17 L-13,23 Z" stroke="#2B1D12" stroke-width="1.2" fill="#5A4A36"/><text x="0" y="15" text-anchor="middle">0</text></g>`;
  h += `</g><g id="m-badges"></g><g id="m-fx"></g>`;
  h += `<g transform="translate(92,690)" aria-hidden="true"><circle r="30" fill="none" stroke="#2B1D12" stroke-width="1.2"/><path d="M0,-38 L6,0 L0,38 L-6,0 Z" fill="#2B1D12"/><path d="M-38,0 L0,5 L38,0 L0,-5 Z" fill="#2B1D12" opacity="0.6"/><text y="-44" text-anchor="middle" font-family="Cinzel" font-size="12" fill="#2B1D12">N</text></g>`;
  svg.innerHTML = h;
  svg.addEventListener("click", (e) => {
    const t = e.target.closest(".prov, .banner-g");
    if (!t) { hidePopover(); return; }
    const id = t.dataset.id || t.id.replace(/^b-/, "");
    if (L.justPanned && Date.now() - L.justPanned < 300) return;
    if (MAP.sel.has(id) && MAP.onPick) { hidePopover(); A.play("click"); MAP.onPick(id); }
    else if (S() && S().phase !== "lobby") showPopover(provinceCard(id), e.clientX, e.clientY);
  });
  // un clic sur la bannière compte comme un clic sur la province
  svg.querySelectorAll(".banner-g").forEach((g) => (g.style.pointerEvents = "auto"));
  L.mapBuilt = true;
}
function provFill(owner) {
  if (!owner) return ["#D9C9A3", 1];
  const p = S().players[owner];
  return [p ? HOUSES[p.house].color : "#5A4A36", 0.5];
}
function updateMap(provs) {
  if (!L.mapBuilt || !provs) return;
  const st = S();
  for (const [id, p] of Object.entries(provs)) {
    const el = document.getElementById(`p-${id}`);
    const [f, o] = provFill(p.owner);
    el.setAttribute("fill", f); el.setAttribute("fill-opacity", o);
    el.classList.toggle("sel", MAP.sel.has(id));
    const b = document.getElementById(`b-${id}`);
    const bp = b.querySelector("path"), bt = b.querySelector("text");
    bp.setAttribute("fill", p.owner ? houseColor(p.owner) : "#5A4A36");
    if (bt.textContent !== String(p.armies)) { bt.textContent = p.armies; b.classList.remove("army-pop"); void b.getBBox; b.classList.add("army-pop"); }
  }
  $("#m-plague").innerHTML = Object.entries(provs).filter(([, p]) => p.plague > 0).map(([id]) => `<path d="${PROVINCES[id].d}" fill="url(#spots)" opacity="0.55" pointer-events="none"/>`).join("");
  $("#m-hl").innerHTML = [...MAP.hl].map((id) => `<path class="prov-hl" d="${PROVINCES[id].d}"/>`).join("") + [...MAP.hlRed].map((id) => `<path class="prov-hl red" d="${PROVINCES[id].d}"/>`).join("");
  // capitales et couronne du favori
  let caps = "";
  for (const pid of st.order) {
    const c = st.players[pid].capital;
    if (!c || !provs[c] || provs[c].owner !== pid) continue;
    const P = PROVINCES[c];
    caps += capMark(P.cx - 36, P.cy + 5, houseColor(pid), 15) + `<text class="caplabel" x="${P.cx}" y="${P.cy + 31}" text-anchor="middle" pointer-events="none">${esc(P.city)}</text>`;
    if (st.leader === pid && st.round < st.maxRounds) caps += `<g transform="translate(${P.cx},${P.cy - 40})" pointer-events="none"><path d="M-11,6 L-11,-4 L-5,1 L0,-7 L5,1 L11,-4 L11,6 Z" fill="#D9A441" stroke="#2B1D12" stroke-width="1.2"/></g>`;
  }
  $("#m-caps").innerHTML = caps;
  $("#m-badges").innerHTML = MAP.badges.map((b) => { const P = PROVINCES[b.prov]; return `<g class="pct-badge" transform="translate(${P.cx},${P.cy + 34})" pointer-events="none"><rect x="-26" y="-12" width="52" height="22" rx="11" fill="${b.color}" stroke="#F6ECD6" stroke-width="2"/><text x="0" y="4" text-anchor="middle" fill="#F6ECD6">${b.text}</text></g>`; }).join("");
}
// médaillon de capitale : château blanc sur la couleur de la maison, cerclé d'or
function capMark(x, y, color, r = 14) {
  return `<g class="capmark" transform="translate(${x},${y})" pointer-events="none"><circle r="${r + 3}" fill="#2B1D12"/><circle r="${r + 1.5}" fill="#D9A441"/><circle r="${r - 1}" fill="${color}" stroke="#2B1D12" stroke-width="1"/><path transform="scale(${r / 14})" d="M-8,7 V-3 h2.6 v-3 h2.6 v3 h1.5 V-8 h2.6 v2.4 h2.6 V-3 h1.5 v-3 h2.6 v3 h0 V7 h-6 v-4 a2,2 0 0 0 -4,0 v4 Z" fill="#F6ECD6" stroke="#2B1D12" stroke-width="0.8"/></g>`;
}
function drawArrows(list) {
  // list: [{from, to, color, dashed}]
  $("#m-arrows").innerHTML = list.map((a) => {
    const f = PROVINCES[a.from], t = PROVINCES[a.to];
    const mx = (f.cx + t.cx) / 2 + (t.cy - f.cy) * 0.15, my = (f.cy + t.cy) / 2 - (t.cx - f.cx) * 0.15;
    return `<path class="order-arrow" d="M${f.cx},${f.cy} Q${mx},${my} ${t.cx},${t.cy}" stroke="${a.color}" ${a.dashed ? 'stroke-dasharray="6 6"' : ""} marker-end="url(#${a.color === "#2B1D12" ? "ah-ink" : "ah-red"})" opacity="0.9"/>`;
  }).join("");
}
function fx(kind, prov, color) {
  const P = PROVINCES[prov]; if (!P) return;
  const g = $("#m-fx");
  let el = "";
  if (kind === "conquest") el = `<g pointer-events="none"><clipPath id="clip-${prov}-${Date.now()}"><path d="${P.d}"/></clipPath><circle class="ink-spread" cx="${P.cx}" cy="${P.cy}" r="0" fill="${color}" clip-path="url(#clip-${prov}-${Date.now()})"/><g class="stamp" transform="translate(${P.cx},${P.cy + 22})"><circle r="16" fill="#8E1B1B" stroke="#5E0F0F" stroke-width="3"/><circle r="10" fill="none" stroke="#F6ECD6" stroke-width="1.5" opacity=".7"/></g></g>`;
  if (kind === "battle") el = `<g class="clash fade-out" transform="translate(${P.cx},${P.cy + 22})" pointer-events="none"><path d="M-14,-14 L14,14 M14,-14 L-14,14" stroke="#1A120C" stroke-width="5" stroke-linecap="round"/><path d="M-14,-14 L14,14 M14,-14 L-14,14" stroke="#E9DCBD" stroke-width="2" stroke-linecap="round"/></g>`;
  if (kind === "death") el = `<g class="stamp fade-out" transform="translate(${P.cx},${P.cy + 22})" pointer-events="none"><path d="M-3,-16 h6 v10 h10 v6 h-10 v18 h-6 v-18 h-10 v-6 h10 Z" fill="#1A120C"/></g>`;
  const wrap = document.createElementNS("http://www.w3.org/2000/svg", "g");
  wrap.innerHTML = el;
  g.appendChild(wrap);
  setTimeout(() => wrap.remove(), 2200);
}

// ---------------------------------------------------------------------
// RENDU PRINCIPAL
// ---------------------------------------------------------------------
function render() {
  const st = S();
  if (!st || st.phase === "lobby") return;
  renderTop(); renderPlayers(); renderGuide();
  MAP.sel = new Set(); MAP.hl = new Set(); MAP.hlRed = new Set(); MAP.onPick = null; MAP.badges = [];
  let arrows = [];
  const panel = renderPanel();
  $("#tab-panel").innerHTML = panel.html;
  if (panel.bind) panel.bind();
  if (panel.arrows) arrows = panel.arrows;
  renderHouseTab(); renderLog();
  renderDiplo();
  if (L.ui.tab === "diplo") L.unread = 0;
  updateMsgBadge();
  // carte : pendant la révélation, on montre l'état « avant » puis on applique les étapes
  if (st.phase === "reveal") { const f = rvFocus(st); MAP.hl = new Set(f.hl); MAP.hlRed = new Set(f.red); MAP.badges = f.badges; updateMap(revealProvinces()); drawArrows(f.arrows); }
  else { updateMap(st.provinces); drawArrows(arrows); }
  $("#crown-banner").classList.toggle("hidden", !(st.round === st.maxRounds && ["dilemma", "orders"].includes(st.phase)));
  renderOverlays();
  document.querySelectorAll("#side-tabs button").forEach((b) => b.classList.toggle("active", b.dataset.tab === L.ui.tab));
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.id === `tab-${L.ui.tab}`));
  phaseTutos();
  applyCoach();
}
// ---- mes jauges, toujours visibles, avec leur explication au toucher ----
function hudRes() {
  const st = S(), pid = me();
  if (!pid || !st.players[pid] || st.round < 1) return "";
  const p = st.players[pid];
  const c = (v) => (v >= 80 ? "bad" : v >= 60 ? "warn" : "");
  return `<span class="hud-res"><button type="button" class="term" data-term="prestige" title="Prestige : tes points de victoire">${ICON.prestige}${p.prestige}</button><button type="button" class="term" data-term="or" title="Or : mercenaires, intrigues, cadeaux">${ICON.gold}${p.gold}</button><button type="button" class="term ${c(p.colere)}" data-term="colere" title="Colère du peuple : à 80, une province se révolte">${ICON.colere}${p.colere}</button><button type="button" class="term" data-term="peur" title="Peur : +1 en défense tous les 25 points">${ICON.peur}${p.peur}</button></span>`;
}
// ---- bandeau « que dois-je faire ? » ----
function renderGuide() {
  const st = S(), pid = me(), el = $("#guide");
  if (!el) return;
  let step = "", text = "", btn = "", mine = false;
  let stage = -1, prepStage = -1;
  const prep = (n, label) => { prepStage = n - 1; return label; };
  const round = (n, label) => { stage = n - 1; return label; };
  if (!pid) { step = "SPECTATEUR"; text = "Tu regardes la partie."; }
  else switch (st.phase) {
    case "objectives": {
      const done = (L.myInput.objPick || []).length === 2;
      step = prep(1, "OBJECTIFS SECRETS");
      text = done ? "Tes objectifs sont choisis. On attend les autres seigneurs…" : "<b>À toi :</b> choisis 2 objectifs secrets parmi les 3 proposés, puis valide.";
      if (!done) { btn = `<button class="btn btn-red" data-guide="obj">Choisir mes objectifs</button>`; mine = true; }
      break;
    }
    case "draft": {
      const cur = E.currentDrafter(st);
      step = prep(2, "CHOIX DES PROVINCES");
      if (cur === pid) {
        mine = true;
        if (L.ui.draftSel) { text = `<b>À toi :</b> tu as sélectionné <b>${esc(PROVINCES[L.ui.draftSel.prov].name)}</b>. Confirme, ou clique une autre province pour changer.`; btn = `<button class="btn btn-red" data-guide="draftok">Confirmer</button>`; }
        else text = st.players[pid].capital ? "<b>À toi :</b> clique sur une province libre de la carte (encadrée en jaune). Prends-la à côté des tiennes." : "<b>À toi :</b> clique sur une province libre de la carte (encadrée en jaune). Ce sera ta <b>capitale</b>.";
      }
      else text = `${esc(st.players[cur]?.name || "")} (${esc(houseName(cur))}) choisit une province… Attends ton tour.`;
      break;
    }
    case "placement": {
      const sent = L.myInput.placement && L.myInput.placement.ok;
      step = prep(3, "PLACEMENT DES ARMÉES");
      if (sent) text = "Placement validé. On attend les autres…";
      else {
        const mineP = E.provincesOf(st, pid);
        const used = mineP.reduce((s2, id) => s2 + ((L.ui.placement || {})[id] || 1), 0);
        text = `<b>À toi :</b> clique sur tes provinces pour y ajouter des armées (il en reste <b>${E.START_ARMIES - used}</b>), puis valide. Ou laisse le jeu les placer.`;
        btn = `<button class="btn" data-guide="plauto">Placement auto</button><button class="btn btn-red" data-guide="plok">Valider</button>`; mine = true;
      }
      break;
    }
    case "dilemma": {
      const n = dilSlots().length, left = dilLeft();
      step = round(1, "LES DILEMMES");
      if (!n) text = "Pas de dilemme pour toi cette manche. On attend les autres…";
      else if (!left) text = "Tes choix sont scellés. Pendant que les autres décident, négociez à voix haute ou dans l'onglet Diplomatie (mariages, trêves, or).";
      else { text = `<b>À toi :</b> ${n > 1 ? `2 décisions secrètes : ton affaire privée, puis une affaire avec un rival. Il en reste ${left}.` : "une décision secrète t'attend."} Choisis une option et scelle-la.`; btn = `<button class="btn btn-red" data-guide="dil">${left < n ? "Affaire suivante" : "Ouvrir"}</button>`; mine = true; }
      break;
    }
    case "orders": {
      const sealed = L.myInput.orders && L.myInput.orders.round === st.round && L.myInput.orders.sealed;
      step = round(2, "LES ORDRES");
      if (sealed) text = "Ordres scellés. On attend les autres… (tu peux encore les modifier dans le panneau Actions)";
      else {
        const dv = myDice().filter((v) => v).length, n = L.ui.orders.length;
        text = L.ui.build ? `<b>À toi :</b> suis les étapes dans le panneau Actions (dé ${myDice()[L.ui.build.die]}).` : n < dv ? `<b>À toi :</b> clique un dé dans le panneau Actions et choisis son ordre. Ordres donnés : <b>${n} sur ${dv}</b>.` : `<b>À toi :</b> tous tes dés ont un ordre. Vérifie, puis scelle tes ordres.`;
        btn = `<button class="btn" data-guide="actions">Voir mes dés</button><button class="btn btn-red" data-guide="seal">Sceller mes ordres</button>`; mine = true;
      }
      break;
    }
    case "reveal": {
      step = round(3, "RÉVÉLATION");
      const sent = L.myInput.revdone && L.myInput.revdone.round === st.round;
      text = sent ? "Tu as tout vu. On attend que les autres finissent leur révélation…" : "<b>À toi :</b> regarde la carte, lis le récit dans le panneau, puis clique <b>« Suivant »</b>. Chacun avance à son rythme. À la fin : « J'ai tout vu ».";
      break;
    }
    case "interlude": step = `FIN DE LA MANCHE ${st.round}`; text = "Trois années passent… La chronique raconte ce qui s'est passé."; break;
    case "end": step = "FIN DE LA PARTIE"; text = "La partie est terminée."; btn = `<button class="btn btn-red" data-guide="end">Voir les résultats</button>`; break;
  }
  const waiting = !mine && ["objectives", "draft", "placement", "dilemma", "orders"].includes(st.phase);
  if (waiting && H.active && !st.solo && (st.timer === "none" || !st.timer)) btn += `<button class="btn btn-small" data-guide="force" title="Passer à la suite sans attendre les retardataires">Forcer la suite</button>`;
  L.hudScore = "";
  if (pid && st.round > 0) {
    const est = E.estimateScore(st, { [pid]: L.priv || {} }, pid);
    const hide = st.round === st.maxRounds && st.phase !== "end";
    const all = st.order.map((p) => ({ p, v: p === pid ? est.total : E.estimateScore(st, {}, p).total })).sort((a, b) => b.v - a.v);
    const rank = all.findIndex((x) => x.p === pid) + 1;
    L.hudScore = `<button class="g-score" data-guide="score" title="Comment est calculé le score">${ICON.prestige}${hide ? `${est.total} pts` : `<b>${rank}${rank === 1 ? "er" : "e"}</b> sur ${st.order.length} · ${est.total} pts`}</button>`;
  }
  el.className = `guide ${mine ? "" : "wait"}`;
  const key = step + text + btn;
  if (el.dataset.k !== key) {
    el.dataset.k = key;
    const track = st.round > 0 ? `<div class="hud-track" title="Les ${st.maxRounds} manches">${Array.from({ length: st.maxRounds }, (_, i) => `<span class="${i + 1 < st.round ? "past" : i + 1 === st.round ? "now" : ""} ${i + 1 === st.maxRounds ? "last" : ""}">${i + 1 === st.maxRounds ? "♛" : i + 1}</span>`).join("")}</div>` : `<div class="hud-track prep"><span class="now">Préparatifs</span></div>`;
    const stages = st.round > 0 ? ["Dilemmes", "Ordres", "Révélation"] : ["Objectifs", "Provinces", "Armées"];
    const cur = st.round > 0 ? stage : prepStage;
    const stepper = `<div class="hud-steps">${stages.map((n, i) => `<span class="${i < cur ? "done" : i === cur ? "cur" : ""}">${i + 1}. ${n}</span>`).join('<i>›</i>')}</div>`;
    el.innerHTML = `<div class="hud-left">${track}${stepper}</div><div class="hud-main"><span class="g-text">${text}</span><span class="hud-btns">${btn}</span></div><div class="hud-right">${L.hudScore || ""}${hudRes()}<span class="hud-goal">But : avoir le plus de points après ${st.maxRounds} manches</span></div>`;
    if (mine && el.dataset.last !== st.phase + st.round) { el.dataset.last = st.phase + st.round; el.classList.add("mine"); }
  }
  el.querySelectorAll("[data-guide]").forEach((b) => (b.onclick = () => {
    const g = b.dataset.guide;
    if (g === "obj") { L.objClosed = false; render(); }
    if (g === "dil") { L.ui.dSlot = null; L.ui.dChoice = null; L.ui.dTarget = null; L.dilemmaClosed = false; L.ovKey = ""; render(); }
    if (g === "end") { L.endClosed = false; render(); }
    if (g === "plauto") { setInput("placement", { ok: true }); A.play("seal"); render(); }
    if (g === "plok") { const mineP = E.provincesOf(st, pid); const alloc = { ok: true }; mineP.forEach((id) => (alloc[id] = (L.ui.placement || {})[id] || 1)); setInput("placement", alloc); A.play("seal"); render(); }
    if (g === "actions") { L.ui.tab = "panel"; render(); document.querySelector(".side").scrollIntoView({ behavior: "smooth" }); }
    if (g === "seal") { L.ui.build = null; saveOrders(true); A.play("seal"); render(); }
    if (g === "draftok") confirmDraft();
    if (g === "next") { setInput("next", { round: st.round }); A.play("click"); L.ovKey = ""; render(); }
    if (g === "force") { H.force = true; toast("La partie avance sans attendre les retardataires (leur intendant choisit pour eux).", "#D9A441"); }
    if (g === "score") openModal("score");
  }));
}
const PHASE_LABEL = { objectives: "Objectifs secrets", draft: "Choix des provinces", placement: "Placement des armées", dilemma: "Les dilemmes", orders: "Ordres secrets", reveal: "Révélation", interlude: "Chronique", end: "Fin de partie" };
function renderTop() {
  const st = S();
  $("#tb-round").innerHTML = st.round > 0 ? `<span class="long">ANNO DOMINI ${E.yearOf(st.round)} · MANCHE ${st.round} SUR ${st.maxRounds}</span><span class="short">${E.yearOf(st.round)} · ${st.round}/${st.maxRounds}</span>` : `<span class="long">ANNO DOMINI 1347 · PRÉPARATIFS</span><span class="short">1347</span>`;
  $("#tb-phase").textContent = PHASE_LABEL[st.phase] || "";
  $("#btn-mute").innerHTML = A.isMuted()
    ? '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" stroke-width="2"/></svg>'
    : '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
}
function renderPlayers() {
  const st = S();
  const hide = st.round === st.maxRounds && st.phase !== "end";
  const meP = me();
  const pub = (pid) => E.estimateScore(st, {}, pid).total;
  const order = st.round > 0 && !hide ? st.order.slice().sort((a, b) => pub(b) - pub(a)) : st.order;
  const top = Math.max(1, ...st.order.map(pub));
  $("#playersbar").innerHTML = order.map((pid, rank) => {
    const p = st.players[pid];
    const seatUids = Object.entries(st.seats || {}).filter(([, v]) => v === pid).map(([u]) => u);
    const online = p.isBot || seatUids.some((u) => L.members[u] && L.members[u].online !== false);
    const ready = st.ready && st.ready[pid];
    const nprov = E.provincesOf(st, pid).length;
    const dice = pid === meP ? myDice() : p.dice || [];
    const showDice = ["dilemma", "orders"].includes(st.phase) && dice.length;
    const rel = meP && pid !== meP ? (E.allied(st, meP, pid) ? '<span class="rel">ALLIÉ</span>' : E.bound(st, meP, pid) ? '<span class="rel treaty">TRÊVE</span>' : "") : "";
    return `<button class="pchip ${pid === meP ? "me" : ""}" data-pid="${pid}" aria-label="Voir la maison ${esc(houseName(pid))}">
      ${st.leader === pid && !hide ? '<svg class="crown" width="22" height="14" viewBox="-12 -8 24 15" aria-hidden="true"><path d="M-11,6 L-11,-4 L-5,1 L0,-7 L5,1 L11,-4 L11,6 Z" fill="#D9A441" stroke="#2B1D12" stroke-width="1.2"/></svg>' : ""}
      ${st.round > 0 && !hide ? `<span class="rankno">${rank + 1}</span>` : ""}${shield(p.house, 26)}
      <span><span class="pc-name">${pid === meP ? "Toi · " : ""}${esc(houseName(pid))}${p.isBot ? " · ordi" : ""}${rel}</span>
      <span class="pc-stats">${H_ICON.prestige}${hide ? "?" : p.prestige} ${H_ICON.province}${nprov}${showDice ? `<span class="minidice">${dice.map((v) => (v ? `<span>${v}</span>` : '<span class="q">?</span>')).join("")}</span>` : ""}${!online ? ' <span class="off">absent</span>' : ""}${ready && ["objectives", "placement", "dilemma", "orders", "reveal", "interlude"].includes(st.phase) ? ` <span class="ready">${st.phase === "reveal" ? "a tout vu ✓" : "prêt ✓"}</span>` : ""}</span>${st.round > 0 && !hide ? `<span class="racebar" title="Score estimé (sans les objectifs secrets) : ${pub(pid)}"><div style="width:${Math.max(4, (pub(pid) / top) * 100)}%;background:${HOUSES[p.house].color}"></div></span>` : ""}</span>
    </button>`;
  }).join("");
  $("#playersbar").querySelectorAll(".pchip").forEach((b) => (b.onclick = () => { L.ui.viewHouse = b.dataset.pid; openModal("house"); }));
}
// ---------------------------------------------------------------------
// PANNEAU PAR PHASE
// ---------------------------------------------------------------------
function renderPanel() {
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
function spectatorClaimHtml() {
  const st = S();
  const free = st.order.filter((pid) => !st.players[pid].isBot && !Object.entries(st.seats || {}).some(([u, v]) => v === pid && L.members[u] && L.members[u].online !== false));
  if (!free.length) return "";
  return `<br><br>Une place est libre : tu peux reprendre celle d'un joueur qui a changé d'appareil.</p><div class="row wrap">${free.map((pid) => `<button class="btn btn-small" data-claim="${pid}">Reprendre ${esc(st.players[pid].name)} (${esc(houseName(pid))})</button>`).join("")}</div><p>`;
}
function bindClaim() { document.querySelectorAll("[data-claim]").forEach((b) => (b.onclick = () => net.updateMember(L.code, { claim: b.dataset.claim }))); }

function panelObjectives() {
  const done = L.myInput.objPick && L.myInput.objPick.length === 2;
  return { html: `<p class="ph">Objectifs secrets</p><p class="ptext">${done ? "Tes objectifs sont choisis. On attend les autres seigneurs." : "Choisis 2 objectifs secrets parmi les 3 proposés."}</p><button class="btn btn-block" id="btn-obj">${done ? "Revoir mes objectifs" : "Choisir mes objectifs"}</button>`, bind: () => ($("#btn-obj").onclick = () => { L.objClosed = false; render(); }) };
}
function confirmDraft() {
  const st = S(); const d = L.ui.draftSel;
  if (!d || d.idx !== st.draft.idx) return;
  setInput("draftPick", d); A.play("seal"); toast(`Tu prends ${esc(PROVINCES[d.prov].art)}.`, "#6B5638", 2500); L.ui.draftSel = null; render();
}
function panelDraft() {
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
    ${sel ? `<div class="recap"><p class="ph">Ton choix : ${esc(PROVINCES[sel].name)}</p><p class="ptext" style="font-size:15px">${first ? "Ce sera ta <b>capitale</b>. " : ""}Région ${esc(REGIONS[PROVINCES[sel].region].name)} · voisines : ${PROVINCES[sel].adj.map((a) => esc(PROVINCES[a].name)).join(", ")}.</p><button class="btn btn-red btn-block" id="draft-ok">Confirmer ${esc(PROVINCES[sel].art)}</button><p class="hint">Tu peux encore cliquer une autre province sur la carte pour changer.</p></div>` : ""}
    <div class="draft-order">${seq}</div>
    ${regionsHelp()}`, bind: () => { if ($("#draft-ok")) $("#draft-ok").onclick = confirmDraft; } };
}
function regionsHelp() {
  return `<div class="pbox"><p class="ph">Régions (bonus par manche)</p>${Object.values(REGIONS).map((r) => `<div style="font-size:14px;margin-bottom:4px"><b style="font-family:var(--caps);font-size:12px">${r.name}</b> : ${r.provs.map((p) => PROVINCES[p].name).join(", ")} <i>(+${r.provs.length - 1} armées, +1 prestige)</i></div>`).join("")}</div>`;
}
function panelPlacement() {
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
// ---- ragots de taverne : les mêmes pour tout le monde, tirés de la situation réelle ----
function seeded(str) { let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; }; }
function ragots() {
  const st = S();
  if (!st || st.round < 1) return [];
  const rng = seeded(`${st.gameId}:${st.round}`);
  const ps = st.order.filter((p) => st.players[p] && !st.players[p].exiled);
  const hn = (p) => E.maisonName(st, p);
  const by = (f) => ps.slice().sort((a, b) => f(b) - f(a));
  const out = [];
  const add = (cond, t) => { if (cond) out.push(t); };
  const rich = by((p) => st.players[p].gold)[0], poor = by((p) => -st.players[p].gold)[0];
  const angry = by((p) => st.players[p].colere)[0], scary = by((p) => st.players[p].peur)[0];
  const sc = (p) => E.estimateScore(st, {}, p).total;
  const first = by(sc)[0], last = by((p) => -sc(p))[0];
  add(st.leader, `On dit que le roi de ${hn(st.leader)} s'est fait tailler une couronne neuve. Avec une tête pareille, il a fallu beaucoup d'or.`);
  add(st.leader, `Les mercenaires de toute l'Europe affûtent leurs lames : ${hn(st.leader)} est en tête, et tout le monde veut sa part du gâteau.`);
  add(st.players[rich].gold >= 12, `${E.capitalize(hn(rich))} a tant d'or qu'on dit que son roi se cure les dents avec des florins.`);
  add(st.players[poor].gold <= 4, `Le trésorier de ${hn(poor)} a vendu les cloches de la cathédrale. Puis les dents en or de la reine mère.`);
  add(st.players[angry].colere >= 35, `Les paysans de ${hn(angry)} ont pendu un percepteur. Puis son cheval, par principe.`);
  add(st.players[scary].peur >= 25, `À la cour de ${hn(scary)}, on ne dit plus « bonjour ». On dit « pitié ».`);
  add(ps.length > 2 && last !== first, `${E.capitalize(hn(last))} est à la traîne. Ses chevaliers exigent d'être payés d'avance, et en nature.`);
  for (const p of ps) {
    const k = E.king(st, p); if (!k) continue;
    add(k.age >= 60, `Le roi ${E.personTitle(k)} (${hn(p)}) a ${k.age} ans. Il appelle sa femme « maman ». Elle a arrêté de le corriger.`);
    add(k.health >= 3, `On a vu le médecin de ${hn(p)} acheter un cercueil. « Pour un ami », a-t-il dit.`);
    add(!!k.infirm, `Un ménestrel chante à Paris « la ballade de ${E.personTitle(k)} ». Il a eu la langue coupée, mais tout le monde connaît le refrain.`);
    const kids = st.families[p].members.filter((m) => m.alive && m.role === "child");
    add(kids.some((m) => m.bastardOf && m.bastardOf !== p), `Un enfant roux est né chez ${hn(p)}. Le roi est brun. Le palefrenier, lui, est très roux.`);
    add(kids.length === 0, `${E.capitalize(hn(p))} n'a plus d'héritier. Les cousins éloignés ont déjà pris les mesures du trône.`);
    add(kids.length >= 4, `Le roi de ${hn(p)} a tellement d'enfants qu'il ne connaît plus tous leurs prénoms. Il les appelle « toi ».`);
  }
  for (const a of st.alliances || []) add(true, `On a vu les ambassadeurs de ${hn(a.a)} et de ${hn(a.b)} partager la même chambre. Pour des raisons diplomatiques, évidemment.`);
  add(E.PROV_IDS.some((id) => st.provinces[id].plague > 0), "La peste rôde. Les médecins recommandent des sangsues, des prières, et surtout de partir très loin.");
  add(true, `Un moine de Cluny jure avoir vu le diable trinquer avec ${hn(ps[Math.floor(rng() * ps.length)])}. Le diable a payé sa tournée.`);
  add(true, `Une sorcière de Brocéliande prédit qu'un roi mourra avant l'hiver. Elle n'a pas dit lequel. Elle accepte les pots-de-vin.`);
  // on en garde deux, au hasard mais identiques pour tous
  const pickd = [];
  while (out.length && pickd.length < 2) pickd.push(out.splice(Math.floor(rng() * out.length), 1)[0]);
  return pickd;
}
function ragotsHtml() {
  const r = ragots();
  if (!r.length) return "";
  return `<div class="ragots"><b>${ICON.scroll} RAGOTS DE TAVERNE</b>${r.map((t) => `<p>« ${esc(t)} »</p>`).join("")}</div>`;
}
// ---- un mot du chroniqueur après chaque bataille (le même pour tous) ----
const QUIPS_WIN = ["Les défenseurs ont fui si vite qu'ils ont oublié leurs braies.", "Le seigneur du lieu s'est rendu contre la vie sauve. On a gardé la promesse cinq minutes.", "Les vainqueurs ont vidé la cave du château en une nuit. Puis le puits.", "Les cloches sonnent : pas pour fêter la victoire, mais parce qu'on les décroche pour les fondre.", "Les têtes des anciens maîtres décorent désormais les remparts. Ça manquait de couleur.", "Les nouveaux maîtres ont promis de respecter les coutumes locales. Ils ont commencé par les brûler.", "Le curé a béni les vainqueurs. Il avait béni les vaincus la veille. C'est un homme pragmatique."];
const QUIPS_HOLD = ["Les assaillants ont reçu de l'huile bouillante, puis le contenu des latrines.", "L'attaquant a perdu son étendard, son cheval et sa dignité, dans cet ordre.", "Les défenseurs ont lancé des ruches sur l'ennemi. Les abeilles ont fini le travail.", "Les survivants rentrent à pied en parlant d'un « repli stratégique ».", "On a retrouvé le capitaine de l'assaut caché dans un tonneau de harengs.", "Les femmes de la ville ont défendu les murs avec des pots de chambre. Pleins.", "Le chef des assaillants a juré de revenir. Les défenseurs ont parié sur sa mort avant Pâques."];
function battleQuip(st, s) {
  const r = seeded(`${st.gameId}:${st.round}:${s.prov}:${s.attWins}`)();
  const list = s.attWins ? QUIPS_WIN : QUIPS_HOLD;
  return list[Math.floor(r * list.length)];
}
function newsHtml() {
  const n = S().news || [];
  if (!n.length) return "";
  return `<div class="news"><b>NOUVELLES DU ROYAUME</b>${n.map((x) => `<p>${esc(x.text)}</p>`).join("")}</div>`;
}
const DSLOTS = ["dilemma", "dilemma2"];
function dilHas(k) { const st = S(); return !!(L.priv && L.priv[k] && L.priv[k].round === st.round); }
function dilSealed(k) { const st = S(); return !!(L.myInput[k] && L.myInput[k].round === st.round); }
function dilSlots() { return DSLOTS.filter(dilHas); }
function dilLeft() { return dilSlots().filter((k) => !dilSealed(k)).length; }
function dilCurrent() { const sl = dilSlots(); if (L.ui.dSlot && sl.includes(L.ui.dSlot)) return L.ui.dSlot; return sl.find((k) => !dilSealed(k)) || sl[0]; }
function panelDilemma() {
  const st = S();
  const sl = dilSlots(), left = dilLeft();
  const names = { dilemma: "Affaire de ta maison", dilemma2: "Affaire avec un rival" };
  return { html: `${newsHtml()}${ragotsHtml()}<p class="ph">1. Les ${term("dilemme", "dilemmes")}</p><p class="ptext">${sl.length ? (left ? `Deux décisions secrètes t'attendent : une <b>affaire de ta maison</b> (les autres n'en sauront qu'une rumeur) et une <b>affaire avec un rival</b> (révélée à tous). Il en reste <b>${left}</b>.` : "Tes choix sont scellés. Tu peux encore les changer tant que tout le monde n'a pas fini.") : "Pas de dilemme pour toi cette manche."}</p>
    ${sl.map((k) => `<button class="btn btn-block ${dilSealed(k) ? "" : "btn-red"}" data-opendil="${k}" style="margin-bottom:6px">${dilSealed(k) ? "✓ " : ""}${names[k]}${dilSealed(k) ? " (revoir)" : ""}</button>`).join("")}
    <div class="pbox" style="margin-top:12px"><p class="ph">Ensuite : 2. les ordres</p><p class="ptext" style="font-size:15px;margin:0">Quand tout le monde a choisi, tu donneras un ordre à chacun de tes dés : ${ICON.frapper}${term("frapper")}, ${ICON.marcher}${term("marcher")}, ${ICON.lever}${term("lever")}${E.unlocked(st, "intrigue") ? `, ${ICON.intrigue}${term("intriguer")}` : ""}.</p></div>`,
    bind: () => { document.querySelectorAll("[data-opendil]").forEach((b) => (b.onclick = () => { L.ui.dSlot = b.dataset.opendil; L.ui.dChoice = null; L.ui.dTarget = null; L.dilemmaClosed = false; L.ovKey = ""; render(); })); } };
}
function dicePreview() {
  const st = S();
  return `<div class="pbox"><p class="ph">Les dés de cette manche</p>${st.order.map((pid) => `<div class="row" style="margin-bottom:6px">${shield(st.players[pid].house, 18)}<span style="min-width:90px;font-family:var(--caps);font-size:12px">${esc(houseName(pid))}</span><span class="row" style="gap:4px">${(pid === me() ? myDice() : st.players[pid].dice).map((v, i) => (v ? dieSvg(v, 26, true) : '<span class="qdie" title="Dé caché">?</span>')).join("")}</span></div>`).join("")}<p class="hint">Chacun voit les dés des autres, sauf un dé caché par joueur. Un double donne un dé de 2 en plus.</p></div>`;
}

// ---- ordres ----
function myDice() {
  const st = S(), pl = st.players[me()];
  const h = L.priv && L.priv.hidden;
  return pl.dice.map((v, i) => (i === pl.hiddenIdx && h && h.round === st.round ? h.v : v));
}
function committed(provId, exceptIdx = -1) { return L.ui.orders.reduce((s, o, i) => s + (i !== exceptIdx && (o.type === "strike" || o.type === "march") && o.from === provId ? o.n : 0), 0); }
function avail(provId) { const p = S().provinces[provId]; return p.armies - 1 - committed(provId); }
function goldPlanned() { return L.ui.orders.reduce((s, o) => s + (o.type === "intrigue" ? E.COSTS[o.kind] || 0 : o.type === "levy" && o.merc ? E.MERC_COST : 0), 0); }
function orderText(o) {
  const st = S();
  const v = myDice()[o.die];
  if (o.type === "strike") { const prob = Math.round(E.winProb(o.n + v + E.attackMod(st, me()), E.defenseOf(st, o.to)) * 100); return `<b>Frapper</b> ${esc(PROVINCES[o.to].art)} depuis ${esc(PROVINCES[o.from].name)} avec ${o.n} armées <span class="pct">${prob} %</span>`; }
  if (o.type === "march") return `<b>Marcher</b> : ${o.n} armées de ${esc(PROVINCES[o.from].name)} vers ${esc(PROVINCES[o.to].name)}`;
  if (o.type === "levy") return `<b>Lever</b> ${E.levyAmount(v) + (o.merc ? E.MERC_ARMIES : 0)} armées ${esc(PROVINCES[o.to].en)}${o.merc ? ` <i>(dont mercenaires, −${E.MERC_COST} or)</i>` : ""}`;
  if (o.type === "intrigue") {
    const pl = st.players[me()]; const k = E.king(st, me());
    let bonus = (k && k.trait === "Rusé" ? 1 : 0) + (pl.intrigueBonus || 0) + (o.kind === "seduction" && k && k.trait === "Séduisant" ? 1 : 0);
    const prob = Math.round(E.intrigueProb(v, bonus, E.NEED[o.kind]) * 100);
    if (o.kind === "poison") { const p = st.families[o.target].members.find((m) => m.id === o.person); return `<b>Poison</b> sur ${esc(p ? E.personTitle(p) : "?")} (${esc(houseName(o.target))}) <span class="pct">${prob} %</span>`; }
    if (o.kind === "seduction") return `<b>Séduction</b> de la reine ${esc(E.deName(st, o.target))} <span class="pct">${prob} %</span>`;
    if (o.kind === "bribe") return `<b>Corruption</b> de la garnison ${esc(E.deC(PROVINCES[o.prov].city))} <span class="pct">${prob} %</span>`;
  }
  return "";
}
function saveOrders(sealed = false) { setInput("orders", { round: S().round, actions: L.ui.orders, sealed }); }
function panelOrders() {
  const st = S(), pid = me();
  const pl = st.players[pid];
  const sealed = L.myInput.orders && L.myInput.orders.round === st.round && L.myInput.orders.sealed;
  const b = L.ui.build;
  const dv = myDice();
  const arrows = L.ui.orders.filter((o) => o.type === "strike" || o.type === "march").map((o) => ({ from: o.from, to: o.to, color: o.type === "strike" ? "#8E1B1B" : "#2B1D12", dashed: o.type === "march" }));
  const tag = { strike: "FRAPPER", march: "MARCHER", levy: "LEVER", intrigue: "INTRIGUE" };
  const freeDice = dv.map((v, i) => i).filter((i) => dv[i] && !L.ui.orders.some((o) => o.die === i));
  const diceHtml = `<div class="dice-row">${dv.map((v, i) => { const o = L.ui.orders.find((x) => x.die === i); const hid = i === pl.hiddenIdx; return `<button class="die ${o ? "used" : ""} ${b && b.die === i ? "selected" : ""} ${pl.extraDie && i === dv.length - 1 ? "extra" : ""} ${hid ? "hidden-die" : ""} ${rollDiceAnim ? "rolling" : ""}" data-die="${i}" ${sealed || !v ? "disabled" : ""} aria-label="Dé ${v}${hid ? ", caché aux autres" : ""}${o ? ", déjà utilisé" : ""}">${dieSvg(v)}${hid ? '<span class="die-eye">CACHÉ</span>' : ""}${o ? `<span class="die-tag">${tag[o.type]}</span>` : ""}</button>`; }).join("")}</div>`;
  if (rollDiceAnim) { rollDiceAnim = false; A.play("dice"); }
  const steps = (cur) => `<div class="steps">${["Dé", "Action", "Cible", "Valider"].map((s, i) => `<span class="${i < cur ? "done" : i === cur ? "cur" : ""}">${i + 1}. ${s}</span>`).join("")}</div>`;
  let builder = "";
  if (sealed) {
    builder = `<div class="recap"><p class="ph">Ordres scellés ✓</p><p class="ptext" style="margin:0">On attend les autres. Tu peux encore changer d'avis.</p></div><button class="btn btn-block" id="btn-unseal">Modifier mes ordres</button>`;
  } else if (!b) {
    builder = freeDice.length ? `${steps(0)}<p class="ptext"><b>Clique un dé</b> pour lui donner un ordre. Plus le dé est haut, plus l'ordre est fort.${pl.hiddenIdx >= 0 ? ` Le dé ${ICON.hidden}CACHÉ est invisible pour les autres (${term("de_cache", "bluff")}).` : ""}${pl.extraDie ? ` Tu as fait un ${term("double")} : dé bonus !` : ""}</p>` : `<p class="ptext">Tous tes dés ont un ordre. Vérifie le récapitulatif et scelle.</p>`;
  } else if (!b.type) {
    const v = dv[b.die];
    const noStrike = false;
    const noIntr = !E.unlocked(st, "intrigue");
    builder = `${steps(1)}<p class="ph">Dé de ${v} : que fais-tu ?</p><div class="actgrid">
      <button class="actbtn" data-act="strike" ${noStrike ? "disabled" : ""}><span class="ab-top">${ICON.frapper}<b>Frapper</b></span><span>${noStrike ? "Pas d'attaque à la toute première manche" : `Attaquer une province voisine. +${v} à ta force`}</span></button>
      <button class="actbtn" data-act="march"><span class="ab-top">${ICON.marcher}<b>Marcher</b></span><span>Déplacer jusqu'à ${v} armées entre tes provinces</span></button>
      <button class="actbtn" data-act="levy"><span class="ab-top">${ICON.lever}<b>Lever</b></span><span>Recruter ${E.levyAmount(v)} armées dans une de tes provinces</span></button>
      <button class="actbtn ${noIntr ? "locked" : ""}" data-act="intrigue" ${noIntr ? "disabled" : ""}><span class="ab-top">${ICON.intrigue}<b>Intriguer</b></span><span>${noIntr ? `Débloqué à la manche ${E.UNLOCK.intrigue}` : "Poison, séduction ou corruption (coûte de l'or)"}</span></button>
    </div><button class="btn btn-small" id="b-cancel">← Choisir un autre dé</button>`;
  } else builder = builderStep(b, steps);
  // récapitulatif
  const recap = L.ui.orders.length ? `<div class="recap"><p class="ph">Tes ordres pour cette manche</p><ul class="orderlist">${L.ui.orders.map((o, i) => `<li><span>${orderText(o)}</span>${sealed ? "" : `<button class="x" data-del="${i}" aria-label="Annuler cet ordre">×</button>`}</li>`).join("")}</ul>${!sealed && freeDice.length ? `<p class="warn">${ICON.risk}Il te reste ${freeDice.length} dé${freeDice.length > 1 ? "s" : ""} sans ordre : ${freeDice.length > 1 ? "ils ne serviront" : "il ne servira"} à rien si tu scelles maintenant.</p>` : ""}</div>` : "";
  const seal = sealed ? "" : `<button class="btn btn-red btn-block" id="btn-seal">${ICON.scroll}Sceller mes ordres</button>`;
  return { html: `<p class="ph">2. Tes dés d'ordres</p>${diceHtml}${builder}${recap}${seal}
    <div class="kv" style="margin-top:12px"><span>${ICON.gold}<b>${term("or", "Or")}</b> ${pl.gold}${goldPlanned() ? ` (−${goldPlanned()} prévus)` : ""}</span></div>`,
    arrows, bind: () => bindOrders(b, sealed) };
}
function builderStep(b, steps) {
  const st = S(), pid = me(), pl = st.players[pid];
  const v = myDice()[b.die];
  const mine = E.provincesOf(st, pid);
  const back = `<button class="btn btn-small" id="b-back">← Retour</button>`;
  const cancel = `<button class="btn btn-small" id="b-cancel">Annuler cet ordre</button>`;
  const nav = `<div class="row" style="margin-top:8px">${back}${cancel}</div>`;
  if (b.type === "strike") {
    if (!b.from) {
      mine.filter((id) => avail(id) >= 1 && PROVINCES[id].adj.some((a) => st.provinces[a].owner !== pid)).forEach((id) => MAP.sel.add(id));
      MAP.hl = new Set(MAP.sel); MAP.onPick = (id) => { b.from = id; render(); };
      return `${steps(2)}<div class="prompt">${ICON.frapper}Sur la carte, clique <b>ta province d'où part l'attaque</b> (contour doré). Il faut au moins 2 armées : une reste toujours sur place.</div>${MAP.sel.size ? "" : `<p class="warn">Aucune de tes provinces n'a assez d'armées pour attaquer. Choisis plutôt Lever.</p>`}${nav}`;
    }
    if (!b.to) {
      const n = avail(b.from);
      PROVINCES[b.from].adj.filter((a) => st.provinces[a].owner !== pid).forEach((id) => {
        MAP.sel.add(id);
        const pr = Math.round(E.winProb(n + v + E.attackMod(st, pid), E.defenseOf(st, id)) * 100);
        MAP.badges.push({ prov: id, text: `${pr} %`, color: pr >= 67 ? "#2F5233" : pr >= 45 ? "#8A5F10" : "#8E1B1B" });
      });
      MAP.hlRed = new Set(MAP.sel); MAP.hl = new Set([b.from]); MAP.onPick = (id) => { b.to = id; b.n = avail(b.from); render(); };
      return `${steps(2)}<div class="prompt">${ICON.target}Clique <b>la province à attaquer</b>. Le pourcentage affiché sur chacune = tes chances si tu envoies toutes tes armées disponibles (${n}).</div>${nav}`;
    }
    const max = avail(b.from); b.n = Math.min(Math.max(1, b.n || max), max);
    MAP.hl = new Set([b.from]); MAP.hlRed = new Set([b.to]);
    const def = st.provinces[b.to];
    const prob = Math.round(E.winProb(b.n + v + E.attackMod(st, pid), E.defenseOf(st, b.to)) * 100);
    const ally = def.owner && E.bound(st, pid, def.owner);
    return `${steps(3)}<div class="pbox"><p class="ph">${ICON.frapper}Attaque sur ${esc(PROVINCES[b.to].art)}</p>
      <p class="ptext" style="font-size:15px">${term("defense", "Défense")} : ${def.armies} armée${def.armies > 1 ? "s" : ""}${def.owner ? ` (${esc(houseName(def.owner))})` : " (milice neutre)"}${E.peurBonus(st.players[def.owner]) ? ` +${E.peurBonus(st.players[def.owner])} grâce à sa ${term("peur", "Peur")}` : ""}. Ta force : armées envoyées + ${v} (ton dé).</p>
      <label class="ptext">Armées envoyées : <b id="b-nv">${b.n}</b> sur ${max}<input type="range" class="slider" id="b-n" min="1" max="${max}" value="${b.n}"></label>
      <p class="ptext">Chances de victoire : <span class="pct" id="b-pct">${prob} %</span></p>
      <p class="hint">Si tu gagnes, la province est à toi. Si tu perds, les armées envoyées meurent. Les autres jouent en même temps : la défense peut changer.</p>
      ${ally ? `<p class="warn"><b>Attention :</b> cette maison est ton alliée ou en trêve avec toi. L'attaquer est une ${term("trahison")} (−5 Prestige).</p>` : ""}
      <button class="btn btn-red btn-block" id="b-ok">Valider l'attaque</button>${nav}</div>`;
  }
  if (b.type === "march") {
    if (!b.from) { mine.filter((id) => avail(id) >= 1 && PROVINCES[id].adj.some((a) => st.provinces[a].owner === pid)).forEach((id) => MAP.sel.add(id)); MAP.hl = new Set(MAP.sel); MAP.onPick = (id) => { b.from = id; render(); }; return `${steps(2)}<div class="prompt">${ICON.marcher}Clique <b>la province de départ</b> (une des tiennes, contour doré).</div>${MAP.sel.size ? "" : `<p class="warn">Aucune province ne peut envoyer d'armées vers une voisine à toi.</p>`}${nav}`; }
    if (!b.to) { PROVINCES[b.from].adj.filter((a) => st.provinces[a].owner === pid).forEach((id) => MAP.sel.add(id)); MAP.hl = new Set(MAP.sel); MAP.onPick = (id) => { b.to = id; b.n = Math.min(v, avail(b.from)); render(); }; return `${steps(2)}<div class="prompt">${ICON.marcher}Clique <b>la province d'arrivée</b> (voisine, à toi).</div>${nav}`; }
    const max = Math.min(v, avail(b.from)); b.n = Math.min(Math.max(1, b.n || max), max);
    MAP.hl = new Set([b.from, b.to]);
    return `${steps(3)}<div class="pbox"><p class="ph">${ICON.marcher}${esc(PROVINCES[b.from].name)} → ${esc(PROVINCES[b.to].name)}</p><label class="ptext">Armées déplacées : <b id="b-nv">${b.n}</b> sur ${max}<input type="range" class="slider" id="b-n" min="1" max="${max}" value="${b.n}"></label><button class="btn btn-red btn-block" id="b-ok">Valider le déplacement</button>${nav}</div>`;
  }
  if (b.type === "levy") {
    mine.forEach((id) => MAP.sel.add(id)); MAP.hl = new Set(MAP.sel);
    const canMerc = pl.gold - goldPlanned() >= E.MERC_COST;
    if (!canMerc) b.merc = false;
    MAP.onPick = (id) => { L.ui.orders.push({ die: b.die, type: "levy", to: id, merc: !!b.merc }); L.ui.build = null; saveOrders(); A.play(b.merc ? "coins" : "click"); render(); };
    const n = E.levyAmount(v) + (b.merc ? E.MERC_ARMIES : 0);
    return `${steps(2)}<button class="merc-toggle ${b.merc ? "on" : ""}" id="merc-toggle" ${canMerc ? "" : "disabled"}>${ICON.gold}<span><b>${b.merc ? "✓ Mercenaires engagés" : "Engager des mercenaires ?"}</b><br>${canMerc ? `+${E.MERC_ARMIES} armées pour ${E.MERC_COST} or (il te reste ${pl.gold - goldPlanned()} or)` : `Il faut ${E.MERC_COST} or (tu en as ${pl.gold - goldPlanned()} de libre)`}</span></button><div class="prompt">${ICON.lever}Clique <b>la province où recruter ${n} armées</b>. Conseil : une province qui touche un voisin dangereux.</div>${nav}`;
  }
  if (b.type === "intrigue") {
    const k = E.king(st, pid);
    const goldLeft = pl.gold - goldPlanned();
    if (!b.kind) {
      const opt = (kind, name, desc) => { const bonus = (k && k.trait === "Rusé" ? 1 : 0) + (pl.intrigueBonus || 0) + (kind === "seduction" && k && k.trait === "Séduisant" ? 1 : 0); const pr = Math.round(E.intrigueProb(v, bonus, E.NEED[kind]) * 100); return `<button class="actbtn" data-kind="${kind}" ${goldLeft < E.COSTS[kind] ? "disabled" : ""}><span class="ab-top">${ICON.intrigue}<b>${name}</b> · ${ICON.gold}${E.COSTS[kind]}</span><span>${desc}<br>Réussite : <span class="pct">${pr} %</span>${goldLeft < E.COSTS[kind] ? " · pas assez d'or" : ""}</span></button>`; };
      return `${steps(2)}<p class="ph">Quelle intrigue ?</p><div class="actgrid">${opt("poison", "Poison", "Tuer un membre d'une famille rivale. Anonyme si ça marche.")}${opt("seduction", "Séduction", "Un bâtard à tes couleurs naît chez l'ennemi.")}${opt("bribe", "Corruption", "Acheter une garnison ennemie (3 armées max).")}</div><p class="hint">En cas d'échec, tout le monde saura que c'était toi.</p>${nav}`;
    }
    if (!b.target) {
      const others = st.order.filter((p) => p !== pid);
      return `${steps(2)}<p class="ph">Contre quelle maison ?</p><div class="target-row">${others.map((p) => `<button class="btn btn-small" data-tgt="${p}">${shield(st.players[p].house, 18)} ${esc(houseName(p))}</button>`).join("")}</div>${nav}`;
    }
    if (b.kind === "poison" && !b.person) {
      const fam = st.families[b.target].members.filter((m) => m.alive && ["king", "queen", "child", "widow"].includes(m.role));
      const role = (m) => (m.role === "king" ? (m.sex === "f" ? "Reine régnante" : "Roi") : m.role === "queen" ? "Reine" : m.role === "widow" ? "Reine douairière" : E.heirs(st, b.target)[0] === m ? "Héritier" : "Enfant");
      return `${steps(2)}<p class="ph">Qui empoisonner chez ${esc(houseName(b.target))} ?</p><p class="hint">Tuer l'héritier ou le roi peut déclencher une crise de ${term("succession")}.</p><div class="choices">${fam.map((m) => `<button class="choice" data-person="${m.id}"><b>${esc(E.personTitle(m))}</b><span>${role(m)}, ${m.age} ans · ${esc(m.trait)}${m.trait === "Paranoïaque" ? " (plus dur à empoisonner)" : ""}</span></button>`).join("")}</div>${nav}`;
    }
    if (b.kind === "bribe" && !b.prov) {
      const cands = E.provincesOf(st, b.target).filter((id) => id !== st.players[b.target].capital && st.provinces[id].armies <= 3);
      cands.forEach((id) => MAP.sel.add(id)); MAP.hlRed = new Set(cands);
      MAP.onPick = (id) => { L.ui.orders.push({ die: b.die, type: "intrigue", kind: "bribe", target: b.target, prov: id }); L.ui.build = null; saveOrders(); render(); };
      return `${steps(2)}<div class="prompt">${cands.length ? "Clique la garnison à corrompre (3 armées ou moins, pas la capitale)." : "Aucune garnison corruptible chez cette maison."}</div>${nav}`;
    }
    if (b.kind === "seduction" && !E.mother(st, b.target)) return `<div class="prompt">Il n'y a pas de reine à séduire chez ${esc(houseName(b.target))}.</div>${nav}`;
    return nav;
  }
  return nav;
}
function bindOrders(b, sealed) {
  if ($("#merc-toggle")) $("#merc-toggle").onclick = () => { if (L.ui.build) { L.ui.build.merc = !L.ui.build.merc; A.play("coins"); render(); } };
  document.querySelectorAll("[data-die]").forEach((el) => (el.onclick = () => {
    const i = +el.dataset.die;
    const idx = L.ui.orders.findIndex((o) => o.die === i);
    if (idx >= 0) { L.ui.orders.splice(idx, 1); saveOrders(); }
    L.ui.build = { die: i }; A.play("click"); render();
  }));
  document.querySelectorAll("[data-act]").forEach((el) => (el.onclick = () => { L.ui.build.type = el.dataset.act; render(); }));
  document.querySelectorAll("[data-kind]").forEach((el) => (el.onclick = () => { L.ui.build.kind = el.dataset.kind; render(); }));
  document.querySelectorAll("[data-tgt]").forEach((el) => (el.onclick = () => {
    L.ui.build.target = el.dataset.tgt;
    if (L.ui.build.kind === "seduction" && E.mother(S(), el.dataset.tgt)) { L.ui.orders.push({ die: b.die, type: "intrigue", kind: "seduction", target: el.dataset.tgt }); L.ui.build = null; saveOrders(); }
    render();
  }));
  document.querySelectorAll("[data-person]").forEach((el) => (el.onclick = () => { L.ui.orders.push({ die: b.die, type: "intrigue", kind: "poison", target: b.target, person: el.dataset.person }); L.ui.build = null; saveOrders(); render(); }));
  document.querySelectorAll("[data-del]").forEach((el) => (el.onclick = () => { L.ui.orders.splice(+el.dataset.del, 1); saveOrders(); render(); }));
  if ($("#b-cancel")) $("#b-cancel").onclick = () => { L.ui.build = null; render(); };
  if ($("#b-back")) $("#b-back").onclick = () => {
    const x = L.ui.build; if (!x) return;
    if (x.person || x.prov) { delete x.person; delete x.prov; }
    else if (x.target) delete x.target;
    else if (x.kind) delete x.kind;
    else if (x.to) delete x.to;
    else if (x.from) delete x.from;
    else if (x.type) delete x.type;
    else L.ui.build = null;
    render();
  };
  const slider = $("#b-n");
  if (slider) slider.oninput = () => {
    b.n = +slider.value; $("#b-nv").textContent = b.n;
    if ($("#b-pct")) { const st = S(); $("#b-pct").textContent = Math.round(E.winProb(b.n + myDice()[b.die] + E.attackMod(st, me()), E.defenseOf(st, b.to)) * 100) + " %"; }
  };
  if ($("#b-ok")) $("#b-ok").onclick = () => { L.ui.orders.push({ die: b.die, type: b.type, from: b.from, to: b.to, n: b.n }); L.ui.build = null; saveOrders(); A.play("click"); render(); };
  if ($("#btn-seal")) $("#btn-seal").onclick = () => { L.ui.build = null; saveOrders(true); A.play("seal"); render(); };
  if ($("#btn-unseal")) $("#btn-unseal").onclick = () => { saveOrders(false); render(); };
  bindDiplomacy();
}

// ---- diplomatie : mariages, trêves, dons d'or, accusations ----
function myOffers() { const st = S(); const o = L.myInput.offers; return o && o.round === st.round ? o.items || [] : []; }
function myGifts() { const st = S(); const g = L.myInput.gifts; return g && g.round === st.round ? g.items || [] : []; }
function diplomacyHtml() {
  const st = S(), pid = me();
  const others = st.order.filter((p) => p !== pid && st.players[p].house !== "anglais");
  if (!others.length) return "";
  const pl = st.players[pid];
  const incoming = Object.entries(st.proposals || {}).filter(([, pr]) => pr.to === pid);
  const offers = myOffers();
  const gifts = myGifts();
  const myChild = E.marriageable(st, pid);
  let h = `<div class="pbox"><p class="ph">Diplomatie</p><p class="hint" style="margin-top:0">Mariage : alliance permanente (+1 or par manche). Trêve : 3 manches. Attaquer un allié ou rompre une trêve = trahison (−5 Prestige).</p>`;
  for (const [key, pr] of incoming) {
    const ans = L.ui.answers[key] ?? (L.myInput.answers || {})[key];
    const kind = pr.kind || "marriage";
    const theirChild = E.marriageable(st, pr.from);
    const what = kind === "treaty" ? "propose une trêve de 3 manches" : `demande la main de ${esc(myChild ? E.personTitle(myChild) : "ton enfant")} pour ${esc(theirChild ? E.personTitle(theirChild) : "son enfant")}`;
    h += `<div class="proposal" style="margin:8px 0"><span class="grow"><b>${esc(houseName(pr.from))}</b> ${what}.</span>
      ${ans === undefined ? `<button class="btn btn-small btn-red" data-ans="${key}" data-v="1">Accepter</button><button class="btn btn-small" data-ans="${key}" data-v="0">Refuser</button>` : `<i>${ans ? "Accepté (effet à la révélation)" : "Refusé"}</i>`}</div>`;
  }
  for (const o of others) {
    const al = E.allied(st, pid, o);
    const tr = (st.treaties || []).find((t) => ((t.a === pid && t.b === o) || (t.b === pid && t.a === o)) && t.until >= st.round);
    const askedM = offers.some((x) => x.to === o && x.kind === "marriage");
    const askedT = offers.some((x) => x.to === o && x.kind === "treaty");
    const gift = gifts.find((g) => g.to === o);
    h += `<div style="margin:8px 0;padding-top:6px;border-top:1px solid #D9C7A0"><div class="row">${shield(st.players[o].house, 18)}<span class="grow">${esc(houseName(o))}${st.players[o].isBot ? " <i>(ordinateur)</i>" : ""}${al ? '<span class="rel">ALLIÉ</span>' : ""}${tr ? `<span class="rel treaty">TRÊVE → ${E.yearOf(tr.until)}</span>` : ""}</span></div>
      <div class="row wrap" style="margin-top:6px">
        ${al ? "" : askedM ? "<i>Mariage proposé</i>" : `<button class="btn btn-small" data-offer="marriage" data-to="${o}" ${E.canPropose(st, pid, o, "marriage") ? "" : "disabled"} title="Il faut un enfant à marier de chaque côté, et moins de 50 de Peur">Mariage</button>`}
        ${al || tr ? "" : askedT ? "<i>Trêve proposée</i>" : `<button class="btn btn-small" data-offer="treaty" data-to="${o}">Trêve</button>`}
        ${gift ? `<i>${gift.amount} or envoyés</i>` : `<button class="btn btn-small" data-giftto="${o}" ${pl.gold < 1 ? "disabled" : ""}>Envoyer de l'or</button>`}
      </div>
      ${L.ui.giftTo === o ? `<div class="row" style="margin-top:6px"><span class="stepper"><button data-gm="-1" aria-label="Moins">−</button><b>${L.ui.giftAmt}</b><button data-gm="1" aria-label="Plus">+</button></span><span class="grow">or</span><button class="btn btn-small btn-red" id="gift-ok">Envoyer</button></div>` : ""}</div>`;
  }
  h += `</div>`;
  // accusations
  const uns = (st.unsolved || []);
  if (uns.length) {
    const acc = L.myInput.accuse && L.myInput.accuse.round === st.round ? L.myInput.accuse : null;
    h += `<div class="pbox"><p class="ph">Crimes non élucidés</p><p class="hint" style="margin-top:0">Accuse la bonne maison : elle perd 4 Prestige et tu en gagnes 2. Accuse à tort : −2 pour toi. Une accusation par manche.</p>`;
    for (const u of uns) {
      h += `<div style="margin:8px 0"><p class="ptext" style="font-size:14px;margin:0 0 6px"><i>${esc(u.text)}</i></p>`;
      if (acc) h += acc.crime === u.id ? `<i>Tu accuses ${esc(houseName(acc.target))}. Verdict à la révélation.</i>` : "";
      else h += `<div class="row wrap">${st.order.filter((p) => p !== pid).map((p) => `<button class="btn btn-small" data-acc="${u.id}" data-tgt-acc="${p}">Accuser ${esc(houseName(p))}</button>`).join("")}</div>`;
      h += `</div>`;
    }
    h += `</div>`;
  }
  return h;
}
function bindDiplomacy() {
  const st = S();
  document.querySelectorAll("[data-offer]").forEach((el) => (el.onclick = () => {
    const items = [...myOffers(), { kind: el.dataset.offer, to: el.dataset.to }];
    setInput("offers", { round: st.round, items });
    A.play(el.dataset.offer === "marriage" ? "bells" : "seal"); render();
  }));
  document.querySelectorAll("[data-ans]").forEach((el) => (el.onclick = () => {
    L.ui.answers[el.dataset.ans] = el.dataset.v === "1";
    setInput("answers", { ...(L.myInput.answers || {}), ...L.ui.answers });
    render();
  }));
  document.querySelectorAll("[data-giftto]").forEach((el) => (el.onclick = () => { L.ui.giftTo = el.dataset.giftto; L.ui.giftAmt = 1; render(); }));
  document.querySelectorAll("[data-gm]").forEach((el) => (el.onclick = () => { const max = st.players[me()].gold; L.ui.giftAmt = Math.max(1, Math.min(max, L.ui.giftAmt + +el.dataset.gm)); render(); }));
  if ($("#gift-ok")) $("#gift-ok").onclick = () => {
    const items = [...myGifts().filter((g) => g.to !== L.ui.giftTo), { to: L.ui.giftTo, amount: L.ui.giftAmt }];
    setInput("gifts", { round: st.round, items }); L.ui.giftTo = null; A.play("coins"); render();
  };
  document.querySelectorAll("[data-acc]").forEach((el) => (el.onclick = () => { setInput("accuse", { round: st.round, crime: el.dataset.acc, target: el.dataset.tgtAcc }); A.play("seal"); render(); }));
}

// ---- entrées de chronique (les dilemmes avec leur contexte) ----
function entryHtml(e, plain = false) {
  // l'affaire privée d'une autre maison n'arrive qu'en rumeur (sauf à la fin de la partie)
  if (e && e.title && e.secret && e.pid !== me() && S() && S().phase !== "end") {
    return `<span class="ch-title">${ICON.scroll}Rumeur venue de la cour ${esc(E.deName(S(), e.pid))}</span><span class="ch-res">On raconte que… ${esc(e.text)}</span>`;
  }
  if (e && e.title) {
    return `<span class="ch-title">${ICON.scroll}« ${esc(e.title)} »</span><span class="ch-sit">${esc(e.situation || "")}</span><span class="ch-choice">${esc(e.choice || "")}</span><span class="ch-res">${esc(e.text)}</span>`;
  }
  return esc(e ? e.text : "");
}
// ---- révélation : une info à la fois, on clique « Suivant » quand on l'a vue ----
const CHAPTERS = {
  dil: ["I", "Les affaires des cours"],
  intr: ["II", "Les intrigues"],
  move: ["III", "Les troupes"],
  battle: ["IV", "Les batailles"],
  diplo: ["V", "La diplomatie"],
  end: ["VI", "Le bilan"],
};
const RV = { key: "", list: [], i: -1, t0: 0, pre: false, auto: store.get("sn_rvauto") === "1", preTimer: null };
function rvList(st) {
  const key = `${st.gameId}:${st.round}:${st.reveal ? st.reveal.steps.length : 0}`;
  if (RV.key === key) return RV.list;
  RV.key = key; RV.i = -1; RV.t0 = 0; RV.pre = false;
  const list = [];
  const steps = st.reveal ? st.reveal.steps : [];
  steps.forEach((s, k) => {
    const ch = s.ch || "end";
    const last = list[list.length - 1];
    // tous les mouvements de troupes sont montrés ensemble sur la carte
    if (s.kind === "move" && last && last.kind === "move") { last.ks.push(k); return; }
    list.push({ ks: [k], ch, kind: s.kind });
  });
  list.push({ virt: "done", ch: "fin" });
  // numérotation dans chaque chapitre
  const tot = {}; list.forEach((e) => (tot[e.ch] = (tot[e.ch] || 0) + 1));
  const cur = {}; list.forEach((e) => { cur[e.ch] = (cur[e.ch] || 0) + 1; e.pos = cur[e.ch]; e.tot = tot[e.ch]; });
  RV.list = list;
  return list;
}
function rvEntry(st) { return rvList(st)[RV.i]; }
function rvStepIdx(st) {
  const list = rvList(st), e = list[RV.i];
  if (!e) return -1;
  if (e.virt === "done") return st.reveal.steps.length - 1;
  // pendant le suspense d'une bataille, la carte montre encore l'état d'avant
  return RV.pre ? e.ks[0] - 1 : e.ks[e.ks.length - 1];
}
function revealIdx() { const st = S(); return st && st.reveal ? rvStepIdx(st) : -1; }
function revealProvinces() {
  const st = S();
  const e = rvEntry(st);
  if (e && e.virt === "done") return st.provinces;
  const view = JSON.parse(JSON.stringify(st.revealFrom || st.provinces));
  const idx = rvStepIdx(st);
  for (let i = 0; i <= idx; i++) { const s = st.reveal.steps[i]; if (s && s.set) Object.assign(view, JSON.parse(JSON.stringify(s.set))); }
  return view;
}
function rvFocus(st) {
  const e = rvEntry(st);
  const out = { hl: [], red: [], arrows: [], badges: [] };
  if (!e || e.virt) return out;
  for (const k of e.ks) {
    const s = st.reveal.steps[k];
    if (s.kind === "battle") { out.red.push(s.prov); out.hl.push(...(s.from || [])); out.arrows.push(...(s.from || []).map((f) => ({ from: f, to: s.prov, color: "#8E1B1B" }))); }
    else if (s.kind === "move") { out.hl.push(...(s.provs || [])); out.arrows.push(...(s.mv || []).map((m) => ({ from: m.from, to: m.to, color: "#2B1D12" }))); out.badges.push(...(s.mv || []).map((m) => ({ prov: m.to, text: `+${m.n}`, color: "#2B1D12" })), ...(s.lv || []).map((l) => ({ prov: l.to, text: `+${l.n}`, color: "#2F5233" }))); }
    else if (s.prov) out.hl.push(s.prov);
  }
  return out;
}
const KIND_LABEL = { battle: "Bataille", death: "Mort", birth: "Naissance", intrigue: "Intrigue", bribe: "Corruption", move: "Mouvements de troupes", marriage: "Noces", betrayal: "Trahison", claim: "Revendication", exile: "Exil", plague: "Peste", event: "Événement", revolt: "Jacquerie", text: "Chronique", treaty: "Trêve", gift: "Or" };
function rvLabel(st, s) {
  if (s.kind === "dilemma") return s.secret && s.pid !== me() ? `Rumeur · ${houseName(s.pid)}` : `Décision · ${s.pid ? houseName(s.pid) : "anonyme"}`;
  return (KIND_LABEL[s.kind] || "Chronique") + (s.kind === "battle" ? ` · ${PROVINCES[s.prov].city}` : "");
}
function duelHtml(st, s, pre) {
  const a = s.atk[0];
  const side = (pid, name, n, bonus, total, win) => `<div class="dside ${pre ? "" : win ? "win" : "lose"}">${pid ? shield(st.players[pid].house, 34) : '<svg width="34" height="38" viewBox="0 0 64 74"><path d="M4,4 H60 V34 C60,54 46,66 32,70 C18,66 4,54 4,34 Z" fill="#8C7556" stroke="#2B1D12" stroke-width="3"/></svg>'}<span class="nm">${esc(name)}</span><span class="fc ${pre ? "rolling" : ""}">${pre ? "?" : total}</span><span class="dt">${n} armée${n > 1 ? "s" : ""}${bonus ? ` + ${bonus}` : ""} + hasard</span></div>`;
  return `<div class="rv-battle-title">${esc(houseName(a.pid))} attaque ${esc(PROVINCES[s.prov].art)}${s.def ? ` de ${esc(houseName(s.def))}` : " (milice)"}</div>
    <div class="duel">${side(a.pid, houseName(a.pid) + (s.atk.length > 1 ? ` (+${s.atk.length - 1})` : ""), a.n, a.bonus, a.total, s.attWins)}<span class="vs">contre</span>${side(s.def, s.def ? houseName(s.def) : "Milice", s.defArmies, s.defBonus, s.defTotal, !s.attWins)}</div>
    <div class="verdict">${pre ? "Le choc des armées…" : s.attWins ? `${esc(houseName(a.pid))} prend ${esc(PROVINCES[s.prov].art)} !` : `${s.def ? esc(houseName(s.def)) : "La milice"} tient ${esc(PROVINCES[s.prov].art)}.`}</div>
    ${pre ? "" : `<p class="rv-quip">${esc(battleQuip(st, s))}</p><p class="rv-sub">${esc(s.text)}</p>`}`;
}
function rvCardHtml(st) {
  const e = rvEntry(st);
  if (!e) return `<div class="rv-dock"><p class="rv-wait">Les sceaux se brisent…</p></div>`;
  const list = rvList(st);
  const sent = L.myInput.revdone && L.myInput.revdone.round === st.round;
  if (e.virt === "done") {
    const waiting = st.order.filter((p) => !st.players[p].isBot && p !== me() && !(st.ready || {})[p]);
    return `<div class="rv-dock done"><div class="rv-head"><span>Fin de la révélation</span><span>${list.length - 1} événements</span></div>
      ${summaryHtml()}
      <div class="rv-btns"><button class="btn" data-rvc="prev">◀ Revenir</button><button class="btn btn-red grow" data-rvc="ok" ${sent ? "disabled" : ""}>${sent ? (waiting.length ? `On attend ${waiting.map((p) => esc(houseName(p))).join(", ")}…` : "C'est parti…") : `J'ai tout vu : manche suivante`}</button></div>
      <button class="rv-link" data-rvc="restart">Revoir depuis le début</button></div>`;
  }
  const head = `<div class="rv-head"><span>${CHAPTERS[e.ch] ? `Chapitre ${CHAPTERS[e.ch][0]} · ${CHAPTERS[e.ch][1]}` : ""}</span><span>${e.pos} sur ${e.tot}</span></div>`;
  let body = "";
  if (e.kind === "move") {
    body = `<p class="rv-label">Mouvements de troupes</p>${e.ks.map((k) => { const s = st.reveal.steps[k]; return `<p class="rv-move" style="border-left-color:${houseColor(s.pid)}">${esc(s.text)}</p>`; }).join("")}<p class="hint">Sur la carte : les flèches noires sont les déplacements, les pastilles vertes les armées levées.</p>`;
  } else {
    const s = st.reveal.steps[e.ks[0]];
    body = `<p class="rv-label" style="color:${s.pid ? houseColor(s.pid) : "var(--red)"}">${esc(rvLabel(st, s))}</p>${s.kind === "battle" && s.atk ? duelHtml(st, s, RV.pre) : `<div class="rv-text">${s.title ? entryHtml(s) : esc(s.text)}</div>`}`;
  }
  const mourn = !e.virt && e.kind === "death";
  return `<div class="rv-dock ${mourn ? "mourn" : ""}">${head}${mourn ? `<div class="rv-cross">✝</div>` : ""}${body}
    <div class="rv-btns"><button class="btn" data-rvc="prev" ${RV.i <= 0 ? "disabled" : ""}>◀</button><button class="btn btn-red grow rv-next" data-rvc="next" ${RV.pre ? "disabled" : ""}>Suivant ▶</button></div>
    <div class="rv-opts"><label class="check"><input type="checkbox" data-rvc="auto" ${RV.auto ? "checked" : ""}> <span>Lecture automatique</span></label><button class="rv-link" data-rvc="end">Tout passer</button><span class="rv-prog">${RV.i + 1} / ${list.length}</span></div></div>`;
}
function panelReveal() {
  const st = S();
  const list = rvList(st);
  let hist = "";
  list.forEach((e, x) => {
    if (x >= RV.i || e.virt) return;
    const s = st.reveal.steps[e.ks[0]];
    const txt = e.kind === "move" ? `${e.ks.length} maison${e.ks.length > 1 ? "s" : ""} déplacent ou lèvent des troupes` : s.kind === "battle" && s.atk ? `${s.attWins ? "⚔ " + houseName(s.atk[0].pid) + " prend " + PROVINCES[s.prov].art : "⚔ " + PROVINCES[s.prov].name + " résiste à " + houseName(s.atk[0].pid)}` : (s.secret && s.pid !== me() ? "Rumeur : " : s.title ? `« ${s.title} » : ` : "") + s.text;
    hist += `<button class="rv-line" data-rv="${x}" style="border-left-color:${s.pid ? houseColor(s.pid) : "#6B5638"}">${esc(txt)}</button>`;
  });
  return { html: `${rvCardHtml(st)}${hist ? `<p class="ph" style="margin-top:16px">Déjà révélé <span class="hint">(clique pour revoir)</span></p><div class="rv-hist">${hist}</div>` : ""}`, bind: bindReveal };
}
function bindReveal() {
  document.querySelectorAll("[data-rv]").forEach((b) => (b.onclick = () => rvGo(+b.dataset.rv)));
  const st = S();
  document.querySelectorAll("[data-rvc]").forEach((b) => {
    const c = b.dataset.rvc;
    const h = (ev) => {
      ev.stopPropagation();
      if (c === "prev") rvGo(RV.i - 1);
      else if (c === "next") rvGo(RV.i + 1);
      else if (c === "end") rvGo(rvList(st).length - 1);
      else if (c === "restart") rvGo(0);
      else if (c === "ok") { setInput("revdone", { round: st.round }); A.play("seal"); rvRender(false); }
    };
    if (c === "auto") b.onchange = () => { RV.auto = b.checked; store.set("sn_rvauto", RV.auto ? "1" : "0"); RV.t0 = net.now(); };
    else b.onclick = h;
  });
}
function rvGo(i) {
  const st = S(); const list = rvList(st);
  const n = Math.max(0, Math.min(list.length - 1, i));
  const changed = n !== RV.i;
  RV.i = n; RV.t0 = net.now();
  rvRender(changed);
}
function rvDur(st, e) {
  if (!e || e.virt) return 1e12;
  const s = st.reveal.steps[e.ks[0]];
  const ms = e.kind === "move" ? 6000 : s.kind === "battle" ? 6500 : s.kind === "dilemma" ? (s.secret && s.pid !== me() ? 5000 : 8000) : 5500;
  return ms * SPEED;
}
// le moteur de la révélation : démarre après le compte à rebours, avance seul seulement en lecture automatique
function tickReveal() {
  const st = S();
  if (!st || st.phase !== "reveal" || !st.reveal) { $("#banner").classList.add("hidden"); document.body.classList.remove("rv-on"); return; }
  document.body.classList.add("rv-on");
  const now = net.now();
  if (RV.i < 0) {
    rvList(st);
    if (now >= (st.revealStart || 0)) {
      // sur téléphone, on remonte sur la carte pour suivre la révélation
      if (window.innerWidth <= 900) { const m = $("#mapwrap"); if (m) window.scrollTo({ top: Math.max(0, m.getBoundingClientRect().top + window.scrollY - 56), behavior: "smooth" }); }
      rvGo(0);
    }
    return;
  }
  const e = rvEntry(st);
  if (RV.auto && !RV.pre && !e.virt && now - RV.t0 > rvDur(st, e)) rvGo(RV.i + 1);
}
function rvRender(stepChanged) {
  const st = S();
  const e = rvEntry(st);
  if (!e) return;
  clearTimeout(RV.preTimer);
  const s = !e.virt ? st.reveal.steps[e.ks[0]] : null;
  // une bataille : d'abord la carte d'avant et le choc, puis le résultat
  RV.pre = !!(stepChanged && s && s.kind === "battle" && s.atk);
  // petite étiquette en haut de la carte, qui ne cache rien
  const bn = $("#banner");
  if (s) { bn.className = "banner mini"; bn.innerHTML = `<b>${esc(e.kind === "move" ? "Mouvements de troupes" : rvLabel(st, s))}</b>`; }
  else bn.classList.add("hidden");
  rvPaint();
  if (stepChanged && s) {
    const pid = me();
    if (s.kind === "battle") {
      A.play("battle"); fx("battle", s.prov);
      if (pid && st.revealFrom[s.prov] && st.revealFrom[s.prov].owner === pid) A.vibrate([120, 60, 120]);
      RV.preTimer = setTimeout(() => {
        RV.pre = false; rvPaint();
        if (s.attWins) { fx("conquest", s.prov, houseColor(s.winner)); A.play("conquest"); }
        speak(s.attWins ? `${houseName(s.atk[0].pid)} prend ${PROVINCES[s.prov].art}.` : `${PROVINCES[s.prov].art} résiste.`);
      }, 1500 * SPEED);
    } else {
      speak(e.kind === "move" ? "Les troupes se mettent en marche." : s.secret && s.pid !== me() ? `Rumeur. ${s.text}` : s.text);
      if (s.kind === "death") { A.play(s.sound === "poison" ? "poison" : "knell"); const c = s.pid && st.players[s.pid] && st.players[s.pid].capital; if (c) fx("death", c); if (pid && s.pid === pid) A.vibrate([200, 100, 200]); }
      else if (s.kind === "birth") A.play("birth");
      else if (s.kind === "marriage") A.play("bells");
      else if (s.kind === "betrayal") A.play("betrayal");
      else if (s.kind === "bribe") { A.play("coins"); fx("conquest", s.prov, houseColor(s.pid)); }
      else if (s.kind === "claim") A.play("horn");
      else if (s.kind === "move") A.play("drum");
      else if (s.kind === "exile") A.play("knell");
      else if (s.kind === "treaty") A.play("seal");
      else if (s.kind === "gift") A.play("coins");
      else A.play("click");
    }
  } else if (stepChanged && e.virt === "done") A.play("bell");
}
function rvPaint() {
  // panneau (récit + boutons) et carte, sans recalculer tout l'écran
  const st = S();
  const f = rvFocus(st);
  MAP.hl = new Set(f.hl); MAP.hlRed = new Set(f.red); MAP.badges = f.badges;
  updateMap(revealProvinces());
  drawArrows(f.arrows);
  if (L.ui.tab !== "panel") L.ui.tab = "panel";
  document.querySelectorAll("#side-tabs button").forEach((b) => b.classList.toggle("active", b.dataset.tab === "panel"));
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.id === "tab-panel"));
  const pr = panelReveal(); $("#tab-panel").innerHTML = pr.html; pr.bind();
}
function interludeLines() {
  const st = S();
  const pri = { death: 0, betrayal: 1, claim: 2, marriage: 3, intrigue: 4, battle: 5, revolt: 5, dilemma: 6, exile: 3, plague: 7, event: 7, birth: 8, text: 9 };
  return (st.chronicle || []).filter((c) => c.round === st.round).sort((a, b) => (pri[a.kind] ?? 9) - (pri[b.kind] ?? 9)).slice(0, 4);
}

// ---------------------------------------------------------------------
// ONGLETS MAISON ET CHRONIQUE
// ---------------------------------------------------------------------
function houseHtml(pid, full) {
  const st = S();
  const p = st.players[pid];
  if (!p) return "";
  const h = HOUSES[p.house];
  const fam = st.families[pid];
  const hide = st.round === st.maxRounds && st.phase !== "end" && pid !== me();
  const roleName = (m) => m.role === "king" ? (m.sex === "f" ? "Reine régnante" : "Roi") : m.role === "queen" ? "Reine" : m.role === "widow" ? "Douairière" : m.role === "monk" ? (m.sex === "f" ? "Au couvent" : "Au monastère") : m.role === "gone" ? "Partie" : m.sex === "f" ? "Fille" : "Fils";
  const k = E.king(st, pid);
  const consort = E.consort(st, pid);
  const members = fam.members.filter((m) => m.alive || full).sort((a, b) => (b.alive - a.alive) || (["king", "queen", "widow", "child", "monk", "gone"].indexOf(a.role) - ["king", "queen", "widow", "child", "monk", "gone"].indexOf(b.role)) || b.age - a.age);
  const famHtml = members.slice(0, 14).map((m) => {
    const tr = TRAITS[m.trait];
    const spouse = m.spouse ? E.personById(st, m.spouse) : null;
    return `<div class="fam ${m.alive ? "" : "dead"}"><div class="fam-top"><span class="fam-name">${m.role === "king" ? "♛ " : ""}${esc(E.personTitle(m))}</span><span class="fam-meta">${roleName(m)} · ${m.age} ans${m.alive ? "" : ` · ${esc(m.cause || "mort")}`}</span></div>
      ${m.alive ? `<div class="chips" style="margin-top:4px"><span class="chip ${tr && tr.good ? "good" : "bad"}" title="${esc(tr ? tr.desc : "")}">${esc(m.trait)}</span>${["king", "queen", "widow"].includes(m.role) || m.health >= 2 ? `<span class="chip ${m.health >= 3 ? "bad" : ""}">${HEALTH[m.health]}</span>` : ""}${m.bastard && !m.legit && pid === me() ? '<span class="chip gold">Bâtard</span>' : ""}${m.bastard && m.legit ? '<span class="chip gold">Bâtard légitimé</span>' : ""}${spouse ? `<span class="chip blue">Marié${m.sex === "f" ? "e" : ""} à ${esc(spouse.name)} (${esc(houseName(m.spouse.pid))})</span>` : ""}</div>` : ""}</div>`;
  }).join("");
  const myObj = pid === me() && L.priv && L.priv.objectives ? L.priv.objectives : [];
  const est = pid === me() ? E.estimateScore(st, { [pid]: L.priv || {} }, pid) : null;
  const spied = pid !== me() && L.priv && L.priv.spied && L.priv.spied.target === pid ? L.priv.spied.objectives : null;
  return `<div class="house-head">${shield(p.house, 44)}<div><div class="hn">Maison ${esc(houseName(pid))}</div><div class="hm">« ${esc(h.motto)} » · ${esc(p.name)}${p.isBot ? " (ordinateur)" : ""}</div></div></div>
    ${est ? `<div class="score-box"><span class="ph" style="margin:0">Score estimé si la partie finissait maintenant</span><br><b>${est.total}</b> points <span class="hint">(Prestige ${est.prestige} + provinces ${est.provinces} + régions ${est.regions} + objectifs ${est.objectives} + famille ${est.family})</span></div>` : ""}
    ${spied ? `<div class="pbox"><p class="ph red">Objectifs secrets (volés par tes espions)</p>${spied.map((oid) => `<p class="ptext" style="margin:2px 0;font-size:14px">• ${esc((OBJECTIVES.find((o) => o.id === oid) || {}).text || "")}</p>`).join("")}</div>` : ""}
    <div class="kv"><span><b>Or</b> ${p.gold}</span><span><b>Prestige</b> ${hide ? "?" : p.prestige}</span><span><b>Provinces</b> ${E.provincesOf(st, pid).length}</span><span><b>Régions</b> ${E.regionsOf(st, pid).length}</span></div>
    <div class="stat-row"><div class="stat"><div class="stat-l"><span>Colère du peuple</span><span>${p.colere}</span></div><div class="gauge"><div style="width:${p.colere}%;background:#8E1B1B"></div></div></div><div class="stat"><div class="stat-l"><span>Peur</span><span>${p.peur}</span></div><div class="gauge"><div style="width:${p.peur}%;background:#2B1D12"></div></div></div></div>
    <p class="hint" style="margin:-4px 0 12px">Colère à 80 : une province se révolte. Peur : +1 en défense tous les 25 points, mais à 50 plus personne n'épouse tes enfants.</p>
    ${k && TRAITS[k.trait] ? `<p class="ptext" style="font-size:14px"><b>Effet du souverain :</b> ${esc(k.trait)}, ${esc(TRAITS[k.trait].desc.toLowerCase())}.</p>` : ""}
    <p class="ph">La famille ${pid === me() ? `<button class="btn btn-small" data-famintro="1" style="margin-left:8px;min-height:30px">Présentation</button>` : ""}</p>${consort && consort.alive && !fam.members.includes(consort) ? `<p class="hint" style="margin-top:0">Époux${consort.sex === "f" ? "se" : ""} du souverain : ${esc(E.personTitle(consort))} (${esc(houseName(E.ownerOf(st, consort)))})</p>` : ""}${famHtml}
    ${myObj.length ? `<p class="ph" style="margin-top:14px">Tes objectifs secrets</p>${myObj.map((oid) => { const o = OBJECTIVES.find((x) => x.id === oid); const ok = E.objectiveDone(st, pid, oid); return `<div class="obj"><span class="${ok ? "ok" : "ko"}">${ok ? "✓" : "○"}</span><span>${esc(o.text)} <i>(+${o.pts})</i></span></div>`; }).join("")}` : ""}`;
}
function renderHouseTab() { const pid = me(); $("#tab-house").innerHTML = pid ? houseHtml(pid, true) : "<p class='ptext'>Tu es spectateur.</p>"; const b = $("#tab-house [data-famintro]"); if (b) b.onclick = () => openModal("family", 0); }
// ---- présentation de la famille, personnage par personnage ----
const TRAIT_FLAVOR = {
  "Rusé": ["Il sourit toujours une seconde trop tard. Personne ne sait ce qu'il pense, et c'est très bien ainsi.", "Elle écoute aux portes depuis l'âge de six ans. Elle n'a jamais été prise."],
  "Brillant stratège": ["Il dessine des batailles sur la nappe pendant les repas. Il les gagne toutes.", "Elle joue aux échecs contre les évêques et les laisse parfois gagner, par politesse."],
  "Sanguinaire": ["Il chasse le loup à mains nues, dit-on. Les loups, eux, ne disent plus rien.", "Elle assiste aux exécutions au premier rang, et elle applaudit."],
  "Pieux": ["Il prie quatre heures par jour. Le peuple l'aime. Les capitaines s'ennuient.", "Elle porte un cilice sous ses robes de soie. Le peuple la vénère."],
  "Séduisant": ["La moitié des dames de la cour lui ont écrit des poèmes. L'autre moitié ment.", "Trois chevaliers se sont battus en duel pour un de ses regards. Deux sont morts."],
  "Robuste": ["Il a survécu à deux pestes, une chute de cheval et un cuisinier empoisonneur.", "Elle a accouché le matin et chassé le cerf l'après-midi."],
  "Paranoïaque": ["Il fait goûter son vin par trois hommes différents. Il a raison.", "Elle dort avec une dague sous l'oreiller et change de chambre chaque nuit."],
  "Simple d'esprit": ["Il rit aux enterrements et pleure aux mariages. On l'aime bien, mais pas pour régner.", "Elle parle aux pigeons. Les pigeons, au moins, l'écoutent."],
  "Lâche": ["Il a perdu sa première bataille en s'enfuyant avant qu'elle commence.", "Elle s'évanouit à la vue du sang. Même le sien. Surtout le sien."],
  "Fragile": ["Il tousse depuis l'enfance. Les médecins le saignent une fois par semaine, ce qui n'aide pas.", "Elle est pâle comme un cierge, et l'on prie beaucoup pour elle."],
  "Débauché": ["Il a plus de dettes chez les taverniers que de soldats dans ses armées.", "Elle organise des fêtes que l'évêque refuse de décrire."],
  "Cruel": ["Il fait couper la langue des bavards. La cour est devenue très silencieuse.", "Elle collectionne les ongles de ses servantes. On ne lui pose pas de questions."],
};
function portraitSvg(m, color) {
  const f = m.sex === "f", baby = m.age < 6, old = m.age >= 55;
  const ink = "#1A120C";
  const headR = baby ? 15 : 19;
  const hy = baby ? 82 : 66;
  let h = `<svg viewBox="0 0 120 140" width="120" height="140" class="portrait" aria-hidden="true"><defs><clipPath id="pc-${m.id}"><ellipse cx="60" cy="70" rx="56" ry="66"/></clipPath></defs>
    <ellipse cx="60" cy="70" rx="56" ry="66" fill="${color}" opacity=".35"/><g clip-path="url(#pc-${m.id})">
    <g opacity=".25" stroke="${ink}" stroke-width="1">${Array.from({ length: 12 }, (_, i) => `<path d="M0,${i * 12 + 4} H120"/>`).join("")}</g>`;
  if (baby) h += `<path d="M30,140 Q30,96 60,94 Q90,96 90,140 Z" fill="#E9DCBD" stroke="${ink}" stroke-width="2"/><path d="M36,112 Q60,124 84,112 M38,126 Q60,138 82,126" stroke="${ink}" stroke-width="1.4" fill="none"/>`;
  else h += `<path d="M14,140 Q16,100 60,${hy + 28} Q104,100 106,140 Z" fill="${ink}"/>`;
  if (f && !baby) h += `<path d="M${60 - headR - 6},${hy + 34} Q${60 - headR - 8},${hy - 8} 60,${hy - headR - 6} Q${60 + headR + 8},${hy - 8} ${60 + headR + 6},${hy + 34} Z" fill="${ink}"/>`;
  h += `<ellipse cx="60" cy="${hy}" rx="${headR - 2}" ry="${headR}" fill="#E9DCBD" stroke="${ink}" stroke-width="2"/>`;
  h += `<path d="M53,${hy - 2} h3 M64,${hy - 2} h3" stroke="${ink}" stroke-width="2"/><path d="M56,${hy + 9} Q60,${hy + 11} 64,${hy + 9}" stroke="${ink}" stroke-width="1.5" fill="none"/>`;
  if (!f && old) h += `<path d="M46,${hy + 6} Q48,${hy + 34} 60,${hy + 38} Q72,${hy + 34} 74,${hy + 6} Q66,${hy + 16} 60,${hy + 16} Q54,${hy + 16} 46,${hy + 6} Z" fill="#CFC4AE" stroke="${ink}" stroke-width="1.5"/>`;
  if (!f && !baby && !old) h += `<path d="M42,${hy - 6} Q44,${hy - headR - 6} 60,${hy - headR - 4} Q76,${hy - headR - 6} 78,${hy - 6} Q70,${hy - 14} 60,${hy - 14} Q50,${hy - 14} 42,${hy - 6} Z" fill="${ink}"/>`;
  if (m.role === "king" || m.role === "queen") { const cy = hy - headR + 2; h += `<path d="M${f ? 46 : 41},${cy} L${f ? 48 : 44},${cy - 14} L${f ? 54 : 52},${cy - 6} L60,${cy - 18} L${f ? 66 : 68},${cy - 6} L${f ? 72 : 76},${cy - 14} L${f ? 74 : 79},${cy} Z" fill="#D9A441" stroke="${ink}" stroke-width="1.5"/>`; }
  if (m.trait === "Sanguinaire" || m.trait === "Cruel") h += `<path d="M66,${hy + 2} l8,8" stroke="#8E1B1B" stroke-width="2.5"/>`;
  if (/Borgne/.test(m.infirm || "")) h += `<path d="M62,${hy - 5} h8 v6 h-8 Z" fill="${ink}"/><path d="M42,${hy - 8} L78,${hy - 2}" stroke="${ink}" stroke-width="1.2"/>`;
  h += `</g><ellipse cx="60" cy="70" rx="56" ry="66" fill="none" stroke="${ink}" stroke-width="3"/></svg>`;
  return h;
}
function familyCards(pid) {
  const st = S(), fam = st.families[pid];
  const order = ["king", "queen", "child"];
  const ms = fam.members.filter((m) => m.alive && order.includes(m.role)).sort((a, b) => order.indexOf(a.role) - order.indexOf(b.role) || b.age - a.age);
  const k = E.king(st, pid), co = E.consort(st, pid);
  if (co && co.alive && !ms.includes(co)) ms.splice(1, 0, co);
  return ms;
}
function familyHtml(i) {
  const st = S(), pid = me();
  const p = st.players[pid], color = HOUSES[p.house].color;
  const ms = familyCards(pid);
  const heirs = E.heirs(st, pid);
  const k = E.king(st, pid), co = E.consort(st, pid);
  const total = ms.length + 1;
  const nav = (j) => `<div class="intro-dots">${Array.from({ length: total }, (_, x) => `<span class="${x === j ? "on" : ""}"></span>`).join("")}</div>
    <div class="row">${j > 0 ? `<button class="btn grow" data-fam="${j - 1}">← Précédent</button>` : `<button class="btn grow" id="md-close">Passer</button>`}${j < total - 1 ? `<button class="btn btn-red grow" data-fam="${j + 1}">${j === 0 ? "Découvrir ma famille →" : "Suivant →"}</button>` : `<button class="btn btn-red grow" id="md-close">Prendre le pouvoir</button>`}</div>`;
  if (i === 0) {
    return `<div class="card fam-card"><span class="card-kicker">TA DYNASTIE</span><div style="text-align:center;margin:6px 0">${shield(p.house, 70)}</div><h2 style="text-align:center">La maison ${esc(E.deName(st, pid))}</h2><p style="text-align:center;font-style:italic">« ${esc(HOUSES[p.house].motto)} »</p>
      <p>Voici ceux qui portent ton nom. Ils vont vieillir, se marier, tomber malades, peut-être être empoisonnés. Ils comptent dans ton score (1 point par membre vivant), et beaucoup de dilemmes parleront d'eux.</p>
      <p><b>Si ton souverain meurt</b>, l'aîné des fils hérite (sinon l'aînée des filles). <b>Sans héritier, c'est la guerre civile</b> : tu perds un tiers de tes provinces.</p>${nav(0)}</div>`;
  }
  const m = ms[i - 1];
  const tr = TRAITS[m.trait];
  const isKing = k && m.id === k.id;
  const hIdx = heirs.findIndex((x) => x.id === m.id);
  const role = isKing ? (m.sex === "f" ? "Reine régnante" : "Le roi, ton souverain") : m.role === "queen" || (co && m.id === co.id) ? (m.sex === "f" ? "La reine" : "Le prince consort") : hIdx === 0 ? (m.sex === "f" ? "Ton héritière" : "Ton héritier") : m.sex === "f" ? "Ta fille" : "Ton fils";
  const fl = TRAIT_FLAVOR[m.trait] ? TRAIT_FLAVOR[m.trait][m.sex === "f" ? 1 : 0] : "";
  const effect = tr ? `${tr.desc}${isKing ? "" : " (compte surtout quand il ou elle règne)"}` : "";
  return `<div class="card fam-card"><span class="card-kicker">TA FAMILLE · ${i} SUR ${ms.length}</span>
    <div class="fam-hero">${portraitSvg(m, color)}<div><div class="fam-role">${esc(role)}</div><h2 style="margin:2px 0 4px">${esc(E.personTitle(m))}</h2><div class="fam-age">${m.age} ans${["king", "queen"].includes(m.role) || m.health >= 2 ? ` · ${HEALTH[m.health]}` : ""}${hIdx > 0 ? ` · ${hIdx + 1}e dans l'ordre de succession` : ""}</div></div></div>
    <p class="fam-flavor">${esc(fl)}</p>
    ${tr ? `<div class="fam-trait ${tr.good ? "good" : "bad"}"><b>${esc(m.trait)}</b> : ${esc(effect)}</div>` : ""}
    ${m.infirm ? `<p class="hint">Son surnom, « ${esc(m.infirm)} », la cour le lui a donné. Personne n'ose le dire devant ${m.sex === "f" ? "elle" : "lui"}.</p>` : ""}
    ${nav(i)}</div>`;
}
function renderLog() {
  const st = S();
  const c = (st.chronicle || []).slice().reverse();
  $("#tab-log").innerHTML = c.length ? c.map((e) => `<div class="log-entry ch-entry"><span class="yr">${e.year}</span>${entryHtml(e)}</div>`).join("") : `<p class="ptext wait">La chronique est encore vierge.</p>`;
}

// ---------------------------------------------------------------------
// SURCOUCHES : objectifs, dilemme, interlude, fin, maison, règles
// ---------------------------------------------------------------------
function renderOverlays() {
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
function cardTimer() { return `<span class="card-timer" data-timer></span>`; }
function objectivesCard() {
  const offer = L.priv.objOffer;
  const pick = L.ui.objPick.length ? L.ui.objPick : (L.myInput.objPick || []);
  L.ui.objPick = pick.slice();
  const sent = (L.myInput.objPick || []).length === 2;
  return `<div class="card"><div class="card-top"><span class="card-kicker">OBJECTIFS SECRETS</span>${cardTimer()}</div><h2>Ce que tu désires vraiment</h2><p>Garde 2 de ces 3 ambitions. Elles rapportent des points à la fin, et personne d'autre ne les connaît.</p>
    <div class="choices">${offer.map((oid) => { const o = OBJECTIVES.find((x) => x.id === oid); return `<button class="choice" data-obj="${oid}" aria-pressed="${pick.includes(oid)}"><b>+${o.pts} points</b><span>${esc(o.text)}</span></button>`; }).join("")}</div>
    <div class="row" style="margin-top:14px"><button class="btn grow" id="ov-close">Voir la carte</button><button class="btn btn-red grow" id="obj-ok" ${pick.length === 2 ? "" : "disabled"}>${sent ? "Choix envoyé ✓" : "Valider ces 2 objectifs"}</button></div></div>`;
}
function dilemmaCard() {
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
function resLegend() {
  return `<div class="res-legend"><span>${ICON.prestige}<b>Prestige</b> = tes points de victoire</span><span>${ICON.gold}<b>Or</b> = mercenaires (4 or), intrigues, cadeaux</span><span>${ICON.colere}<b>Colère</b> : à 80, une province se révolte</span><span>${ICON.peur}<b>Peur</b> : +1 en défense tous les 25 pts</span></div>`;
}
function summaryHtml() {
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
function interludeHtml() {
  const st = S(), pid = me();
  const waitAll = st.solo || st.timer === "none";
  const ready = L.myInput.next && L.myInput.next.round === st.round;
  return `<div class="interlude"><span class="kick">FIN DE LA MANCHE ${st.round} SUR ${st.maxRounds}</span>${woodcut(380, 210, st.round)}<h1>Anno Domini ${E.yearOf(st.round)}</h1>${summaryHtml()}${interludeLines().map((l, i) => `<p class="ch-entry" style="animation-delay:${0.3 + i * 0.9}s">${l.title ? `<b>${esc(houseName(l.pid))}</b> ` : ""}${entryHtml(l)}</p>`).join("")}
    ${pid ? `<button class="btn btn-red" id="btn-next" ${ready ? "disabled" : ""}>${ready ? "On attend les autres…" : st.round >= st.maxRounds ? "Voir le résultat" : `Passer à la manche ${st.round + 1}`}</button>` : ""}</div>`;
}
function momentsForts() {
  const st = S();
  const score = (c) => (c.kind === "betrayal" ? 6 : c.kind === "claim" ? 6 : /mise à sac/.test(c.text) ? 6 : c.kind === "death" && /trône|cousin|Guerre civile/.test(c.text) ? 5 : c.kind === "death" ? 4 : c.kind === "marriage" ? 3 : c.kind === "revolt" || c.kind === "exile" ? 4 : c.kind === "dilemma" && c.title && /tue|tuer|étrangl|brûl|empoison|exécut|massacr/i.test(c.choice || "") ? 4 : c.kind === "battle" && /prend/.test(c.text) ? 2 : 0);
  return (st.chronicle || []).filter((c) => score(c) > 0).map((c, i) => ({ c, v: score(c) + Math.random() * 0.5 })).sort((a, b) => b.v - a.v).filter((x, i, arr) => arr.findIndex((y) => y.c.kind === x.c.kind && y.c.round === x.c.round) === i).slice(0, 6).sort((a, b) => a.c.round - b.c.round).map((x) => x.c);
}
function recordPalmares(st) {
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
function palmaresHtml() {
  let pal = {}; try { pal = JSON.parse(store.get("sn_palmares") || "{}"); } catch {}
  if (!pal.games) return "";
  return `<div class="palmares">${ICON.prestige}<b>Ton palmarès</b> : ${pal.games} partie${pal.games > 1 ? "s" : ""} · ${pal.wins || 0} victoire${(pal.wins || 0) > 1 ? "s" : ""} · meilleur score ${pal.best || 0} points</div>`;
}
function endHtml() {
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
function bindOverlay() {
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
  if ($("#btn-home")) $("#btn-home").onclick = () => { store.set("sn_room", ""); location.href = location.pathname + (new URLSearchParams(location.search).has("test") ? "?test" : ""); };
  if ($("#btn-next")) $("#btn-next").onclick = () => { setInput("next", { round: st.round }); A.play("click"); L.ovKey = ""; render(); };
}
function openModal(kind, data) {
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
function phaseTutos() {
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

// ---------------------------------------------------------------------
// AIDES : fenêtres d'introduction, « Nouveau ! », définitions, fiche province, zoom, coach
// ---------------------------------------------------------------------
L.modalQueue = [];
function queueModal(kind, data) { L.modalQueue.push({ kind, data }); if ($("#modal").classList.contains("hidden")) nextModal(); }
function nextModal() { const m = L.modalQueue.shift(); if (m) openModal(m.kind, m.data); }
function introHtml(i) {
  const c = INTRO[i];
  return `<div class="card"><span class="card-kicker">COMMENT JOUER · ${i + 1} SUR ${INTRO.length}</span><div class="intro-icon">${c.icon.replace('width="16" height="16"', 'width="56" height="56"')}</div><h2 style="text-align:center">${c.title}</h2><p>${c.text}</p>
    <div class="intro-dots">${INTRO.map((_, j) => `<span class="${j === i ? "on" : ""}"></span>`).join("")}</div>
    <div class="row">${i > 0 ? `<button class="btn grow" data-intro="${i - 1}">← Précédent</button>` : `<button class="btn grow" id="md-close">Passer</button>`}${i < INTRO.length - 1 ? `<button class="btn btn-red grow" data-intro="${i + 1}">Suivant →</button>` : `<button class="btn btn-red grow" id="md-close">C'est parti !</button>`}</div></div>`;
}
// popover (définitions et fiches de province)
function showPopover(html, x, y) {
  const p = $("#popover");
  p.innerHTML = `<button type="button" class="pop-x" aria-label="Fermer">×</button>${html}`; p.classList.remove("hidden");
  const w = p.offsetWidth, h = p.offsetHeight;
  p.style.left = Math.max(10, Math.min(window.innerWidth - w - 10, x - w / 2)) + "px";
  p.style.top = (y + h + 20 > window.innerHeight ? Math.max(10, y - h - 14) : y + 14) + "px";
}
function hidePopover() { $("#popover").classList.add("hidden"); }
document.addEventListener("click", (e) => {
  const t = e.target.closest(".term");
  if (t) { e.preventDefault(); e.stopPropagation(); const g = GLOSSARY[t.dataset.term]; if (g) { const r = t.getBoundingClientRect(); showPopover(`<h5>${g[0]}</h5>${g[1]}`, r.left + r.width / 2, r.bottom); } return; }
  if (e.target.closest(".pop-x")) { hidePopover(); return; }
  if (!e.target.closest("#popover") && !e.target.closest("#map")) hidePopover();
}, true);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") { hidePopover(); $("#legend").classList.add("hidden"); } });
function provinceCard(id) {
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
// zoom et déplacement de la carte
const VIEW = { x: 0, y: 0, w: 840, h: 780 };
function applyView() { $("#map").setAttribute("viewBox", `${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`); }
function zoomBy(f) { const cx = VIEW.x + VIEW.w / 2, cy = VIEW.y + VIEW.h / 2; VIEW.w = Math.max(260, Math.min(840, VIEW.w * f)); VIEW.h = VIEW.w * 780 / 840; VIEW.x = Math.max(-100, Math.min(840 - VIEW.w + 100, cx - VIEW.w / 2)); VIEW.y = Math.max(-100, Math.min(780 - VIEW.h + 100, cy - VIEW.h / 2)); applyView(); }
$("#zoom-in").onclick = () => zoomBy(0.75);
$("#zoom-out").onclick = () => zoomBy(1 / 0.75);
$("#zoom-reset").onclick = () => { Object.assign(VIEW, { x: 0, y: 0, w: 840, h: 780 }); applyView(); };
$("#btn-legend").onclick = () => { const l = $("#legend"); l.innerHTML = `<p class="ph" style="margin-bottom:4px">Légende de la carte</p>${LEGEND}<p class="hint">Astuce : touche n'importe quelle province pour voir sa fiche.</p>`; l.classList.toggle("hidden"); };
(function enablePan() {
  const svg = $("#map"); let drag = null;
  svg.addEventListener("pointerdown", (e) => { if (VIEW.w >= 840) return; drag = { x: e.clientX, y: e.clientY, vx: VIEW.x, vy: VIEW.y, moved: false }; });
  window.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const r = svg.getBoundingClientRect(); const k = VIEW.w / r.width;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 6) drag.moved = true;
    if (drag.moved) { VIEW.x = drag.vx - dx * k; VIEW.y = drag.vy - dy * k; applyView(); }
  });
  window.addEventListener("pointerup", () => { if (drag && drag.moved) L.justPanned = Date.now(); drag = null; });
})();
// coach : fait clignoter l'élément à utiliser (première partie)
function applyCoach() {
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

// ---------------------------------------------------------------------
// BOUCLE DE TEMPS (chronos, révélation, arbitre)
// ---------------------------------------------------------------------
let lastTickSec = -1;
setInterval(() => {
  const st = S();
  if (st && st.phase !== "lobby" && st.deadline && !st.solo && st.timer && st.timer !== "none" && !["end", "reveal", "interlude"].includes(st.phase)) {
    const ms = st.deadline - net.now();
    const t = fmtTime(ms);
    $("#tb-timer").textContent = t;
    document.querySelectorAll("[data-timer]").forEach((e) => (e.textContent = t));
    const urgent = ms < 10000 && ms > 0;
    $("#tb-timer").classList.toggle("urgent", urgent);
    const sec = Math.ceil(ms / 1000);
    if (urgent && sec !== lastTickSec && sec <= 5) A.play("tick");
    lastTickSec = sec;
  } else if ($("#tb-timer")) { $("#tb-timer").textContent = ""; $("#tb-timer").classList.remove("urgent"); }
  tickReveal();
  hostTick();
  checkHostAlive();
}, 250);

// ---------------------------------------------------------------------
// ARBITRE (seul le navigateur de l'hôte exécute ce code)
// ---------------------------------------------------------------------
const H = { active: false, state: null, priv: null, inputs: {}, inUnsub: {}, lastReady: "", busy: false, draftTurnAt: 0 };
async function becomeHost() {
  H.active = true;
  H.state = await net.readState(L.code).catch(() => null);
  if (H.state && H.state.phase && H.state.phase !== "lobby") {
    H.priv = {};
    for (const [u, p] of Object.entries(H.state.seats || {})) {
      if (H.priv[p]) continue;
      H.priv[p] = (await net.readPrivate(L.code, u).catch(() => null)) || { used: [], objOffer: [], objectives: [], dilemma: null };
    }
    // ordinateur
    for (const p of H.state.order) if (!H.priv[p]) H.priv[p] = { used: [], objOffer: [], objectives: [], dilemma: null };
    if (H.state.phase !== "end") toast("Tu es maintenant l'arbitre de la partie (ton navigateur calcule les manches).", "#D9A441");
  } else H.state = null;
  syncInputListeners();
  keepAwake();
}
// l'arbitre garde son écran allumé (sur téléphone, un écran éteint mettrait la partie en pause)
let wakeLock = null;
async function keepAwake() { try { if (H.active && !wakeLock && navigator.wakeLock && document.visibilityState === "visible") { wakeLock = await navigator.wakeLock.request("screen"); wakeLock.addEventListener("release", () => (wakeLock = null)); } } catch {} }
document.addEventListener("visibilitychange", keepAwake);
function stopHost() { H.active = false; Object.values(H.inUnsub).forEach((u) => u()); H.inUnsub = {}; H.state = null; H.priv = null; }
function syncInputListeners() {
  for (const u of Object.keys(L.members)) if (!H.inUnsub[u]) H.inUnsub[u] = net.listenInput(L.code, u, (o) => { H.inputs[u] = o || {}; });
}
function pidInputs() {
  const r = {};
  if (!H.state) return r;
  for (const [u, o] of Object.entries(H.inputs)) { const p = H.state.seats && H.state.seats[u]; if (p) r[p] = { ...(r[p] || {}), ...o }; }
  return r;
}
function hostWrite(privToo = false) {
  H.state.seq = (H.state.seq || 0) + 1;
  net.writeState(L.code, H.state).catch((e) => console.error("écriture état", e));
  if (privToo) for (const [u, p] of Object.entries(H.state.seats || {})) net.writePrivate(L.code, u, H.priv[p] || {}).catch((e) => console.error(e));
}
function hostStart(opts = {}) {
  if (!(L.meta && L.meta.host === net.uid)) return;
  const list = Object.entries(L.members).filter(([, m]) => m.name && m.online !== false).sort((a, b) => (a[1].joined || 0) - (b[1].joined || 0)).slice(0, 4);
  const ais = Object.entries((L.meta && L.meta.ais) || {});
  const fill = opts.fill !== false;
  if (list.length + ais.length < 2 && !fill) return;
  const used = new Set(ais.map(([, a]) => a.house));
  const players = list.map(([u, m]) => {
    let house = m.house && !used.has(m.house) ? m.house : HUMAN_HOUSES.find((h) => !used.has(h));
    used.add(house);
    return { pid: u, name: m.name, house, hname: m.hname };
  });
  for (const [k, a] of ais) if (players.length < 4) players.push({ pid: k, name: a.name, house: a.house, isBot: true, ai: a.ai });
  // on complète toujours à 4 seigneurs : plus d'alliances, plus de trahisons
  if (fill) {
    const usedP = players.filter((p) => p.ai).map((p) => p.ai);
    for (const h of HUMAN_HOUSES) {
      if (players.length >= 4) break;
      if (players.some((p) => p.house === h)) continue;
      const pers = ["conquerant", "intrigant", "prudent"].find((x) => !usedP.includes(x)) || ["conquerant", "intrigant", "prudent"][Math.floor(Math.random() * 3)];
      usedP.push(pers);
      players.push({ pid: `ia-${h}`, name: aiName(pers), house: h, isBot: true, ai: pers });
    }
  }
  if (players.length === 2) players.push({ pid: "bot-anglais", name: "Édouard", house: "anglais", isBot: true });
  const tutorial = !!opts.tutorial, randomDraft = !!opts.randomDraft;
  const { state, priv } = E.createGame({ players, tutorial, randomDraft, code: L.code, rounds: +opts.rounds || 10 }, Math.random);
  state.solo = SOLO; // en solo : pas de chrono, on attend que tu valides
  state.timer = SOLO ? "none" : opts.timer || "none";
  state.gameId = Math.random().toString(36).slice(2, 10);
  state.seats = {};
  players.filter((p) => !p.isBot).forEach((p) => (state.seats[p.pid] = p.pid));
  state.deadline = net.now() + E.TIMES.objectives * 1000 * ({ relaxed: 2, normal: 1, fast: 0.7 }[state.timer] || 1) * SPEED;
  state.ready = {};
  H.state = state; H.priv = priv;
  hostWrite(true);
}
function hostReplay() {
  if (!H.active) return;
  H.state = { phase: "lobby", seq: (H.state ? H.state.seq : 0) + 1 };
  H.priv = null;
  net.writeState(L.code, H.state);
}
function hostTick() {
  if (!H.active || !H.state || !H.state.phase || H.state.phase === "lobby" || H.busy) return;
  const st = H.state, now = net.now(), I = pidInputs();
  const m = ({ relaxed: 2, normal: 1, fast: 0.7 }[st.timer] || 1) * SPEED;
  const noClock = st.solo || st.timer === "none" || !st.timer;
  const humans = st.order.filter((p) => !st.players[p].isBot);
  // reprise de siège (changement d'appareil)
  let changed = false, privChanged = false;
  for (const [u, mem] of Object.entries(L.members)) {
    if (mem.claim && !st.seats[u] && st.players[mem.claim] && !st.players[mem.claim].isBot) {
      const holders = Object.entries(st.seats).filter(([, p]) => p === mem.claim).map(([x]) => x);
      if (!holders.some((x) => L.members[x] && L.members[x].online !== false)) { st.seats[u] = mem.claim; changed = true; privChanged = true; }
    }
  }
  // joueurs prêts
  const ready = {};
  for (const p of humans) {
    const i = I[p] || {};
    if (st.phase === "objectives") ready[p] = (i.objPick || []).length === 2;
    if (st.phase === "placement") ready[p] = !!(i.placement && i.placement.ok);
    if (st.phase === "dilemma") ready[p] = ["dilemma", "dilemma2"].every((k) => !H.priv[p][k] || (i[k] && i[k].round === st.round));
    if (st.phase === "reveal") ready[p] = !!(i.revdone && i.revdone.round === st.round);
    if (st.phase === "orders") ready[p] = !!(i.orders && i.orders.round === st.round && i.orders.sealed);
    if (st.phase === "interlude") ready[p] = !!(i.next && i.next.round === st.round);
  }
  const rk = JSON.stringify(ready);
  if (rk !== H.lastReady) { H.lastReady = rk; st.ready = ready; changed = true; }
  const allReady = humans.every((p) => ready[p]);
  // propositions de mariage
  if (st.phase === "dilemma" || st.phase === "orders") {
    st.proposals = st.proposals || {};
    for (const p of humans) {
      const of = I[p] && I[p].offers;
      if (!of || of.round !== st.round) continue;
      for (const it of of.items || []) {
        const key = `${it.kind}:${p}__${it.to}`;
        if (!st.proposals[key] && E.canPropose(st, p, it.to, it.kind)) { st.proposals[key] = { kind: it.kind, from: p, to: it.to }; changed = true; }
      }
    }
  }
  const late = () => H.force || (!noClock && now > st.deadline);
  const go = (phaseDeadlineSec) => { st.deadline = now + phaseDeadlineSec * 1000 * m; st.ready = {}; H.lastReady = ""; H.force = false; };
  try {
    switch (st.phase) {
      case "objectives":
        if (allReady || late()) {
          E.finishObjectives(st, H.priv, I);
          E.startDraft(st, Math.random);
          if (E.draftDone(st)) { E.finishDraft(st, Math.random); go(E.TIMES.placement); }
          else { go(E.TIMES.draft); H.draftTurnAt = now; }
          hostWrite(true); return;
        }
        break;
      case "draft": {
        const cur = E.currentDrafter(st);
        let prov = null;
        if (st.players[cur].isBot) { if (now - H.draftTurnAt > 900) prov = E.autoPickProvince(st, cur, Math.random); }
        else {
          const dp = I[cur] && I[cur].draftPick;
          if (dp && dp.idx === st.draft.idx && st.provinces[dp.prov] && !st.provinces[dp.prov].owner) prov = dp.prov;
          else if (late()) prov = E.autoPickProvince(st, cur, Math.random);
        }
        if (prov) {
          E.draftPick(st, cur, prov);
          H.draftTurnAt = now;
          if (E.draftDone(st)) { E.finishDraft(st, Math.random); go(E.TIMES.placement); } else go(E.TIMES.draft);
          hostWrite(); return;
        }
        break;
      }
      case "placement":
        if (allReady || late()) {
          E.finishPlacement(st, I);
          E.startRound(st, H.priv, Math.random);
          go(E.TIMES.dilemma);
          hostWrite(true); return;
        }
        break;
      case "dilemma":
        if (allReady || late()) {
          E.finishDilemmas(st, H.priv, I, Math.random);
          go(E.ordersTime(st.round));
          hostWrite(true); return;
        }
        break;
      case "orders":
        if (allReady || late()) {
          E.resolveRound(st, H.priv, I, Math.random);
          st.revealStart = now + 2700;
          // chacun suit la révélation à son rythme ; sans chrono on attend que tout le monde ait fini
          st.deadline = now + 2700 + st.reveal.steps.length * 9000 * SPEED + 30000 * SPEED;
          st.ready = {}; H.lastReady = "";
          hostWrite(true); return;
        }
        break;
      case "reveal":
        if (allReady || H.force || (!noClock && now > st.deadline)) { H.force = false; st.phase = "interlude"; st.deadline = now + E.TIMES.interlude * 1000 * SPEED; st.ready = {}; H.lastReady = ""; hostWrite(); return; }
        break;
      case "interlude":
        if (allReady || H.force || now > st.deadline) {
          H.force = false;
          if (st.gameOver) { E.finishGame(st, H.priv); st.deadline = 0; }
          else { E.startRound(st, H.priv, Math.random); go(E.TIMES.dilemma); }
          hostWrite(true); return;
        }
        break;
    }
  } catch (e) {
    console.error("Erreur d'arbitrage", e);
    toast("Erreur d'arbitrage : " + esc(e.message), "#8E1B1B", 8000);
    H.busy = true; setTimeout(() => (H.busy = false), 3000);
  }
  if (changed) hostWrite(privChanged);
}
// si l'hôte disparaît plus de 12 s, le premier joueur en ligne reprend l'arbitrage
let hostGoneSince = 0;
function checkHostAlive() {
  if (!L.code || !L.meta || !L.meta.host || H.active) { hostGoneSince = 0; return; }
  const host = L.members[L.meta.host];
  const online = host && host.online !== false;
  if (online) { hostGoneSince = 0; return; }
  if (!hostGoneSince) { hostGoneSince = Date.now(); return; }
  if (Date.now() - hostGoneSince < 12000) return;
  const seated = L.state && L.state.seats ? Object.keys(L.state.seats) : Object.keys(L.members);
  const candidates = Object.keys(L.members).filter((u) => L.members[u].online !== false && (seated.includes(u) || !L.state)).sort();
  if (candidates[0] === net.uid) { hostGoneSince = 0; net.setHost(L.code, net.uid); }
}

// ---------------------------------------------------------------------
// boutons globaux et démarrage
// ---------------------------------------------------------------------
$("#btn-mute").onclick = () => { A.unlock(); A.setMuted(!A.isMuted()); renderTop(); };
$("#btn-rules").onclick = () => openModal("rules");
function quitGame() {
  if (!confirm("Quitter cette partie et revenir à l'accueil ?\n\nEn ligne, tu pourras la reprendre depuis l'accueil tant qu'elle existe.")) return;
  try { speechSynthesis.cancel(); } catch {}
  location.href = location.pathname + (new URLSearchParams(location.search).has("test") ? "?test" : "");
}
$("#btn-quit").onclick = quitGame;
function narratorIcon() { $("#btn-narr").innerHTML = `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M6 4h11a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 9h8M8 13h6" stroke="currentColor" stroke-width="2"/>${narrator ? "" : '<path d="M3 21L21 3" stroke="#D94A3A" stroke-width="2.4"/>'}</svg>`; $("#btn-narr").title = narrator ? "Narrateur activé (lit la révélation à voix haute)" : "Narrateur coupé"; }
$("#btn-narr").onclick = () => { narrator = !narrator; store.set("sn_narrator", narrator ? "1" : "0"); narratorIcon(); toast(narrator ? "Le narrateur lira la révélation à voix haute." : "Narrateur coupé.", "#D9A441", 2500); if (narrator) speak("Le narrateur est prêt."); };
narratorIcon();
$("#btn-taunt").onclick = (e) => {
  e.stopPropagation();
  const pop = $("#taunt-pop");
  pop.innerHTML = TAUNTS.map((t) => `<button data-taunt="${esc(t)}">${esc(t)}</button>`).join("");
  pop.classList.toggle("hidden");
  pop.querySelectorAll("button").forEach((b) => (b.onclick = () => { if (me()) net.sendTaunt(L.code, { pid: me(), text: b.dataset.taunt }); pop.classList.add("hidden"); }));
};
document.addEventListener("click", (e) => { if (!e.target.closest("#taunt-pop") && !e.target.closest("#btn-taunt")) $("#taunt-pop").classList.add("hidden"); });
document.querySelectorAll("#side-tabs button").forEach((b) => (b.onclick = () => { L.ui.tab = b.dataset.tab; render(); }));
document.addEventListener("pointerdown", () => A.unlock(), { once: true });

(async function start() {
  initHome();
  try { await net.init(); }
  catch (e) { console.error(e); $("#home-msg").textContent = "Connexion impossible au serveur de jeu. Vérifie ta connexion internet."; return; }
  const params = new URLSearchParams(location.search);
  const saved = (params.get("r") || store.get("sn_room") || "").toUpperCase();
  if (saved && store.get("sn_name") && !params.has("test")) {
    const meta = await net.roomExists(saved).catch(() => null);
    if (meta) {
      const members = await new Promise((res) => { const u = net.listen(saved, `members/${net.uid}`, (m) => { u(); res(m); }); });
      if (members) {
        // lien partagé (?r=) : on rentre directement ; sinon on propose de reprendre, sans forcer
        if (params.get("r")) { await net.joinRoom(saved, { name: store.get("sn_name") }); enterRoom(saved); return; }
        $("#home-msg").insertAdjacentHTML("beforebegin", `<div class="resume-box"><button id="btn-resume" class="btn btn-block">Reprendre la partie en cours (${esc(saved)})</button></div>`);
        $("#btn-resume").onclick = async () => { await net.joinRoom(saved, { name: store.get("sn_name") }); enterRoom(saved); };
      }
    } else store.set("sn_room", "");
  }
  show("home");
})();
