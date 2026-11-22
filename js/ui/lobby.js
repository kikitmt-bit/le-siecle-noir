// Accueil, création, salon de la partie, quitter
import * as A from "../audio.js?v=1795381958";
import { HOUSE_POWERS, HOUSES, HUMAN_HOUSES } from "../content.js?v=1795381958";
import * as E from "../engine.js?v=1795381958";
import { hostStart, stopHost } from "../host.js?v=1795381958";
import * as local from "../localnet.js?v=1795381958";
import { $, H, L, SOLO, esc, net, setNet, setSolo, store } from "../state.js?v=1795381958";
import { show, toast } from "./common.js?v=1795381958";
import { shield } from "./draw.js?v=1795381958";
import { dropGame, loadGames, noteGame, renderGames } from "./games.js?v=1795381958";
import { onMembers, onMeta, onState, onTaunts, onWhispers } from "./inbox.js?v=1795381958";
import { palmaresHtml } from "./overlays.js?v=1795381958";
import { render } from "./render.js?v=1795381958";
import { qrSvg } from "./qr.js?v=1795381958";

// ---------------------------------------------------------------------
// ACCUEIL ET SALON
// ---------------------------------------------------------------------
export function initHome() {
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

export function nameOk() {
  const n = ($("#in-name").value || "").trim();
  if (!n) { $("#home-msg").textContent = "Donne d'abord un nom à ton seigneur."; $("#in-name").focus(); return null; }
  store.set("sn_name", n);
  store.set("sn_hname", E.cleanHouseName($("#in-hname").value) || "");
  return n;
}

export async function soloStart() {
  const name = nameOk(); if (!name) return;
  const n = +(document.querySelector('[data-solo][aria-pressed="true"]') || { dataset: { solo: 3 } }).dataset.solo;
  setSolo(true); setNet(local);
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

export function aiName(p) { return { conquerant: "Le Conquérant", intrigant: "L'Intrigant", prudent: "Le Prudent" }[p] || "Ordinateur"; }

export async function createGame() {
  const name = nameOk(); if (!name) return;
  $("#home-msg").textContent = "Fondation du royaume…";
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 10; i++) { code = Array.from({ length: 4 }, () => letters[Math.floor(Math.random() * letters.length)]).join(""); if (!(await net.roomExists(code))) break; }
  try { await net.createRoom(code, { name, house: null, hname: store.get("sn_hname") || "", joined: Date.now() }); enterRoom(code); }
  catch (e) { console.error(e); $("#home-msg").textContent = "Impossible de créer la partie (connexion ?)."; }
}

export async function joinGame(code, silent = false) {
  if (!/^[A-Z]{4}$/.test(code)) { if (!silent) $("#home-msg").textContent = "Le code fait 4 lettres."; return; }
  const name = silent ? store.get("sn_name") : nameOk(); if (!name) return;
  const meta = await net.roomExists(code).catch(() => null);
  if (!meta) { if (!silent) $("#home-msg").textContent = "Aucune partie avec ce code."; return; }
  try { await net.joinRoom(code, { name, hname: store.get("sn_hname") || "", joined: Date.now() }); enterRoom(code); }
  catch (e) { console.error(e); if (!silent) $("#home-msg").textContent = "Impossible de rejoindre."; }
}

export function enterRoom(code) {
  L.code = code; L.joinedAt = Date.now(); L.noted = false;
  if (!SOLO) { noteGame(code, { name: store.get("sn_name") || undefined }); history.replaceState(null, "", `${location.pathname}${new URLSearchParams(location.search).has("test") ? "?test" : ""}`); }
  // une entrée d'historique « tampon » : le bouton retour (ou B sur Xbox) ne fait pas quitter la partie
  try { history.pushState({ sn: 1 }, ""); } catch {}
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


// Reprendre une partie de la liste « Tes parties en cours »
export async function resumeGame(code) {
  const g = loadGames().find((x) => x.code === code) || {};
  const name = (store.get("sn_name") || g.name || "").trim();
  if (!name) { $("#home-msg").textContent = "Écris d'abord ton nom de seigneur, puis reprends la partie."; $("#in-name").focus(); return; }
  $("#in-name").value = name; store.set("sn_name", name);
  $("#home-msg").textContent = "Retour dans la partie…";
  try {
    const meta = await net.roomExists(code);
    if (!meta) { dropGame(code); renderGames(resumeGame); $("#home-msg").textContent = "Cette partie n'existe plus."; return; }
    await net.joinRoom(code, { name });
    $("#home-msg").textContent = "";
    enterRoom(code);
  } catch (e) { console.error(e); $("#home-msg").textContent = "Impossible de reprendre la partie (connexion ?)."; }
}

// La partie a été créée avec un format que ce jeu ne sait pas lire : on revient à l'accueil avec un message clair.
export function badFormat(prob, st) {
  const code = L.code;
  L.unsub.forEach((u) => u()); L.unsub = [];
  if (H.active) stopHost();
  L.code = null; L.state = null; L.meta = null; L.members = {};
  if (code) dropGame(code);
  show("home");
  renderGames(resumeGame);
  const v = (st && st.v) || 1;
  $("#home-msg").textContent = prob === "plus-recent"
    ? `Cette partie a été créée avec une version plus récente du jeu (format ${v}). Recharge la page pour avoir la dernière version (sur téléphone : ferme l'onglet et rouvre-le), puis rejoins-la de nouveau.`
    : `Cette partie a été créée avec une ancienne version du jeu (format ${v}) : elle n'est plus compatible avec la version actuelle (format ${E.FORMAT_VERSION}). Crée une nouvelle partie pour jouer.`;
}

// ---- choix des maisons à tour de rôle, dans un ordre tiré au sort par l'hôte ----
// meta.pickDraw = { id, order: [uid…] } ; un membre a choisi quand son « pick » porte l'id du tirage.
export function housePicked(meta, m) { const d = meta && meta.pickDraw; return !!(d && m && m.house && m.pick === d.id); }
export function pickTurn(meta, members) {
  const d = meta && meta.pickDraw;
  if (!d) return null;
  const online = (u) => members[u] && members[u].online !== false;
  const next = (d.order || []).find((u) => online(u) && !housePicked(meta, members[u]));
  if (next) return next;
  // les retardataires choisissent ensuite, dans l'ordre d'arrivée
  return Object.entries(members).filter(([u, m]) => online(u) && !housePicked(meta, m)).sort((a, b) => (a[1].joined || 0) - (b[1].joined || 0)).map(([u]) => u)[0] || null;
}

export function renderLobby() {
  if (L.state && L.state.phase && L.state.phase !== "lobby") return;
  show("lobby");
  $("#lobby-code").textContent = L.code;
  // QR code de l'invitation : sur la télé, les amis rejoignent en scannant l'écran
  const inv = inviteUrl();
  if ($("#lobby-qr").dataset.url !== inv) { $("#lobby-qr").dataset.url = inv; $("#lobby-qr").innerHTML = qrSvg(inv, { size: 196 }); }
  const mine = L.members[net.uid] || {};
  const meta = L.meta || {}, draw = meta.pickDraw;
  const isHost0 = meta.host === net.uid;
  const turn = SOLO ? net.uid : pickTurn(meta, L.members);
  const myPick = SOLO ? mine.house : housePicked(meta, mine) ? mine.house : null;
  const taken = SOLO ? [] : Object.entries(L.members).filter(([u, m]) => u !== net.uid && m.online !== false && housePicked(meta, m)).map(([, m]) => m.house);
  const canPick = SOLO || (draw && turn === net.uid);
  const nm = (u) => esc((L.members[u] && L.members[u].name) || "?");
  $("#house-turn").innerHTML = SOLO ? "" : !draw
    ? (isHost0 ? `<button id="btn-draw" class="btn btn-red">Tirer au sort l'ordre de choix des maisons</button><p class="hint">Quand tout le monde est là. Chacun choisira sa maison à son tour.</p>` : `<p class="ptext">L'hôte va tirer au sort l'ordre de choix des maisons…</p>`)
    : `<ol class="pick-order">${(draw.order || []).filter((u) => L.members[u]).map((u) => { const m = L.members[u]; const done = housePicked(meta, m); return `<li class="${u === turn ? "cur" : ""} ${done ? "done" : ""}">${done ? shield(m.house, 20) : ""}<span>${nm(u)}${u === net.uid ? " (toi)" : ""}</span>${u === turn ? "<i>choisit…</i>" : ""}</li>`; }).join("")}</ol>
       <p class="ptext">${turn === net.uid ? "<b>À toi de choisir ta maison !</b>" : turn ? `Au tour de <b>${nm(turn)}</b>.` : "Toutes les maisons sont choisies. Les places libres iront à l'ordinateur."}</p>`;
  if ($("#btn-draw")) $("#btn-draw").onclick = () => {
    const order = Object.entries(L.members).filter(([, m]) => m.online !== false).map(([u]) => u).sort(() => Math.random() - 0.5);
    A.play("drum"); net.updateMeta(L.code, { pickDraw: { id: Math.random().toString(36).slice(2, 8), order } });
  };
  $("#house-pick").innerHTML = HUMAN_HOUSES.map((h) => `<button class="house-opt" data-h="${h}" aria-pressed="${myPick === h}" ${taken.includes(h) || (!canPick && myPick !== h) || (!SOLO && myPick && myPick !== h) ? "disabled" : ""}>${shield(h, 40)}${HOUSES[h].name}<small>${esc(HOUSES[h].motto)}</small><span class="hp-t">${esc(HOUSE_POWERS[h].title)}</span><span class="hp-g">${esc(HOUSE_POWERS[h].power)}</span><span class="hp-b">− ${esc(HOUSE_POWERS[h].weak)}</span></button>`).join("");
  $("#house-pick").querySelectorAll("button").forEach((b) => (b.onclick = () => { if (!canPick || myPick) return; A.play("seal"); net.updateMember(L.code, { house: b.dataset.h, pick: draw ? draw.id : null }); }));
  if (document.activeElement !== $("#lobby-hname")) $("#lobby-hname").value = mine.hname || "";
  $("#lobby-hname").onchange = () => { const v = E.cleanHouseName($("#lobby-hname").value) || ""; store.set("sn_hname", v); $("#lobby-hname").value = v; net.updateMember(L.code, { hname: v }); };
  const list = Object.entries(L.members).sort((a, b) => (a[1].joined || 0) - (b[1].joined || 0));
  const ais = (L.meta && L.meta.ais) || {};
  const isHost = L.meta && L.meta.host === net.uid;
  $("#lobby-members").innerHTML = list.map(([u, m]) => `<li>${(SOLO ? m.house : housePicked(meta, m)) ? shield(m.house, 24) : ""}<span>${esc(m.name || "?")}${m.hname ? ` <i>· maison ${esc(m.hname)}</i>` : ""}</span><span class="tag">${u === (L.meta && L.meta.host) ? "hôte" : ""}${m.online === false ? " · hors ligne" : ""}</span></li>`).join("")
    + Object.entries(ais).map(([k, a]) => `<li>${SOLO && a.house ? shield(a.house, 24) : ""}<span>${esc(a.name)}</span><span class="tag">ordinateur · maison restante${isHost ? ` <button class="btn btn-small" data-rmai="${k}" style="min-height:30px">Retirer</button>` : ""}</span></li>`).join("");
  document.querySelectorAll("[data-rmai]").forEach((b) => (b.onclick = () => { const a = { ...ais }; delete a[b.dataset.rmai]; net.updateMeta(L.code, { ais: a }); }));
  $("#lobby-ai").classList.toggle("hidden", !isHost || list.filter(([, m]) => m.online !== false).length + Object.keys(ais).length >= 4);
  $("#btn-add-ai").onclick = () => {
    const usedP = Object.values(ais).map((a) => a.ai);
    const pers = ["conquerant", "intrigant", "prudent"].find((x) => !usedP.includes(x)) || "intrigant";
    const k = ["ia-1", "ia-2", "ia-3"].find((x) => !ais[x]); if (!k) return;
    net.updateMeta(L.code, { ais: { ...ais, [k]: { name: aiName(pers), house: null, ai: pers } } });
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

// l'adresse d'invitation (lien partagé et QR code du salon)
export function inviteUrl() { return `${location.origin}${location.pathname}?r=${L.code}`; }

$("#btn-share").onclick = async () => {
  const url = inviteUrl();
  try { if (navigator.share && /Android|iPhone|iPad/i.test(navigator.userAgent)) await navigator.share({ title: "Le Siècle Noir", text: `Rejoins ma partie du Siècle Noir (code ${L.code})`, url }); else { await navigator.clipboard.writeText(url); toast("Lien copié. Envoie-le à tes amis."); } }
  catch { prompt("Copie ce lien :", url); }
};

$("#btn-start").onclick = () => { A.unlock(); hostStart({ tutorial: $("#opt-tuto").checked, randomDraft: $("#opt-random").checked, timer: $("#opt-timer").value, fill: $("#opt-fill").checked, rounds: $("#opt-rounds").value }); };

export function quitGame() {
  if (!confirm("Quitter cette partie et revenir à l'accueil ?\n\nEn ligne, tu pourras la reprendre depuis l'accueil tant qu'elle existe.")) return;
  try { speechSynthesis.cancel(); } catch {}
  L.leaving = true;
  location.href = location.pathname + (new URLSearchParams(location.search).has("test") ? "?test" : "");
}
