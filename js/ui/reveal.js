// Révélation : une info à la fois, bouton Suivant
import * as A from "../audio.js?v=1795296252";
import { PROVINCES } from "../map.js?v=1795296252";
import { $, L, MAP, RV, S, SPEED, esc, me, net, store } from "../state.js?v=1795296252";
import { speak } from "./announce.js?v=1795296252";
import { houseColor, houseName, setInput } from "./common.js?v=1795296252";
import { shield } from "./draw.js?v=1795296252";
import { entryHtml } from "./house.js?v=1795296252";
import { drawArrows, fx, updateMap } from "./map.js?v=1795296252";
import { battleQuip } from "./news.js?v=1795296252";
import { summaryHtml } from "./overlays.js?v=1795296252";

// ---- révélation : une info à la fois, on clique « Suivant » quand on l'a vue ----
export const CHAPTERS = {
  dil: ["I", "Les affaires des cours"],
  intr: ["II", "Les intrigues"],
  move: ["III", "Les troupes"],
  battle: ["IV", "Les batailles"],
  diplo: ["V", "La diplomatie"],
  end: ["VI", "Le bilan"],
};

export function rvList(st) {
  const key = `${st.gameId}:${st.round}:${st.reveal ? st.reveal.steps.length : 0}`;
  if (RV.key === key) return RV.list;
  RV.key = key; RV.i = -1; RV.t0 = 0; RV.pre = false;
  const list = [];
  const steps = st.reveal ? st.reveal.steps : [];
  steps.forEach((s, k) => {
    const ch = s.ch || "end";
    const last = list[list.length - 1];
    // tous les mouvements de troupes sont montrés ensemble sur la carte
    if (s.kind === "move" && last && last.kind === "move") { last.ks.push(k); return; }
    list.push({ ks: [k], ch, kind: s.kind });
  });
  list.push({ virt: "done", ch: "fin" });
  // numérotation dans chaque chapitre
  const tot = {}; list.forEach((e) => (tot[e.ch] = (tot[e.ch] || 0) + 1));
  const cur = {}; list.forEach((e) => { cur[e.ch] = (cur[e.ch] || 0) + 1; e.pos = cur[e.ch]; e.tot = tot[e.ch]; });
  RV.list = list;
  return list;
}

export function rvEntry(st) { return rvList(st)[RV.i]; }

export function rvStepIdx(st) {
  const list = rvList(st), e = list[RV.i];
  if (!e) return -1;
  if (e.virt === "done") return st.reveal.steps.length - 1;
  // pendant le suspense d'une bataille, la carte montre encore l'état d'avant
  return RV.pre ? e.ks[0] - 1 : e.ks[e.ks.length - 1];
}

export function revealIdx() { const st = S(); return st && st.reveal ? rvStepIdx(st) : -1; }

export function revealProvinces() {
  const st = S();
  const e = rvEntry(st);
  if (e && e.virt === "done") return st.provinces;
  const view = JSON.parse(JSON.stringify(st.revealFrom || st.provinces));
  const idx = rvStepIdx(st);
  for (let i = 0; i <= idx; i++) { const s = st.reveal.steps[i]; if (s && s.set) Object.assign(view, JSON.parse(JSON.stringify(s.set))); }
  return view;
}

export function rvFocus(st) {
  const e = rvEntry(st);
  const out = { hl: [], red: [], arrows: [], badges: [] };
  if (!e || e.virt) return out;
  for (const k of e.ks) {
    const s = st.reveal.steps[k];
    if (s.kind === "battle") { out.red.push(s.prov); out.hl.push(...(s.from || [])); out.arrows.push(...(s.from || []).map((f) => ({ from: f, to: s.prov, color: "#8E1B1B" }))); }
    else if (s.kind === "move") { out.hl.push(...(s.provs || [])); out.arrows.push(...(s.mv || []).map((m) => ({ from: m.from, to: m.to, color: "#2B1D12" }))); out.badges.push(...(s.mv || []).map((m) => ({ prov: m.to, text: `+${m.n}`, color: "#2B1D12" })), ...(s.lv || []).map((l) => ({ prov: l.to, text: `+${l.n}`, color: "#2F5233" }))); }
    else if (s.prov) out.hl.push(s.prov);
  }
  return out;
}

export const KIND_LABEL = { battle: "Bataille", death: "Mort", birth: "Naissance", intrigue: "Intrigue", bribe: "Corruption", move: "Mouvements de troupes", marriage: "Noces", betrayal: "Trahison", claim: "Revendication", exile: "Exil", plague: "Peste", event: "Événement", revolt: "Jacquerie", text: "Chronique", treaty: "Trêve", gift: "Or" };

export function rvLabel(st, s) {
  if (s.kind === "dilemma") return s.secret && s.pid !== me() ? `Rumeur · ${houseName(s.pid)}` : `Décision · ${s.pid ? houseName(s.pid) : "anonyme"}`;
  return (KIND_LABEL[s.kind] || "Chronique") + (s.kind === "battle" ? ` · ${PROVINCES[s.prov].city}` : "");
}

export function duelHtml(st, s, pre) {
  const a = s.atk[0];
  const side = (pid, name, n, bonus, total, win) => `<div class="dside ${pre ? "" : win ? "win" : "lose"}">${pid ? shield(st.players[pid].house, 34) : '<svg width="34" height="38" viewBox="0 0 64 74"><path d="M4,4 H60 V34 C60,54 46,66 32,70 C18,66 4,54 4,34 Z" fill="#8C7556" stroke="#2B1D12" stroke-width="3"/></svg>'}<span class="nm">${esc(name)}</span><span class="fc ${pre ? "rolling" : ""}">${pre ? "?" : total}</span><span class="dt">${n} armée${n > 1 ? "s" : ""}${bonus ? ` + ${bonus}` : ""} + hasard</span></div>`;
  return `<div class="rv-battle-title">${esc(houseName(a.pid))} attaque ${esc(PROVINCES[s.prov].art)}${s.def ? ` de ${esc(houseName(s.def))}` : " (milice)"}</div>
    <div class="duel">${side(a.pid, houseName(a.pid) + (s.atk.length > 1 ? ` (+${s.atk.length - 1})` : ""), a.n, a.bonus, a.total, s.attWins)}<span class="vs">contre</span>${side(s.def, s.def ? houseName(s.def) : "Milice", s.defArmies, s.defBonus, s.defTotal, !s.attWins)}</div>
    <div class="verdict">${pre ? "Le choc des armées…" : s.attWins ? `${esc(houseName(a.pid))} prend ${esc(PROVINCES[s.prov].art)} !` : `${s.def ? esc(houseName(s.def)) : "La milice"} tient ${esc(PROVINCES[s.prov].art)}.`}</div>
    ${pre ? "" : `<p class="rv-quip">${esc(battleQuip(st, s))}</p><p class="rv-sub">${esc(s.text)}</p>`}`;
}

export function rvCardHtml(st) {
  const e = rvEntry(st);
  if (!e) return `<div class="rv-dock"><p class="rv-wait">Les sceaux se brisent…</p></div>`;
  const list = rvList(st);
  const sent = L.myInput.revdone && L.myInput.revdone.round === st.round;
  if (e.virt === "done") {
    const waiting = st.order.filter((p) => !st.players[p].isBot && p !== me() && !(st.ready || {})[p]);
    return `<div class="rv-dock done"><div class="rv-head"><span>Fin de la révélation</span><span>${list.length - 1} événements</span></div>
      ${summaryHtml()}
      <div class="rv-btns"><button class="btn" data-rvc="prev">◀ Revenir</button><button class="btn btn-red grow" data-rvc="ok" ${sent ? "disabled" : ""}>${sent ? (waiting.length ? `On attend ${waiting.map((p) => esc(houseName(p))).join(", ")}…` : "C'est parti…") : `J'ai tout vu : manche suivante`}</button></div>
      <button class="rv-link" data-rvc="restart">Revoir depuis le début</button></div>`;
  }
  const head = `<div class="rv-head"><span>${CHAPTERS[e.ch] ? `Chapitre ${CHAPTERS[e.ch][0]} · ${CHAPTERS[e.ch][1]}` : ""}</span><span>${e.pos} sur ${e.tot}</span></div>`;
  let body = "";
  if (e.kind === "move") {
    body = `<p class="rv-label">Mouvements de troupes</p>${e.ks.map((k) => { const s = st.reveal.steps[k]; return `<p class="rv-move" style="border-left-color:${houseColor(s.pid)}">${esc(s.text)}</p>`; }).join("")}<p class="hint">Sur la carte : les flèches noires sont les déplacements, les pastilles vertes les armées levées.</p>`;
  } else {
    const s = st.reveal.steps[e.ks[0]];
    body = `<p class="rv-label" style="color:${s.pid ? houseColor(s.pid) : "var(--red)"}">${esc(rvLabel(st, s))}</p>${s.kind === "battle" && s.atk ? duelHtml(st, s, RV.pre) : `<div class="rv-text">${s.title ? entryHtml(s) : esc(s.text)}</div>`}`;
  }
  const mourn = !e.virt && e.kind === "death";
  return `<div class="rv-dock ${mourn ? "mourn" : ""}">${head}${mourn ? `<div class="rv-cross">✝</div>` : ""}${body}
    <div class="rv-btns"><button class="btn" data-rvc="prev" ${RV.i <= 0 ? "disabled" : ""}>◀</button><button class="btn btn-red grow rv-next" data-rvc="next" ${RV.pre ? "disabled" : ""}>Suivant ▶</button></div>
    <div class="rv-opts"><label class="check"><input type="checkbox" data-rvc="auto" ${RV.auto ? "checked" : ""}> <span>Lecture automatique</span></label><button class="rv-link" data-rvc="end">Tout passer</button><span class="rv-prog">${RV.i + 1} / ${list.length}</span></div></div>`;
}

export function panelReveal() {
  const st = S();
  const list = rvList(st);
  let hist = "";
  list.forEach((e, x) => {
    if (x >= RV.i || e.virt) return;
    const s = st.reveal.steps[e.ks[0]];
    const txt = e.kind === "move" ? `${e.ks.length} maison${e.ks.length > 1 ? "s" : ""} déplacent ou lèvent des troupes` : s.kind === "battle" && s.atk ? `${s.attWins ? "⚔ " + houseName(s.atk[0].pid) + " prend " + PROVINCES[s.prov].art : "⚔ " + PROVINCES[s.prov].name + " résiste à " + houseName(s.atk[0].pid)}` : (s.secret && s.pid !== me() ? "Rumeur : " : s.title ? `« ${s.title} » : ` : "") + s.text;
    hist += `<button class="rv-line" data-rv="${x}" style="border-left-color:${s.pid ? houseColor(s.pid) : "#6B5638"}">${esc(txt)}</button>`;
  });
  return { html: `${rvCardHtml(st)}${hist ? `<p class="ph" style="margin-top:16px">Déjà révélé <span class="hint">(clique pour revoir)</span></p><div class="rv-hist">${hist}</div>` : ""}`, bind: bindReveal };
}

export function bindReveal() {
  document.querySelectorAll("[data-rv]").forEach((b) => (b.onclick = () => rvGo(+b.dataset.rv)));
  const st = S();
  document.querySelectorAll("[data-rvc]").forEach((b) => {
    const c = b.dataset.rvc;
    const h = (ev) => {
      ev.stopPropagation();
      if (c === "prev") rvGo(RV.i - 1);
      else if (c === "next") rvGo(RV.i + 1);
      else if (c === "end") rvGo(rvList(st).length - 1);
      else if (c === "restart") rvGo(0);
      else if (c === "ok") { setInput("revdone", { round: st.round }); A.play("seal"); rvRender(false); }
    };
    if (c === "auto") b.onchange = () => { RV.auto = b.checked; store.set("sn_rvauto", RV.auto ? "1" : "0"); RV.t0 = net.now(); };
    else b.onclick = h;
  });
}

export function rvGo(i) {
  const st = S(); const list = rvList(st);
  const n = Math.max(0, Math.min(list.length - 1, i));
  const changed = n !== RV.i;
  RV.i = n; RV.t0 = net.now();
  rvRender(changed);
}

export function rvDur(st, e) {
  if (!e || e.virt) return 1e12;
  const s = st.reveal.steps[e.ks[0]];
  const ms = e.kind === "move" ? 6000 : s.kind === "battle" ? 6500 : s.kind === "dilemma" ? (s.secret && s.pid !== me() ? 5000 : 8000) : 5500;
  return ms * SPEED;
}

// le moteur de la révélation : démarre après le compte à rebours, avance seul seulement en lecture automatique
export function tickReveal() {
  const st = S();
  if (!st || st.phase !== "reveal" || !st.reveal) { $("#banner").classList.add("hidden"); document.body.classList.remove("rv-on"); return; }
  document.body.classList.add("rv-on");
  const now = net.now();
  if (RV.i < 0) {
    rvList(st);
    if (now >= (st.revealStart || 0)) {
      // sur téléphone, on remonte sur la carte pour suivre la révélation
      if (window.innerWidth <= 900) { const m = $("#mapwrap"); if (m) window.scrollTo({ top: Math.max(0, m.getBoundingClientRect().top + window.scrollY - 56), behavior: "smooth" }); }
      rvGo(0);
    }
    return;
  }
  const e = rvEntry(st);
  if (RV.auto && !RV.pre && !e.virt && now - RV.t0 > rvDur(st, e)) rvGo(RV.i + 1);
}

export function rvRender(stepChanged) {
  const st = S();
  const e = rvEntry(st);
  if (!e) return;
  clearTimeout(RV.preTimer);
  const s = !e.virt ? st.reveal.steps[e.ks[0]] : null;
  // une bataille : d'abord la carte d'avant et le choc, puis le résultat
  RV.pre = !!(stepChanged && s && s.kind === "battle" && s.atk);
  // petite étiquette en haut de la carte, qui ne cache rien
  const bn = $("#banner");
  if (s) { bn.className = "banner mini"; bn.innerHTML = `<b>${esc(e.kind === "move" ? "Mouvements de troupes" : rvLabel(st, s))}</b>`; }
  else bn.classList.add("hidden");
  rvPaint();
  if (stepChanged && s) {
    const pid = me();
    if (s.kind === "battle") {
      A.play("battle"); fx("battle", s.prov);
      if (pid && st.revealFrom[s.prov] && st.revealFrom[s.prov].owner === pid) A.vibrate([120, 60, 120]);
      RV.preTimer = setTimeout(() => {
        RV.pre = false; rvPaint();
        if (s.attWins) { fx("conquest", s.prov, houseColor(s.winner)); A.play("conquest"); }
        speak(s.attWins ? `${houseName(s.atk[0].pid)} prend ${PROVINCES[s.prov].art}.` : `${PROVINCES[s.prov].art} résiste.`);
      }, 1500 * SPEED);
    } else {
      speak(e.kind === "move" ? "Les troupes se mettent en marche." : s.secret && s.pid !== me() ? `Rumeur. ${s.text}` : s.text);
      if (s.kind === "death") { A.play(s.sound === "poison" ? "poison" : "knell"); const c = s.pid && st.players[s.pid] && st.players[s.pid].capital; if (c) fx("death", c); if (pid && s.pid === pid) A.vibrate([200, 100, 200]); }
      else if (s.kind === "birth") A.play("birth");
      else if (s.kind === "marriage") A.play("bells");
      else if (s.kind === "betrayal") A.play("betrayal");
      else if (s.kind === "bribe") { A.play("coins"); fx("conquest", s.prov, houseColor(s.pid)); }
      else if (s.kind === "claim") A.play("horn");
      else if (s.kind === "move") A.play("drum");
      else if (s.kind === "exile") A.play("knell");
      else if (s.kind === "treaty") A.play("seal");
      else if (s.kind === "gift") A.play("coins");
      else A.play("click");
    }
  } else if (stepChanged && e.virt === "done") A.play("bell");
}

export function rvPaint() {
  // panneau (récit + boutons) et carte, sans recalculer tout l'écran
  const st = S();
  const f = rvFocus(st);
  MAP.hl = new Set(f.hl); MAP.hlRed = new Set(f.red); MAP.badges = f.badges;
  updateMap(revealProvinces());
  drawArrows(f.arrows);
  if (L.ui.tab !== "panel") L.ui.tab = "panel";
  document.querySelectorAll("#side-tabs button").forEach((b) => b.classList.toggle("active", b.dataset.tab === "panel"));
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.id === "tab-panel"));
  const pr = panelReveal(); $("#tab-panel").innerHTML = pr.html; pr.bind();
}

export function interludeLines() {
  const st = S();
  const pri = { death: 0, betrayal: 1, claim: 2, marriage: 3, intrigue: 4, battle: 5, revolt: 5, dilemma: 6, exile: 3, plague: 7, event: 7, birth: 8, text: 9 };
  return (st.chronicle || []).filter((c) => c.round === st.round).sort((a, b) => (pri[a.kind] ?? 9) - (pri[b.kind] ?? 9)).slice(0, 4);
}
