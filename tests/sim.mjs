// Simulation de 300 parties complètes avec le moteur seul (sans navigateur). Doit finir avec « errors: 0 ».
// Math.random est remplacé par un générateur à graine : deux lancements donnent exactement le même résultat
// (SEED=autre_nombre pour essayer d'autres parties).
import * as E from "../js/engine.js";
import { PROVINCES } from "../js/map.js";
import { DILEMMAS } from "../js/content.js";
{ let a = +(process.env.SEED || 12345); Math.random = function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function randomOrders(state, pid, rng){
  const pl=state.players[pid]; const mine=E.provincesOf(state,pid); const acts=[];
  pl.dice.forEach((v,i)=>{
    const r=rng();
    if(r<0.45){ // strike
      const froms=mine.filter(f=>state.provinces[f].armies>2);
      if(!froms.length) return;
      const from=froms[Math.floor(rng()*froms.length)];
      const tos=PROVINCES[from].adj.filter(t=>state.provinces[t].owner!==pid);
      if(!tos.length) return;
      acts.push({die:i,type:"strike",from,to:tos[Math.floor(rng()*tos.length)],n:state.provinces[from].armies-1});
    } else if(r<0.65){ acts.push({die:i,type:"levy",to:mine[0]}); }
    else if(r<0.8){ const from=mine.find(f=>state.provinces[f].armies>2); if(!from)return; const to=PROVINCES[from].adj.find(t=>state.provinces[t].owner===pid); if(to) acts.push({die:i,type:"march",from,to,n:v}); }
    else { const others=state.order.filter(p=>p!==pid); const tgt=others[Math.floor(rng()*others.length)]; const kinds=["poison","seduction","bribe"]; const kind=kinds[Math.floor(rng()*3)];
      const fam=state.families[tgt]; const person=fam.members.filter(m=>m.alive)[0]; const prov=E.provincesOf(state,tgt).find(p=>p!==state.players[tgt].capital);
      acts.push({die:i,type:"intrigue",kind,target:tgt,person:person&&person.id,prov}); }
  });
  return {round:state.round,actions:acts};
}
let stats={games:0,instant:0,rounds:0,battles:0,deaths:0,civil:0,errors:0,winners:{}};
for(let g=0; g<300; g++){
  const rng=mulberry(g+1);
  const n = 2+ (g%3); // 2,3,4 humans
  const houses=["valcourt","morlanges","ravenel","aubrac"];
  const players=[]; for(let i=0;i<n;i++) players.push({pid:"p"+i,name:"J"+i,house:houses[i]});
  if(n===2) players.push({pid:"bot",name:"Angleterre",house:"anglais",isBot:true});
  if(g%4===1) { players.length=1; players.push({pid:"ai1",name:"IA1",house:"morlanges",isBot:true,ai:"conquerant"},{pid:"ai2",name:"IA2",house:"ravenel",isBot:true,ai:"intrigant"},{pid:"ai3",name:"IA3",house:"aubrac",isBot:true,ai:"prudent"}); }
  try{
  const {state,priv}=E.createGame({players,tutorial:g%5===0,randomDraft:g%2===0},rng);
  const inputs={};
  for(const p of players) inputs[p.pid]={objPick:priv[p.pid].objOffer.slice(0,2)};
  for(const p of players) if(!p.isBot) { inputs[p.pid].gifts={round:0,items:[]}; }
  E.finishObjectives(state,priv,inputs);
  E.startDraft(state,rng);
  while(!E.draftDone(state)){ const pid=E.currentDrafter(state); E.draftPick(state,pid,E.autoPickProvince(state,pid,rng)); }
  E.finishDraft(state,rng);
  if(E.PROV_IDS.some(id=>!state.provinces[id].owner)) throw new Error("province vide après partage");
  E.finishPlacement(state,{});
  while(true){
    E.startRound(state,priv,rng);
    for(const p of players) for(const slot of ["dilemma","dilemma2"]){ const d=priv[p.pid][slot]; if(!d) { if(slot==="dilemma"&&(!p.isBot||p.ai)) throw new Error("pas de dilemme perso"); continue; } const card=DILEMMAS.find(c=>c.id===d.id);
      if(slot==="dilemma"&&card.type!=="solo") throw new Error("slot perso non solo"); if(slot==="dilemma2"&&card.type==="solo") throw new Error("slot rival solo");
      if(p.isBot) continue; inputs[p.pid][slot] = card.type==="pact"?{round:state.round,choice:rng()<.5?"a":"b"}:{round:state.round,choice:Math.floor(rng()*card.options.length),target:state.order.find(x=>x!==p.pid)}; }
    E.finishDilemmas(state,priv,inputs,rng);
    for(const p of players) if(!p.isBot) inputs[p.pid].orders=randomOrders(state,p.pid,rng);
    // random marriage proposals
    if(rng()<0.3){ const a=players[0].pid,b=players[1].pid; if(E.canPropose(state,a,b)){ state.proposals["k"+state.round]={from:a,to:b}; inputs[b].answers={["k"+state.round]:rng()<.6}; } }
    const steps=E.resolveRound(state,priv,inputs,rng);
    stats.battles+=steps.filter(s=>s.kind==="battle").length;
    stats.deaths+=steps.filter(s=>s.kind==="death").length + state.news.filter(s=>s.kind==="death").length;
    // sanity
    for(const id of E.PROV_IDS){ const p=state.provinces[id]; if(!(p.armies>=0) || !Number.isFinite(p.armies)) throw new Error("bad armies "+id+" "+p.armies); }
    for(const pid of state.order){ const k=E.king(state,pid); if(!k) throw new Error("no king "+pid+" r"+state.round); for(const v of ["gold","colere","peur","prestige"]) if(!Number.isFinite(state.players[pid][v])) throw new Error("bad "+v); }
    if(state.gameOver) break;
  }
  E.finishGame(state,priv);
  JSON.stringify(state);
  stats.games++; stats.rounds+=state.round; if(state.instantWinner) stats.instant++;
  const w=state.result.winner; const h=state.players[w].house; stats.winners[h]=(stats.winners[h]||0)+1;
  if(g===7){ console.log(state.chronicle.slice(-12).map(c=>c.year+" "+c.text).join("\n")); console.log(JSON.stringify(state.result.rows.map(r=>[state.players[r.pid].house,r.total,r.prestige,r.provinces,r.objPts]))); console.log("taille état", JSON.stringify(state).length, "octets"); }
  }catch(e){ stats.errors++; if(stats.errors<4) console.log("ERR game",g,e.stack); }
}
console.log(stats);
if (stats.errors > 0 || stats.games !== 300) process.exit(1);
