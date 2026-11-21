// Ordres secrets
import * as A from "../audio.js?v=1795297246";
import * as E from "../engine.js?v=1795297246";
import { ICON, term } from "../help.js?v=1795297246";
import { PROVINCES } from "../map.js?v=1795297246";
import { $, L, MAP, S, esc, me, rollDiceAnim, setRollDiceAnim } from "../state.js?v=1795297246";
import { houseName, setInput } from "./common.js?v=1795297246";
import { bindDiplomacy } from "./diplomacy.js?v=1795297246";
import { dieSvg, shield } from "./draw.js?v=1795297246";
import { render } from "./render.js?v=1795297246";

// ---- ordres ----
export function myDice() {
  const st = S(), pl = st.players[me()];
  const h = L.priv && L.priv.hidden;
  return pl.dice.map((v, i) => (i === pl.hiddenIdx && h && h.round === st.round ? h.v : v));
}

export function committed(provId, exceptIdx = -1) { return L.ui.orders.reduce((s, o, i) => s + (i !== exceptIdx && (o.type === "strike" || o.type === "march") && o.from === provId ? o.n : 0), 0); }

export function avail(provId) { const p = S().provinces[provId]; return p.armies - 1 - committed(provId); }

export function goldPlanned() { return L.ui.orders.reduce((s, o) => s + (o.type === "intrigue" ? E.COSTS[o.kind] || 0 : o.type === "levy" && o.merc ? E.MERC_COST : 0), 0); }

export function orderText(o) {
  const st = S();
  const v = myDice()[o.die];
  if (o.type === "strike") { const prob = Math.round(E.winProb(o.n + v + E.attackMod(st, me()), E.defenseOf(st, o.to)) * 100); return `<b>Frapper</b> ${esc(PROVINCES[o.to].art)} depuis ${esc(PROVINCES[o.from].name)} avec ${o.n} armées <span class="pct">${prob} %</span>`; }
  if (o.type === "march") return `<b>Marcher</b> : ${o.n} armées de ${esc(PROVINCES[o.from].name)} vers ${esc(PROVINCES[o.to].name)}`;
  if (o.type === "levy") return `<b>Lever</b> ${E.levyAmount(v) + (o.merc ? E.MERC_ARMIES : 0)} armées ${esc(PROVINCES[o.to].en)}${o.merc ? ` <i>(dont mercenaires, −${E.MERC_COST} or)</i>` : ""}`;
  if (o.type === "intrigue") {
    const pl = st.players[me()]; const k = E.king(st, me());
    let bonus = (k && k.trait === "Rusé" ? 1 : 0) + (pl.intrigueBonus || 0) + (o.kind === "seduction" && k && k.trait === "Séduisant" ? 1 : 0);
    const prob = Math.round(E.intrigueProb(v, bonus, E.NEED[o.kind]) * 100);
    if (o.kind === "poison") { const p = st.families[o.target].members.find((m) => m.id === o.person); return `<b>Poison</b> sur ${esc(p ? E.personTitle(p) : "?")} (${esc(houseName(o.target))}) <span class="pct">${prob} %</span>`; }
    if (o.kind === "seduction") return `<b>Séduction</b> de la reine ${esc(E.deName(st, o.target))} <span class="pct">${prob} %</span>`;
    if (o.kind === "bribe") return `<b>Corruption</b> de la garnison ${esc(E.deC(PROVINCES[o.prov].city))} <span class="pct">${prob} %</span>`;
  }
  return "";
}

export function saveOrders(sealed = false) { setInput("orders", { round: S().round, actions: L.ui.orders, sealed }); }

export function panelOrders() {
  const st = S(), pid = me();
  const pl = st.players[pid];
  const sealed = L.myInput.orders && L.myInput.orders.round === st.round && L.myInput.orders.sealed;
  const b = L.ui.build;
  const dv = myDice();
  const arrows = L.ui.orders.filter((o) => o.type === "strike" || o.type === "march").map((o) => ({ from: o.from, to: o.to, color: o.type === "strike" ? "#8E1B1B" : "#2B1D12", dashed: o.type === "march" }));
  const tag = { strike: "FRAPPER", march: "MARCHER", levy: "LEVER", intrigue: "INTRIGUE" };
  const freeDice = dv.map((v, i) => i).filter((i) => dv[i] && !L.ui.orders.some((o) => o.die === i));
  const diceHtml = `<div class="dice-row">${dv.map((v, i) => { const o = L.ui.orders.find((x) => x.die === i); const hid = i === pl.hiddenIdx; return `<button class="die ${o ? "used" : ""} ${b && b.die === i ? "selected" : ""} ${pl.extraDie && i === dv.length - 1 ? "extra" : ""} ${hid ? "hidden-die" : ""} ${rollDiceAnim ? "rolling" : ""}" data-die="${i}" ${sealed || !v ? "disabled" : ""} aria-label="Dé ${v}${hid ? ", caché aux autres" : ""}${o ? ", déjà utilisé" : ""}">${dieSvg(v)}${hid ? '<span class="die-eye">CACHÉ</span>' : ""}${o ? `<span class="die-tag">${tag[o.type]}</span>` : ""}</button>`; }).join("")}</div>`;
  if (rollDiceAnim) { setRollDiceAnim(false); A.play("dice"); }
  const steps = (cur) => `<div class="steps">${["Dé", "Action", "Cible", "Valider"].map((s, i) => `<span class="${i < cur ? "done" : i === cur ? "cur" : ""}">${i + 1}. ${s}</span>`).join("")}</div>`;
  let builder = "";
  if (sealed) {
    builder = `<div class="recap"><p class="ph">Ordres scellés ✓</p><p class="ptext" style="margin:0">On attend les autres. Tu peux encore changer d'avis.</p></div><button class="btn btn-block" id="btn-unseal">Modifier mes ordres</button>`;
  } else if (!b) {
    builder = freeDice.length ? `${steps(0)}<p class="ptext"><b>Clique un dé</b> pour lui donner un ordre. Plus le dé est haut, plus l'ordre est fort.${pl.hiddenIdx >= 0 ? ` Le dé ${ICON.hidden}CACHÉ est invisible pour les autres (${term("de_cache", "bluff")}).` : ""}${pl.extraDie ? ` Tu as fait un ${term("double")} : dé bonus !` : ""}</p>` : `<p class="ptext">Tous tes dés ont un ordre. Vérifie le récapitulatif et scelle.</p>`;
  } else if (!b.type) {
    const v = dv[b.die];
    const noStrike = false;
    const noIntr = !E.unlocked(st, "intrigue");
    builder = `${steps(1)}<p class="ph">Dé de ${v} : que fais-tu ?</p><div class="actgrid">
      <button class="actbtn" data-act="strike" ${noStrike ? "disabled" : ""}><span class="ab-top">${ICON.frapper}<b>Frapper</b></span><span>${noStrike ? "Pas d'attaque à la toute première manche" : `Attaquer une province voisine. +${v} à ta force`}</span></button>
      <button class="actbtn" data-act="march"><span class="ab-top">${ICON.marcher}<b>Marcher</b></span><span>Déplacer jusqu'à ${v} armées entre tes provinces</span></button>
      <button class="actbtn" data-act="levy"><span class="ab-top">${ICON.lever}<b>Lever</b></span><span>Recruter ${E.levyAmount(v)} armées dans une de tes provinces</span></button>
      <button class="actbtn ${noIntr ? "locked" : ""}" data-act="intrigue" ${noIntr ? "disabled" : ""}><span class="ab-top">${ICON.intrigue}<b>Intriguer</b></span><span>${noIntr ? `Débloqué à la manche ${E.UNLOCK.intrigue}` : "Poison, séduction ou corruption (coûte de l'or)"}</span></button>
    </div><button class="btn btn-small" id="b-cancel">← Choisir un autre dé</button>`;
  } else builder = builderStep(b, steps);
  // récapitulatif
  const recap = L.ui.orders.length ? `<div class="recap"><p class="ph">Tes ordres pour cette manche</p><ul class="orderlist">${L.ui.orders.map((o, i) => `<li><span>${orderText(o)}</span>${sealed ? "" : `<button class="x" data-del="${i}" aria-label="Annuler cet ordre">×</button>`}</li>`).join("")}</ul>${!sealed && freeDice.length ? `<p class="warn">${ICON.risk}Il te reste ${freeDice.length} dé${freeDice.length > 1 ? "s" : ""} sans ordre : ${freeDice.length > 1 ? "ils ne serviront" : "il ne servira"} à rien si tu scelles maintenant.</p>` : ""}</div>` : "";
  const seal = sealed ? "" : `<button class="btn btn-red btn-block" id="btn-seal">${ICON.scroll}Sceller mes ordres</button>`;
  return { html: `<p class="ph">2. Tes dés d'ordres</p>${diceHtml}${builder}${recap}${seal}
    <div class="kv" style="margin-top:12px"><span>${ICON.gold}<b>${term("or", "Or")}</b> ${pl.gold}${goldPlanned() ? ` (−${goldPlanned()} prévus)` : ""}</span></div>`,
    arrows, bind: () => bindOrders(b, sealed) };
}

export function builderStep(b, steps) {
  const st = S(), pid = me(), pl = st.players[pid];
  const v = myDice()[b.die];
  const mine = E.provincesOf(st, pid);
  const back = `<button class="btn btn-small" id="b-back">← Retour</button>`;
  const cancel = `<button class="btn btn-small" id="b-cancel">Annuler cet ordre</button>`;
  const nav = `<div class="row" style="margin-top:8px">${back}${cancel}</div>`;
  if (b.type === "strike") {
    if (!b.from) {
      mine.filter((id) => avail(id) >= 1 && PROVINCES[id].adj.some((a) => st.provinces[a].owner !== pid)).forEach((id) => MAP.sel.add(id));
      MAP.hl = new Set(MAP.sel); MAP.onPick = (id) => { b.from = id; render(); };
      return `${steps(2)}<div class="prompt">${ICON.frapper}Sur la carte, clique <b>ta province d'où part l'attaque</b> (contour doré). Il faut au moins 2 armées : une reste toujours sur place.</div>${MAP.sel.size ? "" : `<p class="warn">Aucune de tes provinces n'a assez d'armées pour attaquer. Choisis plutôt Lever.</p>`}${nav}`;
    }
    if (!b.to) {
      const n = avail(b.from);
      PROVINCES[b.from].adj.filter((a) => st.provinces[a].owner !== pid).forEach((id) => {
        MAP.sel.add(id);
        const pr = Math.round(E.winProb(n + v + E.attackMod(st, pid), E.defenseOf(st, id)) * 100);
        MAP.badges.push({ prov: id, text: `${pr} %`, color: pr >= 67 ? "#2F5233" : pr >= 45 ? "#8A5F10" : "#8E1B1B" });
      });
      MAP.hlRed = new Set(MAP.sel); MAP.hl = new Set([b.from]); MAP.onPick = (id) => { b.to = id; b.n = avail(b.from); render(); };
      return `${steps(2)}<div class="prompt">${ICON.target}Clique <b>la province à attaquer</b>. Le pourcentage affiché sur chacune = tes chances si tu envoies toutes tes armées disponibles (${n}).</div>${nav}`;
    }
    const max = avail(b.from); b.n = Math.min(Math.max(1, b.n || max), max);
    MAP.hl = new Set([b.from]); MAP.hlRed = new Set([b.to]);
    const def = st.provinces[b.to];
    const prob = Math.round(E.winProb(b.n + v + E.attackMod(st, pid), E.defenseOf(st, b.to)) * 100);
    const ally = def.owner && E.bound(st, pid, def.owner);
    return `${steps(3)}<div class="pbox"><p class="ph">${ICON.frapper}Attaque sur ${esc(PROVINCES[b.to].art)}</p>
      <p class="ptext" style="font-size:15px">${term("defense", "Défense")} : ${def.armies} armée${def.armies > 1 ? "s" : ""}${def.owner ? ` (${esc(houseName(def.owner))})` : " (milice neutre)"}${E.peurBonus(st.players[def.owner]) ? ` +${E.peurBonus(st.players[def.owner])} grâce à sa ${term("peur", "Peur")}` : ""}. Ta force : armées envoyées + ${v} (ton dé).</p>
      <label class="ptext">Armées envoyées : <b id="b-nv">${b.n}</b> sur ${max}<input type="range" class="slider" id="b-n" min="1" max="${max}" value="${b.n}"></label>
      <p class="ptext">Chances de victoire : <span class="pct" id="b-pct">${prob} %</span></p>
      <p class="hint">Si tu gagnes, la province est à toi. Si tu perds, les armées envoyées meurent. Les autres jouent en même temps : la défense peut changer.</p>
      ${ally ? `<p class="warn"><b>Attention :</b> cette maison est ton alliée ou en trêve avec toi. L'attaquer est une ${term("trahison")} (−5 Prestige).</p>` : ""}
      <button class="btn btn-red btn-block" id="b-ok">Valider l'attaque</button>${nav}</div>`;
  }
  if (b.type === "march") {
    if (!b.from) { mine.filter((id) => avail(id) >= 1 && PROVINCES[id].adj.some((a) => st.provinces[a].owner === pid)).forEach((id) => MAP.sel.add(id)); MAP.hl = new Set(MAP.sel); MAP.onPick = (id) => { b.from = id; render(); }; return `${steps(2)}<div class="prompt">${ICON.marcher}Clique <b>la province de départ</b> (une des tiennes, contour doré).</div>${MAP.sel.size ? "" : `<p class="warn">Aucune province ne peut envoyer d'armées vers une voisine à toi.</p>`}${nav}`; }
    if (!b.to) { PROVINCES[b.from].adj.filter((a) => st.provinces[a].owner === pid).forEach((id) => MAP.sel.add(id)); MAP.hl = new Set(MAP.sel); MAP.onPick = (id) => { b.to = id; b.n = Math.min(v, avail(b.from)); render(); }; return `${steps(2)}<div class="prompt">${ICON.marcher}Clique <b>la province d'arrivée</b> (voisine, à toi).</div>${nav}`; }
    const max = Math.min(v, avail(b.from)); b.n = Math.min(Math.max(1, b.n || max), max);
    MAP.hl = new Set([b.from, b.to]);
    return `${steps(3)}<div class="pbox"><p class="ph">${ICON.marcher}${esc(PROVINCES[b.from].name)} → ${esc(PROVINCES[b.to].name)}</p><label class="ptext">Armées déplacées : <b id="b-nv">${b.n}</b> sur ${max}<input type="range" class="slider" id="b-n" min="1" max="${max}" value="${b.n}"></label><button class="btn btn-red btn-block" id="b-ok">Valider le déplacement</button>${nav}</div>`;
  }
  if (b.type === "levy") {
    mine.forEach((id) => MAP.sel.add(id)); MAP.hl = new Set(MAP.sel);
    const canMerc = pl.gold - goldPlanned() >= E.MERC_COST;
    if (!canMerc) b.merc = false;
    MAP.onPick = (id) => { L.ui.orders.push({ die: b.die, type: "levy", to: id, merc: !!b.merc }); L.ui.build = null; saveOrders(); A.play(b.merc ? "coins" : "click"); render(); };
    const n = E.levyAmount(v) + (b.merc ? E.MERC_ARMIES : 0);
    return `${steps(2)}<button class="merc-toggle ${b.merc ? "on" : ""}" id="merc-toggle" ${canMerc ? "" : "disabled"}>${ICON.gold}<span><b>${b.merc ? "✓ Mercenaires engagés" : "Engager des mercenaires ?"}</b><br>${canMerc ? `+${E.MERC_ARMIES} armées pour ${E.MERC_COST} or (il te reste ${pl.gold - goldPlanned()} or)` : `Il faut ${E.MERC_COST} or (tu en as ${pl.gold - goldPlanned()} de libre)`}</span></button><div class="prompt">${ICON.lever}Clique <b>la province où recruter ${n} armées</b>. Conseil : une province qui touche un voisin dangereux.</div>${nav}`;
  }
  if (b.type === "intrigue") {
    const k = E.king(st, pid);
    const goldLeft = pl.gold - goldPlanned();
    if (!b.kind) {
      const opt = (kind, name, desc) => { const bonus = (k && k.trait === "Rusé" ? 1 : 0) + (pl.intrigueBonus || 0) + (kind === "seduction" && k && k.trait === "Séduisant" ? 1 : 0); const pr = Math.round(E.intrigueProb(v, bonus, E.NEED[kind]) * 100); return `<button class="actbtn" data-kind="${kind}" ${goldLeft < E.COSTS[kind] ? "disabled" : ""}><span class="ab-top">${ICON.intrigue}<b>${name}</b> · ${ICON.gold}${E.COSTS[kind]}</span><span>${desc}<br>Réussite : <span class="pct">${pr} %</span>${goldLeft < E.COSTS[kind] ? " · pas assez d'or" : ""}</span></button>`; };
      return `${steps(2)}<p class="ph">Quelle intrigue ?</p><div class="actgrid">${opt("poison", "Poison", "Tuer un membre d'une famille rivale. Anonyme si ça marche.")}${opt("seduction", "Séduction", "Un bâtard à tes couleurs naît chez l'ennemi.")}${opt("bribe", "Corruption", "Acheter une garnison ennemie (3 armées max).")}</div><p class="hint">En cas d'échec, tout le monde saura que c'était toi.</p>${nav}`;
    }
    if (!b.target) {
      const others = st.order.filter((p) => p !== pid);
      return `${steps(2)}<p class="ph">Contre quelle maison ?</p><div class="target-row">${others.map((p) => `<button class="btn btn-small" data-tgt="${p}">${shield(st.players[p].house, 18)} ${esc(houseName(p))}</button>`).join("")}</div>${nav}`;
    }
    if (b.kind === "poison" && !b.person) {
      const fam = st.families[b.target].members.filter((m) => m.alive && ["king", "queen", "child", "widow"].includes(m.role));
      const role = (m) => (m.role === "king" ? (m.sex === "f" ? "Reine régnante" : "Roi") : m.role === "queen" ? "Reine" : m.role === "widow" ? "Reine douairière" : E.heirs(st, b.target)[0] === m ? "Héritier" : "Enfant");
      return `${steps(2)}<p class="ph">Qui empoisonner chez ${esc(houseName(b.target))} ?</p><p class="hint">Tuer l'héritier ou le roi peut déclencher une crise de ${term("succession")}.</p><div class="choices">${fam.map((m) => `<button class="choice" data-person="${m.id}"><b>${esc(E.personTitle(m))}</b><span>${role(m)}, ${m.age} ans · ${esc(m.trait)}${m.trait === "Paranoïaque" ? " (plus dur à empoisonner)" : ""}</span></button>`).join("")}</div>${nav}`;
    }
    if (b.kind === "bribe" && !b.prov) {
      const cands = E.provincesOf(st, b.target).filter((id) => id !== st.players[b.target].capital && st.provinces[id].armies <= 3);
      cands.forEach((id) => MAP.sel.add(id)); MAP.hlRed = new Set(cands);
      MAP.onPick = (id) => { L.ui.orders.push({ die: b.die, type: "intrigue", kind: "bribe", target: b.target, prov: id }); L.ui.build = null; saveOrders(); render(); };
      return `${steps(2)}<div class="prompt">${cands.length ? "Clique la garnison à corrompre (3 armées ou moins, pas la capitale)." : "Aucune garnison corruptible chez cette maison."}</div>${nav}`;
    }
    if (b.kind === "seduction" && !E.mother(st, b.target)) return `<div class="prompt">Il n'y a pas de reine à séduire chez ${esc(houseName(b.target))}.</div>${nav}`;
    return nav;
  }
  return nav;
}

export function bindOrders(b, sealed) {
  if ($("#merc-toggle")) $("#merc-toggle").onclick = () => { if (L.ui.build) { L.ui.build.merc = !L.ui.build.merc; A.play("coins"); render(); } };
  document.querySelectorAll("[data-die]").forEach((el) => (el.onclick = () => {
    const i = +el.dataset.die;
    const idx = L.ui.orders.findIndex((o) => o.die === i);
    if (idx >= 0) { L.ui.orders.splice(idx, 1); saveOrders(); }
    L.ui.build = { die: i }; A.play("click"); render();
  }));
  document.querySelectorAll("[data-act]").forEach((el) => (el.onclick = () => { L.ui.build.type = el.dataset.act; render(); }));
  document.querySelectorAll("[data-kind]").forEach((el) => (el.onclick = () => { L.ui.build.kind = el.dataset.kind; render(); }));
  document.querySelectorAll("[data-tgt]").forEach((el) => (el.onclick = () => {
    L.ui.build.target = el.dataset.tgt;
    if (L.ui.build.kind === "seduction" && E.mother(S(), el.dataset.tgt)) { L.ui.orders.push({ die: b.die, type: "intrigue", kind: "seduction", target: el.dataset.tgt }); L.ui.build = null; saveOrders(); }
    render();
  }));
  document.querySelectorAll("[data-person]").forEach((el) => (el.onclick = () => { L.ui.orders.push({ die: b.die, type: "intrigue", kind: "poison", target: b.target, person: el.dataset.person }); L.ui.build = null; saveOrders(); render(); }));
  document.querySelectorAll("[data-del]").forEach((el) => (el.onclick = () => { L.ui.orders.splice(+el.dataset.del, 1); saveOrders(); render(); }));
  if ($("#b-cancel")) $("#b-cancel").onclick = () => { L.ui.build = null; render(); };
  if ($("#b-back")) $("#b-back").onclick = () => {
    const x = L.ui.build; if (!x) return;
    if (x.person || x.prov) { delete x.person; delete x.prov; }
    else if (x.target) delete x.target;
    else if (x.kind) delete x.kind;
    else if (x.to) delete x.to;
    else if (x.from) delete x.from;
    else if (x.type) delete x.type;
    else L.ui.build = null;
    render();
  };
  const slider = $("#b-n");
  if (slider) slider.oninput = () => {
    b.n = +slider.value; $("#b-nv").textContent = b.n;
    if ($("#b-pct")) { const st = S(); $("#b-pct").textContent = Math.round(E.winProb(b.n + myDice()[b.die] + E.attackMod(st, me()), E.defenseOf(st, b.to)) * 100) + " %"; }
  };
  if ($("#b-ok")) $("#b-ok").onclick = () => { L.ui.orders.push({ die: b.die, type: b.type, from: b.from, to: b.to, n: b.n }); L.ui.build = null; saveOrders(); A.play("click"); render(); };
  if ($("#btn-seal")) $("#btn-seal").onclick = () => { L.ui.build = null; saveOrders(true); A.play("seal"); render(); };
  if ($("#btn-unseal")) $("#btn-unseal").onclick = () => { saveOrders(false); render(); };
  bindDiplomacy();
}
