import {validatePregameCaptureInputs} from './pregame-capture-validation.js';
import {reconcileCaptureSnapshot} from './capture-snapshot-reconciliation.js';
import {evaluatePregameCaptureArchive} from './pregame-capture-eligibility.js';
import {assessProjectionCoverage} from './projection-coverage-gate.js';

// This boundary accepts injected IO, so integration tests can exercise the
// production gates without making network requests or spending API quota.
export async function executePregameCapture({spec,snapshot,snapshotPath,readLiveYahoo,runProjectionJob,readNewArchives,now=Date.now()}){
 const expected=validatePregameCaptureInputs(spec,snapshotPath,{now});
 const live=await readLiveYahoo(expected);
 if(live?.report?.passed!==true)throw new Error('Fresh live Yahoo reconciliation failed');
 const comparison=reconcileCaptureSnapshot(snapshot,live.league,{week:expected.week});
 if(!comparison.passed)throw new Error('Snapshot differs from live Yahoo state: '+comparison.differences.join(', '));
 if(spec.projectionFixturePath)throw new Error('Fixture projections are not eligible for archival capture');
 await runProjectionJob();
 const archives=await readNewArchives();
 if(!Array.isArray(archives)||archives.length!==1)throw new Error('Expected exactly one new immutable archive; found '+(archives?.length??0));
 const entry=archives[0],archive=entry.data??entry;
 const eligibility=evaluatePregameCaptureArchive(archive);
 // Coverage is opt-in until the production Yahoo roster-to-projection identity bridge is verified.
 // An incomplete archive remains available for diagnosis, but must not be called calibration-ready.
 const coverageConfig=spec.projectionCoverage;
 const coverage=coverageConfig?assessProjectionCoverage(archive.rows,{...coverageConfig,season:expected.season,week:expected.week}):null;
 return {expected,liveAuditChecks:live.report.checks?.length??0,archive:entry.path??null,capturedAt:archive.capturedAt,eligibility,coverage,calibrationReady:eligibility.pregameKickoffVerifiedRows>0&&(!coverage||coverage.ready)};
}
