import fs from 'node:fs';
import path from 'node:path';
const timestamp=v=>typeof v==='string'&&Number.isFinite(Date.parse(v));
const fields=['capturedAt','observedAt','retrievedAt','issuedAt','projectedAt','kickoffAt','forecastProvenance','immutableArchive','schemaVersion'];
export function classifyEvidenceDocument(data){
 const rows=Array.isArray(data)?data:Array.isArray(data?.rows)?data.rows:Array.isArray(data?.projections)?data.projections:[];
 const examples=rows.slice(0,100);
 const present={};
 for(const field of fields)present[field]=Number(data?.[field]!==undefined)+examples.filter(r=>r&&r[field]!==undefined).length;
 const providers={jerrygm:0,fantasypros:0,other:0};
 let freshProofRows=0,observedTimes=0;
 for(const r of examples){
  const p=r?.forecastProvenance??{};
  const provider=String(p.provider??r?.source??data?.source??'').toLowerCase();
  providers[provider==='jerrygm'?'jerrygm':provider==='fantasypros'?'fantasypros':'other']++;
  if(p.kind==='fresh-provider-response')freshProofRows++;
  if(timestamp(p.observedAt))observedTimes++;
 }
 return {sampledRows:examples.length,totalRows:rows.length,fieldsPresent:Object.fromEntries(Object.entries(present).filter(([,n])=>n>0)),providers,freshProofRows,observedTimes,immutableArchive:data?.immutableArchive===true,schemaVersion:data?.schemaVersion??null};
}
export function discoverLocalEvidence(root='data/private',{maxFiles=2000,maxBytes=3000000,maxDepth=5}={}){
 const result={schemaVersion:1,mode:'read-only-metadata-discovery',parameterUpdatesAllowed:false,scannedJson:0,skippedOversize:0,skippedInvalidJson:0,skippedSymlinks:0,skippedDepth:0,byDirectory:{},documentsWithFreshProof:0,documentsWithObservationTimes:0,documentsWithLegacySchema:0};
 if(!fs.existsSync(root))return {...result,status:'directory-not-found'};
 const walk=(dir,depth)=>{
  if(depth>maxDepth){result.skippedDepth++;return;}
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
   if(result.scannedJson>=maxFiles)break;
   const full=path.join(dir,entry.name);
   if(entry.isSymbolicLink()){result.skippedSymlinks++;continue;}
   if(entry.isDirectory()){walk(full,depth+1);continue;}
   if(!entry.isFile()||!entry.name.toLowerCase().endsWith('.json'))continue;
   const size=fs.statSync(full).size;
   if(size>maxBytes){result.skippedOversize++;continue;}
   let doc;
   try{doc=JSON.parse(fs.readFileSync(full,'utf8'));}catch{result.skippedInvalidJson++;continue;}
   result.scannedJson++;
   const rel=path.relative(root,dir).split(path.sep)[0]||'(root)';
   const group=result.byDirectory[rel]??{documents:0,rows:0,documentsWithFreshProof:0,documentsWithObservationTimes:0,legacySchemas:0};
   const meta=classifyEvidenceDocument(doc);
   group.documents++;group.rows+=meta.totalRows;
   if(meta.freshProofRows){group.documentsWithFreshProof++;result.documentsWithFreshProof++;}
   if(meta.observedTimes){group.documentsWithObservationTimes++;result.documentsWithObservationTimes++;}
   if(meta.schemaVersion===1||meta.schemaVersion===2){group.legacySchemas++;result.documentsWithLegacySchema++;}
   result.byDirectory[rel]=group;
  }
 };
 walk(root,0);
 return {...result,status:'completed',limitations:'Metadata discovery only. No files, names, credentials, row-level data, or timestamps are copied into this report. Provider freshness must be independently established before calibration.'};
}
