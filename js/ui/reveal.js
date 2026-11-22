// Révélation partagée : les mêmes grandes cartes pour tout le monde ; on passe à la suivante quand chacun a validé.
import * as A from "../audio.js?v=1795378288";
import { HOUSES, OBJECTIVES } from "../content.js?v=1795378288";
import * as E from "../engine.js?v=1795378288";
import { ICON } from "../help.js?v=1795378288";
import { PROVINCES } from "../map.js?v=1795378288";
import { $, L, MAP, RV, S, SPEED, esc, me, net } from "../state.js?v=1795378288";
import { speak } from "./announce.js?v=1795378288";
import { houseColor, houseName, setInput } from "./common.js?v=1795378288";
import { dieSvg, shield } from "./draw.js?v=1795378288";
import { entryHtml, findPerson, portraitSvg } from "./house.js?v=1795378288";
import { drawArrows, fx, marchArmies, updateMap } from "./map.js?v=1795378288";
import { colorize, houseTag, peopleIn } from "./names.js?v=1795378288";
import { battleQuip } from "./news.js?v=1795378288";
import { openModal } from "./overlays.js?v=1795378288";

export const CARD_TITLES = {
  court: ["Les affaires des cours", "Ce que chaque maison a décidé. Les affaires privées des autres n'arrivent qu'en rumeur."],
  intrigue: ["Complots et intrigues", "Poisons, séductions et pots-de-vin."],
  move: ["Les armées se mettent en marche", "Levées et déplacements de troupes de chaque maison."],
  battle: ["Les batailles", "Chaque attaque, l'une après l'autre."],
  diplo: ["Diplomatie et trahisons", "Mariages, trêves, or et accusations."],
  time: ["Trois années passent", "Revenus, solde des troupes, morts, naissances, révoltes et fléaux."],
  summary: ["Le bilan de la manche", "Qui a gagné quoi, qui a tout perdu."],
  objectives: ["Les ambitions secrètes", "Les objectifs de chaque maison sont enfin dévoilés."],
  final: ["Le Couronnement", "Le décompte final des points."],
};

// état local de l'affichage (pas partagé) : carte regardée, animation des batailles
const RVX = { key: "", card: -1, view: null, bi: -1, pre: false, timer: null, spoken: "" };

export const cardsOf = (st) => (st && st.reveal && st.reveal.cards) || [];
// dans la carte des batailles, seules les vraies batailles sont animées (les trahisons s'affichent au-dessus)
const battleKs = (st, card) => card.ks.filter((k) => st.reveal.steps[k] && st.reveal.steps[k].kind === "battle" && st.reveal.steps[k].atk);
const curCard = (st) => Math.min(st.revCard || 0, cardsOf(st).length - 1);
const shownCard = (st) => (RVX.view !== null && RVX.view < curCard(st) ? RVX.view : curCard(st));

// dernière étape déjà visible sur la carte pour la carte regardée
function lastStepIdx(st) {
  const cards = cardsOf(st), c = shownCard(st), card = cards[c];
  if (!card) return -1;
  if (!card.ks.length) return ["summary", "objectives", "final"].includes(card.type) ? st.reveal.steps.length - 1 : -1;
  if (card.type === "battle" && c === curCard(st) && RVX.bi >= 0 && RVX.bi < battleKs(st, card).length) return battleKs(st, card)[RVX.bi] - (RVX.pre ? 1 : 0);
  return card.ks[card.ks.length - 1];
}
export function revealIdx() { const st = S(); return st && st.reveal ? lastStepIdx(st) : -1; }
export function revealProvinces() {
  const st = S();
  if (!st.reveal) return st.provinces;
  const view = JSON.parse(JSON.stringify(st.revealFrom || st.provinces));
  const idx = lastStepIdx(st);
  if (idx >= st.reveal.steps.length - 1 && cardsOf(st)[shownCard(st)] && !cardsOf(st)[shownCard(st)].ks.length) return st.provinces;
  for (let i = 0; i <= idx; i++) { const s = st.reveal.steps[i]; if (s && s.set) Object.assign(view, JSON.parse(JSON.stringify(s.set))); }
  return view;
}

export function rvFocus(st) {
  const out = { hl: [], red: [], arrows: [], badges: [] };
  const card = cardsOf(st)[shownCard(st)];
  if (!card) return out;
  const steps = (card.type === "battle" ? battleKs(st, card) : card.ks).map((k) => st.reveal.steps[k]);
  if (card.type === "battle") {
    const list = shownCard(st) === curCard(st) && RVX.bi >= 0 && RVX.bi < steps.length ? [steps[RVX.bi]] : steps;
    for (const s of list) { if (!s.prov) continue; out.red.push(s.prov); out.hl.push(...(s.from || [])); out.arrows.push(...(s.from || []).map((f) => ({ from: f, to: s.prov, color: "#A3221A" }))); }
  } else if (card.type === "move") {
    for (const s of steps) { out.hl.push(...(s.provs || [])); out.arrows.push(...(s.mv || []).map((m) => ({ from: m.from, to: m.to, color: "#241811" }))); out.badges.push(...(s.mv || []).map((m) => ({ prov: m.to, text: `+${m.n}`, color: "#241811" })), ...(s.lv || []).map((l) => ({ prov: l.to, text: `+${l.n}`, color: "#2F5233" }))); }
  } else for (const s of steps) if (s.prov) (s.kind === "revolt" ? out.red : out.hl).push(s.prov);
  return out;
}

// ---------- contenu des cartes ----------
const line = (s, extra = "") => { const f = itemFace(s); return `<div class="rv-item k-${s.kind} ${extra} ${f ? "has-face" : ""}">${f || itemIcon(s)}<div>${s.title ? entryHtml(s) : colorize(s.text)}${s.kind === "death" ? '<span class="rv-reg">✝ Inscrit au registre des morts</span>' : ""}</div></div>`; };
// morts, naissances, mariages, complots : le visage de la personne plutôt qu'une icône
function itemFace(s) {
  if (!["death", "birth", "marriage", "claim", "intrigue", "betrayal"].includes(s.kind)) return "";
  const st = S(), r = peopleIn(s.text, 1)[0];
  const f = r && findPerson(st, r.id);
  if (!f) return "";
  const color = HOUSES[st.players[f.pid].house].color;
  // une mort : le visage est montré vivant, puis se fige en gris (animation) et une croix s'imprime
  if (s.kind === "death" && !f.m.alive) return `<span class="rv-face dying" data-who="${esc(f.pid)}|${esc(f.m.id)}">${portraitSvg({ ...f.m, alive: true, health: 0 }, color)}<i class="rv-cross-s">✝</i></span>`;
  return `<span class="rv-face" data-who="${esc(f.pid)}|${esc(f.m.id)}">${portraitSvg(f.m, color)}</span>`;
}
function itemIcon(s) {
  const I = { death: ICON.death, birth: ICON.family, marriage: ICON.ring, betrayal: ICON.target, intrigue: ICON.intrigue, bribe: ICON.gold, gift: ICON.gold, plague: ICON.plague, revolt: ICON.colere, treaty: ICON.scroll, feast: ICON.colere, council: ICON.prestige, claim: ICON.province, exile: ICON.province, event: ICON.scroll, economy: ICON.gold };
  return `<span class="rv-ic">${I[s.kind] || ICON.scroll}</span>`;
}
// regroupe des étapes par maison, la mienne d'abord
function byHouse(st, steps, render = line) {
  const groups = new Map();
  for (const s of steps) { const k = s.pid && st.players[s.pid] ? s.pid : "_"; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(s); }
  const order = [me(), ...st.order.filter((p) => p !== me()), "_"].filter((p) => groups.has(p));
  return order.map((p) => `<div class="rv-house" style="--hc:${p === "_" ? "#75603F" : houseColor(p)}"><div class="rv-hh">${p === "_" ? `<span>${ICON.scroll}</span><b>Le royaume</b>` : `${shield(st.players[p].house, 22)}<b>${esc(houseName(p))}</b>${p === me() ? '<i class="you">toi</i>' : ""}`}</div>${groups.get(p).map((s) => render(s)).join("")}</div>`).join("");
}

function councilHtml(st, s) {
  const votes = (s.votes || []).map((v) => `<div class="vote">${houseTag(v.from)}<span class="arrow">→</span>${v.to ? houseTag(v.to) : "<i>abstention</i>"}</div>`).join("");
  return `<div class="rv-council"><div class="rv-ct">${ICON.prestige}<b>${esc(s.title)}</b></div><p class="rv-sit">${esc(s.situation || "")}</p><div class="votes">${votes}</div><p class="rv-res">${colorize(s.text)}</p></div>`;
}

function duelRow(st, s, i, state) {
  const a = s.atk[0];
  const hidden = state === "hidden", rolling = state === "rolling";
  const side = (pid, n, bonus, total, win) => `<div class="ds ${hidden || rolling ? "" : win ? "win" : "lose"}">${pid ? shield(st.players[pid].house, 26) : '<svg width="26" height="30" viewBox="0 0 64 74"><path d="M4,4 H60 V34 C60,54 46,66 32,70 C18,66 4,54 4,34 Z" fill="#8C7556" stroke="#241811" stroke-width="3"/></svg>'}<span class="fc ${rolling ? "rolling" : ""}">${hidden || rolling ? "?" : total}</span><span class="dt">${n} arm.${bonus ? ` +${bonus}` : ""}</span></div>`;
  return `<button class="rv-duel ${hidden ? "pending" : ""}" data-battle="${i}"><div class="dl-title">${ICON.army}<b>${esc(PROVINCES[s.prov].name)}</b> · ${houseTag(a.pid)}${s.atk.length > 1 ? ` (+${s.atk.length - 1})` : ""} attaque ${s.def ? houseTag(s.def) : "<i>la milice</i>"}</div>
    <div class="dl-body">${side(a.pid, a.n, a.bonus, a.total, s.attWins)}<span class="vs">contre</span>${side(s.def, s.defArmies, s.defBonus, s.defTotal, !s.attWins)}</div>
    ${hidden ? "" : rolling ? `<div class="verdict">Le choc des armées…</div>` : `<div class="verdict">${s.attWins ? `${houseTag(a.pid)} prend ${esc(PROVINCES[s.prov].art)} !` : `${s.def ? houseTag(s.def) : "La milice"} tient bon.`}</div><p class="rv-quip">${esc(battleQuip(st, s))}</p>`}</button>`;
}

function econHtml(st, s) {
  const rows = (s.rows || []).map((r) => `<tr style="--hc:${houseColor(r.pid)}"><td>${houseTag(r.pid)}</td><td class="pos">+${r.income}</td><td class="neg">−${r.upkeep}</td><td>${r.desert ? `<span class="neg">${r.desert} déserteurs</span>` : "—"}</td><td><b>${r.gold}</b></td></tr>`).join("");
  return `<div class="rv-econ"><div class="rv-ct">${ICON.gold}<b>Le trésor</b></div><table><thead><tr><th>Maison</th><th>Revenu</th><th>Solde des troupes</th><th>Sans paie</th><th>Or</th></tr></thead><tbody>${rows}</tbody></table><p class="hint">Revenu = 1 or par province (+ mariages, + bonus de maison). Solde = 1 or pour 5 armées. Sans or pour payer, des soldats désertent.</p></div>`;
}

function summaryTable(st) {
  const rs = st.roundStart || {};
  const now = E.snapshotPlayers(st);
  const rows = st.order.filter((p) => st.players[p].house !== "anglais").map((p) => {
    const a = rs[p], b = now[p];
    const d = (x, y) => (a ? y - x : 0);
    const dv = (v, inv) => (v ? `<span class="${(v > 0) !== !!inv ? "pos" : "neg"}">${v > 0 ? "+" : ""}${v}</span>` : '<span class="zero">=</span>');
    const fam = st.families[p].members;
    const dead = a ? a.family.filter((id) => !b.family.includes(id)).length : 0;
    const born = a ? b.family.filter((id) => !a.family.includes(id)).length : 0;
    return { p, html: `<tr class="${p === me() ? "me" : ""}" style="--hc:${houseColor(p)}"><td>${houseTag(p)}</td><td>${dv(d(a?.prestige, b.prestige))}</td><td>${dv(d(a?.provs.length, b.provs.length))}</td><td>${dv(d(a?.armies, b.armies))}</td><td>${dv(d(a?.gold, b.gold))}</td><td>${dead ? `<span class="neg">✝${dead}</span>` : ""}${born ? ` <span class="pos">+${born}</span>` : ""}${!dead && !born ? '<span class="zero">=</span>' : ""}</td><td><b>${E.publicScore(st, p)}</b></td></tr>`, s: E.publicScore(st, p) };
  }).sort((x, y) => y.s - x.s);
  const hide = st.gameOver;
  return `<table class="rv-sum"><thead><tr><th>Maison</th><th title="Prestige">${ICON.prestige}</th><th title="Provinces">${ICON.province}</th><th title="Armées">${ICON.army}</th><th title="Or">${ICON.gold}</th><th title="Famille">${ICON.family}</th><th>Score*</th></tr></thead><tbody>${rows.map((r) => r.html).join("")}</tbody></table><p class="hint">* Score visible : Prestige + 3 par province + 3 par région + famille + 1 par 10 or. Les objectifs secrets s'ajoutent à la fin${hide ? " : place au Couronnement !" : "."}</p>`;
}

function objectivesHtml(st) {
  const r = st.result;
  if (!r) return "<p>…</p>";
  return r.rows.map((x) => `<div class="rv-house" style="--hc:${houseColor(x.pid)}"><div class="rv-hh">${shield(st.players[x.pid].house, 22)}<b>${esc(houseName(x.pid))}</b>${x.pid === me() ? '<i class="you">toi</i>' : ""}</div>${(x.objectives || []).map((o) => `<div class="rv-obj ${o.done ? "ok" : "ko"}"><span>${o.done ? "✓" : "✗"}</span><span>${esc(o.text)}</span><b>${o.done ? "+" + o.pts : "0"}</b></div>`).join("") || "<p class='hint'>Aucun objectif.</p>"}</div>`).join("");
}

function finalHtml(st) {
  const r = st.result;
  if (!r) return "<p>…</p>";
  const rows = r.rows.map((x, i) => `<tr class="${i === 0 ? "win" : ""} ${x.pid === me() ? "me" : ""}" style="--hc:${houseColor(x.pid)};animation-delay:${(r.rows.length - i) * 0.35}s"><td>${i === 0 ? "♛ " : `${i + 1}. `}${houseTag(x.pid)}</td><td>${x.prestige}</td><td>${x.provPts ?? x.provinces}</td><td>${x.regPts ?? x.regions * 3}</td><td>${x.objPts}</td><td>${x.family}</td><td>${x.goldPts || 0}</td><td><b>${x.total}</b></td></tr>`).join("");
  return `<table class="rv-sum final"><thead><tr><th>Maison</th><th>Prestige</th><th>Provinces</th><th>Régions</th><th>Objectifs</th><th>Famille</th><th>Or</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table><p class="rv-winner">${houseTag(r.winner)} est couronnée à Reims.</p>`;
}

function cardBody(st, card, c) {
  const steps = card.ks.map((k) => st.reveal.steps[k]);
  switch (card.type) {
    case "court": {
      const council = steps.filter((s) => s.kind === "council");
      const rest = steps.filter((s) => s.kind !== "council");
      return council.map((s) => councilHtml(st, s)).join("") + byHouse(st, rest);
    }
    case "move": return byHouse(st, steps, (s) => `<div class="rv-item">${ICON.army}<div>${colorize(s.text.replace(/^[^:]+ : /, ""))}</div></div>`) + `<p class="hint">Sur la carte : flèches noires = déplacements, pastilles vertes = armées levées.</p>`;
    case "battle": {
      const other = steps.filter((s) => !(s.kind === "battle" && s.atk));
      const bs = battleKs(st, card).map((k) => st.reveal.steps[k]);
      const live = c === curCard(st) && RVX.bi >= 0 && RVX.bi < bs.length;
      return other.map((s) => line(s, "alert")).join("") + `<p class="hint">${bs.length} bataille${bs.length > 1 ? "s" : ""}. Clique une bataille pour la revoir sur la carte.</p>` + bs.map((s, i) => duelRow(st, s, i, !live ? "done" : i < RVX.bi ? "done" : i === RVX.bi ? (RVX.pre ? "rolling" : "done") : "hidden")).join("");
    }
    case "time": {
      const econ = steps.filter((s) => s.kind === "economy");
      const groups = [["Morts", (s) => s.kind === "death"], ["Naissances", (s) => s.kind === "birth"], ["Révoltes et fléaux", (s) => ["revolt", "plague"].includes(s.kind)], ["Le royaume", (s) => !["death", "birth", "revolt", "plague", "economy"].includes(s.kind)]];
      return groups.map(([t, f]) => { const g = steps.filter(f); return g.length ? `<p class="rv-sec">${t}</p>${g.map((s) => line(s)).join("")}` : ""; }).join("") + econ.map((s) => econHtml(st, s)).join("");
    }
    case "summary": return summaryTable(st);
    case "objectives": return objectivesHtml(st);
    case "final": return finalHtml(st);
    default: return byHouse(st, steps);
  }
}

function ackBar(st, c) {
  const cur = curCard(st), cards = cardsOf(st);
  if (c < cur) return `<div class="rv-btns"><button class="btn btn-red grow" data-rvview="cur">Revenir à la carte en cours ▶</button></div>`;
  const humans = st.order.filter((p) => !st.players[p].isBot);
  const done = humans.filter((p) => (st.ready || {})[p]);
  const mine = me() && (st.ready || {})[me()];
  const sent = L.myInput.revack && L.myInput.revack.round === st.round && L.myInput.revack.card >= cur;
  const last = cur === cards.length - 1;
  const label = last ? (st.gameOver ? "Voir le couronnement ♛" : "Manche suivante ▶") : "Suivant ▶";
  const wait = humans.filter((p) => !(st.ready || {})[p] && p !== me());
  const battleBusy = cards[cur] && cards[cur].type === "battle" && RVX.bi >= 0 && RVX.bi < battleKs(st, cards[cur]).length;
  return `<div class="rv-acks">${humans.map((p) => `<span class="ack ${(st.ready || {})[p] ? "ok" : ""}" style="--hc:${houseColor(p)}" title="${esc(houseName(p))}">${shield(st.players[p].house, 16)}${(st.ready || {})[p] ? "✓" : "…"}</span>`).join("")}<span class="hint">${done.length}/${humans.length} prêts</span></div>
    <div class="rv-btns">${me() ? `<button class="btn btn-red grow rv-next" data-rvc="ack" ${mine || sent || battleBusy ? "disabled" : ""}>${mine || sent ? (wait.length ? `On attend ${wait.map((p) => esc(houseName(p))).join(", ")}…` : "C'est parti…") : battleBusy ? "Les batailles se jouent…" : label}</button>` : ""}</div>`;
}

export function rvCardHtml(st) {
  const cards = cardsOf(st);
  if (!cards.length || RVX.card < 0) return `<div class="rv-dock"><p class="rv-wait">Les sceaux se brisent…</p></div>`;
  const c = shownCard(st), card = cards[c];
  const [title, sub] = CARD_TITLES[card.type] || ["", ""];
  const tabs = `<div class="rv-tabs">${cards.map((k, i) => `<button class="rv-tab ${i === c ? "cur" : ""} ${i < curCard(st) ? "seen" : ""}" ${i > curCard(st) ? "disabled" : ""} data-rvview="${i}" title="${esc((CARD_TITLES[k.type] || [""])[0])}">${i + 1}</button>`).join("")}</div>`;
  const mourn = card.type === "time" && card.ks.some((k) => st.reveal.steps[k].kind === "death" && st.reveal.steps[k].pid === me());
  // une carte s'anime la première fois qu'elle s'affiche, pas à chaque rafraîchissement
  const fk = `${st.round}:${c}`, fresh = RVX.freshKey !== fk;
  if (fresh) setTimeout(() => { RVX.freshKey = fk; }, 2200);
  return `<div class="rv-dock card-${card.type} ${mourn ? "mourn" : ""} ${fresh ? "fresh" : ""}"><div class="rv-head"><span>${st.gameOver && st.round === st.maxRounds ? "Dernière manche" : `Manche ${st.round}`} · révélation</span>${tabs}</div>
    <h3 class="rv-title">${esc(title)}</h3><p class="rv-subt">${esc(sub)}</p>
    ${c === 0 ? hiddenDiceHtml(st) : ""}<div class="rv-content">${cardBody(st, card, c)}</div>${ackBar(st, c)}</div>`;
}

// première carte : les dés cachés de chaque maison se retournent (une seule fois par manche)
function hiddenDiceHtml(st) {
  const list = st.order.filter((pid) => { const pl = st.players[pid]; return pl.hiddenIdx >= 0 && pl.dice && pl.dice[pl.hiddenIdx]; });
  if (!list.length) return "";
  const flip = RVX.flipped !== st.round;
  if (flip) setTimeout(() => { RVX.flipped = st.round; }, 1500);
  return `<div class="rv-hidden"><span class="rv-hl">Les dés cachés se retournent</span>${list.map((pid, i) => `<span class="rv-hd">${shield(st.players[pid].house, 20)}<span class="die-flip ${flip ? "go" : ""}" style="animation-delay:${0.25 + i * 0.22}s">${dieSvg(st.players[pid].dice[st.players[pid].hiddenIdx], 30, true)}</span></span>`).join("")}</div>`;
}

export function panelReveal() { return { html: rvCardHtml(S()), bind: bindReveal }; }

export function bindReveal() {
  const st = S();
  document.querySelectorAll("[data-rvc='ack']").forEach((b) => (b.onclick = (ev) => { ev.stopPropagation(); setInput("revack", { round: st.round, card: curCard(st) }); A.play("page"); rvPaint(); }));
  document.querySelectorAll("[data-rvview]").forEach((b) => (b.onclick = (ev) => { ev.stopPropagation(); const v = b.dataset.rvview; RVX.view = v === "cur" ? null : +v; if (RVX.view === curCard(st)) RVX.view = null; rvPaint(); }));
  document.querySelectorAll(".rv-face[data-who]").forEach((b) => (b.onclick = (ev) => { ev.stopPropagation(); const [pid, id] = b.dataset.who.split("|"); openModal("person", { pid, id }); }));
  document.querySelectorAll("[data-battle]").forEach((b) => (b.onclick = () => { const i = +b.dataset.battle; const card = cardsOf(st)[shownCard(st)]; if (!card) return; const s = st.reveal.steps[battleKs(st, card)[i]]; if (s) { fx("battle", s.prov); MAP.hl = new Set(s.from || []); MAP.hlRed = new Set([s.prov]); drawArrows((s.from || []).map((f) => ({ from: f, to: s.prov, color: "#A3221A" }))); } }));
}

// animation des batailles une par une (même rythme chez tout le monde)
function playBattles(st) {
  clearTimeout(RVX.timer);
  const card = cardsOf(st)[curCard(st)];
  if (!card || card.type !== "battle") return;
  const ks = battleKs(st, card);
  const step = () => {
    const s = st.reveal.steps[ks[RVX.bi]];
    if (!s) { RVX.bi = ks.length; rvPaint(); return; }
    RVX.pre = true; rvPaint();
    // les armées marchent vers la province, puis le choc à l'arrivée
    const own = (f) => (st.revealFrom && st.revealFrom[f] && st.revealFrom[f].owner) || (s.atk[0] && s.atk[0].pid);
    marchArmies((s.from || []).map((f) => ({ from: f, to: s.prov, color: houseColor(own(f)), n: s.from.length === 1 && s.atk[0] ? s.atk[0].n : 0 })), 0.8 * Math.min(1, SPEED));
    A.play("march"); setTimeout(() => { A.play("battle"); fx("battle", s.prov); }, 780 * Math.min(1, SPEED));
    if (me() && st.revealFrom[s.prov] && st.revealFrom[s.prov].owner === me()) A.vibrate([120, 60, 120]);
    RVX.timer = setTimeout(() => {
      RVX.pre = false; rvPaint();
      if (s.attWins) { fx("conquest", s.prov, houseColor(s.winner)); A.play("conquest"); }
      speak(s.attWins ? `${houseName(s.atk[0].pid)} prend ${PROVINCES[s.prov].art}.` : `${PROVINCES[s.prov].art} résiste.`);
      RVX.timer = setTimeout(() => { RVX.bi++; if (RVX.bi < ks.length) step(); else rvPaint(); }, 1700 * SPEED);
    }, 1400 * SPEED);
  };
  RVX.bi = 0; step();
}

function cardSounds(st, card) {
  const steps = card.ks.map((k) => st.reveal.steps[k]);
  if (card.type === "court") A.play(steps.some((s) => s.kind === "council") ? "horn" : "bell");
  else if (card.type === "intrigue") { const d = steps.some((s) => s.kind === "death"); A.play(d ? "poison" : "click"); if (d) setTimeout(() => A.play("knell"), 1300); }
  else if (card.type === "move") { A.play("march"); marchArmies(steps.flatMap((s) => (s.mv || []).map((m) => ({ from: m.from, to: m.to, n: m.n, color: s.pid ? houseColor(s.pid) : "#5A4A36" }))), 1.1); }
  else if (card.type === "diplo") A.play(steps.some((s) => s.kind === "betrayal") ? "betrayal" : steps.some((s) => s.kind === "marriage") ? "bells" : "seal");
  else if (card.type === "time") { A.play(steps.some((s) => s.kind === "death") ? "knell" : "bell"); steps.filter((s) => s.kind === "revolt" && s.prov).forEach((s) => fx("battle", s.prov)); }
  else if (card.type === "summary") A.play("seal");
  else if (card.type === "objectives") A.play("horn");
  else if (card.type === "final") A.play("fanfare");
  const [t] = CARD_TITLES[card.type] || [""];
  speak(t);
}

// appelé par la boucle de temps : suit la carte en cours décidée par l'arbitre
export function tickReveal() {
  const st = S();
  if (!st || st.phase !== "reveal" || !st.reveal) { $("#banner").classList.add("hidden"); document.body.classList.remove("rv-on"); clearTimeout(RVX.timer); RVX.card = -1; RVX.key = ""; return; }
  document.body.classList.add("rv-on");
  const key = `${st.gameId}:${st.round}`;
  if (RVX.key !== key) { RVX.key = key; RVX.card = -1; RVX.view = null; RVX.bi = -1; }
  if (net.now() < (st.revealStart || 0)) return;
  const cur = curCard(st);
  if (RVX.card !== cur) {
    const first = RVX.card < 0;
    RVX.card = cur; RVX.view = null; RVX.bi = -1;
    if (first && window.innerWidth <= 900) { const m = $("#mapwrap"); if (m) window.scrollTo({ top: Math.max(0, m.getBoundingClientRect().top + window.scrollY - 56), behavior: "smooth" }); }
    const card = cardsOf(st)[cur];
    if (card) { cardSounds(st, card); if (card.type === "battle") { playBattles(st); return; } }
    rvPaint();
  }
}

export function rvPaint() {
  const st = S();
  if (!st || st.phase !== "reveal") return;
  const card = cardsOf(st)[shownCard(st)];
  const bn = $("#banner");
  if (card) { bn.className = "banner mini"; bn.innerHTML = `<b>${esc((CARD_TITLES[card.type] || [""])[0])}</b>`; } else bn.classList.add("hidden");
  const f = rvFocus(st);
  MAP.hl = new Set(f.hl); MAP.hlRed = new Set(f.red); MAP.badges = f.badges;
  updateMap(revealProvinces());
  drawArrows(f.arrows);
  if (L.ui.tab !== "panel") L.ui.tab = "panel";
  document.querySelectorAll("#side-tabs button").forEach((b) => b.classList.toggle("active", b.dataset.tab === "panel"));
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.id === "tab-panel"));
  const box = $("#tab-panel");
  const keep = box.querySelector(".rv-content") ? box.querySelector(".rv-content").scrollTop : 0;
  const pr = panelReveal(); box.innerHTML = pr.html; pr.bind();
  const rc = box.querySelector(".rv-content"); if (rc && RVX.view === null) rc.scrollTop = keep;
  // pendant les batailles, on fait défiler jusqu'à la bataille en cours
  if (card && card.type === "battle" && RVX.bi >= 0) { const el = box.querySelector(`[data-battle="${RVX.bi}"]`); if (el && rc) rc.scrollTop = Math.max(0, el.offsetTop - rc.offsetTop - 20); }
}

export function interludeLines() {
  const st = S();
  const pri = { death: 0, betrayal: 1, claim: 2, marriage: 3, intrigue: 4, battle: 5, revolt: 5, dilemma: 6, exile: 3, plague: 7, event: 7, birth: 8, text: 9 };
  return (st.chronicle || []).filter((c) => c.round === st.round).sort((a, b) => (pri[a.kind] ?? 9) - (pri[b.kind] ?? 9)).slice(0, 4);
}

export function duelHtml(st, s) { return duelRow(st, s, 0, "done"); }
