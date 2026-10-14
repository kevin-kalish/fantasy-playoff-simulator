// Build an offline, local-only browser acceptance preview. No HTTP server,
// remote scripts, analytics, or public deployment.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {weeklyReportToDashboardV1} from '../src/ui/live-dashboard-export.js';

const here=path.dirname(fileURLToPath(import.meta.url));
const projectRoot=path.resolve(here,'..');
const privateRoot=path.resolve(projectRoot,'data/private');
const withinPrivate=target=>target.startsWith(privateRoot+path.sep);
export function buildPrivatePreview(document,rendererSource){
 if(document?.readiness?.ready!==true)throw new Error('Private preview requires passing simulation readiness');
 const payload=weeklyReportToDashboardV1(document.report??document);
 const renderer=rendererSource.replace(/^export\s+function\s+renderDashboardV1/m,'function renderDashboardV1');
 if(!renderer.includes('function renderDashboardV1('))throw new Error('Dashboard renderer missing');
 // Escape data before embedding in a script tag. This prevents JSON content
 // from terminating the script and executing injected HTML.
 const serialized=JSON.stringify(payload).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
 return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'none'; connect-src 'none'; form-action 'none'; base-uri 'none'">
<title>Private Fantasy Dashboard Acceptance</title>
<style>body{font-family:system-ui,sans-serif;max-width:1200px;margin:2rem auto;padding:0 1rem;background:#f5f7fa;color:#192436}h2,h3{margin:.5rem 0}h4{margin:1rem 0 .4rem}.dash-head,.metric-grid,.schedule-row,.player-row{display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap}.metric-grid>div,.race-panel,.matchup-panel,.detail-card{background:white;border:1px solid #dce2eb;border-radius:10px;padding:1rem;margin:.8rem 0}.metric-grid>div{flex:1;min-width:160px}.metric-grid span,.metric-grid strong{display:block}.metric-grid strong{font-size:1.4rem}.schedule-row,.player-row{padding:.6rem 0;border-bottom:1px solid #eee}.schedule-row em,.player-row em{font-size:.85rem}.table-wrap{overflow:auto}table{width:100%;border-collapse:collapse}td,th{padding:.65rem;text-align:left;border-bottom:1px solid #ddd}tr[data-team-id]{cursor:pointer}tr.selected{background:#e9f2ff}.demo-disclaimer,.sim-note,.eyebrow{color:#526174;font-size:.85rem}.bar{background:#e2e7ed;flex:1;height:.6rem;border-radius:5px;overflow:hidden}.bar i{display:block;background:#3268a8;height:100%}.schedule-view-controls{display:flex;gap:.5rem;flex-wrap:wrap;margin:.75rem 0}.schedule-view-controls button{border:1px solid #8da1b9;background:white;color:#192436;padding:.5rem .85rem;border-radius:7px;cursor:pointer;font:inherit}.schedule-view-controls button[aria-pressed=true]{background:#244e85;color:white;border-color:#244e85}.schedule-view-controls button:focus-visible{outline:3px solid #d68c24;outline-offset:2px}.seed-row{display:flex;align-items:center;gap:1rem;margin:.4rem 0}</style>
</head><body><p><strong>PRIVATE / LOCAL ONLY</strong> — offline read-only acceptance preview. Do not upload this file or share it publicly.</p><main id="dashboard"></main>
<script>${renderer}
const payload=${serialized};
renderDashboardV1(document.getElementById('dashboard'),payload);
</script></body></html>`;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const input=process.argv[2];
 const output=path.resolve(process.argv[3]??'data/private/live-dashboard-preview.html');
 if(!input)throw new Error('Usage: npm run dashboard:preview -- data/private/<report>.json [data/private/<preview>.html]');
 if(!withinPrivate(output))throw new Error('Preview must be saved inside data/private; public output paths are prohibited');
 const document=JSON.parse(fs.readFileSync(input,'utf8'));
 const archivePath=path.join(privateRoot,'playoff-probability-history.json');
 if(fs.existsSync(archivePath)){
  const archive=JSON.parse(fs.readFileSync(archivePath,'utf8'));
  const report=document.report??document;
  const leagueKey=document.sourceAudit?.leagueKey??document.report?.sourceAudit?.leagueKey;
  const season=document.sourceAudit?.season??document.report?.season;
  if(String(archive.teamId)===String(report.team?.id) && (!leagueKey || String(archive.leagueKey)===String(leagueKey)) && (!season || Number(archive.season)===Number(season))){
   report.playoffHistory=archive.history;
  } else throw new Error('Private history team does not match the requested report');
 }
 const renderer=fs.readFileSync(path.join(projectRoot,'src/ui/live-dashboard-v1.js'),'utf8');
 const html=buildPrivatePreview(document,renderer);
 fs.mkdirSync(path.dirname(output),{recursive:true});
 fs.writeFileSync(output,html,{mode:0o600});
 console.log('PRIVATE DASHBOARD PREVIEW: '+output);
 console.log('Open the file locally in a browser. Never publish or commit it.');
}
