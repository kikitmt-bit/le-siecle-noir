// « Tes parties en cours » : la liste des parties de cet appareil, sur l'accueil (gardée dans le navigateur).
import { HOUSES } from "../content.js?v=1795368011";
import * as E from "../engine.js?v=1795368011";
import { $, esc, net, store } from "../state.js?v=1795368011";
import { shield } from "./draw.js?v=1795368011";

const KEY = "sn_games";
const MAX_GAMES = 8;
const CODE_OK = /^(?!SOLO$)[A-Z]{4}$/; // « SOLO » est la partie contre l'ordinateur : jamais dans la liste

export function loadGames() {
  try {
    const a = JSON.parse(store.get(KEY) || "[]");
    return Array.isArray(a) ? a.filter((g) => g && CODE_OK.test(g.code)) : [];
  } catch { return []; }
}
function saveGames(list) { store.set(KEY, JSON.stringify(list.sort((a, b) => (b.date || 0) - (a.date || 0)).slice(0, MAX_GAMES))); }

// Ajoute la partie à la liste, ou met à jour ce qu'on sait d'elle (maison, manche…). La date devient « maintenant ».
export function noteGame(code, info = {}) {
  if (!CODE_OK.test(code || "")) return;
  const list = loadGames();
  const g = list.find((x) => x.code === code) || { code };
  Object.assign(g, info, { date: Date.now() });
  saveGames([g, ...list.filter((x) => x.code !== code)]);
}
export function dropGame(code) { saveGames(loadGames().filter((g) => g.code !== code)); }

// Ce qu'on retient d'une partie à partir de son état (pid = ma maison dans la partie, ou null)
export function infoFromState(st, pid) {
  if (!st || !st.phase || st.phase === "lobby") return { round: 0, phase: "lobby", over: false };
  const info = { round: st.round, maxRounds: st.maxRounds, phase: st.phase, over: st.phase === "end", bad: E.formatProblem(st) || "" };
  const p = pid && st.players && st.players[pid];
  if (p) { info.house = p.house; info.maison = p.hname || (HOUSES[p.house] && HOUSES[p.house].name) || ""; info.name = p.name; }
  return info;
}

const ago = (t) => {
  const m = Math.max(0, Math.round((Date.now() - (t || 0)) / 60000));
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? "hier" : `il y a ${d} jours`;
};
export function progressText(g) {
  if (g.bad) return "Version du jeu incompatible";
  if (g.over) return "Partie terminée";
  if (!g.phase || g.phase === "lobby") return "Dans le salon";
  if (!g.round) return "En préparation";
  return `Manche ${g.round} sur ${g.maxRounds || 10}`;
}

function rowHtml(g) {
  const crest = g.house && HOUSES[g.house] ? shield(g.house, 30) : "";
  const title = g.maison ? `Maison ${esc(g.maison)}` : "Partie en ligne";
  return `<li class="game-row" data-code="${g.code}">
    ${crest ? `<span class="game-crest">${crest}</span>` : ""}
    <span class="game-info"><b>${title}</b><span class="game-sub">${esc(progressText(g))} · ${esc(ago(g.date))} · code ${g.code}</span></span>
    ${g.bad ? "" : `<button class="btn btn-small btn-red" data-resume="${g.code}">Reprendre</button>`}
    <button class="btn btn-small" data-drop="${g.code}" aria-label="Retirer cette partie de la liste" title="Retirer de la liste">✕</button>
  </li>`;
}

export function renderGames(onResume) {
  const box = $("#games");
  const list = loadGames();
  if (!box) return;
  box.classList.toggle("hidden", !list.length);
  if (!list.length) { box.innerHTML = ""; return; }
  box.innerHTML = `<p class="ph">Tes parties en cours</p><ul class="games-list">${list.map(rowHtml).join("")}</ul>`;
  box.querySelectorAll("[data-resume]").forEach((b) => (b.onclick = () => onResume(b.dataset.resume)));
  box.querySelectorAll("[data-drop]").forEach((b) => (b.onclick = () => { dropGame(b.dataset.drop); renderGames(onResume); }));
}

// Affiche la liste, puis vérifie sur le serveur : une partie qui n'existe plus disparaît, les autres se mettent à jour.
export async function refreshGames(onResume) {
  // ancienne sauvegarde (une seule partie) : on la reprend dans la liste
  const old = (store.get("sn_room") || "").toUpperCase();
  if (CODE_OK.test(old)) { if (!loadGames().some((g) => g.code === old)) noteGame(old); store.set("sn_room", ""); }
  renderGames(onResume);
  await Promise.all(loadGames().map(async (g) => {
    try {
      const meta = await net.roomExists(g.code);
      if (!meta) { dropGame(g.code); return; }
      const st = await net.readState(g.code).catch(() => null);
      const info = infoFromState(st, st && st.seats && st.seats[net.uid]);
      const list = loadGames(); const cur = list.find((x) => x.code === g.code);
      if (cur) { Object.assign(cur, info); saveGames(list); } // on garde la date de la dernière visite
    } catch { /* pas de connexion : on garde la partie dans la liste */ }
  }));
  renderGames(onResume);
}
