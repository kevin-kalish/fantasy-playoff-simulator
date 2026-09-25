const abs=Math.abs;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const num=x=>Number.isFinite(Number(x))?Number(x):0;

export function monteCarloStandardError(probability,simulations){
 const p=clamp(num(probability),0,1),n=Math.max(1,Number(simulations)||1);return Math.sqrt(p*(1-p)/n);
}

export function validateRecommendation(action,{simulations=0,maxChampionshipDelta=.25,maxPlayoffDelta=.20,minSignalToNoise=2}={}){
 const warnings=[];
 const championshipDelta=num(action.championshipDelta),playoffDelta=num(action.playoffDelta),winsDelta=num(action.winsDelta);
 if(abs(championshipDelta)>maxChampionshipDelta)warnings.push({code:'LARGE_CHAMPIONSHIP_DELTA',message:`Championship probability changes by ${(100*abs(championshipDelta)).toFixed(2)} percentage points; verify projections and transaction scope.`});
 if(abs(playoffDelta)>maxPlayoffDelta)warnings.push({code:'LARGE_PLAYOFF_DELTA',message:`Playoff probability changes by ${(100*abs(playoffDelta)).toFixed(2)} percentage points; verify projections and transaction scope.`});
 const baselineFocus=action.details?.result?.baseline?.find?.(x=>String(x.id)===String(action.details?.result?.teamId))??action.details?.baseline?.find?.(x=>String(x.id)===String(action.details?.teams?.A?.teamId||action.details?.teams?.B?.teamId));
 const p=baselineFocus?.championshipProbability;
 const se=p==null?null:monteCarloStandardError(p,simulations);
 const signalToNoise=se?abs(championshipDelta)/se:null;
 if(signalToNoise!=null&&signalToNoise<minSignalToNoise)warnings.push({code:'LOW_MONTE_CARLO_SIGNAL',message:`Championship delta is only ${signalToNoise.toFixed(2)}x estimated Monte Carlo standard error.`});
 const confidence=warnings.some(w=>w.code.startsWith('LARGE_'))?'review':warnings.some(w=>w.code==='LOW_MONTE_CARLO_SIGNAL')?'low':'normal';
 return {confidence,warnings,diagnostics:{simulations:Number(simulations)||0,championshipDelta,playoffDelta,winsDelta,championshipStandardError:se,signalToNoise}};
}

export function validateRecommendationSet(actions,options={}){
 return actions.map(action=>({...action,validation:validateRecommendation(action,options)}));
}
