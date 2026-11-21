// =====================================================================
//  AIDES À LA COMPRÉHENSION : icônes, définitions, effets, introduction
// =====================================================================
const S = (d, extra = "") => `<svg class="ico" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" ${extra}>${d}</svg>`;
export const ICON = {
  prestige: S('<path d="M3 18 L3 8 L8 12 L12 5 L16 12 L21 8 L21 18 Z" fill="#D9A441" stroke="#2B1D12" stroke-width="1.5" stroke-linejoin="round"/>'),
  gold: S('<circle cx="12" cy="12" r="8" fill="#E8C66A" stroke="#8A5F10" stroke-width="2"/><path d="M12 7v10M9.5 9.5h4a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3h4" fill="none" stroke="#8A5F10" stroke-width="1.6"/>'),
  colere: S('<path d="M12 21V9M7 3v5a5 5 0 0 0 10 0V3M12 3v6" fill="none" stroke="#8E1B1B" stroke-width="2.2" stroke-linecap="round"/>'),
  peur: S('<path d="M12 3a8 8 0 0 0-8 8c0 3 1.5 4.5 3 5.5V20h10v-3.5c1.5-1 3-2.5 3-5.5a8 8 0 0 0-8-8z" fill="#E9DCBD" stroke="#2B1D12" stroke-width="1.6"/><circle cx="9" cy="11" r="2" fill="#2B1D12"/><circle cx="15" cy="11" r="2" fill="#2B1D12"/><path d="M10 17v3M14 17v3" stroke="#2B1D12" stroke-width="1.4"/>'),
  army: S('<path d="M6 3v18M6 4h12l-3 4 3 4H6" fill="#8E1B1B" stroke="#2B1D12" stroke-width="1.6" stroke-linejoin="round"/>'),
  frapper: S('<path d="M14 4l6-1-1 6-9 9-3-3zM7 14l3 3M4 20l3-3" fill="none" stroke="#2B1D12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'),
  marcher: S('<path d="M4 12h13M13 7l5 5-5 5" fill="none" stroke="#2B1D12" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>'),
  lever: S('<path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z" fill="#E9DCBD" stroke="#2B1D12" stroke-width="1.6"/><path d="M12 8v8M8 12h8" stroke="#2F5233" stroke-width="2.4" stroke-linecap="round"/>'),
  intrigue: S('<path d="M10 3h4M11 3v5l-5 9a3 3 0 0 0 2.6 4.5h6.8A3 3 0 0 0 18 17l-5-9V3" fill="#C9E0B5" stroke="#2B1D12" stroke-width="1.6" stroke-linejoin="round"/>'),
  hidden: S('<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" fill="none" stroke="#8E1B1B" stroke-width="1.8"/><circle cx="12" cy="12" r="3" fill="#8E1B1B"/><path d="M4 20L20 4" stroke="#8E1B1B" stroke-width="2"/>'),
  province: S('<path d="M4 20V10h3V7h2v3h6V7h2v3h3v10z" fill="#E9DCBD" stroke="#2B1D12" stroke-width="1.5"/>'),
  family: S('<circle cx="9" cy="8" r="3" fill="#2B1D12"/><circle cx="16" cy="9" r="2.5" fill="#6B5638"/><path d="M3 20c0-4 3-6 6-6s6 2 6 6M13 20c0-3 1.5-5 3-5s4 1.5 4 5" fill="none" stroke="#2B1D12" stroke-width="1.6"/>'),
  scroll: S('<path d="M6 4h11a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" fill="#E9DCBD" stroke="#2B1D12" stroke-width="1.6"/><path d="M8 9h8M8 13h8M8 17h5" stroke="#2B1D12" stroke-width="1.4"/>'),
  risk: S('<path d="M12 3l10 18H2z" fill="#F6E3A8" stroke="#8E1B1B" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 10v5M12 17.5v.5" stroke="#8E1B1B" stroke-width="2" stroke-linecap="round"/>'),
  target: S('<circle cx="12" cy="12" r="8" fill="none" stroke="#8E1B1B" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="#8E1B1B"/>'),
  death: S('<path d="M10 3h4v5h5v4h-5v9h-4v-9H5V8h5z" fill="#2B1D12"/>'),
  ring: S('<circle cx="9" cy="13" r="5" fill="none" stroke="#D9A441" stroke-width="2.2"/><circle cx="15" cy="13" r="5" fill="none" stroke="#D9A441" stroke-width="2.2"/>'),
  plague: S('<circle cx="12" cy="12" r="8" fill="#3A2E24"/><circle cx="9" cy="10" r="1.6" fill="#E9DCBD"/><circle cx="14" cy="14" r="1.4" fill="#E9DCBD"/><circle cx="15" cy="9" r="1" fill="#E9DCBD"/>'),
};

// ---------- définitions (au toucher) ----------
export const GLOSSARY = {
  prestige: ["Prestige", "Ta gloire. C'est la base de ton score final. On en gagne en conquérant, en tenant des régions, en battant le favori ; on en perd en trahissant, en échouant une intrigue, ou par certains dilemmes."],
  or: ["Or", "Ton trésor : 1 or par province à chaque manche. Il sert à engager des mercenaires (4 or = +2 armées quand tu lèves), à payer les intrigues (3 à 6 or) et à faire des cadeaux aux autres maisons. Si on prend ta capitale, on te vole un tiers de ton or."],
  colere: ["Colère du peuple", "Monte avec la cruauté et les impôts. À 80, une de tes provinces se révolte et devient neutre. Elle baisse de 5 à chaque manche."],
  peur: ["Peur", "Ta réputation de cruauté. Tous les 25 points : +1 en défense partout. Mais à 50, plus personne n'accepte de marier ses enfants aux tiens."],
  armees: ["Armées", "Le chiffre sur la bannière de chaque province. Elles défendent la province et servent à attaquer les provinces voisines. Une province garde toujours au moins 1 armée."],
  frapper: ["Frapper", "Attaquer une province voisine. Ta force = armées envoyées + valeur du dé + un petit hasard. Le défenseur gagne les égalités. Le jeu t'affiche tes chances avant de valider."],
  marcher: ["Marcher", "Déplacer des armées entre deux de tes provinces voisines. Au maximum la valeur du dé."],
  lever: ["Lever", "Recruter de nouvelles armées dans une de tes provinces : 2 armées avec un dé de 1-2, 3 avec 3-4, 4 avec 5-6."],
  intriguer: ["Intriguer", "Coups bas qui coûtent de l'or : Poison (tuer un membre d'une famille rivale), Séduction (semer un bâtard chez l'ennemi), Corruption (acheter une petite garnison). Plus le dé est haut, plus ça a de chances de réussir."],
  de_cache: ["Dé caché", "Un de tes dés, marqué CACHÉ, est invisible pour les autres. Ils ne savent pas exactement quelle force tu as : à toi de bluffer."],
  double: ["Double", "Si deux de tes dés font le même chiffre, tu reçois un dé de 2 en bonus : un ordre de plus."],
  capitale: ["Capitale", "Ta première province (médaillon doré avec un château, et le nom de ta ville sous l'armée). La perdre coûte 5 Prestige, 20 de Colère et un tiers de ton or. Ton revenu d'armées y apparaît."],
  region: ["Région", "Un groupe de provinces (Nord, Ouest, Est, Centre, Sud-Ouest, Sud-Est). Les tenir toutes rapporte des armées et 1 Prestige à chaque manche, et 3 points à la fin."],
  treve: ["Trêve", "Accord de non-agression de 3 manches. L'attaquer quand même = trahison : −5 Prestige et un surnom infamant."],
  mariage: ["Mariage", "Alliance permanente entre deux maisons (+1 or par manche chacune). Attaquer sa belle-famille = trahison."],
  trahison: ["Trahison", "Attaquer un allié ou une maison avec qui tu as une trêve. −5 Prestige, l'alliance est rompue, et ton roi gagne le surnom « le Traître »."],
  favori: ["Le favori", "Le joueur en tête porte la couronne. Battre ses armées rapporte 2 Prestige : tout le monde a intérêt à se liguer contre lui."],
  couronnement: ["Le Couronnement", "La dernière manche. Chaque conquête rapporte 3 Prestige et les scores des autres sont cachés jusqu'à la fin."],
  objectifs: ["Objectifs secrets", "Deux ambitions que toi seul connais. Réussies à la fin, elles rapportent 5 à 10 points. Regarde-les dans « Ma maison »."],
  score: ["Score final", "Prestige + 1 par province + 3 par région complète + tes objectifs secrets réussis + 1 par membre vivant de ta famille. Le plus haut score gagne. Tenir 15 provinces = victoire immédiate."],
  peste: ["Peste", "Les points noirs sur une province. Elle tue une armée par manche et se propage aux voisines. Si ta capitale l'a, ta famille risque d'y passer."],
  dilemme: ["Dilemmes", "Deux cartes secrètes au début de chaque manche : une affaire de ta maison (les autres n'en apprennent qu'une rumeur) et une affaire avec une maison rivale (révélée à tous, parfois un pacte où vous choisissez tous les deux). Toutes les options coûtent quelque chose."],
  pacte: ["Pacte", "Un dilemme partagé avec un autre joueur. Vous choisissez en même temps, en secret, et le résultat dépend de vos deux choix. Faire confiance ou trahir ?"],
  accusation: ["Accusation", "Les poisons réussis restent anonymes. Accuse la bonne maison : elle perd 4 Prestige et tu en gagnes 2. Accuse à tort : −2 pour toi."],
  defense: ["Défense", "Armées présentes + 1 par tranche de 25 de Peur du propriétaire + un petit hasard. Le défenseur gagne les égalités."],
  succession: ["Succession", "À la mort du roi, l'aîné des fils hérite (sinon l'aînée des filles). Sans héritier : guerre civile, tu perds un tiers de tes provinces."],
};
export function term(key, label) {
  const g = GLOSSARY[key];
  if (!g) return label || key;
  return `<button type="button" class="term" data-term="${key}">${label || g[0]}</button>`;
}

// ---------- effets d'une option en icônes ----------
const sign = (n) => (n > 0 ? `+${n}` : `${n}`);
export function effectChips(fx, depth = 0) {
  const out = [];
  for (const f of fx || []) {
    if (f.gold) out.push([f.gold > 0 ? "good" : "bad", `${ICON.gold}${sign(f.gold)} or`]);
    if (f.prestige) out.push([f.prestige > 0 ? "good" : "bad", `${ICON.prestige}${sign(f.prestige)} prestige`]);
    if (f.armies) out.push([f.armies > 0 ? "good" : "bad", `${ICON.army}${sign(f.armies)} armée${Math.abs(f.armies) > 1 ? "s" : ""}`]);
    if (f.colere) out.push([f.colere > 0 ? "bad" : "good", `${ICON.colere}${sign(f.colere)} colère`]);
    if (f.peur) out.push(["neutral", `${ICON.peur}${sign(f.peur)} peur`]);
    if (f.kill) out.push(["bad", `${ICON.death}un mort dans ta famille`]);
    if (f.plague) out.push(["bad", `${ICON.plague}peste`]);
    if (f.nextDice) out.push([f.nextDice > 0 ? "good" : "bad", `${sign(f.nextDice)} dé à la prochaine manche`]);
    if (f.intrigueBonus) out.push(["good", `${ICON.intrigue}+${f.intrigueBonus} aux intrigues`]);
    if (f.loseProvince) out.push(["bad", `${ICON.province}−1 province`]);
    if (f.gainNeutral) out.push(["good", `${ICON.province}+1 province`]);
    if (f.steal) out.push(["good", `${ICON.gold}+${f.steal} or pris à la cible`]);
    if (f.treatyTarget || f.treatyPartner) out.push(["good", `trêve`]);
    if (f.marryTarget || f.marryPartner) out.push(["good", `${ICON.ring}mariage`]);
    if (f.epithet) out.push(["neutral", `surnom « ${f.epithet} »`]);
    if (f.addChild) out.push(["good", `${ICON.family}+${f.addChild} enfant${f.addChild > 1 ? "s" : ""}${f.bastard ? " (bâtard)" : ""}`]);
    if (f.addBastard) out.push(["neutral", `${ICON.family}un bâtard reconnu`]);
    if (f.addChildDoubt) out.push(["neutral", `${ICON.family}un enfant… peut-être de toi`]);
    if (f.newQueen) out.push(["good", `${ICON.ring}nouvelle reine`]);
    if (f.legitimize) out.push(["neutral", "le bâtard entre dans la succession"]);
    if (f.disinherit) out.push(["bad", "un héritier écarté"]);
    if (f.removePerson) out.push(["bad", `${ICON.family}un enfant quitte la famille`]);
    if (f.consanguin) out.push(["risk", "enfants consanguins"]);
    if (f.seduceTarget) out.push(["good", "un bâtard chez l'ennemi"]);
    if (f.spyObjectives) out.push(["good", "tu découvres ses objectifs secrets"]);
    if (f.breakAlliance || f.breakAllAlliances) out.push(["bad", "alliance rompue"]);
    if (f.chain) out.push(["neutral", `${ICON.scroll}une suite viendra plus tard`]);
    if (f.health) out.push([f.health > 0 ? "bad" : "good", f.health > 0 ? "le roi s'affaiblit" : "le roi guérit"]);
    if (f.target && depth === 0) out.push(["neutral", `${ICON.target}frappe la maison choisie`]);
    if (f.chance !== undefined && depth === 0) out.push(["risk", `${ICON.risk}risque : ${Math.round(f.chance * 100)} %`]);
    if (f.others) out.push(["neutral", "touche toutes les autres maisons"]);
  }
  return out;
}
export function chipsHtml(fx) {
  const c = effectChips(fx);
  if (!c.length) return `<span class="fxchip neutral">aucun effet immédiat</span>`;
  return c.map(([k, t]) => `<span class="fxchip ${k}">${t}</span>`).join("");
}

// ---------- introduction en 5 cartes ----------
export const INTRO = [
  { title: "Le but", icon: ICON.prestige, text: "France, 1347. Tu diriges une grande maison noble. Après la dernière manche (<b>10</b>, ou 7 en partie courte), celui qui a le plus gros score gagne : <b>Prestige + provinces + régions + objectifs secrets + famille vivante</b>. Tenir 15 provinces fait gagner immédiatement." },
  { title: "Une manche", icon: ICON.scroll, text: "Chaque manche se déroule toujours pareil :<br><b>1. Les dilemmes</b> : deux décisions secrètes, une pour ta maison, une avec un rival.<br><b>2. Les ordres</b> : tu donnes un ordre à chacun de tes dés.<br><b>3. La révélation</b> : on découvre tout, chapitre par chapitre, à son rythme." },
  { title: "Tes jauges", icon: ICON.gold, text: `${ICON.prestige} <b>Prestige</b> : tes points de victoire.<br>${ICON.gold} <b>Or</b> : engage des mercenaires (4 or = +2 armées), paie les intrigues et les cadeaux.<br>${ICON.colere} <b>Colère du peuple</b> : à 80, une province se révolte.<br>${ICON.peur} <b>Peur</b> : +1 en défense tous les 25 points, mais à 50 plus personne n'épouse tes enfants.<br>Tu les vois en haut à droite, sous ton score.` },
  { title: "Les dés d'ordres", icon: ICON.frapper, text: "Chaque manche, tu lances 3 dés. Chaque dé = un ordre :<br>" + `${ICON.frapper} <b>Frapper</b> : attaquer une province voisine (le dé s'ajoute à ta force)<br>${ICON.marcher} <b>Marcher</b> : déplacer des armées<br>${ICON.lever} <b>Lever</b> : recruter des armées<br>${ICON.intrigue} <b>Intriguer</b> : poison, séduction, corruption` },
  { title: "Les batailles", icon: ICON.army, text: "Le chiffre sur chaque bannière = les armées de la province. Pour attaquer, il faut une province <b>voisine</b>. Ta force = armées envoyées + ton dé + un petit hasard. Le jeu t'affiche tes <b>chances de victoire</b> avant que tu valides." },
  { title: "La famille", icon: ICON.family, text: "Ton roi vieillit, a des enfants, meurt. L'aîné hérite. <b>Sans héritier, c'est la guerre civile.</b> Marie tes enfants pour t'allier, méfie-toi des poisons, et regarde ta famille dans l'onglet « Ma maison »." },
];

// ---------- fenêtres « Nouveau ! » de la première partie ----------
export const UNLOCK_INFO = {
  intrigue: { title: "Nouveau : les intrigues", icon: ICON.intrigue, text: "Tu peux maintenant utiliser un dé pour <b>Intriguer</b> :<br><b>Poison</b> (4 or) : tuer un membre d'une famille rivale. Anonyme si ça marche.<br><b>Séduction</b> (3 or) : faire naître un bâtard à tes couleurs chez l'ennemi. À la mort de son roi, tu lui prends une province.<br><b>Corruption</b> (6 or) : acheter une garnison ennemie de 3 armées ou moins.<br>Plus ton dé est haut, plus tu as de chances. En cas d'échec, tout le monde sait que c'était toi." },
  diplomacy: { title: "La diplomatie", icon: ICON.ring, text: "Ouvre l'onglet <b>Diplomatie</b> :<br><b>Mariage</b> : alliance permanente, +1 or par manche pour chacun.<br><b>Trêve</b> : non-agression pendant 3 manches.<br><b>Or</b> : envoie de l'or à qui tu veux (cadeau, pot-de-vin, rançon…).<br><b>Messages secrets</b> : négocie, promets, menace. Seul le destinataire lit.<br>Attaquer un allié ou rompre une trêve est une <b>trahison</b> : −5 Prestige." },
  hidden: { title: "Nouveau : le bluff", icon: ICON.hidden, text: "Désormais, <b>un de tes dés est caché</b> aux autres joueurs (marqué CACHÉ). Ils ne savent plus exactement quelle force tu as.<br>Et les poisons réussis restent <b>anonymes</b> : dans l'onglet Diplomatie, tu peux <b>accuser</b> une maison. Bonne accusation : elle perd 4 Prestige, toi tu en gagnes 2. Mauvaise : −2 pour toi." },
};

// ---------- légende de la carte ----------
export const LEGEND = `<div class="legend-row"><svg width="26" height="26" viewBox="-13 -2 26 26"><path d="M-12,0 L12,0 L12,22 L0,16 L-12,22 Z" fill="#8E1B1B" stroke="#2B1D12"/><text x="0" y="14" text-anchor="middle" font-size="12" fill="#fff" font-family="Cinzel" font-weight="700">5</text></svg><span>Bannière : le nombre d'armées, à la couleur du propriétaire</span></div>
<div class="legend-row"><svg width="30" height="30" viewBox="-17 -17 34 34"><circle r="17" fill="#2B1D12"/><circle r="15.5" fill="#D9A441"/><circle r="13" fill="#8E1B1B" stroke="#2B1D12"/><path d="M-8,7 V-3 h2.6 v-3 h2.6 v3 h1.5 V-8 h2.6 v2.4 h2.6 V-3 h1.5 v-3 h2.6 v3 h0 V7 h-6 v-4 a2,2 0 0 0 -4,0 v4 Z" fill="#F6ECD6" stroke="#2B1D12" stroke-width="0.8"/></svg><span>Médaillon doré au château : la capitale d'une maison (son nom de ville est écrit dessous)</span></div>
<div class="legend-row"><svg width="26" height="26" viewBox="-12 -8 24 15"><path d="M-11,6 L-11,-4 L-5,1 L0,-7 L5,1 L11,-4 L11,6 Z" fill="#D9A441" stroke="#2B1D12"/></svg><span>Couronne : le favori, le joueur en tête</span></div>
<div class="legend-row">${ICON.plague}<span>Points noirs : la peste</span></div>
<div class="legend-row"><span class="lg-sw" style="background:#D9C9A3"></span><span>Province beige : neutre, défendue par une milice</span></div>
<div class="legend-row"><span class="lg-sw" style="border:3px dashed #D9A441;background:transparent"></span><span>Contour doré clignotant : province sur laquelle tu peux cliquer</span></div>`;
