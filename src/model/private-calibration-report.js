import {evaluateProjectionAccuracy} from './projection-accuracy-calibration.js';
import {assessProjectionCalibration} from './projection-calibration-diagnostics.js';
import {evaluateChronologicalLongRangeWalkForward} from './long-range-calibration.js';

// Consume only verified, point-in-time projection/actual pairs.
// No parameters are ever applied to the live simulation.
export function buildPrivateCalibrationReport(input=[],options={}){
 const accuracy=evaluateProjectionAccuracy(input);
 const diagnostics=assessProjectionCalibration(accuracy);
 const validIndices=new Set(accuracy.rejected.map(x=>x.row-1));
 const valid=input.filter((_,i)=>!validIndices.has(i));
 const chronological=evaluateChronologicalLongRangeWalkForward(valid,options);
 const warning=[];
 if(!diagnostics.calibrationReviewReady)warning.push('projection-accuracy-evidence-insufficient');
 if(!chronological.summary.evidenceSufficient)warning.push('long-range-out-of-sample-evidence-insufficient');
 if(accuracy.quality.rejected)warning.push('invalid-or-duplicate-pairs-excluded');
 const reviewEligible=diagnostics.calibrationReviewReady&&chronological.summary.reviewEligible&&accuracy.quality.rejected===0;
 return {schemaVersion:1,mode:'private-offline-descriptive',parameterUpdatesAllowed:false,reviewEligible,accuracy:{overall:accuracy.overall,byPosition:accuracy.byPosition,bySource:accuracy.bySource,byHorizon:accuracy.byHorizon,quality:accuracy.quality},diagnostics,chronological,warnings:warning};
}
