export function probabilitySE(p,n){return Math.sqrt(Math.max(0,p*(1-p))/Math.max(1,n))}
export function confidence95(p,n){const e=1.96*probabilitySE(p,n);return [Math.max(0,p-e),Math.min(1,p+e)]}
export function convergenceReport(results){
  const simulations=results?.[0]?.simulations||0;
  return results.map(r=>({id:r.id,name:r.name,playoffProbability:r.playoffProbability,standardError:probabilitySE(r.playoffProbability,simulations),ci95:confidence95(r.playoffProbability,simulations)}));
}
export function recommendedSimulations({targetMargin=.005,worstCaseProbability=.5}={}){return Math.ceil((1.96**2*worstCaseProbability*(1-worstCaseProbability))/(targetMargin**2))}
