import {assessProspectiveCaptureReadiness} from './prospective-capture-readiness.js';
import {diagnoseCaptureSources} from './capture-source-diagnostics.js';
export function buildCalibrationGateReport({archives=[],actuals=[],sources=null,season=2026,week=6}={}){
 const readiness=assessProspectiveCaptureReadiness(archives,actuals);
 const sourceStatus=sources??{readyForLiveAttempt:false,providers:{},schedule:{}};
 const blockers=[];
 if(!sourceStatus.readyForLiveAttempt)blockers.push('live-capture-preflight-not-ready');
 if(!readiness.totals.freshProviderRows)blockers.push('no-fresh-provider-archives');
 if(!readiness.totals.pregameKickoffVerifiedRows)blockers.push('no-verified-pregame-projections');
 if(!readiness.weeks.some(w=>w.pregameKickoffVerifiedRows>0&&w.completedActualWeek))blockers.push('no-pregame-week-with-recorded-actuals');
 return {schemaVersion:1,mode:'offline-calibration-gate',season:Number(season),week:Number(week),networkRequests:0,parameterUpdatesAllowed:false,readyForLiveAttempt:sourceStatus.readyForLiveAttempt===true,archives:{total:readiness.archives,v3:readiness.v3Archives,legacy:readiness.legacyArchives},evidence:{freshProviderRows:readiness.totals.freshProviderRows,pregameKickoffVerifiedRows:readiness.totals.pregameKickoffVerifiedRows,weeksWithPregameAndActuals:readiness.weeks.filter(w=>w.pregameKickoffVerifiedRows>0&&w.completedActualWeek).length,strictVerifiedPairs:'not-evaluated'},blockers,nextAction:readiness.nextAction,note:'This is a readiness inventory, not strict player-level matching or approval to calibrate. No archives or model parameters are modified.'};
}
