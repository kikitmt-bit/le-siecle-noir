// Reprise de l'arbitre : on ferme l'onglet de l'hôte en pleine partie (à 3 joueurs), puis ceux de TOUS les joueurs.
// Vérifie qu'un autre joueur reprend, que les données privées ne sont pas perdues et que la partie va jusqu'au bout.
// Les chronos sont activés (« Normal ») pour que la partie avance même sans l'absent. Doit finir par « ERRORS 0 ».
const { BASE, OUT, sleep, launch, newPlayer, botStep, phaseInfo, dbGet, roomState, roomPrivate, uidOf } = require("./lib.cjs");
let fails = 0;
const check = (ok, msg) => { console.log((ok ? "ok    " : "ÉCHEC ") + msg); if (!ok) fails++; };
(async () => {
  const browser = await launch();
  const errors = [];
  const names = ["Alice", "Bruno", "Chloé"];
  const houses = ["valcourt", "morlanges", "ravenel"];
  const pages = [];
  for (let i = 0; i < 3; i++) pages.push(await newPlayer(browser, names[i], errors, i === 2));
  const open = [true, true, true]; // quels joueurs ont encore leur onglet ouvert
let uids = [];
const who = (k) => (uids.includes(k) ? names[uids.indexOf(k)] : "l'ordinateur " + k);

  // ---- partie à 3 joueurs : Alice est l'hôte ----
  await pages[0].goto(BASE);
  await pages[0].fill("#in-name", names[0]);
  await pages[0].click("#btn-create");
  await pages[0].waitForSelector("#screen-lobby:not(.hidden)");
  const code = (await pages[0].textContent("#lobby-code")).trim();
  console.log("code", code);
  for (let i = 1; i < 3; i++) {
    await pages[i].goto(BASE); await pages[i].fill("#in-name", names[i]); await pages[i].fill("#in-code", code);
    await pages[i].click("#btn-join"); await pages[i].waitForSelector("#screen-lobby:not(.hidden)");
    await pages[i].click(`.house-opt[data-h="${houses[i]}"]`);
  }
  await sleep(500);
  await pages[0].selectOption("#opt-timer", "normal");
  await pages[0].selectOption("#opt-rounds", "7");
  await pages[0].click("#btn-start");
  await pages[0].waitForSelector("#screen-game:not(.hidden)", { timeout: 8000 });
  for (let i = 0; i < 3; i++) uids.push(await uidOf(pages[i]));

  const t0 = Date.now();
  const playUntil = async (cond, label, maxMs = 420000) => {
    const t = Date.now();
    while (Date.now() - t < maxMs) {
      for (let i = 0; i < 3; i++) {
        if (!open[i]) continue;
        const info = await phaseInfo(pages[i]);
        if (info.tuto) await pages[i].click("#tuto-ok").catch(() => {});
        await botStep(pages[i]);
      }
      const st = await roomState(code);
      if (st && cond(st)) return st;
      await sleep(300);
    }
    check(false, "délai dépassé : " + label); return await roomState(code);
  };

  // ---- 1. on ferme l'onglet de l'hôte en pleine partie ----
  let st = await playUntil((s) => s.round >= 2 && s.phase === "orders", "manche 2, ordres");
  console.log(((Date.now() - t0) / 1000).toFixed(0) + "s : manche", st.round, "phase", st.phase);
  const before = {};
  for (const k of Object.keys((await dbGet(`rooms/${code}/private`)) || {})) before[k] = await roomPrivate(code, k);
  const botKeys = Object.keys(before).filter((k) => !uids.includes(k));
  check(botKeys.length >= 1, `les données privées des seigneurs ordinateur sont enregistrées sur le serveur (${botKeys.join(", ")})`);
  check(Object.keys(before).includes(uids[1]) && Object.keys(before).includes(uids[2]), "les données privées des 2 autres joueurs sont sur le serveur");
  const roundAtClose = st.round, seqAtClose = st.seq;
  await pages[0].close(); open[0] = false;
  const tClose = Date.now();
  let newHost = null;
  while (Date.now() - tClose < 45000) {
    const meta = await dbGet(`rooms/${code}/meta`);
    if (meta && meta.host !== uids[0]) { newHost = meta.host; break; }
    for (const i of [1, 2]) await botStep(pages[i]);
    await sleep(300);
  }
  check(!!newHost && uids.slice(1).includes(newHost), `un autre joueur a repris l'arbitrage en ${((Date.now() - tClose) / 1000).toFixed(0)} s`);
  st = await playUntil((s) => s.round > roundAtClose && s.seq > seqAtClose, "la partie continue après le départ de l'hôte");
  check(st.round > roundAtClose, `la partie continue sans l'hôte (manche ${roundAtClose} -> ${st.round})`);
  for (const k of Object.keys(before)) {
    const now = await roomPrivate(code, k);
    check(!!now && JSON.stringify(now.objectives) === JSON.stringify(before[k].objectives) && (now.used || []).length >= (before[k].used || []).length, `données privées conservées pour ${who(k)} (objectifs identiques)`);
  }

  // ---- 2. tout le monde quitte, puis les joueurs reviennent par la liste « Tes parties en cours » ----
  st = await playUntil((s) => s.round >= 4 && s.phase === "orders", "manche 4, ordres");
  const roundAtAll = st.round, seqAtAll = st.seq;
  console.log("tout le monde quitte en manche", roundAtAll);
  for (const i of [1, 2]) { await pages[i].close(); open[i] = false; }
  await sleep(3000);
  const back = async (i) => {
    pages[i] = await pages[i].__ctx.newPage();
    pages[i].on("pageerror", (e) => errors.push(`[${names[i]}] pageerror ${e.message}`));
    pages[i].on("console", (m) => { if (m.type() === "error") errors.push(`[${names[i]}] console ${m.text()}`); });
    await pages[i].goto(BASE);
    await pages[i].waitForSelector("#games:not(.hidden)", { timeout: 8000 });
    return pages[i].evaluate(() => document.querySelector("#games").innerText);
  };
  const curHost = (await dbGet(`rooms/${code}/meta`)).host;
  const first = curHost === uids[1] ? 2 : 1, second = first === 1 ? 2 : 1; // le premier à revenir n'est PAS l'arbitre d'avant
  console.log("l'arbitre d'avant était", who(curHost), "; le premier à revenir est", names[first]);
  const list = await back(first);
  check(list.includes(code) && /Manche \d+ sur 7/.test(list), "au retour, la liste montre la partie et sa manche : " + list.replace(/\n+/g, " | ").slice(0, 110));
  check(/Maison/.test(list), "…avec le nom de la maison");
  await pages[first].screenshot({ path: `${OUT}/reprise_liste.png` });
  await pages[first].click(`[data-resume="${code}"]`);
  await pages[first].waitForSelector("#screen-game:not(.hidden)", { timeout: 8000 }).catch(() => {});
  open[first] = true;
  const tBack = Date.now();
  let host2 = null;
  while (Date.now() - tBack < 45000) {
    const meta = await dbGet(`rooms/${code}/meta`);
    if (meta && meta.host === uids[first]) { host2 = meta.host; break; }
    await botStep(pages[first]);
    await sleep(300);
  }
  const dt = (Date.now() - tBack) / 1000;
  check(host2 === uids[first] && dt >= 8, `le premier joueur revenu (${names[first]}) devient l'arbitre après ${dt.toFixed(0)} s (attente de 12 s prévue)`);
  await back(second); await pages[second].click(`[data-resume="${code}"]`); open[second] = true;
  st = await playUntil((s) => s.round > roundAtAll && s.seq > seqAtAll, "la partie repart après le retour des joueurs");
  check(st.round > roundAtAll, `la partie repart là où elle en était (manche ${roundAtAll} -> ${st.round})`);
  for (const k of Object.keys(before)) {
    const now = await roomPrivate(code, k);
    check(!!now && JSON.stringify(now.objectives) === JSON.stringify(before[k].objectives), `objectifs toujours intacts après le retour de tout le monde (${who(k)})`);
  }

  // ---- 3. jusqu'à la fin ----
  st = await playUntil((s) => s.phase === "end", "fin de partie", 480000);
  check(st.phase === "end" && !!st.result, "la partie va jusqu'au bout (écran de fin, résultat calculé)");
  console.log(((Date.now() - t0) / 1000).toFixed(0) + "s au total");
  await sleep(1000);
  await pages[1].screenshot({ path: `${OUT}/reprise_fin.png` }).catch(() => {});
  console.log("ERRORS", errors.length); console.log(errors.slice(0, 10).join("\n"));
  await browser.close();
  process.exit(errors.length || fails ? 1 : 0);
})();
