const slots=['QB','RB','RB','WR','WR','TE','FLEX','K','DEF'];

export function optimizeLineup(roster) {
  const available=roster.filter(p=>!p.out && !p.bye).map((p,i)=>({...p,_i:i}));
  const used=new Set(), lineup=[];
  const take=(slot,eligible)=>{
    const choices=available.filter(p=>!used.has(p._i)&&eligible.includes(p.position));
    choices.sort((a,b)=>(b.projection||0)-(a.projection||0));
    if(choices[0]) { used.add(choices[0]._i); lineup.push({...choices[0],slot}); }
  };
  // Fill scarce fixed slots before FLEX; RB/WR are filled twice by the slot list.
  for(const slot of slots) {
    if(slot==='FLEX') take(slot,['RB','WR','TE']); else take(slot,[slot]);
  }
  return lineup;
}

export function lineupProjection(lineup) {
  return lineup.reduce((sum,p)=>sum+(Number(p.projection)||0),0);
}
