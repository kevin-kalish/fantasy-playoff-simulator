import fs from 'node:fs';
const path=process.argv[2]||'data/private/ffpros-research-calibration.json';
if(!fs.existsSync(path)){console.error(`Missing ${path}. Run calibrate:ffpros-research first.`);process.exit(2)}
const report=JSON.parse(fs.readFileSync(path,'utf8'));
const rows=report.joinedRows||report.rows||[];
if(!rows.length){console.error('Calibration report does not contain joined rows. Re-run after updating the research calibration script.');process.exit(2)}
const mean=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:null;
const sd=a=>{if(a.length<2)return null;const m=mean(a);return Math.sqrt(a.reduce((s,x)=>s+(x-m)**2,0)/(a.length-1))};
const positions=['QB','RB','WR','TE','K'];
function summarize(g){const p=g.map(r=>Number(r.projection)),a=g.map(r=>Number(r.actual)),e=g.map((r,i)=>a[i]-p[i]);return{n:g.length,projectionMean:mean(p),actualMean:mean(a),biasActualMinusProjection:mean(e),mae:mean(e.map(Math.abs)),rmse:Math.sqrt(mean(e.map(x=>x*x))),projectionSD:sd(p),actualSD:sd(a),actualToProjectionMeanRatio:mean(a)/Math.max(mean(p),.001),negativeActuals:a.filter(x=>x<0).length};}
const out={overall:summarize(rows),byPosition:Object.fromEntries(positions.map(pos=>[pos,summarize(rows.filter(r=>r.position===pos))])),sample:rows.slice(0,15).map(r=>({season:r.season,week:r.week,name:r.name,position:r.position,team:r.nflTeam,projection:r.projection,actual:r.actual}))};
console.log(JSON.stringify(out,null,2));
