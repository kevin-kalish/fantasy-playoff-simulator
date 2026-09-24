import fs from 'node:fs';
import {fetchFantasyProsHistory,projectionCoverage} from '../src/data/historical-projections.js';
const key=process.env.FANTASYPROS_API_KEY;if(!key){console.error('FANTASYPROS_API_KEY is required');process.exit(2)}
const seasons=(process.argv[2]||'2024,2025').split(',').map(Number).filter(Number.isFinite),out=process.argv[3]||'data/private/fantasypros-historical.json';
const result=await fetchFantasyProsHistory({apiKey:key,seasons,onProgress:x=>console.error(x.error?`FAIL ${x.season} W${x.week}: ${x.error}`:`${x.season} W${x.week}: ${x.rows} rows (${x.total} total)`) });
fs.mkdirSync(out.split('/').slice(0,-1).join('/')||'.',{recursive:true});fs.writeFileSync(out,JSON.stringify({summary:result.summary,failures:result.failures,coverage:projectionCoverage(result.rows),rows:result.rows},null,2));console.log(JSON.stringify({...result.summary,out},null,2));if(!result.rows.length)process.exitCode=2;
