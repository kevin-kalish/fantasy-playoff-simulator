import assert from 'node:assert/strict';
import {readinessReport,assertDatasetReady} from '../src/data/dataset-readiness.js';
import {createProjectionManifest,manifestAudit} from '../src/data/projection-manifest.js';
const positions=['QB','RB','WR','TE','K'],projections=[],actuals=[];for(const season of [2024,2025])for(const week of [1,2])for(const position of positions)for(let i=0;i<4;i++){const playerId=`${season}-${week}-${position}-${i}`;projections.push({season,week,position,playerId,projection:10});actuals.push({season,week,position,playerId,actual:11})}
const r=readinessReport(projections,actuals,{minRowsPerWeek:20});assert.equal(r.ready,true);assert.equal(r.matchRate,1);assert.equal(r.seasonCount,2);assert.equal(assertDatasetReady(r),true);
const bad=readinessReport(projections,actuals.slice(0,5));assert.equal(bad.ready,false);assert.throws(()=>assertDatasetReady(bad));
const manifest=createProjectionManifest({source:'fixture',seasons:[2024,2025],positions,weeks:[1,2],license:'test'}),audit=manifestAudit(manifest,projections);assert.equal(audit.coverage,1);assert.equal(audit.missing.length,0);const partial=manifestAudit(manifest,projections.filter(x=>!(x.season===2025&&x.week===2&&x.position==='TE')));assert.equal(partial.missing.length,1);assert.deepEqual(partial.missing[0],{season:2025,week:2,position:'TE'});console.log('readiness-tests: all checks passed');
