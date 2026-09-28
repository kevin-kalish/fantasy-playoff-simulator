import fs from 'node:fs';
import {auditProjectionCache,formatProjectionCacheAudit} from '../src/data/projection-cache-audit.js';

const [seasonArg,...weekArgs]=process.argv.slice(2);
const season=Number(seasonArg),weeks=weekArgs.flatMap(arg=>String(arg).split(',')).map(Number).filter(Number.isInteger);
if(!season||!weeks.length){console.error('Usage: node scripts/audit-projection-cache.mjs <season> <week[,week...] ...>');process.exit(1)}
const cachePath=process.env.PROJECTION_CACHE_PATH??'data/private/projection-cache.json';
if(!fs.existsSync(cachePath)){console.error(`PROJECTION CACHE: MISSING | ${cachePath}`);process.exit(2)}
let rows;
try{const raw=JSON.parse(fs.readFileSync(cachePath,'utf8'));rows=Array.isArray(raw)?raw:(raw.rows??raw.projections??[]);}catch(error){console.error(`PROJECTION CACHE: FAIL; ${error.message}`);process.exit(2)}
const minimumRows=Number(process.env.PROJECTION_CACHE_MIN_ROWS??1);
const audit=auditProjectionCache(rows,{season,weeks,minimumRows});
console.log(formatProjectionCacheAudit(audit));
if(!audit.ready)process.exitCode=2;
