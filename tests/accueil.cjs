// Accueil : liste « Tes parties en cours » (reprendre, retirer, partie disparue) et message pour une partie d'un format inconnu.
const { BASE, OUT, sleep, launch, newPlayer, dbSet } = require("./lib.cjs");
let fails = 0;
const check = (ok, msg) => { console.log((ok ? "ok    " : "ÉCHEC ") + msg); if (!ok) fails++; };
(async () => {
  const browser = await launch();
  const errors = [];
  const p = await newPlayer(browser, "Alice", errors);
  const visible = (sel) => p.evaluate((s) => { const e = document.querySelector(s); return !!e && !e.classList.contains("hidden") && e.offsetParent !== null; }, sel);
  const text = (sel) => p.evaluate((s) => (document.querySelector(s)?.innerText || ""), sel);

  await p.goto(BASE); await sleep(800);
  check(!(await visible("#games")), "sans partie : pas de liste sur l'accueil");

  // 1. créer une partie, puis « quitter » (retour à l'accueil)
  await p.fill("#in-name", "Alice"); await p.click("#btn-create");
  await p.waitForSelector("#screen-lobby:not(.hidden)");
  const code = (await p.textContent("#lobby-code")).trim();
  await p.goto(BASE); await p.waitForSelector("#games:not(.hidden)", { timeout: 5000 }).catch(() => {});
  check(await visible("#games"), "après avoir quitté : la liste apparaît");
  const t1 = await text("#games");
  check(t1.includes(code) && t1.includes("Tes parties en cours"), `la partie ${code} est dans la liste`);
  check(/salon/i.test(t1), "elle est indiquée « Dans le salon »");
  await p.screenshot({ path: `${OUT}/accueil_liste.png` });

  // 2. Reprendre
  await p.click(`[data-resume="${code}"]`);
  await p.waitForSelector("#screen-lobby:not(.hidden)", { timeout: 5000 }).catch(() => {});
  check((await text("#lobby-code")).trim() === code, "Reprendre ramène dans le salon de la partie");

  // 3. Retirer de la liste
  await p.goto(BASE); await p.waitForSelector("#games:not(.hidden)");
  await p.click(`[data-drop="${code}"]`);
  check(!(await visible("#games")), "Retirer enlève la partie de la liste");
  await p.goto(BASE); await sleep(800);
  check(!(await visible("#games")), "…et elle ne revient pas après rechargement");

  // 4. une partie qui n'existe plus sur le serveur disparaît toute seule
  await p.evaluate(() => localStorage.setItem("sn_games", JSON.stringify([{ code: "ZZZZ", date: Date.now(), maison: "Fantôme", round: 3, maxRounds: 10, phase: "orders" }])));
  await p.goto(BASE);
  await p.waitForFunction(() => document.querySelector("#games").classList.contains("hidden"), null, { timeout: 5000 }).catch(() => {});
  check(!(await visible("#games")), "une partie disparue du serveur quitte la liste");
  check((await p.evaluate(() => localStorage.getItem("sn_games"))) === "[]", "…et du stockage de l'appareil");

  // 5. ancienne sauvegarde (une seule partie) reprise dans la liste
  await p.evaluate((c) => { localStorage.setItem("sn_games", "[]"); localStorage.setItem("sn_room", c); }, code);
  await p.goto(BASE); await p.waitForSelector("#games:not(.hidden)", { timeout: 5000 }).catch(() => {});
  check((await text("#games")).includes(code), "l'ancienne sauvegarde d'une partie apparaît dans la liste");

  // 6. partie d'un format inconnu (jeu plus récent) : message clair, pas de plantage
  await dbSet("rooms/BADV/meta", { host: "autre", created: Date.now() });
  await dbSet("rooms/BADV/state", { seq: 5, json: JSON.stringify({ v: 99, phase: "orders", round: 3 }) });
  await p.goto(BASE); await sleep(500);
  await p.fill("#in-name", "Alice"); await p.fill("#in-code", "BADV"); await p.click("#btn-join");
  await p.waitForFunction(() => /format 99/.test(document.querySelector("#home-msg").textContent), null, { timeout: 6000 }).catch(() => {});
  check(await visible("#screen-home"), "partie d'un format inconnu : retour à l'accueil");
  check(/plus récente/.test(await text("#home-msg")), "…avec un message qui explique le problème : " + (await text("#home-msg")).slice(0, 80));
  await p.screenshot({ path: `${OUT}/accueil_format.png` });
  check(!(await text("#games")).includes("BADV"), "…et elle n'entre pas dans la liste");

  console.log("ERRORS", errors.length); console.log(errors.slice(0, 10).join("\n"));
  await browser.close();
  process.exit(errors.length || fails ? 1 : 0);
})();
