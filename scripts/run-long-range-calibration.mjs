import fs from 'node:fs';
import {parseCSV} from '../src/data/csv.js';
import {fetchNflverseCSV} from '../src/data/nflverse-source.js';
import {normalizeNflverseActual} from '../src/data/nflverse.js';
import {fetchFantasyProsHistory,joinHistoricalProjectionActuals,projectionCoverage} from '../src/data/historical-projections.js';
import {deriveSeasonBaselines,selectLongRangeCalibration,evaluateLongRangeWalkForward} from '../src/model/long-range-calibration.js';

const rawKey=process.env.FANTASYPROS_API_KEY??'';
const key=rawKey.trim();
if(!key){console.error('FANTASYPROS_API_KEY is required');process.exit(2)}
if(key!==rawKey)console.error('FANTASYPROS_API_KEY contained surrounding whitespace/newlines; using trimmed value.');
const seasons=(process.argv[2]||'2024,2025').split(',').map(Number).filter(Number.isFinite);
const out=process.argv[3]||'data/private/long-range-calibration-report.json';
const baselineThroughWeek=Number(process.argv[4]||3);
const projections=await fetchFantasyProsHistory({apiKey:key,seasons,onProgress:x=>console.error(x.error?`FP FAIL ${x.season} W${x.week}: ${x.error}`:`FP ${x.season} W${x.week}: ${x.rows} rows`)}),actuals=[];
for(const season of seasons){const dl=await fetchNflverseCSV('player',season);for(const r of parseCSV(dl.text)){if(String(r.season_type||'REG').toUpperCase()!=='REG')continue;const row=normalizeNflverseActual(r);if(row.position&&Number(row.week)>=1&&Number(row.week)<=18)actuals.push(row);}}
const joined=joinHistoricalProjectionActuals(projections.rows,actuals);
if(!projections.rows.length||!joined.rows.length){
 const failure={generatedAt:new Date().toISOString(),seasons,projectionSource:'fantasypros',actualSource:'nflverse',status:'failed',reason:!projections.rows.length?'no-projection-data':'no-matched-projection-actual-data',projectionSummary:projections.summary,projectionFailures:projections.failures,projectionCoverage:projectionCoverage(projections.rows),joinSummary:joined.summary};
 fs.mkdirSync(out.split('/').slice(0,-1).join('/')||'.',{recursive:true});fs.writeFileSync(out,JSON.stringify(failure,null,2));
 console.error(`CALIBRATION FAILED: ${!projections.rows.length?'no usable FantasyPros projection data':'no usable matched projection/actual data'}.`);
 console.error('No model parameters were evaluated; no optimal calibration was selected.');
 console.error(`Failure report: ${out}`);
 process.exit(2);
}
const baselines=deriveSeasonBaselines(joined.rows,{throughWeek:baselineThroughWeek,minWeeks:1});
if(!baselines.length){console.error('CALIBRATION FAILED: no season baselines could be derived. No model parameters were evaluated.');process.exit(2)}
const calibration=selectLongRangeCalibration(joined.rows,{seasonBaselines:baselines,minHistory:1,minTargetWeek:baselineThroughWeek+1});
const defaults=calibration.results.find(r=>r.seasonWeight===.65&&r.recencyDecay===.8)||null;
const walkForward=evaluateLongRangeWalkForward(joined.rows,{baselineThroughWeek,minHistory:1});
const report={generatedAt:new Date().toISOString(),seasons,projectionSource:'fantasypros',actualSource:'nflverse',status:'complete',baselineMethod:`mean weekly projection through week ${baselineThroughWeek}`,projectionSummary:projections.summary,projectionFailures:projections.failures,projectionCoverage:projectionCoverage(projections.rows),joinSummary:joined.summary,seasonBaselines:{count:baselines.length,throughWeek:baselineThroughWeek},calibration:{best:calibration.best,defaults,grid:calibration.results},comparison:calibration.best&&defaults?{rmseImprovement:defaults.rmse-calibration.best.rmse,rmseImprovementPct:defaults.rmse?(defaults.rmse-calibration.best.rmse)/defaults.rmse:null,seasonWeightDelta:calibration.best.seasonWeight-.65,recencyDecayDelta:calibration.best.recencyDecay-.8}:null,walkForward};
fs.mkdirSync(out.split('/').slice(0,-1).join('/')||'.',{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2));
console.log(JSON.stringify({out,seasons,projectionRows:projections.rows.length,matchedRows:joined.rows.length,baselines:baselines.length,best:calibration.best,defaults,comparison:report.comparison,walkForward:walkForward.summary},null,2));
if(!calibration.best?.n)process.exitCode=2;
