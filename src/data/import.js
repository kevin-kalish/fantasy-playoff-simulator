import {parseCSV} from './csv.js';
import {createCanonicalAdapter} from './provider-adapter.js';
import {leakageAudit} from './historical.js';
export function importHistoricalCSV(text,{adapter=createCanonicalAdapter()}={}){const raw=parseCSV(text),ingestion=adapter.ingest(raw),provenance={adapter:adapter.metadata(),rows:ingestion.summary,leakageIssues:leakageAudit(ingestion.accepted)};return{...ingestion,provenance}}
export function datasetSummary(rows=[]){const seasons=[...new Set(rows.map(r=>r.season))].sort((a,b)=>a-b),positions=Object.fromEntries([...new Set(rows.map(r=>r.position))].sort().map(p=>[p,rows.filter(r=>r.position===p).length])),sources=Object.fromEntries([...new Set(rows.map(r=>r.source))].sort().map(s=>[s,rows.filter(r=>r.source===s).length]));return{rows:rows.length,seasons,positions,sources}}
