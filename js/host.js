// Arbitre : seul le navigateur de l'hôte exécute ce code
import { HUMAN_HOUSES } from "./content.js?v=1795358374";
import * as E from "./engine.js?v=1795358374";
import { H, L, SOLO, SPEED, esc, hostGoneSince, net, setHostGoneSince, setWakeLock, wakeLock } from "./state.js?v=1795358374";
import { toast } from "./ui/common.js?v=1795358374";
import { aiName } from "./ui/lobby.js?v=1795358374";

// Lit une donnée sur le serveur en réessayant si la connexion est mauvaise (ok = false : lecture impossible).
async function readRetry(fn, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try { return { ok: true, value: await fn() }; }
    catch (e) { console.warn("lecture ratée, nouvel essai", e); await new Promise((r) => setTimeout(r, 600 * (i + 1))); }
  }
  return { ok: false, value: null };
}
const emptyPriv = () => ({ used: [], objOffer: [], objectives: [], dilemma: null });

// Ce navigateur devient l'arbitre. Si une partie est en cours (reprise après le départ de l'ancien arbitre),
// on relit TOUT sur le serveur : l'état, les données privées de chaque joueur et celles des seigneurs ordinateur.
// Si une lecture échoue, on ne touche à rien (on n'écrase jamais des données qu'on n'a pas pu lire) et on réessaie.
export async function becomeHost() {
  H.active = true; H.since = 0; H.inputs = {};
  const retryLater = (why) => {
    H.active = false; H.state = null; H.priv = null;
    toast(`${why} Nouvel essai dans quelques secondes…`, "#A3221A", 5000);
    setTimeout(() => { if (L.code && L.meta && L.meta.host === net.uid && !H.active) becomeHost(); }, 5000);
  };
  const rs = await readRetry(() => net.readState(L.code));
  if (!rs.ok) return retryLater("Impossible de relire la partie.");
  const state = rs.value;
  if (E.formatProblem(state)) { H.active = false; return; } // partie d'un autre format : on ne l'arbitre pas
  if (state && state.phase && state.phase !== "lobby") {
    const priv = {};
    for (const [u, p] of Object.entries(state.seats || {})) {
      if (priv[p]) continue;
      const r = await readRetry(() => net.readPrivate(L.code, u));
      if (!r.ok) return retryLater("Impossible de relire les données privées des joueurs.");
      priv[p] = r.value || emptyPriv();
    }
    // seigneurs ordinateur : leurs données privées sont rangées sous leur nom (si le serveur ne les a pas, on repart de zéro)
    for (const p of state.order) {
      if (priv[p]) continue;
      priv[p] = (await net.readPrivate(L.code, p).catch(() => null)) || emptyPriv();
    }
    H.state = state; H.priv = priv;
    if (state.phase !== "end") toast("Tu es maintenant l'arbitre de la partie (ton navigateur calcule les manches).", "#A9843A");
    giveGrace(); // les joueurs ont été absents : on redonne du temps à la phase en cours
  } else { H.state = null; H.priv = null; }
  syncInputListeners();
  H.since = Date.now(); // on laisse arriver les ordres déjà posés avant de faire avancer la partie
  keepAwake();
}

// Après une reprise, si le chrono de la phase est fini (ou presque), on lui redonne un temps de jeu complet.
function giveGrace() {
  const st = H.state;
  if (!st || st.solo || !st.timer || st.timer === "none" || !st.deadline || st.phase === "end") return;
  const now = net.now();
  const mult = ({ relaxed: 2, normal: 1, fast: 0.7 }[st.timer] || 1) * SPEED;
  const secs = { objectives: E.TIMES.objectives, draft: E.TIMES.draft, placement: E.TIMES.placement, dilemma: E.TIMES.dilemma, orders: E.ordersTime(st.round), reveal: 30, interlude: E.TIMES.interlude }[st.phase];
  if (!secs || st.deadline - now > 10000 * SPEED) return;
  st.deadline = now + secs * 1000 * mult;
  hostWrite();
}

export async function keepAwake() { try { if (H.active && !wakeLock && navigator.wakeLock && document.visibilityState === "visible") { setWakeLock(await navigator.wakeLock.request("screen")); wakeLock.addEventListener("release", () => setWakeLock(null)); } } catch {} }

document.addEventListener("visibilitychange", keepAwake);

export function stopHost() { H.active = false; H.lastTick = 0; Object.values(H.inUnsub).forEach((u) => u()); H.inUnsub = {}; H.state = null; H.priv = null; }

export function syncInputListeners() {
  for (const u of Object.keys(L.members)) if (!H.inUnsub[u]) H.inUnsub[u] = net.listenInput(L.code, u, (o) => { H.inputs[u] = o || {}; });
}

export function pidInputs() {
  const r = {};
  if (!H.state) return r;
  for (const [u, o] of Object.entries(H.inputs)) { const p = H.state.seats && H.state.seats[u]; if (p) r[p] = { ...(r[p] || {}), ...o }; }
  return r;
}

export function hostWrite(privToo = false) {
  H.state.seq = (H.state.seq || 0) + 1;
  net.writeState(L.code, H.state).catch((e) => console.error("écriture état", e));
  if (privToo) for (const [u, p] of Object.entries(H.state.seats || {})) net.writePrivate(L.code, u, H.priv[p] || {}).catch((e) => console.error(e));
  // les seigneurs ordinateur aussi : si un autre joueur reprend l'arbitrage, rien n'est perdu
  if (privToo) for (const p of H.state.order || []) if (H.state.players[p] && H.state.players[p].isBot && H.priv[p]) net.writePrivate(L.code, p, H.priv[p]).catch((e) => console.warn("données de l'ordinateur non sauvegardées", e));
}

export function hostStart(opts = {}) {
  if (!(L.meta && L.meta.host === net.uid)) return;
  const list = Object.entries(L.members).filter(([, m]) => m.name && m.online !== false).sort((a, b) => (a[1].joined || 0) - (b[1].joined || 0)).slice(0, 4);
  const ais = Object.entries((L.meta && L.meta.ais) || {});
  const fill = opts.fill !== false;
  if (list.length + ais.length < 2 && !fill) return;
  const used = new Set(ais.map(([, a]) => a.house));
  const players = list.map(([u, m]) => {
    let house = m.house && !used.has(m.house) ? m.house : HUMAN_HOUSES.find((h) => !used.has(h));
    used.add(house);
    return { pid: u, name: m.name, house, hname: m.hname };
  });
  for (const [k, a] of ais) if (players.length < 4) players.push({ pid: k, name: a.name, house: a.house, isBot: true, ai: a.ai });
  // on complète toujours à 4 seigneurs : plus d'alliances, plus de trahisons
  if (fill) {
    const usedP = players.filter((p) => p.ai).map((p) => p.ai);
    for (const h of HUMAN_HOUSES) {
      if (players.length >= 4) break;
      if (players.some((p) => p.house === h)) continue;
      const pers = ["conquerant", "intrigant", "prudent"].find((x) => !usedP.includes(x)) || ["conquerant", "intrigant", "prudent"][Math.floor(Math.random() * 3)];
      usedP.push(pers);
      players.push({ pid: `ia-${h}`, name: aiName(pers), house: h, isBot: true, ai: pers });
    }
  }
  if (players.length === 2) players.push({ pid: "bot-anglais", name: "Édouard", house: "anglais", isBot: true });
  const tutorial = !!opts.tutorial, randomDraft = !!opts.randomDraft;
  const { state, priv } = E.createGame({ players, tutorial, randomDraft, code: L.code, rounds: +opts.rounds || 10 }, Math.random);
  state.solo = SOLO; // en solo : pas de chrono, on attend que tu valides
  state.timer = SOLO ? "none" : opts.timer || "none";
  state.gameId = Math.random().toString(36).slice(2, 10);
  state.seats = {};
  players.filter((p) => !p.isBot).forEach((p) => (state.seats[p.pid] = p.pid));
  state.deadline = net.now() + E.TIMES.objectives * 1000 * ({ relaxed: 2, normal: 1, fast: 0.7 }[state.timer] || 1) * SPEED;
  state.ready = {};
  H.state = state; H.priv = priv;
  hostWrite(true);
}

export function hostReplay() {
  if (!H.active) return;
  H.state = { phase: "lobby", seq: (H.state ? H.state.seq : 0) + 1 };
  H.priv = null;
  net.writeState(L.code, H.state);
}

// Après une longue mise en veille de l'appareil, un autre joueur a peut-être repris l'arbitrage : on vérifie avant d'écrire quoi que ce soit.
async function recheckHost() {
  H.busy = true;
  try {
    const meta = await net.roomExists(L.code);
    if (meta && meta.host !== net.uid) { stopHost(); toast("Un autre joueur a repris l'arbitrage pendant ta pause.", "#75603F"); }
  } catch (e) { console.warn(e); }
  H.busy = false;
}

export function hostTick() {
  if (!H.active) { H.lastTick = 0; return; }
  const t = Date.now(), gap = H.lastTick ? t - H.lastTick : 0; H.lastTick = t;
  if (gap > 8000 && !SOLO) { recheckHost(); return; }
  if (!H.state || !H.state.phase || H.state.phase === "lobby" || H.busy) return;
  if (H.since && t - H.since < 2500) return;
  const st = H.state, now = net.now(), I = pidInputs();
  const m = ({ relaxed: 2, normal: 1, fast: 0.7 }[st.timer] || 1) * SPEED;
  const noClock = st.solo || st.timer === "none" || !st.timer;
  const humans = st.order.filter((p) => !st.players[p].isBot);
  // reprise de siège (changement d'appareil)
  let changed = false, privChanged = false;
  for (const [u, mem] of Object.entries(L.members)) {
    if (mem.claim && !st.seats[u] && st.players[mem.claim] && !st.players[mem.claim].isBot) {
      const holders = Object.entries(st.seats).filter(([, p]) => p === mem.claim).map(([x]) => x);
      if (!holders.some((x) => L.members[x] && L.members[x].online !== false)) { st.seats[u] = mem.claim; changed = true; privChanged = true; }
    }
  }
  // joueurs prêts
  const ready = {};
  for (const p of humans) {
    const i = I[p] || {};
    if (st.phase === "objectives") ready[p] = (i.objPick || []).length === 2;
    if (st.phase === "placement") ready[p] = !!(i.placement && i.placement.ok);
    if (st.phase === "dilemma") ready[p] = ["dilemma", "dilemma2", "council"].every((k) => !H.priv[p][k] || H.priv[p][k].round !== st.round || (i[k] && i[k].round === st.round));
    // révélation partagée : chacun valide la carte en cours, on passe à la suivante quand tout le monde a validé
    if (st.phase === "reveal") ready[p] = !!(i.revack && i.revack.round === st.round && i.revack.card >= (st.revCard || 0));
    if (st.phase === "orders") ready[p] = !!(i.orders && i.orders.round === st.round && i.orders.sealed);
    if (st.phase === "interlude") ready[p] = !!(i.next && i.next.round === st.round);
  }
  const rk = JSON.stringify(ready);
  if (rk !== H.lastReady) { H.lastReady = rk; st.ready = ready; changed = true; }
  const allReady = humans.every((p) => ready[p]);
  // propositions de mariage
  if (st.phase === "dilemma" || st.phase === "orders") {
    st.proposals = st.proposals || {};
    for (const p of humans) {
      const of = I[p] && I[p].offers;
      if (!of || of.round !== st.round) continue;
      for (const it of of.items || []) {
        const key = `${it.kind}:${p}__${it.to}`;
        if (!st.proposals[key] && E.canPropose(st, p, it.to, it.kind)) { st.proposals[key] = { kind: it.kind, from: p, to: it.to }; changed = true; }
      }
    }
  }
  // relance d'un dé contre de l'or (pendant les ordres)
  if (st.phase === "orders") {
    for (const p of humans) {
      const rr = I[p] && I[p].reroll;
      if (rr && rr.round === st.round && st.players[p].rerolled !== st.round && E.rerollDie(st, H.priv, p, rr.die, Math.random) !== null) { changed = true; privChanged = true; }
    }
  }
  const late = () => H.force || (!noClock && now > st.deadline);
  const go = (phaseDeadlineSec) => { st.deadline = now + phaseDeadlineSec * 1000 * m; st.ready = {}; H.lastReady = ""; H.force = false; };
  try {
    switch (st.phase) {
      case "objectives":
        if (allReady || late()) {
          E.finishObjectives(st, H.priv, I);
          E.startDraft(st, Math.random);
          if (E.draftDone(st)) { E.finishDraft(st, Math.random); go(E.TIMES.placement); }
          else { go(E.TIMES.draft); H.draftTurnAt = now; }
          hostWrite(true); return;
        }
        break;
      case "draft": {
        const cur = E.currentDrafter(st);
        let prov = null;
        if (st.players[cur].isBot) { if (now - H.draftTurnAt > 900) prov = E.autoPickProvince(st, cur, Math.random); }
        else {
          const dp = I[cur] && I[cur].draftPick;
          if (dp && dp.idx === st.draft.idx && st.provinces[dp.prov] && !st.provinces[dp.prov].owner) prov = dp.prov;
          else if (late()) prov = E.autoPickProvince(st, cur, Math.random);
        }
        if (prov) {
          E.draftPick(st, cur, prov);
          H.draftTurnAt = now;
          if (E.draftDone(st)) { E.finishDraft(st, Math.random); go(E.TIMES.placement); } else go(E.TIMES.draft);
          hostWrite(); return;
        }
        break;
      }
      case "placement":
        if (allReady || late()) {
          E.finishPlacement(st, I);
          E.startRound(st, H.priv, Math.random);
          go(E.TIMES.dilemma);
          hostWrite(true); return;
        }
        break;
      case "dilemma":
        if (allReady || late()) {
          E.finishDilemmas(st, H.priv, I, Math.random);
          go(E.ordersTime(st.round));
          hostWrite(true); return;
        }
        break;
      case "orders":
        if (allReady || late()) {
          E.resolveRound(st, H.priv, I, Math.random);
          st.revealStart = now + 2700;
          st.revCard = 0;
          st.deadline = now + 2700 + 60000 * m;
          st.ready = {}; H.lastReady = ""; H.force = false;
          hostWrite(true); return;
        }
        break;
      case "reveal":
        if (now < (st.revealStart || 0)) break;
        if (allReady || H.force || (!noClock && now > st.deadline)) {
          H.force = false;
          const cards = (st.reveal && st.reveal.cards) || [];
          st.revCard = (st.revCard || 0) + 1;
          st.ready = {}; H.lastReady = "";
          if (st.revCard < cards.length) { st.deadline = now + 60000 * m; hostWrite(); return; }
          if (st.gameOver) { E.finishGame(st, H.priv); st.deadline = 0; hostWrite(true); return; }
          st.phase = "interlude"; st.deadline = now + E.TIMES.interlude * 1000 * SPEED; hostWrite(); return;
        }
        break;
      case "interlude":
        if (allReady || H.force || now > st.deadline) {
          H.force = false;
          if (st.gameOver) { E.finishGame(st, H.priv); st.deadline = 0; }
          else { E.startRound(st, H.priv, Math.random); go(E.TIMES.dilemma); }
          hostWrite(true); return;
        }
        break;
    }
  } catch (e) {
    console.error("Erreur d'arbitrage", e);
    toast("Erreur d'arbitrage : " + esc(e.message), "#A3221A", 8000);
    H.busy = true; setTimeout(() => (H.busy = false), 3000);
  }
  if (changed) hostWrite(privChanged);
}

export function checkHostAlive() {
  if (!L.code || !L.meta || !L.meta.host || H.active) { setHostGoneSince(0); return; }
  const host = L.members[L.meta.host];
  const online = host && host.online !== false;
  if (online) { setHostGoneSince(0); return; }
  if (!hostGoneSince) { setHostGoneSince(Date.now()); return; }
  if (Date.now() - hostGoneSince < 12000) return;
  const seated = L.state && L.state.seats ? Object.keys(L.state.seats) : Object.keys(L.members);
  const candidates = Object.keys(L.members).filter((u) => L.members[u].online !== false && (seated.includes(u) || !L.state)).sort();
  if (candidates[0] === net.uid) { setHostGoneSince(0); net.setHost(L.code, net.uid); }
}
