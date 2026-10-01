const pid=p=>String(p?.id??p?.playerId??'');
const num=x=>Number.isFinite(Number(x))?Number(x):0;
const positions=p=>String(p?.position??'').split(/[\/,]/).map(x=>x.trim()).filter(Boolean);
const projectionFor=(p,week,rows=[])=>{const id=pid(p),r=rows.find(x=>Number(x.week)===Number(week)&&(String(x.playerId??x.id??'')===id||(!id&&x.name===p.name)));return r?num(r.projection):num(p.projection);};
const eligible=p=>pid(p)&&!positions(p).some(x=>['DEF','DST','K'].includes(x));

function rosterValue(p,weeks,rows){
 const vals=weeks.map(w=>projectionFor(p,w,rows)).filter(Number.isFinite);
 return vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:num(p.projection);
}

export function discoverTradeCandidates(input,{teamId,projectionRows=[],weeks=[],maxPartners=9,maxPlayersPerTeam=7,maxScenarios=36,valueTolerance=.35}={}){
 const focus=input.teams.find(t=>String(t.id)===String(teamId));if(!focus)throw new Error(`Unknown team: ${teamId}`);
 const targetWeeks=weeks.length?weeks.map(Number):[...new Set((input.schedule||[]).map(x=>Number(x.week)))].filter(Number.isFinite);
 const rank=t=>(t.roster||[]).filter(eligible).map(p=>({...p,_tradeValue:rosterValue(p,targetWeeks,projectionRows)})).sort((a,b)=>b._tradeValue-a._tradeValue).slice(0,maxPlayersPerTeam);
 const ours=rank(focus),partners=(input.teams||[]).filter(t=>String(t.id)!==String(teamId)).slice(0,maxPartners),scenarios=[];
 for(const partner of partners){
  const theirs=rank(partner);
  for(const give of ours)for(const get of theirs){
   const hi=Math.max(give._tradeValue,get._tradeValue,1),gap=Math.abs(give._tradeValue-get._tradeValue)/hi;
   if(gap>valueTolerance)continue;
   scenarios.push({teamAId:focus.id,teamBId:partner.id,teamAGives:[pid(give)],teamBGives:[pid(get)],projectionRows,weeks:targetWeeks,label:`Trade ${give.name} for ${get.name}`,discovery:{partnerName:partner.name,giveName:give.name,getName:get.name,giveValue:give._tradeValue,getValue:get._tradeValue,valueGap:gap}});
  }
 }
 scenarios.sort((a,b)=>a.discovery.valueGap-b.discovery.valueGap||b.discovery.getValue-a.discovery.getValue||String(a.label).localeCompare(String(b.label)));
 return {scenarios:scenarios.slice(0,maxScenarios),diagnostics:{partnerCount:partners.length,focusPlayerCount:ours.length,generatedScenarioCount:scenarios.length,evaluatedScenarioCount:Math.min(scenarios.length,maxScenarios),maxScenarios,valueTolerance}};
}
