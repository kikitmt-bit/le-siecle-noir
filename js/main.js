// LE SIÈCLE NOIR — application : branche les boutons et démarre
import * as A from "./audio.js?v=1795363044";
import { TAUNTS } from "./content.js?v=1795363044";
import { $, L, esc, me, narrator, net, setNarrator, store } from "./state.js?v=1795363044";
import { narratorIcon, speak } from "./ui/announce.js?v=1795363044";
import { show, toast } from "./ui/common.js?v=1795363044";
import { refreshGames } from "./ui/games.js?v=1795363044";
import { enterRoom, initHome, quitGame, resumeGame } from "./ui/lobby.js?v=1795363044";
import { openModal } from "./ui/overlays.js?v=1795363044";
import { render, renderTop } from "./ui/render.js?v=1795363044";
import "./ui/clock.js?v=1795363044"; // boucle de temps (effets au chargement)

// ---------------------------------------------------------------------
// boutons globaux et démarrage
// ---------------------------------------------------------------------
$("#btn-mute").onclick = () => { A.unlock(); A.setMuted(!A.isMuted()); renderTop(); };

$("#btn-rules").onclick = () => openModal("rules");

$("#btn-quit").onclick = quitGame;

// plein écran (pratique sur console ou sur la télé)
$("#btn-full").onclick = () => {
  try {
    if (document.fullscreenElement) document.exitFullscreen();
    else (document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen).call(document.documentElement);
  } catch (e) { toast("Le plein écran n'est pas disponible sur cet appareil.", "#75603F"); }
};

// Le bouton B de la manette Xbox (et le bouton « retour » du navigateur) ne doit pas faire quitter la partie par erreur :
// en partie, le retour arrière ferme seulement la fenêtre ouverte, ou ne fait rien.
function guardBack() { if (L.code) history.pushState({ sn: 1 }, ""); }
window.addEventListener("popstate", () => {
  if (!L.code) return;
  history.pushState({ sn: 1 }, "");
  const open = document.querySelector("#modal:not(.hidden), #overlay:not(.hidden), #popover:not(.hidden)");
  if (open) { const btn = open.querySelector("#md-close, #ov-close, .pop-x"); if (btn) btn.click(); else open.classList.add("hidden"); }
  else toast("Pour quitter la partie, utilise le bouton « Quitter » en haut à droite.", "#75603F", 3000);
});
document.addEventListener("click", guardBack, { once: true });
// manette : B ferme une fenêtre (sans quitter la page)
window.addEventListener("gamepadconnected", () => {
  let was = false;
  const poll = () => {
    const gp = [...(navigator.getGamepads ? navigator.getGamepads() : [])].find(Boolean);
    const b = gp && gp.buttons[1] && gp.buttons[1].pressed;
    if (b && !was) { const open = document.querySelector("#modal:not(.hidden), #overlay:not(.hidden)"); const btn = open && open.querySelector("#md-close, #ov-close"); if (btn) btn.click(); }
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

document.querySelectorAll("#side-tabs button").forEach((b) => (b.onclick = () => { L.ui.tab = b.dataset.tab; render(); }));

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
