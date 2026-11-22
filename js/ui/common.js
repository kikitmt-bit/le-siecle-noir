// Petits outils d'interface : affichage, toasts, bulles d'aide
import { HOUSES } from "../content.js?v=1795376900";
import { $, L, S, esc, net, store } from "../state.js?v=1795376900";

// ---------------------------------------------------------------------
// utilitaires d'interface
// ---------------------------------------------------------------------
export function show(screen) { for (const s of ["home", "lobby", "game"]) $(`#screen-${s}`).classList.toggle("hidden", s !== screen); }

export function toast(html, color = "#75603F", ms = 5000) {
  const t = document.createElement("div");
  t.className = "toast"; t.style.borderLeftColor = color; t.innerHTML = html;
  $("#toasts").appendChild(t);
  setTimeout(() => t.remove(), ms);
}

export function houseName(pid) { const p = S() && S().players[pid]; return p ? p.hname || HOUSES[p.house].name : "?"; }

export function houseColor(pid) { const p = S() && S().players[pid]; return p ? HOUSES[p.house].color : "#75603F"; }

export function fmtTime(ms) { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; }

export function setInput(field, value) { if (!L.code) return; L.myInput[field] = value; net.setInput(L.code, field, value).catch((e) => console.warn(e)); }

export function tuto(key, title, text) {
  if (!S() || !S().tutorial) return;
  const k = `sn_tuto_${S().gameId || L.code}_${key}`;
  if (store.get(k)) return;
  if (L.tutoQueue.some((t) => t.key === key)) return;
  L.tutoQueue.push({ key, title, text, k });
  renderTuto();
}

export function renderTuto() {
  const el = $("#tuto");
  const t = L.tutoQueue[0];
  if (!t) { el.classList.add("hidden"); return; }
  el.innerHTML = `<h4>${esc(t.title)}</h4><p>${t.text}</p><button class="btn btn-small btn-dark" id="tuto-ok">Compris</button>`;
  el.classList.remove("hidden");
  $("#tuto-ok").onclick = () => { store.set(t.k, "1"); L.tutoQueue.shift(); renderTuto(); };
}

// dernière manche : les scores restent cachés jusqu'au Couronnement (cartes « ambitions secrètes » et « décompte »)
export function scoresHidden(st) {
  if (!st || st.round !== st.maxRounds || st.phase === "end") return false;
  if (st.phase === "reveal" && st.reveal && st.reveal.cards) { const c = st.reveal.cards[st.revCard || 0]; if (c && (c.type === "objectives" || c.type === "final")) return false; }
  return true;
}

// le sceau de cire : il s'imprime au centre de l'écran quand on scelle un choix ou ses ordres (moins d'une seconde)
export const SEAL_SVG = `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 2.5c2 0 2.6 1.6 4.4 2.2 1.8.6 3.4-.4 4.8.9 1.3 1.3.4 3 1 4.8.6 1.8 2.3 2.5 2.3 4.6s-1.7 2.7-2.3 4.5c-.6 1.8.3 3.5-1 4.8-1.3 1.3-3 .3-4.8.9-1.8.6-2.4 2.3-4.4 2.3s-2.6-1.7-4.4-2.3c-1.8-.6-3.5.4-4.8-.9-1.3-1.3-.3-3-.9-4.8C3.3 17.7 1.7 17 1.7 15s1.6-2.8 2.2-4.6c.6-1.8-.3-3.5 1-4.8 1.3-1.3 3-.3 4.7-.9C11.4 4.1 14 2.5 16 2.5z" fill="#7E1712"/><circle cx="16" cy="15.5" r="8" fill="none" stroke="#C2493E" stroke-width="1.2"/><path d="M16 10.5l1.5 3.2 3.4.3-2.6 2.3.8 3.4-3.1-1.8-3.1 1.8.8-3.4-2.6-2.3 3.4-.3z" fill="#C2493E"/></svg>`;
export function sealStamp() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  document.querySelectorAll(".seal-press").forEach((x) => x.remove());
  const el = document.createElement("div");
  el.className = "seal-press"; el.innerHTML = SEAL_SVG;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}
// le même sceau, qui se brise en deux quand une carte s'ouvre
export function sealBreakHtml() { return `<div class="seal-break" aria-hidden="true"><span class="sb-l">${SEAL_SVG}</span><span class="sb-r">${SEAL_SVG}</span></div>`; }
