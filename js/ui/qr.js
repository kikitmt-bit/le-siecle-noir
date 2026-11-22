// QR code (mode octets, correction M, versions 1 à 6) dessiné en SVG : pour rejoindre une partie depuis un téléphone
// en scannant l'écran de la télé. Suffit pour une adresse de 100 caractères environ.

// version : [octets de correction par bloc, [données par bloc...]], position des motifs d'alignement
const V = [null,
  [10, [16]], [16, [28]], [26, [44]], [18, [32, 32]], [24, [43, 43]], [16, [27, 27, 27, 27]]];
const ALIGN = [null, [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34]];

// corps de Galois GF(256), polynôme 0x11d
const EXP = new Array(512), LOG = new Array(256);
for (let i = 0, x = 1; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 256) x ^= 0x11d; }
for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
const mul = (a, b) => (a && b ? EXP[LOG[a] + LOG[b]] : 0);

function rsEc(data, n) {
  let g = [1];
  for (let i = 0; i < n; i++) { const ng = new Array(g.length + 1).fill(0); g.forEach((c, j) => { ng[j] ^= c; ng[j + 1] ^= mul(c, EXP[i]); }); g = ng; }
  const r = new Array(n).fill(0);
  for (const d of data) { const f = d ^ r.shift(); r.push(0); for (let j = 0; j < n; j++) r[j] ^= mul(g[j + 1], f); }
  return r;
}

function codewords(bytes, ver) {
  const [ecn, blocks] = V[ver];
  const cap = blocks.reduce((a, b) => a + b, 0);
  const bits = [];
  const put = (v, n) => { for (let i = n - 1; i >= 0; i--) bits.push((v >> i) & 1); };
  put(4, 4); put(bytes.length, 8); bytes.forEach((b) => put(b, 8));
  put(0, Math.min(4, cap * 8 - bits.length));
  while (bits.length % 8) bits.push(0);
  const data = [];
  for (let i = 0; i < bits.length; i += 8) data.push(bits.slice(i, i + 8).reduce((a, b) => (a << 1) | b, 0));
  for (let p = 0; data.length < cap; p++) data.push(p % 2 ? 0x11 : 0xec);
  const ds = [], es = []; let k = 0;
  for (const n of blocks) { const d = data.slice(k, k + n); k += n; ds.push(d); es.push(rsEc(d, ecn)); }
  const out = [];
  for (let i = 0; i < Math.max(...blocks); i++) ds.forEach((d) => i < d.length && out.push(d[i]));
  for (let i = 0; i < ecn; i++) es.forEach((e) => out.push(e[i]));
  return out;
}

function formatBits(mask) {
  const d = (0 << 3) | mask; // correction M = 00
  let r = d << 10;
  for (let i = 14; i >= 10; i--) if (r & (1 << i)) r ^= 0x537 << (i - 10);
  return ((d << 10) | r) ^ 0x5412;
}

const MASKS = [(r, c) => (r + c) % 2 === 0, (r) => r % 2 === 0, (r, c) => c % 3 === 0, (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0, (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0, (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0];

function build(ver, cw, mask) {
  const n = 17 + 4 * ver;
  const m = Array.from({ length: n }, () => new Array(n).fill(null));
  const set = (r, c, v) => { if (r >= 0 && c >= 0 && r < n && c < n) m[r][c] = v; };
  const finder = (r0, c0) => { for (let r = -1; r <= 7; r++) for (let c = -1; c <= 7; c++) { const on = r >= 0 && r <= 6 && c >= 0 && c <= 6 && (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)); set(r0 + r, c0 + c, on); } };
  finder(0, 0); finder(0, n - 7); finder(n - 7, 0);
  for (let i = 8; i < n - 8; i++) { m[6][i] = i % 2 === 0; m[i][6] = i % 2 === 0; }
  const al = ALIGN[ver];
  for (const r of al) for (const c of al) {
    if (m[r][c] !== null) continue;
    for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) m[r + dr][c + dc] = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
  }
  m[n - 8][8] = true; // module sombre
  // réserve des informations de format
  const fmt = formatBits(mask);
  const fb = (i) => ((fmt >> i) & 1) === 1;
  for (let i = 0; i <= 5; i++) m[i][8] = fb(i);
  m[7][8] = fb(6); m[8][8] = fb(7); m[8][7] = fb(8);
  for (let i = 9; i <= 14; i++) m[8][14 - i] = fb(i);
  for (let i = 0; i <= 7; i++) m[8][n - 1 - i] = fb(i);
  for (let i = 8; i <= 14; i++) m[n - 15 + i][8] = fb(i);
  // données en zigzag
  const bits = cw.flatMap((b) => Array.from({ length: 8 }, (_, i) => (b >> (7 - i)) & 1));
  let k = 0, up = true;
  for (let c = n - 1; c > 0; c -= 2) {
    if (c === 6) c--;
    for (let i = 0; i < n; i++) {
      const r = up ? n - 1 - i : i;
      for (const cc of [c, c - 1]) {
        if (m[r][cc] !== null) continue;
        const b = k < bits.length ? bits[k++] === 1 : false;
        m[r][cc] = MASKS[mask](r, cc) ? !b : b;
      }
    }
    up = !up;
  }
  return m;
}

// pénalité simplifiée (suites et blocs 2×2) : on garde le masque le plus lisible
function penalty(m) {
  const n = m.length; let p = 0;
  for (let r = 0; r < n; r++) for (const line of [m[r], m.map((row) => row[r])]) {
    let run = 1;
    for (let i = 1; i < n; i++) { if (line[i] === line[i - 1]) { run++; if (run === 5) p += 3; else if (run > 5) p++; } else run = 1; }
  }
  for (let r = 0; r < n - 1; r++) for (let c = 0; c < n - 1; c++) { const v = m[r][c]; if (v === m[r][c + 1] && v === m[r + 1][c] && v === m[r + 1][c + 1]) p += 3; }
  const dark = m.flat().filter(Boolean).length;
  return p + Math.floor(Math.abs((dark * 100) / (n * n) - 50) / 5) * 10;
}

export function qrMatrix(text) {
  const bytes = [...new TextEncoder().encode(text)];
  const ver = [1, 2, 3, 4, 5, 6].find((v) => V[v][1].reduce((a, b) => a + b, 0) - 2 >= bytes.length);
  if (!ver) return null;
  const cw = codewords(bytes, ver);
  let best = null, bp = Infinity;
  for (let mask = 0; mask < 8; mask++) { const m = build(ver, cw, mask); const p = penalty(m); if (p < bp) { bp = p; best = m; } }
  return best;
}

export function qrSvg(text, { dark = "#241811", light = "#F5EBD3", size = 200 } = {}) {
  const m = qrMatrix(text);
  if (!m) return "";
  const n = m.length, q = 3, w = n + 2 * q;
  let d = "";
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (m[r][c]) d += `M${c + q},${r + q}h1v1h-1z`;
  return `<svg class="qr" viewBox="0 0 ${w} ${w}" width="${size}" height="${size}" shape-rendering="crispEdges" role="img" aria-label="QR code pour rejoindre la partie"><rect width="${w}" height="${w}" fill="${light}"/><path d="${d}" fill="${dark}"/></svg>`;
}
