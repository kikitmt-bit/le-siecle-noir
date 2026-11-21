// Accueil : liste « Tes parties en cours » (reprendre, retirer, partie disparue) et message pour une partie d'un format inconnu.
const { BASE, OUT, PORT, sleep, launch, newPlayer, dbSet } = require("./lib.cjs");
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

  // 7. lien d'invitation (?r=CODE) : quelqu'un qui est déjà dans la partie y rentre directement
  await p.evaluate(() => localStorage.setItem("sn_games", "[]"));
  await p.goto(`${BASE}&r=${code}`);
  await p.waitForSelector("#screen-lobby:not(.hidden)", { timeout: 6000 }).catch(() => {});
  check((await text("#lobby-code")).trim() === code, "lien d'invitation ?r= : on entre directement dans la partie dont on est membre");

  // 8. liste sur un écran de téléphone
  const m = await newPlayer(browser, "Mobile", errors, true);
  await m.goto(BASE); await m.fill("#in-name", "Mireille"); await m.click("#btn-create"); await m.waitForSelector("#screen-lobby:not(.hidden)");
  await m.goto(BASE); await m.waitForSelector("#games:not(.hidden)", { timeout: 5000 }).catch(() => {});
  await m.screenshot({ path: `${OUT}/accueil_liste_mobile.png` });
  check(await m.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), "la liste ne déborde pas sur un écran de téléphone");

  // 9. appli installable : manifeste, icônes, image de partage, service worker
  const base = `http://localhost:${PORT}/`;
  const man = await p.evaluate(async () => { const href = document.querySelector('link[rel="manifest"]')?.getAttribute("href"); if (!href) return null; return fetch(href).then((r) => r.json()); });
  check(!!man && man.display === "standalone" && man.name === "Le Siècle Noir", "manifeste présent (nom, display standalone)");
  const sizes = await p.evaluate(async (urls) => Promise.all(urls.map((u) => new Promise((res) => { const i = new Image(); i.onload = () => res(`${i.naturalWidth}x${i.naturalHeight}`); i.onerror = () => res("absente"); i.src = u; }))), (man ? man.icons : []).map((i) => i.src));
  check(man && man.icons.every((ic, k) => sizes[k] === ic.sizes) && man.icons.some((i) => i.purpose === "maskable") && man.icons.some((i) => i.sizes === "192x192") && man.icons.some((i) => i.sizes === "512x512"), "icônes 192, 512 et maskable présentes, de la bonne taille : " + sizes.join(", "));
  const head = await p.evaluate(() => { const g = (s, a) => document.querySelector(s)?.getAttribute(a); return { og: g('meta[property="og:image"]', "content"), tw: g('meta[name="twitter:image"]', "content"), card: g('meta[name="twitter:card"]', "content"), url: g('meta[property="og:url"]', "content"), title: g('meta[property="og:title"]', "content"), apple: g('link[rel="apple-touch-icon"]', "href"), theme: g('meta[name="theme-color"]', "content") }; });
  check(/^https:\/\/kikitmt-bit\.github\.io\/le-siecle-noir\//.test(head.og) && head.og === head.tw && /^https:\/\/kikitmt-bit\.github\.io\/le-siecle-noir\//.test(head.url) && head.card === "summary_large_image" && !!head.title, "balises Open Graph et Twitter avec des adresses absolues");
  const og = await p.evaluate(async () => new Promise((res) => { const i = new Image(); i.onload = () => res(`${i.naturalWidth}x${i.naturalHeight}`); i.onerror = () => res("absente"); i.src = "og.png"; }));
  check(og === "1200x630", "og.png fait 1200x630 : " + og);
  check(!!head.apple && /apple-touch-icon\.png$/.test(head.apple), "apple-touch-icon déclarée");
  // service worker : se déclare hors mode test, et la page marche toujours quand il la contrôle
  const sw = await newPlayer(browser, "SW", errors);
  await sw.goto(`http://localhost:${PORT}/?fast`);
  const reg = await sw.evaluate(async () => { try { const r = await Promise.race([navigator.serviceWorker.ready, new Promise((_, rej) => setTimeout(() => rej("délai"), 6000))]); return !!r.active; } catch (e) { return String(e); } });
  check(reg === true, "service worker enregistré et actif : " + reg);
  await sw.reload(); await sw.waitForSelector("#screen-home:not(.hidden)");
  check(await sw.evaluate(() => !!navigator.serviceWorker.controller), "la page est servie sous le contrôle du service worker (réseau d'abord)");
  check((await sw.evaluate(() => document.querySelector("h1")?.textContent)) === "Le Siècle Noir", "…et le jeu s'affiche normalement");

  console.log("ERRORS", errors.length); console.log(errors.slice(0, 10).join("\n"));
  await browser.close();
  process.exit(errors.length || fails ? 1 : 0);
})();
