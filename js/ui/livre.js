// « Le livre de la soirée » : une page de chronique dessinée en image (1080×1350), à partager ou enregistrer.
// Le vainqueur couronné, le classement avec le visage des souverains, les moments forts et le registre des morts.
import { HOUSES } from "../content.js?v=1795374146";
import * as E from "../engine.js?v=1795374146";
import { $, S } from "../state.js?v=1795374146";
import { houseName, toast } from "./common.js?v=1795374146";
import { portraitSrc } from "./house.js?v=1795374146";
import { momentsForts } from "./overlays.js?v=1795374146";

const W = 1080, H = 1350;
const C = { parch: "#F0E4C7", parch2: "#E6D5AF", ink: "#241811", ink2: "#5A4430", ink3: "#75603F", red: "#A3221A", gold: "#A9843A" };
const SERIF = '"EB Garamond", Garamond, Georgia, serif', GOTH = '"Grenze Gotisch", Georgia, serif';
let cache = { key: "", url: "", blob: null };

const img = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });

// découpe un texte en lignes qui tiennent dans la largeur ; au-delà de max lignes, on coupe avec « … »
function lines(ctx, text, width, max = 99) {
  const words = String(text).split(/\s+/).filter(Boolean), out = [];
  let cur = "";
  for (const w of words) { const t = cur ? `${cur} ${w}` : w; if (ctx.measureText(t).width > width && cur) { out.push(cur); cur = w; } else cur = t; }
  if (cur) out.push(cur);
  if (out.length > max) { out.length = max; let l = out[max - 1]; while (ctx.measureText(`${l}…`).width > width && l.includes(" ")) l = l.slice(0, l.lastIndexOf(" ")); out[max - 1] = `${l}…`; }
  return out;
}

async function face(ctx, m, color, x, y, w, crown) {
  const h = (w * 140) / 120, cx = x + w / 2, cy = y + h / 2, rx = w / 2 - 2, ry = h / 2 - 2;
  ctx.save();
  ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fillStyle = "#ECDEBD"; ctx.fill(); ctx.clip();
  const ps = m && portraitSrc(m), im = ps && (await img(ps.src));
  const k = w / 120;
  if (im) { ctx.filter = m.alive ? "none" : "grayscale(1)"; ctx.drawImage(im, x + (8 + ps.dx) * k, y + 10 * k, 104 * k, 124.8 * k); ctx.filter = "none"; }
  else { ctx.fillStyle = color; ctx.globalAlpha = 0.35; ctx.fillRect(x, y, w, h); ctx.globalAlpha = 1; }
  ctx.lineWidth = 10 * k; ctx.strokeStyle = color; ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
  if (crown) {
    // couronne d'or terni posée sur la tête, comme dans le jeu
    const f = m.sex === "f", cw = (f ? 16 : 19) * k, base = y + (f ? 30 : 28) * k, mx = cx;
    ctx.beginPath();
    ctx.moveTo(mx - cw, base); ctx.lineTo(mx - cw - 2 * k, base - 11 * k); ctx.lineTo(mx - cw / 2, base - 5 * k); ctx.lineTo(mx, base - 15 * k);
    ctx.lineTo(mx + cw / 2, base - 5 * k); ctx.lineTo(mx + cw + 2 * k, base - 11 * k); ctx.lineTo(mx + cw, base); ctx.closePath();
    ctx.fillStyle = C.gold; ctx.fill(); ctx.lineWidth = 1.5 * k; ctx.strokeStyle = C.ink; ctx.stroke();
  }
  ctx.restore();
  ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.lineWidth = Math.max(2, 3 * k); ctx.strokeStyle = C.ink; ctx.stroke();
}

function rule(ctx, y, w = 300) {
  ctx.strokeStyle = C.red; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(W / 2 - w / 2, y); ctx.lineTo(W / 2 - 18, y); ctx.moveTo(W / 2 + 18, y); ctx.lineTo(W / 2 + w / 2, y); ctx.stroke();
  ctx.fillStyle = C.red; ctx.font = `20px ${SERIF}`; ctx.textAlign = "center"; ctx.fillText("✠", W / 2, y + 7);
}

export async function drawLivre(st) {
  await Promise.all([`700 64px ${GOTH}`, `400 26px ${SERIF}`, `italic 400 26px ${SERIF}`, `600 26px ${SERIF}`, `700 26px ${SERIF}`].map((f) => document.fonts.load(f).catch(() => {})));
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const ctx = cv.getContext("2d");
  const r = st.result, w = r.winner, color = (pid) => HOUSES[st.players[pid].house].color;
  // le parchemin
  ctx.fillStyle = C.parch; ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75); g.addColorStop(0, "rgba(120,80,30,0)"); g.addColorStop(1, "rgba(120,80,30,.28)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = C.ink; ctx.lineWidth = 3; ctx.strokeRect(28, 28, W - 56, H - 56); ctx.lineWidth = 1; ctx.strokeRect(40, 40, W - 80, H - 80);
  // en-tête
  const emb = await img("icons/embleme.svg");
  if (emb) ctx.drawImage(emb, W / 2 - 52, 62, 104, 104);
  ctx.textAlign = "center"; ctx.fillStyle = C.ink; ctx.font = `700 70px ${GOTH}`; ctx.fillText("Le Siècle Noir", W / 2, 236);
  const date = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  ctx.font = `italic 26px ${SERIF}`; ctx.fillStyle = C.ink2; ctx.fillText(`Chronique de la partie du ${date} · de l'an 1347 à l'an ${E.yearOf(st.round)}`, W / 2, 280);
  rule(ctx, 310, 420);
  // le vainqueur
  const k = E.king(st, w);
  await face(ctx, k, color(w), 96, 346, 220, true);
  ctx.textAlign = "left";
  ctx.fillStyle = C.red; ctx.font = `600 24px ${SERIF}`; ctx.fillText((k ? (k.sex === "f" ? "REINE DE FRANCE" : "ROI DE FRANCE") : "LA COURONNE").split("").join(" "), 360, 392);
  ctx.fillStyle = C.ink; ctx.font = `700 52px ${GOTH}`;
  let y = 452;
  for (const l of lines(ctx, k ? E.personTitle(k) : houseName(w), 640, 2)) { ctx.fillText(l, 360, y); y += 56; }
  ctx.font = `600 28px ${SERIF}`; ctx.fillStyle = color(w); ctx.fillText(`Maison ${houseName(w)} · ${st.players[w].name}`, 360, y); y += 44;
  const endTxt = (st.chronicle || []).filter((c) => c.kind === "end").slice(-1)[0]?.text || "";
  ctx.font = `italic 25px ${SERIF}`; ctx.fillStyle = C.ink2;
  for (const l of lines(ctx, endTxt, 640, 3)) { ctx.fillText(l, 360, y); y += 33; }
  // le classement
  y = Math.max(650, y + 30);
  ctx.textAlign = "center"; ctx.fillStyle = C.ink; ctx.font = `600 26px ${SERIF}`; ctx.fillText("L E   C L A S S E M E N T", W / 2, y); y += 22;
  for (const [i, x] of r.rows.entries()) {
    const p = st.players[x.pid], kk = E.king(st, x.pid);
    if (i === 0) { ctx.fillStyle = "rgba(169,132,58,.18)"; ctx.fillRect(80, y, W - 160, 68); }
    ctx.fillStyle = color(x.pid); ctx.fillRect(80, y, 6, 68);
    ctx.textAlign = "center"; ctx.fillStyle = C.ink3; ctx.font = `600 30px ${SERIF}`; ctx.fillText(["I", "II", "III", "IV", "V"][i] || String(i + 1), 128, y + 44);
    await face(ctx, kk, color(x.pid), 168, y + 5, 50, !!kk);
    ctx.textAlign = "left"; ctx.fillStyle = C.ink; ctx.font = `700 30px ${SERIF}`; ctx.fillText(houseName(x.pid), 240, y + 32);
    ctx.font = `italic 22px ${SERIF}`; ctx.fillStyle = C.ink2; ctx.fillText(`${p.name}${kk ? ` · ${E.personTitle(kk)}` : " · lignée éteinte"}`, 240, y + 58);
    ctx.textAlign = "right"; ctx.fillStyle = i === 0 ? C.red : C.ink; ctx.font = `700 38px ${SERIF}`; ctx.fillText(`${x.total}`, W - 140, y + 46);
    ctx.font = `22px ${SERIF}`; ctx.fillStyle = C.ink3; ctx.fillText("pts", W - 96, y + 46);
    y += 74;
  }
  // les moments forts
  y += 18; rule(ctx, y, 300); y += 42;
  ctx.textAlign = "center"; ctx.fillStyle = C.ink; ctx.font = `600 26px ${SERIF}`; ctx.fillText("L E S   M O M E N T S   F O R T S", W / 2, y); y += 38;
  ctx.textAlign = "left";
  for (const c of momentsForts().slice(0, 5)) {
    // un moment = l'année + le résultat, en deux lignes au plus (le titre du dilemme suffit à le reconnaître)
    const t = c.title ? `« ${c.title} » ${c.text}` : c.text;
    ctx.font = `23px ${SERIF}`;
    const ls = lines(ctx, t, W - 96 - 180, 2);
    if (y + ls.length * 29 > H - 92) break;
    ctx.fillStyle = C.red; ctx.font = `700 23px ${SERIF}`; ctx.fillText(String(c.year), 96, y);
    ctx.fillStyle = C.ink; ctx.font = `23px ${SERIF}`;
    for (const l of ls) { ctx.fillText(l, 176, y); y += 29; }
    y += 8;
  }
  // le registre des morts : combien de souverains et de princes la soirée a coûtés
  const dead = st.order.flatMap((pid) => (st.families[pid] ? st.families[pid].members.filter((m) => !m.alive) : []));
  ctx.textAlign = "center"; ctx.fillStyle = C.ink3; ctx.font = `italic 22px ${SERIF}`;
  ctx.fillText(`Le registre des morts compte ${dead.length} nom${dead.length > 1 ? "s" : ""}. kikitmt-bit.github.io/le-siecle-noir`, W / 2, H - 62);
  return cv;
}

function fileName(st) { return `siecle-noir-${houseName(st.result.winner).toLowerCase().replace(/[^a-z0-9]+/gi, "-")}-${E.yearOf(st.round)}.png`; }

export function livreHtml() {
  return `<div class="livre"><div class="livre-img" id="livre-img"><p class="wait">Le copiste trace la page…</p></div>
    <div class="livre-side"><p class="ph">Le livre de la soirée</p><p class="ptext">Toute la partie sur une page : le sacre, le classement avec le visage des souverains, les moments forts. Envoie-la à tes amis pour revivre la soirée, ou garde-la en souvenir.</p>
    <button class="btn btn-red btn-block" id="livre-share">Partager l'image</button><button class="btn btn-block" id="livre-save" style="margin-top:8px">Enregistrer l'image</button>
    <p class="hint">Sur téléphone, « Partager » l'envoie directement dans WhatsApp ou Discord.</p></div></div>`;
}

export function bindLivre() {
  const box = $("#livre-img");
  if (!box) return;
  const st = S();
  const key = `${st.gameId}:${st.seq}`;
  const show = () => { box.innerHTML = `<img src="${cache.url}" alt="Le livre de la soirée : la chronique de la partie en une page" width="1080" height="1350">`; };
  if (cache.key === key && cache.url) show();
  else drawLivre(st).then((cv) => new Promise((ok) => cv.toBlob(ok, "image/png"))).then((blob) => {
    if (cache.url) URL.revokeObjectURL(cache.url);
    cache = { key, blob, url: URL.createObjectURL(blob) };
    if ($("#livre-img")) show();
  }).catch((e) => { console.error(e); box.innerHTML = `<p class="warn">L'image n'a pas pu être dessinée.</p>`; });
  const save = () => { if (!cache.url) return; const a = document.createElement("a"); a.href = cache.url; a.download = fileName(st); document.body.appendChild(a); a.click(); a.remove(); };
  $("#livre-save").onclick = save;
  $("#livre-share").onclick = async () => {
    if (!cache.blob) return;
    const file = new File([cache.blob], fileName(st), { type: "image/png" });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ files: [file], title: "Le Siècle Noir", text: `${houseName(st.result.winner)} règne sur la France !` });
      else { save(); toast("Image enregistrée : tu peux l'envoyer à tes amis."); }
    } catch (e) { if (e && e.name !== "AbortError") save(); }
  };
}
