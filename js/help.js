// =====================================================================
//  AIDES À LA COMPRÉHENSION : icônes, définitions, effets, introduction
// =====================================================================
// Icônes gravées (piste « Chronique ») : trait d'encre (currentColor), fond papier (--ia3), une touche de rubrique (--ia2).
const S = (d) => `<svg class="ico" viewBox="0 0 32 32" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const P = 'style="fill:var(--ia3)"', R = 'style="fill:var(--ia2)"', K = 'fill="currentColor" stroke="none"';
export const ICON = {
  prestige: S(`<path d="M15 28c-5.6-1.2-9.5-6-9.5-12.6 0-3 .8-5.6 2.2-7.6M17 28c5.6-1.2 9.5-6 9.5-12.6 0-3-.8-5.6-2.2-7.6"/><path d="M5.6 19.5l-3-1.2M5.4 14.6l-3-.8M8.8 23.6l-2.8.6M26.4 19.5l3-1.2M26.6 14.6l3-.8M23.2 23.6l2.8.6" stroke-width="1.6"/><path d="M16 7.5l1.4 2.9 3.2.4-2.4 2.2.7 3.1L16 14.5l-2.9 1.6.7-3.1-2.4-2.2 3.2-.4z" ${R}/>`),
  gold: S(`<circle cx="16" cy="16" r="11.5" ${P}/><circle cx="16" cy="16" r="7.5"/><path d="M16 11.5v9M11.5 16h9"/>`),
  colere: S(`<path d="M16 29.5V14M9.5 3.5v6.5a6.5 6.5 0 0 0 13 0V3.5M16 3.5V14"/><path d="M13.6 21.5h4.8M13.6 25h4.8" stroke-width="1.6" style="stroke:var(--ia2)"/>`),
  peur: S(`<path d="M16 4.5c-6.4 0-10.5 4.4-10.5 10.3 0 3.4 1.6 5.6 3.8 6.8V26.5h13.4v-4.9c2.2-1.2 3.8-3.4 3.8-6.8 0-5.9-4.1-10.3-10.5-10.3z" ${P}/><ellipse cx="11.8" cy="15.2" rx="2.6" ry="2.9" ${K}/><ellipse cx="20.2" cy="15.2" rx="2.6" ry="2.9" ${K}/><path d="M16 18.8l-1.5 2.7h3z" ${K}/><path d="M13 26.5v-3M16 26.5v-3M19 26.5v-3" stroke-width="1.6"/>`),
  army: S(`<path d="M10 29V6"/><path d="M10 3.5l-2.2 3.8h4.4z" ${K}/><path d="M10 8h16l-4.5 4.5L26 17H10z" ${R}/><path d="M6.5 29h7"/>`),
  frapper: S(`<path d="M27.5 4.5l-.3 3.7L13 22.4 9.6 19 23.8 4.8z" ${P}/><path d="M7.4 17.4l7.2 7.2M10.6 21.4l-4.6 4.6"/><circle cx="4.8" cy="27.2" r="1.8" ${K}/>`),
  marcher: S(`<path d="M6 16h19M19 9.5l6.8 6.5-6.8 6.5M6 16l-2.6-3.4M6 16l-2.6 3.4M9.4 16l-2.6-3.4M9.4 16l-2.6 3.4"/>`),
  lever: S(`<path d="M16 3.5l11 4V15c0 7-4.8 11.6-11 13.5C9.8 26.6 5 22 5 15V7.5z" ${P}/><path d="M16 10v11M10.5 15.5h11" style="stroke:var(--ia2)"/>`),
  intrigue: S(`<path d="M9.6 19h12.8l2.2 3.6a3.2 3.2 0 0 1-2.8 4.9H10.2a3.2 3.2 0 0 1-2.8-4.9z" ${R} stroke="none"/><path d="M12.5 3.5h7M14 3.5v8L7.4 22.6a3.2 3.2 0 0 0 2.8 4.9h11.6a3.2 3.2 0 0 0 2.8-4.9L18 11.5v-8"/>`),
  hidden: S(`<path d="M3 16s5-8 13-8 13 8 13 8-5 8-13 8S3 16 3 16z" ${P}/><circle cx="16" cy="16" r="3.5" ${K}/><path d="M6 27L26 5" style="stroke:var(--ia2)"/>`),
  province: S(`<path d="M5 28V13h4V8.5h3.5V13h7V8.5H23V13h4v15z" ${P}/><path d="M13.5 28v-5a2.5 2.5 0 0 1 5 0v5"/>`),
  family: S(`<circle cx="12" cy="10" r="4.2" ${P}/><circle cx="22.5" cy="12.5" r="3.2" ${P}/><path d="M3.5 28c0-5.2 3.6-8.4 8.5-8.4s8.5 3.2 8.5 8.4M19 28c0-4 1.6-6.6 3.5-6.6S28.5 23 28.5 28"/>`),
  scroll: S(`<path d="M8 5h15a3 3 0 0 1 3 3v16a3 3 0 0 1-3 3H10a3 3 0 0 1-3-3V8" ${P}/><path d="M11.5 11h10M11.5 16h10M11.5 21h6.5" stroke-width="1.8"/>`),
  risk: S(`<path d="M16 4l13 23H3z" ${P}/><path d="M16 12.5v7M16 23.2v.3" style="stroke:var(--ia2)" stroke-width="2.8"/>`),
  target: S(`<circle cx="16" cy="16" r="11.5"/><circle cx="16" cy="16" r="5.5"/><circle cx="16" cy="16" r="2" ${R} stroke="none"/>`),
  death: S(`<path d="M13.5 3.5h5v7H25v5h-6.5v13h-5v-13H7v-5h6.5z" ${K}/>`),
  ring: S(`<circle cx="12" cy="19" r="7"/><circle cx="20" cy="19" r="7"/><path d="M20 6.5l2.2-2.8 2.2 2.8-2.2 2.4z" ${R}/>`),
  plague: S(`<circle cx="16" cy="16" r="11.5" ${P}/><circle cx="12" cy="13" r="2.4" ${R} stroke="none"/><circle cx="19.5" cy="19.5" r="2.1" ${R} stroke="none"/><circle cx="20.5" cy="11.5" r="1.4" ${K}/><circle cx="12" cy="21.5" r="1.3" ${K}/>`),
};

// ---------- définitions (au toucher) ----------
export const GLOSSARY = {
  prestige: ["Prestige", "Ta gloire. C'est la base de ton score final. On en gagne en conquérant, en tenant des régions, en battant le favori ; on en perd en trahissant, en échouant une intrigue, ou par certains dilemmes."],
  or: ["Or", "Ton trésor. À chaque fin de manche : +1 or par province (+1 par mariage), puis tu paies la solde de tes troupes (1 or pour 5 armées). Sans or pour payer, des soldats désertent. L'or sert aussi à : engager des mercenaires (+2 armées quand tu lèves), relancer un dé (2 or), offrir une fête au peuple (3 or, −15 Colère), intriguer, acheter des voix au Conseil. À la fin, 10 or = 1 point."],
  conseil: ["Conseil du Roi", "Aux manches 3, 6 et 9, toutes les maisons votent en public sur une motion : un honneur (Connétable, Main du Roi, princesse de France) ou une punition (impôt, excommunication, tribunal). On ne vote jamais pour soi. Les votes sont affichés à tous : négociez !"],
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
  score: ["Score final", "Prestige + 3 par province + 3 par région complète + tes objectifs secrets réussis + 1 par membre vivant de ta famille + 1 par tranche de 10 or. Le plus haut score gagne. Tenir 15 provinces = victoire immédiate."],
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
// Les conséquences d'une option, en pastilles lisibles : ce que TU gagnes ou perds, ce que subit la maison visée,
// et les risques (« 60 % : … sinon : … »).
const KILL = {
  eldest: ["ton héritier meurt", "son héritier meurt"], son: ["ton fils aîné meurt", "son fils aîné meurt"], daughter: ["ta fille meurt", "sa fille meurt"],
  youngest: ["ton plus jeune enfant meurt", "son plus jeune enfant meurt"], random_child: ["un de tes enfants meurt", "un de ses enfants meurt"], bastard: ["ton bâtard meurt", "son bâtard meurt"],
  queen: ["ta reine meurt", "sa reine meurt"], king: ["ton souverain meurt", "son souverain meurt"],
};
export function effectChips(fx, who = 0) {
  const out = [];
  const c = (k, t) => out.push(`<span class="fxchip ${who ? "tgt" : k}">${t}</span>`);
  const T = (a, b) => (who ? b : a);
  for (const f of fx || []) {
    if (f.gold) c(f.gold > 0 ? "good" : "bad", `${ICON.gold}${sign(f.gold)} or`);
    if (f.prestige) c(f.prestige > 0 ? "good" : "bad", `${ICON.prestige}${sign(f.prestige)} prestige`);
    if (f.armies) c(f.armies > 0 ? "good" : "bad", `${ICON.army}${sign(f.armies)} armée${Math.abs(f.armies) > 1 ? "s" : ""}`);
    if (f.colere) c(f.colere > 0 ? "bad" : "good", `${ICON.colere}${sign(f.colere)} colère`);
    if (f.peur) c("neutral", `${ICON.peur}${sign(f.peur)} peur`);
    if (f.kill) c("bad", `${ICON.death}${(KILL[f.kill] || ["un mort dans ta famille", "un mort dans sa famille"])[who ? 1 : 0]}`);
    if (f.plague) c("bad", `${ICON.plague}peste`);
    if (f.nextDice) c(f.nextDice > 0 ? "good" : "bad", `${sign(f.nextDice)} dé à la prochaine manche`);
    if (f.intrigueBonus) c("good", `${ICON.intrigue}+${f.intrigueBonus} aux intrigues`);
    if (f.loseProvince) c("bad", `${ICON.province}${T("tu perds", "perd")} une province`);
    if (f.gainNeutral) c("good", `${ICON.province}+1 province`);
    if (f.steal) c("good", `${ICON.gold}+${f.steal} or pris à la maison visée`);
    if (f.treatyTarget || f.treatyPartner) c("good", `trêve de ${f.treatyTarget || f.treatyPartner || 3} manches`);
    if (f.marryTarget || f.marryPartner) c("good", `${ICON.ring}mariage = alliance`);
    if (f.epithet) c("neutral", `surnom « ${f.epithet} »`);
    if (f.addChild) c("good", `${ICON.family}+${f.addChild} enfant${f.addChild > 1 ? "s" : ""}${f.bastard ? " (bâtard)" : ""}`);
    if (f.addBastard) c("neutral", `${ICON.family}un bâtard reconnu`);
    if (f.addChildDoubt) c("neutral", `${ICON.family}un enfant… peut-être de toi`);
    if (f.newQueen) c("good", `${ICON.ring}nouvelle reine`);
    if (f.legitimize) c("neutral", "le bâtard entre dans la succession");
    if (f.disinherit) c("bad", "un héritier écarté");
    if (f.removePerson) c("bad", `${ICON.family}un enfant quitte la famille`);
    if (f.consanguin) c("risk", "enfants consanguins");
    if (f.seduceTarget) c("good", "un bâtard chez l'ennemi");
    if (f.spyObjectives) c("good", "tu découvres ses objectifs secrets");
    if (f.breakAlliance || f.breakAllAlliances) c("bad", "alliance rompue");
    if (f.betrayal) c("bad", "trahison (surnom « le Traître »)");
    if (f.murder) c("neutral", `${ICON.hidden}crime anonyme (on peut t'accuser)`);
    if (f.chain) c("neutral", `${ICON.scroll}une suite viendra plus tard`);
    if (f.health) c(f.health > 0 ? "bad" : "good", f.health > 0 ? T("ton souverain tombe malade", "son souverain tombe malade") : T("ton souverain guérit", "son souverain guérit"));
    if (f.others) c("neutral", "touche toutes les autres maisons");
    if (f.target) { const inner = effectChips(f.target, 1); if (inner.length) out.push(`<span class="fxgroup tgt">${ICON.target}<b>La maison visée :</b> ${inner.join("")}</span>`); }
    if (f.chance !== undefined) {
      const a = effectChips(f.then || [], who), b = effectChips(f.else || [], who);
      out.push(`<span class="fxgroup risk">${ICON.risk}<b>${Math.round(f.chance * 100)} % de chances :</b> ${a.join("") || "rien"}${b.length ? ` <b>· sinon :</b> ${b.join("")}` : " <b>· sinon :</b> rien ne se passe"}</span>`);
    }
  }
  return out;
}
export function chipsHtml(fx) {
  const c = effectChips(fx);
  if (!c.length) return `<span class="fxchip neutral">aucun effet immédiat</span>`;
  return c.join("");
}

// ---------- introduction en 5 cartes ----------
export const INTRO = [
  { title: "Le but", icon: ICON.prestige, text: "France, 1347. Tu diriges une grande maison noble. Après la dernière manche (<b>10</b>, ou 7 en partie courte), celui qui a le plus gros score gagne : <b>Prestige + 3 par province + régions + objectifs secrets + famille vivante + or</b>. Tenir 15 provinces fait gagner immédiatement." },
  { title: "Ta maison", icon: ICON.family, text: "Chaque maison a un <b>pouvoir</b> et une <b>faiblesse</b> (les Bâtisseurs défendent mieux, les Marchands gagnent plus d'or, les Ombres intriguent mieux, la Lignée sacrée gagne du Prestige). En haut de l'écran, le bandeau montre toutes les familles : souverain couronné, héritiers, mariages (⚭), morts (✝)." },
  { title: "Une manche", icon: ICON.scroll, text: "Chaque manche se déroule toujours pareil :<br><b>1. Les dilemmes</b> : deux décisions secrètes, une pour ta maison, une avec un rival.<br><b>2. Les ordres</b> : tu donnes un ordre à chacun de tes dés.<br><b>3. La révélation</b> : tout le monde voit les mêmes cartes en même temps (affaires des cours, batailles, trois ans qui passent, bilan). On passe à la suivante quand tous ont cliqué « Suivant » : le moment de commenter en vocal !<br>Aux manches 3, 6 et 9 : le <b>Conseil du Roi</b>, un vote public." },
  { title: "Tes jauges", icon: ICON.gold, text: `${ICON.prestige} <b>Prestige</b> : tes points de victoire.<br>${ICON.gold} <b>Or</b> : paie la solde des troupes (1 or pour 5 armées), les mercenaires, les relances de dés, les fêtes et les intrigues. 10 or = 1 point à la fin.<br>${ICON.colere} <b>Colère du peuple</b> : à 80, une province se révolte.<br>${ICON.peur} <b>Peur</b> : +1 en défense tous les 25 points, mais à 50 plus personne n'épouse tes enfants.<br>Tu les vois en haut à droite, sous ton score.` },
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
export const LEGEND = `<div class="legend-row"><svg width="26" height="26" viewBox="-13 -2 26 26"><path d="M-12,0 L12,0 L12,22 L0,16 L-12,22 Z" fill="#A3221A" stroke="#241811"/><text x="0" y="14" text-anchor="middle" font-size="12" fill="#fff" font-family="Cinzel" font-weight="700">5</text></svg><span>Bannière : le nombre d'armées, à la couleur du propriétaire</span></div>
<div class="legend-row"><svg width="30" height="30" viewBox="-17 -17 34 34"><circle r="17" fill="#241811"/><circle r="15.5" fill="#A9843A"/><circle r="13" fill="#A3221A" stroke="#241811"/><path d="M-8,7 V-3 h2.6 v-3 h2.6 v3 h1.5 V-8 h2.6 v2.4 h2.6 V-3 h1.5 v-3 h2.6 v3 h0 V7 h-6 v-4 a2,2 0 0 0 -4,0 v4 Z" fill="#F5EBD3" stroke="#241811" stroke-width="0.8"/></svg><span>Médaillon doré au château : la capitale d'une maison, posé sur sa ville</span></div>
<div class="legend-row"><svg width="26" height="26" viewBox="-12 -8 24 15"><path d="M-11,6 L-11,-4 L-5,1 L0,-7 L5,1 L11,-4 L11,6 Z" fill="#A9843A" stroke="#241811"/></svg><span>Couronne : le favori, le joueur en tête</span></div>
<div class="legend-row">${ICON.plague}<span>Points noirs : la peste</span></div>
<div class="legend-row"><span class="lg-sw" style="background:#D9C9A3"></span><span>Province beige : neutre, défendue par une milice</span></div>
<div class="legend-row"><span class="lg-sw" style="border:3px dashed #A9843A;background:transparent"></span><span>Contour doré clignotant : province sur laquelle tu peux cliquer</span></div>`;
