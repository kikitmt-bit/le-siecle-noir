// Onglets Maison et Chronique, présentation de la famille
import { HEALTH, HOUSES, OBJECTIVES, TRAITS } from "../content.js?v=1795376900";
import * as E from "../engine.js?v=1795376900";
import { ICON } from "../help.js?v=1795376900";
import { $, L, S, esc, me } from "../state.js?v=1795376900";
import { scoresHidden, houseName } from "./common.js?v=1795376900";
import { shield } from "./draw.js?v=1795376900";
import { colorize } from "./names.js?v=1795376900";
import { openModal } from "./overlays.js?v=1795376900";
import { PORTRAIT_DX } from "./portrait-dx.js?v=1795376900";

// ---- entrées de chronique (les dilemmes avec leur contexte) ----
export function entryHtml(e, plain = false) {
  // l'affaire privée d'une autre maison n'arrive qu'en rumeur (sauf à la fin de la partie)
  if (e && e.title && e.secret && e.pid !== me() && S() && S().phase !== "end") {
    return `<span class="ch-title">${ICON.scroll}Rumeur venue de la cour ${colorize(E.deName(S(), e.pid))}</span><span class="ch-res">On raconte que… ${colorize(e.text)}</span>`;
  }
  if (e && e.title) {
    return `<span class="ch-title">${ICON.scroll}« ${esc(e.title)} »</span><span class="ch-sit">${colorize(e.situation || "")}</span><span class="ch-choice">${colorize(e.choice || "")}</span><span class="ch-res">${colorize(e.text)}</span>`;
  }
  return colorize(e ? e.text : "");
}


// ---------------------------------------------------------------------
// ONGLETS MAISON ET CHRONIQUE
// ---------------------------------------------------------------------
export function houseHtml(pid, full) {
  const st = S();
  const p = st.players[pid];
  if (!p) return "";
  const h = HOUSES[p.house];
  const fam = st.families[pid];
  const hide = scoresHidden(st) && pid !== me();
  const roleName = (m) => m.role === "king" ? (m.sex === "f" ? "Reine régnante" : "Roi") : m.role === "queen" ? "Reine" : m.role === "widow" ? "Douairière" : m.role === "monk" ? (m.sex === "f" ? "Au couvent" : "Au monastère") : m.role === "gone" ? "Partie" : m.sex === "f" ? "Fille" : "Fils";
  const k = E.king(st, pid);
  const consort = E.consort(st, pid);
  const members = fam.members.filter((m) => m.alive || full).sort((a, b) => (b.alive - a.alive) || (["king", "queen", "widow", "child", "monk", "gone"].indexOf(a.role) - ["king", "queen", "widow", "child", "monk", "gone"].indexOf(b.role)) || b.age - a.age);
  const famHtml = members.slice(0, 14).map((m) => {
    const tr = TRAITS[m.trait];
    const spouse = m.spouse ? E.personById(st, m.spouse) : null;
    return `<div class="fam ${m.alive ? "" : "dead"}"><div class="fam-top"><span class="fam-name">${m.role === "king" ? "♛ " : ""}${esc(E.personTitle(m))}</span><span class="fam-meta">${roleName(m)} · ${m.age} ans${m.alive ? "" : ` · ${esc(m.cause || "mort")}`}</span></div>
      ${m.alive ? `<div class="chips" style="margin-top:4px"><span class="chip ${tr && tr.good ? "good" : "bad"}" title="${esc(tr ? tr.desc : "")}">${esc(m.trait)}</span>${["king", "queen", "widow"].includes(m.role) || m.health >= 2 ? `<span class="chip ${m.health >= 3 ? "bad" : ""}">${HEALTH[m.health]}</span>` : ""}${m.bastard && !m.legit && pid === me() ? '<span class="chip gold">Bâtard</span>' : ""}${m.bastard && m.legit ? '<span class="chip gold">Bâtard légitimé</span>' : ""}${spouse ? `<span class="chip blue">Marié${m.sex === "f" ? "e" : ""} à ${esc(spouse.name)} (${esc(houseName(m.spouse.pid))})</span>` : ""}</div>` : ""}</div>`;
  }).join("");
  const myObj = pid === me() && L.priv && L.priv.objectives ? L.priv.objectives : [];
  const est = pid === me() ? E.estimateScore(st, { [pid]: L.priv || {} }, pid) : null;
  const spied = pid !== me() && L.priv && L.priv.spied && L.priv.spied.target === pid ? L.priv.spied.objectives : null;
  return `<div class="house-head">${shield(p.house, 44)}<div><div class="hn">Maison ${esc(houseName(pid))}</div><div class="hm">« ${esc(h.motto)} » · ${esc(p.name)}${p.isBot ? " (ordinateur)" : ""}</div></div></div>
    ${powerBox(st, pid)}
    ${est ? `<div class="score-box"><span class="ph" style="margin:0">Score estimé si la partie finissait maintenant</span><br><b>${est.total}</b> points <span class="hint">(Prestige ${est.prestige} + provinces ${est.provinces} + régions ${est.regions} + objectifs ${est.objectives} + famille ${est.family} + or ${est.gold})</span></div>` : ""}
    ${relationsHtml(st, pid)}
    ${spied ? `<div class="pbox"><p class="ph red">Objectifs secrets (volés par tes espions)</p>${spied.map((oid) => `<p class="ptext" style="margin:2px 0;font-size:14px">• ${esc((OBJECTIVES.find((o) => o.id === oid) || {}).text || "")}</p>`).join("")}</div>` : ""}
    <div class="kv"><span><b>Or</b> ${p.gold}</span><span><b>Prestige</b> ${hide ? "?" : p.prestige}</span><span><b>Provinces</b> ${E.provincesOf(st, pid).length}</span><span><b>Régions</b> ${E.regionsOf(st, pid).length}</span></div>
    <div class="stat-row"><div class="stat"><div class="stat-l"><span>Colère du peuple</span><span>${p.colere}</span></div><div class="gauge"><div style="width:${p.colere}%;background:#A3221A"></div></div></div><div class="stat"><div class="stat-l"><span>Peur</span><span>${p.peur}</span></div><div class="gauge"><div style="width:${p.peur}%;background:#241811"></div></div></div></div>
    <p class="hint" style="margin:-4px 0 12px">Colère à 80 : une province se révolte. Peur : +1 en défense tous les 25 points, mais à 50 plus personne n'épouse tes enfants.</p>
    ${k && TRAITS[k.trait] ? `<p class="ptext" style="font-size:14px"><b>Effet du souverain :</b> ${esc(k.trait)}, ${esc(TRAITS[k.trait].desc.toLowerCase())}.</p>` : ""}
    <p class="ph">La famille ${pid === me() ? `<button class="btn btn-small" data-famintro="1" style="margin-left:8px;min-height:30px">Présentation</button>` : ""}</p>${consort && consort.alive && !fam.members.includes(consort) ? `<p class="hint" style="margin-top:0">Époux${consort.sex === "f" ? "se" : ""} du souverain : ${esc(E.personTitle(consort))} (${esc(houseName(E.ownerOf(st, consort)))})</p>` : ""}${famHtml}
    ${myObj.length ? `<p class="ph" style="margin-top:14px">Tes objectifs secrets</p>${myObj.map((oid) => { const o = OBJECTIVES.find((x) => x.id === oid); const ok = E.objectiveDone(st, pid, oid); return `<div class="obj"><span class="${ok ? "ok" : "ko"}">${ok ? "✓" : "○"}</span><span>${esc(o.text)} <i>(+${o.pts})</i></span></div>`; }).join("")}` : ""}`;
}

// pouvoir et faiblesse de la maison
export function powerBox(st, pid) {
  const pw = E.housePower(st, pid);
  if (!pw.title) return "";
  return `<div class="powerbox"><b>${esc(pw.title)}</b><span class="pw-good">${esc(pw.power)}</span><span class="pw-bad">Faiblesse : ${esc(pw.weak)}</span></div>`;
}

// les liens tissés avec chaque autre maison : mariages, trêves, coups reçus et donnés
export function relationsHtml(st, pid) {
  const others = st.order.filter((p) => p !== pid && st.players[p] && st.players[p].house !== "anglais");
  const rel = st.rel || [];
  const cnt = (k, a, b) => rel.filter((r) => r.k === k && r.a === a && r.b === b).length;
  const rows = others.map((o) => {
    const bits = [];
    const marr = st.families[pid].members.filter((m) => m.spouse && m.spouse.pid === o).map((m) => { const sp = E.personById(st, m.spouse); return `${colorize(E.personTitle(m))} ⚭ ${sp ? colorize(E.personTitle(sp)) : "?"}`; });
    if (marr.length) bits.push(`<span class="lk good">⚭ Mariage : ${marr.join(", ")}</span>`);
    const tr = (st.treaties || []).find((x) => (x.a === pid && x.b === o) || (x.a === o && x.b === pid));
    if (tr) bits.push(`<span class="lk good">Trêve jusqu'à la manche ${tr.until}</span>`);
    const inA = cnt("attaque", o, pid), outA = cnt("attaque", pid, o);
    if (inA || outA) bits.push(`<span class="lk ${inA > outA ? "bad" : ""}">⚔ Attaques : ${inA} reçue${inA > 1 ? "s" : ""}, ${outA} donnée${outA > 1 ? "s" : ""}</span>`);
    if (cnt("trahison", o, pid)) bits.push('<span class="lk bad">T\'a trahi</span>');
    if (cnt("trahison", pid, o)) bits.push('<span class="lk bad">Tu l\'as trahie</span>');
    const pz = cnt("poison-rate", o, pid) + cnt("corruption", o, pid) + cnt("seduction", o, pid);
    if (pz) bits.push(`<span class="lk bad">Complots démasqués contre toi : ${pz}</span>`);
    const v = cnt("vote", o, pid);
    if (v) bits.push(`<span class="lk bad">A voté contre toi au Conseil (${v})</span>`);
    const g = rel.filter((r) => r.k === "or" && r.a === o && r.b === pid).length;
    if (g) bits.push(`<span class="lk good">T'a envoyé de l'or (${g} fois)</span>`);
    return `<div class="relrow" style="--hc:${HOUSES[st.players[o].house].color}">${shield(st.players[o].house, 20)}<b>${esc(houseName(o))}</b><span class="lks">${bits.join("") || '<span class="lk">Aucun lien pour l\'instant</span>'}</span></div>`;
  }).join("");
  return `<p class="ph">Les liens avec les autres maisons</p><div class="rels">${rows}</div>`;
}

export function renderHouseTab() { const pid = me(); $("#tab-house").innerHTML = pid ? houseHtml(pid, true) : "<p class='ptext'>Tu es spectateur.</p>"; const b = $("#tab-house [data-famintro]"); if (b) b.onclick = () => openModal("family", 0); }

// ---- présentation de la famille, personnage par personnage ----
export const TRAIT_FLAVOR = {
  "Rusé": ["Il sourit toujours une seconde trop tard. Personne ne sait ce qu'il pense, et c'est très bien ainsi.", "Elle écoute aux portes depuis l'âge de six ans. Elle n'a jamais été prise."],
  "Brillant stratège": ["Il dessine des batailles sur la nappe pendant les repas. Il les gagne toutes.", "Elle joue aux échecs contre les évêques et les laisse parfois gagner, par politesse."],
  "Sanguinaire": ["Il chasse le loup à mains nues, dit-on. Les loups, eux, ne disent plus rien.", "Elle assiste aux exécutions au premier rang, et elle applaudit."],
  "Pieux": ["Il prie quatre heures par jour. Le peuple l'aime. Les capitaines s'ennuient.", "Elle porte un cilice sous ses robes de soie. Le peuple la vénère."],
  "Séduisant": ["La moitié des dames de la cour lui ont écrit des poèmes. L'autre moitié ment.", "Trois chevaliers se sont battus en duel pour un de ses regards. Deux sont morts."],
  "Robuste": ["Il a survécu à deux pestes, une chute de cheval et un cuisinier empoisonneur.", "Elle a accouché le matin et chassé le cerf l'après-midi."],
  "Paranoïaque": ["Il fait goûter son vin par trois hommes différents. Il a raison.", "Elle dort avec une dague sous l'oreiller et change de chambre chaque nuit."],
  "Simple d'esprit": ["Il rit aux enterrements et pleure aux mariages. On l'aime bien, mais pas pour régner.", "Elle parle aux pigeons. Les pigeons, au moins, l'écoutent."],
  "Lâche": ["Il a perdu sa première bataille en s'enfuyant avant qu'elle commence.", "Elle s'évanouit à la vue du sang. Même le sien. Surtout le sien."],
  "Fragile": ["Il tousse depuis l'enfance. Les médecins le saignent une fois par semaine, ce qui n'aide pas.", "Elle est pâle comme un cierge, et l'on prie beaucoup pour elle."],
  "Débauché": ["Il a plus de dettes chez les taverniers que de soldats dans ses armées.", "Elle organise des fêtes que l'évêque refuse de décrire."],
  "Cruel": ["Il fait couper la langue des bavards. La cour est devenue très silencieuse.", "Elle collectionne les ongles de ses servantes. On ne lui pose pas de questions."],
};

function drawnPortrait(m, color) {
  const f = m.sex === "f", baby = m.age < 6, old = m.age >= 55;
  const ink = "#1B130D";
  const headR = baby ? 15 : 19;
  const hy = baby ? 82 : 66;
  let h = `<svg viewBox="0 0 120 140" width="120" height="140" class="portrait" aria-hidden="true"><defs><clipPath id="pc-${m.id}"><ellipse cx="60" cy="70" rx="56" ry="66"/></clipPath></defs>
    <ellipse cx="60" cy="70" rx="56" ry="66" fill="${color}" opacity=".35"/><g clip-path="url(#pc-${m.id})">
    <g opacity=".25" stroke="${ink}" stroke-width="1">${Array.from({ length: 12 }, (_, i) => `<path d="M0,${i * 12 + 4} H120"/>`).join("")}</g>`;
  if (baby) h += `<path d="M30,140 Q30,96 60,94 Q90,96 90,140 Z" fill="#ECDEBD" stroke="${ink}" stroke-width="2"/><path d="M36,112 Q60,124 84,112 M38,126 Q60,138 82,126" stroke="${ink}" stroke-width="1.4" fill="none"/>`;
  else h += `<path d="M14,140 Q16,100 60,${hy + 28} Q104,100 106,140 Z" fill="${ink}"/>`;
  if (f && !baby) h += `<path d="M${60 - headR - 6},${hy + 34} Q${60 - headR - 8},${hy - 8} 60,${hy - headR - 6} Q${60 + headR + 8},${hy - 8} ${60 + headR + 6},${hy + 34} Z" fill="${ink}"/>`;
  h += `<ellipse cx="60" cy="${hy}" rx="${headR - 2}" ry="${headR}" fill="#ECDEBD" stroke="${ink}" stroke-width="2"/>`;
  h += `<path d="M53,${hy - 2} h3 M64,${hy - 2} h3" stroke="${ink}" stroke-width="2"/><path d="M56,${hy + 9} Q60,${hy + 11} 64,${hy + 9}" stroke="${ink}" stroke-width="1.5" fill="none"/>`;
  if (!f && old) h += `<path d="M46,${hy + 6} Q48,${hy + 34} 60,${hy + 38} Q72,${hy + 34} 74,${hy + 6} Q66,${hy + 16} 60,${hy + 16} Q54,${hy + 16} 46,${hy + 6} Z" fill="#CFC4AE" stroke="${ink}" stroke-width="1.5"/>`;
  if (!f && !baby && !old) h += `<path d="M42,${hy - 6} Q44,${hy - headR - 6} 60,${hy - headR - 4} Q76,${hy - headR - 6} 78,${hy - 6} Q70,${hy - 14} 60,${hy - 14} Q50,${hy - 14} 42,${hy - 6} Z" fill="${ink}"/>`;
  if (m.role === "king" || m.role === "queen") { const cy = hy - headR + 2; h += `<path d="M${f ? 46 : 41},${cy} L${f ? 48 : 44},${cy - 14} L${f ? 54 : 52},${cy - 6} L60,${cy - 18} L${f ? 66 : 68},${cy - 6} L${f ? 72 : 76},${cy - 14} L${f ? 74 : 79},${cy} Z" fill="#A9843A" stroke="${ink}" stroke-width="1.5"/>`; }
  if (m.trait === "Sanguinaire" || m.trait === "Cruel") h += `<path d="M66,${hy + 2} l8,8" stroke="#A3221A" stroke-width="2.5"/>`;
  if (/Borgne/.test(m.infirm || "")) h += `<path d="M62,${hy - 5} h8 v6 h-8 Z" fill="${ink}"/><path d="M42,${hy - 8} L78,${hy - 2}" stroke="${ink}" stroke-width="1.2"/>`;
  h += `</g><ellipse cx="60" cy="70" rx="56" ry="66" fill="none" stroke="${ink}" stroke-width="3"/></svg>`;
  return h;
}

// Portrait gravé (img/portraits/, 240×288, yeux alignés en (88.8, 120) et (151.2, 120)) + calques d'état vectoriels.
// Dans ce repère 120×140, l'image est réduite à 104 px de large : les yeux tombent en (46.5, 62) et (73.5, 62).
// fichier du visage gravé d'un personnage et son recentrage (null pour un nourrisson dessiné)
export function portraitSrc(m) {
  if (m.age < 6) return null;
  const child = m.age < 16;
  const face = child ? m.kid || E.pickFace(m.id, m.sex, null, { kid: true }) : m.face || E.pickFace(m.id, m.sex);
  if (!face) return null;
  const name = child ? face : `${face}${m.age < 30 ? "j" : m.age < 50 ? "m" : "v"}`;
  return { src: `img/portraits/${name}.webp`, dx: PORTRAIT_DX[name] || 0 };
}

export function portraitSvg(m, color) {
  // moins de 6 ans : le nourrisson dessiné ; 6–15 ans : visage d'enfant ; 16 ans et plus : visage adulte selon l'âge
  if (m.age < 6) return drawnPortrait(m, color);
  const child = m.age < 16;
  const face = child ? m.kid || E.pickFace(m.id, m.sex, null, { kid: true }) : m.face || E.pickFace(m.id, m.sex);
  if (!face) return drawnPortrait(m, color);
  const src = child ? `${face}.webp` : `${face}${m.age < 30 ? "j" : m.age < 50 ? "m" : "v"}.webp`;
  const ink = "#1B130D", gold = "#A9843A";
  const L = 46.5, R = 73.5, Y = 62;
  const sick = m.alive && m.health >= 3, dying = m.alive && m.health >= 4;
  const filt = !m.alive ? "grayscale(1) sepia(.3) contrast(1.05)" : dying ? "grayscale(.6) brightness(1.06)" : sick ? "grayscale(.3)" : "";
  const cid = `pc-${String(m.id).replace(/[^\w-]/g, "")}`;
  let h = `<svg viewBox="0 0 120 140" width="120" height="140" class="portrait" aria-hidden="true"><defs><clipPath id="${cid}"><ellipse cx="60" cy="70" rx="56" ry="66"/></clipPath></defs>
    <ellipse cx="60" cy="70" rx="56" ry="66" fill="#ECDEBD"/><g clip-path="url(#${cid})">
    <image href="img/portraits/${src}" x="${8 + (PORTRAIT_DX[src.replace(".webp", "")] || 0)}" y="10" width="104" height="124.8"${filt ? ` style="filter:${filt}"` : ""}/>
    <ellipse cx="60" cy="70" rx="56" ry="66" fill="none" stroke="${color}" stroke-width="10" opacity=".35"/>`;
  if (sick) {
    // teint cireux, cernes, et pour un mourant les joues creusées
    h += `<rect width="120" height="140" fill="#ECDEBD" opacity="${dying ? 0.3 : 0.16}"/>
      <path d="M${L - 6},${Y + 5} Q${L},${Y + (dying ? 10 : 8)} ${L + 6},${Y + 5} M${R - 6},${Y + 5} Q${R},${Y + (dying ? 10 : 8)} ${R + 6},${Y + 5}" stroke="${ink}" stroke-width="${dying ? 1.6 : 1.1}" fill="none" opacity=".55"/>`;
    if (dying) h += `<path d="M${L - 9},${Y + 14} l3,8 M${L - 6},${Y + 13} l3,9 M${R + 9},${Y + 14} l-3,8 M${R + 6},${Y + 13} l-3,9" stroke="${ink}" stroke-width="1" opacity=".45"/>`;
  }
  if (/Borgne/.test(m.infirm || "")) {
    // bandeau de cuir sur l'œil droit de l'image, lanière en travers du front
    h += `<path d="M28,${Y - 13} Q50,${Y - 17} ${R - 5},${Y - 5} M${R + 6},${Y - 4} Q${R + 15},${Y - 2} ${R + 22},${Y + 4}" stroke="${ink}" stroke-width="2" fill="none"/>
      <path d="M${R - 7},${Y - 4} Q${R},${Y - 8} ${R + 7},${Y - 3} Q${R + 8},${Y + 4} ${R},${Y + 6} Q${R - 7},${Y + 4} ${R - 7},${Y - 4} Z" fill="${ink}"/><path d="M${R - 4},${Y - 2} Q${R},${Y - 4} ${R + 5},${Y - 1}" stroke="#5A4430" stroke-width=".8" fill="none"/>`;
  }
  if (m.role === "king" || m.role === "queen") {
    // couronne or terni posée sur la tête, sans fleur de lys
    const f = m.sex === "f", w = f ? 16 : 19, base = f ? 30 : 28;
    h += `<path d="M${60 - w},${base} L${60 - w - 2},${base - 11} L${60 - w / 2},${base - 5} L60,${base - 15} L${60 + w / 2},${base - 5} L${60 + w + 2},${base - 11} L${60 + w},${base} Z" fill="${gold}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M${60 - w},${base - 3} H${60 + w}" stroke="${ink}" stroke-width="1"/><circle cx="60" cy="${base - 15}" r="1.7" fill="${ink}"/><circle cx="${60 - w - 2}" cy="${base - 11}" r="1.3" fill="${ink}"/><circle cx="${60 + w + 2}" cy="${base - 11}" r="1.3" fill="${ink}"/>`;
  }
  if (!m.alive) h += `<path d="M80,4 L118,42" stroke="${ink}" stroke-width="11"/>`; // crêpe de deuil
  h += `</g><ellipse cx="60" cy="70" rx="56" ry="66" fill="none" stroke="${ink}" stroke-width="3"/></svg>`;
  return h;
}

export function familyCards(pid) {
  const st = S(), fam = st.families[pid];
  const order = ["king", "queen", "child"];
  const ms = fam.members.filter((m) => m.alive && order.includes(m.role)).sort((a, b) => order.indexOf(a.role) - order.indexOf(b.role) || b.age - a.age);
  const k = E.king(st, pid), co = E.consort(st, pid);
  if (co && co.alive && !ms.includes(co)) ms.splice(1, 0, co);
  return ms;
}

export function familyHtml(i) {
  const st = S(), pid = me();
  const p = st.players[pid], color = HOUSES[p.house].color;
  const ms = familyCards(pid);
  const heirs = E.heirs(st, pid);
  const k = E.king(st, pid), co = E.consort(st, pid);
  const total = ms.length + 1;
  const nav = (j) => `<div class="intro-dots">${Array.from({ length: total }, (_, x) => `<span class="${x === j ? "on" : ""}"></span>`).join("")}</div>
    <div class="row">${j > 0 ? `<button class="btn grow" data-fam="${j - 1}">← Précédent</button>` : `<button class="btn grow" id="md-close">Passer</button>`}${j < total - 1 ? `<button class="btn btn-red grow" data-fam="${j + 1}">${j === 0 ? "Découvrir ma famille →" : "Suivant →"}</button>` : `<button class="btn btn-red grow" id="md-close">Prendre le pouvoir</button>`}</div>`;
  if (i === 0) {
    return `<div class="card fam-card"><span class="card-kicker">TA DYNASTIE</span><div style="text-align:center;margin:6px 0">${shield(p.house, 70)}</div><h2 style="text-align:center">La maison ${esc(E.deName(st, pid))}</h2><p style="text-align:center;font-style:italic">« ${esc(HOUSES[p.house].motto)} »</p>${powerBox(st, pid)}
      <p>Voici ceux qui portent ton nom. Ils vont vieillir, se marier, tomber malades, peut-être être empoisonnés. Ils comptent dans ton score (1 point par membre vivant), et beaucoup de dilemmes parleront d'eux.</p>
      <p><b>Si ton souverain meurt</b>, l'aîné des fils hérite (sinon l'aînée des filles). <b>Sans héritier, c'est la guerre civile</b> : tu perds un tiers de tes provinces.</p>${nav(0)}</div>`;
  }
  const m = ms[i - 1];
  const tr = TRAITS[m.trait];
  const isKing = k && m.id === k.id;
  const hIdx = heirs.findIndex((x) => x.id === m.id);
  const role = isKing ? (m.sex === "f" ? "Reine régnante" : "Le roi, ton souverain") : m.role === "queen" || (co && m.id === co.id) ? (m.sex === "f" ? "La reine" : "Le prince consort") : hIdx === 0 ? (m.sex === "f" ? "Ton héritière" : "Ton héritier") : m.sex === "f" ? "Ta fille" : "Ton fils";
  const fl = TRAIT_FLAVOR[m.trait] ? TRAIT_FLAVOR[m.trait][m.sex === "f" ? 1 : 0] : "";
  const effect = tr ? `${tr.desc}${isKing ? "" : " (compte surtout quand il ou elle règne)"}` : "";
  return `<div class="card fam-card"><span class="card-kicker">TA FAMILLE · ${i} SUR ${ms.length}</span>
    <div class="fam-hero">${portraitSvg(m, color)}<div><div class="fam-role">${esc(role)}</div><h2 style="margin:2px 0 4px">${esc(E.personTitle(m))}</h2><div class="fam-age">${m.age} ans${["king", "queen"].includes(m.role) || m.health >= 2 ? ` · ${HEALTH[m.health]}` : ""}${hIdx > 0 ? ` · ${hIdx + 1}e dans l'ordre de succession` : ""}</div></div></div>
    <p class="fam-flavor">${esc(fl)}</p>
    ${tr ? `<div class="fam-trait ${tr.good ? "good" : "bad"}"><b>${esc(m.trait)}</b> : ${esc(effect)}</div>` : ""}
    ${m.infirm ? `<p class="hint">Son surnom, « ${esc(m.infirm)} », la cour le lui a donné. Personne n'ose le dire devant ${m.sex === "f" ? "elle" : "lui"}.</p>` : ""}
    ${nav(i)}</div>`;
}

// la chronique, filtrable : tout, ce qui me concerne, guerre, familles, complots
const LOG_FILTERS = [["all", "Tout"], ["me", "Ma maison"], ["war", "Guerre"], ["fam", "Familles"], ["plot", "Complots"]];
let logFilter = "all";
export function renderLog() {
  const st = S();
  const pid = me();
  const myName = pid ? E.maisonName(st, pid) : null;
  const myPeople = pid ? st.families[pid].members.map((m) => E.personTitle(m)) : [];
  const keep = (e) => {
    if (logFilter === "all") return true;
    if (logFilter === "me") return !!pid && (e.text.includes(myName) || e.text.includes(E.maisonName(st, pid, "La maison")) || myPeople.some((n) => e.text.includes(n)) || (e.choice || "").includes(myName));
    if (logFilter === "war") return ["battle", "betrayal", "exile", "revolt", "council"].includes(e.kind);
    if (logFilter === "fam") return ["death", "birth", "marriage", "claim"].includes(e.kind);
    if (logFilter === "plot") return ["intrigue", "gift"].includes(e.kind) || /poison|accuse|anonyme|crime/i.test(e.text);
    return true;
  };
  const c = (st.chronicle || []).filter(keep).slice().reverse();
  let lastRound = null;
  const items = c.map((e) => { const h = e.round !== lastRound ? `<p class="log-round">Manche ${e.round} · an ${e.year}</p>` : ""; lastRound = e.round; return `${h}<div class="log-entry ch-entry k-${e.kind}">${entryHtml(e)}</div>`; }).join("");
  $("#tab-log").innerHTML = `<div class="log-filters">${LOG_FILTERS.map(([k, t]) => `<button class="btn btn-small ${logFilter === k ? "btn-dark" : ""}" data-logf="${k}">${t}</button>`).join("")}</div>${items || `<p class="ptext wait">Rien dans la chronique pour ce filtre.</p>`}`;
  document.querySelectorAll("[data-logf]").forEach((b) => (b.onclick = () => { logFilter = b.dataset.logf; renderLog(); }));
}

// ---------------------------------------------------------------------
// FICHES EN GRAND (télé) : personnage, maison, chronique paginée
// ---------------------------------------------------------------------
// retrouve un personnage dans toutes les familles (un époux peut venir d'une autre maison)
export function findPerson(st, id) {
  for (const pid of st.order || []) {
    const m = st.families[pid] && st.families[pid].members.find((x) => String(x.id) === String(id));
    if (m) return { m, pid };
  }
  return null;
}

export function roleLabel(st, pid, m) {
  const k = E.king(st, pid), co = E.consort(st, pid), h = E.heirs(st, pid);
  if (!m.alive) return m.sex === "f" ? "Défunte" : "Défunt";
  if (k && k.id === m.id) return m.sex === "f" ? "Reine régnante" : "Roi";
  if ((co && co.id === m.id) || m.role === "queen") return m.sex === "f" ? "Reine" : "Prince consort";
  if (h[0] && h[0].id === m.id) return m.sex === "f" ? "Héritière" : "Héritier";
  if (m.role === "widow") return "Douairière";
  if (m.role === "monk") return m.sex === "f" ? "Au couvent" : "Au monastère";
  if (m.role === "gone") return "Partie";
  if (m.role === "child") return m.bastard && !m.legit ? (m.sex === "f" ? "Bâtarde" : "Bâtard") : m.sex === "f" ? "Fille" : "Fils";
  return m.sex === "f" ? "Dame" : "Seigneur";
}

// vignette cliquable : visage + nom + rôle (ouvre la fiche du personnage)
export function personTile(st, pid, m, extra = "") {
  const color = HOUSES[st.players[pid].house].color;
  const tr = TRAITS[m.trait];
  return `<button class="ptile ${m.alive ? "" : "dead"} ${extra}" data-who="${esc(pid)}|${esc(m.id)}">${portraitSvg(m, color)}<span class="pt-n">${esc(E.personTitle(m))}</span><span class="pt-r">${roleLabel(st, pid, m)} · ${m.age} ans</span>${m.alive && m.trait ? `<span class="pt-t ${tr && tr.good ? "good" : "bad"}">${esc(m.trait)}</span>` : m.alive ? "" : `<span class="pt-t">✝ ${esc(m.cause || "mort")}</span>`}</button>`;
}

export function personHtml(ref) {
  const st = S();
  const f = findPerson(st, ref.id);
  if (!f) return `<div class="card"><p>Personnage introuvable.</p><button class="btn btn-block" id="md-close">Fermer</button></div>`;
  const { m, pid } = f;
  const color = HOUSES[st.players[pid].house].color;
  const tr = TRAITS[m.trait];
  const sp = m.spouse ? E.personById(st, m.spouse) : null;
  const fl = TRAIT_FLAVOR[m.trait] ? TRAIT_FLAVOR[m.trait][m.sex === "f" ? 1 : 0] : "";
  const hIdx = E.heirs(st, pid).findIndex((x) => x.id === m.id);
  const isKing = E.king(st, pid) && E.king(st, pid).id === m.id;
  return `<div class="card person-card" style="--hc:${color}">
    <div class="pc-portrait">${portraitSvg(m, color)}</div>
    <div class="pc-body">
      <span class="card-kicker">${shield(st.players[pid].house, 22)} Maison ${esc(houseName(pid))}</span>
      <h2>${esc(E.personTitle(m))}</h2>
      <p class="pc-role">${roleLabel(st, pid, m)} · ${m.age} ans${m.alive && (["king", "queen", "widow"].includes(m.role) || m.health >= 2) ? ` · ${HEALTH[m.health]}` : ""}${hIdx > 0 ? ` · ${hIdx + 1}<sup>e</sup> dans l'ordre de succession` : ""}${!m.alive ? ` · ✝ ${esc(m.cause || "mort")}` : ""}</p>
      ${fl && m.alive ? `<p class="fam-flavor">${esc(fl)}</p>` : ""}
      ${tr ? `<div class="fam-trait ${tr.good ? "good" : "bad"}"><b>${esc(m.trait)}</b> : ${esc(tr.desc)}${isKing ? "" : " (compte surtout quand il ou elle règne)"}</div>` : ""}
      ${m.infirm ? `<p class="hint">Son surnom, « ${esc(m.infirm)} », la cour le lui a donné. Personne n'ose le dire devant ${m.sex === "f" ? "elle" : "lui"}.</p>` : ""}
      ${m.bastard && m.legit ? `<p class="hint">Bâtard légitimé : il peut hériter.</p>` : ""}
      ${sp ? `<div class="pc-spouse"><span class="ph">Marié${m.sex === "f" ? "e" : ""} à</span>${personTile(st, m.spouse.pid, sp)}</div>` : ""}
      <div class="row" style="margin-top:auto"><button class="btn grow" data-house="${esc(pid)}">Toute la maison</button><button class="btn btn-red grow" id="md-close">Fermer</button></div>
    </div></div>`;
}

export function houseSheetHtml(pid) {
  const st = S();
  const p = st.players[pid];
  if (!p) return "";
  const h = HOUSES[p.house];
  const fam = st.families[pid];
  const hide = scoresHidden(st) && pid !== me();
  const order = ["king", "queen", "widow", "child", "monk", "gone"];
  const k = E.king(st, pid), co = E.consort(st, pid);
  const alive = fam.members.filter((m) => m.alive).sort((a, b) => (k && a.id === k.id ? -1 : k && b.id === k.id ? 1 : 0) || order.indexOf(a.role) - order.indexOf(b.role) || b.age - a.age);
  if (co && co.alive && !alive.includes(co)) alive.splice(1, 0, co);
  const dead = fam.members.filter((m) => !m.alive).slice(-6).reverse();
  const myObj = pid === me() && L.priv && L.priv.objectives ? L.priv.objectives : [];
  const est = pid === me() ? E.estimateScore(st, { [pid]: L.priv || {} }, pid) : null;
  const spied = pid !== me() && L.priv && L.priv.spied && L.priv.spied.target === pid ? L.priv.spied.objectives : null;
  const ownerOf = (m) => (fam.members.includes(m) ? pid : E.ownerOf(st, m));
  return `<div class="card house-sheet" style="--hc:${HOUSES[p.house].color}">
    <div class="hs-head">${shield(p.house, 56)}<div class="grow"><span class="card-kicker">${pid === me() ? "TA MAISON" : "MAISON RIVALE"}</span><h2>Maison ${esc(houseName(pid))}</h2><div class="hm">« ${esc(h.motto)} » · ${esc(p.name)}${p.isBot ? " (ordinateur)" : ""}</div></div>
      <div class="kv hs-kv"><span>${ICON.prestige}<b>Prestige</b> ${hide ? "?" : p.prestige}</span><span>${ICON.gold}<b>Or</b> ${p.gold}</span><span>${ICON.province}<b>Provinces</b> ${E.provincesOf(st, pid).length}</span><span><b>Régions</b> ${E.regionsOf(st, pid).length}</span></div>
      <button class="btn" id="md-close">Fermer</button></div>
    <div class="hs-body">
      <div class="hs-fam"><p class="ph">La famille ${pid === me() ? `<button class="btn btn-small" data-famintro="1" style="margin-left:8px;min-height:30px">Présentation</button>` : ""}</p>
        <div class="ptiles">${alive.slice(0, 12).map((m, i) => personTile(st, ownerOf(m), m, i === 0 && k && m.id === k.id ? "big" : "")).join("")}</div>
        ${dead.length ? `<p class="ph" style="margin-top:10px">Les défunts</p><div class="ptiles small">${dead.map((m) => personTile(st, pid, m)).join("")}</div>` : ""}
      </div>
      <div class="hs-side">
        ${powerBox(st, pid)}
        ${est ? `<div class="score-box"><span class="ph" style="margin:0">Score si la partie finissait maintenant</span><br><b>${est.total}</b> points <span class="hint">(Prestige ${est.prestige} + provinces ${est.provinces} + régions ${est.regions} + objectifs ${est.objectives} + famille ${est.family} + or ${est.gold})</span></div>` : ""}
        <div class="stat-row"><div class="stat"><div class="stat-l"><span>Colère du peuple</span><span>${p.colere}</span></div><div class="gauge"><div style="width:${p.colere}%;background:#A3221A"></div></div></div><div class="stat"><div class="stat-l"><span>Peur</span><span>${p.peur}</span></div><div class="gauge"><div style="width:${p.peur}%;background:#241811"></div></div></div></div>
        ${myObj.length ? `<p class="ph">Tes objectifs secrets</p>${myObj.map((oid) => { const o = OBJECTIVES.find((x) => x.id === oid); const ok = E.objectiveDone(st, pid, oid); return `<div class="obj"><span class="${ok ? "ok" : "ko"}">${ok ? "✓" : "○"}</span><span>${esc(o.text)} <i>(+${o.pts})</i></span></div>`; }).join("")}` : ""}
        ${spied ? `<p class="ph red">Objectifs secrets (volés par tes espions)</p>${spied.map((oid) => `<div class="obj">• ${esc((OBJECTIVES.find((o) => o.id === oid) || {}).text || "")}</div>`).join("")}` : ""}
        ${relationsHtml(st, pid)}
      </div>
    </div></div>`;
}

// la chronique en grand : une manche par page, en colonnes (jamais d'ascenseur)
const CHR_PER_PAGE = () => (innerHeight > 900 ? 15 : 9);
export function chronicleHtml() {
  const st = S(), pid = me();
  const myName = pid ? E.maisonName(st, pid) : null;
  const myPeople = pid ? st.families[pid].members.map((m) => E.personTitle(m)) : [];
  const keep = (e) => {
    if (logFilter === "all") return true;
    if (logFilter === "me") return !!pid && (e.text.includes(myName) || e.text.includes(E.maisonName(st, pid, "La maison")) || myPeople.some((n) => e.text.includes(n)) || (e.choice || "").includes(myName));
    if (logFilter === "war") return ["battle", "betrayal", "exile", "revolt", "council"].includes(e.kind);
    if (logFilter === "fam") return ["death", "birth", "marriage", "claim"].includes(e.kind);
    if (logFilter === "plot") return ["intrigue", "gift"].includes(e.kind) || /poison|accuse|anonyme|crime/i.test(e.text);
    return true;
  };
  const all = (st.chronicle || []).filter(keep);
  // pages : chaque manche, découpée en paquets
  const pages = [];
  const rounds = [...new Set(all.map((e) => e.round))].sort((a, b) => a - b);
  for (const r of rounds) { const es = all.filter((e) => e.round === r); for (let i = 0; i < es.length; i += CHR_PER_PAGE()) pages.push({ r, year: es[0].year, es: es.slice(i, i + CHR_PER_PAGE()), part: i / CHR_PER_PAGE() + 1, parts: Math.ceil(es.length / CHR_PER_PAGE()) }); }
  if (L.ui.chrPage == null || L.ui.chrPage >= pages.length) L.ui.chrPage = pages.length - 1;
  const pg = pages[L.ui.chrPage];
  return `<div class="card chron-card"><div class="hs-head"><div class="grow"><span class="card-kicker">LA CHRONIQUE DU ROYAUME</span><h2>${pg ? `Manche ${pg.r} · an ${pg.year}${pg.parts > 1 ? ` <small>(${pg.part}/${pg.parts})</small>` : ""}` : "La chronique"}</h2></div><div class="log-filters">${LOG_FILTERS.map(([k, t]) => `<button class="btn btn-small ${logFilter === k ? "btn-dark" : ""}" data-logf="${k}">${t}</button>`).join("")}</div><button class="btn" id="md-close">Fermer</button></div>
    <div class="chron-cols">${pg ? pg.es.map((e) => `<div class="log-entry ch-entry k-${e.kind}">${entryHtml(e)}</div>`).join("") : `<p class="ptext wait">Rien dans la chronique pour ce filtre.</p>`}</div>
    <div class="row chron-nav"><button class="btn grow" data-chr="-1" ${!pg || L.ui.chrPage <= 0 ? "disabled" : ""}>← Plus ancien</button><span class="chron-pos">${pages.length ? `Page ${L.ui.chrPage + 1} sur ${pages.length}` : ""}</span><button class="btn grow" data-chr="1" ${!pg || L.ui.chrPage >= pages.length - 1 ? "disabled" : ""}>Plus récent →</button></div></div>`;
}
export function setLogFilter(f) { logFilter = f; L.ui.chrPage = null; }
