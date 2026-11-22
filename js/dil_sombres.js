// Le Siècle Noir — dilemmes les plus sombres : chair, sang, torture, secrets de famille.
// (Tout reste suggéré, jamais décrit crûment.)
export const DIL_SOMBRES = [
  { id: "niece", type: "solo", req: "widowKing", title: "La nièce", text: "{roi} est veuf. Sa nièce a vingt ans, une dot énorme et le même sang que lui. L'évêque fermera les yeux pour une cathédrale. La cour, elle, ne les fermera pas.",
    options: [
      { label: "L'épouser", hint: "Une reine et sa dot, mais des enfants consanguins.", fx: [{ newQueen: true }, { gold: 5 }, { consanguin: true }, { prestige: -1 }], chron: "{roi} épousa sa propre nièce. La dot fut magnifique. Les sages-femmes prièrent beaucoup." },
      { label: "Épouser une étrangère", hint: "Une reine sans scandale, mais il faut payer.", fx: [{ newQueen: true }, { gold: -3 }], chron: "{roi} fit venir une princesse de Bohême. Elle ne parlait pas un mot de français. C'était aussi bien." },
      { label: "Rester veuf", hint: "Pas de reine, pas d'enfants à venir.", fx: [{ colere: -5 }], chron: "{roi} refusa de se remarier. On le dit fidèle à la morte. On le dit aussi impuissant." },
    ] },
  { id: "frere_reine", type: "solo", req: "queenAlive", title: "Le frère de la reine", text: "Le chambellan jure avoir vu {reine} sortir à l'aube de la chambre de son propre frère, les cheveux défaits. Il le jure sur la Bible. Il le jurera bientôt devant toute la cour.",
    options: [
      { label: "Faire emmurer le chambellan", hint: "Plus de témoin. La rumeur, elle, court déjà.", fx: [{ peur: 10 }, { flag: "reine_volage" }], chron: "Le chambellan de {maison} disparut. On entendit gratter derrière un mur neuf pendant trois jours." },
      { label: "Faire décapiter la reine", hint: "La reine meurt. Une nouvelle épouse arrive. La cour tremble.", fx: [{ kill: "queen", cause: "décapitée pour avoir partagé le lit de son frère" }, { peur: 15 }, { prestige: -1 }, { newQueen: true }], chron: "{reine} fut décapitée dans la cour de {cap}. Son frère regarda depuis une fenêtre, puis s'enfuit en Castille." },
      { label: "Exiler le frère, garder la reine", hint: "Le scandale est étouffé, à moitié.", fx: [{ prestige: -1 }, { addChildDoubt: true }], chron: "Le frère de {reine} fut envoyé en pèlerinage, très loin. Neuf mois plus tard, la reine accoucha. Personne n'osa compter." },
    ] },
  { id: "question", type: "solo", title: "La question", text: "Un espion a été pris dans les cuisines de {cap}. Il ne dit rien. Le bourreau propose la « question extraordinaire » : les brodequins, l'eau, puis le fer rouge. Il promet des réponses avant les vêpres.",
    options: [
      { label: "La question extraordinaire", hint: "Il parlera : +2 à tes intrigues. On entendra ses cris jusqu'au marché.", fx: [{ intrigueBonus: 2 }, { peur: 10 }, { colere: 5 }], chron: "L'espion de {cap} parla avant les vêpres. Il parla beaucoup. Il ne marcha plus jamais." },
      { label: "Le retourner avec de l'or", hint: "Un agent double : +1 aux intrigues.", fx: [{ gold: -3 }, { intrigueBonus: 1 }], chron: "{roi} offrit à l'espion une bourse et une seconde chance. Il travaille désormais pour deux maîtres, ce qui est une de trop." },
      { label: "Le pendre sans un mot", hint: "Un message clair à ceux qui l'ont envoyé.", fx: [{ peur: 5 }], chron: "L'espion fut pendu aux créneaux de {cap} sans avoir été interrogé. Ses maîtres comprirent le message." },
    ] },
  { id: "aveux", type: "target", title: "Les aveux", text: "Après trois jours de torture, un prisonnier a fini par signer : il accuse une maison rivale d'avoir comploté contre toi. Vrai ? Faux ? Il signerait n'importe quoi pour que ça s'arrête.",
    options: [
      { label: "Publier les aveux partout", hint: "La maison choisie perd 3 Prestige et prend +10 Colère.", needsTarget: true, fx: [{ target: [{ prestige: -3 }, { colere: 10 }] }, { peur: 5 }], chron: "{maison} fit lire dans toutes les églises les aveux d'un prisonnier accusant {cible}. Le prisonnier mourut avant qu'on puisse le réentendre." },
      { label: "S'en servir pour faire chanter", hint: "La maison choisie te paie 5 or pour ton silence.", needsTarget: true, fx: [{ steal: 5 }], chron: "{maison} fit porter à {cible} une copie des aveux et une demande d'or. {cible} paya. Puis aiguisa ses couteaux." },
      { label: "Brûler les aveux", hint: "Un geste noble : +1 Prestige.", fx: [{ prestige: 1 }, { colere: -3 }], chron: "{roi} jeta les aveux au feu : « Ce qu'on arrache sous la torture ne vaut rien. » On le trouva très moderne." },
    ] },
  { id: "noces_sang", type: "target", title: "Le banquet de la paix", text: "Une maison rivale vient à {cap} pour un grand banquet de réconciliation. Ses chefs dormiront sous ton toit. Ton capitaine des gardes attend un signe : il suffit de faire jouer une certaine chanson.",
    options: [
      { label: "Faire jouer la chanson", hint: "Massacre : leur héritier meurt, leur reine aussi peut-être. Trahison, −4 Prestige, +20 Peur.", needsTarget: true, fx: [{ peur: 20 }, { prestige: -4 }, { betrayal: true }, { epithet: "le Boucher des noces" }, { target: [{ kill: "eldest", cause: "égorgé au banquet de la paix" }, { chance: 0.5, then: [{ kill: "queen", cause: "poignardée au banquet de la paix" }] }] }], chron: "Au troisième plat, les musiciens jouèrent une chanson douce. Les gardes de {maison} fermèrent les portes. {cible} ne quitta jamais la salle." },
      { label: "Un banquet sincère", hint: "Trêve de 3 manches avec la maison choisie.", needsTarget: true, fx: [{ treatyTarget: 3 }, { gold: -2 }], chron: "{maison} et {cible} festoyèrent toute la nuit. Personne ne mourut. Tout le monde fut surpris." },
      { label: "Seulement le vin de leur héritier", hint: "L'héritier de la maison choisie meurt peut-être. Anonyme.", needsTarget: true, anon: true, anonChron: "Au banquet de la paix, l'héritier de {cible} but une coupe de trop. On le porta dans son lit. Il ne se réveilla pas.", fx: [{ murder: true }, { target: [{ chance: 0.6, then: [{ kill: "eldest", cause: "empoisonné au banquet de la paix" }] }] }], chron: "" },
    ] },
  { id: "sage_femme", type: "solo", title: "La sorcière", text: "La sage-femme qui a sauvé {heritier} de la fièvre est accusée de sorcellerie : on l'a vue parler à un bouc. Le peuple veut un bûcher. Le peuple veut toujours un bûcher.",
    options: [
      { label: "Allumer le bûcher", hint: "Le peuple est content, la sage-femme beaucoup moins.", fx: [{ colere: -10 }, { peur: 5 }], chron: "La sage-femme brûla sur la place de {cap}. Elle maudit {maison} jusqu'à sa septième génération. On rit. Un peu." },
      { label: "La protéger", hint: "La Colère monte, mais elle soignera ta famille.", fx: [{ colere: 10 }, { health: -1 }], chron: "{roi} cacha la sorcière au château. Le peuple gronde, mais le roi ne tousse plus." },
      { label: "La livrer, mais l'étrangler avant les flammes", hint: "Un compromis chrétien.", fx: [{ colere: -5 }, { prestige: 1 }], chron: "On étrangla la sage-femme avant d'allumer le bûcher. La foule trouva que ça manquait de cris." },
    ] },
  { id: "fils_fouet", type: "solo", req: "adultSon", title: "Le fouet", text: "{fils} fait fouetter les servantes jusqu'au sang pour un plat trop froid, et s'en vante au banquet. Trois sont mortes cet hiver. Le peuple commence à prononcer son nom à voix basse.",
    options: [
      { label: "L'envoyer à la croisade", hint: "Il quitte la famille, +2 Prestige.", fx: [{ removePerson: "son", cause: "parti mourir en croisade" }, { prestige: 2 }], chron: "{fils} partit pour l'Orient avec une croix sur la poitrine et un fouet dans ses bagages." },
      { label: "Le laisser faire", hint: "La peur règne. La Colère aussi.", fx: [{ peur: 10 }, { colere: 10 }], chron: "{roi} haussa les épaules : « Il faut bien que jeunesse se passe. » Les servantes, elles, ne passent plus l'hiver." },
      { label: "Le faire fouetter à son tour, en public", hint: "Le peuple t'adore, ton fils te hait.", fx: [{ colere: -10 }, { prestige: 1 }, { flag: "fils_haineux" }], chron: "{fils} reçut vingt coups de fouet devant le peuple de {cap}. Il ne cria pas. Il regarda son père pendant chaque coup." },
    ] },
  { id: "maitresse_lettres", type: "target", title: "La maîtresse du roi", text: "La maîtresse du roi d'une maison rivale t'écrit en secret. Elle partage son lit, ses secrets et sa coupe. Pour assez d'or, elle pourrait partager autre chose.",
    options: [
      { label: "Payer pour le poison lent", hint: "Le roi de la maison choisie tombe gravement malade. Anonyme.", needsTarget: true, anon: true, anonChron: "Le roi de {cible} maigrit à vue d'œil. Sa maîtresse, elle, porte de nouveaux bijoux.", fx: [{ gold: -3 }, { murder: true }, { target: [{ health: 2 }] }], chron: "" },
      { label: "Révéler l'adultère à sa reine", hint: "Scandale chez la maison choisie : −2 Prestige, +5 Colère.", needsTarget: true, fx: [{ target: [{ prestige: -2 }, { colere: 5 }] }], chron: "{maison} fit parvenir à la reine de {cible} les lettres de la maîtresse. La vaisselle de la cour de {cible} ne s'en remit pas." },
      { label: "En faire ton espionne", hint: "Tu découvres les objectifs secrets de la maison choisie.", needsTarget: true, fx: [{ spyObjectives: true }, { gold: -2 }], chron: "La maîtresse du roi de {cible} écrit désormais deux lettres par nuit. La seconde part pour {cap}." },
    ] },
  { id: "oncle_oubliettes", type: "solo", title: "L'oncle", text: "Ton oncle, qui prétendait au trône, croupit dans les oubliettes de {cap} depuis dix ans. Il a perdu ses dents, pas son ambition. Les barons recommencent à prononcer son nom.",
    options: [
      { label: "L'étrangler dans son cachot", hint: "Le problème disparaît. La cour se tait.", fx: [{ peur: 10 }, { prestige: -1 }], chron: "L'oncle de {roi} fut retrouvé étranglé avec sa propre chaîne. « Le désespoir », dit le geôlier, qui reçut une ferme." },
      { label: "L'aveugler et l'envoyer au monastère", hint: "Vivant, mais inoffensif.", fx: [{ peur: 5 }, { colere: -3 }], chron: "On creva les yeux de l'oncle de {roi} et on l'envoya prier chez les moines. Il prie surtout pour la mort de son neveu." },
      { label: "Le libérer et lui acheter sa loyauté", hint: "Les barons se calment, l'or s'envole.", fx: [{ gold: -4 }, { prestige: 2 }, { flag: "oncle_libre" }], chron: "{roi} libéra son oncle et l'embrassa devant la cour. Le vieil homme sourit sans dents. Ce n'était pas rassurant." },
    ] },
  { id: "orphelins", type: "solo", title: "Les enfants de la famine", text: "La famine a laissé des centaines d'orphelins qui errent autour de {cap}. Les mines d'argent manquent de bras minuscules. Des marchands vénitiens proposent un bon prix. Et puis il y a la charité, qui coûte cher.",
    options: [
      { label: "Les envoyer aux mines", hint: "+5 or, +10 Colère.", fx: [{ gold: 5 }, { colere: 10 }], chron: "Les orphelins de {cap} descendirent dans les mines. Les filons d'argent rapportèrent beaucoup. Les orphelins remontèrent moins nombreux." },
      { label: "Les vendre aux Vénitiens", hint: "+8 or, −3 Prestige, un surnom qui reste.", fx: [{ gold: 8 }, { prestige: -3 }, { epithet: "le Marchand d'enfants" }], chron: "Trois galères vénitiennes quittèrent la côte, lourdes d'enfants. {roi} compta l'or lui-même." },
      { label: "Les nourrir", hint: "−4 or, le peuple t'aime.", fx: [{ gold: -4 }, { colere: -12 }, { prestige: 1 }], chron: "{roi} ouvrit ses greniers aux orphelins de {cap}. Les chroniqueurs l'écrivirent. Les autres rois le trouvèrent naïf." },
    ] },
  { id: "rancon_routiers", type: "target", title: "Le prince à vendre", text: "Une bande de routiers a enlevé l'héritier d'une maison rivale au détour d'une forêt. Ils te le proposent avant de le proposer à d'autres. Le garçon pleure. Il appelle son père.",
    options: [
      { label: "L'acheter et le revendre à son père", hint: "−3 or, puis la maison choisie te paie 7 or.", needsTarget: true, fx: [{ gold: -3 }, { steal: 7 }], chron: "{maison} racheta l'héritier de {cible} aux routiers, puis le revendit à son père, avec un joli bénéfice." },
      { label: "L'acheter et le garder en otage", hint: "La maison choisie n'osera pas t'attaquer : trêve forcée de 3 manches.", needsTarget: true, fx: [{ gold: -3 }, { treatyTarget: 3 }, { peur: 5 }, { target: [{ colere: 5 }] }], chron: "L'héritier de {cible} vit désormais à {cap}, dans une jolie chambre, avec des barreaux très discrets." },
      { label: "Laisser les routiers s'en charger", hint: "50 % : l'héritier de la maison choisie ne revient jamais. Anonyme.", needsTarget: true, anon: true, anonChron: "Des routiers ont retrouvé un jeune homme pendu à un chêne. Il portait les couleurs de {cible}.", fx: [{ murder: true }, { target: [{ chance: 0.5, then: [{ kill: "eldest", cause: "pendu par des routiers" }] }] }], chron: "" },
    ] },
  { id: "puits", type: "target", title: "Le cadavre dans le puits", text: "On a remonté du puits de {cap} le corps d'un émissaire d'une maison rivale. Langue coupée, mains clouées. Ce n'est pas toi. Personne ne le croira.",
    options: [
      { label: "Rendre le corps avec des excuses et de l'or", hint: "Trêve de 2 manches avec la maison choisie, −3 or.", needsTarget: true, fx: [{ gold: -3 }, { treatyTarget: 2 }], chron: "{maison} rendit le corps de l'émissaire à {cible}, lavé, parfumé, et accompagné d'un coffre d'or. On fit semblant de la croire." },
      { label: "Accuser la maison choisie d'une mise en scène", hint: "Elle perd 2 Prestige, et elle te déteste.", needsTarget: true, fx: [{ target: [{ prestige: -2 }, { colere: 5 }] }], chron: "{maison} accusa {cible} d'avoir tué son propre émissaire pour déclencher une guerre. C'était insensé. Beaucoup y crurent." },
      { label: "Brûler le corps et nier", hint: "+5 Peur, −1 Prestige.", fx: [{ peur: 5 }, { prestige: -1 }], chron: "Le corps de l'émissaire fut brûlé dans les cuisines de {cap}. L'odeur dura une semaine. {roi} nia tout." },
    ] },
  { id: "amant_capitaine", type: "solo", req: "queenAlive", title: "Le capitaine des gardes", text: "{reine} a un amant : ton propre capitaine des gardes. Toute la garnison le sait. Toute la garnison lui obéit, à lui. Il dort à deux portes de ta chambre, avec son épée.",
    options: [
      { label: "Les faire murer vivants, ensemble", hint: "La reine meurt, tu en prends une autre. +20 Peur.", fx: [{ kill: "queen", cause: "murée vivante avec son amant" }, { peur: 20 }, { newQueen: true }, { armies: -1, where: "capital" }], chron: "On mura {reine} et son capitaine dans la même cellule, avec une seule cruche d'eau. {roi} se remaria au printemps." },
      { label: "Faire castrer le capitaine", hint: "Il reste, humilié. Toi aussi, un peu.", fx: [{ peur: 10 }, { prestige: -1 }], chron: "Le capitaine des gardes de {cap} fut castré dans la cour d'honneur, puis réintégré dans ses fonctions. Il sert désormais la reine avec beaucoup de sérénité." },
      { label: "Fermer les yeux : il te sera fidèle", hint: "+2 armées dans ta capitale, mais le surnom « le Cocu ».", fx: [{ armies: 2, where: "capital" }, { epithet: "le Cocu" }, { flag: "reine_volage" }], chron: "{roi} fit mine de ne rien savoir. Le capitaine, reconnaissant, doubla la garde. La reine, elle, doubla les visites." },
    ] },
  { id: "bordel", type: "solo", title: "Le sceau royal", text: "{roi} a passé la nuit dans un bordel de la rue Chapon. Il en est revenu sans bourse, sans chausses et sans le sceau royal. La mère maquerelle le garde, et elle sait écrire.",
    options: [
      { label: "Payer la maquerelle", hint: "−4 or, et personne n'en saura rien.", fx: [{ gold: -4 }], chron: "Une mère maquerelle de Paris s'acheta une auberge, un cheval et un silence parfait." },
      { label: "Brûler le bordel", hint: "Le sceau est récupéré. Les filles, moins. +10 Colère.", fx: [{ colere: 10 }, { peur: 10 }], chron: "Le bordel de la rue Chapon brûla une nuit d'hiver. On retrouva le sceau royal dans les cendres. On ne chercha rien d'autre." },
      { label: "En rire devant toute la cour", hint: "Le peuple adore. Les évêques, moins.", fx: [{ colere: -8 }, { prestige: -2 }, { epithet: "le Paillard" }], chron: "{roi} raconta lui-même l'histoire au banquet, en mimant. La cour rit aux larmes. Le légat du pape quitta la table." },
    ] },
  { id: "jumeaux_prophetie", type: "solo", req: "queenAlive", title: "Les jumeaux", text: "{reine} accouche de jumeaux. L'astrologue est formel : deux princes nés le même jour s'entretueront pour la couronne, et le royaume avec eux. Il parle bas. Il regarde le second berceau.",
    options: [
      { label: "Garder les deux", hint: "Deux enfants de plus, et une prophétie au-dessus de ta tête.", fx: [{ addChild: 2 }, { colere: -3 }], chron: "{reine} donna naissance à des jumeaux. {roi} fit chasser l'astrologue à coups de pied." },
      { label: "Confier le second à un couvent lointain", hint: "Un enfant de plus, l'autre disparaît de l'histoire.", fx: [{ addChild: 1 }, { prestige: -1 }], chron: "Un seul prince fut présenté au peuple. Dans un couvent de Navarre, les nonnes reçurent un nourrisson et une bourse." },
      { label: "Faire disparaître le second", hint: "Un enfant de plus. Une nuit que la reine n'oubliera jamais.", fx: [{ addChild: 1 }, { peur: 10 }, { flag: "reine_haineuse" }], chron: "La nourrice dit que le second jumeau était mort-né. La reine ne la crut pas. Elle ne parla plus jamais à {roi}." },
    ] },
  { id: "chasse_heritier", type: "target", req: "adultSon", title: "La chasse", text: "{fils} part chasser le cerf avec l'héritier d'une maison rivale. Une flèche perdue est si vite arrivée. Ton maître-veneur a une très bonne vue, et une très mauvaise mémoire.",
    options: [
      { label: "Une flèche perdue", hint: "60 % : l'héritier de la maison choisie meurt. Sinon, tout le monde sait.", needsTarget: true, fx: [{ chance: 0.6, then: [{ target: [{ kill: "eldest", cause: "une flèche perdue à la chasse" }] }, { peur: 5 }], thenChron: "Une flèche perdue traversa la gorge de l'héritier de {cible}. Le maître-veneur pleura beaucoup.", else: [{ prestige: -3 }, { target: [{ colere: 5 }] }], elseChron: "La flèche manqua l'héritier de {cible} d'un pouce. Il vit très bien qui avait tiré." }], chron: "{fils} et l'héritier de {cible} partirent chasser ensemble." },
      { label: "Une vraie partie de chasse", hint: "Les deux héritiers deviennent amis : trêve de 2 manches.", needsTarget: true, fx: [{ treatyTarget: 2 }, { prestige: 1 }], chron: "{fils} et l'héritier de {cible} rentrèrent de la chasse avec un cerf et une amitié. Leurs pères s'en méfièrent." },
      { label: "Annuler la chasse", hint: "Rien ne se passe.", fx: [], chron: "{roi} annula la chasse. Le cerf vécut. L'héritier rival aussi." },
    ] },
];
