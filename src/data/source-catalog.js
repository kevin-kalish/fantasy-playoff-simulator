// Data-source governance is intentionally separate from adapters. A source may be
// technically readable but still unsuitable for calibration or redistribution.
export const SOURCE_STATUS={APPROVED:'approved',RESEARCH:'research',PENDING:'pending',BLOCKED:'blocked'};
export const DATA_SOURCES={
 nflverse_actuals:{id:'nflverse_actuals',role:'actuals',status:SOURCE_STATUS.APPROVED,provider:'nflverse',kind:'underlying_stats',notes:'Primary historical NFL results source. Score target-league fantasy points locally.'},
 fantasypros_live:{id:'fantasypros_live',role:'projections',status:SOURCE_STATUS.PENDING,provider:'FantasyPros',kind:'underlying_projections',notes:'Live provider integration pending access/approval.'},
 fantasypros_historical:{id:'fantasypros_historical',role:'projections',status:SOURCE_STATUS.RESEARCH,provider:'FantasyPros/ffpros',kind:'historical_projections',notes:'ffpros demonstrates year/week projection retrieval. Verify historical availability, terms, and permitted storage before calibration.'},
 nflverse_rankings:{id:'nflverse_rankings',role:'rankings',status:SOURCE_STATUS.RESEARCH,provider:'nflverse',kind:'rankings',notes:'Useful for identity/ranking context; rankings are not interchangeable with weekly point projections.'}
};
export function getSource(id){const s=DATA_SOURCES[id];if(!s)throw new Error(`Unknown data source: ${id}`);return s}
export function calibrationSourceCheck({projectionSource,actualSource}){const p=getSource(projectionSource),a=getSource(actualSource),issues=[];if(p.role!=='projections')issues.push('projection source is not a projection dataset');if(a.role!=='actuals')issues.push('actual source is not an actual-results dataset');if([SOURCE_STATUS.BLOCKED,SOURCE_STATUS.PENDING].includes(p.status))issues.push(`projection source status is ${p.status}`);if([SOURCE_STATUS.BLOCKED,SOURCE_STATUS.PENDING].includes(a.status))issues.push(`actual source status is ${a.status}`);return{usable:issues.length===0,projection:p,actual:a,issues}}
export function assertCalibrationSources(x){const r=calibrationSourceCheck(x);if(!r.usable)throw new Error(`Calibration sources not usable: ${r.issues.join('; ')}`);return r}
