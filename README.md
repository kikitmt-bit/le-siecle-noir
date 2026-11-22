# Le Siècle Noir

Jeu de conquête médiéval entre amis, dans le navigateur (PC, tablette, téléphone).

France, 1347. La peste arrive, les rois meurent, les héritiers s'entretuent. De 2 à 4 joueurs, environ 30 minutes.

- Ordres secrets simultanés, attribués avec des dés façon backgammon (Frapper, Marcher, Lever, Intriguer)
- Dilemmes cruels à chaque manche, dont des pactes entre joueurs
- Dynasties : vieillesse, successions, mariages, bâtards, guerres civiles
- 10 manches, dernière manche « le Couronnement »

Hébergé sur GitHub Pages, synchronisé en temps réel avec Firebase (Realtime Database, connexion anonyme).

## Structure

- `index.html`, `css/style.css` : la page et son style
- `js/engine.js` : point d'entrée des règles ; le code est dans `js/engine/` (création de partie, famille, effets des dilemmes, manches, batailles, intelligence artificielle, score). Le navigateur de l'hôte sert d'arbitre.
- `js/content.js`, `js/dil_*.js` : dilemmes, objectifs, noms, traits
- `js/map.js` : les 23 provinces et les 6 régions ; `js/map-art.js` : le décor gravé de la carte. Les deux sont générés par `python -I tools/carte/make_map.py` (vraies formes de la France de 1347, d'après les côtes et fleuves de Natural Earth gardés dans `tools/carte/ne-france.json`) : on modifie le script, jamais les fichiers générés
- `js/state.js` : l'état partagé de l'application (partie, carte, arbitre…)
- `js/main.js` : démarrage et boutons globaux ; `js/ui/*.js` : l'interface, un fichier par sujet (accueil, carte, ordres, diplomatie, révélation…) ; `js/host.js` : l'arbitre
- `js/net.js`, `js/firebase-config.js` : la synchronisation Firebase ; `js/localnet.js` : le même réseau en mémoire pour le mode solo
- `js/audio.js` : les sons, générés dans le navigateur
- `manifest.webmanifest`, `sw.js`, `icons/`, `og.jpg` : appli installable, icônes, logo et image de partage. L'emblème est dessiné à la main dans `icons/embleme.svg` ; tout le reste en découle avec `python tools/make_assets.py` (Playwright + Chrome, Pillow)
- `tests/` : les tests (voir `tests/README.md`)

## Mettre en ligne

`./bump.sh` met un numéro de version sur tous les fichiers (pour que les navigateurs ne gardent jamais une ancienne version) : à lancer avant chaque mise en ligne, y compris après avoir créé un nouveau fichier JS.
