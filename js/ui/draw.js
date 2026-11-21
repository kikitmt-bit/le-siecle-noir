// Dessins : blasons, dés, gravures
import { HOUSES } from "../content.js?v=1795297295";

// ---------------------------------------------------------------------
// dessins (blasons, dés, gravures)
// ---------------------------------------------------------------------
export function shield(house, size = 32) {
  const h = HOUSES[house] || HOUSES.valcourt;
  const ch = {
    tower: '<path d="M22,46 V24 h4 v-5 h4 v5 h4 v-5 h4 v5 h4 V46 Z" fill="#E8C66A"/>',
    fish: '<path d="M18,34 q14,-14 28,0 q-14,14 -28,0 Z M46,34 l7,-7 v14 Z" fill="#E8C66A"/>',
    star: '<path d="M32,16 l4.5,10.5 h11 l-9,6.5 3.5,11 -10,-6.5 -10,6.5 3.5,-11 -9,-6.5 h11 Z" fill="#E8C66A"/>',
    key: '<circle cx="32" cy="24" r="7" fill="none" stroke="#E8C66A" stroke-width="3.5"/><path d="M32,31 v18 M32,42 h6 M32,48 h6" stroke="#E8C66A" stroke-width="3.5"/>',
    lion: '<path d="M18,22 h22 l4,-4 l3,4 h-3 v3 h-26 Z M18,34 h22 l4,-4 l3,4 h-3 v3 h-26 Z M22,46 h18 l4,-4 l3,4 h-3 v3 h-22 Z" fill="#E8C66A"/>',
  }[h.charge];
  return `<svg width="${size}" height="${Math.round(size * 1.15)}" viewBox="0 0 64 74" aria-hidden="true"><path d="M4,4 H60 V34 C60,54 46,66 32,70 C18,66 4,54 4,34 Z" fill="${h.color}" stroke="#2B1D12" stroke-width="3"/>${ch}</svg>`;
}

export function dieSvg(v, size = 44, frame = false) {
  const pos = { 1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]], 4: [[0, 0], [2, 0], [0, 2], [2, 2]], 5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]], 6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]] }[v] || [];
  return `<svg width="${size}" height="${size}" viewBox="0 0 42 42" role="img" aria-label="Dé ${v}">${frame ? '<rect x="1" y="1" width="40" height="40" rx="7" fill="#F6ECD6" stroke="#2B1D12" stroke-width="2"/>' : ""}${pos.map(([x, y]) => `<circle cx="${9 + x * 12}" cy="${9 + y * 12}" r="4" fill="#2B1D12"/>`).join("")}</svg>`;
}

export function woodcut(w = 460, h = 300, scene = 0) {
  const lines = [];
  for (let i = 0; i < 300; i += 7) lines.push(`<line x1="0" y1="${i}" x2="460" y2="${i}" stroke="#2B1D12" stroke-width="0.6" opacity="${(0.1 + 0.25 * (1 - i / 300)).toFixed(2)}"/>`);
  const crows = [[150, 60, 1], [178, 48, 0.8], [290, 110, 1.1], [120, 96, 0.7], [400, 150, 0.9]].map(([x, y, s]) => `<path transform="translate(${x},${y}) scale(${s})" d="M-14,0 Q-7,-8 0,0 Q7,-8 14,0 Q7,-3 0,3 Q-7,-3 -14,0 Z" fill="#1A120C"/>`).join("");
  let wall = "M60,250 V170";
  for (let x = 72; x < 400; x += 24) wall += ` h12 v-10 h12 v10`;
  wall += " h4 V250 Z";
  const scenes = [
    // ville murée
    `<path d="${wall}" fill="#1A120C"/><path d="M70,250 V120 h40 V250 Z M66,122 L90,72 L114,122 Z" fill="#1A120C"/><path d="M330,250 V130 h40 V250 Z M326,132 L350,84 L374,132 Z" fill="#1A120C"/><path d="M214,170 V100 h32 V170 Z M210,102 L230,30 L250,102 Z M228,14 h4 v18 h-4 Z M222,20 h16 v4 h-16 Z" fill="#1A120C"/><path d="M196,250 V214 Q230,186 264,214 V250 Z" fill="#E9DCBD"/>${[206, 215, 224, 233, 242].map((y) => `<line x1="196" y1="${y}" x2="264" y2="${y}" stroke="#1A120C" stroke-width="2"/>`).join("")}`,
    // gibets
    `${[90, 200, 310].map((x) => `<path d="M${x},250 V120 h70 v8 h-62 V250 Z" fill="#1A120C"/><line x1="${x + 56}" y1="128" x2="${x + 56}" y2="150" stroke="#1A120C" stroke-width="2"/><path d="M${x + 50},150 h12 v34 h-12 Z M${x + 52},184 v26 h3 v-26 Z M${x + 57},184 v26 h3 v-26 Z" fill="#1A120C"/><circle cx="${x + 56}" cy="146" r="7" fill="#1A120C"/>`).join("")}`,
    // champ de bataille
    `${[60, 110, 170, 240, 300, 360, 410].map((x, i) => `<path d="M${x},250 L${x + 4},${120 + (i % 3) * 20} L${x + 8},250 Z" fill="#1A120C"/><path d="M${x + 4},${120 + (i % 3) * 20} l18,8 l-18,8 Z" fill="${i % 2 ? "#1A120C" : "#8E1B1B"}"/>`).join("")}<path d="M180,250 l40,-60 l6,4 l-40,60 Z M260,250 l-40,-60 l-6,4 l40,60 Z" fill="#1A120C"/>`,
  ];
  return `<svg class="woodcut" width="${w}" height="${h}" viewBox="0 0 460 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="460" height="300" fill="#E9DCBD"/>${lines.join("")}<circle cx="350" cy="70" r="38" fill="#8E1B1B"/><path d="M0,250 Q120,232 230,246 T460,240 V300 H0 Z" fill="#1A120C"/>${scenes[scene % scenes.length]}${crows}<path d="M410,250 V200 h6 V250 Z M398,212 h30 v6 h-30 Z" fill="#1A120C"/></svg>`;
}
