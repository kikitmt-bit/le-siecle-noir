// Ragots de taverne et nouvelles
import * as E from "../engine.js?v=1795378288";
import { ICON } from "../help.js?v=1795378288";
import { S, esc } from "../state.js?v=1795378288";

// ---- ragots de taverne : les mêmes pour tout le monde, tirés de la situation réelle ----
export function seeded(str) { let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; }; }

export function ragots() {
  const st = S();
  if (!st || st.round < 1) return [];
  const rng = seeded(`${st.gameId}:${st.round}`);
  const ps = st.order.filter((p) => st.players[p] && !st.players[p].exiled);
  const hn = (p) => E.maisonName(st, p);
  const by = (f) => ps.slice().sort((a, b) => f(b) - f(a));
  const out = [];
  const add = (cond, t) => { if (cond) out.push(t); };
  const rich = by((p) => st.players[p].gold)[0], poor = by((p) => -st.players[p].gold)[0];
  const angry = by((p) => st.players[p].colere)[0], scary = by((p) => st.players[p].peur)[0];
  const sc = (p) => E.estimateScore(st, {}, p).total;
  const first = by(sc)[0], last = by((p) => -sc(p))[0];
  add(st.leader, `On dit que le roi de ${hn(st.leader)} s'est fait tailler une couronne neuve. Avec une tête pareille, il a fallu beaucoup d'or.`);
  add(st.leader, `Les mercenaires de toute l'Europe affûtent leurs lames : ${hn(st.leader)} est en tête, et tout le monde veut sa part du gâteau.`);
  add(st.players[rich].gold >= 12, `${E.capitalize(hn(rich))} a tant d'or qu'on dit que son roi se cure les dents avec des florins.`);
  add(st.players[poor].gold <= 4, `Le trésorier de ${hn(poor)} a vendu les cloches de la cathédrale. Puis les dents en or de la reine mère.`);
  add(st.players[angry].colere >= 35, `Les paysans de ${hn(angry)} ont pendu un percepteur. Puis son cheval, par principe.`);
  add(st.players[scary].peur >= 25, `À la cour de ${hn(scary)}, on ne dit plus « bonjour ». On dit « pitié ».`);
  add(ps.length > 2 && last !== first, `${E.capitalize(hn(last))} est à la traîne. Ses chevaliers exigent d'être payés d'avance, et en nature.`);
  for (const p of ps) {
    const k = E.king(st, p); if (!k) continue;
    add(k.age >= 60, `Le roi ${E.personTitle(k)} (${hn(p)}) a ${k.age} ans. Il appelle sa femme « maman ». Elle a arrêté de le corriger.`);
    add(k.health >= 3, `On a vu le médecin de ${hn(p)} acheter un cercueil. « Pour un ami », a-t-il dit.`);
    add(!!k.infirm, `Un ménestrel chante à Paris « la ballade de ${E.personTitle(k)} ». Il a eu la langue coupée, mais tout le monde connaît le refrain.`);
    const kids = st.families[p].members.filter((m) => m.alive && m.role === "child");
    add(kids.some((m) => m.bastardOf && m.bastardOf !== p), `Un enfant roux est né chez ${hn(p)}. Le roi est brun. Le palefrenier, lui, est très roux.`);
    add(kids.length === 0, `${E.capitalize(hn(p))} n'a plus d'héritier. Les cousins éloignés ont déjà pris les mesures du trône.`);
    add(kids.length >= 4, `Le roi de ${hn(p)} a tellement d'enfants qu'il ne connaît plus tous leurs prénoms. Il les appelle « toi ».`);
  }
  for (const a of st.alliances || []) add(true, `On a vu les ambassadeurs de ${hn(a.a)} et de ${hn(a.b)} partager la même chambre. Pour des raisons diplomatiques, évidemment.`);
  add(E.PROV_IDS.some((id) => st.provinces[id].plague > 0), "La peste rôde. Les médecins recommandent des sangsues, des prières, et surtout de partir très loin.");
  add(true, `Un moine de Cluny jure avoir vu le diable trinquer avec ${hn(ps[Math.floor(rng() * ps.length)])}. Le diable a payé sa tournée.`);
  add(true, `Une sorcière de Brocéliande prédit qu'un roi mourra avant l'hiver. Elle n'a pas dit lequel. Elle accepte les pots-de-vin.`);
  // on en garde deux, au hasard mais identiques pour tous
  const pickd = [];
  while (out.length && pickd.length < 2) pickd.push(out.splice(Math.floor(rng() * out.length), 1)[0]);
  return pickd;
}

export function ragotsHtml() {
  const r = ragots();
  if (!r.length) return "";
  return `<div class="ragots"><b>${ICON.scroll} RAGOTS DE TAVERNE</b>${r.map((t) => `<p>« ${esc(t)} »</p>`).join("")}</div>`;
}

// ---- un mot du chroniqueur après chaque bataille (le même pour tous) ----
export const QUIPS_WIN = ["Les défenseurs ont fui si vite qu'ils ont oublié leurs braies.", "Le seigneur du lieu s'est rendu contre la vie sauve. On a gardé la promesse cinq minutes.", "Les vainqueurs ont vidé la cave du château en une nuit. Puis le puits.", "Les cloches sonnent : pas pour fêter la victoire, mais parce qu'on les décroche pour les fondre.", "Les têtes des anciens maîtres décorent désormais les remparts. Ça manquait de couleur.", "Les nouveaux maîtres ont promis de respecter les coutumes locales. Ils ont commencé par les brûler.", "Le curé a béni les vainqueurs. Il avait béni les vaincus la veille. C'est un homme pragmatique."];

export const QUIPS_HOLD = ["Les assaillants ont reçu de l'huile bouillante, puis le contenu des latrines.", "L'attaquant a perdu son étendard, son cheval et sa dignité, dans cet ordre.", "Les défenseurs ont lancé des ruches sur l'ennemi. Les abeilles ont fini le travail.", "Les survivants rentrent à pied en parlant d'un « repli stratégique ».", "On a retrouvé le capitaine de l'assaut caché dans un tonneau de harengs.", "Les femmes de la ville ont défendu les murs avec des pots de chambre. Pleins.", "Le chef des assaillants a juré de revenir. Les défenseurs ont parié sur sa mort avant Pâques."];

export function battleQuip(st, s) {
  const r = seeded(`${st.gameId}:${st.round}:${s.prov}:${s.attWins}`)();
  const list = s.attWins ? QUIPS_WIN : QUIPS_HOLD;
  return list[Math.floor(r * list.length)];
}

export function newsHtml() {
  const n = S().news || [];
  if (!n.length) return "";
  return `<div class="news"><b>NOUVELLES DU ROYAUME</b>${n.map((x) => `<p>${esc(x.text)}</p>`).join("")}</div>`;
}
