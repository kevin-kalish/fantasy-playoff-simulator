import {weeklyReportToDashboardV1} from '../src/ui/live-dashboard-export.js';
import fs from 'node:fs';
import path from 'node:path';

function latestWeeklyReport(){
 const dir='data/private';
 if(!fs.existsSync(dir))return null;
 const matches=fs.readdirSync(dir)
  .map(name=>({name,match:name.match(/^fightin-kali-week-(\d+)-report\.json$/)}))
  .filter(x=>x.match)
  .map(x=>({week:Number(x.match[1]),file:path.join(dir,x.name)}))
  .sort((a,b)=>b.week-a.week);
 return matches[0]??null;
}

const explicitWeek=process.argv[2]??process.env.WEEK;
const explicitSource=process.argv[3];
const selected=explicitSource?{week:Number(explicitWeek),file:explicitSource}:explicitWeek?{week:Number(explicitWeek),file:`data/private/fightin-kali-week-${Number(explicitWeek)}-report.json`}:latestWeeklyReport();
if(!selected||!Number.isFinite(selected.week)){
 console.error('DEMO BUILD: no weekly report found. Run npm run fightin-kali:weekly first.');
 process.exit(2);
}
const week=selected.week;
const source=selected.file;
const target=process.argv[4]??'demo/data.json';

if(!fs.existsSync(source)){
 console.error(`DEMO BUILD: report not found: ${source}`);
 console.error(`Run: npm run fightin-kali:weekly -- data/private/fightin-kali-current.json ${week}`);
 process.exit(2);
}
const payload=JSON.parse(fs.readFileSync(source,'utf8'));
if(payload.readiness?.ready===false) {
 console.error('DEMO BUILD: source failed readiness gate.');
 process.exit(2);
}
let safe;
try {
 safe=weeklyReportToDashboardV1(payload.report??payload);
} catch(error) {
 console.error('DEMO BUILD: dashboard export rejected: '+error.message);
 process.exit(2);
}
fs.mkdirSync(path.dirname(target),{recursive:true});
fs.writeFileSync(target,JSON.stringify(safe,null,2)+'\n');
console.log(`DEMO BUILD: sanitized week ${week}; ${source} -> ${target}`);
