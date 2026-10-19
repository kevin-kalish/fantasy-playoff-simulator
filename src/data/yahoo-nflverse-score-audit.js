const canonical=s=>String(s??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const team=s=>({JAC:'JAX',WSH:'WAS',OAK:'LV',SD:'LAC',STL:'LA',LAR:'LA'}[String(s??'').toUpperCase()]??String(s??'').toUpperCase());
const identity=r=>[Number(r.season),Number(r.week),canonical(r.name),String(r.position??'').toUpperCase(),team(r.nflTeam)].join('|');
export function reconcileYahooNflverseScores(nflRows,yahooRows,{tolerance=0.02}={}){
 const nfl=new Map(),yahoo=new Map();
 for(const r of nflRows){const k=identity(r);if(!nfl.has(k))nfl.set(k,[]);nfl.get(k).push(r);}
 for(const r of yahooRows){const k=identity(r);if(!yahoo.has(k))yahoo.set(k,[]);yahoo.get(k).push(r);}
 const compared=[],unmatched=[],ambiguous=[];
 for(const [k,yr] of yahoo){
  const nr=nfl.get(k)??[];
  if(yr.length!==1||nr.length>1){ambiguous.push({identity:k,yahooRows:yr.length,nflRows:nr.length});continue;}
  if(nr.length===0){unmatched.push({identity:k,reason:'no-nflverse-identity-match'});continue;}
  const y=yr[0],n=nr[0];
  if(!Number.isFinite(Number(y.actual))||!Number.isFinite(Number(n.actual))){unmatched.push({identity:k,reason:'invalid-score'});continue;}
  const delta=Number(n.actual)-Number(y.actual);
  compared.push({season:y.season,week:y.week,name:y.name,position:y.position,nflTeam:y.nflTeam,yahooPlayerId:y.playerId,nflversePlayerId:n.playerId,yahoo:Number(y.actual),nflverse:Number(n.actual),difference:delta,withinTolerance:Math.abs(delta)<=tolerance});
 }
 const mismatches=compared.filter(x=>!x.withinTolerance);
 const byPosition={};
 for(const r of compared){const k=r.position;if(!byPosition[k])byPosition[k]={compared:0,mismatches:0,absoluteError:0};const v=byPosition[k];v.compared++;v.mismatches+=!r.withinTolerance?1:0;v.absoluteError+=Math.abs(r.difference);}
 for(const v of Object.values(byPosition)){v.mae=v.absoluteError/v.compared;delete v.absoluteError;}
 return {schemaVersion:1,identityMethod:'unique-season-week-normalized-name-position-team',tolerance,summary:{yahooRows:yahooRows.length,nflverseRows:nflRows.length,compared:compared.length,mismatches:mismatches.length,unmatched:unmatched.length,ambiguous:ambiguous.length,mae:compared.length?compared.reduce((s,r)=>s+Math.abs(r.difference),0)/compared.length:null},byPosition,compared,mismatches,unmatched,ambiguous,pass:compared.length>0&&mismatches.length===0&&unmatched.length===0&&ambiguous.length===0,note:'Identity matches are provisional (name/position/team/week), not authoritative shared IDs. Review mismatches and independently validate identity before calibration.'};
}
