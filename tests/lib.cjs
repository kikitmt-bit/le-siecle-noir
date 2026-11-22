// Outils partagés par les tests dans le navigateur (Playwright).
const fs = require("fs");
const path = require("path");

function loadPlaywright() {
  for (const p of [process.env.PLAYWRIGHT_PATH, "playwright", "/opt/node22/lib/node_modules/playwright"].filter(Boolean)) {
    try { return require(p); } catch (e) { /* on essaie le suivant */ }
  }
  throw new Error("Playwright introuvable : installe-le (npm i -D playwright) ou donne son chemin avec PLAYWRIGHT_PATH.");
}
const { chromium } = loadPlaywright();

const PORT = process.env.PORT || 8765;
const BASE = process.env.BASE || `http://localhost:${PORT}/?test&fast`;
const OUT = process.env.OUT || path.join(__dirname, "captures");
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const chromePath = process.env.CHROME_PATH || (fs.existsSync("/usr/bin/google-chrome") ? "/usr/bin/google-chrome" : undefined);

async function launch() {
  return chromium.launch({ executablePath: chromePath, args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"] });
}

// Ouvre un joueur (un navigateur isolé) ; toutes les erreurs de la page sont ajoutées à `errors`.
async function newPlayer(browser, name, errors, mobile = false) {
  const ctx = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 }, isMobile: mobile });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errors.push(`[${name}] pageerror ${e.message}\n${e.stack}`));
  p.on("console", (m) => { if (m.type() === "error") errors.push(`[${name}] console ${m.text()}`); });
  p.__ctx = ctx;
  return p;
}

// Un « coup » de joueur automatique : regarde l'écran et clique là où il faut (objectifs, dilemmes, ordres…).
async function botStep(p) {
  try {
    await p.evaluate(async () => {
      const $ = (s) => document.querySelector(s);
      const $$ = (s) => [...document.querySelectorAll(s)];
      const click = (el) => el && el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
      // fenêtres d'aide
      const md = document.querySelector("#modal:not(.hidden)");
      if (md) { const n = md.querySelector('[data-intro]:last-of-type'); const c = md.querySelector("#md-close"); if (c && (!n || n.textContent.includes("Précédent"))) click(c); else if (n) click(n); else if (c) click(c); return; }
      const nx = document.querySelector("#btn-next:not([disabled])"); if (nx) { click(nx); return; }
      // révélation partagée : on regarde parfois une carte précédente, puis on valide
      const rvprev = document.querySelector('[data-rvview]:not(.cur):not([disabled])'); if (rvprev && Math.random() < 0.03) { click(rvprev); return; }
      const rvback = document.querySelector('[data-rvview="cur"]'); if (rvback) { click(rvback); return; }
      const rvack = document.querySelector('[data-rvc="ack"]:not([disabled])'); if (rvack) { click(rvack); return; }
      const bat = document.querySelector('[data-battle]'); if (bat && Math.random() < 0.05) { click(bat); }
      // objectifs
      if ($$("[data-obj]").length && !$("#obj-ok")?.textContent.includes("✓")) { const o = $$("[data-obj]"); click(o[0]); click($$("[data-obj]")[1]); click($("#obj-ok")); return; }
      // dilemme
      if ($$("[data-ch]").length && !$("#dil-ok")?.textContent.includes("✓")) { click(pick($$("[data-ch]"))); if ($$("[data-dt]").length) click(pick($$("[data-dt]"))); if ($("#dil-ok") && !$("#dil-ok").disabled) click($("#dil-ok")); else { if ($$("[data-dt]").length) click($$("[data-dt]")[0]); click($("#dil-ok")); } return; }
      if ($("#ov-close") && document.querySelector("#tb-phase").textContent === "Fin de partie") return;
      // tirage des provinces
      const sel = $$("#map .prov.sel");
      if (document.querySelector("#draft-ok")) { click(document.querySelector("#draft-ok")); return; }
      if (document.querySelector("#tb-phase").textContent === "Choix des provinces" && sel.length) { click(pick(sel)); return; }
      if ($("#pl-ok") && $("#pl-ok").textContent === "Valider") { click($("#pl-ok")); return; }
      // ordres
      if (document.querySelector("#tb-phase").textContent === "Ordres secrets") {
        if ($("#btn-unseal")) return;
        const freeDie = $$("[data-die]").find((d) => !d.classList.contains("used") && !d.disabled);
        if ($$("[data-act]").length) { const acts = $$("[data-act]").filter((a) => !a.disabled); click(pick(acts)); return; }
        if ($$("[data-kind]").length) { const k = $$("[data-kind]").filter((a) => !a.disabled); if (k.length) click(pick(k)); else click($("#b-cancel")); return; }
        if ($$("[data-tgt]").length) { click(pick($$("[data-tgt]"))); return; }
        if ($$("[data-person]").length) { click(pick($$("[data-person]"))); return; }
        if ($("#b-ok")) { click($("#b-ok")); return; }
        if ($("#b-cancel") && sel.length) { click(pick(sel)); return; }
        if ($("#b-cancel")) { click($("#b-cancel")); return; }
        
        if ($$("[data-ans]").length) { click(pick($$("[data-ans]"))); }
        if ($$("[data-offer]").length && Math.random() < 0.1) { const of = $$("[data-offer]").filter((b) => !b.disabled); if (of.length) click(pick(of)); }
        if ($$("[data-acc]").length && Math.random() < 0.3) click(pick($$("[data-acc]")));
        if ($$("[data-giftto]").length && Math.random() < 0.05) { click(pick($$("[data-giftto]").filter((b)=>!b.disabled))); setTimeout(() => click(document.querySelector("#gift-ok")), 50); }
        if ($("#btn-feast") && !$("#btn-feast").disabled && Math.random() < 0.05) { click($("#btn-feast")); return; }
        if ($("#btn-reroll") && !$("#btn-reroll").disabled && !$(".die.reroll-pick") && Math.random() < 0.08) { click($("#btn-reroll")); return; }
        if ($(".die.reroll-pick")) { click(pick($$(".die.reroll-pick"))); return; }
        if (freeDie && Math.random() < 0.9) { click(freeDie); return; }
        if ($("#btn-seal")) { click($("#btn-seal")); return; }
      }
    });
  } catch (e) { /* la page s'est redessinée pendant le coup */ }
}

// Phase affichée en haut de l'écran + fenêtres ouvertes.
function phaseInfo(p) {
  return p.evaluate(() => {
    const ph = document.querySelector("#tb-phase")?.textContent;
    return { ph, overlay: !document.querySelector("#overlay").classList.contains("hidden"), tuto: !document.querySelector("#tuto").classList.contains("hidden") };
  });
}

// Lecture / écriture directe dans la base du faux serveur (pour vérifier ou préparer des données).
const dbOp = (o) => fetch(`http://localhost:${PORT}/__db/op`, { method: "POST", body: JSON.stringify(o) }).then((r) => r.json());
const dbGet = async (p) => (await dbOp({ op: "get", path: p })).value;
const dbSet = (p, value) => dbOp({ op: "set", path: p, value });
// L'état d'une partie (décodé) et les données privées d'un joueur, comme le jeu les range dans la base.
const roomState = async (code) => { const v = await dbGet(`rooms/${code}/state`); return v ? JSON.parse(v.json) : null; };
const roomPrivate = async (code, uid) => { const v = await dbGet(`rooms/${code}/private/${uid}`); return v ? JSON.parse(v) : null; };
const uidOf = (p) => p.evaluate(() => localStorage.getItem("fake_uid"));

module.exports = { chromium, BASE, OUT, PORT, sleep, launch, newPlayer, botStep, phaseInfo, dbGet, dbSet, roomState, roomPrivate, uidOf };
