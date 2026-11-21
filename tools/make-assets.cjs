// Fabrique les images du jeu : icônes de l'appli, favicon et image de partage (og.png).
// Tout est dessiné ici (SVG/HTML) puis photographié par Chrome via Playwright : rien à télécharger.
// Usage : node tools/make-assets.cjs        (réécrit icons/*.png, icons/blason.svg et og.png)
const fs = require("fs"); const path = require("path");
const ROOT = path.resolve(__dirname, "..");
let chromium;
for (const p of [process.env.PLAYWRIGHT_PATH, "playwright", "/opt/node22/lib/node_modules/playwright"].filter(Boolean)) { try { ({ chromium } = require(p)); break; } catch (e) {} }
if (!chromium) throw new Error("Playwright introuvable (PLAYWRIGHT_PATH ?)");
const chrome = process.env.CHROME_PATH || (fs.existsSync("/usr/bin/google-chrome") ? "/usr/bin/google-chrome" : undefined);

// ---- le blason : bouclier rouge, tour d'or, couronne, hachures de gravure ----
// scale < 1 : le dessin rétrécit autour du centre (icônes « maskable », qui doivent rester dans la zone sûre)
function blasonSvg({ size = 512, scale = 1, bg = true, round = 0 } = {}) {
  const hatch = Array.from({ length: 44 }, (_, i) => `<line x1="${60 + i * 9}" y1="60" x2="${-60 + i * 9}" y2="460"/>`).join("");
  const crown = "M196,128 L206,78 L232,106 L256,66 L280,106 L306,78 L316,128 Z";
  const tower = "M200,372 V248 h18 v-24 h20 v24 h20 v-24 h20 v24 h18 V372 Z";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="fond" cx="50%" cy="42%" r="75%"><stop offset="0" stop-color="#3a2a1c"/><stop offset=".6" stop-color="#1e150e"/><stop offset="1" stop-color="#0b0805"/></radialGradient>
    <radialGradient id="rouge" cx="50%" cy="30%" r="80%"><stop offset="0" stop-color="#b02828"/><stop offset=".55" stop-color="#8E1B1B"/><stop offset="1" stop-color="#4f0c0c"/></radialGradient>
    <linearGradient id="or" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3d98a"/><stop offset=".55" stop-color="#d9a441"/><stop offset="1" stop-color="#a97420"/></linearGradient>
    <clipPath id="ecu"><path d="M106,112 H406 V250 C406,350 336,410 256,440 C176,410 106,350 106,250 Z"/></clipPath>
    <filter id="ombre" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#000" flood-opacity=".6"/></filter>
  </defs>
  ${bg ? `<rect width="512" height="512" rx="${round}" fill="url(#fond)"/><rect x="14" y="14" width="484" height="484" rx="${Math.max(0, round - 10)}" fill="none" stroke="#D9A441" stroke-opacity=".35" stroke-width="3"/>` : ""}
  <g transform="translate(256 256) scale(${scale}) translate(-256 -256)">
    <g filter="url(#ombre)">
      <path d="M106,112 H406 V250 C406,350 336,410 256,440 C176,410 106,350 106,250 Z" fill="url(#rouge)" stroke="#2B1D12" stroke-width="12" stroke-linejoin="round"/>
    </g>
    <g clip-path="url(#ecu)"><g stroke="#2B1D12" stroke-opacity=".35" stroke-width="2.4">${hatch}</g></g>
    <path d="M122,124 H390 V250 C390,338 330,394 256,422 C182,394 122,338 122,250 Z" fill="none" stroke="url(#or)" stroke-width="6" stroke-linejoin="round"/>
    <g filter="url(#ombre)"><path d="${tower}" fill="url(#or)" stroke="#2B1D12" stroke-width="7" stroke-linejoin="round"/></g>
    <path d="M238,372 V332 a18,18 0 0 1 36,0 V372 Z" fill="#3a0f0f" stroke="#2B1D12" stroke-width="4"/>
    <rect x="251" y="268" width="10" height="26" rx="4" fill="#3a0f0f"/>
    <g stroke="#2B1D12" stroke-opacity=".4" stroke-width="2"><line x1="212" y1="262" x2="212" y2="360"/><line x1="226" y1="262" x2="226" y2="360"/><line x1="286" y1="262" x2="286" y2="360"/><line x1="300" y1="262" x2="300" y2="360"/></g>
    <g filter="url(#ombre)"><path d="${crown}" fill="url(#or)" stroke="#2B1D12" stroke-width="7" stroke-linejoin="round"/></g>
    <rect x="196" y="122" width="120" height="14" rx="3" fill="url(#or)" stroke="#2B1D12" stroke-width="5"/>
    <circle cx="206" cy="76" r="8" fill="#8E1B1B" stroke="#2B1D12" stroke-width="4"/><circle cx="256" cy="64" r="9" fill="#8E1B1B" stroke="#2B1D12" stroke-width="4"/><circle cx="306" cy="76" r="8" fill="#8E1B1B" stroke="#2B1D12" stroke-width="4"/>
  </g>
</svg>`;
}

function ogHtml(blason) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  html,body{margin:0;width:1200px;height:630px;overflow:hidden;background:#1A120C}
  .page{position:relative;width:1200px;height:630px;background:#E9DBBB;font-family:"Cardo","Crimson Text","GFS Baskerville",Georgia,serif;color:#2B1D12}
  .paper{position:absolute;inset:0}
  .vig{position:absolute;inset:0;background:radial-gradient(ellipse at 55% 45%,rgba(255,248,225,.55) 0%,rgba(255,248,225,0) 55%,rgba(110,72,28,.55) 100%)}
  .frame{position:absolute;inset:26px;border:4px solid #2B1D12;outline:2px solid #6B5638;outline-offset:-14px}
  .corner{position:absolute;width:46px;height:46px;border:3px solid #8E1B1B;transform:rotate(45deg)}
  .blason{position:absolute;left:70px;top:70px;width:490px;height:490px;filter:drop-shadow(0 10px 18px rgba(40,20,5,.55))}
  .txt{position:absolute;left:560px;top:78px;width:590px;text-align:center}
  .over{font-size:25px;letter-spacing:7px;text-transform:uppercase;color:#6B5638;font-weight:700}
  h1{margin:4px 0 6px;font-size:104px;line-height:.98;font-weight:700;letter-spacing:1px;color:#1f140b;text-shadow:2px 2px 0 rgba(142,27,27,.25),0 0 1px #000}
  h1 i{display:block;font-style:normal;color:#8E1B1B;font-size:122px;letter-spacing:3px;text-shadow:2px 2px 0 rgba(43,29,18,.35)}
  .rule{height:4px;margin:12px 50px 16px;background:linear-gradient(90deg,transparent,#2B1D12 18%,#2B1D12 82%,transparent);position:relative}
  .rule:after{content:"";position:absolute;left:50%;top:-7px;width:16px;height:16px;background:#8E1B1B;transform:translateX(-50%) rotate(45deg);border:2px solid #2B1D12}
  .sub{font-size:35px;font-style:italic;line-height:1.25;color:#3b2a18}
  .foot{margin-top:18px;font-size:23px;letter-spacing:2.5px;color:#6B5638;text-transform:uppercase}
  </style></head><body><div class="page">
  <svg class="paper" width="1200" height="630"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="3" seed="7"/><feColorMatrix values="0 0 0 0 .35  0 0 0 0 .24  0 0 0 0 .1  0 0 0 .09 0"/></filter><filter id="t"><feTurbulence type="fractalNoise" baseFrequency=".012 .02" numOctaves="4" seed="3"/><feColorMatrix values="0 0 0 0 .55  0 0 0 0 .38  0 0 0 0 .16  0 0 0 .5 -.12"/></filter><rect width="1200" height="630" filter="url(#t)"/></svg>
  <div class="vig"></div><div class="frame"></div>
  <div class="blason">${blason}</div>
  <div class="txt"><div class="over">Jeu de stratégie médiéval</div><h1>Le Siècle<i>Noir</i></h1><div class="rule"></div>
  <div class="sub">France, 1347. La peste arrive,<br>les rois meurent, les héritiers<br>s'entretuent.</div><div class="foot">Entre amis · 2 à 4 joueurs</div></div>
  </div></body></html>`;
}

(async () => {
  const browser = await chromium.launch({ executablePath: chrome, args: ["--no-sandbox"] });
  const shot = async (html, w, h, file, transparent = false) => {
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    await page.setContent(html); await page.waitForTimeout(250);
    await page.screenshot({ path: file, omitBackground: transparent }); await page.close();
  };
  const svgPage = (svg, size) => `<!doctype html><html><body style="margin:0;background:transparent">${svg.replace(/width="\d+" height="\d+"/, `width="${size}" height="${size}"`)}</body></html>`;
  const icons = path.join(ROOT, "icons");
  fs.mkdirSync(icons, { recursive: true });
  // le dessin « source », gardé dans le dépôt (sert aussi de favicon vectorielle)
  fs.writeFileSync(path.join(icons, "blason.svg"), blasonSvg({ round: 96 }));
  for (const [file, size, opts] of [
    ["icon-192.png", 192, { round: 0 }], ["icon-512.png", 512, { round: 0 }],
    ["icon-maskable-512.png", 512, { scale: 0.74, round: 0 }], ["icon-maskable-192.png", 192, { scale: 0.74, round: 0 }],
    ["apple-touch-icon.png", 180, { scale: 0.9, round: 0 }], ["favicon-32.png", 32, { scale: 1, round: 0 }], ["favicon-48.png", 48, { scale: 1, round: 0 }],
  ]) await shot(svgPage(blasonSvg(opts), size), size, size, path.join(icons, file));
  // image de partage 1200 x 630 : le blason sans fond (il se pose sur le parchemin)
  await shot(ogHtml(blasonSvg({ bg: false }).replace(/width="512" height="512"/, 'width="100%" height="100%"')), 1200, 630, path.join(ROOT, "og.png"));
  await browser.close();
  // og.png : on réduit le poids (WhatsApp ignore les images trop lourdes) en limitant les couleurs, si Python + PIL sont là
  try {
    require("child_process").execFileSync("python3", ["-c", "import sys;from PIL import Image;f=sys.argv[1];im=Image.open(f).convert('RGB');im.quantize(colors=192,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.FLOYDSTEINBERG).save(f,optimize=True)", path.join(ROOT, "og.png")]);
  } catch (e) { console.log("(og.png non réduit : Python/PIL absent)"); }
  try { // favicon.ico à la racine (anciens navigateurs)
    require("child_process").execFileSync("python3", ["-c", "import sys;from PIL import Image;Image.open(sys.argv[1]).convert('RGBA').save(sys.argv[2],sizes=[(16,16),(32,32),(48,48)])", path.join(icons, "icon-512.png"), path.join(ROOT, "favicon.ico")]);
  } catch (e) { console.log("(favicon.ico non créé : Python/PIL absent)"); }
  console.log("images créées dans icons/ et og.png (" + Math.round(fs.statSync(path.join(ROOT, "og.png")).size / 1024) + " Ko)");
})();
