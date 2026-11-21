// Le Siècle Noir — affaires de famille entre maisons rivales (cartes « à cible »)
// Chaque carte met en jeu ta famille ET celle d'une autre maison.
export const DIL_FAMILLES = [
  { id: "otages", type: "target", req: "hasChild", title: "Les otages", text: "Une maison rivale propose un vieil usage : échanger des enfants en otage, gage de paix. {heritier} partirait vivre chez eux. Leur héritier viendrait vivre chez toi.",
    options: [
      { label: "Échanger les otages", hint: "Trêve de 3 manches avec la maison choisie, +2 or. Mais ton héritier vit chez eux…", needsTarget: true, fx: [{ treatyTarget: 3 }, { gold: 2 }, { chance: 0.15, then: [{ kill: "eldest", cause: "une fièvre en captivité, dit-on" }], thenChron: "{heritier} ne revint jamais de chez {cible}. Une fièvre, dit la lettre." }], chron: "{maison} et {cible} échangèrent leurs héritiers. On sourit beaucoup. On compta les gardes." },
      { label: "Exiger leur enfant sans donner le tien", hint: "La maison choisie cède par peur : +10 peur, elle prend +5 colère.", needsTarget: true, fx: [{ peur: 10 }, { target: [{ colere: 5 }, { prestige: -1 }] }], chron: "{maison} garda l'enfant de {cible} et ne donna rien en échange. Un otage sans contrepartie, c'est un prisonnier." },
      { label: "Refuser", hint: "Aucun enfant ne quitte {cap}.", fx: [{ prestige: -1 }], chron: "{roi} refusa d'envoyer son héritier chez un rival. On le dit méfiant. On a raison." },
    ] },
  { id: "fiancailles_volees", type: "target", req: "adultDaughter", title: "Les fiançailles", text: "{fille} est en âge d'être mariée. Une maison rivale la demande pour son fils. Un riche marchand de Bruges offre deux fois plus pour l'épouser lui-même, et personne n'aime ce marchand.",
    options: [
      { label: "La marier à la maison rivale", hint: "Mariage = alliance permanente avec la maison choisie (+1 or par manche chacun).", needsTarget: true, fx: [{ marryTarget: true }, { prestige: 1 }], chron: "{fille} fut promise à {cible}. Les cloches sonnèrent. La mariée ne sourit pas." },
      { label: "La vendre au marchand", hint: "+7 or. La maison choisie est humiliée et te le rendra.", needsTarget: true, fx: [{ gold: 7 }, { prestige: -2 }, { target: [{ prestige: -1 }] }], chron: "{roi} préféra l'or d'un marchand flamand à l'alliance de {cible}. {cible} n'oubliera pas." },
      { label: "L'enfermer au couvent", hint: "Plus de prétendants. Plus de problème.", fx: [{ removePerson: "daughter", cause: "envoyée au couvent" }, { colere: -5 }], chron: "{fille} prit le voile. Elle n'avait rien demandé." },
    ] },
  { id: "duel_heritiers", type: "target", req: "adultSon", title: "L'insulte", text: "L'héritier d'une maison rivale a traité {fils} de bâtard devant toute la cour. {fils} exige un duel à mort. Toute la noblesse attend ta décision.",
    options: [
      { label: "Autoriser le duel", hint: "Pile ou face : l'un des deux héritiers meurt. Victoire : +3 prestige.", needsTarget: true, fx: [{ chance: 0.5, then: [{ prestige: 3 }, { target: [{ kill: "eldest", cause: "tué en duel" }] }], thenChron: "{fils} planta son épée dans la gorge de l'héritier de {cible}.", else: [{ kill: "son", cause: "tué en duel" }, { target: [{ prestige: 2 }] }], elseChron: "{fils} tomba au premier assaut. L'héritier de {cible} essuya sa lame sur la cape du mort." }], chron: "Le duel eut lieu à l'aube, sous les murs de {cap}." },
      { label: "Faire empoisonner l'insolent la veille", hint: "L'héritier de la maison choisie meurt, peut-être. Anonyme.", needsTarget: true, anon: true, anonChron: "La veille d'un duel, l'héritier de {cible} mourut dans d'atroces douleurs. Quelle coïncidence.", fx: [{ gold: -3 }, { murder: true }, { target: [{ chance: 0.7, then: [{ kill: "eldest", cause: "empoisonné la veille d'un duel" }] }] }], chron: "" },
      { label: "Interdire le duel", hint: "Ton fils est humilié, la cour aussi.", fx: [{ prestige: -2 }, { nextDice: -1 }], chron: "{roi} interdit le duel. {fils} ne lui adressa plus jamais la parole." },
    ] },
  { id: "nourrice", type: "target", req: "heirMinor", title: "La nourrice", text: "On a surpris la nourrice de {heritier} avec un oreiller à la main, au-dessus du berceau. Sous la torture, elle a donné un nom : celui d'une maison rivale. Dit-elle vrai ? Peu importe.",
    options: [
      { label: "L'exécuter et accuser publiquement", hint: "La maison choisie perd 3 prestige et prend +10 colère.", needsTarget: true, fx: [{ peur: 5 }, { target: [{ prestige: -3 }, { colere: 10 }] }], chron: "La nourrice fut écartelée sur la place de {cap}, et {maison} accusa {cible} devant toutes les cours d'Europe." },
      { label: "La renvoyer chez eux… avec un message", hint: "Tu découvres les objectifs secrets de la maison choisie.", needsTarget: true, fx: [{ spyObjectives: true }, { intrigueBonus: 1 }], chron: "La nourrice repartit chez {cible} avec une bourse et une mission. Elle écrivait souvent." },
      { label: "Étouffer l'affaire", hint: "Rien ne sort du château.", fx: [{ gold: -2 }], chron: "{roi} fit disparaître la nourrice et le secret avec elle." },
    ] },
  { id: "medecin_cousin", type: "target", title: "Le médecin", text: "Le médecin personnel du roi d'une maison rivale est ton cousin. Il t'écrit : son maître tousse beaucoup. Il pourrait le soigner. Ou pas.",
    options: [
      { label: "Lui demander de mal soigner", hint: "Le roi de la maison choisie tombe gravement malade. Anonyme.", needsTarget: true, anon: true, anonChron: "Le roi de {cible} fut saigné douze fois en un mois. Ses médecins se disent surpris de son état.", fx: [{ murder: true }, { target: [{ health: 2 }] }], chron: "" },
      { label: "Lui demander de le soigner vraiment", hint: "Trêve de 2 manches avec la maison choisie, +2 prestige.", needsTarget: true, fx: [{ treatyTarget: 2 }, { prestige: 2 }], chron: "Le cousin de {roi} sauva le roi de {cible}. On parla de grandeur d'âme. On parla aussi de dette." },
      { label: "Rançonner : soins contre or", hint: "La maison choisie te paie 5 or.", needsTarget: true, fx: [{ steal: 5 }, { target: [{ colere: 5 }] }], chron: "{cible} paya cher pour que son roi survive. Le médecin avait un cousin très exigeant." },
    ] },
  { id: "tournoi_lance", type: "target", title: "Le tournoi", text: "Tu organises le plus grand tournoi depuis dix ans et tu invites une maison rivale. Leur héritier joutera contre ton champion. Les lances, normalement, sont mouchetées.",
    options: [
      { label: "Une lance non mouchetée", hint: "60 % : l'héritier de la maison choisie meurt. Sinon, scandale : −3 prestige.", needsTarget: true, fx: [{ peur: 10 }, { chance: 0.6, then: [{ target: [{ kill: "eldest", cause: "une lance en plein œil, au tournoi" }] }], thenChron: "La lance de ton champion entra dans le heaume de l'héritier de {cible}. Un accident, bien sûr.", else: [{ prestige: -3 }], elseChron: "La lance glissa sur l'écu. Tout le monde vit la pointe d'acier. Scandale." }], chron: "{maison} reçut {cible} à son grand tournoi." },
      { label: "Laisser leur héritier gagner", hint: "Trêve de 3 manches avec la maison choisie. −2 or.", needsTarget: true, fx: [{ treatyTarget: 3 }, { gold: -2 }], chron: "L'héritier de {cible} remporta le tournoi de {cap}. Ton champion tomba avec beaucoup de conviction." },
      { label: "Humilier leur héritier", hint: "+2 prestige pour toi, −2 pour la maison choisie.", needsTarget: true, fx: [{ prestige: 2 }, { target: [{ prestige: -2 }] }], chron: "L'héritier de {cible} mordit la poussière trois fois devant toute la noblesse. On en rit jusqu'à Paris." },
    ] },
  { id: "reine_retenue", type: "target", req: "queenAlive", title: "La reine retenue", text: "{reine} rentrait d'un pèlerinage. Une maison rivale l'a « accueillie pour sa sécurité » et ne la laisse plus repartir. Elle demande une compensation pour l'hospitalité.",
    options: [
      { label: "Payer", hint: "−5 or, qui vont à la maison choisie.", needsTarget: true, fx: [{ gold: -5 }, { target: [{ gold: 5 }] }], chron: "{maison} paya {cible} pour récupérer {reine}. Elle ne parla jamais de son séjour." },
      { label: "Menacer de guerre", hint: "+3 armées à ta frontière, la maison choisie prend +10 colère.", needsTarget: true, fx: [{ armies: 3, where: "border" }, { peur: 5 }, { target: [{ colere: 10 }] }], chron: "{roi} massa ses troupes à la frontière de {cible}. {reine} fut rendue le lendemain, avec des excuses." },
      { label: "La laisser là-bas et prendre une autre épouse", hint: "Une jeune reine, et l'ancienne… on verra.", fx: [{ prestige: -2 }, { kill: "queen", cause: "oubliée dans une tour" }, { newQueen: true }], chron: "{roi} ne paya pas. On dit que l'ancienne reine mourut en regardant la route. La nouvelle avait seize ans." },
    ] },
  { id: "eveque_frere", type: "target", title: "L'évêque", text: "Ton frère vient d'être nommé évêque. Il propose de mettre ses nouveaux pouvoirs au service de la famille. Il a des idées. Beaucoup d'idées.",
    options: [
      { label: "Excommunier une maison rivale", hint: "La maison choisie prend +15 colère et −2 prestige. −4 or (les cardinaux coûtent cher).", needsTarget: true, fx: [{ gold: -4 }, { target: [{ colere: 15 }, { prestige: -2 }] }], chron: "L'évêque, frère de {roi}, excommunia {cible}. Leurs églises fermèrent. Leurs paysans ne dorment plus." },
      { label: "Vendre des indulgences", hint: "+5 or, +5 colère.", fx: [{ gold: 5 }, { colere: 5 }], chron: "L'évêque vendit le pardon de tous les péchés à prix d'ami. Le trésor de {maison} s'en porta mieux." },
      { label: "Bénir un mariage avec une maison rivale", hint: "Mariage avec la maison choisie si vous avez des enfants à marier.", needsTarget: true, fx: [{ marryTarget: true }, { prestige: 1 }], chron: "L'évêque bénit l'union de {maison} et {cible}. Il bénit aussi la dot." },
    ] },
  { id: "batard_porte", type: "target", title: "L'enfant à la porte", text: "Un panier a été déposé devant {cap}. Dedans, un enfant et une lettre : c'est le bâtard du roi d'une maison rivale, né d'une servante. La mère est morte. L'enfant a les yeux de son père.",
    options: [
      { label: "Le présenter à toute la cour", hint: "Scandale : la maison choisie perd 3 prestige.", needsTarget: true, fx: [{ prestige: 1 }, { target: [{ prestige: -3 }, { colere: 5 }] }], chron: "{maison} présenta à la cour le bâtard du roi de {cible}. La reine de {cible} brisa toute la vaisselle." },
      { label: "Le rendre contre de l'or", hint: "La maison choisie paie 4 or pour ton silence.", needsTarget: true, fx: [{ steal: 4 }], chron: "{cible} paya pour récupérer discrètement un panier. Personne ne demanda ce qu'il contenait." },
      { label: "L'élever en secret", hint: "Un jour, il pourra servir. +2 aux intrigues.", fx: [{ intrigueBonus: 2 }, { gold: -1 }], chron: "{roi} fit élever l'enfant loin de la cour. Les bâtards font d'excellents espions." },
    ] },
  { id: "precepteur", type: "target", req: "heirMinor", title: "Le précepteur", text: "Le précepteur de {heritier} est un brillant clerc venu d'une maison rivale. L'enfant l'adore. Ton chancelier a trouvé des lettres codées dans sa chambre.",
    options: [
      { label: "Le retourner", hint: "Tu découvres les objectifs secrets de la maison choisie. −3 or.", needsTarget: true, fx: [{ gold: -3 }, { spyObjectives: true }], chron: "Le précepteur de {heritier} écrivit désormais deux fois plus de lettres : certaines pour {cible}, les vraies pour {roi}." },
      { label: "Le renvoyer couvert de cadeaux", hint: "Trêve de 2 manches avec la maison choisie.", needsTarget: true, fx: [{ treatyTarget: 2 }, { gold: -2 }], chron: "{maison} renvoya le précepteur chez {cible} avec des présents. Un message très poli." },
      { label: "Le pendre devant l'enfant", hint: "Une leçon que {heritier} n'oubliera pas.", fx: [{ peur: 10 }, { prestige: -1 }], chron: "{heritier} vit son précepteur danser au bout d'une corde. Il ne pleura pas. C'est ce qui inquiéta tout le monde." },
    ] },
  { id: "dot_folle", type: "target", req: "adultDaughter", title: "Le fils fou", text: "Une maison rivale offre une dot énorme pour marier son fils à {fille}. On murmure que ce fils mord ses serviteurs et parle à ses chevaux.",
    options: [
      { label: "Accepter le mariage", hint: "Alliance avec la maison choisie et +6 or. Ta fille, elle…", needsTarget: true, fx: [{ marryTarget: true }, { gold: 6 }, { colere: 3 }], chron: "{fille} épousa le fils de {cible}. La dot était magnifique. Le marié aboya pendant la messe." },
      { label: "Prendre la dot et cacher ta fille", hint: "La maison choisie te paie 6 or… et te haïra. −3 prestige.", needsTarget: true, fx: [{ steal: 6 }, { prestige: -3 }, { epithet: "le Parjure" }], chron: "{maison} encaissa la dot de {cible}, puis déclara que {fille} était partie en pèlerinage. Pour longtemps." },
      { label: "Refuser", hint: "Rien ne se passe. Ta fille te remercie en silence.", fx: [], chron: "{roi} refusa poliment. {fille} alluma un cierge." },
    ] },
  { id: "heritier_otage_rival", type: "target", title: "Le prince égaré", text: "Tes patrouilles ont arrêté un jeune homme qui chassait sur tes terres : c'est l'héritier d'une maison rivale, seul, sans escorte. Il est arrogant. Il ne sait pas encore où il est.",
    options: [
      { label: "Le garder en otage", hint: "La maison choisie n'osera pas t'attaquer : trêve forcée de 2 manches, +10 peur.", needsTarget: true, fx: [{ treatyTarget: 2 }, { peur: 10 }, { target: [{ colere: 5 }] }], chron: "{maison} garda l'héritier de {cible} « en invité ». Il mangeait à la table de {roi}. Il ne pouvait pas sortir." },
      { label: "Un accident de chasse", hint: "L'héritier de la maison choisie meurt. Anonyme.", needsTarget: true, anon: true, anonChron: "L'héritier de {cible} fut retrouvé dans une forêt, une flèche dans le dos. Un sanglier très habile.", fx: [{ murder: true }, { target: [{ kill: "eldest", cause: "un accident de chasse" }] }], chron: "" },
      { label: "Le raccompagner avec honneur", hint: "+2 prestige, la maison choisie te doit 3 or.", needsTarget: true, fx: [{ prestige: 2 }, { steal: 3 }], chron: "{roi} raccompagna lui-même l'héritier de {cible} jusqu'à sa frontière. Un geste qui coûta 3 pièces d'or à son père." },
    ] },
];
