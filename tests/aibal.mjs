import * as E from "../js/engine.js";
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const wins={conquerant:0,intrigant:0,prudent:0}; let scores={conquerant:0,intrigant:0,prudent:0}; let n=300, dur=0, crimes=0, treaties=0, marriages=0, chains=0;
for(let g=0;g<n;g++){
  const rng=mulberry(5000+g);
  const pers=["conquerant","intrigant","prudent"];
  const houses=["valcourt","morlanges","ravenel"];
  const players=pers.map((p,i)=>({pid:p,name:p,house:houses[(i+g)%3],isBot:true,ai:p}));
  const {state,priv}=E.createGame({players,randomDraft:true},rng);
  E.finishObjectives(state,priv,{}); E.startDraft(state,rng); E.finishPlacement(state,{});
  while(true){ E.startRound(state,priv,rng); E.finishDilemmas(state,priv,{},rng); const st=E.resolveRound(state,priv,{},rng); crimes+=st.filter(s=>s.kind==="death"&&/Nul ne sait/.test(s.text)).length; treaties+=st.filter(s=>s.kind==="treaty").length; marriages+=st.filter(s=>s.kind==="marriage").length; if(state.gameOver) break; }
  E.finishGame(state,priv); wins[state.result.winner]++; state.result.rows.forEach(r=>scores[r.pid]+=r.total);
}
console.log("victoires",wins); for(const k in scores) scores[k]=(scores[k]/n).toFixed(1); console.log("score moyen",scores);
console.log("par partie: trêves",(treaties/n).toFixed(1),"mariages",(marriages/n).toFixed(1),"poisons anonymes",(crimes/n).toFixed(1));
