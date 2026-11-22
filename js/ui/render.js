// Rendu principal : jauges, bandeau d'aide, haut d'écran, joueurs
import * as A from "../audio.js?v=1795350372";
import { HOUSES } from "../content.js?v=1795350372";
import * as E from "../engine.js?v=1795350372";
import { ICON } from "../help.js?v=1795350372";
import { PROVINCES } from "../map.js?v=1795350372";
import { $, H, H_ICON, L, MAP, S, esc, me } from "../state.js?v=1795350372";
import { applyCoach } from "./aides.js?v=1795350372";
import { scoresHidden, houseName, setInput, toast } from "./common.js?v=1795350372";
import { dilLeft, dilSlots } from "./dilemmas.js?v=1795350372";
import { shield } from "./draw.js?v=1795350372";
import { portraitSvg, renderHouseTab, renderLog } from "./house.js?v=1795350372";
import { renderDiplo, updateMsgBadge } from "./inbox.js?v=1795350372";
import { drawArrows, updateMap } from "./map.js?v=1795350372";
import { myDice, saveOrders } from "./orders.js?v=1795350372";
import { openModal, phaseTutos, renderOverlays } from "./overlays.js?v=1795350372";
import { confirmDraft, renderPanel } from "./panels.js?v=1795350372";
import { revealProvinces, rvFocus } from "./reveal.js?v=1795350372";

// ---------------------------------------------------------------------
// RENDU PRINCIPAL
// ---------------------------------------------------------------------
export function render() {
  const st = S();
  if (!st || st.phase === "lobby") return;
  renderTop(); renderPlayers(); renderGuide();
  MAP.sel = new Set(); MAP.hl = new Set(); MAP.hlRed = new Set(); MAP.onPick = null; MAP.badges = [];
  let arrows = [];
  const panel = renderPanel();
  $("#tab-panel").innerHTML = panel.html;
  if (panel.bind) panel.bind();
  if (panel.arrows) arrows = panel.arrows;
  renderHouseTab(); renderLog();
  renderDiplo();
  if (L.ui.tab === "diplo") L.unread = 0;
  updateMsgBadge();
  // carte : pendant la révélation, on montre l'état « avant » puis on applique les étapes
  if (st.phase === "reveal") { const f = rvFocus(st); MAP.hl = new Set(f.hl); MAP.hlRed = new Set(f.red); MAP.badges = f.badges; updateMap(revealProvinces()); drawArrows(f.arrows); }
  else { updateMap(st.provinces); drawArrows(arrows); }
  $("#crown-banner").classList.toggle("hidden", !(st.round === st.maxRounds && ["dilemma", "orders"].includes(st.phase)));
  renderOverlays();
  document.querySelectorAll("#side-tabs button").forEach((b) => b.classList.toggle("active", b.dataset.tab === L.ui.tab));
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.id === `tab-${L.ui.tab}`));
  phaseTutos();
  applyCoach();
}

// ---- mes jauges, toujours visibles, avec leur explication au toucher ----
export function hudRes() {
  const st = S(), pid = me();
  if (!pid || !st.players[pid] || st.round < 1) return "";
  const p = st.players[pid];
  const c = (v) => (v >= 80 ? "bad" : v >= 60 ? "warn" : "");
  const up = E.upkeepOf(st, pid), inc = E.incomeOf(st, pid).total;
  return `<span class="hud-res"><button type="button" class="term" data-term="prestige" title="Prestige : tes points de victoire">${ICON.prestige}${p.prestige}</button><button type="button" class="term ${p.gold + inc < up ? "bad" : ""}" data-term="or" title="Or : revenu +${inc}, solde des troupes −${up} à la fin de la manche">${ICON.gold}${p.gold}</button><button type="button" class="term ${c(p.colere)}" data-term="colere" title="Colère du peuple : à 80, une province se révolte">${ICON.colere}${p.colere}</button><button type="button" class="term" data-term="peur" title="Peur : +1 en défense tous les 25 points">${ICON.peur}${p.peur}</button></span>`;
}

// ---- bandeau « que dois-je faire ? » ----
export function renderGuide() {
  const st = S(), pid = me(), el = $("#guide");
  if (!el) return;
  let step = "", text = "", btn = "", mine = false;
  let stage = -1, prepStage = -1;
  const prep = (n, label) => { prepStage = n - 1; return label; };
  const round = (n, label) => { stage = n - 1; return label; };
  if (!pid) { step = "SPECTATEUR"; text = "Tu regardes la partie."; }
  else switch (st.phase) {
    case "objectives": {
      const done = (L.myInput.objPick || []).length === 2;
      step = prep(1, "OBJECTIFS SECRETS");
      text = done ? "Tes objectifs sont choisis. On attend les autres seigneurs…" : "<b>À toi :</b> choisis 2 objectifs secrets parmi les 3 proposés, puis valide.";
      if (!done) { btn = `<button class="btn btn-red" data-guide="obj">Choisir mes objectifs</button>`; mine = true; }
      break;
    }
    case "draft": {
      const cur = E.currentDrafter(st);
      step = prep(2, "CHOIX DES PROVINCES");
      if (cur === pid) {
        mine = true;
        if (L.ui.draftSel) { text = `<b>À toi :</b> tu as sélectionné <b>${esc(PROVINCES[L.ui.draftSel.prov].name)}</b>. Confirme, ou clique une autre province pour changer.`; btn = `<button class="btn btn-red" data-guide="draftok">Confirmer</button>`; }
        else text = st.players[pid].capital ? "<b>À toi :</b> clique sur une province libre de la carte (encadrée en pointillés dorés). Prends-la à côté des tiennes." : "<b>À toi :</b> clique sur une province libre de la carte (encadrée en pointillés dorés). Ce sera ta <b>capitale</b>.";
      }
      else text = `${esc(st.players[cur]?.name || "")} (${esc(houseName(cur))}) choisit une province… Attends ton tour.`;
      break;
    }
    case "placement": {
      const sent = L.myInput.placement && L.myInput.placement.ok;
      step = prep(3, "PLACEMENT DES ARMÉES");
      if (sent) text = "Placement validé. On attend les autres…";
      else {
        const mineP = E.provincesOf(st, pid);
        const used = mineP.reduce((s2, id) => s2 + ((L.ui.placement || {})[id] || 1), 0);
        text = `<b>À toi :</b> clique sur tes provinces pour y ajouter des armées (il en reste <b>${E.START_ARMIES - used}</b>), puis valide. Ou laisse le jeu les placer.`;
        btn = `<button class="btn" data-guide="plauto">Placement auto</button><button class="btn btn-red" data-guide="plok">Valider</button>`; mine = true;
      }
      break;
    }
    case "dilemma": {
      const n = dilSlots().length, left = dilLeft();
      step = round(1, "LES DILEMMES");
      if (!n) text = "Pas de dilemme pour toi cette manche. On attend les autres…";
      else if (!left) text = "Tes choix sont scellés. Pendant que les autres décident, négociez à voix haute ou dans l'onglet Diplomatie (mariages, trêves, or).";
      else { text = `<b>À toi :</b> ${n > 1 ? `${n} décisions : ton affaire privée, une affaire avec un rival${dilSlots().includes("council") ? ", et ton vote public au <b>Conseil du Roi</b>" : ""}. Il en reste ${left}.` : "une décision secrète t'attend."} Choisis une option et scelle-la.`; btn = `<button class="btn btn-red" data-guide="dil">${left < n ? "Affaire suivante" : "Ouvrir"}</button>`; mine = true; }
      break;
    }
    case "orders": {
      const sealed = L.myInput.orders && L.myInput.orders.round === st.round && L.myInput.orders.sealed;
      step = round(2, "LES ORDRES");
      if (sealed) text = "Ordres scellés. On attend les autres… (tu peux encore les modifier dans le panneau Actions)";
      else {
        const dv = myDice().filter((v) => v).length, n = L.ui.orders.length;
        text = L.ui.build ? `<b>À toi :</b> suis les étapes dans le panneau Actions (dé ${myDice()[L.ui.build.die]}).` : n < dv ? `<b>À toi :</b> clique un dé dans le panneau Actions et choisis son ordre. Ordres donnés : <b>${n} sur ${dv}</b>.` : `<b>À toi :</b> tous tes dés ont un ordre. Vérifie, puis scelle tes ordres.`;
        btn = `<button class="btn" data-guide="actions">Voir mes dés</button><button class="btn btn-red" data-guide="seal">Sceller mes ordres</button>`; mine = true;
      }
      break;
    }
    case "reveal": {
      step = round(3, "RÉVÉLATION");
      const n = ((st.reveal && st.reveal.cards) || []).length, c = Math.min((st.revCard || 0) + 1, n);
      const ok = (st.ready || {})[me()];
      text = ok ? `Carte ${c} sur ${n} : on attend que les autres aient lu. Parlez-en !` : `<b>Tous ensemble :</b> carte ${c} sur ${n}. Lisez, regardez la carte, discutez, puis clique <b>« Suivant »</b>. On passe à la suite quand tout le monde a validé.`;
      break;
    }
    case "interlude": step = `FIN DE LA MANCHE ${st.round}`; text = "La manche suivante se prépare : nouveaux dés, nouveaux dilemmes…"; break;
    case "end": step = "FIN DE LA PARTIE"; text = "La partie est terminée."; btn = `<button class="btn btn-red" data-guide="end">Voir les résultats</button>`; break;
  }
  const waiting = (!mine && ["objectives", "draft", "placement", "dilemma", "orders"].includes(st.phase)) || (st.phase === "reveal" && (st.ready || {})[me()]);
  if (waiting && H.active && !st.solo && (st.timer === "none" || !st.timer)) btn += `<button class="btn btn-small" data-guide="force" title="Passer à la suite sans attendre les retardataires">Forcer la suite</button>`;
  L.hudScore = "";
  if (pid && st.round > 0) {
    const est = E.estimateScore(st, { [pid]: L.priv || {} }, pid);
    const hide = scoresHidden(st);
    const all = st.order.map((p) => ({ p, v: p === pid ? est.total : E.estimateScore(st, {}, p).total })).sort((a, b) => b.v - a.v);
    const rank = all.findIndex((x) => x.p === pid) + 1;
    L.hudScore = `<button class="g-score" data-guide="score" title="Comment est calculé le score">${ICON.prestige}${hide ? `${est.total} pts` : `<b>${rank}${rank === 1 ? "er" : "e"}</b> sur ${st.order.length} · ${est.total} pts`}</button>`;
  }
  el.className = `guide ${mine ? "" : "wait"}`;
  const key = step + text + btn;
  if (el.dataset.k !== key) {
    el.dataset.k = key;
    const track = st.round > 0 ? `<div class="hud-track" title="Les ${st.maxRounds} manches">${Array.from({ length: st.maxRounds }, (_, i) => `<span class="${i + 1 < st.round ? "past" : i + 1 === st.round ? "now" : ""} ${i + 1 === st.maxRounds ? "last" : ""}">${i + 1 === st.maxRounds ? "♛" : i + 1}</span>`).join("")}</div>` : `<div class="hud-track prep"><span class="now">Préparatifs</span></div>`;
    const stages = st.round > 0 ? ["Dilemmes", "Ordres", "Révélation"] : ["Objectifs", "Provinces", "Armées"];
    const cur = st.round > 0 ? stage : prepStage;
    const stepper = `<div class="hud-steps">${stages.map((n, i) => `<span class="${i < cur ? "done" : i === cur ? "cur" : ""}">${i + 1}. ${n}</span>`).join('<i>›</i>')}</div>`;
    el.innerHTML = `<div class="hud-left">${track}${stepper}</div><div class="hud-main"><span class="g-text">${text}</span><span class="hud-btns">${btn}</span></div><div class="hud-right">${L.hudScore || ""}${hudRes()}<span class="hud-goal">But : avoir le plus de points après ${st.maxRounds} manches</span></div>`;
    if (mine && el.dataset.last !== st.phase + st.round) { el.dataset.last = st.phase + st.round; el.classList.add("mine"); }
  }
  el.querySelectorAll("[data-guide]").forEach((b) => (b.onclick = () => {
    const g = b.dataset.guide;
    if (g === "obj") { L.objClosed = false; render(); }
    if (g === "dil") { L.ui.dSlot = null; L.ui.dChoice = null; L.ui.dTarget = null; L.dilemmaClosed = false; L.ovKey = ""; render(); }
    if (g === "end") { L.endClosed = false; render(); }
    if (g === "plauto") { setInput("placement", { ok: true }); A.play("seal"); render(); }
    if (g === "plok") { const mineP = E.provincesOf(st, pid); const alloc = { ok: true }; mineP.forEach((id) => (alloc[id] = (L.ui.placement || {})[id] || 1)); setInput("placement", alloc); A.play("seal"); render(); }
    if (g === "actions") { L.ui.tab = "panel"; render(); document.querySelector(".side").scrollIntoView({ behavior: "smooth" }); }
    if (g === "seal") { L.ui.build = null; saveOrders(true); A.play("seal"); render(); }
    if (g === "draftok") confirmDraft();
    if (g === "next") { setInput("next", { round: st.round }); A.play("click"); L.ovKey = ""; render(); }
    if (g === "force") { H.force = true; toast("La partie avance sans attendre les retardataires (leur intendant choisit pour eux).", "#A9843A"); }
    if (g === "score") openModal("score");
  }));
}

export const PHASE_LABEL = { objectives: "Objectifs secrets", draft: "Choix des provinces", placement: "Placement des armées", dilemma: "Les dilemmes", orders: "Ordres secrets", reveal: "Révélation", interlude: "Chronique", end: "Fin de partie" };

export function renderTop() {
  const st = S();
  $("#tb-round").innerHTML = st.round > 0 ? `<span class="long">ANNO DOMINI ${E.yearOf(st.round)} · MANCHE ${st.round} SUR ${st.maxRounds}</span><span class="short">${E.yearOf(st.round)} · ${st.round}/${st.maxRounds}</span>` : `<span class="long">ANNO DOMINI 1347 · PRÉPARATIFS</span><span class="short">1347</span>`;
  $("#tb-phase").textContent = PHASE_LABEL[st.phase] || "";
  $("#btn-mute").innerHTML = A.isMuted()
    ? '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" stroke-width="2"/></svg>'
    : '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
}

// ---- le bandeau des maisons : score, liens et toute la famille, toujours sous les yeux ----
function famStrip(st, pid) {
  const fam = st.families[pid];
  const color = HOUSES[st.players[pid].house].color;
  const k = E.king(st, pid), co = E.consort(st, pid);
  const heirs = E.heirs(st, pid);
  const start = (st.roundStart && st.roundStart[pid] && st.roundStart[pid].family) || [];
  const alive = fam.members.filter((m) => m.alive && ["king", "queen", "child", "widow"].includes(m.role));
  const order = [k, co, ...heirs, ...alive.filter((m) => m !== k && m !== co && !heirs.includes(m))].filter((m, i, a) => m && a.indexOf(m) === i);
  // morts récents (depuis le début de la manche) : encore visibles, barrés
  const dead = start.map((id) => fam.members.find((m) => m.id === id)).filter((m) => m && !m.alive);
  const roleOf = (m) => (k && m.id === k.id ? (m.sex === "f" ? "reine régnante" : "roi") : co && m.id === co.id ? (m.sex === "f" ? "reine" : "prince consort") : heirs[0] && m.id === heirs[0].id ? (m.sex === "f" ? "héritière" : "héritier") : m.sex === "f" ? "fille" : "fils");
  const one = (m, isDead) => {
    const sp = m.spouse ? E.personById(st, m.spouse) : null;
    const spH = m.spouse && st.players[m.spouse.pid] ? st.players[m.spouse.pid] : null;
    const tr = m.trait ? ` · ${m.trait}` : "";
    const tip = `${E.personTitle(m)} — ${roleOf(m)}, ${m.age} ans${tr}${sp ? ` · marié${m.sex === "f" ? "e" : ""} à ${E.personTitle(sp)} (${spH ? spH.hname || HOUSES[spH.house].name : "?"})` : ""}${m.bastardOf && m.bastardOf !== pid && st.players[m.bastardOf] ? " · on murmure qu'il est le bâtard d'une autre maison" : ""}${isDead ? ` · ✝ ${m.cause || "mort"}` : ""}`;
    const born = !isDead && start.length && !start.includes(m.id);
    return `<span class="fm ${isDead ? "dead" : ""} ${k && m.id === k.id ? "ruler" : ""}" title="${esc(tip)}">${portraitSvg(m, color)}${spH ? `<i class="ring" style="--rc:${HOUSES[spH.house].color}">⚭</i>` : ""}${born ? '<i class="new">nouveau</i>' : ""}${isDead ? '<i class="cross">✝</i>' : ""}<span class="fm-n">${esc(m.name)}</span></span>`;
  };
  const shown = order.slice(0, 6);
  return `<span class="famstrip">${shown.map((m) => one(m, false)).join("")}${order.length > 6 ? `<span class="fm more">+${order.length - 6}</span>` : ""}${dead.slice(0, 2).map((m) => one(m, true)).join("")}${!order.length ? '<span class="fm-none">Plus aucun héritier !</span>' : ""}</span>`;
}

function relBadges(st, meP, pid) {
  if (!meP || pid === meP) return "";
  const out = [];
  if (E.allied(st, meP, pid)) out.push('<span class="rel" title="Vos familles sont unies par un mariage">⚭ ALLIÉ</span>');
  else if (E.bound(st, meP, pid)) { const t = (st.treaties || []).find((x) => (x.a === meP && x.b === pid) || (x.a === pid && x.b === meP)); out.push(`<span class="rel treaty" title="Trêve : vous attaquer serait une trahison">TRÊVE${t ? ` → M${t.until}` : ""}</span>`); }
  const rel = st.rel || [];
  if (rel.some((r) => r.k === "trahison" && r.a === pid && r.b === meP)) out.push('<span class="rel enemy" title="Cette maison t\'a trahi">TRAÎTRE</span>');
  else if (rel.some((r) => (r.k === "attaque" || r.k === "conquete") && r.a === pid && r.b === meP && r.r >= st.round - 1)) out.push('<span class="rel enemy" title="Cette maison t\'a attaqué récemment">T\'A ATTAQUÉ</span>');
  return out.join("");
}

export function renderPlayers() {
  const st = S();
  const hide = scoresHidden(st);
  const meP = me();
  const pub = (pid) => E.publicScore(st, pid);
  const order = st.round > 0 && !hide ? st.order.slice().sort((a, b) => pub(b) - pub(a)) : st.order;
  const top = Math.max(1, ...st.order.map(pub));
  $("#playersbar").innerHTML = order.map((pid, rank) => {
    const p = st.players[pid];
    const seatUids = Object.entries(st.seats || {}).filter(([, v]) => v === pid).map(([u]) => u);
    const online = p.isBot || seatUids.some((u) => L.members[u] && L.members[u].online !== false);
    const ready = st.ready && st.ready[pid];
    const nprov = E.provincesOf(st, pid).length;
    const dice = pid === meP ? myDice() : p.dice || [];
    const showDice = ["dilemma", "orders"].includes(st.phase) && dice.length;
    const pw = E.housePower(st, pid);
    return `<button class="pchip hcard ${pid === meP ? "me" : ""}" data-pid="${pid}" style="--hc:${HOUSES[p.house].color}" aria-label="Voir la maison ${esc(houseName(pid))}">
      <span class="hc-top">${st.leader === pid && !hide ? '<svg class="crown" width="22" height="14" viewBox="-12 -8 24 15" aria-hidden="true"><path d="M-11,6 L-11,-4 L-5,1 L0,-7 L5,1 L11,-4 L11,6 Z" fill="#A9843A" stroke="#241811" stroke-width="1.2"/></svg>' : ""}${st.round > 0 && !hide ? `<span class="rankno">${rank + 1}</span>` : ""}${shield(p.house, 26)}
      <span class="hc-id"><span class="pc-name">${pid === meP ? "Toi · " : ""}${esc(houseName(pid))}${p.isBot ? " · ordi" : ""}</span><span class="hc-pw" title="${esc(pw.power || "")} Faiblesse : ${esc(pw.weak || "")}">${esc(pw.title || "")}</span></span>
      <span class="hc-score" title="Score visible (sans les objectifs secrets)">${hide ? "?" : pub(pid)}<small>pts</small></span></span>
      <span class="pc-stats">${H_ICON.prestige}${hide ? "?" : p.prestige} ${H_ICON.province}${nprov} ${H_ICON.gold}${p.gold}${showDice ? `<span class="minidice">${dice.map((v) => (v ? `<span>${v}</span>` : '<span class="q">?</span>')).join("")}</span>` : ""}${relBadges(st, meP, pid)}${!online ? ' <span class="off">absent</span>' : ""}${ready && ["objectives", "placement", "dilemma", "orders", "reveal", "interlude"].includes(st.phase) ? ` <span class="ready">${st.phase === "reveal" ? "a lu ✓" : "prêt ✓"}</span>` : ""}</span>
      ${st.round > 0 && !hide ? `<span class="racebar"><div style="width:${Math.max(4, (pub(pid) / top) * 100)}%;background:${HOUSES[p.house].color}"></div></span>` : ""}
      ${st.families && st.families[pid] ? famStrip(st, pid) : ""}
    </button>`;
  }).join("");
  $("#playersbar").querySelectorAll(".pchip").forEach((b) => (b.onclick = () => { L.ui.viewHouse = b.dataset.pid; openModal("house"); }));
}
