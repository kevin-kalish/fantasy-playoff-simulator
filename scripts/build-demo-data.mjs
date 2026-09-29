import fs from 'node:fs';
import path from 'node:path';

const week=Number(process.argv[2]??process.env.WEEK??3);
const source=process.argv[3]??`data/private/fightin-kali-week-${week}-report.json`;
const target=process.argv[4]??'demo/data.json';

if(!fs.existsSync(source)){
 console.error(`DEMO BUILD: report not found: ${source}`);
 console.error(`Run: npm run fightin-kali:weekly -- data/private/fightin-kali-current.json ${week}`);
 process.exit(2);
}
const payload=JSON.parse(fs.readFileSync(source,'utf8'));
if(!payload?.report?.team||!payload?.report?.outlook) {
 console.error('DEMO BUILD: source does not contain a usable weekly intelligence report.');
 process.exit(2);
}
fs.mkdirSync(path.dirname(target),{recursive:true});
fs.writeFileSync(target,JSON.stringify(payload,null,2)+'\n');
console.log(`DEMO BUILD: ${source} -> ${target}`);
