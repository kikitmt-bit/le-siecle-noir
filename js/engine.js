// =====================================================================
//  LE SIÈCLE NOIR — moteur de règles (pur JS, sans DOM ni réseau)
//  L'hôte (arbitre) est le seul à appeler ces fonctions.
//  Point d'entrée : réexporte les modules de js/engine/.
// =====================================================================
export { PROV_IDS, MAX_ROUNDS, START_YEAR, FORMAT_VERSION, FORMAT_COMPATIBLE, formatProblem, COSTS, NEED, TIMES, START_ARMIES, UNLOCK, unlocked, WIN_PROVINCES, deC, yearOf, MERC_COST, MERC_ARMIES, levyAmount, peurBonus, maisonName, capitalize, fill, cleanHouseName } from "./engine/core.js?v=1795297295";
export { family, personById, king, consort, queen, mother, ownerOf, deName, personTitle, kingLabel, heirs } from "./engine/people.js?v=1795297295";
export { createGame, finishObjectives, provincesPerPlayer, finishDraft, startDraft, currentDrafter, draftPick, draftDone, autoPickProvince, finishPlacement } from "./engine/setup.js?v=1795297295";
export { provincesOf, regionsOf, allied, attackMod, winProb, defenseOf, computeLeader, situationOf, revealDuration, intrigueProb, canPropose, ordersTime } from "./engine/calc.js?v=1795297295";
export { killPerson, sowBastard, bound, addTreaty, marriageable, marry } from "./engine/succession.js?v=1795297295";
export { applyFx } from "./engine/effects.js?v=1795297295";
export { snapshotPlayers, startRound, rollDice, realDice } from "./engine/rounds.js?v=1795297295";
export { finishDilemmas, validateOrders } from "./engine/dilemmas.js?v=1795297295";
export { resolveRound } from "./engine/battles.js?v=1795297295";
export { objectiveDone, finalScore, finishGame, estimateScore } from "./engine/scoring.js?v=1795297295";
export { PERSONAS, aiDilemma, aiAnswer, aiOffers, aiOrders, botOrders } from "./engine/ai.js?v=1795297295";
