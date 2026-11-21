#!/bin/sh
# Met un numéro de version sur tous les fichiers pour que les navigateurs prennent toujours la dernière version.
V=$(date +%s)
sed -i -E "s#(from \"\./[a-z_-]+\.js)(\?v=[0-9]+)?\"#\1?v=$V\"#g" js/*.js
sed -i -E "s#(src=\"js/main\.js)(\?v=[0-9]+)?\"#\1?v=$V\"#; s#(href=\"css/style\.css)(\?v=[0-9]+)?\"#\1?v=$V\"#" index.html
echo "version $V"
