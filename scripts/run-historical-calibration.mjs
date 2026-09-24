import fs from 'node:fs';
import {parseCSV} from '../src/data/csv.js';
import {fetchNflverseCSV} from '../src/data/nflverse-source.js';
import {normalizeNflverseActual} from '../src/data/nflverse.js';
import {fetchFantasyProsHistory,joinHistoricalProjectionActuals,projectionCoverage} from '../src/data/historical-projections.js';
import {runRollingCalibration,summarizeRollingCalibration} from '../src/model/rolling-calibration.js';

const key=process.env.FANTASYPROS_API_KEY;
if(!key){console.error('FANTASYPROS_API_KEY is required');process.exit(2)}
const seasons=(process.argv[2]||'2024,2025').split(',').map(Number).filter(Number.isFinite);
const out=process.argv[3]||'data/private/calibration-report.json';
const draws=Number(process.argv[4]||1500);
const projections=await fetchFantasyProsHistory({apiKey:key,seasons,onProgress:x=>console.error(x.error?`FP FAIL ${x.season} W${x.week}: ${x.error}`:`FP ${x.season} W${x.week}: ${x.rows} rows`)});
const actuals=[];
for(const season of seasons){const dl=await fetchNflverseCSV('player',season);for(const r of parseCSV(dl.text)){if(String(r.season_type||'REG').toUpperCase()!=='REG')continue;const row=normalizeNflverseActual(r);if(row.position&&Number(row.week)>=1&&Number(row.week)<=18)actuals.push(row);}}
const joined=joinHistoricalProjectionActuals(projections.rows,actuals);
const result=runRollingCalibration(joined.rows,{draws});
const report={generatedAt:new Date().toISOString(),seasons,projectionSource:'fantasypros',actualSource:'nflverse',projectionSummary:projections.summary,projectionFailures:projections.failures,projectionCoverage:projectionCoverage(projections.rows),joinSummary:joined.summary,reconciliation:{matched:joined.reconciliation.matched.length,unmatchedProjections:joined.reconciliation.unmatchedProjections.length,unmatchedActuals:joined.reconciliation.unmatchedActuals.length},calibration:summarizeRollingCalibration(result),byPosition:result.byPosition};
fs.mkdirSync(out.split('/').slice(0,-1).join('/')||'.',{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2));
console.log(JSON.stringify({out,seasons,projectionRows:projections.rows.length,actualRows:actuals.length,matchedRows:joined.rows.length,folds:result.folds.length,recommendation:result.recommendation,comparison:result.comparison},null,2));
if(!result.folds.length)process.exitCode=2;
