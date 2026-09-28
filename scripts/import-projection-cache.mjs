import fs from 'node:fs';
import {readProjectionInput,mergeProjectionCache,writeProjectionCache} from '../src/data/projection-cache.js';

const [inputPath,seasonArg,weekArg,sourceArg]=process.argv.slice(2);
if(!inputPath){console.error('Usage: npm run projections:cache -- <input.csv|json> [season] [week] [source]');process.exit(1)}
const season=seasonArg?Number(seasonArg):undefined,week=weekArg?Number(weekArg):undefined;
const source=sourceArg??'manual-import';
const cachePath=process.env.PROJECTION_CACHE_PATH??'data/private/projection-cache.json';
let incoming;
try{incoming=readProjectionInput(inputPath,{season,week,source});}catch(error){console.error(`PROJECTION CACHE: FAIL; ${error.message}`);process.exit(2)}
if(!incoming.length){console.error('PROJECTION CACHE: FAIL; no usable projection rows found. Expected name/player, position/pos, and projection/fpts/points columns plus season/week (in file or arguments).');process.exit(2)}
let existing=[];
if(fs.existsSync(cachePath)){
 try{const raw=JSON.parse(fs.readFileSync(cachePath,'utf8'));existing=Array.isArray(raw)?raw:(raw.rows??raw.projections??[]);}catch(error){console.error(`PROJECTION CACHE: FAIL; cannot read ${cachePath}: ${error.message}`);process.exit(2)}
}
const rows=mergeProjectionCache(existing,incoming);
writeProjectionCache(cachePath,rows,{source});
const weeks=[...new Set(incoming.map(row=>`${row.season}-W${row.week}`))].sort();
console.log(`PROJECTION CACHE: READY | imported ${incoming.length} rows | cache ${rows.length} rows | ${weeks.join(', ')}`);
console.log(`Wrote: ${cachePath}`);
