"""Fabrique les images du jeu à partir de l'emblème (icons/embleme.svg) :
icônes de l'appli, favicons, logo complet (icons/logo.png) et image de partage (og.jpg).

L'emblème est dessiné à la main en SVG (corbeau couronné sur une croix de peste) ;
ce script ne fait que le poser sur ses fonds puis le photographier avec Chrome.

Usage : python tools/make_assets.py        (demande Playwright + Chrome, et Pillow)
"""
import pathlib
import re

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
ICONS = ROOT / "icons"

PARCH, INK, INK2, RED, NIGHT = "#F0E4C7", "#241811", "#5A4430", "#A3221A", "#1B130D"
FONTS = ('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;1,400'
         '&family=Grenze+Gotisch:wght@700&display=swap">')
# le mot-symbole : la même composition que l'accueil du jeu
WORDMARK = f'Le <span style="color:{RED}">S</span>iècle <span style="color:{RED}">N</span>oir'

EMBLEME = (ICONS / "embleme.svg").read_text(encoding="utf-8")
INNER = re.search(r"<svg[^>]*>(.*)</svg>", EMBLEME, re.S).group(1)
# centre et hauteur du dessin de l'emblème, dans son repère 512 x 512
CX, CY = 261, 273


def icone_svg(scale=1.0):
    """Le sceau : un disque de parchemin cerclé d'encre sur fond de nuit, l'emblème au centre.
    scale < 1 rétrécit le disque (icônes « maskable », qui doivent tenir dans la zone sûre)."""
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="3" seed="5"/><feColorMatrix values="0 0 0 0 .18 0 0 0 0 .11 0 0 0 0 .05 0 0 0 .55 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>
    <radialGradient id="bord" cx="50%" cy="46%" r="52%"><stop offset=".7" stop-color="#8A5A26" stop-opacity="0"/><stop offset="1" stop-color="#8A5A26" stop-opacity=".28"/></radialGradient>
  </defs>
  <rect width="512" height="512" fill="{NIGHT}"/>
  <g transform="translate(256 256) scale({scale}) translate(-256 -256)">
    <circle cx="256" cy="256" r="236" fill="{PARCH}"/>
    <circle cx="256" cy="256" r="236" fill="{PARCH}" filter="url(#grain)" opacity=".3"/>
    <circle cx="256" cy="256" r="236" fill="url(#bord)"/>
    <circle cx="256" cy="256" r="231" fill="none" stroke="{INK}" stroke-width="9"/>
    <circle cx="256" cy="256" r="217" fill="none" stroke="{INK}" stroke-width="2.5"/>
    <g transform="translate(256 258) scale(.86) translate({-CX} {-CY})">{INNER}</g>
  </g>
</svg>"""


def paper_css(w, h):
    """Le papier du jeu : parchemin, grain, taches et bords assombris."""
    return f"""
  .page{{position:relative;width:{w}px;height:{h}px;background:{PARCH};overflow:hidden}}
  .page>svg.p{{position:absolute;inset:0}}
  .vig{{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 46%,rgba(255,248,225,.35) 0%,rgba(255,248,225,0) 50%,rgba(110,72,28,.42) 100%)}}"""


def paper_svg(w, h):
    return (f'<svg class="p" width="{w}" height="{h}"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="3" seed="7"/>'
            '<feColorMatrix values="0 0 0 0 .18 0 0 0 0 .11 0 0 0 0 .05 0 0 0 .09 0"/></filter>'
            '<filter id="t"><feTurbulence type="fractalNoise" baseFrequency=".01 .018" numOctaves="4" seed="3"/>'
            '<feColorMatrix values="0 0 0 0 .55 0 0 0 0 .38 0 0 0 0 .16 0 0 0 .45 -.13"/></filter>'
            f'<rect width="{w}" height="{h}" filter="url(#t)"/><rect width="{w}" height="{h}" filter="url(#n)"/></svg>')


def og_html():
    emb = EMBLEME.replace('width="512" height="512"', 'width="470" height="470"')
    return f"""<!doctype html><html><head><meta charset="utf-8">{FONTS}<style>
  html,body{{margin:0;width:1200px;height:630px;overflow:hidden;background:{NIGHT}}}{paper_css(1200, 630)}
  .frame{{position:absolute;inset:24px;border:2px solid {INK};outline:1px solid {INK2};outline-offset:-10px}}
  .emb{{position:absolute;left:92px;top:72px}}
  .txt{{position:absolute;left:560px;top:96px;width:560px;text-align:center;color:{INK};font-family:"EB Garamond",Georgia,serif}}
  h1{{margin:0;font-family:"Grenze Gotisch",serif;font-weight:700;font-size:116px;line-height:.92;letter-spacing:-.01em}}
  h1 b{{display:block;font-weight:700;font-size:150px}}
  .rule{{display:flex;align-items:center;justify-content:center;gap:14px;color:{RED};font-size:24px;margin:16px 0 4px}}
  .rule::before,.rule::after{{content:"";height:1.5px;width:110px;background:currentColor}}
  .ad{{font-variant-caps:all-small-caps;letter-spacing:.12em;font-weight:600;font-size:32px;color:{INK2}}}
  .sub{{margin-top:16px;font-style:italic;font-size:33px;line-height:1.25;color:{INK2}}}
  </style></head><body><div class="page">{paper_svg(1200, 630)}<div class="vig"></div><div class="frame"></div>
  <div class="emb">{emb}</div>
  <div class="txt"><h1>Le <span style="color:{RED}">S</span>iècle<b><span style="color:{RED}">N</span>oir</b></h1>
  <div class="rule">✠</div><div class="ad">Anno Domini 1347</div>
  <div class="sub">La peste arrive, les rois meurent,<br>les héritiers s'entretuent.</div></div>
  </div></body></html>"""


def logo_html():
    """Le logo complet, sur fond transparent : l'emblème au-dessus du mot-symbole."""
    emb = EMBLEME.replace('width="512" height="512"', 'width="560" height="560"')
    return f"""<!doctype html><html><head><meta charset="utf-8">{FONTS}<style>
  html,body{{margin:0;background:transparent}}
  .logo{{width:1200px;height:1100px;display:flex;flex-direction:column;align-items:center;color:{INK};font-family:"EB Garamond",Georgia,serif}}
  h1{{margin:-10px 0 0;font-family:"Grenze Gotisch",serif;font-weight:700;font-size:168px;line-height:1;letter-spacing:-.01em}}
  .rule{{display:flex;align-items:center;gap:18px;color:{RED};font-size:34px;margin:18px 0 6px}}
  .rule::before,.rule::after{{content:"";height:2px;width:170px;background:currentColor}}
  .ad{{font-variant-caps:all-small-caps;letter-spacing:.14em;font-weight:600;font-size:48px;color:{INK2}}}
  </style></head><body><div class="logo">{emb}<h1>{WORDMARK}</h1><div class="rule">✠</div><div class="ad">Anno Domini 1347</div></div></body></html>"""


def main():
    (ICONS / "icone.svg").write_text(icone_svg(), encoding="utf-8")  # favicon vectorielle
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome")

        def shot(html, w, h, out, transparent=False):
            page = browser.new_page(viewport={"width": w, "height": h})
            page.set_content(html, wait_until="networkidle")
            page.evaluate("document.fonts.ready")
            page.wait_for_timeout(300)
            page.screenshot(path=str(out), omit_background=transparent)
            page.close()

        def svg_page(svg, size):
            svg = svg.replace('width="512" height="512"', f'width="{size}" height="{size}"', 1)
            return f'<!doctype html><html><body style="margin:0">{svg}</body></html>'

        for name, size, scale in [
            ("icon-192.png", 192, 1), ("icon-512.png", 512, 1),
            ("icon-maskable-192.png", 192, .8), ("icon-maskable-512.png", 512, .8),
            ("apple-touch-icon.png", 180, .92), ("favicon-32.png", 32, 1), ("favicon-48.png", 48, 1),
        ]:
            shot(svg_page(icone_svg(scale), size), size, size, ICONS / name)
        og_tmp = ICONS / "og-tmp.png"
        shot(og_html(), 1200, 630, og_tmp)
        shot(logo_html(), 1200, 1100, ICONS / "logo.png", transparent=True)
        browser.close()
    # og.jpg : en JPEG, le grain du papier reste léger (WhatsApp ignore les images de plus de 300 Ko)
    og = ROOT / "og.jpg"
    Image.open(og_tmp).convert("RGB").save(og, quality=86, optimize=True, progressive=True)
    og_tmp.unlink()
    # logo.png : on rogne le vide autour, avec une petite marge
    logo = Image.open(ICONS / "logo.png")
    l, t, r, b = logo.getbbox()
    logo.crop((max(0, l - 24), max(0, t - 24), min(logo.width, r + 24), min(logo.height, b + 24))).save(ICONS / "logo.png", optimize=True)
    Image.open(ICONS / "icon-512.png").convert("RGBA").save(ROOT / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
    print(f"images créées dans icons/ et og.jpg ({og.stat().st_size // 1024} Ko)")


if __name__ == "__main__":
    main()
