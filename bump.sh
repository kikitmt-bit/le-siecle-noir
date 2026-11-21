#!/bin/sh
# Met un numéro de version sur tous les fichiers pour que les navigateurs prennent toujours la dernière version.
# Gère les imports de js/*.js, js/engine/*.js et js/ui/*.js (chemins ./x.js, ./dossier/x.js, ../x.js).
V=$(date +%s)
sed -i -E "s#(from \"\.{1,2}/[A-Za-z0-9_/-]+\.js)(\?v=[0-9]+)?\"#\1?v=$V\"#g" js/*.js js/*/*.js
sed -i -E "s#(src=\"js/main\.js)(\?v=[0-9]+)?\"#\1?v=$V\"#; s#(href=\"css/style\.css)(\?v=[0-9]+)?\"#\1?v=$V\"#" index.html
echo "version $V"
