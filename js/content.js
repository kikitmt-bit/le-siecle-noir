// =====================================================================
//  LE SIÈCLE NOIR — contenu : maisons, noms, traits, dilemmes, objectifs
// =====================================================================

import { DIL_COUR } from "./dil_cour.js?v=1795342564";
import { DIL_GUERRE } from "./dil_guerre.js?v=1795342564";
import { DIL_PACTES } from "./dil_pactes.js?v=1795342564";
import { DIL_INTRIGUES } from "./dil_intrigues.js?v=1795342564";
import { DIL_FAMILLES } from "./dil_familles.js?v=1795342564";
import { DIL_SOMBRES } from "./dil_sombres.js?v=1795342564";

export const HOUSES = {
  valcourt: { name: "Valcourt", color: "#8E2A22", light: "#C0504A", charge: "tower", motto: "Le sang ne sèche jamais" },
  morlanges: { name: "Morlanges", color: "#2C4566", light: "#4F74A3", charge: "fish", motto: "Patience et poison" },
  ravenel: { name: "Ravenel", color: "#3B5A3A", light: "#5E8C63", charge: "key", motto: "Ce qui est pris est gardé" },
  aubrac: { name: "Aubrac", color: "#A07A2A", light: "#C99A3E", charge: "star", motto: "Dieu reconnaîtra les siens" },
  anglais: { name: "Angleterre", color: "#4A4F57", light: "#7D838C", charge: "lion", motto: "Dieu et mon droit", bot: true },
};
export const HUMAN_HOUSES = ["valcourt", "morlanges", "ravenel", "aubrac"];

// Chaque maison a un pouvoir et une faiblesse (affichés au choix du blason et dans la maison)
export const HOUSE_POWERS = {
  valcourt: { title: "Les Bâtisseurs", power: "+1 en défense dans toutes leurs provinces.", weak: "Entretenir les forteresses coûte cher : solde des troupes +1 or par manche.", def: 1, upkeep: 1 },
  morlanges: { title: "Les Marchands", power: "+1 or par province côtière à chaque manche. Mercenaires à 2 or.", weak: "Le peuple déteste les usuriers : +3 Colère par manche.", coastGold: 1, merc: 2, colere: 3 },
  ravenel: { title: "Les Ombres", power: "+1 de chance à toutes leurs intrigues, qui coûtent 1 or de moins.", weak: "Personne ne leur fait confiance : leurs mariages ne rapportent aucun or.", intr: 1, intrCost: -1, noAllyGold: true },
  aubrac: { title: "La Lignée sacrée", power: "+1 Prestige à chaque manche tant que leur Colère reste sous 50 (l'Église les bénit).", weak: "La dîme : −2 or de revenu par manche.", prestige: 1, prestigeIfCalm: true, gold: -2 },
};

// Le Conseil du Roi : un vote public toutes les 3 manches. On ne vote jamais pour soi.
export const COUNCIL = [
  { id: "connetable", good: true, title: "Le Connétable de France", text: "Le roi de France doit nommer un Connétable pour commander ses armées. Le Conseil vote : quelle maison recevra l'épée ?", effect: "La maison élue reçoit +3 armées dans sa capitale et +2 Prestige." },
  { id: "impot", good: false, title: "L'impôt de guerre", text: "La guerre contre l'Anglais coûte cher. Le Conseil doit désigner la maison qui paiera l'impôt.", effect: "La maison désignée paie 8 or (ou tout ce qu'elle a), partagés entre les autres maisons." },
  { id: "excommunication", good: false, title: "L'excommunication", text: "Le légat du pape demande au Conseil quelle maison mérite d'être chassée de l'Église.", effect: "La maison désignée prend +20 Colère et perd 3 Prestige." },
  { id: "main", good: true, title: "La Main du Roi", text: "Le vieux roi de France, gâteux, veut une Main pour gouverner à sa place. Qui murmurera à son oreille ?", effect: "La maison élue lance 1 dé de plus à la prochaine manche et gagne +2 Prestige." },
  { id: "bouc", good: false, title: "Le bouc émissaire", text: "La peste ravage le royaume. Le peuple réclame un coupable. Le Conseil doit en livrer un.", effect: "La maison désignée perd 3 armées dans sa capitale, prend +10 Colère, et la peste frappe sa capitale." },
  { id: "princesse", good: true, title: "La princesse de France", text: "La fille du roi de France, laide mais richement dotée, doit être mariée. À quelle maison la donner ?", effect: "La maison élue gagne +4 Prestige et +6 or de dot." },
  { id: "tribunal", good: false, title: "Le tribunal des pairs", text: "Les pairs du royaume veulent juger une maison pour ses crimes. Personne n'est innocent. Qui sera condamné ?", effect: "La maison désignée perd 4 Prestige et une province (hors capitale) se soulève et devient neutre." },
];

export const NAMES = {
  m: ["Philippe", "Louis", "Jean", "Charles", "Gautier", "Enguerrand", "Thibaut", "Raoul", "Hugues", "Bertrand", "Guy", "Amaury", "Robert", "Godefroy", "Aymeric", "Baudouin", "Foulques", "Tancrède", "Arnaud", "Geoffroy", "Henri", "Mathieu", "Pierre", "Olivier"],
  f: ["Isabeau", "Jeanne", "Blanche", "Marguerite", "Aliénor", "Mahaut", "Béatrice", "Constance", "Yolande", "Agnès", "Clémence", "Ermengarde", "Pernelle", "Sibylle", "Alix", "Bonne", "Catherine", "Héloïse"],
  en_m: ["Édouard", "Henry", "Richard", "Thomas", "Lionel", "Gilbert"],
  en_f: ["Philippa", "Maud", "Eleanor", "Joan"],
};

// Infirmités et surnoms de naissance (purement pour la moquerie d'époque)
export const INFIRMITIES = {
  m: ["le Boiteux", "le Bègue", "le Bossu", "le Gros", "le Borgne", "le Chauve", "le Goitreux", "le Pied-Bot", "l'Édenté", "le Bigleux", "le Baveux", "le Nain"],
  f: ["la Boiteuse", "la Bègue", "la Bossue", "la Grosse", "la Borgne", "la Grêlée", "la Moustachue", "l'Édentée", "la Bigleuse", "la Naine"],
};

// Traits à effet (comptent surtout quand le personnage est roi)
export const TRAITS = {
  "Rusé": { good: true, desc: "+1 aux intrigues" },
  "Brillant stratège": { good: true, desc: "+1 en attaque" },
  "Sanguinaire": { good: true, desc: "+1 en attaque, +5 Peur par manche" },
  "Pieux": { good: true, desc: "−3 Colère par manche" },
  "Séduisant": { good: true, desc: "+1 en séduction" },
  "Robuste": { good: true, desc: "Vieillit mieux" },
  "Paranoïaque": { good: true, desc: "Les poisons contre lui exigent un 6" },
  "Simple d'esprit": { good: false, desc: "Roi : un dé de moins" },
  "Lâche": { good: false, desc: "−1 en attaque" },
  "Fragile": { good: false, desc: "Santé précaire" },
  "Débauché": { good: false, desc: "−1 or par manche" },
  "Cruel": { good: false, desc: "+5 Colère et +5 Peur par manche" },
};
export const TRAIT_POOL = ["Rusé", "Rusé", "Brillant stratège", "Sanguinaire", "Pieux", "Séduisant", "Robuste", "Robuste", "Paranoïaque", "Simple d'esprit", "Lâche", "Fragile", "Fragile", "Débauché", "Cruel"];

export const HEALTH = ["Vigoureux", "Bonne santé", "Fragile", "Malade", "Mourant"];
export const DEATH_CHANCE = [0.01, 0.03, 0.09, 0.22, 0.5];

// ---------------------------------------------------------------------
// DILEMMES
//  type: "solo" | "target" (le joueur choisit une maison rivale) | "pact" (deux joueurs, choix simultanés)
//  Placeholders texte : {roi} {maison} {cap} {prov} {heritier} {fille} {batard} {reine} {partenaire} {cible} {leader}
//  fx : liste d'effets, voir engine.applyFx
// ---------------------------------------------------------------------
export const DILEMMAS = [
  // ============================ SOLO ============================
  { id: "peste_cap", type: "solo", title: "La peste aux portes de {cap}", text: "Les premiers malades sont tombés dans le quartier des tanneurs. Douze mille âmes vivent derrière ces murs. Ton intendant attend tes ordres, et la nouvelle se répandra avant le soir.",
    options: [
      { label: "Murer les portes", hint: "La ville meurt de l'intérieur. La peste ne passe pas.", fx: [{ armies: -3, where: "capital" }, { peur: 20 }], chron: "{roi} fit murer les portes de {cap}. Pendant trois semaines, on entendit frapper de l'autre côté." },
      { label: "Laisser fuir les habitants", hint: "La ville survit… la peste gagne les provinces voisines, amies comme ennemies.", fx: [{ colere: -10 }, { plague: "around_capital" }], chron: "Les gens de {cap} s'enfuirent par milliers, et la peste voyagea avec eux." },
      { label: "Brûler le quartier des tanneurs", hint: "Avec ceux qui s'y trouvent encore.", fx: [{ peur: 30 }, { colere: 15 }, { gold: -3 }, { epithet: "le Boucher" }], chron: "Le quartier des tanneurs de {cap} brûla une nuit entière. {roi} regarda depuis les remparts." },
    ] },
  { id: "famine", type: "solo", title: "L'hiver de la faim", text: "Les greniers sont vides et il reste quatre mois avant les récoltes. L'armée réclame sa ration, les paysans mangent l'écorce des arbres.",
    options: [
      { label: "Réquisitionner le grain des paysans", hint: "L'armée mange. Le peuple, lui…", fx: [{ colere: 25 }, { armies: 2, where: "capital" }], chron: "Les soldats de {maison} vidèrent les greniers des villages. Au printemps, on enterra les enfants par rangées." },
      { label: "Manger les chevaux de la cavalerie", hint: "Le peuple tient. L'armée s'affaiblit.", fx: [{ armies: -3, where: "capital" }, { colere: -5 }], chron: "À {cap}, on mangea les destriers du roi. La chevalerie de {maison} combattit à pied cette année-là." },
      { label: "Piller les greniers de l'Église", hint: "Les évêques n'oublieront pas.", fx: [{ colere: -15 }, { prestige: -3 }], chron: "{roi} fit forcer les greniers des abbayes. L'évêque le maudit en chaire, la bouche pleine de pain." },
    ] },
  { id: "heritier_tare", type: "solo", req: "eldestBad", title: "Le problème {heritier}", text: "Ton héritier, {heritier}, est {heritier_trait}. Les barons rient sous cape aux banquets. S'il monte sur le trône, ils ne riront plus : ils te dévoreront.",
    options: [
      { label: "Le garder comme héritier", hint: "La loi est la loi.", fx: [{ colere: 5 }], chron: "{roi} refusa d'écarter {heritier}. Les barons commencèrent à compter les jours." },
      { label: "L'envoyer au monastère", hint: "Il priera pour nous. Loin.", fx: [{ disinherit: "eldest" }, { prestige: -1 }], chron: "{heritier} fut tonsuré à l'aube et conduit au monastère. Il pleura tout le chemin." },
      { label: "Un accident de chasse", hint: "Les bois sont dangereux en automne.", fx: [{ kill: "eldest", cause: "un accident de chasse" }, { peur: 10 }, { chance: 0.35, then: [{ prestige: -4 }, { epithet: "le Parricide" }], thenChron: "Mais un veneur avait tout vu, et parla." }], chron: "{heritier} mourut dans les bois de {cap}, une flèche dans le dos. On parla d'un braconnier." },
    ] },
  { id: "lepreux", type: "solo", title: "La léproserie", text: "Les lépreux de la léproserie de {cap} mangent la soupe des pauvres et les bourgeois s'en plaignent. Ils sont soixante.",
    options: [
      { label: "Les chasser dans les bois", hint: "Que Dieu s'occupe d'eux.", fx: [{ gold: 2 }, { peur: 10 }], chron: "Les lépreux de {cap} furent chassés à coups de bâton. On entendit leurs crécelles dans la forêt tout l'hiver." },
      { label: "Les nourrir à tes frais", hint: "Charité coûteuse, mais l'Église approuve.", fx: [{ gold: -3 }, { prestige: 2 }, { colere: -5 }], chron: "{roi} nourrit les lépreux de sa main. Les évêques l'appelèrent « le Charitable ». Les bourgeois, autrement." },
      { label: "Brûler la léproserie", hint: "Portes fermées.", fx: [{ peur: 25 }, { colere: 10 }, { epithet: "le Cruel" }], chron: "La léproserie de {cap} brûla, portes clouées. Il n'y eut plus jamais de lépreux à {cap}." },
    ] },
  { id: "heresie", type: "solo", title: "Le village hérétique", text: "Un prêcheur jure que le village de Montsauve, {prov_en}, adore le diable et refuse la dîme. L'évêque attend ta réponse.",
    options: [
      { label: "Brûler le village", hint: "L'Église sera satisfaite.", fx: [{ peur: 15 }, { prestige: 2 }, { colere: 10 }], chron: "Montsauve fut brûlé avec ses habitants. Le prêcheur bénit les cendres." },
      { label: "Refuser", hint: "Risque d'excommunication.", fx: [{ prestige: -2 }, { chance: 0.35, then: [{ colere: 20 }, { prestige: -3 }], thenChron: "Le pape excommunia {roi}. Les cloches se turent dans tout le royaume." }], chron: "{roi} chassa le prêcheur de sa cour." },
      { label: "Imposer une amende au village", hint: "Le diable paie bien.", fx: [{ gold: 3 }, { colere: 5 }], chron: "Montsauve paya pour ses péchés supposés, en argent sonnant." },
    ] },
  { id: "sorciere", type: "solo", title: "La sage-femme", text: "On accuse une sage-femme d'avoir empoisonné les puits de {cap}. Elle connaît les herbes. Toutes les herbes.",
    options: [
      { label: "Le bûcher", hint: "Le peuple veut voir brûler quelqu'un.", fx: [{ colere: -10 }, { peur: 5 }], chron: "La sage-femme brûla sur la grand-place de {cap}. Les puits restèrent empoisonnés." },
      { label: "La prendre à ton service", hint: "Ses poisons serviront… contre les autres.", fx: [{ gold: -2 }, { intrigueBonus: 2 }, { colere: 10 }], chron: "La sorcière de {cap} entra discrètement au service de {maison}." },
      { label: "Lui confier la santé du roi", hint: "Peut-être un remède. Peut-être pas.", fx: [{ chance: 0.6, then: [{ health: -1 }], thenChron: "Ses décoctions remirent {roi} sur pied.", else: [{ health: 2 }], elseChron: "Le roi vomit trois jours entiers. On pendit la sorcière, un peu tard." }], chron: "La sage-femme fut conduite au chevet du roi." },
    ] },
  { id: "mines", type: "solo", title: "Les mines d'argent", text: "Les galeries des mines d'argent sont trop étroites pour les hommes. Le contremaître suggère d'y envoyer les orphelins de la peste.",
    options: [
      { label: "Envoyer les orphelins", hint: "Beaucoup d'argent. Beaucoup de petites tombes.", fx: [{ gold: 7 }, { colere: 10 }, { prestige: -2 }], chron: "Les orphelins de {maison} descendirent dans les mines. L'argent remonta, eux beaucoup moins." },
      { label: "Envoyer les prisonniers", hint: "Ils sont moins agiles.", fx: [{ gold: 3 }], chron: "Les prisonniers de {cap} creusèrent jusqu'à en mourir, comme prévu." },
      { label: "Fermer la mine", hint: "Le trésor en souffrira.", fx: [{ gold: -2 }, { colere: -5 }], chron: "{roi} fit fermer les mines. Les orphelins mendièrent à la place." },
    ] },
  { id: "croisade_enfants", type: "solo", title: "La croisade des enfants", text: "Un berger de douze ans prétend que Dieu lui parle. Il veut conduire deux mille enfants de {cap} jusqu'à Jérusalem. À pied.",
    options: [
      { label: "Les laisser partir", hint: "Dieu y pourvoira. Ou les marchands d'esclaves.", fx: [{ colere: -10 }, { prestige: 1 }, { chance: 0.6, then: [{ colere: 15 }], thenChron: "Aucun ne revint. Les mères de {cap} maudirent le roi." }], chron: "Deux mille enfants quittèrent {cap} en chantant." },
      { label: "Faire pendre le berger", hint: "Dieu ne parle qu'au roi.", fx: [{ peur: 10 }, { prestige: -2 }], chron: "Le berger qui parlait à Dieu fut pendu à {cap}. Dieu ne dit rien." },
      { label: "Enrôler les plus grands", hint: "Des soldats qui ne coûtent rien.", fx: [{ armies: 3, where: "capital" }, { colere: 15 }], chron: "{roi} fit des pages de douze ans des soldats. Ils apprirent vite à mourir." },
    ] },
  { id: "dime", type: "solo", title: "Le légat du pape", text: "Le légat du pape exige la dîme de croisade : un dixième de ton trésor. Il est arrivé avec une petite escorte et un gros appétit.",
    options: [
      { label: "Payer", hint: "Le ciel te le rendra.", fx: [{ gold: -5 }, { prestige: 3 }], chron: "{maison} paya la dîme. Le légat repartit plus lourd qu'il n'était venu." },
      { label: "Refuser", hint: "Rome a la rancune longue.", fx: [{ prestige: -3 }, { colere: -5 }], chron: "{roi} renvoya le légat les mains vides. Le peuple applaudit, le pape beaucoup moins." },
      { label: "Le légat fera une mauvaise chute", hint: "Les escaliers du château sont raides.", fx: [{ chance: 0.5, then: [{ peur: 10 }, { gold: 3 }], thenChron: "Le légat se brisa la nuque dans l'escalier. On garda son coffre.", else: [{ prestige: -6 }, { epithet: "le Maudit" }], elseChron: "Le légat survécut, et raconta tout au pape." }], chron: "Un soir, le légat emprunta l'escalier de la tour." },
    ] },
  { id: "routiers", type: "target", title: "La Grande Compagnie", text: "Une compagnie de routiers, des mercenaires sans maître, campe sous les murs de {cap}. Leur capitaine offre ses services. Ou ses pillages.",
    options: [
      { label: "Les engager", hint: "5 or pour 5 armées.", fx: [{ gold: -5 }, { armies: 5, where: "capital" }], chron: "{roi} engagea la Grande Compagnie. Elle coûta cher et sentait mauvais." },
      { label: "Les envoyer piller une maison rivale", hint: "Choisis la victime.", needsTarget: true, fx: [{ gold: -3 }, { target: [{ armies: -3, where: "strongest" }, { colere: 10 }] }], chron: "Payés par {maison}, les routiers ravagèrent les terres de {cible}." },
      { label: "Refuser", hint: "Ils risquent de se servir eux-mêmes.", fx: [{ chance: 0.5, then: [{ colere: 10 }, { armies: -2, where: "random" }], thenChron: "Vexés, les routiers pillèrent les villages de {maison}." }], chron: "{roi} ferma les portes aux routiers." },
    ] },
  { id: "vieux_duc", type: "solo", req: "adultDaughter", title: "Le vieux duc de Brabant", text: "Le duc de Brabant, soixante-huit ans, veut épouser {fille}. Il a enterré trois épouses. Il paie en or massif.",
    options: [
      { label: "Accepter", hint: "8 or. {fille} quitte la famille.", fx: [{ gold: 8 }, { removePerson: "daughter", cause: "mariée au duc de Brabant" }], chron: "{fille} fut mariée au vieux duc de Brabant. Elle ne sourit pas sur le parvis." },
      { label: "Refuser", hint: "Le duc s'en souviendra.", fx: [{ prestige: -1 }], chron: "{roi} refusa {fille} au duc de Brabant." },
      { label: "Accepter, puis faire assassiner le duc", hint: "L'or ET la fille. Si ça marche.", fx: [{ chance: 0.5, then: [{ gold: 8 }, { peur: 10 }], thenChron: "Le duc mourut pendant la nuit de noces. {fille} rentra veuve, et riche.", else: [{ prestige: -5 }, { removePerson: "daughter", cause: "enfermée en Brabant" }], elseChron: "L'assassin fut pris. Le duc garda {fille} et l'enferma dans une tour." }], chron: "{fille} partit pour le Brabant avec un coffre de noces… et un serviteur discret." },
    ] },
  { id: "roi_malade", type: "solo", req: "kingSick", title: "Le roi crache du sang", text: "{roi} crache du sang au réveil. Les médecins proposent des saignées. Le confesseur propose l'extrême-onction.",
    options: [
      { label: "Les saignées", hint: "La médecine la plus moderne.", fx: [{ chance: 0.5, then: [{ health: -1 }], thenChron: "Les saignées réussirent. Le roi se releva, blême mais vivant.", else: [{ health: 2 }], elseChron: "On saigna le roi jusqu'à ce qu'il soit blanc comme un drap." }], chron: "Les médecins saignèrent {roi} matin et soir." },
      { label: "Pèlerinage à Saint-Jacques", hint: "Coûteux, lent, saint.", fx: [{ gold: -4 }, { health: -1 }, { prestige: 1 }], chron: "{roi} partit en pèlerinage, pieds nus sur les chemins de Compostelle." },
      { label: "Préparer la succession en secret", hint: "Rien n'est éternel.", fx: [{ prestige: 1 }, { colere: -5 }], chron: "Pendant que {roi} toussait, ses conseillers préparaient déjà le sacre de son fils." },
    ] },
  { id: "servante", type: "solo", title: "La servante", text: "Une servante des cuisines porte l'enfant de {roi}. Elle n'a pas su se taire, et toute la cour est au courant. La reine aussi.",
    options: [
      { label: "La chasser", hint: "Qu'elle accouche ailleurs.", fx: [{ colere: 5 }], chron: "La servante fut jetée hors de {cap}, enceinte et sans un sou." },
      { label: "Reconnaître le bâtard", hint: "Un fils de plus, même de la main gauche.", fx: [{ addBastard: true }, { prestige: -1 }], chron: "{roi} reconnut le bâtard de la servante. La reine ne lui adressa plus la parole." },
      { label: "La faire disparaître", hint: "La Seine est profonde.", fx: [{ peur: 10 }, { colere: 5 }], chron: "On repêcha la servante trois jours plus tard. Personne ne posa de questions." },
    ] },
  { id: "legitimer", type: "solo", req: "ownBastard", title: "Le bâtard brillant", text: "{batard}, le bâtard du roi, commande mieux que tous tes fils légitimes réunis. Les soldats l'adorent. Les héritiers le haïssent.",
    options: [
      { label: "Le légitimer", hint: "Il entre dans la succession. Tes fils enragent.", fx: [{ legitimize: true }, { colere: 5 }, { prestige: -2 }], chron: "{roi} légitima {batard} devant toute la cour. Les autres héritiers sortirent sans un mot." },
      { label: "Le faire chevalier", hint: "Il reste bâtard, mais il amène ses hommes.", fx: [{ armies: 3, where: "capital" }], chron: "{batard} fut armé chevalier et jura fidélité. Pour l'instant." },
      { label: "L'éliminer", hint: "Un bâtard ambitieux est une guerre civile qui attend.", fx: [{ kill: "bastard", cause: "étranglé dans son lit" }, { peur: 10 }], chron: "{batard} fut retrouvé étranglé dans son lit. Le roi ne pleura pas." },
    ] },
  { id: "jacquerie", type: "solo", title: "Les Jacques {prov_de}", text: "Les paysans {prov_de} se sont armés de fourches et ont pendu leur seigneur à son propre portail. Ils marchent sur les châteaux voisins.",
    options: [
      { label: "Les massacrer", hint: "L'exemple qu'on raconte pendant cent ans.", fx: [{ peur: 25 }, { colere: -15 }, { armies: -2, where: "capital" }], chron: "Les Jacques {prov_de} furent massacrés. On pendit les survivants aux arbres de la route." },
      { label: "Négocier", hint: "Ça coûte cher et ça donne des idées.", fx: [{ gold: -4 }, { colere: -15 }], chron: "{roi} négocia avec les Jacques. Les autres seigneurs parlèrent de faiblesse." },
      { label: "Les laisser faire", hint: "La province risque de tomber.", fx: [{ chance: 0.5, then: [{ loseProvince: "named" }], thenChron: "Les Jacques prirent {prov}." }], chron: "{roi} détourna les yeux." },
    ] },
  { id: "tournoi", type: "solo", title: "Le grand tournoi", text: "Les barons réclament un tournoi pour montrer leur bravoure. {heritier} veut absolument jouter.",
    options: [
      { label: "Organiser le tournoi, laisser {heritier} jouter", hint: "Prestige… et lances qui cassent.", fx: [{ gold: -3 }, { prestige: 3 }, { chance: 0.25, then: [{ kill: "eldest", cause: "une lance dans l'œil au tournoi" }], thenChron: "{heritier} prit une lance dans l'œil. Les trompettes jouèrent quand même." }], chron: "Le tournoi de {cap} dura trois jours." },
      { label: "Organiser le tournoi sans {heritier}", hint: "Moins de gloire, moins de risques.", fx: [{ gold: -3 }, { prestige: 1 }], chron: "{heritier} bouda dans les tribunes pendant que d'autres gagnaient sa gloire." },
      { label: "Pas de tournoi", hint: "Les barons s'ennuieront… et comploteront.", fx: [{ colere: 5 }], chron: "Il n'y eut pas de tournoi à {cap}. Les barons trouvèrent d'autres distractions." },
    ] },
  { id: "dysenterie", type: "solo", title: "La dysenterie au camp", text: "La dysenterie ravage ton armée. Les malades se vident dans les tentes. Bientôt il n'y aura plus de bien-portants.",
    options: [
      { label: "Abandonner les malades", hint: "On marche sans eux.", fx: [{ armies: -2, where: "capital" }, { peur: 5 }], chron: "L'armée de {maison} leva le camp en laissant ses malades dans la boue." },
      { label: "Les soigner", hint: "Coûteux.", fx: [{ gold: -3 }], chron: "{roi} paya des médecins. La moitié des malades survécut." },
      { label: "Les renvoyer chez eux", hint: "La maladie voyagera avec eux.", fx: [{ armies: -1, where: "capital" }, { plague: "random_own" }], chron: "Les malades rentrèrent dans leurs villages. Avec la maladie." },
    ] },
  { id: "impot", type: "solo", title: "L'impôt de guerre", text: "Le trésor sonne creux. Ton chambellan propose un nouvel impôt sur le sel, le pain et les fenêtres.",
    options: [
      { label: "Impôt écrasant", hint: "+8 or. Le peuple te haïra.", fx: [{ gold: 8 }, { colere: 20 }], chron: "{maison} leva l'impôt le plus lourd de mémoire d'homme. Les collecteurs voyagèrent avec des gardes." },
      { label: "Impôt modéré", hint: "+3 or.", fx: [{ gold: 3 }, { colere: 5 }], chron: "Un nouvel impôt fut levé. On râla, comme toujours." },
      { label: "Taxer l'Église", hint: "+5 or. Rome n'aime pas ça.", fx: [{ gold: 5 }, { prestige: -3 }], chron: "{roi} taxa les monastères. Les moines prièrent pour sa mort." },
    ] },
  { id: "otage_baron", type: "solo", title: "Le fils du baron rebelle", text: "Le fils du baron de Coucy, rebelle, est enfermé dans tes cachots. Il a quatorze ans. Son père a pendu tes collecteurs d'impôts.",
    options: [
      { label: "L'exécuter devant les remparts du baron", hint: "Le baron comprendra le message.", fx: [{ peur: 20 }, { epithet: "le Cruel" }], chron: "Le fils du baron de Coucy fut décapité sous les yeux de son père. Le baron se soumit, et ne pardonna jamais." },
      { label: "L'échanger contre rançon", hint: "+4 or.", fx: [{ gold: 4 }], chron: "Le baron de Coucy racheta son fils au prix fort." },
      { label: "L'élever comme ton propre fils", hint: "Le baron devient ton allié.", fx: [{ prestige: 2 }, { armies: 2, where: "capital" }], chron: "{roi} éleva le fils du baron comme le sien. Les hommes de Coucy rejoignirent {maison}." },
    ] },
  { id: "miracle", type: "solo", title: "Le miracle de {cap}", text: "Une fillette affirme avoir vu la Vierge pleurer du sang dans l'église de {cap}. Les pèlerins affluent déjà.",
    options: [
      { label: "Proclamer le miracle", hint: "Prestige et ferveur.", fx: [{ prestige: 3 }, { colere: -10 }, { gold: -2 }], chron: "Le miracle de {cap} fut proclamé. La fillette ne quitta plus jamais l'église." },
      { label: "Dénoncer la supercherie", hint: "La fillette ira au couvent… ou au pilori.", fx: [{ peur: 5 }, { colere: 5 }], chron: "{roi} dénonça le faux miracle. La foule lapida la fillette." },
      { label: "Vendre des fioles de larmes saintes", hint: "+5 or. Dieu fermera les yeux ?", fx: [{ gold: 5 }, { prestige: -1 }], chron: "On vendit à {cap} des fioles de larmes de la Vierge. Elles avaient un goût de vin rouge." },
    ] },
  { id: "reine_ecuyer", type: "solo", req: "queenAlive", title: "La reine et l'écuyer", text: "On murmure que {reine} reçoit un jeune écuyer dans ses appartements, la nuit. Les gardes ricanent dans ton dos.",
    options: [
      { label: "Faire disparaître l'écuyer", hint: "Discrètement.", fx: [{ peur: 5 }], chron: "Le jeune écuyer de la reine disparut. On retrouva son cheval, pas lui." },
      { label: "Faire étrangler la reine", hint: "Plus de reine, plus d'enfants. Mais plus de rires.", fx: [{ kill: "queen", cause: "étranglée sur ordre du roi" }, { peur: 25 }, { epithet: "l'Étrangleur" }], chron: "{reine} fut étranglée avec ses propres cheveux. La cour cessa de ricaner." },
      { label: "Fermer les yeux", hint: "Le prochain enfant sera-t-il de toi ?", fx: [{ prestige: -2 }, { addChildDoubt: true }], chron: "{roi} fit semblant de ne rien savoir. Neuf mois plus tard naquit un enfant aux cheveux de l'écuyer." },
    ] },
  { id: "bouc_emissaire", type: "target", title: "Il faut un coupable", text: "La récolte a pourri sur pied. Le peuple de {cap} gronde et veut un coupable. N'importe lequel.",
    options: [
      { label: "Pendre ton intendant", hint: "Il était honnête. Tant pis.", fx: [{ colere: -15 }, { gold: -2 }], chron: "L'intendant de {maison} fut pendu pour la mauvaise récolte. Il était innocent." },
      { label: "Accuser une maison rivale de sorcellerie", hint: "Choisis la maison à salir.", needsTarget: true, fx: [{ colere: -10 }, { target: [{ prestige: -3 }, { colere: 10 }] }], chron: "Les prêcheurs de {maison} accusèrent {cible} d'avoir ensorcelé les blés." },
      { label: "Ne rien faire", hint: "Ça passera. Peut-être.", fx: [{ colere: 15 }], chron: "{roi} ne fit rien. La colère couva comme braise." },
    ] },
  { id: "loups", type: "solo", title: "Les loups {prov_de}", text: "Les loups sortent des forêts {prov_de} et emportent les enfants des villages. On a retrouvé une main dans un berceau.",
    options: [
      { label: "Une battue avec l'armée", hint: "Des soldats perdus dans les bois.", fx: [{ armies: -1, where: "capital" }, { colere: -10 }], chron: "L'armée de {maison} chassa les loups {prov_de}. Elle en revint plus petite." },
      { label: "Une prime aux chasseurs", hint: "−2 or.", fx: [{ gold: -2 }, { colere: -5 }], chron: "On paya les têtes de loup au poids d'argent. Certains présentèrent des têtes de chien." },
      { label: "Ignorer", hint: "Les paysans font trop d'enfants de toute façon.", fx: [{ colere: 12 }], chron: "Les loups {prov_de} mangèrent bien cet hiver-là." },
    ] },
  { id: "tresor", type: "solo", title: "Le trésor de l'abbaye", text: "En creusant une tombe, des moines ont trouvé un trésor d'or wisigoth sous leur abbaye.",
    options: [
      { label: "Le confisquer", hint: "+7 or.", fx: [{ gold: 7 }, { prestige: -3 }], chron: "{roi} confisqua l'or des moines. L'abbé mourut de chagrin, ou d'autre chose." },
      { label: "Le laisser aux moines", hint: "Prestige.", fx: [{ prestige: 3 }], chron: "{roi} laissa le trésor à l'abbaye. On chanta ses louanges dans tout le royaume." },
      { label: "Partager", hint: "+3 or, le peuple est content.", fx: [{ gold: 3 }, { colere: -5 }], chron: "L'or wisigoth fut partagé. Pour une fois, tout le monde fut content." },
    ] },
  { id: "consanguin", type: "solo", req: "hasChild", title: "La cousine", text: "Pour garder les terres dans la famille, ton chapelain propose de marier {heritier} à sa propre cousine germaine. « Le pape accordera la dispense, contre une petite somme. »",
    options: [
      { label: "Marier les cousins", hint: "Prestige. Les enfants auront… des particularités.", fx: [{ prestige: 2 }, { gold: -2 }, { consanguin: true }], chron: "{heritier} épousa sa cousine. Leurs enfants auraient le menton des Habsbourg avant l'heure." },
      { label: "Refuser", hint: "Rien ne se passe.", fx: [], chron: "{roi} refusa le mariage entre cousins." },
    ] },
  { id: "voleur", type: "solo", title: "Le voleur de pain", text: "Un gamin de douze ans a volé un pain sur l'étal du boulanger de {cap}. La foule attend la justice du roi.",
    options: [
      { label: "Le pendre", hint: "La loi est la loi.", fx: [{ peur: 10 }, { colere: 3 }], chron: "Le petit voleur de pain fut pendu à {cap}. Il ne pesait presque rien au bout de la corde." },
      { label: "Lui couper la main", hint: "Il vivra. Différemment.", fx: [{ peur: 5 }], chron: "On coupa la main du petit voleur. Il mendia de l'autre." },
      { label: "Le gracier", hint: "Le peuple apprécie.", fx: [{ colere: -5 }, { peur: -5 }], chron: "{roi} gracia le voleur de pain. On dit que le roi avait un cœur." },
    ] },
  { id: "charlatan", type: "solo", req: "kingSick", title: "L'or potable", text: "Un alchimiste vénitien promet de guérir {roi} en lui faisant boire de l'or dissous. Il demande beaucoup d'or. À dissoudre.",
    options: [
      { label: "Essayer", hint: "−3 or. Pile ou face.", fx: [{ gold: -3 }, { chance: 0.5, then: [{ health: -2 }], thenChron: "Miracle : le roi se releva, rajeuni.", else: [{ health: 1 }], elseChron: "Le roi passa deux jours à rendre de l'or. L'alchimiste avait déjà filé." }], chron: "{roi} but l'or de l'alchimiste." },
      { label: "Pendre l'alchimiste", hint: "Les charlatans au gibet.", fx: [{ peur: 5 }], chron: "L'alchimiste vénitien fut pendu avec ses fioles autour du cou." },
    ] },
  { id: "cannibales", type: "solo", title: "Ce qu'on mange {prov_en}", text: "Dans un village {prov_de} affamé, on a découvert que les habitants mangeaient leurs morts. Puis plus seulement leurs morts.",
    options: [
      { label: "Raser le village", hint: "Personne ne doit savoir.", fx: [{ peur: 15 }, { armies: -1, where: "capital" }], chron: "Le village fut rasé et son nom effacé des registres." },
      { label: "Envoyer du grain", hint: "−4 or. La faim est la vraie coupable.", fx: [{ gold: -4 }, { colere: -10 }, { prestige: 1 }], chron: "{roi} envoya du grain au village maudit. On le bénit, la bouche pleine." },
      { label: "Fermer les yeux", hint: "Tant qu'ils ne mangent pas tes soldats.", fx: [{ colere: 5 }, { prestige: -1 }], chron: "En {prov}, on continua de manger ce qu'on trouvait." },
    ] },
  { id: "bourreau", type: "solo", title: "Le bourreau malade", text: "Le bourreau de {cap} a la peste. Quarante condamnés attendent leur exécution. Les cachots débordent.",
    options: [
      { label: "Les exécuter tous à la fois", hint: "Une grande pendaison collective.", fx: [{ peur: 20 }, { colere: 5 }], chron: "Quarante pendus en un jour à {cap}. Les corbeaux vinrent de trois provinces." },
      { label: "Les enrôler", hint: "Des soldats sans honneur, mais des soldats.", fx: [{ armies: 3, where: "capital" }, { colere: 10 }], chron: "Les condamnés de {cap} devinrent soldats de {maison}. Beaucoup désertèrent dès la première nuit." },
      { label: "Les gracier", hint: "Le peuple aime les grâces royales.", fx: [{ colere: -10 }, { peur: -10 }], chron: "{roi} gracia quarante criminels. Les vols doublèrent." },
    ] },

  // ============================ CIBLE ============================
  { id: "lettre", type: "target", title: "La fausse lettre", text: "Ton chancelier excelle à imiter les écritures. Il pourrait forger une lettre prouvant qu'une maison rivale complote avec les Anglais.",
    options: [
      { label: "Accuser une maison de trahison", hint: "Choisis la cible.", needsTarget: true, fx: [{ peur: 5 }, { target: [{ prestige: -4 }, { colere: 10 }] }], chron: "Une lettre accusant {cible} de comploter avec l'Anglais circula dans toutes les cours." },
      { label: "Brûler la lettre", hint: "L'honneur avant tout.", fx: [{ prestige: 1 }], chron: "{roi} jeta la fausse lettre au feu." },
    ] },
  { id: "cadavres", type: "target", title: "Les barils de cadavres", text: "Tes ingénieurs proposent d'envoyer des cadavres de pestiférés par-dessus les murs d'une ville ennemie, à la catapulte.",
    options: [
      { label: "Bombarder une capitale rivale", hint: "La peste chez l'ennemi. Dieu jugera.", needsTarget: true, fx: [{ prestige: -2 }, { epithet: "le Pestilentiel" }, { target: [{ plague: "capital" }] }], chron: "Des cadavres pourris tombèrent du ciel sur la capitale de {cible}. La peste suivit." },
      { label: "Brûler les corps", hint: "Prudence.", fx: [{ colere: -5 }], chron: "{roi} fit brûler les pestiférés. La fumée noircit le ciel de {cap}." },
    ] },
  { id: "assassin", type: "target", title: "L'assassin italien", text: "Un Florentin aux mains très fines offre ses services. Il n'a jamais échoué, dit-il. Il dit aussi qu'il n'a que trois doigts à la main gauche.",
    options: [
      { label: "Engager l'assassin contre un roi rival", hint: "−6 or. 40 % de réussite.", needsTarget: true, fx: [{ gold: -6 }, { chance: 0.4, then: [{ target: [{ kill: "king", cause: "un stylet florentin" }] }], thenChron: "Le roi de {cible} fut retrouvé mort, un stylet dans la gorge.", else: [{ prestige: -4 }, { target: [{ peur: 10 }] }], elseChron: "L'assassin fut pris par les gardes de {cible}. Sous la torture, il donna le nom de {maison}." }], chron: "Un Florentin aux mains fines prit la route de chez {cible}." },
      { label: "Le dénoncer", hint: "Prestige.", fx: [{ prestige: 2 }], chron: "{roi} fit pendre le Florentin et prévint les autres cours." },
    ] },
  { id: "cadeau", type: "target", title: "Le cadeau", text: "Il est d'usage d'offrir un présent à une cour voisine pour la Saint-Martin. Ton échanson propose un excellent vin de Bourgogne. Avec ou sans additif.",
    options: [
      { label: "Le vin… avec additif", hint: "Un enfant de la cible risque de mourir.", needsTarget: true, fx: [{ chance: 0.5, then: [{ target: [{ kill: "random_child", cause: "un vin de Saint-Martin" }] }], thenChron: "Un enfant de {cible} goûta le vin de la Saint-Martin. Il ne vit pas la Noël.", else: [{ prestige: -3 }], elseChron: "Le goûteur de {cible} mourut à la première gorgée. Tout le monde sut d'où venait le vin." }], chron: "{maison} envoya un vin de Bourgogne à {cible}." },
      { label: "Un vrai cadeau", hint: "−3 or, +2 prestige, et la cible gagne 3 or.", needsTarget: true, fx: [{ gold: -3 }, { prestige: 2 }, { target: [{ gold: 3 }] }], chron: "{maison} offrit un présent somptueux à {cible}. On se demanda ce qu'elle cachait." },
    ] },
  { id: "debauchage", type: "target", title: "Les généraux à vendre", text: "Les capitaines d'une maison rivale ne sont plus payés depuis des mois. Ils écoutent les offres.",
    options: [
      { label: "Débaucher leurs hommes", hint: "−4 or. La cible perd 3 armées, tu en gagnes 2.", needsTarget: true, fx: [{ gold: -4 }, { armies: 2, where: "capital" }, { target: [{ armies: -3, where: "strongest" }] }], chron: "Les meilleurs capitaines de {cible} passèrent chez {maison}, contre de l'or." },
      { label: "Prévenir la maison en question", hint: "Elle te devra une faveur… en théorie.", needsTarget: true, fx: [{ prestige: 1 }, { target: [{ gold: -1 }] }], chron: "{maison} avertit {cible} que ses capitaines étaient à vendre." },
    ] },
  { id: "rumeur_batard", type: "target", title: "Une rumeur sur l'héritier", text: "Tes espions peuvent faire courir le bruit que l'héritier d'une maison rivale est le fils d'un palefrenier.",
    options: [
      { label: "Lancer la rumeur", hint: "−3 prestige et +10 Colère pour la cible.", needsTarget: true, fx: [{ target: [{ prestige: -3 }, { colere: 10 }] }], chron: "Dans les tavernes, on chanta que l'héritier de {cible} avait les oreilles du palefrenier." },
      { label: "Garder ça pour plus tard", hint: "+1 aux intrigues la prochaine manche.", fx: [{ intrigueBonus: 1 }], chron: "{roi} garda la rumeur dans sa manche." },
    ] },
  { id: "grain", type: "target", title: "Le grain de tout le royaume", text: "Les marchands lombards te proposent d'acheter tout le grain disponible. Ta voisine aura faim cet hiver.",
    options: [
      { label: "Affamer une maison rivale", hint: "−4 or. Colère +20 chez la cible.", needsTarget: true, fx: [{ gold: -4 }, { colere: -5 }, { target: [{ colere: 20 }] }], chron: "{maison} acheta tout le grain. Chez {cible}, on mangea l'herbe des fossés." },
      { label: "Revendre au double du prix", hint: "+4 or, tout le monde te déteste un peu.", fx: [{ gold: 4 }, { prestige: -1 }], chron: "{maison} revendit le grain au double. On l'appela la maison des usuriers." },
    ] },

  // ============================ PACTES (2 joueurs) ============================
  { id: "traite", type: "pact", title: "Le traité secret", text: "Un émissaire de {partenaire} propose un traité secret de non-agression et de commerce. Chacun signera en même temps. Mais rien n'empêche de vendre le traité aux autres cours…",
    options: [{ id: "a", label: "Honorer le traité" }, { id: "b", label: "Le trahir" }],
    outcomes: {
      aa: { fx: [{ gold: 3 }], chron: "{maison} et {partenaire} honorèrent leur traité. Les deux trésors s'en portèrent bien." },
      ab: { fx: [{ armies: -2, where: "capital" }, { prestige: -1 }], chron: "{maison} fut trahie par {partenaire}, qui vendit le traité au plus offrant." },
      ba: { fx: [{ gold: 6 }, { prestige: 1 }], chron: "{maison} vendit le traité de {partenaire} et empocha l'or." },
      bb: { fx: [{ prestige: -2 }], chron: "{maison} et {partenaire} se trahirent mutuellement. Toute la France se moqua d'eux." },
    } },
  { id: "reliques", type: "pact", title: "Les reliques de saint Martin", text: "Les os de saint Martin ont été volés. Tes moines et ceux de {partenaire} prétendent chacun les détenir. Un seul crâne, deux revendications.",
    options: [{ id: "a", label: "Céder les reliques" }, { id: "b", label: "Les revendiquer" }],
    outcomes: {
      aa: { fx: [{ prestige: 1 }], chron: "{maison} et {partenaire} partagèrent les reliques. On coupa le crâne en deux." },
      ab: { fx: [{ gold: 2 }], chron: "{maison} céda les reliques à {partenaire} contre un peu d'or." },
      ba: { fx: [{ prestige: 4 }], chron: "{maison} garda le crâne de saint Martin. Les pèlerins affluèrent." },
      bb: { fx: [{ prestige: -2 }, { armies: -1, where: "capital" }], chron: "{maison} et {partenaire} en vinrent aux mains pour un crâne. Il se brisa dans la bagarre." },
    } },
  { id: "complot_leader", type: "pact", req: "leaderNotInPact", title: "Le complot", text: "{partenaire} te propose d'empoisonner ensemble le roi de {leader}, qui devient trop puissant. Il faut être deux pour approcher la table royale. Seul, c'est la mort assurée.",
    options: [{ id: "a", label: "Participer au complot" }, { id: "b", label: "Se défiler" }],
    outcomes: {
      aa: { fx: [{ peur: 5 }, { killLeaderKing: 0.7 }], chron: "{maison} et {partenaire} conspirèrent contre le roi de {leader}." },
      ab: { fx: [{ prestige: -3 }, { leaderAlert: true }], chron: "{maison} fut seule au rendez-vous des conspirateurs. {leader} l'apprit." },
      ba: { fx: [], chron: "{maison} ne vint pas au rendez-vous des conspirateurs." },
      bb: { fx: [], chron: "Le complot contre {leader} resta lettre morte." },
    } },
  { id: "mariage_pacte", type: "pact", req: "bothMarriageable", title: "Les fiançailles", text: "Les chanceliers de {maison} et de {partenaire} ont arrangé une union entre vos enfants. Un mariage, c'est une alliance : attaquer sa belle-famille devient une trahison.",
    options: [{ id: "a", label: "Accepter le mariage" }, { id: "b", label: "Refuser" }],
    outcomes: {
      aa: { fx: [{ marryPartner: true }], chron: "Les cloches sonnèrent pour l'union de {maison} et de {partenaire}." },
      ab: { fx: [{ prestige: -2 }], chron: "{maison} fut humiliée : {partenaire} refusa la main de son enfant au dernier moment." },
      ba: { fx: [{ prestige: 1 }], chron: "{maison} refusa l'union avec {partenaire}, avec mépris." },
      bb: { fx: [], chron: "Ni {maison} ni {partenaire} ne voulurent de ce mariage." },
    } },
  { id: "neveux", type: "pact", title: "Les neveux", text: "Tes soldats ont capturé le neveu de {partenaire}. Au même moment, ses soldats ont capturé le tien. Les messagers se croisent sur la route.",
    options: [{ id: "a", label: "Libérer son neveu" }, { id: "b", label: "Exécuter son neveu" }],
    outcomes: {
      aa: { fx: [{ prestige: 2 }], chron: "{maison} et {partenaire} échangèrent leurs neveux. On parla de chevalerie." },
      ab: { fx: [{ colere: 10 }, { prestige: -1 }], chron: "{maison} libéra le neveu de {partenaire}, qui renvoya le sien… en morceaux." },
      ba: { fx: [{ peur: 15 }, { epithet: "le Cruel" }], chron: "{maison} renvoya la tête du neveu de {partenaire} dans un panier." },
      bb: { fx: [{ peur: 10 }], chron: "{maison} et {partenaire} exécutèrent chacun le neveu de l'autre. Deux familles en deuil, par fierté." },
    } },
  { id: "sel", type: "pact", title: "La route du sel", text: "Le sel de Guérande passe par tes terres et celles de {partenaire}. On peut partager les péages… ou bloquer la route pour l'autre.",
    options: [{ id: "a", label: "Partager" }, { id: "b", label: "Bloquer la route" }],
    outcomes: {
      aa: { fx: [{ gold: 3 }], chron: "Le sel circula entre {maison} et {partenaire}, et l'or avec lui." },
      ab: { fx: [{ gold: -2 }], chron: "{partenaire} bloqua la route du sel au nez de {maison}." },
      ba: { fx: [{ gold: 6 }], chron: "{maison} s'empara de tout le commerce du sel." },
      bb: { fx: [{ colere: 8 }], chron: "{maison} et {partenaire} bloquèrent tous deux la route. Le sel pourrit dans les charrettes." },
    } },
  { id: "champions", type: "pact", title: "Le duel des champions", text: "Ton champion et celui de {partenaire} s'affrontent en combat singulier devant toute la noblesse. Un peu de poison sur une lame, et personne n'en saura rien. Peut-être.",
    options: [{ id: "a", label: "Combattre loyalement" }, { id: "b", label: "Empoisonner sa lame" }],
    outcomes: {
      aa: { fx: [{ chance: 0.5, then: [{ prestige: 3 }], thenChron: "Le champion de {maison} l'emporta loyalement.", else: [], elseChron: "Le champion de {maison} mordit la poussière." }], chron: "Les champions de {maison} et de {partenaire} croisèrent le fer." },
      ab: { fx: [{ prestige: -1 }], chron: "Le champion de {maison} s'effondra, la bouche noire. La lame de {partenaire} brillait étrangement." },
      ba: { fx: [{ prestige: 3 }, { chance: 0.4, then: [{ prestige: -6 }, { epithet: "le Tricheur" }], thenChron: "Mais on découvrit le poison sur la lame de {maison}." }], chron: "Le champion de {maison} gagna en une passe. Son adversaire mourut en convulsions." },
      bb: { fx: [{ prestige: -1 }], chron: "Les deux champions s'empoisonnèrent mutuellement et moururent ensemble. Le public applaudit." },
    } },
  { id: "croisade", type: "pact", title: "L'appel du pape", text: "Le pape exige que {maison} et {partenaire} partent en croisade contre les Turcs. Celui qui reste sera traité de lâche. Celui qui part laisse ses terres sans défense.",
    options: [{ id: "a", label: "Partir en croisade" }, { id: "b", label: "Rester" }],
    outcomes: {
      aa: { fx: [{ armies: -3, where: "capital" }, { prestige: 4 }], chron: "{maison} et {partenaire} partirent ensemble en croisade. Peu revinrent." },
      ab: { fx: [{ armies: -3, where: "capital" }, { prestige: 5 }], chron: "{maison} partit seule en croisade, sous les acclamations. {partenaire} resta, sous les sifflets." },
      ba: { fx: [{ prestige: -3 }, { epithet: "le Couard" }], chron: "{maison} resta au chaud pendant que {partenaire} partait se battre." },
      bb: { fx: [{ prestige: -1 }], chron: "Ni {maison} ni {partenaire} ne partirent. Le pape les excommunia tous les deux, par principe." },
    } },
  { id: "peste_frontiere", type: "pact", title: "La peste à la frontière", text: "La peste frappe la frontière entre tes terres et celles de {partenaire}. Si chacun ferme sa frontière, les réfugiés mourront entre les deux. Si un seul la ferme, l'autre recevra tout le monde.",
    options: [{ id: "a", label: "Accueillir les réfugiés" }, { id: "b", label: "Fermer la frontière" }],
    outcomes: {
      aa: { fx: [{ prestige: 2 }, { colere: 5 }], chron: "{maison} et {partenaire} ouvrirent leurs portes aux réfugiés." },
      ab: { fx: [{ plague: "random_own" }, { prestige: 2 }], chron: "{maison} accueillit tous les réfugiés que {partenaire} refoulait. Avec leur peste." },
      ba: { fx: [{ peur: 5 }], chron: "{maison} ferma sa frontière et laissa {partenaire} gérer les malades." },
      bb: { fx: [{ peur: 10 }, { prestige: -2 }], chron: "Entre les frontières fermées de {maison} et de {partenaire}, les réfugiés moururent dans la neige." },
    } },
];

// ---------------------------------------------------------------------
// ÉVÉNEMENTS DU MONDE (tirés au hasard entre les manches)
// ---------------------------------------------------------------------
export const EVENTS = [
  { id: "debarquement", weight: 4 }, { id: "peste", weight: 4 }, { id: "recolte", weight: 2 }, { id: "comete", weight: 2 }, { id: "hiver", weight: 2 },
  { id: "famine", weight: 2 }, { id: "croisade", weight: 2 }, { id: "schisme", weight: 1 }, { id: "compagnie", weight: 2 }, { id: "foire", weight: 2 },
  { id: "seisme", weight: 1 }, { id: "miracle", weight: 2 }, { id: "sauterelles", weight: 1 }, { id: "vin", weight: 2 }, { id: "vacance", weight: 2 },
  { id: "inondation", weight: 1 }, { id: "tournoi", weight: 2 }, { id: "bourgeois", weight: 2 }, { id: "eclipse", weight: 1 }, { id: "fievre", weight: 2 },
  { id: "cathares", weight: 1 }, { id: "monstre", weight: 1 }, { id: "templiers", weight: 1 }, { id: "espions", weight: 2 }, { id: "noces", weight: 2 },
];

// ---------------------------------------------------------------------
// OBJECTIFS SECRETS (tirage : 3, on en garde 2)
// ---------------------------------------------------------------------
export const OBJECTIVES = [
  { id: "paris", pts: 5, text: "Tenir l'Île-de-France (Paris) à la fin de la partie" },
  { id: "huit", pts: 7, text: "Posséder au moins 8 provinces à la fin" },
  { id: "deux_regions", pts: 12, text: "Tenir 2 régions complètes à la fin" },
  { id: "poison2", pts: 6, text: "Tuer au moins 2 personnages par poison ou complot" },
  { id: "capitale_rivale", pts: 8, text: "Tenir la capitale d'une maison rivale à la fin" },
  { id: "colere_basse", pts: 3, text: "Finir avec une Colère du peuple sous 30" },
  { id: "peur_haute", pts: 5, text: "Finir avec au moins 60 de Peur" },
  { id: "famille", pts: 5, text: "Finir avec au moins 5 membres de ta famille vivants" },
  { id: "traitre", pts: 5, text: "Trahir un allié au moins une fois (attaquer sa belle-famille)" },
  { id: "conquerant", pts: 4, text: "Conquérir au moins 6 provinces au cours de la partie" },
  { id: "capitale_sauve", pts: 3, text: "Ne jamais perdre ta capitale" },
  { id: "mer", pts: 7, text: "Tenir au moins 5 provinces côtières à la fin" },
  { id: "riche", pts: 5, text: "Finir avec au moins 20 pièces d'or" },
  { id: "marie", pts: 5, text: "Marier au moins un de tes enfants à une maison rivale" },
  { id: "dix", pts: 10, text: "Posséder au moins 10 provinces à la fin" },
  { id: "reg_nord", pts: 9, text: "Tenir toute la région Nord à la fin (Flandre, Picardie, Île-de-France, Champagne)" },
  { id: "reg_ouest", pts: 8, text: "Tenir toute la région Ouest à la fin (Normandie, Bretagne, Anjou)" },
  { id: "reg_est", pts: 9, text: "Tenir toute la région Est à la fin (Lorraine, Alsace, Franche-Comté, Bourgogne)" },
  { id: "reg_centre", pts: 9, text: "Tenir toute la région Centre à la fin (Orléanais, Berry, Limousin, Auvergne)" },
  { id: "reg_sudouest", pts: 8, text: "Tenir toute la région Sud-Ouest à la fin (Poitou, Guyenne, Gascogne)" },
  { id: "reg_sudest", pts: 10, text: "Tenir toute la région Sud-Est à la fin (Lyonnais, Savoie, Provence, Languedoc, Corse)" },
  { id: "treves", pts: 3, text: "Signer au moins 2 trêves au cours de la partie" },
  { id: "accusateur", pts: 8, text: "Démasquer au moins un crime anonyme par une accusation juste" },
  { id: "batards", pts: 8, text: "Semer au moins 2 bâtards dans des familles rivales" },
  { id: "vieux_roi", pts: 8, text: "Ton roi de départ est encore vivant à la fin" },
  { id: "trois_rois", pts: 5, text: "Avoir eu au moins 3 souverains successifs (le chaos te sied)" },
  { id: "invaincu", pts: 8, text: "Attaquer au moins 3 fois sans jamais perdre une bataille" },
  { id: "genereux", pts: 6, text: "Donner au moins 10 pièces d'or à d'autres maisons (cadeaux ou pots-de-vin)" },
  { id: "pacifique", pts: 10, text: "N'attaquer personne de toute la partie" },
];
DILEMMAS.push(...DIL_COUR, ...DIL_GUERRE, ...DIL_PACTES, ...DIL_INTRIGUES, ...DIL_FAMILLES, ...DIL_SOMBRES);
// vérification des identifiants uniques
{ const seen = new Set(); for (const d of DILEMMAS) { if (seen.has(d.id)) console.warn("Dilemme en double :", d.id); seen.add(d.id); } }

// Provocations rapides
export const TAUNTS = ["Tu me le paieras.", "Une alliance ?", "Traître !", "Je n'ai rien fait.", "Dieu est avec moi.", "Ta mère était une Anglaise.", "Pitié…", "Ha ! Ha ! Ha !", "Je sais ce que tu as fait.", "Mon dé caché est un 6.", "Regarde ta frontière.", "On se reverra en enfer."];
export const WHISPERS = ["Je n'attaquerai pas tes terres cette manche.", "Attaquons ensemble le leader.", "Mon dé caché est énorme. Réfléchis bien.", "Je sais qui a versé le poison.", "Ton allié prépare quelque chose contre toi.", "Envoie-moi de l'or et je te laisse tranquille.", "Accepte mon mariage, tu ne le regretteras pas.", "Fais-moi confiance."];
export const AI_REPLIES = {
  conquerant: ["Tes paroles ne valent rien. Seules les épées comptent.", "Peut-être. Ou peut-être que je viendrai chercher ta capitale.", "Je n'ai pas d'amis. J'ai des voisins.", "Si tu es faible, je le saurai."],
  intrigant: ["Bien sûr, très cher. Tu as ma parole… pour ce qu'elle vaut.", "Intéressant. Et que m'offres-tu en échange ?", "Je n'oublierai pas cette conversation. Je n'oublie jamais rien.", "Méfie-toi plutôt de ceux qui sourient trop."],
  prudent: ["La paix me convient. Gardons nos frontières tranquilles.", "Je ne cherche pas la guerre, mais je ne la crains pas.", "Une trêve serait sage, pour nous deux.", "Je réfléchirai. Je réfléchis toujours avant d'agir."],
  anglais: ["God save the King.", "La France sera anglaise.", "Nous débarquerons quand il nous plaira."],
};

export const TITLES = [
  { id: "boucher", name: "Le Boucher", desc: "le plus d'armées ennemies massacrées", stat: "armiesKilled" },
  { id: "traitre", name: "Le Grand Traître", desc: "le plus de trahisons", stat: "betrayals", min: 1 },
  { id: "empoisonneur", name: "L'Empoisonneur", desc: "le plus de meurtres en coulisses", stat: "murders", min: 1 },
  { id: "maudit", name: "La Dynastie maudite", desc: "le plus de morts dans la famille", stat: "familyDeaths", min: 1 },
  { id: "cocu", name: "Le Cocu du royaume", desc: "le plus de bâtards reçus", stat: "bastardsReceived", min: 1 },
  { id: "conquerant", name: "Le Conquérant", desc: "le plus de provinces conquises", stat: "conquests", min: 1 },
  { id: "tyran", name: "Le Tyran", desc: "la plus grande Peur", stat: "peur" },
];
