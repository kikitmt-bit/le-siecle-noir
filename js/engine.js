// =====================================================================
//  LE SIÈCLE NOIR — moteur de règles (pur JS, sans DOM ni réseau)
//  L'hôte (arbitre) est le seul à appeler ces fonctions.
//  Point d'entrée : réexporte les modules de js/engine/.
// =====================================================================
export { PROV_IDS, MAX_ROUNDS, START_YEAR, FORMAT_VERSION, FORMAT_COMPATIBLE, formatProblem, COSTS, NEED, TIMES, START_ARMIES, UNLOCK, unlocked, WIN_PROVINCES, deC, yearOf, MERC_COST, MERC_ARMIES, levyAmount, peurBonus, maisonName, capitalize, fill, cleanHouseName } from "./engine/core.js?v=1795368011";
export { family, personById, king, consort, queen, mother, ownerOf, deName, personTitle, kingLabel, heirs, pickFace } from "./engine/people.js?v=1795368011";
export { createGame, finishObjectives, provincesPerPlayer, finishDraft, startDraft, currentDrafter, draftPick, draftDone, autoPickProvince, finishPlacement } from "./engine/setup.js?v=1795368011";
export { provincesOf, regionsOf, allied, attackMod, winProb, defenseOf, computeLeader, situationOf, revealDuration, intrigueProb, canPropose, ordersTime, housePower, costOf, levyFor, mercCostOf, defBonusOf, publicScore, PTS_PROVINCE, PTS_REGION, GOLD_PER_PT } from "./engine/calc.js?v=1795368011";
export { killPerson, sowBastard, bound, addTreaty, marriageable, marry } from "./engine/succession.js?v=1795368011";
export { applyFx } from "./engine/effects.js?v=1795368011";
export { snapshotPlayers, startRound, rollDice, realDice, passTime, incomeOf, upkeepOf, rerollDie, REROLL_COST } from "./engine/rounds.js?v=1795368011";
export { finishDilemmas, validateOrders, councilRound } from "./engine/dilemmas.js?v=1795368011";
export { resolveRound, revealCards, FEAST_COST } from "./engine/battles.js?v=1795368011";
export { objectiveDone, finalScore, finishGame, prepareResult, estimateScore } from "./engine/scoring.js?v=1795368011";
export { PERSONAS, aiDilemma, aiAnswer, aiOffers, aiOrders, botOrders, aiCouncil } from "./engine/ai.js?v=1795368011";
