import fs from 'node:fs';
import {buildWeeklyGMRecommendations} from '../src/model/gm-recommendation-engine.js';
import {loadWeeklyProjections} from '../src/data/weekly-projection-provider.js';

const [inputPath,specPath]=process.argv.slice(2);
if(!inputPath||!specPath){console.error('Usage: npm run gm:weekly -- <simulation-input.json> <gm-spec.json>');process.exit(1)}
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const input=read(inputPath),spec=read(specPath);
let projectionHealth=null;
if(!spec.projectionRows?.length){
 const season=Number(spec.season??input.season??input.metadata?.season),week=Number(spec.week),fixturePath=spec.projectionFixturePath??process.env.PROJECTION_FIXTURE_PATH??null;
 if(!season||!week){console.error('GM projection loading requires season and week when projectionRows are not supplied.');process.exit(2)}
 try{
  const loaded=await loadWeeklyProjections({season,week,scoring:spec.scoring??'HALF',minimumRows:Number(spec.minimumProjectionRows??1),fixturePath});
  spec.projectionRows=loaded.rows;spec.projectionSource=loaded.provider;projectionHealth=loaded.trust;
  console.error(`PROJECTIONS: ${loaded.provider}; rows ${loaded.rows.length}; ${loaded.trust.degraded?'DEGRADED/FALLBACK':'PRIMARY'}; attempts ${loaded.trust.attempts.length}.`);
 }catch(error){console.error(`PROJECTIONS: FAIL; ${error.message}`);process.exit(2)}
}else{
 projectionHealth={ready:true,provider:spec.projectionSource??'supplied',rows:spec.projectionRows.length,degraded:false,fallbacksUsed:0,attempts:[{provider:spec.projectionSource??'supplied',ok:true,rows:spec.projectionRows.length}]};
}
const report=buildWeeklyGMRecommendations(input,spec);
report.projectionHealth=projectionHealth;
console.log(`WEEKLY GM: ${report.teamName} Week ${report.week}`);
console.log(`PROJECTION SOURCE: ${projectionHealth.provider}${projectionHealth.degraded?' (DEGRADED/FALLBACK)':''}`);
for(const r of report.recommendations)console.log(`#${r.rank} [${r.type}] ${r.summary}`);
console.log(JSON.stringify(report,null,2));
