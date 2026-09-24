import fs from 'node:fs';
import {parseCSV} from '../src/data/csv.js';
import {fetchNflverseCSV} from '../src/data/nflverse-source.js';
import {normalizeNflverseActual} from '../src/data/nflverse.js';
import {fetchFantasyProsHistory,joinHistoricalProjectionActuals,projectionCoverage} from '../src/data/historical-projections.js';
import {runRollingCalibration,summarizeRollingCalibration} from '../src/model/rolling-calibration.js';
const key=process.env.FANTASYPROS_API_KEY;if(!key){console.error('FANTASYPROS_API_KEY is required');process.exit(2)}
const seasons=(process.argv[2]||'2024,2025').split(',').map(Number).filter(Number.isFinite),out=process.argv[3]||'data/private/calibration-report.json',draws=Number(process.argv[4]||1500);
const projections=await fetchFantasyProsHistory({apiKey:key,seasons,onProgress:x=>console.error(x.error?`FP FAIL ${x.season} W${x.week}: ${x.error}`:`FP ${x.season} W${x.week}: ${x.rows} rows`)}),actuals=[];
for(const season of seasons){const dl=await fetchNflverseCSV('player',season);for(const r of parseCSV(dl.text)){if(String(r.season_type||'REG').toUpperCase()!=='REG')continue;const row=normalizeNflverseActual(r);if(row.position&&Number(row.week)>=1&&Number(row.week)<=18)actuals.push(row);}}
const joined=joinHistoricalProjectionActuals(projections.rows,actuals),result=runRollingCalibration(joined.rows,{draws}),rec=joined.reconciliation;
const report={generatedAt:new Date().toISOString(),seasons,projectionSource:'fantasypros',actualSource:'nflverse',projectionSummary:projections.summary,projectionFailures:projections.failures,projectionCoverage:projectionCoverage(projections.rows),joinSummary:joined.summary,reconciliation:{matched:rec.matched.length,ambiguous:rec.ambiguous.length,unmatchedProjections:rec.unmatched.length,matchRate:rec.summary.matchRate},calibration:summarizeRollingCalibration(result),byPosition:result.byPosition};
fs.mkdirSync(out.split('/').slice(0,-1).join('/')||'.',{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2));console.log(JSON.stringify({out,seasons,projectionRows:projections.rows.length,actualRows:actuals.length,matchedRows:joined.rows.length,matchRate:rec.summary.matchRate,folds:result.folds.length,recommendation:result.recommendation,comparison:result.comparison},null,2));if(!result.folds.length)process.exitCode=2;
