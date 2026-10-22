import fs from 'node:fs';
import {auditActiveZeroSnapCases} from '../src/data/active-zero-snap-audit.js';
try{
 const roster=JSON.parse(fs.readFileSync('data/private/weekly-roster-participation-review.json','utf8'));
 const snaps=JSON.parse(fs.readFileSync('data/private/snap-count-participation-cross-check.json','utf8'));
 if(roster.provenance?.evidenceEligible!==false || snaps.provenance?.evidenceEligible!==false)throw Error('Source report must be diagnostic-only');
 const out=auditActiveZeroSnapCases(roster,snaps);
 out.provenance={rosterSha256:roster.provenance.sourceSha256,snapSha256:snaps.provenance.sourceSha256,reviewGeneratedAt:new Date().toISOString(),evidenceEligible:false};
 const dest='data/private/active-zero-snap-audit.json';
 fs.writeFileSync(dest,JSON.stringify(out,null,2)+'\n',{mode:0o600});
 console.log('ACTIVE ZERO AUDIT: '+JSON.stringify(out.summary));
 console.table(out.cases.map(({name,week,yahooPlayerId,nflTeam,provisionalSnaps})=>({name,week,yahooPlayerId,nflTeam,provisionalSnaps})));
 console.log('ACTIVE ZERO AUDIT: private diagnostic '+dest+'; no evidence accepted.');
}catch(e){console.error('ACTIVE ZERO AUDIT: BLOCKED; '+e.message);process.exitCode=1;}
