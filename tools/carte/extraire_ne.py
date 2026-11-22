"""Extrait de Natural Earth (domaine public) les côtes et les fleuves autour de la France.

À lancer une seule fois : python -I tools/carte/extraire_ne.py <dossier des fichiers Natural Earth décompressés>
Écrit tools/carte/ne-france.json (lon/lat), que make_map.py lit ensuite sans rien télécharger.
Fichiers attendus (naciscdn.org/naturalearth/10m/physical/) : ne_10m_land, ne_10m_rivers_lake_centerlines, ne_10m_rivers_europe.
"""
import json, struct, sys
from pathlib import Path

BBOX = (-7.5, 40.6, 11.0, 53.2)  # lon min, lat min, lon max, lat max


def read_dbf(path):
    b = Path(path).read_bytes()
    n, hlen, rlen = struct.unpack("<IHH", b[4:12])
    fields, off = [], 32
    while b[off] != 0x0D:
        name = b[off:off + 11].split(b"\0")[0].decode("latin-1")
        fields.append((name, b[off + 16]))
        off += 32
    rows = []
    for i in range(n):
        r = b[hlen + i * rlen: hlen + (i + 1) * rlen]
        pos, row = 1, {}
        for name, ln in fields:
            row[name] = r[pos:pos + ln].decode("utf-8", "replace").replace(chr(0), "").strip()
            pos += ln
        rows.append(row)
    return rows


def read_shp(path):
    b = Path(path).read_bytes()
    off, shapes = 100, []
    while off < len(b):
        _, clen = struct.unpack(">II", b[off:off + 8])
        rec = b[off + 8: off + 8 + clen * 2]
        off += 8 + clen * 2
        st = struct.unpack("<i", rec[:4])[0]
        if st == 0:
            shapes.append([]); continue
        bbox = struct.unpack("<4d", rec[4:36])
        np_, npts = struct.unpack("<ii", rec[36:44])
        parts = list(struct.unpack(f"<{np_}i", rec[44:44 + 4 * np_])) + [npts]
        pts = struct.unpack(f"<{2 * npts}d", rec[44 + 4 * np_: 44 + 4 * np_ + 16 * npts])
        rings = [[(pts[2 * k], pts[2 * k + 1]) for k in range(parts[j], parts[j + 1])] for j in range(np_)]
        shapes.append((bbox, rings))
    return shapes


def touches(bb):
    return not (bb[2] < BBOX[0] or bb[0] > BBOX[2] or bb[3] < BBOX[1] or bb[1] > BBOX[3])


def inside(p):
    return BBOX[0] <= p[0] <= BBOX[2] and BBOX[1] <= p[1] <= BBOX[3]


def main(src):
    src = Path(src)
    out = {"land": [], "rivers": []}
    for bb, rings in (s for s in read_shp(src / "ne_10m_land/ne_10m_land.shp") if s):
        if not touches(bb):
            continue
        for ring in rings:
            if not any(inside(p) for p in ring):
                continue
            if len(ring) > 20000:  # l'Eurasie : on ne garde que le morceau utile, d'un seul tenant
                idx = [i for i, p in enumerate(ring) if inside(p)]
                ring = ring[idx[0]: idx[-1] + 1]
                out["land"].append({"open": True, "pts": [[round(x, 4), round(y, 4)] for x, y in ring]})
            else:
                out["land"].append({"open": False, "pts": [[round(x, 4), round(y, 4)] for x, y in ring]})
    for name in ("ne_10m_rivers_lake_centerlines", "ne_10m_rivers_europe"):
        shp = read_shp(src / name / f"{name}.shp")
        dbf = read_dbf(src / name / f"{name}.dbf")
        for s, row in zip(shp, dbf):
            if not s or not touches(s[0]):
                continue
            for line in s[1]:
                if any(inside(p) for p in line):
                    out["rivers"].append({"name": row.get("name") or row.get("name_en") or "", "src": name[-6:],
                                          "rank": row.get("scalerank", ""),
                                          "pts": [[round(x, 4), round(y, 4)] for x, y in line]})
    dst = Path(__file__).with_name("ne-france.json")
    dst.write_text(json.dumps(out, separators=(",", ":")), encoding="utf-8")
    print(dst, len(out["land"]), "terres,", len(out["rivers"]), "rivières")


if __name__ == "__main__":
    main(sys.argv[1])
