import crypto from 'node:crypto';
const expected=new Map(Object.entries({
 '4':0.04,'5':4,'6':-1,'9':0.1,'10':6,'11':0.5,'12':0.1,'13':6,
 '15':6,'16':2,'18':-2,'19':3,'20':3,'21':3,'22':4,'23':5,
 '29':1,'32':1,'33':2,'34':2,'35':6,'36':2,'37':2,
 '49':6,'50':10,'51':7,'52':4,'53':1,'55':-1,'56':-4,'57':6,'82':2
}));
export function compareYahooScoringToModel(record){
 const errors=[],mismatches=[],unknown=[];
 if(record?.valid!==true)errors.push('Yahoo scoring capture is invalid');
 if(record?.source!=='yahoo-league-settings')errors.push('Unexpected scoring source');
 if(!record?.leagueKey||!Number.isInteger(Number(record?.season)))errors.push('Missing league or season');
 if(!Array.isArray(record?.scoringRules))errors.push('Missing scoring rules');
 const rules=Array.isArray(record?.scoringRules)?record.scoringRules:[];
 const seen=new Set();
 for(const row of rules){
  const id=String(row?.statId??''),value=Number(row?.value);
  if(seen.has(id))errors.push('Duplicate stat ID '+id);
  seen.add(id);
  if(!id||!Number.isFinite(value)){errors.push('Invalid stat modifier '+id);continue;}
  if(!expected.has(id)){unknown.push({statId:id,value});continue;}
  if(Math.abs(value-expected.get(id))>1e-9)mismatches.push({statId:id,yahoo:value,model:expected.get(id)});
 }
 const missing=[...expected.keys()].filter(id=>!seen.has(id));
 const fingerprint=crypto.createHash('sha256').update(JSON.stringify([...rules].map(r=>({statId:String(r.statId),value:Number(r.value)})).sort((a,b)=>a.statId.localeCompare(b.statId,undefined,{numeric:true})))).digest('hex');
 if(fingerprint!==record?.fingerprint)errors.push('Scoring fingerprint mismatch');
 // This baseline does not establish whether Yahoo applies yardage bonuses,
 // how all defensive events are sourced, or whether model scoring is identical.
 const unresolved=['model awards 300/400 passing, 100/200 rushing and 100/200 receiving yardage bonuses; Yahoo bonus equivalence unverified','Yahoo stat-ID mapping and all DST/return scoring behavior require independent verification'];
 return {schemaVersion:1,leagueKey:record?.leagueKey,season:record?.season,checked:rules.length,matching:rules.length-mismatches.length-unknown.length,missing,unknown,mismatches,errors,unresolved,verified:false,pass:false,note:'Diagnostic comparison only; cannot certify model scoring parity while unresolved rules remain.'};
}
