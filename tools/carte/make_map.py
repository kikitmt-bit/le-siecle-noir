"""Fabrique la carte du Siècle Noir : la France de 1347 aux vraies formes, en gravure « Chronique ».

    python -I tools/carte/make_map.py            → réécrit js/map.js et js/map-art.js
    python -I tools/carte/make_map.py --apercu F → écrit aussi un aperçu HTML autonome dans F

Sources : côtes et fleuves de Natural Earth (domaine public), extraits une fois pour toutes dans
ne-france.json par extraire_ne.py. Les frontières des provinces sont tracées à la main ci-dessous,
point par point (longitude, latitude), d'après les grandes provinces historiques. Chaque frontière
commune n'est décrite qu'une fois : deux provinces voisines partagent exactement le même trait.

On ne retouche jamais js/map.js ni js/map-art.js à la main : on modifie ce fichier et on relance.
"""
import json, math, random, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
NE = json.loads(Path(__file__).with_name("ne-france.json").read_text(encoding="utf-8"))
W, H = 840, 780

INK, INK2, PAPER, VELIN, RED, GOLD = "#241811", "#5A4430", "#F0E4C7", "#E6D5AF", "#A3221A", "#A9843A"

# ---------------------------------------------------------------- projection (conique conforme de Lambert)
LON0, LAT0, LAT1, LAT2 = 3.0, 46.5, 44.0, 49.0
_r = math.radians
_n = math.log(math.cos(_r(LAT1)) / math.cos(_r(LAT2))) / math.log(math.tan(math.pi / 4 + _r(LAT2) / 2) / math.tan(math.pi / 4 + _r(LAT1) / 2))
_F = math.cos(_r(LAT1)) * math.tan(math.pi / 4 + _r(LAT1) / 2) ** _n / _n
_rho0 = _F / math.tan(math.pi / 4 + _r(LAT0) / 2) ** _n


def lcc(lon, lat):
    rho = _F / math.tan(math.pi / 4 + _r(lat) / 2) ** _n
    t = _n * _r(lon - LON0)
    return rho * math.sin(t), _rho0 - rho * math.cos(t)


# cadrage : ces points extrêmes de la France doivent tenir dans le plan, avec une marge
FRAME = [(-4.80, 48.40), (8.23, 48.97), (4.30, 51.37), (1.0, 42.55), (-1.80, 43.30), (7.55, 43.75)]
MARGIN = (16, 12, 16, 14)  # gauche, haut, droite, bas
_fx = [lcc(*p) for p in FRAME]
_minx, _maxx = min(p[0] for p in _fx), max(p[0] for p in _fx)
_miny, _maxy = min(p[1] for p in _fx), max(p[1] for p in _fx)
SCALE = min((W - MARGIN[0] - MARGIN[2]) / (_maxx - _minx), (H - MARGIN[1] - MARGIN[3]) / (_maxy - _miny))
_ox = MARGIN[0] + ((W - MARGIN[0] - MARGIN[2]) - SCALE * (_maxx - _minx)) / 2 - SCALE * _minx
_oy = MARGIN[1] + ((H - MARGIN[1] - MARGIN[3]) - SCALE * (_maxy - _miny)) / 2 + SCALE * _maxy
KM = SCALE * 6371 / 1000 * 1.0  # pixels par kilomètre (approché, au parallèle central)


def P(lon, lat):
    x, y = lcc(lon, lat)
    return (_ox + SCALE * x, _oy - SCALE * y)


# ---------------------------------------------------------------- petite géométrie
def dist(a, b):
    return math.hypot(a[0] - b[0], a[1] - b[1])


def seg_dist(p, a, b):
    dx, dy = b[0] - a[0], b[1] - a[1]
    L = dx * dx + dy * dy
    t = 0 if L == 0 else max(0, min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L))
    return math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy)


def simplify(pts, tol):
    if len(pts) < 3:
        return pts[:]
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        i, j = stack.pop()
        best, k = -1, -1
        for m in range(i + 1, j):
            d = seg_dist(pts[m], pts[i], pts[j])
            if d > best:
                best, k = d, m
        if best > tol:
            keep[k] = True
            stack += [(i, k), (k, j)]
    return [p for p, f in zip(pts, keep) if f]


def chaikin(pts, it=2):
    for _ in range(it):
        out = [pts[0]]
        for a, b in zip(pts, pts[1:]):
            out += [(0.75 * a[0] + 0.25 * b[0], 0.75 * a[1] + 0.25 * b[1]), (0.25 * a[0] + 0.75 * b[0], 0.25 * a[1] + 0.75 * b[1])]
        out.append(pts[-1])
        pts = out
    return pts


def densify(pts, step):
    out = [pts[0]]
    for a, b in zip(pts, pts[1:]):
        n = max(1, int(dist(a, b) / step))
        out += [(a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n) for k in range(1, n + 1)]
    return out


def wobble(pts, seed, amp=1.0):
    """Trait de frontière tracé à la main : de lentes ondulations et un léger tremblé, nuls aux extrémités."""
    rnd = random.Random(seed)
    pts = densify(pts, 2.5)
    s = [0.0]
    for a, b in zip(pts, pts[1:]):
        s.append(s[-1] + dist(a, b))
    L = s[-1]
    waves = [(2.4 * amp, rnd.uniform(48, 64), rnd.uniform(0, 6.3)), (1.0 * amp, rnd.uniform(16, 22), rnd.uniform(0, 6.3)),
             (0.4 * amp, rnd.uniform(6, 8), rnd.uniform(0, 6.3))]
    out = []
    for i, p in enumerate(pts):
        a, b = pts[max(0, i - 1)], pts[min(len(pts) - 1, i + 1)]
        tx, ty = b[0] - a[0], b[1] - a[1]
        ln = math.hypot(tx, ty) or 1
        env = min(1.0, s[i] / 14, (L - s[i]) / 14)
        off = env * sum(A * math.sin(2 * math.pi * s[i] / lam + ph) for A, lam, ph in waves)
        out.append((p[0] - ty / ln * off, p[1] + tx / ln * off))
    return out


def area(ring):
    return 0.5 * sum(a[0] * b[1] - b[0] * a[1] for a, b in zip(ring, ring[1:] + ring[:1]))


def centroid(ring):
    A = area(ring) or 1e-9
    cx = sum((a[0] + b[0]) * (a[0] * b[1] - b[0] * a[1]) for a, b in zip(ring, ring[1:] + ring[:1])) / (6 * A)
    cy = sum((a[1] + b[1]) * (a[0] * b[1] - b[0] * a[1]) for a, b in zip(ring, ring[1:] + ring[:1])) / (6 * A)
    return cx, cy


def inside(p, ring):
    x, y, c = p[0], p[1], False
    for a, b in zip(ring, ring[1:] + ring[:1]):
        if (a[1] > y) != (b[1] > y) and x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]:
            c = not c
    return c


def fmt(v):
    s = f"{v:.1f}"
    return s[:-2] if s.endswith(".0") else s


def path_d(pts, close=True):
    d = "M" + " L".join(f"{fmt(x)},{fmt(y)}" for x, y in pts)
    return d + (" Z" if close else "")


# marges larges : sur un écran 16:9 la carte montre aussi les pays voisins, le décor doit les couvrir
MX, MY = 440, 170


def clamp_pts(pts, mx=MX, my=MY):
    return [(min(W + mx, max(-mx, x)), min(H + my, max(-my, y))) for x, y in pts]


# ---------------------------------------------------------------- données Natural Earth
MAIN = [tuple(p) for p in next(l for l in NE["land"] if l["open"])["pts"]]  # côte continentale, Toscane → Pays-Bas
RINGS = [[tuple(p) for p in l["pts"]] for l in NE["land"] if not l["open"]]


def ring_bbox(r):
    xs, ys = [p[0] for p in r], [p[1] for p in r]
    return min(xs), min(ys), max(xs), max(ys)


CORSE_LL = next(r for r in RINGS if 8.5 < ring_bbox(r)[0] < 8.6 and ring_bbox(r)[3] > 42.9)


def river_pieces(name):
    return [[tuple(p) for p in r["pts"]] for r in NE["rivers"] if r["name"] == name]


def nearest_idx(pts, q):
    return min(range(len(pts)), key=lambda i: (pts[i][0] - q[0]) ** 2 * math.cos(_r(q[1])) ** 2 + (pts[i][1] - q[1]) ** 2)


def river_sub(name, a, b):
    best = None
    for pc in river_pieces(name):
        i, j = nearest_idx(pc, a), nearest_idx(pc, b)
        err = dist(pc[i], a) + dist(pc[j], b)
        if best is None or err < best[0]:
            best = (err, pc, i, j)
    _, pc, i, j = best
    return pc[i:j + 1] if i <= j else pc[j:i + 1][::-1]


# ---------------------------------------------------------------- nœuds : points où se rencontrent les frontières
COAST = {  # sur la côte (recalés sur le trait de côte)
    "hendaye": (-1.78, 43.37), "biscarrosse": (-1.25, 44.40), "gironde": (-0.69, 45.33), "bourgneuf": (-2.03, 46.98),
    "loire": (-2.10, 47.27), "couesnon": (-1.51, 48.63), "bresle": (1.38, 50.06), "gravelines": (2.13, 51.00),
    "escaut": (4.25, 51.36), "menton": (7.52, 43.78), "petitrhone": (4.40, 43.45), "leucate": (3.04, 42.90),
}
NODES = {
    "bna": (-1.07, 48.52), "nao": (0.45, 48.40), "noi": (1.45, 48.82), "npi": (1.75, 49.68), "pic": (3.80, 49.70),
    "fpc": (3.55, 50.03), "fce": (3.80, 50.10), "cambrai": (3.24, 50.17), "oib": (2.85, 48.12), "ibc": (3.30, 48.32),
    "obe": (2.85, 47.55), "obp": (0.95, 46.80), "aop": (0.00, 47.12), "bcl": (5.55, 47.78), "blc": (5.75, 47.75),
    "lac": (6.83, 47.82), "clf": (5.40, 49.60), "laf": (7.60, 49.08), "acf": (7.00, 47.50), "bcy": (5.25, 46.58),
    "csl": (5.55, 46.30), "csf": (6.07, 46.45), "byb": (3.98, 46.28), "aby": (3.72, 46.12), "lsp": (5.20, 45.02),
    "lpa": (4.82, 45.08), "apl": (4.65, 44.27), "spf": (7.02, 44.70), "bpl": (1.15, 46.38), "bla": (2.50, 46.05),
    "plg": (0.65, 45.55), "lgl": (1.85, 44.48), "lla": (2.20, 44.62), "ggl": (0.95, 43.95), "glf": (1.10, 42.75),
}


def R(name, a, b):
    return ("river", name, a, b)


# ---------------------------------------------------------------- frontières (une seule fois chacune)
EDGES = {
    # frontière extérieure du jeu
    "escaut|cambrai": [R("Schelde", (4.30, 51.27), (3.24, 50.17))],
    "cambrai|fce": [(3.40, 50.14), (3.60, 50.12)],
    "fce|clf": [(4.10, 50.02), (4.30, 49.97), (4.55, 49.97), (4.80, 50.15), (4.88, 49.95), (4.85, 49.80), (5.00, 49.78), (5.20, 49.70)],
    "clf|laf": [(5.80, 49.55), (6.05, 49.47), (6.37, 49.47), (6.55, 49.42), (6.73, 49.17), (7.05, 49.12), (7.30, 49.12), (7.45, 49.15)],
    "laf|acf": [(7.94, 49.05), R("Rhin", (8.23, 48.97), (7.59, 47.58)), (7.45, 47.47), (7.20, 47.49)],
    "acf|csf": [(7.08, 47.47), (6.95, 47.30), (6.82, 47.17), (6.65, 47.00), (6.43, 46.85), (6.27, 46.67), (6.13, 46.57)],
    "csf|spf": [(6.10, 46.30), (5.97, 46.20), (6.10, 46.14), (6.22, 46.25), (6.45, 46.38), (6.65, 46.42), (6.80, 46.38), (6.85, 46.15),
                (6.95, 46.05), (7.04, 45.92), (6.88, 45.82), (6.80, 45.68), (7.00, 45.55), (7.15, 45.35), (7.05, 45.22), (6.85, 45.15),
                (6.65, 45.12), (6.72, 44.93), (6.95, 44.85)],
    "spf|menton": [(6.95, 44.55), (6.88, 44.42), (7.00, 44.25), (7.25, 44.15), (7.55, 44.12), (7.68, 44.00), (7.55, 43.85)],
    "leucate|glf": [(2.85, 42.82), (2.55, 42.78), (2.25, 42.75), (2.00, 42.70), (1.78, 42.62), (1.72, 42.66), (1.45, 42.65), (1.30, 42.72)],
    "glf|hendaye": [(0.95, 42.80), (0.70, 42.87), (0.65, 42.70), (0.30, 42.70), (0.00, 42.70), (-0.30, 42.83), (-0.55, 42.80),
                    (-0.75, 42.93), (-1.00, 43.00), (-1.30, 43.08), (-1.45, 43.07), (-1.60, 43.25)],
    # entre provinces
    "gravelines|fpc": [(2.25, 50.75), (2.10, 50.55), (2.04, 50.37), (2.34, 50.17), (2.75, 50.08), (3.05, 50.05)],
    "fpc|fce": [],
    "bresle|npi": [(1.60, 49.92), (1.75, 49.77)],
    "npi|noi": [(1.72, 49.48), (1.62, 49.25), (1.53, 49.08), (1.58, 48.95)],
    "nao|noi": [(0.60, 48.62), (0.95, 48.68), (1.25, 48.75)],
    "bna|nao": [(-0.75, 48.50), (-0.35, 48.48), (0.00, 48.38), (0.25, 48.38)],
    "couesnon|bna": [(-1.45, 48.45), (-1.25, 48.48)],
    "loire|bna": [R("Loire", (-1.73, 47.21), (-1.17, 47.37)), (-1.10, 47.60), (-1.23, 47.94), (-1.05, 48.02), (-1.20, 48.12), (-1.05, 48.30)],
    "bourgneuf|aop": [(-1.60, 46.95), (-1.20, 46.98), (-0.88, 47.02), (-0.53, 47.12), (-0.30, 47.08)],
    "nao|aop": [(0.75, 48.15), (0.80, 47.90), (0.55, 47.62), (0.40, 47.45), (0.17, 47.28)],
    "npi|pic": [(2.05, 49.60), (2.40, 49.62), (2.75, 49.62), (3.10, 49.68), (3.45, 49.70)],
    "pic|fpc": [(3.65, 49.88)],
    "pic|ibc": [(3.70, 49.45), (3.50, 49.25), (3.35, 49.05), (3.25, 48.85), (3.15, 48.62), (3.10, 48.45)],
    "noi|oib": [(1.70, 48.60), (1.95, 48.42), (2.20, 48.30), (2.55, 48.18)],
    "oib|ibc": [(3.05, 48.25)],
    "oib|obe": [(2.80, 47.85)],
    "obe|obp": [(2.55, 47.48), (2.20, 47.35), (1.85, 47.25), (1.50, 47.15), (1.30, 46.95)],
    "obp|aop": [(0.60, 46.90), (0.30, 46.98)],
    "ibc|bcl": [(3.60, 48.15), (3.95, 47.98), (4.35, 48.00), (4.75, 47.85), (5.10, 47.80)],
    "bcl|clf": [(5.45, 48.05), (5.40, 48.35), (5.05, 48.62), (4.98, 48.85), (4.98, 49.05), (5.05, 49.30), (5.15, 49.55)],
    "bcl|blc": [],
    "blc|lac": [(6.10, 47.92), (6.50, 47.92)],
    "laf|lac": [(7.30, 48.75), (7.17, 48.51), (7.10, 48.30), (7.10, 48.17), (7.02, 48.04)],
    "lac|acf": [(6.85, 47.62), (6.95, 47.55)],
    "blc|bcy": [(5.55, 47.55), (5.42, 47.28), (5.30, 47.05), (5.35, 46.80)],
    "bcy|csl": [(5.40, 46.42)],
    "csl|csf": [(5.80, 46.30), (6.00, 46.40)],
    "bcy|byb": [(5.00, 46.48), (4.85, 46.27), (4.55, 46.22), (4.25, 46.25)],
    "byb|obe": [(3.95, 46.55), (4.00, 46.85), (3.95, 47.15), (3.75, 47.40), (3.30, 47.48)],
    "aby|byb": [],
    "csl|lsp": [(5.45, 46.05), (5.30, 45.85), (5.20, 45.75), (5.45, 45.55), (5.40, 45.30)],
    "lsp|lpa": [(5.00, 45.05)],
    "lpa|aby": [(4.55, 45.20), (4.25, 45.25), (3.95, 45.35), (3.80, 45.55), (3.75, 45.85), (3.70, 46.05)],
    "lsp|spf": [(5.45, 44.95), (5.75, 44.85), (6.00, 44.85), (6.35, 44.85), (6.70, 44.80)],
    "lpa|apl": [R("Rhône", (4.82, 45.08), (4.65, 44.27))],
    "apl|petitrhone": [R("Rhône", (4.65, 44.27), (4.63, 43.70)), R("Rhône", (4.61, 43.70), (4.40, 43.47))],
    "lla|apl": [(2.55, 44.75), (2.95, 44.85), (3.10, 44.85), (3.45, 44.82), (3.85, 44.75), (4.00, 44.50), (4.25, 44.35)],
    "obp|bpl": [(1.05, 46.55)],
    "bpl|bla": [(1.55, 46.42), (1.95, 46.42), (2.30, 46.42), (2.55, 46.25)],
    "bla|aby": [(2.85, 46.00), (3.15, 46.05), (3.45, 46.05)],
    "bpl|plg": [(0.95, 46.20), (0.80, 45.95), (0.75, 45.70)],
    "gironde|plg": [(-0.45, 45.25), (-0.15, 45.20), (0.15, 45.35), (0.45, 45.40)],
    "plg|lgl": [(0.95, 45.40), (1.20, 45.25), (1.30, 45.05), (1.45, 44.85), (1.65, 44.65)],
    "lgl|lla": [(2.05, 44.50)],
    "lla|bla": [(2.05, 44.85), (2.15, 45.10), (2.40, 45.35), (2.45, 45.65), (2.45, 45.90)],
    "biscarrosse|ggl": [(-0.80, 44.35), (-0.30, 44.30), (0.10, 44.15), (0.45, 44.05), (0.70, 44.00)],
    "lgl|ggl": [(1.60, 44.30), (1.30, 44.15), (1.05, 44.05)],
    "ggl|glf": [(1.05, 43.70), (1.00, 43.45), (1.20, 43.30), (1.30, 43.05), (1.20, 42.85)],
}

# chaque province : le tour de ses nœuds ; entre deux nœuds de côte sans frontière décrite, on suit la côte
CYCLES = {
    "flandre": ["escaut", "cambrai", "fce", "fpc", "gravelines"],
    "picardie": ["gravelines", "fpc", "pic", "npi", "bresle"],
    "normandie": ["bresle", "npi", "noi", "nao", "bna", "couesnon"],
    "bretagne": ["couesnon", "bna", "loire"],
    "anjou": ["loire", "bna", "nao", "aop", "bourgneuf"],
    "idf": ["npi", "pic", "ibc", "oib", "noi"],
    "champagne": ["fpc", "fce", "clf", "bcl", "ibc", "pic"],
    "lorraine": ["clf", "laf", "lac", "blc", "bcl"],
    "alsace": ["laf", "acf", "lac"],
    "orleanais": ["noi", "oib", "obe", "obp", "aop", "nao"],
    "bourgogne": ["ibc", "bcl", "blc", "bcy", "byb", "obe", "oib"],
    "comte": ["lac", "acf", "csf", "csl", "bcy", "blc"],
    "poitou": ["bourgneuf", "aop", "obp", "bpl", "plg", "gironde"],
    "berry": ["obe", "byb", "aby", "bla", "bpl", "obp"],
    "limousin": ["bpl", "bla", "lla", "lgl", "plg"],
    "auvergne": ["bla", "aby", "lpa", "apl", "lla"],
    "lyonnais": ["bcy", "csl", "lsp", "lpa", "aby", "byb"],
    "savoie": ["csl", "csf", "spf", "lsp"],
    "guyenne": ["gironde", "plg", "lgl", "ggl", "biscarrosse"],
    "gascogne": ["biscarrosse", "ggl", "glf", "hendaye"],
    "languedoc": ["apl", "petitrhone", "leucate", "glf", "ggl", "lgl", "lla"],
    "provence": ["lsp", "spf", "menton", "petitrhone", "apl", "lpa"],
}

# villes (position réelle) : la ville de chaque province, puis quelques autres pour habiller la carte
CITY = {
    "flandre": (3.06, 50.63), "picardie": (2.30, 49.89), "normandie": (1.10, 49.44), "bretagne": (-1.68, 48.11), "idf": (2.35, 48.86),
    "champagne": (4.03, 49.26), "lorraine": (6.18, 48.69), "alsace": (7.75, 48.58), "anjou": (-0.55, 47.47), "orleanais": (1.91, 47.90),
    "bourgogne": (5.04, 47.32), "comte": (6.02, 47.24), "poitou": (0.34, 46.58), "berry": (2.40, 47.08), "limousin": (1.26, 45.83),
    "auvergne": (3.08, 45.78), "lyonnais": (4.83, 45.76), "savoie": (5.92, 45.57), "guyenne": (-0.58, 44.84), "gascogne": (0.59, 43.65),
    "languedoc": (1.44, 43.60), "provence": (5.45, 43.53), "corse": (8.74, 41.92),
}
TOWNS = [  # nom, lon, lat, côté de l'étiquette (e, o, n, s)
    ("Calais", 1.86, 50.95, "e"), ("Bruges", 3.22, 51.21, "o"), ("Gand", 3.72, 51.05, "s"), ("Caen", -0.37, 49.18, "s"),
    ("Nantes", -1.55, 47.22, "n"), ("Tours", 0.69, 47.39, "s"), ("La Rochelle", -1.15, 46.16, "o"), ("Troyes", 4.07, 48.30, "e"),
    ("Metz", 6.18, 49.12, "e"), ("Grenoble", 5.72, 45.19, "e"), ("Avignon", 4.81, 43.95, "e"), ("Marseille", 5.37, 43.30, "s"),
    ("Montpellier", 3.88, 43.61, "s"), ("Narbonne", 3.00, 43.18, "o"), ("Bayonne", -1.47, 43.49, "e"),
]
CITY_SIDE = {"flandre": "e", "picardie": "s", "normandie": "o", "bretagne": "s", "idf": "s", "champagne": "e", "lorraine": "s",
             "alsace": "e", "anjou": "s", "orleanais": "e", "bourgogne": "o", "comte": "e", "poitou": "e", "berry": "e",
             "limousin": "s", "auvergne": "n", "lyonnais": "e", "savoie": "e", "guyenne": "o", "gascogne": "s", "languedoc": "s",
             "provence": "e", "corse": "o"}

# ---------------------------------------------------------------- construction des frontières en pixels
coast_idx = {}
COASTP = [P(*p) for p in MAIN]
NODEP = {k: P(*v) for k, v in NODES.items()}
for k, v in COAST.items():
    i = nearest_idx(MAIN, v)
    coast_idx[k] = i
    NODEP[k] = COASTP[i]


def coast_between(a, b):
    i, j = coast_idx[a], coast_idx[b]
    return COASTP[i:j + 1] if i <= j else COASTP[j:i + 1][::-1]


def build_edge(key, spec):
    a, b = key.split("|")
    runs, cur = [], [NODEP[a]]
    for it in spec:
        if isinstance(it, tuple) and it and it[0] == "river":
            rp = [P(*p) for p in river_sub(it[1], it[2], it[3])]
            cur.append(rp[0])
            runs.append(("hand", cur))
            runs.append(("river", rp))
            cur = [rp[-1]]
        else:
            cur.append(P(*it))
    cur.append(NODEP[b])
    runs.append(("hand", cur))
    out = []
    for n, (kind, pts) in enumerate(runs):
        if kind == "hand":
            if len(pts) < 2 or (len(pts) == 2 and dist(*pts) < 0.5):
                continue
            pts = wobble(chaikin(pts, 2) if len(pts) > 2 else pts, key + str(n))
            pts = simplify(pts, 0.3)
        else:
            pts = simplify(pts, 0.4)
        out += pts if not out else pts[1:]
    return out


EDGEP = {k: build_edge(k, v) for k, v in EDGES.items()}


def get_edge(a, b):
    if f"{a}|{b}" in EDGEP:
        return EDGEP[f"{a}|{b}"], f"{a}|{b}"
    if f"{b}|{a}" in EDGEP:
        return EDGEP[f"{b}|{a}"][::-1], f"{b}|{a}"
    if a in COAST and b in COAST:
        return simplify(coast_between(a, b), 0.45), f"côte:{min(a, b)}|{max(a, b)}"
    raise KeyError(f"pas de frontière entre {a} et {b}")


RINGP, EDGE_USE = {}, {}
for pid, cyc in CYCLES.items():
    ring = []
    for a, b in zip(cyc, cyc[1:] + cyc[:1]):
        pts, k = get_edge(a, b)
        EDGE_USE.setdefault(k, []).append(pid)
        ring += pts[:-1]
    if area(ring) < 0:
        ring = ring[::-1]
    RINGP[pid] = ring

# îles : rattachées à la province la plus proche (les îles anglo-normandes et zélandaises restent à part)
ISLANDS = {pid: [] for pid in RINGP}
FOREIGN_RINGS = []
for r in RINGS:
    if r is CORSE_LL:
        continue
    x0, y0, x1, y1 = ring_bbox(r)
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    big = (x1 - x0) > 3
    french = (-5.3 < cx < 7.6 and 42.4 < cy < 51.35 and not (cx < -1.8 and cy > 49.1) and not (cx < 0.5 and cy > 50.3) and not big)
    pr = [P(*p) for p in r]
    if french:
        pr = simplify(pr, 0.35)
        if len(pr) < 3 or abs(area(pr)) < 1.2:
            continue
        c = centroid(pr)
        pid = min(RINGP, key=lambda k: min(dist(c, q) for q in RINGP[k][::3]))
        ISLANDS[pid].append(pr)
    else:
        FOREIGN_RINGS.append(r)

LABEL_AT = {}  # étendards placés à la main, si besoin (px)

# Corse : dans un encadré à demi-échelle, au large de la Provence, comme sur les cartes anciennes
_cp = simplify([P(*p) for p in CORSE_LL], 0.35)
_cb = (min(p[0] for p in _cp), min(p[1] for p in _cp), max(p[0] for p in _cp), max(p[1] for p in _cp))
CORSE_BOX = (757, 678, 830, 786)  # x0, y0, x1, y1 : au large de la Provence, à échelle réduite ; bas à ~10 du bord visible, comme à droite
CS = 0.6
_tf = lambda x, y: (CORSE_BOX[0] + (CORSE_BOX[2] - CORSE_BOX[0] - (_cb[2] - _cb[0]) * CS) / 2 + (x - _cb[0]) * CS, CORSE_BOX[1] + (CORSE_BOX[3] - CORSE_BOX[1] - (_cb[3] - _cb[1]) * CS) / 2 + 8 + (y - _cb[1]) * CS)
RINGP["corse"] = [_tf(x, y) for x, y in _cp]
_cyb = (min(y for _, y in RINGP["corse"]), max(y for _, y in RINGP["corse"]))
_cxm = sum(x for x, _ in RINGP["corse"]) / len(RINGP["corse"])
if area(RINGP["corse"]) < 0:
    RINGP["corse"] = RINGP["corse"][::-1]
CITY_P = {k: P(*v) for k, v in CITY.items()}
CITY_P["corse"] = _tf(*CITY_P["corse"])
LABEL_AT["corse"] = (_cxm + 4, min(_cyb[0] + 24, CITY_P["corse"][1] - 40))  # nom au-dessus de l'île, étendard au-dessus d'Ajaccio


# ---------------------------------------------------------------- contrôles : topologie et voisinages
def check():
    bad = [k for k, v in EDGE_USE.items() if not k.startswith("côte") and len(v) > 2]
    unused = [k for k in EDGEP if k not in EDGE_USE]
    old = json.loads(re.search(r"export const PROVINCES = (\{.*?\});\n", (ROOT / "js/map.js").read_text(encoding="utf-8"), re.S).group(1))
    geo = {k: set() for k in old}
    for k, v in EDGE_USE.items():
        if len(v) == 2:
            geo[v[0]].add(v[1]); geo[v[1]].add(v[0])
    msgs = []
    for k, p in old.items():
        want = set(p["adj"]) - {"corse"} if k != "corse" else set()
        if geo[k] != want:
            msgs.append(f"{k}: dessin {sorted(geo[k])} ≠ jeu {sorted(want)}")
    return old, bad, unused, msgs


# ---------------------------------------------------------------- emplacement des étendards (le point le plus « intérieur »)
def text_box(x, y, side, txt, fs, gap):
    w = len(txt) * fs * 0.5
    dx, dy, anc = {"e": (gap, 3, "start"), "o": (-gap, 3, "end"), "n": (0, -gap - 5, "middle"), "s": (0, gap + 7, "middle")}[side]
    x0 = x + dx if anc == "start" else x + dx - w if anc == "end" else x + dx - w / 2
    return (x0, y + dy + 3 - fs * 0.8, x0 + w, y + dy + 3 + fs * 0.2)


def obstacles():
    """Ce que les étendards ne doivent pas couvrir : médaillons et noms des villes, petites villes gravées."""
    obs = []
    for pid, (x, y) in CITY_P.items():
        obs += [(x - 16, y - 16, x + 16, y + 16), text_box(x, y, CITY_SIDE[pid], PROV[pid]["city"], 11.5, 17)]
    for nm, lon, lat, side in TOWNS:
        x, y = P(lon, lat)
        obs += [(x - 7, y - 10, x + 7, y + 4), text_box(x, y, side, nm, 9.5, 9)]
    return obs


def overlap(a, b):
    return max(0, min(a[2], b[2]) - max(a[0], b[0])) * max(0, min(a[3], b[3]) - max(a[1], b[1]))


def stack_boxes(pid, q):
    """L'étiquette (nom de la province) et l'étendard, autour du point q."""
    tw = len(PROV[pid]["name"]) * 8.8 + 10
    return [(q[0] - tw / 2, q[1] - 24, q[0] + tw / 2, q[1] - 9), (q[0] - 14, q[1] - 3, q[0] + 14, q[1] + 22)]


def label_point(pid, obs):
    ring = RINGP[pid]
    xs, ys = [p[0] for p in ring], [p[1] for p in ring]
    c = centroid(ring)
    segs = list(zip(ring, ring[1:] + ring[:1]))
    best, bp = -1e9, c
    step = 3
    y = min(ys) + step
    while y < max(ys):
        x = min(xs) + step
        while x < max(xs):
            q = (x, y)
            if inside(q, ring):
                d = min(seg_dist(q, a, b) for a, b in segs)
                pen = sum(overlap(sb, o) for sb in stack_boxes(pid, q) for o in obs)
                edge = 30 if q[1] - 50 < 4 else 0  # place pour la couronne du favori, au-dessus du nom
                sc = min(d, 30) - 0.1 * dist(q, c) - 0.08 * pen - (40 if d < 12 else 0) - edge
                if sc > best:
                    best, bp = sc, q
            x += step
        y += step
    return bp


def place_labels():
    """Place les étendards un à un, les plus petites provinces d'abord ; chacun devient un obstacle pour les suivants."""
    obs, out = obstacles(), {}
    for pid in sorted(RINGP, key=lambda k: abs(area(RINGP[k]))):
        q = LABEL_AT.get(pid) or label_point(pid, obs)
        out[pid] = q
        obs += stack_boxes(pid, q)
    return out




# ---------------------------------------------------------------- décor gravé
rnd = random.Random(1347)


def jit(v, a):
    return v + rnd.uniform(-a, a)


def mountain(x, y, s):
    """Un mont de profil, ombré de hachures sur le flanc est (la lumière vient de l'ouest)."""
    h = s * rnd.uniform(8.5, 11.5)
    w = s * rnd.uniform(6.5, 8.5)
    px = jit(0, w * 0.18)
    d = (f"M{fmt(x - w)},{fmt(y)} C{fmt(x - w * .55)},{fmt(y - h * .35)} {fmt(x + px - w * .25)},{fmt(y - h)} {fmt(x + px)},{fmt(y - h)} "
         f"C{fmt(x + px + w * .3)},{fmt(y - h)} {fmt(x + w * .6)},{fmt(y - h * .3)} {fmt(x + w)},{fmt(y)}")
    hatch = []
    for k in range(4):
        t = 0.2 + k * 0.2
        hx = x + px + (w - px) * t * 0.9
        hy = y - h * (1 - t) * 0.95
        hatch.append(f"M{fmt(hx)},{fmt(hy + 0.8)} L{fmt(hx + s * 0.6)},{fmt(y - 0.6)}")
    return (f'<path d="{d}" class="mt"/>' f'<path d="{" ".join(hatch)}" class="mth"/>')


def tree(x, y, s):
    r = s * rnd.uniform(2.2, 2.9)
    return (f'<path d="M{fmt(x)},{fmt(y)} v{fmt(-r * 0.9)}" class="tr"/>'
            f'<ellipse cx="{fmt(x)}" cy="{fmt(y - r * 1.55)}" rx="{fmt(r)}" ry="{fmt(r * 1.12)}" class="tc"/>'
            f'<path d="M{fmt(x + r * .25)},{fmt(y - r * 2.2)} q{fmt(r * .55)},{fmt(r * .5)} {fmt(r * .45)},{fmt(r * 1.3)}" class="th"/>')


def town(x, y, s, big=False):
    """Une petite ville : remparts, tours coiffées, et le clocher de l'église."""
    out = []
    w = s * (9 if big else 6.5)
    h = s * 3.4
    out.append(f'<path d="M{fmt(x - w)},{fmt(y)} V{fmt(y - h)} H{fmt(x + w)} V{fmt(y)} Z" class="tw"/>')
    crenel = " ".join(f"M{fmt(x - w + k * s * 2.2)},{fmt(y - h)} v{fmt(-s * 1.1)}" for k in range(int(2 * w / (s * 2.2)) + 1))
    out.append(f'<path d="{crenel}" class="twl"/>')
    n = 3 if big else 2
    for k in range(n):
        tx = x - w + (2 * w) * (k + 0.5) / n + jit(0, s * .6)
        th = s * rnd.uniform(5.5, 7.5)
        tw = s * 1.6
        out.append(f'<path d="M{fmt(tx - tw)},{fmt(y - h + .3)} V{fmt(y - th)} L{fmt(tx)},{fmt(y - th - s * 3.2)} L{fmt(tx + tw)},{fmt(y - th)} V{fmt(y - h + .3)} Z" class="tw"/>')
    cx = x + jit(0, s * 1.5)
    out.append(f'<path d="M{fmt(cx - s * 1.3)},{fmt(y - h)} V{fmt(y - s * 8.5)} L{fmt(cx)},{fmt(y - s * (14 if big else 12.5))} L{fmt(cx + s * 1.3)},{fmt(y - s * 8.5)} V{fmt(y - h)} Z" class="tw"/>')
    out.append(f'<path d="M{fmt(cx)},{fmt(y - s * (14 if big else 12.5))} v{fmt(-s * 2.2)} M{fmt(cx - s * .9)},{fmt(y - s * (15 if big else 13.6))} h{fmt(s * 1.8)}" class="twl"/>')
    out.append(f'<path d="M{fmt(x - w - s * 2)},{fmt(y + .6)} H{fmt(x + w + s * 2)}" class="twl"/>')
    return "".join(out)


def along(pts_ll, spacing, rows=1, row_gap=9, size=1.0, jitter=2.5):
    pts = densify([P(*p) for p in pts_ll], 1.0)
    out, acc = [], 0
    for a, b in zip(pts, pts[1:]):
        acc += dist(a, b)
        if acc >= spacing:
            acc = 0
            tx, ty = b[0] - a[0], b[1] - a[1]
            ln = math.hypot(tx, ty) or 1
            for r_ in range(rows):
                off = (r_ - (rows - 1) / 2) * row_gap
                out.append((jit(b[0] - ty / ln * off, jitter), jit(b[1] + tx / ln * off, jitter), size * rnd.uniform(0.82, 1.15) * (0.82 if r_ != (rows - 1) // 2 else 1)))
    return out


MOUNTAINS = [  # (tracé, espacement, rangs, écart, taille)
    ([(-1.65, 43.18), (-1.2, 43.05), (-0.75, 42.95), (-0.3, 42.85), (0.1, 42.75), (0.65, 42.78), (1.1, 42.75), (1.6, 42.65), (2.1, 42.6), (2.6, 42.55)], 8, 2, 9, 1.05),
    ([(-1.3, 43.2), (-0.6, 43.08), (0.0, 42.98), (0.6, 42.98), (1.3, 42.92)], 11, 1, 0, 0.78),
    ([(6.62, 46.25), (6.82, 45.95), (6.75, 45.65), (6.92, 45.35), (6.55, 45.08), (6.45, 44.80), (6.70, 44.45), (7.10, 44.18)], 8, 2, 10, 1.1),
    ([(6.05, 45.85), (5.85, 45.45), (5.68, 45.10), (5.55, 44.80), (5.85, 44.40), (6.30, 44.12), (6.85, 43.98)], 9, 1, 0, 0.85),
    ([(7.35, 45.95), (7.45, 45.55), (7.25, 45.05), (7.25, 44.55), (7.55, 44.25)], 10, 1, 0, 0.95),
    ([(7.3, 46.45), (7.9, 46.55), (8.5, 46.6)], 10, 2, 10, 1.0),
    ([(5.80, 46.20), (6.05, 46.50), (6.45, 46.85), (6.85, 47.20)], 9, 1, 0, 0.8),
    ([(7.25, 48.70), (7.12, 48.40), (7.02, 48.10), (6.88, 47.85)], 8.5, 1, 0, 0.85),
    ([(8.15, 48.70), (8.10, 48.30), (8.00, 47.90)], 10, 1, 0, 0.8),
    ([(2.80, 45.95), (2.85, 45.70), (2.80, 45.50)], 8, 1, 0, 0.9),
    ([(2.55, 45.25), (2.75, 45.05), (2.95, 44.95)], 8, 2, 8, 0.95),
    ([(3.85, 45.85), (3.80, 45.55), (3.95, 45.20), (4.15, 44.95)], 9, 1, 0, 0.82),
    ([(3.25, 44.85), (3.55, 44.55), (3.75, 44.30), (4.05, 44.40)], 9, 1, 0, 0.82),
    ([(2.95, 44.70), (3.20, 44.60)], 9, 1, 0, 0.75),
    ([(1.85, 45.70), (2.05, 45.55), (1.95, 45.35)], 11, 1, 0, 0.7),
    ([(2.20, 43.48), (2.60, 43.48)], 9, 1, 0, 0.7),
    ([(2.45, 42.98), (2.80, 42.95)], 9, 1, 0, 0.66),
    ([(6.15, 43.30), (6.55, 43.35), (6.85, 43.50)], 10, 1, 0, 0.66),
    ([(3.95, 47.30), (4.05, 47.05)], 9, 1, 0, 0.68),
    ([(-4.05, 48.38), (-3.60, 48.35)], 10, 1, 0, 0.6),
    ([(4.55, 49.90), (5.05, 49.85), (5.55, 49.95)], 11, 1, 0, 0.62),
]
FORESTS = [  # (lon, lat, rayon x, rayon y en px, nombre)
    (4.75, 49.88, 30, 11, 26), (4.95, 49.10, 7, 14, 12), (2.15, 47.98, 20, 8, 18), (2.65, 48.40, 9, 7, 9), (2.88, 49.35, 9, 6, 8),
    (3.10, 49.25, 7, 5, 6), (-2.20, 48.02, 12, 8, 12), (3.70, 48.15, 9, 6, 8), (6.90, 48.35, 9, 16, 16), (4.15, 47.20, 9, 9, 9),
    (5.72, 47.10, 9, 6, 8), (0.40, 47.80, 8, 6, 7), (1.85, 47.50, 18, 9, 14), (2.70, 46.62, 9, 6, 8), (7.85, 48.85, 10, 6, 9),
    (1.45, 49.40, 9, 6, 8), (-0.40, 46.12, 8, 6, 7), (0.30, 45.08, 10, 7, 9), (-0.95, 44.30, 22, 18, 30), (8.15, 48.35, 12, 22, 22),
    (6.25, 48.75, 9, 6, 7), (-1.20, 48.38, 8, 6, 7), (3.95, 50.10, 10, 6, 8), (5.95, 46.85, 10, 8, 9), (2.95, 45.35, 8, 6, 6),
]

SEAS = [("Mer Océane", -3.4, 46.3, -10), ("La Manche", -1.95, 49.95, -8), ("Mer Méditerranée", 4.55, 42.95, 0)]
LANDS = [("Royaume d'Angleterre", 0.05, 51.12, 0, 1), ("Saint-Empire", 7.15, 49.80, 0, 1), ("Navarre", -1.55, 42.82, 0, 0),
         ("Aragon", 0.75, 42.38, 0, 0), ("Hainaut", 4.05, 50.42, 0, 0), ("Roussillon", 2.45, 42.62, 0, 0), ("Piémont", 7.65, 45.0, 0, 0),
         ("Ligues suisses", 7.75, 47.05, 0, 0), ("Brabant", 4.75, 51.0, 0, 0)]

LEMAN = [(6.15, 46.21), (6.25, 46.30), (6.48, 46.46), (6.70, 46.52), (6.90, 46.43), (6.82, 46.39), (6.55, 46.38), (6.30, 46.33), (6.20, 46.26)]

RIVERS_BIG = {"Loire", "Seine", "Rhône", "Garonne", "Rhin", "Rhine", "Rhein", "Dordogne", "Maas", "Schelde"}
RIVERS_MID = {"Saône", "Marne", "Mosel", "Allier", "Lot", "Tarn", "Durance", "Vienne", "Charente", "Yonne", "Somme", "Cher", "Doubs",
              "Adour", "Vilaine", "Sarthe", "Mayenne", "Aube", "Eure", "Creuse", "Aveyron", "Aude", "Ill", "Sarre", "Ariège", "Thames", "Ebro", "Po"}

# limite du royaume en 1347 : l'Escaut, puis la Meuse, la Saône et le Rhône (les « quatre rivières »)
LIMIT = ([(3.24, 50.17), (3.60, 50.10), (4.00, 50.00), (4.40, 49.90), (4.72, 49.77)] + river_sub("Maas", (4.72, 49.77), (5.62, 48.08))
         + [(5.75, 47.90), (5.88, 47.72)] + river_sub("Saône", (5.88, 47.72), (5.02, 46.91))
         + [(4.95, 46.62), (4.86, 46.30), (4.82, 46.00), (4.83, 45.77)] + river_sub("Rhône", (4.83, 45.77), (4.69, 43.58)))


def build_art():
    land = []
    mp = [P(*p) for p in MAIN] + [P(18, 53.5), P(18, 38), P(12.5, 38)]
    land.append(path_d(simplify(clamp_pts(mp), 0.5)))
    for r in FOREIGN_RINGS:
        pr = simplify(clamp_pts([P(*p) for p in r]), 0.5)
        if len(pr) > 2 and abs(area(pr)) > 1:
            xs, ys = [p[0] for p in pr], [p[1] for p in pr]
            if max(xs) > -MX and min(xs) < W + MX and max(ys) > -MY and min(ys) < H + MY:
                land.append(path_d(pr))
    for pid, isl in ISLANDS.items():
        for pr in isl:
            land.append(path_d(pr))
    LAND = " ".join(land)
    CORSE_D = path_d(RINGP["corse"])

    back = [f'<rect x="{-MX - 200}" y="{-MY - 200}" width="{W + 2 * MX + 400}" height="{H + 2 * MY + 400}" fill="{VELIN}"/>']
    U = '<use href="#land"'
    # lignes d'eau parallèles à la côte, de la plus lointaine à la plus proche
    rings = [(19, "#CDBB92"), (14, "#C2AE84"), (9.5, "#B39E74"), (5.5, "#9F8963"), (2.5, "#8A7453")]
    for w, col in rings:
        back.append(f'{U} fill="none" stroke="{col}" stroke-width="{2 * w + 1.1}" stroke-linejoin="round"/>')
        back.append(f'{U} fill="none" stroke="{VELIN}" stroke-width="{2 * w}" stroke-linejoin="round"/>')
    back.append(f'{U} fill="#E2D1A9" stroke="{INK}" stroke-width="1" stroke-linejoin="round"/>')
    back.append(f'{U} fill="url(#hatch)" stroke="none"/>')
    # encadré de la Corse
    x0, y0, x1, y1 = CORSE_BOX
    back.append(f'<rect x="{fmt(x0)}" y="{fmt(y0)}" width="{fmt(x1 - x0)}" height="{fmt(y1 - y0)}" fill="{VELIN}" stroke="{INK}" stroke-width="1.2"/>')
    back.append(f'<rect x="{fmt(x0 + 3)}" y="{fmt(y0 + 3)}" width="{fmt(x1 - x0 - 6)}" height="{fmt(y1 - y0 - 6)}" fill="none" stroke="{INK}" stroke-width=".6"/>')
    for w, col in rings[2:]:
        back.append(f'<use href="#corse-c" fill="none" stroke="{col}" stroke-width="{2 * w + 1.1}" clip-path="url(#clip-corse)"/>')
        back.append(f'<use href="#corse-c" fill="none" stroke="{VELIN}" stroke-width="{2 * w}" clip-path="url(#clip-corse)"/>')

    defs = (f'<path id="land" d="{LAND}"/><path id="corse-c" d="{CORSE_D}"/>'
            f'<pattern id="hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><path d="M0,0 V5" stroke="{INK2}" stroke-width=".55" opacity=".32"/></pattern>'
            f'<clipPath id="clip-corse"><rect x="{fmt(x0 + 3.5)}" y="{fmt(y0 + 3.5)}" width="{fmt(x1 - x0 - 7)}" height="{fmt(y1 - y0 - 7)}"/></clipPath>'
            f'<filter id="tremble" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="1.3"/></filter>')

    front = []
    # fleuves
    riv = []
    for r in NE["rivers"]:
        nm = r["name"]
        if nm in RIVERS_BIG or nm in RIVERS_MID:
            pts = simplify(chaikin(clamp_pts([P(*p) for p in r["pts"]]), 1), 0.35)
            cls = "rv1" if nm in RIVERS_BIG else "rv2"
            riv.append(f'<path d="{path_d(pts, False)}" class="{cls}"/>')
    front.append("".join(riv))
    front.append(f'<path d="{path_d(simplify(chaikin([P(*p) for p in LEMAN], 2), .3))}" fill="{VELIN}" stroke="{INK}" stroke-width=".9"/>')
    # limite du royaume
    lim = simplify([P(*p) for p in LIMIT], 0.6)
    front.append(f'<path id="limite1347" d="{path_d(lim, False)}" class="lim"/>')
    # forêts
    trees = []
    for lon, lat, rx, ry, n in FORESTS:
        cx, cy = P(lon, lat)
        placed, tries = [], 0
        while len(placed) < n and tries < n * 40:
            tries += 1
            a, rr = rnd.uniform(0, 6.283), math.sqrt(rnd.random())
            q = (cx + math.cos(a) * rr * rx, cy + math.sin(a) * rr * ry)
            if all(dist(q, o) > 5.2 for o in placed):
                placed.append(q)
        trees += [(q[0], q[1], rnd.uniform(0.8, 1.05)) for q in placed]
    # montagnes
    mts = []
    for pts, sp, rows, gap, sz in MOUNTAINS:
        mts += along(pts, sp, rows, gap, sz)
    glyphs = [(y, "t", x, s) for x, y, s in trees] + [(y, "m", x, s) for x, y, s in mts]
    glyphs.sort()
    front.append("".join(tree(x, y, s) if k == "t" else mountain(x, y, s) for y, k, x, s in glyphs))
    # villes
    towns = []
    for pid, (x, y) in CITY_P.items():
        towns.append((PROV[pid]["city"], x, y, CITY_SIDE[pid], pid == "idf", True))
    for nm, lon, lat, side in TOWNS:
        x, y = P(lon, lat)
        towns.append((nm, x, y, side, False, False))
    tw = []
    for nm, x, y, side, big, cap in towns:
        tw.append(town(x, y + 3, 0.9 if cap else 0.72, big))
        g = 17 if cap else 9
        dx, dy, anc = {"e": (g, 3, "start"), "o": (-g, 3, "end"), "n": (0, -g - 5, "middle"), "s": (0, g + 7, "middle")}[side]
        if big:
            dy += 3 if side == "s" else 0
        tw.append(f'<text x="{fmt(x + dx)}" y="{fmt(y + dy + 3)}" text-anchor="{anc}" class="{"mc1" if cap else "mc2"}">{nm}</text>')
    front.append(f'<g class="towns">{"".join(tw)}</g>')
    # mers et pays voisins
    for nm, lon, lat, rot in SEAS:
        x, y = P(lon, lat)
        front.append(f'<text x="{fmt(x)}" y="{fmt(y)}" text-anchor="middle" class="msea" transform="rotate({rot} {fmt(x)} {fmt(y)})">{nm}</text>')
    for nm, lon, lat, rot, big in LANDS:
        x, y = P(lon, lat)
        front.append(f'<text x="{fmt(x)}" y="{fmt(y)}" text-anchor="middle" class="{"mland1" if big else "mland2"}">{nm}</text>')
    # la limite du royaume, nommée
    lx, ly = P(4.98, 46.15)
    front.append(f'<text x="{fmt(lx + 7)}" y="{fmt(ly)}" class="mlim" transform="rotate(-78 {fmt(lx + 7)} {fmt(ly)})">limite du royaume, 1347</text>')
    # Corse : nom de l'encadré et route de mer vers la Provence
    front.append(rose(*ROSE_AT))
    front.append(cartouche(*CARTOUCHE_AT))
    return defs, "".join(back), "".join(front)


ROSE_AT = (0, 0, 34)
CARTOUCHE_AT = (0, 0)


def rose(x, y, r):
    o = [f'<g class="rose" transform="translate({fmt(x)},{fmt(y)})" filter="url(#tremble)">']
    o.append(f'<circle r="{fmt(r * .78)}" fill="none" stroke="{INK}" stroke-width=".8"/>')
    o.append(f'<circle r="{fmt(r * .70)}" fill="none" stroke="{INK}" stroke-width=".5"/>')
    ticks = " ".join(f"M{fmt(math.cos(a) * r * .70)},{fmt(math.sin(a) * r * .70)} L{fmt(math.cos(a) * r * .78)},{fmt(math.sin(a) * r * .78)}"
                     for a in [k * math.pi / 16 for k in range(32)])
    o.append(f'<path d="{ticks}" stroke="{INK}" stroke-width=".5"/>')
    def point(ang, L, wd):
        a = math.radians(ang)
        tip = (math.sin(a) * L, -math.cos(a) * L)
        l = (math.sin(a - math.pi / 2) * wd, -math.cos(a - math.pi / 2) * wd)
        rr = (math.sin(a + math.pi / 2) * wd, -math.cos(a + math.pi / 2) * wd)
        return (f'<path d="M0,0 L{fmt(l[0])},{fmt(l[1])} L{fmt(tip[0])},{fmt(tip[1])} Z" fill="{PAPER}" stroke="{INK}" stroke-width=".7"/>'
                f'<path d="M0,0 L{fmt(rr[0])},{fmt(rr[1])} L{fmt(tip[0])},{fmt(tip[1])} Z" fill="{INK}" stroke="{INK}" stroke-width=".7"/>')
    for ang in (22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5):
        o.append(point(ang, r * .58, r * .07))
    for ang in (45, 135, 225, 315):
        o.append(point(ang, r * .74, r * .1))
    for ang in (90, 180, 270, 0):
        o.append(point(ang, r * (1.08 if ang == 0 else .98), r * .13))
    o.append(f'<circle r="{fmt(r * .07)}" fill="{PAPER}" stroke="{INK}" stroke-width=".7"/>')
    # une croix au septentrion (pas de fleur de lys : elle est réservée au roi)
    cy = -r * 1.08 - 7
    o.append(f'<path d="M0,{fmt(cy - 5)} V{fmt(cy + 5)} M-3.4,{fmt(cy - 1.5)} H3.4" stroke="{RED}" stroke-width="1.6" stroke-linecap="square"/>')
    o.append(f'<text y="{fmt(r * .98 + 12)}" text-anchor="middle" class="mrose">Midi</text>')
    o.append(f'<text x="{fmt(r * .98 + 4)}" y="4" text-anchor="start" class="mrose">Orient</text>')
    o.append(f'<text x="{fmt(-r * .98 - 4)}" y="4" text-anchor="end" class="mrose">Occident</text>')
    o.append("</g>")
    return "".join(o)


def cartouche(x, y):
    w, h = 208, 98
    o = [f'<g class="cartouche" transform="translate({fmt(x)},{fmt(y)})">']
    o.append(f'<g filter="url(#tremble)"><path d="M8,0 H{w - 8} C{w - 2},0 {w},4 {w},10 V{h - 10} C{w},{h - 4} {w - 2},{h} {w - 8},{h} H8 C2,{h} 0,{h - 4} 0,{h - 10} V10 C0,4 2,0 8,0 Z" fill="{PAPER}" stroke="{INK}" stroke-width="1.3"/>')
    o.append(f'<rect x="5" y="5" width="{w - 10}" height="{h - 10}" fill="none" stroke="{INK}" stroke-width=".6"/>')
    # rouleaux aux deux bouts
    for sx in (0, w):
        k = 1 if sx == 0 else -1
        o.append(f'<path d="M{sx},14 c{-9 * k},-2 {-12 * k},8 {-6 * k},12 c{4 * k},3 {9 * k},-1 {6 * k},-6" fill="{PAPER}" stroke="{INK}" stroke-width="1"/>')
        o.append(f'<path d="M{sx},{h - 14} c{-9 * k},2 {-12 * k},-8 {-6 * k},-12 c{4 * k},-3 {9 * k},1 {6 * k},6" fill="{PAPER}" stroke="{INK}" stroke-width="1"/></g>' if sx == w else
                 f'<path d="M{sx},{h - 14} c{-9 * k},2 {-12 * k},-8 {-6 * k},-12 c{4 * k},-3 {9 * k},1 {6 * k},6" fill="{PAPER}" stroke="{INK}" stroke-width="1"/>')
    o.append(f'<text x="{w / 2}" y="31" text-anchor="middle" class="mtitle">Royaume de France</text>')
    o.append(f'<text x="{w / 2}" y="47" text-anchor="middle" class="msub">en l’an de grâce MCCCXLVII</text>')
    o.append(f'<path d="M30,55 H{w / 2 - 9} M{w / 2 + 9},55 H{w - 30}" stroke="{RED}" stroke-width=".9"/>')
    o.append(f'<path d="M{w / 2},51 V59 M{w / 2 - 4},55 H{w / 2 + 4}" stroke="{RED}" stroke-width="1.4"/>')
    # échelle : 25 lieues de Paris (≈ 3,9 km)
    L = 25 * 3.898 * KM_PX
    bx = w / 2 - L / 2
    o.append(f'<rect x="{fmt(bx)}" y="66" width="{fmt(L)}" height="4" fill="{PAPER}" stroke="{INK}" stroke-width=".7"/>')
    for k in range(5):
        if k % 2 == 0:
            o.append(f'<rect x="{fmt(bx + L * k / 5)}" y="66" width="{fmt(L / 5)}" height="4" fill="{INK}"/>')
    o.append(f'<text x="{fmt(bx)}" y="80" text-anchor="middle" class="mscale">0</text><text x="{fmt(bx + L)}" y="80" text-anchor="middle" class="mscale">25</text>')
    o.append(f'<text x="{w / 2}" y="88" text-anchor="middle" class="mscale">lieues de Paris</text>')
    o.append("</g>")
    return "".join(o)


def km_px():
    a, b = P(2.35, 46.0), P(2.35, 47.0)
    return dist(a, b) / 111.2


KM_PX = km_px()

# ---------------------------------------------------------------- écriture
if __name__ == "__main__":
    old, bad, unused, msgs = check()
    PROV = old
    print(f"échelle : {KM_PX:.3f} px/km ; frontières : {len(EDGEP)}")
    for m in bad + unused + msgs:
        print("  ⚠", m)
    for k in COAST:
        print(f"  côte {k}: {MAIN[coast_idx[k]]}")
    ROSE_AT = (112, 170, 27)  # dans la Manche, sous le cartouche
    CARTOUCHE_AT = (14, 12)  # en haut à gauche, sur l'Angleterre : le coin droit est pris par les boutons de zoom
    defs, back, front = build_art()
    new, LP = {}, place_labels()
    for pid, p in old.items():
        ring = RINGP[pid]
        subs = [ring] + ISLANDS.get(pid, [])
        d = " ".join(path_d(r) for r in subs)
        lp = LP[pid]
        tx, ty = CITY_P[pid]
        q = dict(p)
        q.update(d=d, cx=round(lp[0], 1), cy=round(lp[1] + 4, 1), tx=round(tx, 1), ty=round(ty, 1))
        new[pid] = {k: q[k] for k in ["name", "city", "d", "cx", "cy", "tx", "ty", "adj", "region", "coast", "art", "en", "de"]}
    src = (ROOT / "js/map.js").read_text(encoding="utf-8")
    regions = re.search(r"export const REGIONS = .*?;\n", src).group(0)
    out = ("// Carte générée par tools/carte/make_map.py : 23 provinces de la France de 1347, vraies formes (ne pas retoucher à la main)\n"
           f"export const PROVINCES = {json.dumps(new, ensure_ascii=False)};\n{regions}export const MAP_W = {W}, MAP_H = {H};\n")
    (ROOT / "js/map.js").write_text(out, encoding="utf-8")
    art = ("// Décor gravé de la carte, généré par tools/carte/make_map.py (ne pas retoucher à la main)\n"
           f"export const ART_DEFS = {json.dumps(defs, ensure_ascii=False)};\n"
           f"export const ART_BACK = {json.dumps(back, ensure_ascii=False)};\n"
           f"export const ART_FRONT = {json.dumps(front, ensure_ascii=False)};\n")
    (ROOT / "js/map-art.js").write_text(art, encoding="utf-8")
    print(f"js/map.js {len(out) // 1024} Ko, js/map-art.js {len(art) // 1024} Ko")
    if "--apercu" in sys.argv:
        dst = Path(sys.argv[sys.argv.index("--apercu") + 1])
        css = (ROOT / "css/style.css").read_text(encoding="utf-8")
        cols = ["#8E2A22", "#2C4566", "#3B5A3A", "#A07A2A", None, None]
        provs = "".join(f'<path d="{p["d"]}" fill="{PAPER}"/><path class="prov" d="{p["d"]}" fill="{cols[i % 6] or "#D9C9A3"}" fill-opacity="{0.5 if cols[i % 6] else 1}"/>' for i, p in enumerate(new.values()))
        labels = "".join(f'<text class="plabel" x="{p["cx"]}" y="{p["cy"] - 16}" text-anchor="middle">{p["name"].upper()}</text>'
                         f'<g transform="translate({p["cx"]},{p["cy"] - 6})"><path d="M-13,0 L13,0 L13,23 L0,17 L-13,23 Z" stroke="#241811" stroke-width="1.2" fill="#5A4A36"/></g>'
                         f'<circle cx="{p["tx"]}" cy="{p["ty"]}" r="15" fill="#A9843A" stroke="#241811" opacity=".8"/>' for p in new.values())
        html = (f'<!doctype html><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400..800;1,400..800&family=Grenze+Gotisch:wght@700&display=swap" rel="stylesheet">'
                f'<style>{css}</style><body style="margin:0;background:#1B130D"><svg id="map" viewBox="0 0 {W} {H}" width="{W * 1.25}" height="{H * 1.25}"><defs>{defs}</defs>{back}{provs}<g id="m-decor" pointer-events="none">{front}</g>{labels}</svg>')
        dst.write_text(html, encoding="utf-8")
        print("aperçu :", dst)
