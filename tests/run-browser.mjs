// Lance le faux serveur puis les parties de test dans le navigateur, l'une après l'autre.
// Usage : node tests/run-browser.mjs [solo] [mobile] [en-ligne] [reprise-hote] [accueil]   (sans argument : tout)
import { spawn } from "child_process"; import net from "net"; import path from "path";
const DIR = import.meta.dirname;
const PORT = process.env.PORT || "8765";
const TESTS = {
  solo: { file: "solo.cjs", env: {} },
  mobile: { file: "solo.cjs", env: { MOB: "1" } },
  "en-ligne": { file: "en-ligne.cjs", env: {} },
  "reprise-hote": { file: "reprise-hote.cjs", env: {} },
  accueil: { file: "accueil.cjs", env: {} },
};
const wanted = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(TESTS);
for (const w of wanted) if (!TESTS[w]) { console.error("Test inconnu :", w, "— choix :", Object.keys(TESTS).join(", ")); process.exit(2); }

const server = spawn("node", [path.join(DIR, "fakeserver.mjs"), PORT], { stdio: ["ignore", "inherit", "inherit"] });
const stop = () => { try { server.kill(); } catch {} };
process.on("exit", stop); process.on("SIGINT", () => process.exit(130));
await new Promise((resolve, reject) => {
  const t0 = Date.now();
  const tryOnce = () => { const s = net.connect(+PORT, "127.0.0.1"); s.on("connect", () => { s.destroy(); resolve(); }); s.on("error", () => { s.destroy(); Date.now() - t0 > 10000 ? reject(new Error("le faux serveur ne démarre pas")) : setTimeout(tryOnce, 200); }); };
  tryOnce();
});

const results = [];
for (const name of wanted) {
  const { file, env } = TESTS[name];
  console.log(`\n=== ${name} ===`);
  const t0 = Date.now();
  const code = await new Promise((resolve) => {
    const child = spawn("node", [path.join(DIR, file)], { stdio: "inherit", env: { ...process.env, PORT, ...env } });
    child.on("exit", (c) => resolve(c ?? 1));
  });
  results.push({ name, ok: code === 0, s: Math.round((Date.now() - t0) / 1000) });
}
console.log("\n=== Résumé ===");
for (const r of results) console.log(`${r.ok ? "OK    " : "ÉCHEC "} ${r.name} (${r.s} s)`);
stop();
process.exit(results.every((r) => r.ok) ? 0 : 1);
