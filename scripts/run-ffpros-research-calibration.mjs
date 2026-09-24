import fs from 'node:fs';
import {fetchFfprosPublicHistory} from '../src/data/ffpros-public.js';
import {fetchNflverseCSV} from '../src/data/nflverse-source.js';
import {parseCSV} from '../src/data/csv.js';
import {normalizeNflverseActual} from '../src/data/nflverse.js';
import {joinHistoricalProjectionActuals,projectionCoverage} from '../src/data/historical-projections.js';
import {runRollingCalibration,summarizeRollingCalibration} from '../src/model/rolling-calibration.js';
const seasons=(process.argv[2]||'2024,2025').split(',').map(Number).filter(Number.isFinite),out=process.argv[3]||'data/private/ffpros-research-calibration.json',draws=Number(process.argv[4]||1000);
console.error('RESEARCH SOURCE: public FantasyPros projection pages. Do not redistribute downloaded source rows.');
const projections=await fetchFfprosPublicHistory({seasons,onProgress:x=>console.error(x.error?`FAIL ${x.season} W${x.week} ${x.position}: ${x.error}`:`${x.season} W${x.week} ${x.position}: ${x.rows}`)}),actuals=[];
for(const season of seasons){const dl=await fetchNflverseCSV('player',season);for(const r of parseCSV(dl.text)){if(String(r.season_type||'REG').toUpperCase()!=='REG')continue;const a=normalizeNflverseActual(r);if(a.position&&a.week>=1&&a.week<=18)actuals.push(a);}}
const joined=joinHistoricalProjectionActuals(projections.rows,actuals),result=runRollingCalibration(joined.rows,{draws}),report={generatedAt:new Date().toISOString(),sourcePolicy:'research-only; source rows are not written to repository',projectionSummary:projections.summary,failures:projections.failures,coverage:projectionCoverage(projections.rows),joinSummary:joined.summary,calibration:summarizeRollingCalibration(result),byPosition:result.byPosition};fs.mkdirSync(out.split('/').slice(0,-1).join('/')||'.',{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2));console.log(JSON.stringify({out,projectionRows:projections.rows.length,failures:projections.failures.length,actualRows:actuals.length,matchedRows:joined.rows.length,matchRate:joined.summary.matchRate,folds:result.folds.length,recommendation:result.recommendation,comparison:result.comparison},null,2));if(!result.folds.length)process.exitCode=2;
