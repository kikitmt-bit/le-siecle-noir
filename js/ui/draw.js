// Dessins : blasons, dés, gravures
import { HOUSES } from "../content.js?v=1795376900";

// ---------------------------------------------------------------------
// dessins (blasons, dés, gravures)
// ---------------------------------------------------------------------
// Blason = sceau de cire à la couleur de la maison, la pièce en relief clair (piste « Chronique »)
const SEAL = "M32 4c4 0 5.2 3.2 8.8 4.4 3.6 1.2 6.8-.8 9.6 1.8 2.6 2.6.8 6 2 9.6 1.2 3.6 4.6 5 4.6 9.2s-3.4 5.4-4.6 9c-1.2 3.6.6 7-2 9.6-2.6 2.6-6 .6-9.6 1.8C37.2 50.6 36 54 32 54s-5.2-3.4-8.8-4.6c-3.6-1.2-7 .8-9.6-1.8-2.6-2.6-.6-6-1.8-9.6C10.6 34.4 7.4 33.2 7.4 29s3.2-5.6 4.4-9.2c1.2-3.6-.6-7 2-9.6 2.6-2.6 6-.6 9.6-1.8C27 7.2 28 4 32 4z";
export function shield(house, size = 32) {
  const h = HOUSES[house] || HOUSES.valcourt;
  const L = "#F1E2C0";
  const ch = {
    tower: `<path d="M22,43 V21 h4 v-5 h4 v5 h4 v-5 h4 v5 h4 V43 Z" fill="${L}"/><path d="M29.5,43 v-6 a2.5,2.5 0 0 1 5,0 v6 Z" fill="${h.color}"/>`,
    fish: `<path d="M17,30 q14,-13 28,0 q-14,13 -28,0 Z M45,30 l7,-7 v14 Z" fill="${L}"/><circle cx="24" cy="28.5" r="1.8" fill="${h.color}"/>`,
    star: `<path d="M32,14 l4.5,10.5 h11 l-9,6.5 3.5,11 -10,-6.5 -10,6.5 3.5,-11 -9,-6.5 h11 Z" fill="${L}"/>`,
    key: `<circle cx="32" cy="21" r="6.5" fill="none" stroke="${L}" stroke-width="3.6"/><path d="M32,27.5 v17 M32,38 h6 M32,44 h6" stroke="${L}" stroke-width="3.6" fill="none"/>`,
    lion: `<path d="M18,19 h22 l4,-4 l3,4 h-3 v3 h-26 Z M18,30 h22 l4,-4 l3,4 h-3 v3 h-26 Z M22,41 h18 l4,-4 l3,4 h-3 v3 h-22 Z" fill="${L}"/>`,
  }[h.charge];
  return `<svg class="crest" width="${size}" height="${size}" viewBox="4 1 56 56" aria-hidden="true"><defs><radialGradient id="seal-shine" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".32"/></radialGradient></defs><path d="${SEAL}" fill="${h.color}"/><path d="${SEAL}" fill="url(#seal-shine)"/><circle cx="32" cy="29" r="19.5" fill="none" stroke="${L}" stroke-opacity=".35" stroke-width="1.4"/><g opacity=".92">${ch}</g></svg>`;
}

export function dieSvg(v, size = 44, frame = false) {
  const pos = { 1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]], 4: [[0, 0], [2, 0], [0, 2], [2, 2]], 5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]], 6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]] }[v] || [];
  return `<svg width="${size}" height="${size}" viewBox="0 0 42 42" role="img" aria-label="Dé ${v}">${frame ? '<rect x="1" y="1" width="40" height="40" rx="7" fill="#F5EBD3" stroke="#241811" stroke-width="2"/>' : ""}${pos.map(([x, y]) => `<circle cx="${9 + x * 12}" cy="${9 + y * 12}" r="4" fill="#241811"/>`).join("")}</svg>`;
}

export function woodcut(w = 460, h = 300, scene = 0) {
  const lines = [];
  for (let i = 0; i < 300; i += 7) lines.push(`<line x1="0" y1="${i}" x2="460" y2="${i}" stroke="#241811" stroke-width="0.6" opacity="${(0.1 + 0.25 * (1 - i / 300)).toFixed(2)}"/>`);
  const crows = [[150, 60, 1], [178, 48, 0.8], [290, 110, 1.1], [120, 96, 0.7], [400, 150, 0.9]].map(([x, y, s]) => `<path transform="translate(${x},${y}) scale(${s})" d="M-14,0 Q-7,-8 0,0 Q7,-8 14,0 Q7,-3 0,3 Q-7,-3 -14,0 Z" fill="#1B130D"/>`).join("");
  let wall = "M60,250 V170";
  for (let x = 72; x < 400; x += 24) wall += ` h12 v-10 h12 v10`;
  wall += " h4 V250 Z";
  const scenes = [
    // ville murée
    `<path d="${wall}" fill="#1B130D"/><path d="M70,250 V120 h40 V250 Z M66,122 L90,72 L114,122 Z" fill="#1B130D"/><path d="M330,250 V130 h40 V250 Z M326,132 L350,84 L374,132 Z" fill="#1B130D"/><path d="M214,170 V100 h32 V170 Z M210,102 L230,30 L250,102 Z M228,14 h4 v18 h-4 Z M222,20 h16 v4 h-16 Z" fill="#1B130D"/><path d="M196,250 V214 Q230,186 264,214 V250 Z" fill="#ECDEBD"/>${[206, 215, 224, 233, 242].map((y) => `<line x1="196" y1="${y}" x2="264" y2="${y}" stroke="#1B130D" stroke-width="2"/>`).join("")}`,
    // gibets
    `${[90, 200, 310].map((x) => `<path d="M${x},250 V120 h70 v8 h-62 V250 Z" fill="#1B130D"/><line x1="${x + 56}" y1="128" x2="${x + 56}" y2="150" stroke="#1B130D" stroke-width="2"/><path d="M${x + 50},150 h12 v34 h-12 Z M${x + 52},184 v26 h3 v-26 Z M${x + 57},184 v26 h3 v-26 Z" fill="#1B130D"/><circle cx="${x + 56}" cy="146" r="7" fill="#1B130D"/>`).join("")}`,
    // champ de bataille
    `${[60, 110, 170, 240, 300, 360, 410].map((x, i) => `<path d="M${x},250 L${x + 4},${120 + (i % 3) * 20} L${x + 8},250 Z" fill="#1B130D"/><path d="M${x + 4},${120 + (i % 3) * 20} l18,8 l-18,8 Z" fill="${i % 2 ? "#1B130D" : "#A3221A"}"/>`).join("")}<path d="M180,250 l40,-60 l6,4 l-40,60 Z M260,250 l-40,-60 l-6,4 l40,60 Z" fill="#1B130D"/>`,
  ];
  return `<svg class="woodcut" width="${w}" height="${h}" viewBox="0 0 460 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="460" height="300" fill="#ECDEBD"/>${lines.join("")}<circle cx="350" cy="70" r="38" fill="#A3221A"/><path d="M0,250 Q120,232 230,246 T460,240 V300 H0 Z" fill="#1B130D"/>${scenes[scene % scenes.length]}${crows}<path d="M410,250 V200 h6 V250 Z M398,212 h30 v6 h-30 Z" fill="#1B130D"/></svg>`;
}
