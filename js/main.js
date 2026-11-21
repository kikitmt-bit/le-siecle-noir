// LE SIÈCLE NOIR — application : branche les boutons et démarre
import * as A from "./audio.js?v=1795296252";
import { TAUNTS } from "./content.js?v=1795296252";
import { $, L, esc, me, narrator, net, setNarrator, store } from "./state.js?v=1795296252";
import { narratorIcon, speak } from "./ui/announce.js?v=1795296252";
import { show, toast } from "./ui/common.js?v=1795296252";
import { enterRoom, initHome, quitGame } from "./ui/lobby.js?v=1795296252";
import { openModal } from "./ui/overlays.js?v=1795296252";
import { render, renderTop } from "./ui/render.js?v=1795296252";
import "./ui/clock.js?v=1795295940"; // boucle de temps (effets au chargement)

// ---------------------------------------------------------------------
// boutons globaux et démarrage
// ---------------------------------------------------------------------
$("#btn-mute").onclick = () => { A.unlock(); A.setMuted(!A.isMuted()); renderTop(); };

$("#btn-rules").onclick = () => openModal("rules");

$("#btn-quit").onclick = quitGame;

$("#btn-narr").onclick = () => { setNarrator(!narrator); store.set("sn_narrator", narrator ? "1" : "0"); narratorIcon(); toast(narrator ? "Le narrateur lira la révélation à voix haute." : "Narrateur coupé.", "#D9A441", 2500); if (narrator) speak("Le narrateur est prêt."); };

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
