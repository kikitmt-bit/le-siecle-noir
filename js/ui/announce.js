// Écrans d'annonce animés, compte à rebours, narrateur vocal
import * as A from "../audio.js?v=1795378288";
import * as E from "../engine.js?v=1795378288";
import { $, L, S, me, narrator } from "../state.js?v=1795378288";

// ---- écrans d'annonce animés ----
export function splash(st) {
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

export function countdown(st) {
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

export function speak(text) {
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

export function playNewsSounds(st) {
  const kinds = new Set((st.news || []).map((n) => n.kind));
  if (kinds.has("death")) setTimeout(() => A.play("knell"), 400);
  else if (kinds.has("plague")) setTimeout(() => A.play("plague"), 400);
  else if (kinds.has("birth")) setTimeout(() => A.play("birth"), 400);
  const pid = me();
  if (pid && (st.news || []).some((n) => n.kind === "death" && n.pid === pid)) A.vibrate([200, 100, 200]);
}

export function restoreOrders() {
  const o = L.myInput.orders;
  if (o && o.round === S().round && !L.ui.orders.length) { L.ui.orders = o.actions || []; L.ui.feast = !!o.feast; }
}

export function narratorIcon() { $("#btn-narr").innerHTML = `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M6 4h11a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 9h8M8 13h6" stroke="currentColor" stroke-width="2"/>${narrator ? "" : '<path d="M3 21L21 3" stroke="#D94A3A" stroke-width="2.4"/>'}</svg>`; $("#btn-narr").title = narrator ? "Narrateur activé (lit la révélation à voix haute)" : "Narrateur coupé"; }
