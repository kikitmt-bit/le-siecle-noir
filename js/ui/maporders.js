// Ordres donnés sur la carte, pensés pour la manette (Xbox, curseur au stick ou croix directionnelle) et la souris :
// on choisit sa province → un menu s'ouvre à côté (dé, Frapper, Marcher, Lever) → une flèche vise la cible,
// aimantée sur la plus proche du curseur → une bulle confirme (armées, chances). Sur PC, on peut aussi glisser.
// Le parcours classique par le panneau de droite reste possible.
import * as A from "../audio.js?v=1795365668";
import * as E from "../engine.js?v=1795365668";
import { PROVINCES } from "../map.js?v=1795365668";
import { $, L, MAP, S, esc, me } from "../state.js?v=1795365668";
import { hidePopover, provinceCard, showPopover } from "./aides.js?v=1795365668";
import { dieSvg } from "./draw.js?v=1795365668";
import { avail, goldPlanned, myDice, saveOrders } from "./orders.js?v=1795365668";
import { render } from "./render.js?v=1795365668";

// état propre à la carte (jamais envoyé aux autres joueurs)
const MO = { menu: null, die: null, focus: null, padAt: 0, synth: false, drag: null, snap: null, lastSrc: "mouse" };

const svg = () => $("#map");
const wrap = () => $("#mapwrap");
const st0 = () => S();
const freeDice = () => { const dv = myDice(); return dv.map((v, i) => i).filter((i) => dv[i] && !L.ui.orders.some((o) => o.die === i)); };
const bestDie = () => { const dv = myDice(); return freeDice().sort((a, b) => dv[b] - dv[a])[0]; };
const center = (id) => ({ x: PROVINCES[id].cx, y: PROVINCES[id].cy + 6 });
const neighbors = (id, mine) => { const st = st0(), pid = me(); return PROVINCES[id].adj.filter((a) => (st.provinces[a].owner === pid) === mine); };
const canStrike = (id) => avail(id) >= 1 && neighbors(id, false).length > 0;
const canMarch = (id) => avail(id) >= 1 && neighbors(id, true).length > 0;
const strikePct = (from, to, n, v) => { const st = st0(), pid = me(); return Math.round(E.winProb(n + v + E.attackMod(st, pid), E.defenseOf(st, to)) * 100); };
const pctColor = (pr) => (pr >= 67 ? "#2F5233" : pr >= 45 ? "#8A5F10" : "#A3221A");

// ---------------------------------------------------------------- étapes, appelées par le panneau des ordres
// 1. Rien en cours : toutes mes provinces sont cliquables et ouvrent le menu.
export function idleHook() {
  const st = st0(), pid = me();
  E.provincesOf(st, pid).forEach((id) => MAP.sel.add(id));
  MAP.onPick = (id) => openMenu(id);
  MAP.canDrag = (id) => st.provinces[id] && st.provinces[id].owner === pid && (canStrike(id) || canMarch(id));
  MAP.mode = MO.menu ? "menu" : "idle";
}

// 2. Une attaque ou une marche cherche sa cible : flèche aimantée.
export function targetHook(b) { MAP.mode = "target"; MAP.magnet = { from: b.from, type: b.type }; }

// 3. La cible est choisie : bulle de confirmation sur la carte.
export function confirmHook() { MAP.mode = "confirm"; }

// après chaque rendu : on ouvre, place ou ferme la bulle de la carte
export function afterRender() {
  const st = st0();
  const b = L.ui.build;
  if (!st || st.phase !== "orders" || !me()) { MO.menu = null; MO.focus = null; paintFocus(); closeBox(); drawDrag(); return; }
  if (MO.focus && MAP.sel.size && !MAP.sel.has(MO.focus)) { MO.focus = null; paintFocus(); }
  if (MAP.mode !== "idle" && MAP.mode !== "menu") MO.menu = null;
  if (MAP.mode === "menu" || (MAP.mode === "idle" && MO.menu)) showMenu();
  else if (MAP.mode === "target" && b) showTargetHint(b);
  else if (MAP.mode === "confirm" && b) showConfirm(b);
  else closeBox();
  drawDrag();
}

// ---------------------------------------------------------------- le menu d'une province
function openMenu(id) {
  if (!freeDice().length) { A.play("click"); showPopover(provinceCard(id), ...screenOf(id)); return; }
  MO.menu = id; MO.die = MO.die != null && freeDice().includes(MO.die) ? MO.die : bestDie();
  hidePopover(); A.play("click"); render();
  focusFirst();
}

function showMenu() {
  const id = MO.menu, st = st0(), pid = me(), pl = st.players[pid];
  if (!id || st.provinces[id].owner !== pid) { MO.menu = null; closeBox(); return; }
  const dv = myDice(), fd = freeDice();
  if (!fd.includes(MO.die)) MO.die = bestDie();
  const v = dv[MO.die], a = avail(id);
  const mc = E.mercCostOf(st, pid), canMerc = pl.gold - goldPlanned() >= mc;
  const dice = fd.map((i) => `<button class="mm-die ${i === MO.die ? "on" : ""}" data-mdie="${i}" aria-label="Dé ${dv[i]}">${dieSvg(dv[i])}</button>`).join("");
  const sNb = neighbors(id, false), mNb = neighbors(id, true);
  const best = sNb.length && a >= 1 ? Math.max(...sNb.map((t) => strikePct(id, t, a, v))) : 0;
  const btn = (act, label, sub, ok) => `<button class="mm-act" data-mact="${act}" ${ok ? "" : "disabled"}><b>${label}</b><span>${sub}</span></button>`;
  const html = `<p class="mm-title">${esc(PROVINCES[id].name)} <span>${st.provinces[id].armies} armée${st.provinces[id].armies > 1 ? "s" : ""}</span></p>
    <div class="mm-dice"><span class="mm-lab">Dé</span>${dice}${fd.length > 1 ? `<span class="mm-pad">LB · RB</span>` : ""}</div>
    ${btn("strike", "Frapper", a < 1 ? "il faut 2 armées ici" : !sNb.length ? "aucun voisin à attaquer" : `jusqu'à ${a} armée${a > 1 ? "s" : ""} + ${v} · meilleure chance ${best} %`, canStrike(id))}
    ${btn("march", "Marcher", a < 1 ? "il faut 2 armées ici" : !mNb.length ? "aucune voisine à toi" : `jusqu'à ${Math.min(v, a)} armée${Math.min(v, a) > 1 ? "s" : ""} vers une voisine à toi`, canMarch(id))}
    ${btn("levy", "Lever", `+${E.levyFor(st, pid, v)} armées ici`, true)}
    ${btn("merc", "Lever avec mercenaires", canMerc ? `+${E.levyFor(st, pid, v) + E.MERC_ARMIES} armées ici, ${mc} or` : `il faut ${mc} or`, canMerc)}
    <div class="mm-row"><button class="mm-small" data-mact="card">Fiche</button><button class="mm-small" data-mact="close">Fermer <span class="mm-pad">B</span></button></div>`;
  const box = openBox("menu", html, id);
  box.querySelectorAll("[data-mdie]").forEach((el) => (el.onclick = () => { MO.die = +el.dataset.mdie; A.play("click"); render(); focusSel('[data-mdie="' + MO.die + '"]'); }));
  box.querySelectorAll("[data-mact]").forEach((el) => (el.onclick = () => menuAction(el.dataset.mact)));
}

function menuAction(act) {
  const id = MO.menu, st = st0(), pid = me();
  if (act === "close") { MO.menu = null; A.play("click"); render(); return; }
  if (act === "card") { const s = screenOf(id); showPopover(provinceCard(id), s[0], s[1]); return; }
  const die = MO.die;
  MO.menu = null;
  if (act === "levy" || act === "merc") {
    L.ui.orders.push({ die, type: "levy", to: id, merc: act === "merc" });
    L.ui.build = null; saveOrders(); A.play(act === "merc" ? "coins" : "click"); render(); return;
  }
  L.ui.build = { die, type: act, from: id };
  MO.focus = null; A.play("click"); render();
  // à la manette, on se place d'emblée sur la meilleure cible
  if (MO.lastSrc === "pad") { const c = [...MAP.sel]; if (c.length) setFocus(c.sort((x, y) => scoreTarget(y) - scoreTarget(x))[0]); }
  void st;
}

function scoreTarget(t) { const b = L.ui.build; if (!b || b.type !== "strike") return 0; return strikePct(b.from, t, avail(b.from), myDice()[b.die]); }

// ---------------------------------------------------------------- la cible : consigne près de la province de départ
function showTargetHint(b) {
  const html = `<p class="mm-title">${b.type === "strike" ? "Frapper depuis" : "Marcher depuis"} ${esc(PROVINCES[b.from].name)}</p>
    <p class="mm-hint">${b.type === "strike" ? "Vise une province voisine : les chances sont écrites dessus." : "Vise une de tes provinces voisines."}</p>
    <div class="mm-row"><button class="mm-small" data-mact="back">Retour <span class="mm-pad">B</span></button></div>`;
  const box = openBox("hint", html, b.from);
  box.querySelector('[data-mact="back"]').onclick = () => back();
}

// ---------------------------------------------------------------- confirmation : armées et chances
function showConfirm(b) {
  const st = st0(), pid = me(), v = myDice()[b.die];
  const max = b.type === "strike" ? avail(b.from) : Math.min(v, avail(b.from));
  b.n = Math.min(Math.max(1, b.n || max), max);
  const def = st.provinces[b.to];
  const pr = b.type === "strike" ? strikePct(b.from, b.to, b.n, v) : null;
  const ally = b.type === "strike" && def.owner && E.bound(st, pid, def.owner);
  const html = `<p class="mm-title">${b.type === "strike" ? `Attaque sur ${esc(PROVINCES[b.to].art)}` : `${esc(PROVINCES[b.from].name)} → ${esc(PROVINCES[b.to].name)}`}</p>
    ${b.type === "strike" ? `<p class="mm-hint">En face : ${def.armies} armée${def.armies > 1 ? "s" : ""}${def.owner ? "" : " (milice)"}${E.defBonusOf(st, def.owner) ? ` +${E.defBonusOf(st, def.owner)}` : ""}. Ta force : armées + ${v}.</p>` : ""}
    <div class="mm-num"><button class="mm-step" data-mstep="-1" aria-label="Une armée de moins">−</button><span><b>${b.n}</b> armée${b.n > 1 ? "s" : ""} sur ${max}</span><button class="mm-step" data-mstep="1" aria-label="Une armée de plus">+</button></div>
    ${pr != null ? `<p class="mm-pct" style="color:${pctColor(pr)}">${pr} % de chances</p>` : ""}
    ${ally ? `<p class="mm-warn">Ton allié : l'attaquer est une trahison (−5 Prestige).</p>` : ""}
    <button class="mm-act mm-ok" data-mact="ok"><b>${b.type === "strike" ? "Valider l'attaque" : "Valider le déplacement"}</b></button>
    <div class="mm-row"><button class="mm-small" data-mact="back">Autre cible <span class="mm-pad">B</span></button><button class="mm-small" data-mact="cancel">Annuler</button></div>`;
  const box = openBox("confirm", html, b.to);
  box.querySelectorAll("[data-mstep]").forEach((el) => (el.onclick = () => { b.n = Math.min(max, Math.max(1, b.n + +el.dataset.mstep)); A.play("click"); render(); focusSel(`[data-mstep="${el.dataset.mstep}"]`); }));
  box.querySelector('[data-mact="ok"]').onclick = () => { L.ui.orders.push({ die: b.die, type: b.type, from: b.from, to: b.to, n: b.n }); L.ui.build = null; saveOrders(); A.play("click"); render(); };
  box.querySelector('[data-mact="back"]').onclick = () => back();
  box.querySelector('[data-mact="cancel"]').onclick = () => { L.ui.build = null; A.play("click"); render(); };
}

// B / Échap : un pas en arrière
function back() {
  const b = L.ui.build;
  if (MO.menu) { MO.menu = null; render(); return true; }
  if (!b) return false;
  if (b.to) { MO.focus = MO.lastSrc === "pad" ? b.to : null; delete b.to; }
  else if (b.from && MAP.mode === "target") { const from = b.from; L.ui.build = null; MO.menu = from; }
  else L.ui.build = null;
  A.play("click"); render(); return true;
}

// ---------------------------------------------------------------- la bulle elle-même
function openBox(kind, html, anchor) {
  let box = $("#mapmenu");
  if (!box) { box = document.createElement("div"); box.id = "mapmenu"; box.setAttribute("role", "dialog"); wrap().appendChild(box); }
  const keepFocus = box.contains(document.activeElement) && box.dataset.mmkind === kind ? document.activeElement.getAttribute("data-mact") || document.activeElement.getAttribute("data-mstep") : null;
  box.dataset.mmkind = kind; box.dataset.anchor = anchor;
  box.className = `mapmenu mm-${kind}`;
  box.innerHTML = html;
  place(box);
  if (keepFocus) focusSel(`[data-mact="${keepFocus}"], [data-mstep="${keepFocus}"]`);
  else if (kind !== "hint" && !box.contains(document.activeElement)) focusFirst(); // à la manette, A tombe tout de suite sur le bon bouton
  return box;
}

function closeBox() { const b = $("#mapmenu"); if (b) b.remove(); }

// place la bulle à côté de sa province, sans sortir de la carte
export function place(box = $("#mapmenu")) {
  if (!box) return;
  const id = box.dataset.anchor; if (!id || !PROVINCES[id]) return;
  const r = wrap().getBoundingClientRect();
  // la consigne de visée se range dans un coin, pour ne cacher aucune cible
  if (box.dataset.mmkind === "hint") { box.style.left = "10px"; box.style.top = Math.max(8, r.height - box.offsetHeight - 10) + "px"; return; }
  const [sx, sy] = screenOf(id);
  const x = sx - r.left, y = sy - r.top, w = box.offsetWidth, h = box.offsetHeight, gap = 34;
  let left = x + gap; if (left + w > r.width - 8) left = x - gap - w; if (left < 8) left = Math.max(8, Math.min(r.width - w - 8, x - w / 2));
  let top = y - h / 2; top = Math.max(8, Math.min(r.height - h - 8, top));
  box.style.left = left + "px"; box.style.top = top + "px";
}

function screenOf(id) {
  const m = svg().getScreenCTM(); const c = center(id);
  const p = new DOMPoint(c.x, c.y).matrixTransform(m);
  return [p.x, p.y];
}

function svgPoint(cx, cy) { return new DOMPoint(cx, cy).matrixTransform(svg().getScreenCTM().inverse()); }

// ---------------------------------------------------------------- flèche aimantée (curseur) et glisser (souris)
function nearestTarget(p, maxD = 130) {
  let best = null, bd = 1e9;
  for (const id of MAP.sel) { const c = center(id); const d = Math.hypot(c.x - p.x, c.y - p.y); if (d < bd) { bd = d; best = id; } }
  return bd <= maxD ? best : null;
}

function drawDrag() {
  const g = $("#m-drag"); if (!g) return;
  let from = null, to = null, type = null, tip = "";
  if (MO.drag && MO.drag.active) { from = MO.drag.from; to = MO.drag.to; type = MO.drag.type; }
  else if (MAP.mode === "target" && L.ui.build) { from = L.ui.build.from; to = MO.focus && MAP.sel.has(MO.focus) ? MO.focus : MO.snap; type = L.ui.build.type; }
  if (!from) { g.innerHTML = ""; return; }
  const f = center(from);
  let t = to ? center(to) : MO.drag && MO.drag.pt ? MO.drag.pt : null;
  if (!t) { g.innerHTML = ""; return; }
  if (type === "strike" && to) { const v = myDice()[MO.drag && MO.drag.active ? MO.drag.die : L.ui.build.die]; const pr = strikePct(from, to, avail(from), v); tip = `<g transform="translate(${t.x},${t.y - 30})"><rect x="-27" y="-13" width="54" height="24" rx="12" fill="${pctColor(pr)}" stroke="#F5EBD3" stroke-width="2"/><text y="5" text-anchor="middle" class="drag-pct">${pr} %</text></g>`; }
  if (type === "march" && to) tip = `<g transform="translate(${t.x},${t.y - 30})"><rect x="-30" y="-13" width="60" height="24" rx="12" fill="#241811" stroke="#F5EBD3" stroke-width="2"/><text y="5" text-anchor="middle" class="drag-pct">marche</text></g>`;
  const mx = (f.x + t.x) / 2 + (t.y - f.y) * 0.15, my = (f.y + t.y) / 2 - (t.x - f.x) * 0.15;
  const col = type === "march" ? "#241811" : "#A3221A";
  g.innerHTML = `<path class="drag-arrow" d="M${f.x},${f.y} Q${mx},${my} ${t.x},${t.y}" stroke="${col}" ${type === "march" ? 'stroke-dasharray="7 6"' : ""} marker-end="url(#${type === "march" ? "ah-ink" : "ah-red"})"/>${to ? `<path class="prov-hl ${type === "strike" ? "red" : ""}" d="${PROVINCES[to].d}"/>` : ""}${tip}`;
}

// pendant la visée, la flèche suit le curseur et s'aimante sur la cible la plus proche
document.addEventListener("pointermove", (e) => {
  if (!$("#map")) return;
  if (e.pointerType === "mouse" || e.pointerType === "pen" || e.pointerType === "touch") { if (Math.abs(e.movementX) + Math.abs(e.movementY) > 2) { MO.lastSrc = "mouse"; if (MO.focus) { MO.focus = null; paintFocus(); } } }
  if (MO.drag) { dragMove(e); return; }
  if (MAP.mode !== "target") return;
  const r = svg().getBoundingClientRect();
  if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return;
  const p = svgPoint(e.clientX, e.clientY);
  const s = nearestTarget(p);
  if (s !== MO.snap) { MO.snap = s; drawDrag(); }
});

// un clic sur la carte pendant la visée choisit la cible aimantée, même à côté de la province
export function magnetPick(e) {
  if (MAP.mode !== "target" || !MAP.onPick) return false;
  const p = svgPoint(e.clientX, e.clientY);
  const s = nearestTarget(p);
  if (!s) return false;
  MO.snap = null; MAP.onPick(s); return true;
}

// glisser (souris, PC) : de ma province vers une voisine ; l'ordre se déduit de la cible
function dragStart(e) {
  if (e.button !== 0 || e.pointerType === "touch" || (MAP.mode !== "idle" && MAP.mode !== "menu") || !MAP.canDrag) return;
  const t = e.target.closest(".prov, .banner-g"); if (!t) return;
  const id = t.dataset.id || t.id.replace(/^b-/, "");
  if (!MAP.canDrag(id)) return;
  MO.drag = { from: id, x: e.clientX, y: e.clientY, active: false, die: bestDie() };
}
function dragMove(e) {
  const d = MO.drag;
  if (!d.active && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 14) { d.active = true; MO.menu = null; closeBox(); hidePopover(); }
  if (!d.active) return;
  const p = svgPoint(e.clientX, e.clientY); d.pt = { x: p.x, y: p.y };
  const st = st0(), pid = me();
  const cands = PROVINCES[d.from].adj.filter((a) => (st.provinces[a].owner === pid ? canMarch(d.from) : canStrike(d.from)));
  let best = null, bd = 1e9;
  for (const a of cands) { const c = center(a); const dd = Math.hypot(c.x - p.x, c.y - p.y); if (dd < bd) { bd = dd; best = a; } }
  d.to = bd < 110 ? best : null;
  d.type = d.to ? (st.provinces[d.to].owner === pid ? "march" : "strike") : "strike";
  drawDrag();
}
window.addEventListener("pointerup", () => {
  const d = MO.drag; MO.drag = null;
  if (!d || !d.active) return;
  L.justPanned = Date.now(); // pas de clic parasite à la fin du geste
  if (!d.to || d.die == null) { drawDrag(); return; }
  L.ui.build = { die: d.die, type: d.type, from: d.from, to: d.to };
  A.play("click"); render();
});

export function bindMapOrders() {
  svg().addEventListener("pointerdown", dragStart);
  MAP.onView = () => { place(); };
}

// ---------------------------------------------------------------- manette et clavier : la croix saute de province en province
function setFocus(id) { MO.focus = id; MO.lastSrc = "pad"; paintFocus(); drawDrag(); }
function paintFocus() {
  const g = $("#m-focus"); if (!g) return;
  g.innerHTML = MO.focus && PROVINCES[MO.focus] ? `<path class="prov-focus" d="${PROVINCES[MO.focus].d}"/>` : "";
}
function pickables() { return [...MAP.sel]; }
function moveFocus(dx, dy) {
  const list = pickables(); if (!list.length) return;
  const b = L.ui.build;
  const cur = MO.focus && list.includes(MO.focus) ? MO.focus : null;
  if (!cur) { const start = b && b.from ? center(b.from) : { x: 420, y: 390 }; setFocus(list.sort((a, c) => dist(center(a), start) - dist(center(c), start))[0]); return; }
  const p = center(cur); let best = null, bs = 1e9;
  for (const id of list) {
    if (id === cur) continue;
    const c = center(id), vx = c.x - p.x, vy = c.y - p.y, along = vx * dx + vy * dy;
    if (along <= 4) continue;
    const s = along + 2.2 * Math.abs(vx * dy - vy * dx);
    if (s < bs) { bs = s; best = id; }
  }
  if (best) { setFocus(best); A.play("click"); }
}
const dist = (a, c) => Math.hypot(a.x - c.x, a.y - c.y);

function boxButtons() { const b = $("#mapmenu"); return b ? [...b.querySelectorAll("button:not([disabled])")] : []; }
function focusFirst() { setTimeout(() => { if (MO.lastSrc !== "pad") return; const bs = boxButtons(); const first = bs.find((x) => x.matches(".mm-act, .mm-ok")) || bs[0]; if (first) first.focus(); }, 0); }
function focusSel(sel) { setTimeout(() => { const el = $("#mapmenu") && $("#mapmenu").querySelector(sel); if (el && MO.lastSrc === "pad") el.focus(); }, 0); }

function inBox() { const b = $("#mapmenu"); return b && b.contains(document.activeElement); }

function padDir(dx, dy) {
  const box = $("#mapmenu");
  if (box && (box.dataset.mmkind === "menu" || box.dataset.mmkind === "confirm")) {
    const bs = boxButtons(); if (!bs.length) return;
    if (!inBox()) { MO.lastSrc = "pad"; focusFirst(); return; }
    const el = document.activeElement;
    if (dx && box.dataset.mmkind === "confirm" && box.querySelector("[data-mstep]")) { box.querySelector(`[data-mstep="${dx}"]`).click(); return; }
    if (dx && el.matches("[data-mdie]")) { cycleDie(dx); return; }
    const i = bs.indexOf(el); const n = bs[(i + (dy || dx) + bs.length) % bs.length]; if (n) n.focus();
    return;
  }
  moveFocus(dx, dy);
}
function padA() {
  const box = $("#mapmenu");
  if (inBox()) { press(document.activeElement); return; }
  if (MO.focus && MAP.sel.has(MO.focus) && MAP.onPick) { MO.padAt = Date.now(); const id = MO.focus; MAP.onPick(id); return; }
  if (box) { MO.lastSrc = "pad"; focusFirst(); }
}
function press(el) { MO.padAt = Date.now(); MO.synth = true; try { el.click(); } finally { MO.synth = false; } }
function cycleDie(k) { if (!MO.menu) return; const fd = freeDice(); if (fd.length < 2) return; const i = fd.indexOf(MO.die); MO.die = fd[(i + k + fd.length) % fd.length]; A.play("click"); render(); focusSel(`[data-mdie="${MO.die}"]`); }
function padB() { return back(); }

// un appui sur A arrive aussi comme un clic de curseur (mode souris de la Xbox) : on n'en garde qu'un
document.addEventListener("click", (e) => { if (!MO.synth && Date.now() - MO.padAt < 260) { e.stopPropagation(); e.preventDefault(); } }, true);

const typing = () => { const a = document.activeElement; return a && (a.tagName === "INPUT" || a.tagName === "TEXTAREA" || a.isContentEditable); };
const gameOn = () => { const s = st0(); return s && s.phase !== "lobby" && !$("#screen-game").classList.contains("hidden") && !document.querySelector("#modal:not(.hidden), #overlay:not(.hidden)"); };

document.addEventListener("keydown", (e) => {
  if (typing() || !gameOn()) return;
  const dirs = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
  if (dirs[e.key] && (MAP.sel.size || $("#mapmenu"))) { e.preventDefault(); MO.lastSrc = "pad"; padDir(...dirs[e.key]); return; }
  if (e.key === "Enter" && (MO.focus || inBox())) { e.preventDefault(); MO.lastSrc = "pad"; padA(); return; }
  if ((e.key === "Escape" || e.key === "Backspace") && (MO.menu || L.ui.build) && S().phase === "orders") { if (back()) e.preventDefault(); return; }
  if ((e.key === "[" || e.key === "]") && MO.menu) { cycleDie(e.key === "]" ? 1 : -1); }
});

// manette : croix (12-15), A (0), B (1), LB (4), RB (5). B ferme déjà les fenêtres (main.js).
let padOn = false;
window.addEventListener("gamepadconnected", () => {
  if (padOn) return; padOn = true;
  const was = {}, rep = {};
  const poll = () => {
    const gp = [...(navigator.getGamepads ? navigator.getGamepads() : [])].find(Boolean);
    if (gp && gameOn()) {
      const now = performance.now();
      const btn = (i) => !!(gp.buttons[i] && gp.buttons[i].pressed);
      const edge = (i) => btn(i) && !was[i];
      const dir = [[12, 0, -1], [13, 0, 1], [14, -1, 0], [15, 1, 0]];
      for (const [i, dx, dy] of dir) {
        if (edge(i)) { rep[i] = now + 320; MO.lastSrc = "pad"; padDir(dx, dy); }
        else if (btn(i) && now > rep[i]) { rep[i] = now + 150; padDir(dx, dy); }
      }
      if (edge(0) && (MO.focus || inBox() || $("#mapmenu"))) { MO.lastSrc = "pad"; padA(); }
      if (edge(1) && S().phase === "orders") padB();
      if (edge(4)) cycleDie(-1);
      if (edge(5)) cycleDie(1);
      for (let i = 0; i < gp.buttons.length; i++) was[i] = btn(i);
    }
    requestAnimationFrame(poll);
  };
  poll();
});

export function closeMenu() { if (MO.menu) { MO.menu = null; render(); } }

// changement de phase ou de manche : on oublie le menu ouvert
export function resetMapOrders() { MO.menu = null; MO.focus = null; MO.snap = null; MO.drag = null; paintFocus(); closeBox(); }
