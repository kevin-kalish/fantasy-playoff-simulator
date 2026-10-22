// Local-only Yahoo snapshot preview. No simulations, provider requests, or readiness bypass.
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('data/private');
const input=path.resolve(process.argv[2]??'data/private/fightin-kali-current.json');
const output=path.resolve(process.argv[3]??'data/private/yahoo-only-dashboard.html');
const inside=p=>p.startsWith(root+path.sep);
if(!inside(input)||!inside(output))throw Error('Input and output must remain inside data/private');
const s=JSON.parse(fs.readFileSync(input,'utf8'));
if(s.source?.provider!=='yahoo'||!Array.isArray(s.teams)||s.teams.length===0)throw Error('Expected a Yahoo league snapshot with teams');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const week=s.currentWeek??s.source?.currentWeek;
const teams=[...s.teams].sort((a,b)=>Number(a.rank??999)-Number(b.rank??999));
const roster=t=>(Array.isArray(t.roster)?t.roster:[]).map(p=>'<li>'+esc(p.name??p.playerName??p.id??'Unnamed player')+' — '+esc(p.position??'')+'</li>').join('');
const html='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; base-uri \'none\'; form-action \'none\'"><title>Private Yahoo League Snapshot</title><style>body{font:16px system-ui;max-width:1100px;margin:2rem auto;padding:0 1rem;color:#17233b}table{border-collapse:collapse;width:100%}th,td{padding:.6rem;border-bottom:1px solid #ddd;text-align:left}details{margin:1rem 0;padding:1rem;border:1px solid #ddd;border-radius:8px}summary{cursor:pointer;font-weight:bold}.notice{background:#f1f4f8;padding:1rem;border-radius:8px}</style></head><body><h1>Yahoo League — Snapshot</h1><p class="notice">PRIVATE / LOCAL ONLY. Yahoo snapshot week '+esc(week??'unknown')+'. Source: '+esc(s.source?.leagueKey??s.source?.leagueId??'Yahoo')+'. No live refresh. Playoff odds, championship odds, projections and recommendations: unavailable (no trusted projection data). Do not treat this as a current live forecast.</p><h2>Standings</h2><table><thead><tr><th>Rank</th><th>Team</th><th>Record</th><th>Points for</th><th>Points against</th></tr></thead><tbody>'+teams.map(t=>'<tr><td>'+esc(t.rank??'—')+'</td><td>'+esc(t.name)+'</td><td>'+esc(t.wins??0)+'-'+esc(t.losses??0)+'-'+esc(t.ties??0)+'</td><td>'+esc(t.points??'—')+'</td><td>'+esc(t.pointsAgainst??'—')+'</td></tr>').join('')+'</tbody></table><h2>Teams and rosters</h2>'+teams.map(t=>'<details><summary>'+esc(t.name)+'</summary><ul>'+roster(t)+'</ul></details>').join('')+'<h2>Schedule coverage</h2><p>'+esc(s.schedule?.length??0)+' schedule-week records in this snapshot. Matchup details are not yet displayed.</p></body></html>';
fs.writeFileSync(output,html,{mode:0o600});
console.log('YAHOO ONLY DASHBOARD: '+output+' (snapshot week '+week+'). No provider requests or simulations.');
