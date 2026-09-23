// Synthetic development data. No real player or projection data is used here.
const positions = ["QB","RB","RB","WR","WR","TE","FLEX","K","DEF"];
const base = { QB:20, RB:14, WR:13.5, TE:9, FLEX:11.5, K:8, DEF:7.5 };

export function createDemoLeague() {
  const names=["Fourth & Long","Gridiron Kings","Sunday Scaries","Red Zone","Goal Line Stand","Two Minute Drill","Waiver Wire","Play Action","Hail Mary","The Audible"];
  const records=[[6,2],[5,3],[5,3],[4,4],[4,4],[4,4],[3,5],[3,5],[3,5],[2,6]];
  const teams=names.map((name,i)=>({
    id:`T${i+1}`, name, wins:records[i][0], losses:records[i][1], points:760-i*11,
    lineup:positions.map((position,j)=>({
      id:`T${i+1}-P${j+1}`, name:`Demo ${position} ${i+1}-${j+1}`,
      position: position==="FLEX" ? ["RB","WR","TE"][i%3] : position,
      projection: Math.max(3,(base[position]||10) + (5-i)*0.42 + ((j%3)-1)*0.8),
      cv: position==="QB"?.27:position==="RB"?.40:position==="WR"?.47:position==="TE"?.48:position==="K"?.45:.50
    }))
  }));

  const schedule=[];
  for(let week=9;week<=14;week++) {
    const matchups=[];
    const order=teams.map(t=>t.id);
    // Round-robin-style rotation sufficient for exercising the season engine.
    const shift=(week-9)%9;
    const rotated=[order[0],...order.slice(1+shift),...order.slice(1,1+shift)];
    for(let i=0;i<5;i++) matchups.push([rotated[i],rotated[9-i]]);
    schedule.push({week,matchups});
  }
  return { teams, schedule, playoffSpots:8 };
}
