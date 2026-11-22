// LE SIÈCLE NOIR — application : branche les boutons et démarre
import * as A from "./audio.js?v=1795376900";
import { TAUNTS } from "./content.js?v=1795376900";
import { $, L, esc, me, narrator, net, setNarrator, store } from "./state.js?v=1795376900";
import { narratorIcon, speak } from "./ui/announce.js?v=1795376900";
import { show, toast } from "./ui/common.js?v=1795376900";
import { refreshGames } from "./ui/games.js?v=1795376900";
import { enterRoom, initHome, quitGame, resumeGame } from "./ui/lobby.js?v=1795376900";
import { openModal } from "./ui/overlays.js?v=1795376900";
import { render, renderTop } from "./ui/render.js?v=1795376900";
import "./ui/clock.js?v=1795376900"; // boucle de temps (effets au chargement)
import { uiBack } from "./ui/maporders.js?v=1795376900";

// ---------------------------------------------------------------------
// boutons globaux et démarrage
// ---------------------------------------------------------------------
$("#btn-mute").onclick = () => { A.unlock(); A.setMuted(!A.isMuted()); renderTop(); };
$("#btn-amb").onclick = () => { A.unlock(); A.setAmbience(!A.isAmbience()); renderTop(); toast(A.isAmbience() ? "Ambiance : le feu crépite dans la cheminée." : "Ambiance coupée.", "#75603F", 2000); };

$("#btn-rules").onclick = () => openModal("rules");

$("#btn-quit").onclick = quitGame;

// plein écran (pratique sur console ou sur la télé)
$("#btn-full").onclick = () => {
  try {
    if (document.fullscreenElement) document.exitFullscreen();
    else (document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen).call(document.documentElement);
  } catch (e) { toast("Le plein écran n'est pas disponible sur cet appareil.", "#75603F"); }
};

// Le bouton B de la manette Xbox est le « retour » du navigateur : en partie, il ne doit jamais faire quitter le jeu.
// On garde quelques entrées d'historique « tampon » au-dessus de la page, posées seulement pendant un vrai geste
// (clic, touche, toucher) : Chrome et Edge sautent les entrées posées sans geste, ce qui faisait quitter le jeu au 2e appui.
// Chaque retour ferme la fenêtre ouverte ou revient d'un pas dans l'ordre en cours, sinon il ne fait rien.
const GUARD = 4;
function armBack() { if (!L.code) return; const d = (history.state && history.state.sn) || 0; try { for (let i = d + 1; i <= GUARD; i++) history.pushState({ sn: i }, ""); } catch {} }
["pointerdown", "keydown", "touchend"].forEach((t) => document.addEventListener(t, armBack, true));
let lastBack = 0;
function backOnce() {
  const now = Date.now(); if (now - lastBack < 400) return; // sur Xbox, B arrive deux fois : retour du navigateur et manette
  lastBack = now;
  if (!uiBack()) toast("Pour quitter la partie, utilise le bouton « Quitter » en haut à droite.", "#75603F", 3000);
}
window.addEventListener("popstate", () => { if (L.code) backOnce(); });
// dernier filet : quitter la page en pleine partie demande confirmation (sauf en test et en passant par « Quitter »)
const TEST = new URLSearchParams(location.search).has("test");
window.addEventListener("beforeunload", (e) => { if (L.code && !L.leaving && !TEST && L.state && L.state.phase !== "lobby") { e.preventDefault(); e.returnValue = ""; } });
// manette branchée sur PC (où B n'est pas le retour du navigateur) : même effet
window.addEventListener("gamepadconnected", () => {
  let was = false;
  const poll = () => {
    const gp = [...(navigator.getGamepads ? navigator.getGamepads() : [])].find(Boolean);
    const b = gp && gp.buttons[1] && gp.buttons[1].pressed;
    if (b && !was && L.code) backOnce();
    was = !!b; requestAnimationFrame(poll);
  };
  poll();
});

$("#btn-narr").onclick = () => { setNarrator(!narrator); store.set("sn_narrator", narrator ? "1" : "0"); narratorIcon(); toast(narrator ? "Le narrateur lira la révélation à voix haute." : "Narrateur coupé.", "#A9843A", 2500); if (narrator) speak("Le narrateur est prêt."); };

narratorIcon();

$("#btn-taunt").onclick = (e) => {
  e.stopPropagation();
  const pop = $("#taunt-pop");
  pop.innerHTML = TAUNTS.map((t) => `<button data-taunt="${esc(t)}">${esc(t)}</button>`).join("");
  pop.classList.toggle("hidden");
  pop.querySelectorAll("button").forEach((b) => (b.onclick = () => { if (me()) net.sendTaunt(L.code, { pid: me(), text: b.dataset.taunt }); pop.classList.add("hidden"); }));
};

document.addEventListener("click", (e) => { if (!e.target.closest("#taunt-pop") && !e.target.closest("#btn-taunt")) $("#taunt-pop").classList.add("hidden"); });

// « Ma maison » et « Chronique » s'ouvrent en grand (fiche plein écran), les autres onglets restent dans le panneau
document.querySelectorAll("#side-tabs button").forEach((b) => (b.onclick = () => {
  if (b.dataset.tab === "house") { if (me()) { L.ui.viewHouse = me(); openModal("house"); } return; }
  if (b.dataset.tab === "log") { openModal("chronicle"); return; }
  L.ui.tab = b.dataset.tab; render();
}));

document.addEventListener("pointerdown", () => A.unlock(), { once: true });


(async function start() {
  initHome();
  try { await net.init(); }
  catch (e) { console.error(e); $("#home-msg").textContent = "Connexion impossible au serveur de jeu. Vérifie ta connexion internet."; return; }
  // lien d'invitation (?r=CODE) : si on est déjà dans cette partie, on y rentre directement
  const r = (new URLSearchParams(location.search).get("r") || "").toUpperCase();
  if (r && store.get("sn_name")) {
    const meta = await net.roomExists(r).catch(() => null);
    const member = meta && await new Promise((res) => { const u = net.listen(r, `members/${net.uid}`, (m) => { u(); res(m); }); });
    if (member) { await net.joinRoom(r, { name: store.get("sn_name") }); enterRoom(r); return; }
  }
  show("home");
  refreshGames(resumeGame); // « Tes parties en cours »
})();

// Appli installable : le service worker (« réseau d'abord ») ne sert qu'à garder une copie de secours hors connexion
if ("serviceWorker" in navigator && !new URLSearchParams(location.search).has("test")) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch((e) => console.warn("service worker", e)));
}
