// Fail-closed publication review. A GM engine "approved" action is not
// necessarily suitable for publication as actionable advice.
import {assessRecommendationSignal} from './recommendation-uncertainty.js';

export function assessActionPublication(action,{postseasonTrusted=false,minimumSimulations=20000,minimumReplications=3}={}){
 const reasons=[];
 if(!action||!['start-sit','waiver','trade'].includes(action.type))reasons.push('unsupported-action');
 if(action?.confirmationStatus!=='CONFIRMED')reasons.push('confirmation-required');
 if(!Number.isInteger(action?.simulations)||action.simulations<minimumSimulations)reasons.push('insufficient-confirmation-sample');
 if(action?.validation?.confidence!=='high')reasons.push('validation-confidence-not-high');
 if(!(Number.isFinite(action?.strategicScore)&&action.strategicScore>0))reasons.push('non-positive-strategic-score');
 if(action?.type==='trade'&&!['MODEL-BALANCED','STRETCH'].includes(action?.tradeFeasibility?.status))reasons.push('trade-feasibility-not-established');
 const signal=assessRecommendationSignal(action);
 if(signal.status!=='POSITIVE_SIGNAL')reasons.push('championship-signal-inconclusive');
 const stability=action?.seedStability;
 if(stability?.status!=='CONSISTENT_POSITIVE'||stability?.missingReplications!==0||stability?.replications<minimumReplications)reasons.push('independent-action-replication-required');
 if(!postseasonTrusted)reasons.push('postseason-projections-provisional');
 return {status:reasons.length?'WITHHELD':'PUBLICATION_ELIGIBLE',reasons,signal:signal.status,replications:stability?.replications??0,scope:'Statistical screening and source trust only; not historical forecast accuracy or transaction feasibility verification'};
}

export function reviewActionPublication(report){
 const actions=report?.recommendations?.recommendations??[];
 const postseasonTrusted=report?.trust?.postseason?.trusted===true;
 const reviews=actions.map(action=>({type:String(action.type??''),label:String(action.label??''),...assessActionPublication(action,{postseasonTrusted})}));
 return {status:reviews.length&&reviews.every(r=>r.status==='PUBLICATION_ELIGIBLE')?'ELIGIBLE':'REVIEW_REQUIRED',evaluated:reviews.length,eligible:reviews.filter(r=>r.status==='PUBLICATION_ELIGIBLE').length,withheld:reviews.filter(r=>r.status==='WITHHELD').length,reviews};
}
