// =====================================================================
//  DILEMMES — INTRIGUES, LIAISONS, SITUATIONS (solo et ciblés)
// =====================================================================
export const DIL_INTRIGUES = [
  { id: "amant_reine_rivale", type: "target", title: "L'amant de la reine", text: "Un jeune troubadour de ta cour prétend être l'amant d'une reine rivale. Il en a les preuves : une mèche de cheveux et une lettre très détaillée.",
    options: [
      { label: "Le renvoyer auprès d'elle", hint: "Un bâtard à tes couleurs pourrait naître chez la maison choisie.", needsTarget: true, fx: [{ chance: 0.5, then: [{ seduceTarget: true }], thenChron: "Neuf mois plus tard, la reine de {cible} accoucha d'un enfant qui chantait déjà juste." }], chron: "Un troubadour envoyé par {maison} retourna chanter sous les fenêtres de la reine de {cible}." },
      { label: "Publier la lettre", hint: "La maison choisie est humiliée.", needsTarget: true, fx: [{ target: [{ prestige: -3 }, { colere: 5 }] }], chron: "{maison} fit lire en place publique la lettre d'amour de la reine de {cible}. On rit jusqu'en Navarre." },
      { label: "Faire chanter la maison concernée", hint: "Elle te paie pour ton silence.", needsTarget: true, fx: [{ steal: 4 }], chron: "{cible} paya cher pour que la lettre de sa reine reste dans les coffres de {maison}." },
    ] },
  { id: "eunuque_espion", type: "target", title: "Le maître des espions", text: "Un ancien eunuque de la cour de Byzance propose ses services. Il a des oreilles dans toutes les cours, des rossignols et des petits oiseaux.",
    options: [
      { label: "L'engager", hint: "−3 or, +3 aux intrigues.", fx: [{ gold: -3 }, { intrigueBonus: 3 }], chron: "Un étrange maître des espions s'installa à la cour de {maison}. Il parlait très doucement." },
      { label: "Lui demander les secrets d'une maison rivale", hint: "Tu découvres ses objectifs secrets.", needsTarget: true, fx: [{ gold: -2 }, { spyObjectives: true }], chron: "Le maître des espions de {maison} révéla les ambitions secrètes de {cible}." },
      { label: "Le faire tuer : un tel homme sert tout le monde", hint: "+1 prestige.", fx: [{ prestige: 1 }, { peur: 3 }], chron: "Le maître des espions fut retrouvé dans la Seine. On ne sut jamais pour qui il travaillait." },
    ] },
  { id: "philtre", type: "target", title: "Le philtre d'amour", text: "Une vieille femme vend un philtre d'amour. Versé dans la coupe d'un héritier rival, il le rendra fou amoureux de ta fille. Ou il le tuera. Les effets varient.",
    options: [
      { label: "Verser le philtre", hint: "Mariage forcé avec la maison choisie… ou un mort.", needsTarget: true, fx: [{ chance: 0.5, then: [{ marryTarget: true }], thenChron: "L'héritier de {cible} tomba éperdument amoureux d'une fille de {maison}. Les deux maisons furent unies malgré elles.", else: [{ target: [{ kill: "eldest", cause: "un philtre d'amour mal dosé" }] }], elseChron: "Le philtre était mal dosé. L'héritier de {cible} mourut en déclarant sa flamme à une chèvre." }], chron: "{maison} fit verser un philtre d'amour dans la coupe de l'héritier de {cible}." },
      { label: "Le boire toi-même, pour la reine", hint: "Le roi aime de nouveau sa femme.", fx: [{ chance: 0.6, then: [{ addChild: 1 }], thenChron: "Le philtre fonctionna : le roi et la reine eurent un nouvel enfant.", else: [{ health: 1 }], elseChron: "Le philtre rendit le roi malade comme un chien." }], chron: "{roi} but le philtre d'amour." },
    ] },
  { id: "nuit_noces", type: "target", title: "La nuit de noces", text: "Une maison rivale célèbre un mariage. Tu es invité. La coutume veut que les invités dorment au château. Tes hommes aussi. Armés.",
    options: [
      { label: "Les noces rouges", hint: "Massacre : la maison choisie perd des armées et un membre de sa famille. Tu deviens un paria.", needsTarget: true, fx: [{ target: [{ armies: -4, where: "capital" }, { kill: "random_child", cause: "égorgé pendant les noces rouges" }] }, { prestige: -6 }, { peur: 25 }, { epithet: "le Boucher" }, { betrayal: true }], chron: "Pendant les noces, les hommes de {maison} égorgèrent la famille de {cible} entre deux chansons. Les musiciens continuèrent de jouer." },
      { label: "Danser et se faire des amis", hint: "+2 prestige, et une trêve avec la maison choisie.", needsTarget: true, fx: [{ prestige: 2 }, { treatyTarget: 2 }], chron: "{roi} dansa toute la nuit aux noces de {cible}. Une trêve fut signée au petit matin." },
      { label: "Séduire la mariée", hint: "Un bâtard possible chez la maison choisie, un scandale assuré.", needsTarget: true, fx: [{ prestige: -2 }, { chance: 0.5, then: [{ seduceTarget: true }] }], chron: "On surprit {roi} dans la chambre nuptiale de {cible}, avant le marié." },
    ] },
  { id: "maitresse_rivale", type: "target", title: "La maîtresse du rival", text: "La maîtresse d'un roi rival est prête à trahir son amant. Elle veut de l'or, un titre, et la tête de la reine de son amant.",
    options: [
      { label: "L'acheter", hint: "−4 or, tu sais tout de ses plans (+1 dé).", needsTarget: true, fx: [{ gold: -4 }, { nextDice: 1 }, { spyObjectives: true }], chron: "La maîtresse du roi de {cible} se mit à écrire à {maison} chaque semaine." },
      { label: "Lui fournir le poison pour la reine", hint: "La reine de la maison choisie meurt peut-être. Anonyme.", needsTarget: true, anon: true, anonChron: "La reine de {cible} mourut subitement. Sa rivale porta le deuil en rouge.", fx: [{ target: [{ chance: 0.6, then: [{ kill: "queen", cause: "empoisonnée par la maîtresse du roi" }] }] }], chron: "" },
      { label: "Prévenir la reine concernée", hint: "La maison choisie te doit une faveur : trêve.", needsTarget: true, fx: [{ treatyTarget: 3 }, { prestige: 1 }], chron: "{maison} prévint la reine de {cible} du complot de la maîtresse. Une trêve fut signée." },
    ] },
  { id: "pretre_bavard", type: "target", title: "Le secret de confession", text: "Un prêtre ivre raconte à ton espion ce que le roi d'une maison rivale lui a confessé. C'est énorme. C'est inavouable. C'est exploitable.",
    options: [
      { label: "Le faire savoir à toute la France", hint: "−4 prestige pour la maison choisie.", needsTarget: true, fx: [{ target: [{ prestige: -4 }] }, { prestige: -1 }], chron: "Les péchés confessés du roi de {cible} furent connus de tout le royaume. {maison} jura n'y être pour rien." },
      { label: "Le garder comme arme", hint: "La maison choisie te verse 3 or.", needsTarget: true, fx: [{ steal: 3 }], chron: "{cible} paya {maison} pour qu'un certain secret de confession reste secret." },
      { label: "Brûler le prêtre", hint: "Le secret meurt avec lui. +1 prestige.", fx: [{ prestige: 1 }, { peur: 3 }], chron: "Le prêtre bavard fut brûlé pour violation du secret de confession." },
    ] },
  { id: "jumelles", type: "target", title: "La fiancée remplacée", text: "Une maison rivale attend une princesse étrangère pour la marier à son héritier. Ta propre fille lui ressemble étrangement. Et personne là-bas n'a jamais vu la vraie princesse.",
    options: [
      { label: "Substituer ta fille", hint: "Mariage avec la maison choisie, et un espion dans son lit.", needsTarget: true, fx: [{ marryTarget: true }, { intrigueBonus: 3 }], chron: "Une fausse princesse épousa l'héritier de {cible}. Elle écrivait souvent à sa vraie famille, {maison}." },
      { label: "Faire enlever la vraie princesse et exiger une rançon", hint: "La maison choisie paie.", needsTarget: true, fx: [{ steal: 5 }, { prestige: -2 }], chron: "La princesse promise à {cible} fut enlevée en route. {maison} toucha la rançon par des chemins détournés." },
    ] },
  { id: "revolte_payee", type: "target", title: "Les agitateurs", text: "Des agitateurs professionnels proposent de soulever les paysans d'une maison rivale. Ils ont de l'expérience : trois jacqueries réussies en Flandre.",
    options: [
      { label: "Payer les agitateurs", hint: "−3 or, la colère explose chez la maison choisie.", needsTarget: true, fx: [{ gold: -3 }, { target: [{ colere: 25 }] }], chron: "Des agitateurs payés par {maison} soulevèrent les paysans de {cible}." },
      { label: "Les livrer à la maison menacée", hint: "Elle te remercie : trêve de 2 manches.", needsTarget: true, fx: [{ treatyTarget: 2 }, { prestige: 1 }], chron: "{maison} livra les agitateurs à {cible}, qui les pendit et signa une trêve." },
    ] },
  { id: "dote_empoisonnee", type: "target", req: "hasAlly", title: "La belle-famille", text: "Ta belle-famille devient trop puissante. Ton chancelier rappelle que les alliances par mariage ne durent qu'aussi longtemps que les époux sont vivants.",
    options: [
      { label: "Faire disparaître ton propre gendre", hint: "Plus d'alliance, plus d'obligation. Trahison si on l'apprend.", fx: [{ breakAllAlliances: true }, { chance: 0.4, then: [{ prestige: -5 }, { epithet: "le Traître" }], thenChron: "On découvrit la vérité sur la mort du gendre. {maison} fut traitée de traîtresse dans toute la France." }], chron: "Le gendre de {roi} mourut d'une fièvre soudaine. L'alliance mourut avec lui." },
      { label: "Renforcer les liens", hint: "+2 or, +1 prestige.", fx: [{ gold: 2 }, { prestige: 1 }], chron: "{maison} renforça ses liens avec sa belle-famille par de somptueux cadeaux." },
    ] },
  { id: "poison_lent", type: "target", title: "Le poison lent", text: "Un apothicaire italien vend un poison qui ne tue pas : il rend malade, lentement, pendant des années. Un roi rival qui s'affaiblit, c'est une succession qui approche.",
    options: [
      { label: "Empoisonner lentement un roi rival", hint: "Sa santé s'effondre. Anonyme.", needsTarget: true, anon: true, anonChron: "Le roi de {cible} se mit à dépérir sans que ses médecins comprennent pourquoi.", fx: [{ gold: -2 }, { target: [{ health: 2 }] }], chron: "" },
      { label: "Acheter l'antidote, par précaution", hint: "−2 or, ton roi va mieux.", fx: [{ gold: -2 }, { health: -1 }], chron: "{roi} acheta l'antidote de l'apothicaire italien. On ne sait jamais." },
    ] },
  { id: "chantage_batard", type: "solo", req: "receivedBastard", title: "L'enfant qui ne te ressemble pas", text: "Ton enfant {batard_recu} ne te ressemble pas du tout. Il ressemble en revanche énormément à un certain seigneur d'une maison rivale. Toute la cour l'a remarqué. Toi aussi, enfin.",
    options: [
      { label: "Le déshériter et l'envoyer au couvent", hint: "La revendication adverse s'éteint.", fx: [{ removeBastardRecu: true }, { prestige: -1 }], chron: "{roi} envoya au couvent l'enfant qui ne lui ressemblait pas." },
      { label: "Faire comme si de rien n'était", hint: "Il reste dans la succession…", fx: [{ prestige: -2 }], chron: "{roi} fit semblant de ne rien remarquer. On l'appela dans son dos le cocu magnifique." },
      { label: "Le faire disparaître", hint: "Un accident est si vite arrivé.", fx: [{ killBastardRecu: true }, { peur: 10 }], chron: "L'enfant qui ne ressemblait pas au roi se noya dans un bassin du jardin." },
    ] },
  { id: "deuil_royal", type: "solo", req: "kingOld", title: "Le testament", text: "{roi} sent la fin approcher et veut dicter son testament. Le chancelier, la reine et l'héritier se disputent déjà autour du lit. Le notaire attend, la plume en l'air.",
    options: [
      { label: "Tout léguer à l'héritier", hint: "Succession claire.", fx: [{ prestige: 1 }, { colere: -5 }], chron: "{roi} légua tout à {heritier}. Les cadets claquèrent les portes." },
      { label: "Partager le royaume entre les enfants", hint: "Chacun sa part. Chacun ses ambitions.", fx: [{ colere: 10 }, { armies: 2, where: "capital" }], chron: "{roi} partagea son héritage entre tous ses enfants. Ils commencèrent à s'armer avant les funérailles." },
      { label: "Léguer une fortune à l'Église pour le salut de ton âme", hint: "−5 or, +4 prestige.", fx: [{ gold: -5 }, { prestige: 4 }], chron: "{roi} légua une fortune à l'Église. Mille messes furent dites pour le salut de son âme." },
    ] },
  { id: "fin_proche", type: "solo", req: "late", title: "Les dernières années", text: "Les années passent et le temps presse. Ton chancelier, un vieillard chauve et rusé, propose un dernier coup de dés.",
    options: [
      { label: "Tout miser sur l'armée", hint: "+5 armées, −5 or.", fx: [{ armies: 5, where: "border" }, { gold: -5 }], chron: "{maison} vida son trésor pour lever une dernière grande armée." },
      { label: "Tout miser sur la gloire", hint: "+3 prestige, −4 or.", fx: [{ prestige: 3 }, { gold: -4 }], chron: "{maison} dépensa sans compter pour sa gloire, en vue de la postérité." },
      { label: "Tout miser sur la ruse", hint: "+2 dés la prochaine manche.", fx: [{ nextDice: 2 }, { colere: 10 }], chron: "Le chancelier de {maison} prépara un dernier plan tortueux." },
    ] },
  { id: "debut_ambition", type: "solo", req: "early", title: "Les premières années", text: "Ton règne commence. Tes conseillers ne s'accordent pas sur la direction à prendre : la richesse, la guerre ou les alliances.",
    options: [
      { label: "La richesse", hint: "+5 or.", fx: [{ gold: 5 }], chron: "{roi} commença son règne en remplissant ses coffres." },
      { label: "La guerre", hint: "+3 armées.", fx: [{ armies: 3, where: "border" }], chron: "{roi} commença son règne en levant des troupes." },
      { label: "Les alliances", hint: "+2 prestige, et une trêve avec une maison rivale.", needsTarget: true, fx: [{ prestige: 2 }, { treatyTarget: 3 }], chron: "{roi} commença son règne en envoyant des ambassades chez {cible}." },
    ] },
  { id: "ecuyer_ambitieux", type: "solo", title: "L'écuyer ambitieux", text: "Un jeune écuyer de basse naissance a sauvé la vie de {roi} à la chasse. Il est beau, intelligent, ambitieux, et toutes les dames de la cour lui font les yeux doux. Y compris {fille_ou_reine}.",
    options: [
      { label: "L'anoblir et le marier à une fille de la maison", hint: "+2 armées, un gendre qui doit tout au roi.", fx: [{ removePerson: "daughter", cause: "mariée à l'écuyer anobli" }, { armies: 2, where: "capital" }], chron: "{roi} anoblit l'écuyer qui lui avait sauvé la vie et lui donna une fille de la maison." },
      { label: "Le récompenser de quelques pièces", hint: "−1 or, rien ne change.", fx: [{ gold: -1 }], chron: "L'écuyer reçut une bourse. Il la trouva bien légère." },
      { label: "S'en débarrasser avant qu'il ne séduise toute la famille", hint: "Trop beau pour être loyal.", fx: [{ peur: 5 }, { prestige: -1 }], chron: "L'écuyer qui avait sauvé le roi fut envoyé en première ligne. Il ne revint pas." },
    ] },
  { id: "la_vengeance", type: "target", req: "hasLostFamily", title: "La vengeance", text: "Un membre de ta famille a été tué cette année, et toute la cour te regarde. Un roi qui ne venge pas les siens n'est pas un roi.",
    options: [
      { label: "Jurer vengeance contre une maison", hint: "Choisis ta cible : elle perd 2 armées et doit s'inquiéter.", needsTarget: true, fx: [{ target: [{ armies: -2, where: "border" }, { peur: 5 }] }, { nextDice: 1 }], chron: "{roi} jura sur le cercueil de se venger de {cible}." },
      { label: "Pardonner publiquement", hint: "+3 prestige, mais on te croit faible.", fx: [{ prestige: 3 }, { peur: -10 }], chron: "{roi} pardonna publiquement aux assassins. L'Église en pleura d'émotion." },
      { label: "Pleurer en silence", hint: "Rien ne se passe.", fx: [{ colere: -3 }], chron: "{roi} porta le deuil en silence." },
    ] },
  { id: "complot_interne", type: "solo", req: "notLeader", title: "Le complot des cadets", text: "Tes propres frères et cousins préparent un coup d'État. Ton espion a la liste des conjurés. Elle est longue. Elle contient presque tous les nobles de la cour.",
    options: [
      { label: "Arrêter tout le monde", hint: "Purge totale : −2 armées, +20 Peur.", fx: [{ armies: -2, where: "capital" }, { peur: 20 }, { epithet: "le Terrible" }], chron: "{roi} fit arrêter la moitié de sa cour en une nuit. Les cachots débordèrent." },
      { label: "Arrêter seulement les meneurs", hint: "+10 Peur, un risque reste.", fx: [{ peur: 10 }, { chance: 0.3, then: [{ kill: "king", cause: "assassiné par des conjurés oubliés" }], thenChron: "Mais des conjurés avaient échappé à la purge. Le roi fut poignardé à la messe." }], chron: "{roi} fit décapiter les meneurs du complot." },
      { label: "Les acheter", hint: "−5 or, tout le monde redevient fidèle.", fx: [{ gold: -5 }], chron: "{roi} acheta la fidélité de ses conjurés. Ils n'en revenaient pas." },
    ] },
  { id: "bal_espions", type: "target", title: "Le bal masqué", text: "Un grand bal masqué réunit toutes les cours. Sous un masque, on peut parler à n'importe qui sans être reconnu. Ou se faire passer pour quelqu'un d'autre.",
    options: [
      { label: "Te faire passer pour un ambassadeur d'une autre maison", hint: "Tu sèmes la zizanie : la maison choisie perd du prestige.", needsTarget: true, anon: true, anonChron: "Au bal masqué, un ambassadeur de {cible} insulta toutes les reines présentes. Il jura plus tard n'avoir jamais été là.", fx: [{ target: [{ prestige: -3 }] }], chron: "" },
      { label: "Séduire une reine sous le masque", hint: "Un bâtard possible chez la maison choisie.", needsTarget: true, fx: [{ chance: 0.5, then: [{ seduceTarget: true }], thenChron: "Neuf mois après le bal masqué, la reine de {cible} accoucha. Personne n'osa compter." }], chron: "{roi} passa une partie du bal masqué dans une alcôve, avec une reine de {cible}." },
      { label: "Écouter les conversations", hint: "+2 aux intrigues.", fx: [{ intrigueBonus: 2 }], chron: "Les espions de {maison} passèrent le bal masqué à écouter aux portes." },
    ] },
  { id: "heritier_otage", type: "target", req: "hasChild", title: "La demande d'otage", text: "Une maison rivale exige qu'un de tes enfants vienne grandir à sa cour, en gage de paix. Refuser, c'est presque déclarer la guerre.",
    options: [
      { label: "Envoyer l'enfant", hint: "Trêve de 3 manches avec la maison choisie, mais l'enfant est entre ses mains.", needsTarget: true, fx: [{ treatyTarget: 3 }, { removePerson: "youngest", cause: "envoyé en otage" }], chron: "{maison} envoya un enfant en otage chez {cible}, en gage de paix." },
      { label: "Refuser avec mépris", hint: "+1 prestige, la maison choisie est furieuse.", needsTarget: true, fx: [{ prestige: 1 }, { target: [{ peur: 5 }] }], chron: "{maison} refusa d'envoyer un otage chez {cible}, et le fit savoir." },
      { label: "Envoyer un faux enfant", hint: "Trêve de 3 manches, et un espion chez l'ennemi.", needsTarget: true, fx: [{ treatyTarget: 3 }, { intrigueBonus: 2 }, { chance: 0.3, then: [{ prestige: -4 }], thenChron: "La supercherie fut découverte : l'otage était le fils du cuisinier." }], chron: "{maison} envoya un otage chez {cible}. Il avait des manières étonnamment roturières." },
    ] },
  { id: "guerre_sainte", type: "solo", title: "Le prédicateur de guerre", text: "Un moine fanatique prêche la guerre sainte dans les rues de {cap}. Il veut qu'on attaque les infidèles. Comme il n'y a pas d'infidèles à proximité, il suggère les voisins.",
    options: [
      { label: "Le laisser prêcher", hint: "+2 armées, +1 dé, la colère monte.", fx: [{ armies: 2, where: "capital" }, { nextDice: 1 }, { colere: 8 }], chron: "Le moine fanatique leva une foule de volontaires à {cap}. Ils ne savaient pas contre qui ils allaient se battre, mais ils étaient très motivés." },
      { label: "Le faire taire", hint: "Rien ne se passe.", fx: [{ peur: 3 }], chron: "Le moine fanatique fut envoyé prêcher dans un monastère très, très loin." },
      { label: "L'envoyer prêcher chez un rival", hint: "La maison choisie s'enfonce dans le fanatisme.", needsTarget: true, fx: [{ target: [{ colere: 15 }] }], chron: "Le moine fanatique de {maison} partit prêcher la guerre sainte chez {cible}." },
    ] },
  { id: "loup_garou", type: "solo", title: "La bête de {prov}", text: "Une bête mange les bergères de {prov}. Les paysans parlent d'un loup-garou. Certains accusent le seigneur local, qui a les sourcils qui se rejoignent.",
    options: [
      { label: "Brûler le seigneur", hint: "Les sourcils, ça ne trompe pas.", fx: [{ colere: -10 }, { peur: 5 }, { armies: -1, where: "capital" }], chron: "Le seigneur aux sourcils joints fut brûlé comme loup-garou. La bête continua de manger des bergères." },
      { label: "Organiser une grande battue", hint: "+2 prestige si on la trouve.", fx: [{ chance: 0.5, then: [{ prestige: 2 }, { colere: -10 }], thenChron: "La bête de {prov} fut abattue : c'était un loup énorme. On l'exposa sur la grand-place.", else: [{ colere: 5 }], elseChron: "La battue fut un fiasco. La bête mangea un rabatteur." }], chron: "{roi} lança une grande battue contre la bête de {prov}." },
      { label: "Ignorer", hint: "Ce ne sont que des bergères.", fx: [{ colere: 10 }], chron: "{roi} ignora la bête de {prov}. Elle s'enhardit." },
    ] },
  { id: "possession", type: "solo", req: "hasChild", title: "L'enfant possédé", text: "{heritier} parle dans une langue inconnue, se tord au sol et crache sur les crucifix. Le prêtre parle de possession, le médecin de haut mal. L'exorciste attend.",
    options: [
      { label: "L'exorcisme", hint: "Il guérit… ou il meurt.", fx: [{ chance: 0.6, then: [{ prestige: 1 }], thenChron: "L'exorcisme réussit. {heritier} se réveilla en réclamant de la soupe.", else: [{ kill: "eldest", cause: "mort pendant un exorcisme" }], elseChron: "{heritier} mourut pendant l'exorcisme. Le prêtre affirma que le démon était parti." }], chron: "On exorcisa {heritier} pendant trois jours et trois nuits." },
      { label: "Le cacher au monde", hint: "Il reste héritier, en secret.", fx: [{ flag: "heritier_cache" }, { colere: 3 }], chron: "{heritier} fut caché dans une tour. On dit à la cour qu'il était parti étudier à Paris." },
      { label: "En faire un prophète", hint: "+3 prestige, et beaucoup de pèlerins.", fx: [{ prestige: 3 }, { gold: 2 }], chron: "{maison} proclama que {heritier} parlait la langue des anges. Les pèlerins affluèrent." },
    ] },
  { id: "or_maudit", type: "solo", req: "rich", title: "L'or maudit", text: "Un marchand juif de Bruges, ruiné, affirme que le roi lui doit 10 pièces d'or depuis des années. Il a une reconnaissance de dette signée. Il n'a plus rien à perdre.",
    options: [
      { label: "Payer la dette", hint: "−6 or, +2 prestige.", fx: [{ gold: -6 }, { prestige: 2 }], chron: "{roi} paya ses vieilles dettes. Les marchands de Bruges en furent stupéfaits." },
      { label: "Faire disparaître le créancier", hint: "Et la reconnaissance de dette avec lui.", fx: [{ peur: 5 }, { prestige: -2 }], chron: "Le créancier de {roi} disparut sur la route de Bruges. La reconnaissance de dette aussi." },
      { label: "L'accuser d'usure", hint: "L'Église approuve. Les marchands fuient.", fx: [{ prestige: -1 }, { colere: -3 }, { gold: -1 }], chron: "{roi} fit juger son créancier pour usure. Les marchands étrangers évitèrent {cap} pendant des années." },
    ] },
  { id: "heresie_famille", type: "solo", req: "hasChild", title: "L'héritier hérétique", text: "{heritier} a été surpris en train de lire des textes cathares interdits. Il refuse de communier et parle de la pauvreté du Christ. L'évêque est au courant.",
    options: [
      { label: "Le livrer à l'Église", hint: "Le bûcher. +2 prestige.", fx: [{ kill: "eldest", cause: "brûlé pour hérésie" }, { prestige: 2 }, { peur: 10 }], chron: "{roi} livra son propre héritier à l'Inquisition. {heritier} brûla en chantant." },
      { label: "Le protéger", hint: "−3 prestige, l'héritier vit.", fx: [{ prestige: -3 }], chron: "{roi} protégea son héritier hérétique contre l'évêque." },
      { label: "Le soigner par la discipline", hint: "Fouet et prières. Il change… peut-être.", fx: [{ colere: 3 }, { chance: 0.5, then: [{ disinherit: "eldest" }], thenChron: "{heritier} s'enfuit dans les montagnes rejoindre les parfaits cathares." }], chron: "On enferma {heritier} avec un confesseur et un fouet." },
    ] },
];
