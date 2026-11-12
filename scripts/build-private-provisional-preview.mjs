// Offline evidence-only dashboard using the shared live dashboard renderer.
// Only allowlisted fields are embedded; no league snapshots, tokens, or official odds.
import fs from 'node:fs';
export function buildPrivateProvisionalPreview({estimates=[],standings=[],provisionalOdds=null,week,season,provider='unverified'}={}){
 const safe=(Array.isArray(estimates)?estimates:[]).map(e=>({
  week:Number.isInteger(Number(e.week))?Number(e.week):null,
  slot:String(e.slot??''),points:typeof e.points==='number'&&Number.isFinite(e.points)?e.points:null,
  method:String(e.method??'unavailable'),teamName:String(e.teamName??'Unknown team')
 }));
 const safeStandings=(Array.isArray(standings)?standings:[]).map(t=>({
  id:String(t.id??''),name:String(t.name??''),wins:Number(t.wins),losses:Number(t.losses),ties:Number(t.ties),
  points:Number.isFinite(Number(t.points))?Number(t.points):null,
  rank:Number.isInteger(Number(t.rank))&&Number(t.rank)>0?Number(t.rank):null
 })).filter(t=>t.id&&t.name&&[t.wins,t.losses,t.ties].every(n=>Number.isInteger(n)&&n>=0));
 const validProbability=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=1;
 const safeOdds=provisionalOdds&&provisionalOdds.scenario==='no-replacement'&&Number.isInteger(provisionalOdds.simulations)&&provisionalOdds.simulations>=1000&&Number.isInteger(provisionalOdds.incompleteTeamWeeks)&&provisionalOdds.incompleteTeamWeeks>0&&Array.isArray(provisionalOdds.teams)&&provisionalOdds.teams.length===safeStandings.length&&safeStandings.length>0&&provisionalOdds.teams.every(t=>safeStandings.some(s=>s.id===String(t.id))&&validProbability(t.playoffProbability)&&validProbability(t.championshipProbability)&&typeof t.averageWins==='number'&&Number.isFinite(t.averageWins))?{
  scenario:'no-replacement',simulations:provisionalOdds.simulations,incompleteTeamWeeks:provisionalOdds.incompleteTeamWeeks,
  teams:provisionalOdds.teams.map(t=>({id:String(t.id),playoffProbability:t.playoffProbability,championshipProbability:t.championshipProbability,averageWins:t.averageWins}))
 }:null;
 const payload={mode:'provisional-evidence',estimates:safe,standings:safeStandings,provisionalOdds:safeOdds,week:Number(week),season:Number(season),provider:String(provider)};
 const serialized=JSON.stringify(payload).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
 const renderer=fs.readFileSync(new URL('../src/ui/live-dashboard-v1.js',import.meta.url),'utf8')
  .replace(/^export\s+function\s+/gm,'function ');
 if(!renderer.includes('function renderProvisionalDashboardV1('))throw new Error('Shared provisional renderer missing');
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'none'; connect-src 'none'; form-action 'none'; base-uri 'none'">
<title>Private provisional fantasy dashboard</title>
<style>body{font:16px system-ui;background:#f4f7fb;color:#182c43;max-width:1200px;margin:40px auto;padding:0 20px}h1,h2{margin:.4rem 0 1rem}.dash-head{background:#132d4c;color:white;padding:26px;border-radius:14px}.eyebrow{font-size:12px;letter-spacing:.05em}.metric-grid{display:flex;gap:16px;flex-wrap:wrap;margin:22px 0}.metric-grid>div{background:white;padding:20px;border-radius:12px;flex:1;min-width:150px}.metric-grid strong{display:block;font-size:28px}.race-panel,.detail-card{background:white;padding:20px;border-radius:12px;margin:20px 0}.table-wrap{overflow:auto}table{border-collapse:collapse;background:white;width:100%}th,td{text-align:left;padding:12px;border-bottom:1px solid #dce4ed}th{background:#e7eef6}.schedule-view-controls{display:flex;gap:20px;margin:20px 0;flex-wrap:wrap}.demo-disclaimer{color:#536476;font-size:14px}section{margin:28px 0}</style>
</head><body><main id="dashboard"></main><script>${renderer}
const payload=${serialized};renderProvisionalDashboardV1(document.getElementById('dashboard'),payload);
</script></body></html>`;
}
