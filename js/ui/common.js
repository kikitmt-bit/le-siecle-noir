// Petits outils d'interface : affichage, toasts, bulles d'aide
import { HOUSES } from "../content.js?v=1795297295";
import { $, L, S, esc, net, store } from "../state.js?v=1795297295";

// ---------------------------------------------------------------------
// utilitaires d'interface
// ---------------------------------------------------------------------
export function show(screen) { for (const s of ["home", "lobby", "game"]) $(`#screen-${s}`).classList.toggle("hidden", s !== screen); }

export function toast(html, color = "#6B5638", ms = 5000) {
  const t = document.createElement("div");
  t.className = "toast"; t.style.borderLeftColor = color; t.innerHTML = html;
  $("#toasts").appendChild(t);
  setTimeout(() => t.remove(), ms);
}

export function houseName(pid) { const p = S() && S().players[pid]; return p ? p.hname || HOUSES[p.house].name : "?"; }

export function houseColor(pid) { const p = S() && S().players[pid]; return p ? HOUSES[p.house].color : "#6B5638"; }

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
