// Les noms des maisons et des personnages, toujours à la couleur de leur maison, avec une bulle « qui est-ce ? »
import { HOUSES } from "../content.js?v=1795350372";
import * as E from "../engine.js?v=1795350372";
import { S, esc } from "../state.js?v=1795350372";

let cache = { key: "", re: null, map: null };

const ROLE = (m, st, pid) => {
  const k = E.king(st, pid);
  if (k && k.id === m.id) return m.sex === "f" ? "reine régnante" : "roi";
  if (m.role === "queen") return m.sex === "f" ? "reine" : "prince consort";
  if (m.role === "widow") return "douairière";
  if (m.role === "child") return m.bastard && !m.legit ? (m.sex === "f" ? "bâtarde" : "bâtard") : m.sex === "f" ? "fille" : "fils";
  return m.sex === "f" ? "dame" : "seigneur";
};

function build(st) {
  const key = `${st.gameId}:${st.seq}`;
  if (cache.key === key) return cache;
  const ent = [];
  for (const pid of st.order || []) {
    const pl = st.players[pid];
    if (!pl) continue;
    const color = (HOUSES[pl.house] || HOUSES.valcourt).color;
    const hn = pl.hname || (HOUSES[pl.house] || {}).name;
    for (const art of ["la maison", "La maison"]) ent.push({ t: E.maisonName(st, pid, art), pid, color, tip: `${pl.name || ""} · maison ${hn}` });
    if (pl.house === "anglais") ent.push({ t: "la couronne d'Angleterre", pid, color, tip: "l'Angleterre" });
    ent.push({ t: hn, pid, color, tip: `maison ${hn}` });
    for (const m of (st.families && st.families[pid] && st.families[pid].members) || []) {
      const title = E.personTitle(m);
      const born = m.bornOf && st.players[m.bornOf] ? ` (née ${st.players[m.bornOf].hname || HOUSES[st.players[m.bornOf].house].name})` : "";
      ent.push({ t: title, pid, color, tip: `${title} : ${ROLE(m, st, pid)} de la maison ${hn}${born}, ${m.age} ans${m.alive ? "" : ", mort" + (m.sex === "f" ? "e" : "")}` });
    }
  }
  // les plus longs d'abord (« la maison de Valcourt » avant « Valcourt »), sans doublon
  const seen = new Set();
  const list = ent.filter((e) => e.t && e.t.length > 2 && !seen.has(e.t) && seen.add(e.t)).sort((a, b) => b.t.length - a.t.length);
  const map = new Map(list.map((e) => [esc(e.t), e]));
  const re = list.length ? new RegExp(`(${list.map((e) => esc(e.t).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})(?![\\wÀ-ÿ])`, "g") : null;
  cache = { key, re, map };
  return cache;
}

// texte brut → HTML échappé avec les noms colorés
export function colorize(text) {
  const st = S();
  const safe = esc(text);
  if (!st || !st.order) return safe;
  const { re, map } = build(st);
  if (!re) return safe;
  return safe.replace(re, (m) => { const e = map.get(m); return e ? `<b class="nm" style="--hc:${e.color}" title="${esc(e.tip)}">${m}</b>` : m; });
}

// le nom d'une maison en pastille colorée
export function houseTag(pid) {
  const st = S();
  const pl = st && st.players[pid];
  if (!pl) return `<b class="nm">la milice</b>`;
  return `<b class="nm" style="--hc:${(HOUSES[pl.house] || HOUSES.valcourt).color}">${esc(pl.hname || HOUSES[pl.house].name)}</b>`;
}
