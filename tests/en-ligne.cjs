// Partie en ligne à 3 joueurs (le 3e sur un écran de téléphone) contre le faux serveur, jusqu'à la fin.
// Doit finir par « ERRORS 0 ». Captures d'écran dans tests/captures/.
const { BASE, OUT, sleep, launch, newPlayer, botStep, phaseInfo } = require("./lib.cjs");
(async () => {
  const browser = await launch();
  const errors = [];
  const names = ["Alice", "Bruno", "Chloé"];
  const N = +(process.env.N || 3);
  const pages = [];
  for (let i = 0; i < N; i++) pages.push(await newPlayer(browser, names[i], errors, i === 2));
  await pages[0].goto(BASE);
  await pages[0].fill("#in-name", names[0]);
  await pages[0].click("#btn-create");
  await pages[0].waitForSelector("#screen-lobby:not(.hidden)");
  const code = (await pages[0].textContent("#lobby-code")).trim();
  console.log("code", code);
  for (let i = 1; i < N; i++) {
    await pages[i].goto(BASE);
    await pages[i].fill("#in-name", names[i]);
    await pages[i].fill("#in-code", code);
    await pages[i].click("#btn-join");
    await pages[i].waitForSelector("#screen-lobby:not(.hidden)");
    const houses = ["valcourt", "morlanges", "ravenel", "aubrac"];
    await pages[i].click(`.house-opt[data-h="${houses[i]}"]`);
  }
  await sleep(500);
  await pages[0].screenshot({ path: `${OUT}/en-ligne_salon.png` });
  if (process.env.TUTO) await pages[0].check("#opt-tuto");
  await pages[0].click("#btn-start");
  await pages[0].waitForSelector("#screen-game:not(.hidden)", { timeout: 8000 }).catch(async () => { console.log("ERRS", errors.join("\n")); console.log(await pages[0].evaluate(() => document.body.innerText.slice(0, 500))); process.exit(1); });
  const shots = new Set();
  const t0 = Date.now();
  let lastPhase = "";
  while (Date.now() - t0 < 600000) {
    for (let i = 0; i < N; i++) {
      const p = pages[i];
      const info = await phaseInfo(p);
      if (i === 0 && info.ph !== lastPhase) { console.log(((Date.now() - t0) / 1000).toFixed(0) + "s", info.ph); lastPhase = info.ph; }
      if (info.tuto) await p.click("#tuto-ok").catch(() => {});
      const shotKey = info.ph + i;
      if (!shots.has(shotKey) && (i === 0 || i === 2)) { shots.add(shotKey); await sleep(300); await p.screenshot({ path: `${OUT}/en-ligne_${i}_${(info.ph || "x").replace(/\W+/g, "_")}.png` }); }
      await botStep(p);
    }
    if (lastPhase === "Fin de partie") { await sleep(1500); break; }
    await sleep(350);
  }
  for (let i = 0; i < N; i++) await pages[i].screenshot({ path: `${OUT}/en-ligne_fin_${i}.png`, fullPage: i === 2 });
  await pages[0].click("#ov-close").catch(() => {});
  await pages[0].click('#side-tabs button[data-tab="house"]').catch(() => {});
  await sleep(300); await pages[0].screenshot({ path: `${OUT}/en-ligne_maison.png` });
  console.log("ERRORS", errors.length); console.log(errors.slice(0, 15).join("\n"));
  await browser.close();
  process.exit(errors.length || lastPhase !== "Fin de partie" ? 1 : 0);
})();
