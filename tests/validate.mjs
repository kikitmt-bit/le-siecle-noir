// Vérifie que tous les effets, conditions et textes des dilemmes sont bien gérés par le moteur.
import { DILEMMAS } from "../js/content.js";
import fs from "fs";
import * as E from "../js/engine.js";
const ENGINE_DIR = new URL("../js/engine/", import.meta.url);
const eng = fs.readdirSync(ENGINE_DIR).map((f) => fs.readFileSync(new URL(f, ENGINE_DIR), "utf8")).join("\n");
const ops = new Set(); const reqs = new Set(); const ph = new Set(); const chains = new Set();
const KNOWN_PH = ["roi","maison","cap","prov","prov_en","prov_de","heritier","heritier_trait","fille","fils","batard","batard_recu","reine","fille_ou_reine","partenaire","cible","leader"];
function walk(list){ for(const fx of list||[]){ for(const k of Object.keys(fx)){ ops.add(k); } if(fx.chain) chains.add(fx.chain); if(fx.target) walk(fx.target); if(fx.others) walk(fx.others); if(fx.then) walk(fx.then); if(fx.else) walk(fx.else);} }
const txt = [];
for (const d of DILEMMAS) {
  if (d.req) reqs.add(d.req);
  txt.push(d.title, d.text);
  if (d.type === "pact") { for (const k of ["aa","ab","ba","bb"]) { if(!d.outcomes[k]) console.log("missing outcome", d.id, k); walk(d.outcomes[k].fx); txt.push(d.outcomes[k].chron); } }
  else for (const o of d.options) { walk(o.fx); txt.push(o.label,o.hint||"",o.chron||"",o.anonChron||""); const scan=(l)=>{for(const f of l||[]){ if(f.thenChron) txt.push(f.thenChron); if(f.elseChron) txt.push(f.elseChron); scan(f.then); scan(f.else); scan(f.target);} }; scan(o.fx); if(o.anon&&!o.needsTarget) console.log("anon sans cible",d.id); }
}
for (const t of txt) for (const m of (t||"").matchAll(/\{(\w+)\}/g)) ph.add(m[1]);
const handled = [...ops].filter(o => !["then","else","thenChron","elseChron","where","cause","age","bastard","delay"].includes(o)).filter(o => !eng.includes("fx." + o));
console.log("ops non gérées:", handled);
const reqMissing = [...reqs].filter(r => !eng.includes(`case "${r}"`));
console.log("conditions non gérées:", reqMissing);
console.log("trous inconnus:", [...ph].filter(p => !KNOWN_PH.includes(p)));
console.log("chaînes manquantes:", [...chains].filter(c => !DILEMMAS.find(d => d.id === c)));
const chainOnly = DILEMMAS.filter(d=>d.chainOnly).map(d=>d.id); console.log("suites jamais déclenchées:", chainOnly.filter(c=>!chains.has(c)));
const unknownPh = [...ph].filter((p) => !KNOWN_PH.includes(p));
const missingChains = [...chains].filter((c) => !DILEMMAS.find((d) => d.id === c));
const neverChained = chainOnly.filter((c) => !chains.has(c));
if (handled.length || reqMissing.length || unknownPh.length || missingChains.length || neverChained.length) { console.log("PROBLÈME : une des listes ci-dessus n'est pas vide"); process.exit(1); }
// format des parties : 1 et 2 se lisent, un format inconnu est refusé avec la bonne raison
const fp = [E.formatProblem({ phase: "orders", v: 1 }), E.formatProblem({ phase: "orders", v: 2 }), E.formatProblem({ phase: "orders", v: 9 }), E.formatProblem({ phase: "orders", v: -1 }), E.formatProblem({ phase: "lobby" }), E.formatProblem(null)];
console.log("format des parties (null, null, plus-recent, plus-ancien, null, null):", fp);
if (JSON.stringify(fp) !== JSON.stringify([null, null, "plus-recent", "plus-ancien", null, null]) || E.FORMAT_VERSION !== 2) process.exit(1);
