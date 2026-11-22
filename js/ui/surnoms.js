// La petite phrase sous la fiche d'un personnage qui porte un surnom de naissance (« la Grosse », « le Bègue »…).
// Elle varie d'un personnage à l'autre (phrases propres au surnom, phrases générales, parfois rien du tout),
// mais reste la même pour un personnage donné : elle est tirée de son identifiant.
// Jetons : {S} le surnom entre guillemets, {il}/{Il} il ou elle, {lui} lui ou elle (après une préposition),
// {le} le ou la (complément), {e} « e » au féminin, {grand} « le Grand » ou « la Grande ».

const SPECIFIC = [
  [/Boiteu/, [
    "On l'entend venir de loin dans les couloirs : un pas, un pas traîné. D'où {S}.",
    "{Il} boite depuis une chute de cheval, ou depuis toujours : les versions changent. Le peuple dit {S}, sans malice.",
  ]],
  [/Bègue/, [
    "{Il} bute sur les mots, jamais sur les décisions. On dit {S}, mais on attend qu'{il} ait fini de parler.",
    "Les ambassadeurs prennent ses silences pour de la ruse. Ce n'est que {S} qui cherche ses mots.",
  ]],
  [/Bossu/, [
    "Les moines disent que sa bosse est une épreuve envoyée par Dieu. La cour, plus simplement, dit {S}.",
    "Un astrologue a prédit que sa bosse porterait chance à la maison. On attend toujours, mais on dit {S} avec un certain respect.",
  ]],
  [/Gros/, [
    "Les cuisines l'adorent, les tailleurs beaucoup moins. On dit {S}, et {il} en rit le premier.",
    "On mesure la richesse d'une maison au tour de taille de ses princes : {il} prend {S} presque comme un compliment.",
  ]],
  [/Borgne/, [
    "Il ne lui reste qu'un œil, et {il} voit tout. On dit {S}, mais jamais trop fort.",
    "L'œil perdu a sa légende : un duel, une flèche, une fièvre. {Il} ne la raconte jamais deux fois de la même façon.",
  ]],
  [/Chauve/, [
    "Ses cheveux sont partis bien avant sa jeunesse. Les troubadours chantent {S} ; {il} préfère les chaperons.",
    "Un barbier a juré de lui rendre ses cheveux avec un onguent de fiente de pigeon. Le barbier est parti, {S} est resté.",
  ]],
  [/Goitreu/, [
    "Le goitre lui gonfle le cou. Les médecins prescrivent des algues, la cour dit {S}.",
    "On lui prête un col toujours trop serré. Derrière son dos, les pages miment {S} en gonflant les joues.",
  ]],
  [/Pied-Bot/, [
    "Un pied tordu depuis la naissance. On dit {S}, mais en selle {il} ne craint personne.",
    "Ses bottes sont taillées sur mesure par un cordonnier qui ne parle à personne. Le reste du royaume dit {S}.",
  ]],
  [/Édenté/, [
    "Plus une dent avant trente ans : {il} mange de la bouillie et mord quand même. On dit {S}.",
    "{Il} sourit rarement. Quand {il} le fait, on comprend {S}.",
  ]],
  [/Bigleu/, [
    "Un œil regarde l'ambassadeur, l'autre la fenêtre. D'où {S}, et personne ne sait jamais à qui {il} parle.",
    "Au tir à l'arc, on s'écarte toujours un peu trop quand {S} tend la corde.",
  ]],
  [/Baveux/, [
    "À table, on place les ambassadeurs loin de lui. Le peuple dit {S}, avec une grimace.",
    "Les nappes du château gardent son souvenir. On dit {S}, et les lavandières soupirent.",
  ]],
  [/Nain/, [
    "{Il} n'arrive pas à l'épaule de ses gardes, mais tous baissent les yeux devant {lui}. On dit {S}, à voix basse.",
    "Le peuple dit {S} avec affection : {le} croiser au marché porterait bonheur.",
  ]],
  [/Grêlée/, [
    "La petite vérole lui a criblé le visage. Elle y a survécu, ce qu'on oublie un peu vite en disant {S}.",
    "Elle ne porte pas de voile pour cacher ses marques. La cour dit {S} ; elle soutient le regard.",
  ]],
  [/Moustachue/, [
    "Une ombre sur la lèvre que nul onguent n'efface. On dit {S} ; elle n'en a jamais rougi.",
    "Les dames de la cour lui envoient des pinces à épiler en cadeau. Elle les garde, pour les poisons.",
  ]],
];

const GENERIC = [
  "Son surnom, {S}, la cour le lui a donné. Personne n'ose le dire devant {lui}.",
  "Le peuple l'appelle {S}, et pas par méchanceté : au village, on l'aime bien.",
  "{S} : c'est ainsi qu'on {le} nomme dans les tavernes. {Il} fait semblant de ne pas le savoir.",
  "Les chroniqueurs écriront {S}. {Il} aurait préféré {grand}.",
  "Les pages chuchotent {S} dans les couloirs, et se taisent quand {il} passe.",
  "{Il} a fini par adopter {S} {lui}-même. Ça désarme les moqueurs.",
  "Nul ne sait qui {le} surnomma {S} le premier. On dit que le plaisantin a fini au cachot.",
  "Dans les autres cours, on ne {le} connaît que sous le nom de {S}.",
];

// pour un enfant, le surnom est encore récent
const CHILD = [
  "On {le} surnomme déjà {S}. Les enfants sont cruels, les courtisans aussi.",
  "{S} : le surnom lui colle depuis le berceau.",
  "Sa nourrice l'appelle {S}, avec tendresse. Les autres moins.",
];

function hashStr(t) { let h = 2166136261; for (let i = 0; i < t.length; i++) h = Math.imul(h ^ t.charCodeAt(i), 16777619); return h >>> 0; }

// la phrase (texte brut, à échapper) ou null quand ce personnage n'en a pas
export function nicknameLine(m) {
  if (!m || !m.infirm) return null;
  const spec = (SPECIFIC.find(([re]) => re.test(m.infirm)) || [, []])[1];
  // phrases propres au surnom comptées deux fois, et deux chances sur ~16 de ne rien dire
  const pool = m.age < 12 ? [...CHILD, ...spec, null] : [...spec, ...spec, ...GENERIC, null, null];
  const line = pool[hashStr(String(m.id) + "surnom") % pool.length];
  if (!line) return null;
  const f = m.sex === "f";
  const tok = { S: `« ${m.infirm} »`, il: f ? "elle" : "il", Il: f ? "Elle" : "Il", lui: f ? "elle" : "lui", le: f ? "la" : "le", e: f ? "e" : "", grand: f ? "« la Grande »" : "« le Grand »" };
  // une phrase qui commence par le surnom prend une majuscule : « Le Bègue » : …
  return line.replace(/\{(\w+)\}/g, (_, k) => tok[k] ?? "").replace(/^« (\p{Ll})/u, (_, c) => `« ${c.toUpperCase()}`);
}
