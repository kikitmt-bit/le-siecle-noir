// Carte SVG, zoom et déplacement
import * as A from "../audio.js?v=1795309716";
import { HOUSES } from "../content.js?v=1795309716";
import { LEGEND } from "../help.js?v=1795309716";
import { PROVINCES } from "../map.js?v=1795309716";
import { $, L, MAP, S, VIEW, esc } from "../state.js?v=1795309716";
import { hidePopover, provinceCard, showPopover } from "./aides.js?v=1795309716";
import { houseColor } from "./common.js?v=1795309716";

export function buildMap() {
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

export function provFill(owner) {
  if (!owner) return ["#D9C9A3", 1];
  const p = S().players[owner];
  return [p ? HOUSES[p.house].color : "#5A4A36", 0.5];
}

export function updateMap(provs) {
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
export function capMark(x, y, color, r = 14) {
  return `<g class="capmark" transform="translate(${x},${y})" pointer-events="none"><circle r="${r + 3}" fill="#2B1D12"/><circle r="${r + 1.5}" fill="#D9A441"/><circle r="${r - 1}" fill="${color}" stroke="#2B1D12" stroke-width="1"/><path transform="scale(${r / 14})" d="M-8,7 V-3 h2.6 v-3 h2.6 v3 h1.5 V-8 h2.6 v2.4 h2.6 V-3 h1.5 v-3 h2.6 v3 h0 V7 h-6 v-4 a2,2 0 0 0 -4,0 v4 Z" fill="#F6ECD6" stroke="#2B1D12" stroke-width="0.8"/></g>`;
}

export function drawArrows(list) {
  // list: [{from, to, color, dashed}]
  $("#m-arrows").innerHTML = list.map((a) => {
    const f = PROVINCES[a.from], t = PROVINCES[a.to];
    const mx = (f.cx + t.cx) / 2 + (t.cy - f.cy) * 0.15, my = (f.cy + t.cy) / 2 - (t.cx - f.cx) * 0.15;
    return `<path class="order-arrow" d="M${f.cx},${f.cy} Q${mx},${my} ${t.cx},${t.cy}" stroke="${a.color}" ${a.dashed ? 'stroke-dasharray="6 6"' : ""} marker-end="url(#${a.color === "#2B1D12" ? "ah-ink" : "ah-red"})" opacity="0.9"/>`;
  }).join("");
}

export function fx(kind, prov, color) {
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

export function applyView() { $("#map").setAttribute("viewBox", `${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`); }

export function zoomBy(f) { const cx = VIEW.x + VIEW.w / 2, cy = VIEW.y + VIEW.h / 2; VIEW.w = Math.max(260, Math.min(840, VIEW.w * f)); VIEW.h = VIEW.w * 780 / 840; VIEW.x = Math.max(-100, Math.min(840 - VIEW.w + 100, cx - VIEW.w / 2)); VIEW.y = Math.max(-100, Math.min(780 - VIEW.h + 100, cy - VIEW.h / 2)); applyView(); }

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
