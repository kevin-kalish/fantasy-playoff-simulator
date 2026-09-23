function pairBySeed(alive,seeds){const sorted=[...alive].sort((a,b)=>seeds[a.id]-seeds[b.id]),pairs=[];while(sorted.length>1)pairs.push([sorted.shift(),sorted.pop()]);if(sorted.length)pairs.push([sorted.shift(),null]);return pairs}

export function simulatePlayoffs({qualifiers,weeks=[15,16,17],simulateTeamScore,rng,reseed=true}){
  const seeds=Object.fromEntries(qualifiers.map((t,i)=>[t.id,i+1]));let alive=[...qualifiers],rounds=[];
  for(const week of weeks){
    const pairs=pairBySeed(alive,seeds),winners=[],games=[];
    for(const [a,b] of pairs){
      if(!b){winners.push(a);games.push({week,a:a.id,b:null,winner:a.id});continue}
      // simulateTeamScore creates independent factors when none are supplied. The
      // season engine can later inject NFL-game mappings when provider data exists.
      const sa=simulateTeamScore(a,week,rng,{firstWeek:weeks[0]}),sb=simulateTeamScore(b,week,rng,{firstWeek:weeks[0]});
      const winner=sa===sb?(seeds[a.id]<seeds[b.id]?a:b):(sa>sb?a:b);winners.push(winner);games.push({week,a:a.id,b:b.id,scoreA:sa,scoreB:sb,winner:winner.id});
    }
    rounds.push(games);alive=winners;if(alive.length===1)break;
  }
  return{champion:alive[0]||null,rounds};
}
