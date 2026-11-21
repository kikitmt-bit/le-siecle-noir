// Faux serveur de test : sert une COPIE du site (avec js/net.js remplacé par fakenet.js) et imite
// la base de données Firebase (flux SSE) sur le même port. Aucun accès Internet nécessaire.
// Usage : node tests/fakeserver.mjs [port]   (défaut 8765)
import http from "http"; import fs from "fs"; import os from "os"; import path from "path";

const REPO = path.resolve(import.meta.dirname, "..");
const PORT = +process.argv[2] || +process.env.PORT || 8765;
const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), "siecle-test-"));
fs.cpSync(REPO, ROOT, { recursive: true, filter: (src) => !/[\\/](\.git|node_modules|tests)([\\/]|$)/.test(src.slice(REPO.length)) });
fs.copyFileSync(path.join(REPO, "tests", "fakenet.js"), path.join(ROOT, "js", "net.js"));
// sans Internet, les polices Google bloqueraient le chargement de la page
const idx = path.join(ROOT, "index.html");
fs.writeFileSync(idx, fs.readFileSync(idx, "utf8").split("\n").filter((l) => !/fonts\.googleapis|fonts\.gstatic/.test(l)).join("\n"));
process.on("exit", () => { try { fs.rmSync(ROOT, { recursive: true, force: true }); } catch {} });
process.on("SIGTERM", () => process.exit(0)); process.on("SIGINT", () => process.exit(0));

let tree = {}; const clients = new Set();
const parts = (p) => p.split("/").filter(Boolean);
function getAt(p) { let n = tree; for (const k of parts(p)) { if (n == null || typeof n !== "object") return null; n = n[k]; } return n === undefined ? null : n; }
function resolveTs(v) { if (v && typeof v === "object") { if (v[".sv"] === "timestamp") return Date.now(); const o = Array.isArray(v) ? [] : {}; for (const k in v) o[k] = resolveTs(v[k]); return o; } return v; }
function setAt(p, v) { const ks = parts(p); if (!ks.length) { tree = v || {}; return; } let n = tree; for (let i = 0; i < ks.length - 1; i++) { if (typeof n[ks[i]] !== "object" || n[ks[i]] == null) n[ks[i]] = {}; n = n[ks[i]]; } if (v === null) delete n[ks.at(-1)]; else n[ks.at(-1)] = v; }
const conns = {};
const presence = {}; // cid -> chemin du membre à passer hors ligne quand la connexion se ferme (comme onDisconnect)
function send(c) { const r = conns[c.cid]; if (r) r.write(`data: ${JSON.stringify({ sid: c.sid, v: getAt(c.path) })}\n\n`); }
function notify(p) { for (const c of clients) { if (c.path.startsWith(p) || p.startsWith(c.path)) send(c); } }
let pushId = 0;
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".svg": "image/svg+xml" };
http.createServer((req, res) => {
  const u = new URL(req.url, "http://x");
  if (u.pathname === "/__db/stream") {
    res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
    const cid = u.searchParams.get("cid"); conns[cid] = res;
    req.on("close", () => {
      delete conns[cid]; for (const c of [...clients]) if (c.cid === cid) clients.delete(c);
      if (presence[cid]) { const p = presence[cid]; delete presence[cid]; if (getAt(p) && typeof getAt(p) === "object") { setAt(p + "/online", false); setAt(p + "/seen", Date.now()); notify(p); } }
    });
    res.write(": hi\n\n"); return;
  }
  if (u.pathname === "/__db/sub") { let b = ""; req.on("data", (d) => (b += d)); req.on("end", () => { const { cid, sid, path: p, unsub } = JSON.parse(b); if (unsub) { for (const c of [...clients]) if (c.sid === sid) clients.delete(c); res.end("{}"); return; } const c = { cid, sid, path: p }; clients.add(c); send(c); res.end("{}"); }); return; }
  if (u.pathname === "/__db/op") {
    let b = ""; req.on("data", (d) => (b += d));
    req.on("end", () => {
      const { op, path: p, value, presence: pcid } = JSON.parse(b); let key = null;
      if (op === "set") setAt(p, resolveTs(value));
      if (op === "update") { for (const k in value) setAt(p + "/" + k, resolveTs(value[k])); }
      if (op === "push") { key = "k" + Date.now() + "_" + pushId++; setAt(p + "/" + key, resolveTs(value)); }
      if (op === "remove") setAt(p, null);
      if (op === "get") { res.end(JSON.stringify({ value: getAt(p) })); return; }
      if (pcid) presence[pcid] = p;
      notify(p); res.end(JSON.stringify({ ok: true, key }));
    });
    return;
  }
  if (u.pathname === "/__db/time") { res.end(JSON.stringify({ t: Date.now() })); return; }
  let f = path.join(ROOT, decodeURIComponent(u.pathname)); if (f.endsWith(path.sep) || u.pathname.endsWith("/")) f = path.join(f, "index.html");
  fs.readFile(f, (e, d) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { "Content-Type": TYPES[path.extname(f)] || "application/octet-stream", "Cache-Control": "no-store" }); res.end(d); });
}).listen(PORT, () => console.log("faux serveur sur le port", PORT));
