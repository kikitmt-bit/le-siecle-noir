# Les tests du Siècle Noir

Tout se lance depuis la racine du dépôt.

## Tests rapides (Node seulement, quelques secondes)

```
npm test
```

- `tests/sim.mjs` : 300 parties complètes jouées par le moteur seul. Doit finir avec `errors: 0`. Le hasard est fixé : deux lancements donnent exactement le même résultat (`SEED=7 node tests/sim.mjs` pour d'autres parties).
- `tests/validate.mjs` : vérifie que tous les effets et conditions des dilemmes sont gérés. Toutes les listes affichées doivent être vides.
- `node tests/aibal.mjs` (facultatif) : équilibre des trois caractères d'IA.

## Tests dans le navigateur (3 à 6 minutes chacun)

Il faut Chrome et Playwright (`npm i -D playwright`, ou `PLAYWRIGHT_PATH=/chemin/vers/playwright`). `CHROME_PATH` indique Chrome s'il n'est pas dans `/usr/bin/google-chrome`.

```
npm run test:browser                  # tout, l'un après l'autre
node tests/run-browser.mjs solo       # un seul : solo, mobile, en-ligne, reprise-hote, accueil
```

Le lanceur démarre un faux serveur (`tests/fakeserver.mjs` : il sert une copie du site avec `tests/fakenet.js` à la place de Firebase, rien ne touche aux vraies parties), puis joue :

- `solo` : une partie solo complète contre 3 IA, sur ordinateur ; `mobile` : la même sur un écran de téléphone
- `en-ligne` : une partie à 3 joueurs (le 3e sur téléphone)
- `reprise-hote` : ferme l'onglet de l'hôte en pleine partie, puis ceux de tout le monde ; vérifie qu'un joueur reprend l'arbitrage, que rien n'est perdu et que la partie va jusqu'au bout
- `accueil` : la liste « Tes parties en cours » et le message pour une partie d'un format inconnu

Chaque test doit finir par `ERRORS 0` (et le lanceur affiche un résumé OK / ÉCHEC). Les captures d'écran sont dans `tests/captures/` (ignoré par git). Variables utiles : `PORT` (8765 par défaut), `OUT` (dossier des captures).

## Quand tu changes le jeu

- Nouvelle fonction dans `js/net.js` : ajoute la même dans `tests/fakenet.js` (et `js/localnet.js` pour le solo).
- Nouveau fichier dans `js/` : lance `./bump.sh` avant la mise en ligne.
- Nouvelle règle qui change la forme des parties enregistrées : augmente `FORMAT_VERSION` dans `js/engine/core.js`.
