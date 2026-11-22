# Direction artistique du Siècle Noir

Piste choisie le 22 novembre 2026 : **piste 1 « Chronique »** (planche 3.1). Le jeu est une chronique de 1347 : parchemin clair, encre brune, rubriques rouges, lettrines et sceaux de cire. Appliquée à toute l'interface au chantier 3.4.

Tout ce qui est visible dans le jeu suit cette page. Une exception se justifie ici, pas dans le code.

## Palette

Huit couleurs, définies une seule fois en haut de `css/style.css` (`:root`).

| Rôle | Nom | Valeur | Usage |
|---|---|---|---|
| Fond de page | Parchemin | `#F0E4C7` | Cartes, panneaux, accueil |
| Fond 2 | Vélin | `#E6D5AF` | Zones secondaires, onglets, survol |
| Fond 3 | Parchemin foncé | `#D5BF92` | Filets, séparateurs, fond du plateau |
| Texte | Encre | `#241811` | Tout le texte, les traits, les bords |
| Texte 2 | Encre pâle | `#5A4430` | Aides, sous-titres, légendes |
| Accent | Rubrique | `#A3221A` | Action principale, lettrines, alertes, étape en cours. Rare. |
| Accent 2 | Or terni | `#A9843A` (sur papier) · `#C9A35A` (sur fond sombre) | Couronne, capitale, le joueur dont c'est le tour |
| Nuit | Nuit | `#1B130D` | Barre du haut, récit de la révélation, fonds sombres |

Sur la rubrique, le texte est `#F7EEDC`. Les couleurs de sens (vert pour un gain, bleu pour un traité) restent discrètes et ne servent qu'aux pastilles.

Couleurs des maisons : Valcourt `#8E2A22`, Morlanges `#2C4566`, Ravenel `#3B5A3A`, Aubrac `#A07A2A`, Angleterre `#4A4F57`.

Le papier a du grain (bruit SVG en multiplication) et un léger assombrissement sur les bords. Jamais de fond uni et propre.

## Typographie

Deux polices, pas une de plus (Google Fonts) :

- **Grenze Gotisch 700** : le logo, les titres de dilemme et de carte, les grands chiffres de chapitre. Jamais pour une phrase.
- **EB Garamond** : tout le reste. Le texte courant en romain, les aides en italique.
  - Étiquettes, boutons, onglets, rubriques : **petites capitales** (`font-variant-caps: all-small-caps`, graisse 600, espacement 0,04 à 0,08 em). Jamais de capitales pleines.
  - Chiffres : toujours alignés (`lining-nums`), et à chasse fixe (`tabular-nums`) pour les scores, le chrono et le code de partie.

Tailles minimales : 15 px pour lire, 13 px pour une étiquette en petites capitales.

## Composants

- **Bouton principal** : fond rubrique, texte clair, petites capitales. Un seul par écran. « Sceller » porte un sceau de cire.
- **Bouton secondaire** : sans fond, double filet d'encre.
- **Bouton sombre** : fond encre, texte parchemin (jouer seul, choix fait).
- **Champ de saisie** : pas de cadre, un simple trait d'encre dessous, comme une ligne à remplir.
- **Dilemme** : une page de chronique. Rubrique rouge en petites capitales au-dessus, titre en gothique, gravure, puis le texte avec une **lettrine rouge**. Les choix sont des paragraphes séparés par des filets, marqués d'un pied-de-mouche ¶ ; le choix retenu passe en rouge.
- **Jauge** : un cadre d'encre fin, remplie de hachures rouges, avec un trait au seuil (révolte à 80).
- **Barre du haut** : nuit, filet rouge en dessous.
- **Blasons** : des sceaux de cire ronds et irréguliers à la couleur de la maison, la pièce (tour, poisson, clé, étoile, lion) en relief clair.
- **Icônes** : gravées, monochromes. Trait d'encre, fond papier, une seule touche de rubrique. Jamais de couleurs d'émoji. 18 px minimum, toujours accompagnées d'un mot.
- **Surfaces sombres** (révélation, bandeaux, ragots) : fond nuit, texte parchemin, filets et titres or terni clair.

## Logo

Fait au chantier 3.5. Deux pièces, toujours dans cet ordre :

- **L'emblème** : un corbeau couronné perché sur une croix de peste. Corbeau à l'encre, plumes taillées en traits de papier, couronne or terni sans fleur de lys, croix rubrique. Dessiné à la main en vectoriel dans `icons/embleme.svg`, avec un léger tremblé d'encre (filtre SVG) pour ne pas faire net et numérique. La croix est évidée autour de l'oiseau : l'emblème se pose sur n'importe quel papier sans liseré.
- **Le mot-symbole** : « Le Siècle Noir » en Grenze Gotisch 700, le S et le N en rubrique. En dessous, si la place le permet : un filet rouge à croix ✠, puis « Anno Domini 1347 » en petites capitales, encre pâle.

Usages :

- Accueil : l'emblème au-dessus du mot-symbole. Barre du haut : le mot-symbole seul (l'emblème disparaîtrait sur la nuit).
- Icônes de l'appli et favicon (`icons/icone.svg`) : un sceau, disque de parchemin cerclé d'encre sur fond nuit, l'emblème au centre.
- Image de partage (`og.jpg`) et logo complet sur fond transparent (`icons/logo.png`).
- Toutes ces images se refont depuis l'emblème avec `python tools/make_assets.py`. On ne retouche jamais les PNG à la main.
- Jamais l'emblème en couleurs inversées, étiré, ou posé directement sur la nuit sans son disque de parchemin.

## Illustrations

Méthode validée au chantier 3.2 :

1. Une conversation ChatGPT neuve par image, avec l'image de référence (`sn-v1-01-ville-en-deuil.png`) jointe.
2. La consigne de style (dans `3.2-style-v2.md`, dossier du projet), puis le sujet.
3. Recoloration sur la palette Chronique : `python -I tools/normaliser_gravure.py chronique <images> --out <dossier>`. Encre `#241811`, papier de gravure `#ECDEBD` (un cran sous le parchemin pour que l'image s'en détache), rouge `#A3221A`.

Règles du contenu :

- Gravure sur bois populaire vers 1480, trait grossier et irrégulier. Surtout pas de rendu numérique lisse.
- Le rouge est rare : deux ou trois touches par image.
- Réaliste, jamais caricatural : proportions justes, expressions retenues, pas de grimaces. La scène peut être crasseuse, violente ou dérangeante.
- Des gens abîmés par la vie, jamais beaux ni idéalisés, mais jamais déformés.
- Pas de fleur de lys, sauf quand la scène montre le roi de France.
- Aucun texte, aucune lettre, aucun cadre dans l'image.
- L'emblème du logo est dessiné en vectoriel, pas généré.

Gravures des dilemmes : 40 scènes dans `img/gravures/` (WebP 960×640), une par thème ; `js/gravures.js` associe chaque dilemme à sa gravure. Originaux et conversations ChatGPT dans le dossier du projet (`images-gravures/`). Les dessins SVG de `js/ui/draw.js` ne servent plus qu'aux interludes de fin de manche.

## Mouvement et son

Animations sous 1,5 seconde, toujours passables d'un clic, coupées si le système demande moins de mouvement. Pas de musique ; ambiance discrète qu'on peut couper.
