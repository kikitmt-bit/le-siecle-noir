"""Fabrique les bruitages du jeu (sons/*.wav) à partir des enregistrements libres de droits gardés hors du dépôt.

    python -I tools/make_sounds.py <dossier des sources> [--analyse fichier]

Les sources : les packs CC0 de Kenney (casino-audio, rpg-audio, impact-sounds, dézippés dans <sources>/kenney/)
et quelques fichiers de Wikimedia Commons (<sources>/commons/, avec credits.json). Chrome (Playwright) décode,
découpe, mélange, met en fondu et normalise ; on écrit des WAV mono 22 kHz, légers et lus partout (Xbox, PC, téléphone).
Les auteurs à citer sont écrits dans sons/CREDITS.md.
"""
import base64, json, sys, wave, zipfile
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
SRC = Path(sys.argv[1]).resolve()
OUT = ROOT / "sons"
RATE = 22050

K = lambda pack, name: ("kenney", pack, f"Audio/{name}")
C = lambda name: ("commons", name)

# chaque son : des couches (fichier, début et fin dans la source en s, moment où elle commence, volume), durée totale, fondu final
RECIPES = {
    "dice": {"layers": [(K("casino-audio", "dice-throw-1.ogg"), 0, None, 0, 1)], "fade": 0.15},
    "coins": {"layers": [(K("rpg-audio", "handleCoins.ogg"), 0, None, 0, 1)], "fade": 0.1},
    "seal": {"layers": [(K("rpg-audio", "bookPlace1.ogg"), 0, None, 0, 1), (K("impact-sounds", "impactPlank_medium_000.ogg"), 0, None, 0.01, 0.35)], "fade": 0.1},
    "page": {"layers": [(K("rpg-audio", "bookFlip2.ogg"), 0, None, 0, 1)], "fade": 0.1},
    "card": {"layers": [(K("casino-audio", "card-slide-1.ogg"), 0, None, 0, 1)], "fade": 0.08},
    "march": {"dur": 1.25, "fade": 0.35, "layers": [(K("impact-sounds", f"footstep_grass_00{i % 5}.ogg"), 0, None, i * 0.16 + (0.06 if i % 2 else 0), 0.55 + 0.15 * (i % 3)) for i in range(8)]
              + [(K("impact-sounds", f"footstep_concrete_00{(i + 2) % 5}.ogg"), 0, None, 0.08 + i * 0.16, 0.3) for i in range(7)]},
    "battle": {"dur": 1.35, "fade": 0.4, "layers": [(K("rpg-audio", "drawKnife2.ogg"), 0, None, 0, 0.7), (K("impact-sounds", "impactMetal_heavy_001.ogg"), 0, None, 0.22, 1),
               (K("impact-sounds", "impactPlate_heavy_002.ogg"), 0, None, 0.3, 0.6), (K("impact-sounds", "impactMetal_heavy_003.ogg"), 0, None, 0.52, 0.85),
               (K("impact-sounds", "impactMetal_medium_002.ogg"), 0, None, 0.7, 0.6), (K("impact-sounds", "impactPlate_heavy_004.ogg"), 0, None, 0.86, 0.5)]},
    # les longs enregistrements : début et fin choisis à l'écoute de leur enveloppe (--analyse)
    "bell": {"layers": [(C("Church_bells_-_Leverkusen_2007.ogg"), "BELL_A", "BELL_B", 0, 1)], "fade": 0.8},
    "bells": {"layers": [(C("Church_bells_-_Leverkusen_2007.ogg"), "BELLS_A", "BELLS_B", 0, 1)], "fade": 1.2},
    "knell": {"layers": [(C("Totenglocke_aus_der_Friedhofskapelle_am_Friedhof_2016.ogg"), "KNELL_A", "KNELL_B", 0, 1)], "fade": 1.2},
    "crows": {"layers": [(C("Corvus_corone_-_Carrion_Crow_XC491193.mp3"), "CROW_A", "CROW_B", 0, 1)], "fade": 0.3},
    "ambience": {"layers": [(C("Campfire_sound_ambience.ogg"), "FIRE_A", "FIRE_B", 0, 1)], "fade": 0, "loop": 1.5, "peak": 0.5},
}
MARKS = json.loads((Path(__file__).with_name("make_sounds_marks.json")).read_text(encoding="utf-8")) if (Path(__file__).with_name("make_sounds_marks.json")).exists() else {}

JS = """async ({ files, recipe, rate }) => {
  const dec = new OfflineAudioContext(1, 1, rate);
  const bufs = {};
  for (const [k, b64] of Object.entries(files)) {
    const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    bufs[k] = await dec.decodeAudioData(bin.buffer);
  }
  const lens = recipe.layers.map((l) => { const b = bufs[l.key]; const end = l.end == null ? b.duration : Math.min(l.end, b.duration); return l.at + (end - l.start); });
  const dur = recipe.dur || Math.max(...lens);
  const ctx = new OfflineAudioContext(1, Math.ceil(dur * rate), rate);
  for (const l of recipe.layers) {
    const b = bufs[l.key], src = ctx.createBufferSource(); src.buffer = b;
    const g = ctx.createGain(); g.gain.value = l.gain; src.connect(g); g.connect(ctx.destination);
    const end = l.end == null ? b.duration : Math.min(l.end, b.duration);
    src.start(l.at, l.start, end - l.start);
  }
  const out = (await ctx.startRendering()).getChannelData(0);
  const n = out.length;
  // fondu de début très court (pas de clic), fondu final, boucle en fondu enchaîné pour l'ambiance
  const fi = Math.min(n, Math.floor(0.008 * rate)); for (let i = 0; i < fi; i++) out[i] *= i / fi;
  if (recipe.fade) { const f = Math.min(n, Math.floor(recipe.fade * rate)); for (let i = 0; i < f; i++) out[n - 1 - i] *= i / f; }
  let res = out;
  if (recipe.loop) {
    const x = Math.floor(recipe.loop * rate), m = n - x; res = new Float32Array(m);
    for (let i = 0; i < m; i++) res[i] = out[i];
    for (let i = 0; i < x; i++) { const t = i / x; res[i] = out[m + i] * (1 - t) + out[i] * t; }
  }
  let peak = 0; for (const v of res) peak = Math.max(peak, Math.abs(v));
  const k = peak ? (recipe.peak || 0.9) / peak : 1;
  const pcm = new Int16Array(res.length); for (let i = 0; i < res.length; i++) pcm[i] = Math.max(-32767, Math.min(32767, Math.round(res[i] * k * 32767)));
  let s = ""; const u8 = new Uint8Array(pcm.buffer); for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  return { b64: btoa(s), dur: res.length / rate };
}"""

ANALYSE = """async ({ b64, rate }) => {
  const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const b = await new OfflineAudioContext(1, 1, rate).decodeAudioData(bin.buffer);
  const d = b.getChannelData(0), step = Math.floor(rate * 0.1), rows = [];
  for (let i = 0; i < d.length; i += step) { let s = 0; for (let j = i; j < Math.min(d.length, i + step); j++) s += d[j] * d[j]; rows.push(Math.sqrt(s / step)); }
  return { dur: b.duration, rms: rows };
}"""


def source(spec):
    if spec[0] == "kenney":
        with zipfile.ZipFile(SRC / "kenney" / f"{spec[1]}.zip") as z:
            return z.read(spec[2])
    return (SRC / "commons" / spec[1]).read_bytes()


def write_wav(path, b64):
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(RATE); w.writeframes(base64.b64decode(b64))


def main():
    with sync_playwright() as pw:
        b = pw.chromium.launch(channel="chrome"); p = b.new_page(); p.goto("about:blank")
        if "--analyse" in sys.argv:
            f = sys.argv[sys.argv.index("--analyse") + 1]
            r = p.evaluate(ANALYSE, {"b64": base64.b64encode((SRC / "commons" / f).read_bytes()).decode(), "rate": RATE})
            mx = max(r["rms"]) or 1
            print(f"{f} : {r['dur']:.1f} s")
            for i, v in enumerate(r["rms"]):
                print(f"{i / 10:6.1f} s {'#' * int(60 * v / mx)}")
            b.close(); return
        OUT.mkdir(exist_ok=True)
        for name, rec in RECIPES.items():
            files, layers = {}, []
            try:
                for spec, a, z, at, g in rec["layers"]:
                    key = "/".join(spec[1:])
                    files[key] = base64.b64encode(source(spec)).decode()
                    a = MARKS.get(a, a) if isinstance(a, str) else a
                    z = MARKS.get(z, z) if isinstance(z, str) else z
                    if isinstance(a, str) or isinstance(z, str): raise KeyError(f"repère manquant {a}/{z}")
                    layers.append({"key": key, "start": a, "end": z, "at": at, "gain": g})
            except (FileNotFoundError, KeyError) as e:
                print(f"{name} : ignoré ({e})"); continue
            r = p.evaluate(JS, {"files": files, "recipe": {**{k: v for k, v in rec.items() if k != "layers"}, "layers": layers}, "rate": RATE})
            write_wav(OUT / f"{name}.wav", r["b64"])
            print(f"{name}.wav : {r['dur']:.2f} s, {(OUT / f'{name}.wav').stat().st_size // 1024} Ko")
        b.close()
    # la liste des sons présents, lue par js/audio.js (les autres restent fabriqués à la volée)
    made = sorted(f.stem for f in OUT.glob("*.wav"))
    head = "// Généré par tools/make_sounds.py : les bruitages enregistrés présents dans sons/"
    (ROOT / "js" / "sons.js").write_text(head + chr(10) + "export const SONS = " + json.dumps(made) + ";" + chr(10), encoding="utf-8")
    print("js/sons.js :", made)
    # crédits
    lines = ["# Bruitages du Siècle Noir", "", "Fabriqués par `tools/make_sounds.py` à partir d'enregistrements libres :", "",
             "- Dés, pièces, sceau, pages, cartes, pas des armées, fer : packs « Casino Audio », « RPG Audio » et « Impact Sounds » de [Kenney](https://kenney.nl) (CC0, domaine public)."]
    cj = SRC / "commons" / "credits.json"
    for c in (json.loads(cj.read_text(encoding="utf-8")) if cj.exists() else []):
        lic = f"[{c['licence']}]({c['licenceUrl']})" if c.get("licenceUrl") else c["licence"]
        lines.append(f"- « {c['titre'][5:]} », par {c['auteur']}, {lic}, via [Wikimedia Commons]({c['page']}). Découpé, mis en fondu et normalisé." + (" Le son qui en est tiré est diffusé sous la même licence." if "SA" in c["licence"] else ""))
    (OUT / "CREDITS.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("CREDITS.md écrit")


main()
