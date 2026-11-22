// Partie solo complète contre 3 IA, jusqu'à la fin. Ordinateur par défaut ; MOB=1 pour un écran de téléphone.
// Doit finir par « ERRORS 0 ». Captures d'écran dans tests/captures/.
const { BASE, OUT, sleep, launch, newPlayer, botStep, phaseInfo } = require("./lib.cjs");
const MOB = !!process.env.MOB;
const sfx = MOB ? "m" : "";
(async () => {
  const browser = await launch();
  const errors = [];
  const p = await newPlayer(browser, "Alice", errors, MOB);
  await p.goto(BASE);
  await p.fill("#in-name", "Alice");
  await p.click("#btn-solo");
  await p.click('[data-solo="3"]');
  await p.click("#btn-solo-go");
  await p.waitForSelector("#screen-game:not(.hidden)", { timeout: 8000 }).catch(() => { console.log("ERRS", errors.join("\n")); process.exit(1); });
  const shots = new Set();
  const t0 = Date.now();
  let lastPhase = "";
  while (Date.now() - t0 < 600000) {
    const info = await phaseInfo(p);
    if (info.ph !== lastPhase) { console.log(((Date.now() - t0) / 1000).toFixed(0) + "s", info.ph); lastPhase = info.ph; }
    if (info.tuto) await p.click("#tuto-ok").catch(() => {});
    for (const [key, re] of [["court", /card-court/], ["battle", /card-battle/], ["time", /card-time/], ["summary", /card-summary/], ["council", /council-card/], ["final", /card-final/], ["objectives", /card-objectives/]]) {
      if (shots.has(key)) continue;
      const bt = await p.evaluate(() => { const d = document.querySelector(".rv-dock, .council-card"); return d ? d.className : ""; });
      if (re.test(bt) && !(await p.evaluate(() => !!document.querySelector(".splash")))) { shots.add(key); await sleep(700); await p.screenshot({ path: `${OUT}/rv${sfx}_${key}.png` }); }
    }
    const shotKey = info.ph;
    if (!shots.has(shotKey) || (info.ph === "Révélation" && !shots.has("rev2"))) { shots.add(shotKey); await sleep(300); await p.screenshot({ path: `${OUT}/solo${sfx}_${(info.ph || "x").replace(/\W+/g, "_")}.png` }); }
    await botStep(p);
    if (lastPhase === "Fin de partie") { await sleep(1500); break; }
    await sleep(350);
  }
  await p.screenshot({ path: `${OUT}/solo${sfx}_fin.png` });
  await p.click("#ov-close").catch(() => {});
  await p.click('#side-tabs button[data-tab="house"]').catch(() => {});
  await sleep(300); await p.screenshot({ path: `${OUT}/solo${sfx}_maison.png` });
  console.log("ERRORS", errors.length); console.log(errors.slice(0, 15).join("\n"));
  await browser.close();
  process.exit(errors.length || lastPhase !== "Fin de partie" ? 1 : 0);
})();
