import fs from 'node:fs';
export function validatePregameCaptureInputs(spec,snapshotPath,{now=Date.now(),maxAuditAgeMs=15*60*1000}={}){
 const audit=spec?.sourceAudit;
 if(audit?.passed!==true||!Array.isArray(audit.checks)||audit.checks.length===0||audit.checks.some(c=>c.pass!==true))throw new Error('A complete passed Yahoo source audit is required');
 const timestamp=Date.parse(audit.generatedAt??'');
 if(!Number.isFinite(timestamp)||timestamp>now+60000||now-timestamp>maxAuditAgeMs)throw new Error('Yahoo audit is stale or missing a valid timestamp');
 if(!audit.leagueKey||String(audit.leagueKey)!==String(spec.yahoo?.leagueKey??''))throw new Error('Yahoo audit league mismatch');
 if(Number(audit.week)!==Number(spec.week))throw new Error('Yahoo audit week mismatch');
 if(Number(spec.season)!==Number(spec.sourceAudit?.season??spec.season))throw new Error('Yahoo audit season mismatch');
 if(fs.statSync(snapshotPath).mtimeMs<timestamp-60000)throw new Error('Snapshot predates Yahoo audit');
 return {leagueKey:audit.leagueKey,season:Number(spec.season),week:Number(spec.week),auditTimestamp:timestamp};
}
