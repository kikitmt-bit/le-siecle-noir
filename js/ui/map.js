// Carte SVG, zoom et déplacement
import * as A from "../audio.js?v=1795390620";
import { HOUSES } from "../content.js?v=1795390620";
import { LEGEND } from "../help.js?v=1795390620";
import { PROVINCES } from "../map.js?v=1795390620";
import { ART_BACK, ART_DEFS, ART_FRONT } from "../map-art.js?v=1795390620";
import { $, L, MAP, S, VIEW, esc } from "../state.js?v=1795390620";
import { hidePopover, provinceCard, showPopover } from "./aides.js?v=1795390620";
import { houseColor } from "./common.js?v=1795390620";
import { bindMapOrders, closeMenu, magnetPick } from "./maporders.js?v=1795390620";

export function buildMap() {
  const svg = $("#map");
  let h = `<defs>${ART_DEFS}
    <pattern id="spots" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="2.4" fill="#1B130D"/><circle cx="11" cy="10" r="1.5" fill="#1B130D"/></pattern>
    <marker id="ah-red" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#A3221A"/></marker>
    <marker id="ah-ink" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#241811"/></marker>
  </defs>${ART_BACK}`;
  h += `<g id="m-provs">`;
  for (const [id, p] of Object.entries(PROVINCES)) h += `<path d="${p.d}" fill="#F0E4C7"/><path class="prov" id="p-${id}" data-id="${id}" d="${p.d}" fill="#D9C9A3"/>`;
  h += `</g><g id="m-plague"></g><g id="m-decor" pointer-events="none">${ART_FRONT}</g><g id="m-hl"></g><g id="m-focus" pointer-events="none"></g><g id="m-arrows"></g><g id="m-drag" pointer-events="none"></g><g id="m-labels">`;
  for (const [id, p] of Object.entries(PROVINCES)) h += `<text class="plabel" x="${p.cx}" y="${p.cy - 16}" text-anchor="middle">${esc(p.name.toUpperCase())}</text>`;
  h += `</g><g id="m-caps"></g><g id="m-banners">`;
  for (const [id, p] of Object.entries(PROVINCES)) h += `<g class="banner-g" id="b-${id}" transform="translate(${p.cx},${p.cy - 6})"><path d="M-13,0 L13,0 L13,23 L0,17 L-13,23 Z" stroke="#241811" stroke-width="1.2" fill="#5A4A36"/><text x="0" y="15" text-anchor="middle">0</text></g>`;
  h += `</g><g id="m-badges"></g><g id="m-fx"></g>`;
  svg.innerHTML = h;
  svg.addEventListener("click", (e) => {
    const t = e.target.closest(".prov, .banner-g");
    if (L.justPanned && Date.now() - L.justPanned < 300) return;
    const id = t ? t.dataset.id || t.id.replace(/^b-/, "") : null;
    // pendant la visée d'un ordre, un clic près d'une cible la choisit (pratique au curseur de manette)
    if (MAP.mode === "target" && (!id || !MAP.sel.has(id)) && magnetPick(e)) { hidePopover(); A.play("click"); return; }
    if (!t) { hidePopover(); closeMenu(); return; }
    if (MAP.sel.has(id) && MAP.onPick) { hidePopover(); A.play("click"); MAP.onPick(id); }
    else if (S() && S().phase !== "lobby") showPopover(provinceCard(id), e.clientX, e.clientY);
  });
  // un clic sur la bannière compte comme un clic sur la province
  svg.querySelectorAll(".banner-g").forEach((g) => (g.style.pointerEvents = "auto"));
  bindMapOrders();
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
  // capitales (médaillon posé sur la ville même, dont le nom est gravé sur la carte) et couronne du favori
  let caps = "";
  for (const pid of st.order) {
    const c = st.players[pid].capital;
    if (!c || !provs[c] || provs[c].owner !== pid) continue;
    const P = PROVINCES[c];
    caps += capMark(P.tx, P.ty, houseColor(pid), 12);
    if (st.leader === pid && st.round < st.maxRounds) caps += `<g transform="translate(${P.cx},${P.cy - 40})" pointer-events="none"><path d="M-11,6 L-11,-4 L-5,1 L0,-7 L5,1 L11,-4 L11,6 Z" fill="#A9843A" stroke="#241811" stroke-width="1.2"/></g>`;
  }
  $("#m-caps").innerHTML = caps;
  $("#m-badges").innerHTML = MAP.badges.map((b) => { const P = PROVINCES[b.prov]; return `<g class="pct-badge" transform="translate(${P.cx},${P.cy + 34})" pointer-events="none"><rect x="-26" y="-12" width="52" height="22" rx="11" fill="${b.color}" stroke="#F5EBD3" stroke-width="2"/><text x="0" y="4" text-anchor="middle" fill="#F5EBD3">${b.text}</text></g>`; }).join("");
}

// médaillon de capitale : château blanc sur la couleur de la maison, cerclé d'or
export function capMark(x, y, color, r = 14) {
  return `<g class="capmark" transform="translate(${x},${y})" pointer-events="none"><circle r="${r + 3}" fill="#241811"/><circle r="${r + 1.5}" fill="#A9843A"/><circle r="${r - 1}" fill="${color}" stroke="#241811" stroke-width="1"/><path transform="scale(${r / 14})" d="M-8,7 V-3 h2.6 v-3 h2.6 v3 h1.5 V-8 h2.6 v2.4 h2.6 V-3 h1.5 v-3 h2.6 v3 h0 V7 h-6 v-4 a2,2 0 0 0 -4,0 v4 Z" fill="#F5EBD3" stroke="#241811" stroke-width="0.8"/></g>`;
}

export function drawArrows(list) {
  // list: [{from, to, color, dashed}]
  $("#m-arrows").innerHTML = list.map((a) => {
    const f = PROVINCES[a.from], t = PROVINCES[a.to];
    const mx = (f.cx + t.cx) / 2 + (t.cy - f.cy) * 0.15, my = (f.cy + t.cy) / 2 - (t.cx - f.cx) * 0.15;
    return `<path class="order-arrow" d="M${f.cx},${f.cy} Q${mx},${my} ${t.cx},${t.cy}" stroke="${a.color}" ${a.dashed ? 'stroke-dasharray="6 6"' : ""} marker-end="url(#${a.color === "#241811" ? "ah-ink" : "ah-red"})" opacity="0.9"/>`;
  }).join("");
}

// courbe d'une flèche d'ordre (même tracé que drawArrows)
export function arrowPath(from, to) {
  const f = PROVINCES[from], t = PROVINCES[to];
  const mx = (f.cx + t.cx) / 2 + (t.cy - f.cy) * 0.15, my = (f.cy + t.cy) / 2 - (t.cx - f.cx) * 0.15;
  return `M${f.cx},${f.cy} Q${mx},${my} ${t.cx},${t.cy}`;
}

// les armées marchent le long des flèches : un étendard aux couleurs de la maison, avec son nombre d'armées.
// Moins d'une seconde ; rien si l'utilisateur a demandé moins d'animations.
export const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
export function marchArmies(list, dur = 0.9) {
  if (reducedMotion() || !list.length) return;
  const g = $("#m-fx");
  for (const a of list) {
    if (!PROVINCES[a.from] || !PROVINCES[a.to]) continue;
    const wrap = document.createElementNS("http://www.w3.org/2000/svg", "g");
    wrap.setAttribute("pointer-events", "none");
    wrap.innerHTML = `<g class="march"><g transform="translate(0,-6) scale(1.6)"><path d="M0,10 V-20" stroke="#241811" stroke-width="2"/><path d="M1,-20 H19 L15,-13 L19,-6 H1 Z" fill="${a.color}" stroke="#241811" stroke-width="1.2"/>${a.n ? `<text x="9" y="-9.5" text-anchor="middle" class="march-n">${a.n}</text>` : ""}<ellipse cx="0" cy="11" rx="9" ry="3" fill="#241811" opacity=".35"/><circle cx="-5" cy="6" r="3.2" fill="#241811"/><circle cx="4" cy="7" r="3.2" fill="#241811"/><path d="M-9,6 l-3,-9 M8,7 l3,-10" stroke="#241811" stroke-width="1.6" stroke-linecap="round"/></g>
      <animateMotion dur="${dur}s" fill="freeze" path="${arrowPath(a.from, a.to)}" keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines=".45 0 .3 1"/></g>`;
    g.appendChild(wrap);
    setTimeout(() => wrap.remove(), dur * 1000 + 450);
  }
}

export function fx(kind, prov, color) {
  const P = PROVINCES[prov]; if (!P) return;
  const g = $("#m-fx");
  let el = "";
  if (kind === "conquest") el = `<g pointer-events="none"><clipPath id="clip-${prov}-${Date.now()}"><path d="${P.d}"/></clipPath><circle class="ink-spread" cx="${P.cx}" cy="${P.cy}" r="0" fill="${color}" clip-path="url(#clip-${prov}-${Date.now()})"/><g class="stamp" transform="translate(${P.cx},${P.cy + 22})"><circle r="16" fill="#A3221A" stroke="#6E140F" stroke-width="3"/><circle r="10" fill="none" stroke="#F5EBD3" stroke-width="1.5" opacity=".7"/></g></g>`;
  if (kind === "battle") el = `<g class="clash fade-out" transform="translate(${P.cx},${P.cy + 22})" pointer-events="none"><path d="M-14,-14 L14,14 M14,-14 L-14,14" stroke="#1B130D" stroke-width="5" stroke-linecap="round"/><path d="M-14,-14 L14,14 M14,-14 L-14,14" stroke="#ECDEBD" stroke-width="2" stroke-linecap="round"/></g>`;
  if (kind === "death") el = `<g class="stamp fade-out" transform="translate(${P.cx},${P.cy + 22})" pointer-events="none"><path d="M-3,-16 h6 v10 h10 v6 h-10 v18 h-6 v-18 h-10 v-6 h10 Z" fill="#1B130D"/></g>`;
  const wrap = document.createElementNS("http://www.w3.org/2000/svg", "g");
  wrap.innerHTML = el;
  g.appendChild(wrap);
  setTimeout(() => wrap.remove(), 2200);
}

export function applyView() { $("#map").setAttribute("viewBox", `${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`); if (MAP.onView) MAP.onView(); }

export function zoomBy(f) { const cx = VIEW.x + VIEW.w / 2, cy = VIEW.y + VIEW.h / 2; VIEW.w = Math.max(260, Math.min(840, VIEW.w * f)); VIEW.h = VIEW.w * 780 / 840; VIEW.x = Math.max(-100, Math.min(840 - VIEW.w + 100, cx - VIEW.w / 2)); VIEW.y = Math.max(-100, Math.min(780 - VIEW.h + 100, cy - VIEW.h / 2)); if (VIEW.w >= 840) { VIEW.x = 0; VIEW.y = 0; } applyView(); }

$("#zoom-in").onclick = () => zoomBy(0.75);

$("#zoom-out").onclick = () => zoomBy(1 / 0.75);

$("#zoom-reset").onclick = () => { Object.assign(VIEW, { x: 0, y: 0, w: 840, h: 780 }); applyView(); };

$("#btn-legend").onclick = () => { const l = $("#legend"); l.innerHTML = `<p class="ph" style="margin-bottom:4px">Légende de la carte</p>${LEGEND}<p class="hint">Astuce : touche n'importe quelle province pour voir sa fiche.</p>`; l.classList.toggle("hidden"); };

(function enablePan() {
  const svg = $("#map"); let drag = null;
  svg.addEventListener("pointerdown", (e) => {
    if (VIEW.w >= 840) return;
    // sur une de mes provinces, pendant les ordres, le geste donne un ordre au lieu de déplacer la carte
    const t = e.target.closest(".prov, .banner-g");
    if (t && e.pointerType !== "touch" && (MAP.mode === "idle" || MAP.mode === "menu") && MAP.canDrag && MAP.canDrag(t.dataset.id || t.id.replace(/^b-/, ""))) return;
    drag = { x: e.clientX, y: e.clientY, vx: VIEW.x, vy: VIEW.y, moved: false }; });
  window.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const r = svg.getBoundingClientRect(); const k = Math.max(VIEW.w / r.width, VIEW.h / r.height);
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 6) drag.moved = true;
    if (drag.moved) { VIEW.x = drag.vx - dx * k; VIEW.y = drag.vy - dy * k; applyView(); }
  });
  window.addEventListener("pointerup", () => { if (drag && drag.moved) L.justPanned = Date.now(); drag = null; });
})();
