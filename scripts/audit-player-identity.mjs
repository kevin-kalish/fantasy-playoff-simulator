import fs from 'node:fs';
import path from 'node:path';
import {readArchiveDirectory,importHistoricalProjectionArchives} from '../src/data/historical-projection-importer.js';
import {reconcileProjectionActualIds} from '../src/data/completed-nfl-actuals.js';

// Read-only source inputs. Only the diagnostic report is written under data/private.
const root='data/private';
const dirs=['projection-archives-enriched','projection-archives'];
const seen=new Set(),archives=[];
for(const dir of dirs){
 for(const archive of readArchiveDirectory(path.join(root,dir))){
  const name=path.basename(archive.path);
  if(seen.has(name))continue;
  seen.add(name);archives.push(archive);
 }
}
const actualsPath=path.join(root,'historical-actuals.json');
const raw=fs.existsSync(actualsPath)?JSON.parse(fs.readFileSync(actualsPath,'utf8')):[];
const actuals=Array.isArray(raw)?raw:raw?.rows;
if(!Array.isArray(actuals))throw new Error('Historical actuals must be an array or {rows:array}');
const reconciliation=reconcileProjectionActualIds(archives,actuals);
const imported=importHistoricalProjectionArchives(reconciliation.archives,actuals);
const counts=items=>Object.fromEntries([...items.reduce((m,item)=>m.set(item.reason,(m.get(item.reason)??0)+1),new Map())].sort((a,b)=>b[1]-a[1]));
const report={
 schemaVersion:1,mode:'offline-player-identity-audit',networkRequests:0,
 originalArchivesModified:false,parametersModified:false,
 archives:archives.length,actualRows:actuals.length,
 identityMatchedRows:reconciliation.matched,
 identityRejectedRows:reconciliation.rejected.length,
 identityRejectionReasons:counts(reconciliation.rejected),
 strictJoinedRows:imported.rows.length,
 strictRejectionReasons:counts(imported.rejected),
 note:'Name, position and NFL team matching is provisional; independently validate cross-provider player identities and scoring before using joins to calibrate.'
};
const output=path.join(root,'player-identity-audit.json');
fs.mkdirSync(root,{recursive:true});
fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log('IDENTITY AUDIT: '+report.archives+' archives, '+report.actualRows+' actuals, '+report.identityMatchedRows+' provisional identity matches, '+report.strictJoinedRows+' strict joins.');
console.log('IDENTITY REJECTIONS: '+JSON.stringify(report.identityRejectionReasons));
console.log('STRICT REJECTIONS: '+JSON.stringify(report.strictRejectionReasons));
console.log('IDENTITY AUDIT: private report '+output+'; no external requests or archive modifications.');
