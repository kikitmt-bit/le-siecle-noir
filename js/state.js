// État partagé de l'application (un seul exemplaire, importé par tous les modules)
import { ICON } from "./help.js?v=1795389300";
import * as remote from "./net.js?v=1795389300";

export const H_ICON = ICON;

export let net = remote; // en solo, on bascule sur le réseau local
export const setNet = (v) => { net = v; };
export let SOLO = false;
export const setSolo = (v) => { SOLO = v; };

export const $ = (s) => document.querySelector(s);

export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} } };

export const STEP_MS = 1600;

export const SPEED = new URLSearchParams(location.search).has("fast") ? 0.12 : 1; // pour les tests automatiques

// ---------------------------------------------------------------------
// état local
// ---------------------------------------------------------------------
export const L = {
  code: null, meta: null, members: {}, state: null, priv: null, myInput: {}, taunts: {}, joinedAt: 0, unsub: [],
  last: { round: -1, phase: null, revealIdx: -1, revealKey: "", seq: -1, newsSeen: -1 },
  ui: resetUi(), modalOpen: null, endClosed: false, dilemmaClosed: false, objClosed: false, tutoQueue: [],
};

export function resetUi() { return { tab: "panel", objPick: [], placement: null, dChoice: null, dTarget: null, dSlot: null, orders: [], build: null, offers: [], answers: {}, gifts: [], giftTo: null, giftAmt: 1, accuse: null, accuseCrime: null, msgTo: null, viewHouse: null, feast: false, rerollPick: false }; }

export const me = () => (L.state && L.state.seats && L.state.seats[net.uid]) || null;

export const S = () => L.state;

export const tm = () => (L.state && L.state.tutorial ? 1.5 : 1);

// Les variables qui changent de valeur ("let") sont modifiées par les fonctions setXxx :
// un module qui importe une variable ne peut pas lui donner une nouvelle valeur lui-même.

// messages privés (ragots)
L.whispers = {};
L.unread = 0;
// file des fenêtres d'aide à afficher
L.modalQueue = [];

// animation des dés à jouer au prochain affichage
export let rollDiceAnim = false;
export const setRollDiceAnim = (v) => { rollDiceAnim = v; };

// narrateur vocal (optionnel)
export let narrator = store.get("sn_narrator") === "1";
export const setNarrator = (v) => { narrator = v; };

// carte : sélection, surbrillance, clic en cours
export const MAP = { sel: new Set(), hl: new Set(), hlRed: new Set(), onPick: null, display: null, badges: [] };

// révélation de la manche (liste des événements, position, lecture automatique)
export const RV = { key: "", list: [], i: -1, t0: 0, pre: false, auto: store.get("sn_rvauto") === "1", preTimer: null };

// zoom et déplacement de la carte
export const VIEW = { x: 0, y: 0, w: 840, h: 780 };

// dernière seconde affichée par la boucle de temps
export let lastTickSec = -1;
export const setLastTickSec = (v) => { lastTickSec = v; };

// arbitre (seul le navigateur de l'hôte l'utilise)
export const H = { active: false, state: null, priv: null, inputs: {}, inUnsub: {}, lastReady: "", busy: false, draftTurnAt: 0, since: 0, lastTick: 0 };

// l'arbitre garde son écran allumé (sur téléphone, un écran éteint mettrait la partie en pause)
export let wakeLock = null;
export const setWakeLock = (v) => { wakeLock = v; };

// si l'hôte disparaît plus de 12 s, le premier joueur en ligne reprend l'arbitrage
export let hostGoneSince = 0;
export const setHostGoneSince = (v) => { hostGoneSince = v; };
