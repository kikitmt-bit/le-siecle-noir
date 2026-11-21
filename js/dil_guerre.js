// =====================================================================
//  DILEMMES — GUERRE, ÉGLISE, PEUPLE (solo et ciblés)
// =====================================================================
export const DIL_GUERRE = [
  { id: "deserteurs", type: "solo", title: "Les déserteurs", text: "Trente soldats ont déserté la garnison de {prov} avec leurs armes. On les a rattrapés dans une grange. Ils disent qu'ils n'étaient pas payés depuis cinq mois. C'est vrai.",
    options: [
      { label: "Les pendre tous", hint: "Personne ne désertera plus.", fx: [{ peur: 15 }, { armies: -1, where: "capital" }], chron: "Trente déserteurs furent pendus aux portes de {cap}. Leurs camarades furent payés le lendemain." },
      { label: "Les décimer : un sur dix", hint: "La vieille méthode romaine.", fx: [{ peur: 8 }, { armies: 1, where: "capital" }], chron: "{roi} fit tirer au sort les déserteurs : trois furent pendus, les autres rejoignirent les rangs en tremblant." },
      { label: "Les payer et les réintégrer", hint: "−3 or, +2 armées.", fx: [{ gold: -3 }, { armies: 2, where: "capital" }, { peur: -5 }], chron: "{roi} paya les déserteurs. Ils se battirent comme des lions, pour une fois." },
    ] },
  { id: "pillage", type: "solo", title: "Le pillage", text: "Tes soldats veulent piller un riche monastère de {prov}. Les moines ont de l'or, du vin, et des novices. Les capitaines disent que les hommes ont besoin de se défouler.",
    options: [
      { label: "Laisser piller", hint: "+5 or, l'Église hurle.", fx: [{ gold: 5 }, { prestige: -3 }, { colere: 5 }], chron: "Les soldats de {maison} pillèrent le monastère de {prov}. On entendit les cloches sonner, puis plus rien." },
      { label: "Interdire et punir les meneurs", hint: "La discipline avant tout.", fx: [{ peur: 5 }, { nextDice: -1 }], chron: "{roi} fit fouetter les meneurs. L'armée bouda la manche suivante." },
      { label: "Faire payer une « protection » au monastère", hint: "+3 or, tout le monde est content.", fx: [{ gold: 3 }], chron: "Le monastère de {prov} paya {maison} pour ne pas être pillé. Ce fut un excellent accord." },
    ] },
  { id: "siege_affamee", type: "solo", title: "La ville affamée", text: "Une ville rebelle de {prov} résiste depuis des mois. Les habitants ont chassé leurs bouches inutiles hors des murs : vieillards, femmes, enfants. Ils sont coincés entre la ville et ton camp.",
    options: [
      { label: "Les laisser mourir entre les lignes", hint: "La ville cédera plus vite.", fx: [{ peur: 15 }, { prestige: -2 }, { gold: 2 }], chron: "Les bouches inutiles de la ville rebelle moururent de faim entre les murs et le camp de {maison}. La ville se rendit." },
      { label: "Les laisser passer", hint: "Le siège durera plus longtemps.", fx: [{ prestige: 2 }, { armies: -1, where: "capital" }], chron: "{roi} laissa passer les affamés. Le siège dura encore un hiver." },
      { label: "Les nourrir et les catapulter de nouveau dans la ville", hint: "Plus de bouches à nourrir pour les assiégés.", fx: [{ peur: 20 }, { gold: 3 }, { epithet: "le Boucher" }], chron: "On renvoya les affamés par-dessus les murs à la catapulte. La ville se rendit en trois jours." },
    ] },
  { id: "chevaliers_errants", type: "solo", title: "Les chevaliers errants", text: "Une bande de cadets de famille, sans terres et sans un sou, offre ses lances. Ils sont braves, arrogants, et ont la fâcheuse habitude d'enlever des héritières.",
    options: [
      { label: "Les engager", hint: "+3 armées, quelques scandales.", fx: [{ armies: 3, where: "capital" }, { colere: 5 }], chron: "Les chevaliers errants rejoignirent {maison}. Trois héritières disparurent dans l'année." },
      { label: "Les envoyer harceler un rival", hint: "Ils pillent chez l'ennemi.", needsTarget: true, fx: [{ gold: -2 }, { target: [{ armies: -2, where: "random" }, { colere: 5 }] }], chron: "Les chevaliers errants, payés par {maison}, ravagèrent les terres de {cible}." },
      { label: "Les chasser", hint: "Qu'ils aillent voir ailleurs.", fx: [], chron: "{roi} chassa les chevaliers errants. Ils allèrent proposer leurs lances ailleurs." },
    ] },
  { id: "forteresse", type: "solo", req: "neighborStronger", title: "La frontière menacée", text: "Une armée voisine plus forte campe à ta frontière. Tes ingénieurs proposent de fortifier, tes généraux d'attaquer les premiers, ton chancelier de négocier.",
    options: [
      { label: "Fortifier", hint: "+3 armées dans la province menacée.", fx: [{ armies: 3, where: "border" }, { gold: -2 }], chron: "{maison} fortifia sa frontière en hâte. Les maçons travaillèrent jour et nuit." },
      { label: "Lever le ban et l'arrière-ban", hint: "+4 armées, la colère monte.", fx: [{ armies: 4, where: "border" }, { colere: 15 }], chron: "{roi} convoqua tous les hommes en âge de combattre." },
      { label: "Envoyer des présents au voisin", hint: "−3 or, +2 prestige.", fx: [{ gold: -3 }, { prestige: 2 }], chron: "{maison} envoya des présents somptueux au voisin menaçant, avec des sourires crispés." },
    ] },
  { id: "traitre_camp", type: "solo", title: "Le traître au camp", text: "Un capitaine a été surpris en train d'envoyer des lettres à l'ennemi. Il jure qu'il faisait semblant pour mieux tromper l'adversaire. C'est peut-être vrai.",
    options: [
      { label: "Le faire écarteler", hint: "Un exemple.", fx: [{ peur: 15 }, { armies: -1, where: "capital" }], chron: "Le capitaine traître fut écartelé devant l'armée. Personne n'écrivit plus de lettres." },
      { label: "Le croire et l'utiliser", hint: "Un agent double, c'est précieux. Ou mortel.", fx: [{ chance: 0.5, then: [{ intrigueBonus: 3 }, { nextDice: 1 }], thenChron: "Le capitaine disait vrai : ses fausses lettres trompèrent l'ennemi.", else: [{ armies: -3, where: "strongest" }], elseChron: "Le capitaine mentait : il livra les plans de {maison} et s'enfuit avec trois compagnies." }], chron: "{roi} laissa le capitaine poursuivre sa correspondance." },
      { label: "Le livrer à l'ennemi avec de fausses informations", hint: "L'ennemi croira tenir un espion.", fx: [{ intrigueBonus: 2 }], chron: "{maison} laissa s'échapper le traître avec de faux plans de bataille." },
    ] },
  { id: "dime_guerre", type: "solo", title: "La dîme de guerre", text: "Le pape autorise exceptionnellement {maison} à prélever la dîme sur les terres d'Église pour financer la guerre. À condition d'en reverser la moitié à Rome.",
    options: [
      { label: "Prélever et reverser honnêtement", hint: "+4 or, +1 prestige.", fx: [{ gold: 4 }, { prestige: 1 }], chron: "{maison} préleva la dîme de guerre et en reversa scrupuleusement la moitié à Rome." },
      { label: "Prélever et tout garder", hint: "+8 or. Rome finira par l'apprendre.", fx: [{ gold: 8 }, { chance: 0.5, then: [{ prestige: -5 }, { colere: 10 }], thenChron: "Rome apprit le détournement. {roi} fut excommunié en plein carême." }], chron: "{maison} préleva la dîme de guerre et oublia d'envoyer la part de Rome." },
      { label: "Refuser", hint: "Les moines te bénissent.", fx: [{ prestige: 2 }, { colere: -5 }], chron: "{roi} refusa de taxer l'Église. Les moines le comparèrent à Saint Louis." },
    ] },
  { id: "pape_avignon", type: "solo", title: "Les deux papes", text: "Il y a désormais deux papes, l'un à Rome, l'autre en Avignon. Chacun excommunie les partisans de l'autre. Il faut choisir un camp.",
    options: [
      { label: "Le pape d'Avignon", hint: "Il est proche, et il paie bien.", fx: [{ gold: 3 }, { flag: "avignon" }], chron: "{maison} reconnut le pape d'Avignon, qui envoya une bourse en remerciement." },
      { label: "Le pape de Rome", hint: "Le vrai, dit-on. Il est loin.", fx: [{ prestige: 3 }, { flag: "rome" }], chron: "{maison} resta fidèle au pape de Rome. Avignon la maudit aussitôt." },
      { label: "Les deux, selon l'humeur", hint: "Deux papes, deux fois plus d'indulgences.", fx: [{ gold: 2 }, { prestige: -2 }, { intrigueBonus: 1 }], chron: "{roi} écrivit aux deux papes des lettres également flatteuses." },
    ] },
  { id: "templiers", type: "solo", title: "L'or des Templiers", text: "Un vieux chevalier mourant affirme connaître l'emplacement d'une partie du trésor des Templiers, caché dans une crypte de {prov}. Il veut l'absolution en échange.",
    options: [
      { label: "L'absoudre et creuser", hint: "Trésor ou malédiction ?", fx: [{ chance: 0.5, then: [{ gold: 9 }], thenChron: "Les ouvriers trouvèrent des coffres de besants d'or dans la crypte de {prov}.", else: [{ health: 1 }, { colere: 3 }], elseChron: "La crypte ne contenait que des ossements. Trois ouvriers moururent de fièvre." }], chron: "On creusa sous une crypte de {prov} sur la foi d'un vieux Templier." },
      { label: "Le faire torturer pour plus de détails", hint: "Les mourants mentent parfois.", fx: [{ peur: 5 }, { chance: 0.5, then: [{ gold: 9 }], thenChron: "Sous la torture, le vieux chevalier livra le bon emplacement." }], chron: "Le vieux Templier mourut sous la torture, en maudissant {maison}." },
      { label: "Le livrer au roi de France", hint: "+3 prestige, pas d'or.", fx: [{ prestige: 3 }], chron: "{maison} livra le vieux Templier au roi de France, qui le fit brûler." },
    ] },
  { id: "jacques_bonhomme", type: "solo", req: "colereHigh", title: "Jacques Bonhomme", text: "Un meneur paysan, que tout le monde appelle Jacques Bonhomme, rassemble des milliers d'hommes en {prov}. Il demande l'abolition des corvées. Il a l'air de savoir se battre.",
    options: [
      { label: "Accepter ses demandes", hint: "La colère retombe, la noblesse enrage.", fx: [{ colere: -25 }, { prestige: -2 }, { gold: -2 }], chron: "{roi} abolit les corvées en {prov}. Les autres seigneurs le traitèrent de traître à sa classe." },
      { label: "L'inviter à négocier, puis l'arrêter", hint: "Une parole de roi, ça se reprend.", fx: [{ colere: 10 }, { peur: 15 }, { epithet: "le Parjure" }], chron: "Jacques Bonhomme vint négocier sous sauf-conduit. Il fut couronné d'un trépied de fer rougi." },
      { label: "L'enrôler avec ses hommes", hint: "+5 armées, des alliés dangereux.", fx: [{ armies: 5, where: "capital" }, { colere: -5 }, { chain: "jacques_revient", delay: 3 }], chron: "Jacques Bonhomme et ses paysans rejoignirent l'armée de {maison}." },
    ] },
  { id: "jacques_revient", type: "solo", chainOnly: true, title: "Le prix de Jacques", text: "Jacques Bonhomme a combattu pour toi. Maintenant il veut sa récompense : des terres pour ses paysans, et un titre de noblesse pour lui.",
    options: [
      { label: "L'anoblir", hint: "Une province devient la sienne (neutre), le peuple t'adore.", fx: [{ loseProvince: "random" }, { colere: -20 }, { prestige: -1 }], chron: "Jacques Bonhomme devint le sire de Bonhomme. Les nobles vomirent à la cérémonie." },
      { label: "Le faire assassiner", hint: "La colère reviendra, plus forte.", fx: [{ colere: 25 }, { peur: 10 }], chron: "Jacques Bonhomme fut retrouvé poignardé. Ses paysans mirent le feu à trois châteaux." },
    ] },
  { id: "inquisiteur", type: "solo", title: "L'inquisiteur", text: "Un inquisiteur dominicain est arrivé à {cap} avec une liste de suspects. Elle contient des bourgeois, deux chanoines, et ta propre sœur.",
    options: [
      { label: "Le laisser faire son travail", hint: "L'Église te bénit. Ta sœur, moins.", fx: [{ prestige: 2 }, { peur: 10 }, { familyDeaths: 1 }], chron: "L'inquisiteur fit brûler une douzaine de suspects à {cap}, dont la sœur du roi. Elle jura jusqu'au bout." },
      { label: "Le payer pour qu'il déchire la liste", hint: "−4 or.", fx: [{ gold: -4 }], chron: "La liste de l'inquisiteur brûla dans la cheminée de {roi}. L'inquisiteur partit plus lourd." },
      { label: "L'envoyer chez un rival", hint: "Il a sûrement des suspects là-bas aussi.", needsTarget: true, fx: [{ target: [{ peur: 10 }, { colere: 10 }, { prestige: -1 }] }], chron: "{maison} recommanda chaudement l'inquisiteur à la cour de {cible}." },
    ] },
  { id: "pogrom_sorcieres", type: "solo", title: "La chasse aux sorcières", text: "On accuse les femmes du village de {prov} de faire tourner le lait et mourir les vaches. Le curé a déjà préparé le bois.",
    options: [
      { label: "Laisser brûler", hint: "Le peuple est rassuré.", fx: [{ colere: -10 }, { peur: 5 }, { prestige: -1 }], chron: "Onze femmes brûlèrent en {prov}. Les vaches continuèrent de mourir." },
      { label: "Interdire et pendre le curé", hint: "L'Église n'aimera pas.", fx: [{ prestige: -2 }, { colere: 5 }, { peur: 5 }], chron: "{roi} fit pendre le curé qui voulait brûler les sorcières. Le pape s'en offusqua." },
      { label: "Ouvrir une enquête", hint: "Une sorcière, ça se recrute.", fx: [{ intrigueBonus: 1 }, { colere: 3 }], chron: "L'enquête de {maison} innocenta les femmes, sauf une, qui entra discrètement au service du roi." },
    ] },
  { id: "mercenaires_genois", type: "solo", title: "Les arbalétriers génois", text: "Une compagnie d'arbalétriers génois, les meilleurs d'Europe, offre ses services. Leur capitaine exige d'être payé d'avance, en or, et en totalité.",
    options: [
      { label: "Payer d'avance", hint: "−6 or, +5 armées.", fx: [{ gold: -6 }, { armies: 5, where: "border" }], chron: "{maison} engagea les arbalétriers génois. Ils coûtaient une fortune et tiraient comme le diable." },
      { label: "Payer la moitié et promettre le reste", hint: "−3 or, +5 armées… et une trahison possible.", fx: [{ gold: -3 }, { armies: 5, where: "border" }, { chain: "genois_paie", delay: 2 }], chron: "{roi} paya la moitié des Génois et jura sur l'Évangile de payer le reste." },
      { label: "Refuser", hint: "Ils iront chez un rival.", fx: [{ others: [{ armies: 1, where: "random" }] }], chron: "{roi} refusa les arbalétriers génois, qui allèrent se vendre aux voisins." },
    ] },
  { id: "genois_paie", type: "solo", chainOnly: true, title: "La seconde moitié", text: "Les Génois réclament le reste de leur solde. Leur capitaine a fait pointer toutes les arbalètes vers le donjon de {cap}, par précaution.",
    options: [
      { label: "Payer", hint: "−4 or.", fx: [{ gold: -4 }], chron: "{maison} paya les Génois. Les arbalètes se baissèrent." },
      { label: "Les massacrer dans leur sommeil", hint: "Plus de Génois, plus de dette.", fx: [{ armies: -3, where: "border" }, { peur: 10 }, { prestige: -2 }], chron: "Les Génois furent égorgés dans leurs tentes. Plus jamais un mercenaire ne servit {maison}." },
      { label: "Les laisser partir chez l'ennemi", hint: "Ils emportent leurs arbalètes.", fx: [{ armies: -5, where: "border" }], chron: "Les Génois, impayés, passèrent à l'ennemi avec armes et bagages." },
    ] },
  { id: "pont", type: "solo", title: "Le pont de pierre", text: "Le pont qui relie {prov} au reste de tes terres menace de s'effondrer. Le maître d'œuvre dit qu'il faut le reconstruire, et qu'un enfant emmuré dans les fondations assure la solidité d'un pont pour mille ans.",
    options: [
      { label: "Reconstruire, avec l'enfant", hint: "La tradition, c'est la tradition.", fx: [{ gold: -3 }, { colere: 10 }, { peur: 5 }, { armies: 1, where: "capital" }], chron: "Le nouveau pont de {prov} fut béni par l'évêque. Personne ne parla de ce qu'il y avait dans les fondations." },
      { label: "Reconstruire, sans l'enfant", hint: "La superstition, c'est pour les paysans.", fx: [{ gold: -3 }, { chance: 0.3, then: [{ armies: -2, where: "capital" }], thenChron: "Le pont de {prov} s'effondra au passage de l'armée. Les paysans hochèrent la tête." }], chron: "{roi} fit reconstruire le pont de {prov} sans sacrifice." },
      { label: "Laisser le pont s'effondrer", hint: "Économique.", fx: [{ nextDice: -1 }], chron: "Le pont de {prov} s'effondra. Les armées de {maison} durent faire le grand tour." },
    ] },
  { id: "hiver_camp", type: "solo", req: "big", title: "L'empire trop grand", text: "Tes terres sont vastes, trop vastes. Les gouverneurs de province n'obéissent plus qu'à moitié, et certains frappent déjà leur propre monnaie.",
    options: [
      { label: "Envoyer des inspecteurs royaux", hint: "−3 or, l'ordre revient.", fx: [{ gold: -3 }, { peur: 5 }], chron: "Les inspecteurs de {maison} sillonnèrent les provinces. Quelques gouverneurs furent pendus." },
      { label: "Laisser les gouverneurs faire", hint: "+3 or de pots-de-vin, mais une province risque de faire sécession.", fx: [{ gold: 3 }, { chance: 0.4, then: [{ loseProvince: "random" }], thenChron: "Un gouverneur de {maison} se proclama seigneur indépendant." }], chron: "{roi} laissa ses gouverneurs gouverner." },
      { label: "Marier tes enfants aux gouverneurs", hint: "La famille, ça lie.", fx: [{ removePerson: "youngest", cause: "marié à un gouverneur" }, { armies: 2, where: "capital" }], chron: "{roi} maria un de ses enfants à un gouverneur ambitieux." },
    ] },
  { id: "petit_royaume", type: "solo", req: "small", title: "Le petit royaume", text: "{maison} ne tient plus qu'une poignée de provinces. Un vieux conseiller propose une ruse : faire croire que tu es plus puissante que tu ne l'es.",
    options: [
      { label: "Faire défiler les mêmes soldats trois fois", hint: "Les espions ennemis comptent triple.", fx: [{ peur: 15 }, { prestige: 1 }], chron: "Les mêmes soldats de {maison} défilèrent trois fois sous les remparts. Les espions comptèrent une armée immense." },
      { label: "Prendre une province neutre voisine par surprise", hint: "Un petit coup, mais un coup.", fx: [{ gainNeutral: true }], chron: "{maison} s'empara par surprise d'une province voisine sans maître." },
      { label: "Se faire oublier", hint: "La colère et la peur retombent.", fx: [{ colere: -10 }, { peur: -10 }], chron: "{maison} se fit discrète. Les autres l'oublièrent presque." },
    ] },
  { id: "foire", type: "solo", title: "La grande foire", text: "Les marchands de Flandre, d'Italie et de Champagne veulent tenir une grande foire à {cap}. Ils demandent des privilèges : pas de taxes, pas de pillage, et une garde.",
    options: [
      { label: "Accorder tous les privilèges", hint: "+4 or aujourd'hui, +1 or par manche (marchands fidèles).", fx: [{ gold: 4 }, { flag: "foire" }], chron: "La grande foire de {cap} attira des marchands de toute l'Europe. On y vendait même des épices d'Orient." },
      { label: "Accepter, puis taxer quand même", hint: "+7 or, une seule fois.", fx: [{ gold: 7 }, { prestige: -2 }], chron: "{roi} taxa la foire malgré sa parole. Les marchands ne revinrent jamais." },
      { label: "Refuser", hint: "Pas de marchands, pas d'ennuis.", fx: [], chron: "{roi} refusa la foire. Elle alla s'installer chez un voisin." },
    ] },
  { id: "eveque_guerrier", type: "solo", title: "L'évêque guerrier", text: "L'évêque de {cap} possède sa propre armée. Il frappe avec une masse d'armes, car l'Église interdit aux clercs de verser le sang. Il propose une alliance… contre une part du butin.",
    options: [
      { label: "Accepter l'alliance", hint: "+3 armées, l'évêque aura son mot à dire.", fx: [{ armies: 3, where: "capital" }, { prestige: 1 }], chron: "L'évêque de {cap} rejoignit la guerre, masse d'armes à la main et bénédictions à la bouche." },
      { label: "Lui confisquer son armée", hint: "+4 armées, excommunication possible.", fx: [{ armies: 4, where: "capital" }, { chance: 0.5, then: [{ prestige: -4 }], thenChron: "L'évêque excommunia {roi} du haut de sa chaire, avant de fuir à Rome." }], chron: "{roi} fit désarmer l'évêque et enrôler ses hommes." },
      { label: "Le nommer cardinal pour s'en débarrasser", hint: "−3 or, il part à Rome.", fx: [{ gold: -3 }, { prestige: 2 }], chron: "{maison} acheta un chapeau de cardinal pour l'évêque de {cap}, qui partit à Rome ravi." },
    ] },
  { id: "rancon_noble", type: "target", title: "Le prisonnier de marque", text: "Tes soldats ont capturé un cousin d'une maison rivale lors d'une escarmouche. Il dit valoir une fortune. Sa famille dit le contraire.",
    options: [
      { label: "Exiger une rançon", hint: "Choisis la maison : elle te paie 4 or.", needsTarget: true, fx: [{ steal: 4 }], chron: "{maison} rendit à {cible} son cousin, contre une lourde rançon." },
      { label: "Le renvoyer mutilé", hint: "La maison choisie apprend la peur.", needsTarget: true, fx: [{ peur: 10 }, { target: [{ colere: 5 }, { prestige: -1 }] }], chron: "{maison} renvoya à {cible} son cousin, sans ses mains." },
      { label: "En faire un ami", hint: "Le cousin te renseignera sur les siens.", needsTarget: true, fx: [{ intrigueBonus: 2 }, { prestige: 1 }], chron: "Le cousin de {cible} fut traité en invité à {cap}. Il devint très bavard." },
    ] },
  { id: "eau_empoisonnee", type: "target", title: "Les puits", text: "Tes espions peuvent jeter des charognes dans les puits d'une ville ennemie. Le choléra fera le reste. Personne ne saura qui l'a fait.",
    options: [
      { label: "Empoisonner les puits", hint: "La maison choisie perd des armées. Anonyme.", needsTarget: true, anon: true, anonChron: "Les puits de la capitale de {cible} furent empoisonnés. On parla d'une malédiction.", fx: [{ target: [{ armies: -3, where: "capital" }, { colere: 10 }] }], chron: "" },
      { label: "Refuser", hint: "Il y a des limites. Paraît-il.", fx: [{ prestige: 1 }], chron: "{roi} refusa d'empoisonner les puits." },
    ] },
  { id: "incendie", type: "target", title: "L'incendiaire", text: "Un homme qui aime un peu trop le feu propose ses services. Il peut faire brûler le grenier d'une capitale rivale, et on accusera la foudre.",
    options: [
      { label: "Brûler le grenier", hint: "La maison choisie perd 4 or. Anonyme.", needsTarget: true, anon: true, anonChron: "Le grenier de la capitale de {cible} brûla une nuit d'orage. Il ne pleuvait pas.", fx: [{ gold: -1 }, { target: [{ gold: -4 }, { colere: 8 }] }], chron: "" },
      { label: "Le livrer au bourreau", hint: "+1 prestige.", fx: [{ prestige: 1 }], chron: "L'incendiaire fut brûlé. Il sembla presque apprécier." },
    ] },
  { id: "faux_heritier", type: "target", title: "Le faux héritier", text: "Un jeune homme prétend être le fils légitime d'un roi rival, enlevé à la naissance. Il est très convaincant. Il ne lui manque qu'une armée.",
    options: [
      { label: "Soutenir sa revendication", hint: "−3 or. La maison choisie s'enfonce dans le chaos.", needsTarget: true, fx: [{ gold: -3 }, { target: [{ colere: 15 }, { armies: -2, where: "random" }] }], chron: "{maison} arma un prétendant au trône de {cible}. Les barons de {cible} choisirent leur camp." },
      { label: "Le vendre à la maison concernée", hint: "Elle te paie pour le récupérer.", needsTarget: true, fx: [{ steal: 3 }, { target: [{ peur: 5 }] }], chron: "{maison} vendit le prétendant à {cible}, qui le fit disparaître." },
      { label: "Le chasser", hint: "Rien ne se passe.", fx: [], chron: "Le prétendant fut chassé de {cap}, et alla raconter son histoire ailleurs." },
    ] },
  { id: "espionne", type: "target", title: "La courtisane", text: "La plus belle courtisane de Paris propose de s'installer à la cour d'un roi rival. Elle ne demande que des bijoux, et elle rapportera tout ce qui se dit sur l'oreiller.",
    options: [
      { label: "L'envoyer chez un rival", hint: "−3 or, +3 aux intrigues… et peut-être un bâtard chez eux.", needsTarget: true, fx: [{ gold: -3 }, { intrigueBonus: 3 }, { chance: 0.4, then: [{ seduceTarget: true }], thenChron: "Neuf mois plus tard, la courtisane donna un fils au roi de {cible}. Elle l'éleva aux couleurs de {maison}." }], chron: "Une courtisane envoyée par {maison} s'installa à la cour de {cible}." },
      { label: "La garder pour {roi}", hint: "Le roi est ravi. La reine moins.", fx: [{ colere: -3 }, { prestige: -1 }, { chance: 0.4, then: [{ addChild: 1, bastard: true }] }], chron: "La courtisane resta à {cap}, dans les appartements du roi." },
    ] },
  { id: "pretendant_fille", type: "target", req: "adultDaughter", title: "L'enlèvement", text: "{fille} a été enlevée par un chevalier d'une maison rivale. Selon la coutume, s'il passe trois nuits avec elle, le mariage est valide. C'est la deuxième nuit.",
    options: [
      { label: "Accepter le mariage", hint: "Choisis la maison du ravisseur : vous êtes alliés.", needsTarget: true, fx: [{ marryTarget: true }, { prestige: -2 }], chron: "{fille} fut mariée de force à un chevalier de {cible}. Les deux maisons devinrent alliées, sans joie." },
      { label: "Lancer une expédition punitive", hint: "La maison choisie perd des armées, ta fille revient.", needsTarget: true, fx: [{ armies: -1, where: "capital" }, { target: [{ armies: -2, where: "random" }] }, { prestige: 2 }], chron: "Les chevaliers de {maison} ramenèrent {fille} et la tête de son ravisseur, de chez {cible}." },
      { label: "La laisser où elle est", hint: "Une bouche de moins à nourrir.", fx: [{ removePerson: "daughter", cause: "enlevée par un chevalier" }, { prestige: -3 }], chron: "{roi} ne fit rien pour sa fille enlevée. Toute la France en parla." },
    ] },
  { id: "bataille_honneur", type: "target", title: "Le défi chevaleresque", text: "Un roi rival t'a traité de lâche devant ses chevaliers. Selon l'honneur, il faut répondre : un combat de trente chevaliers contre trente, en champ clos.",
    options: [
      { label: "Relever le défi", hint: "Pile ou face : la gloire ou la honte.", needsTarget: true, fx: [{ chance: 0.5, then: [{ prestige: 4 }, { target: [{ prestige: -2 }] }], thenChron: "Le combat des Trente tourna à l'avantage de {maison}. {cible} rentra la tête basse.", else: [{ prestige: -2 }, { armies: -1, where: "capital" }, { target: [{ prestige: 3 }] }], elseChron: "Le combat des Trente fut un massacre pour {maison}. {cible} se pavana des mois durant." }], chron: "Trente chevaliers de {maison} affrontèrent trente chevaliers de {cible}." },
      { label: "Ignorer l'insulte", hint: "−1 prestige.", fx: [{ prestige: -1 }], chron: "{roi} ignora l'insulte. Ses chevaliers ne le lui pardonnèrent pas." },
      { label: "Répondre par une chanson grivoise", hint: "Les ménestrels font le reste.", needsTarget: true, fx: [{ target: [{ prestige: -2 }] }, { colere: -3 }], chron: "Les ménestrels de {maison} composèrent une chanson sur la virilité du roi de {cible}. Elle fit le tour de la France." },
    ] },
  { id: "corbeau", type: "target", title: "Les lettres anonymes", text: "Ton secrétaire imite à la perfection toutes les écritures. Une lettre anonyme bien placée pourrait convaincre une maison qu'un de ses enfants complote contre son roi.",
    options: [
      { label: "Semer la discorde chez un rival", hint: "La maison choisie risque de tuer un de ses propres enfants. Anonyme.", needsTarget: true, anon: true, anonChron: "Une lettre anonyme convainquit le roi de {cible} que son enfant complotait. Le sang coula dans la famille.", fx: [{ target: [{ chance: 0.5, then: [{ kill: "random_child", cause: "exécuté sur une fausse accusation" }], else: [{ colere: 10 }] }] }], chron: "" },
      { label: "Brûler la plume", hint: "+1 prestige.", fx: [{ prestige: 1 }], chron: "{roi} interdit les lettres anonymes à sa cour." },
    ] },
  { id: "rumeur_peste", type: "target", title: "La fausse peste", text: "Faire croire qu'une ville ennemie est frappée par la peste, et plus aucun marchand n'y entrera. Il suffit de quelques cadavres peints de taches noires.",
    options: [
      { label: "Lancer la rumeur", hint: "La maison choisie perd 3 or et sa population panique.", needsTarget: true, fx: [{ target: [{ gold: -3 }, { colere: 8 }] }], chron: "Les agents de {maison} firent croire que la capitale de {cible} avait la peste. Les marchands fuirent." },
      { label: "Ne rien faire", hint: "Rien ne se passe.", fx: [], chron: "{roi} renonça à la fausse peste." },
    ] },
  { id: "reliques_volees", type: "target", title: "Le vol des reliques", text: "La cathédrale d'une capitale rivale abrite le crâne d'un saint qui attire des milliers de pèlerins. Tes moines pourraient le voler une nuit de Pâques.",
    options: [
      { label: "Voler les reliques", hint: "+3 prestige pour toi, −3 pour la maison choisie.", needsTarget: true, fx: [{ prestige: 3 }, { target: [{ prestige: -3 }, { colere: 5 }] }, { chance: 0.3, then: [{ prestige: -5 }], thenChron: "Les moines voleurs furent pris. {maison} fut accusée de sacrilège." }], chron: "Les moines de {maison} volèrent le crâne d'un saint chez {cible}." },
      { label: "Ne rien faire", hint: "Rien ne se passe.", fx: [], chron: "{roi} laissa les reliques où elles étaient." },
    ] },
];
