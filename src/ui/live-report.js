import {renderDashboardV1} from './live-dashboard-v1.js';
import {renderWeeklyIntelligence} from './intelligence-panel.js';

const pct=x=>Number.isFinite(Number(x))?`${(100*Number(x)).toFixed(1)}%`:'—';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const record=r=>`${r?.wins??0}-${r?.losses??0}${r?.ties?`-${r.ties}`:''}`;

function intelligenceAdapter(r){
 const gm=r.recommendations??{},diag=gm.diagnostics??{},matchup=r.matchup??{};
 return {team:r.team,week:matchup.week??r.week,playoffProbability:r.outlook?.playoffProbability,championshipProbability:r.outlook?.championshipProbability,matchup:{winProbability:matchup.simulated?.winProbability??matchup.winProbability},trust:{status:r.trust?.trusted?'PASS':'DEGRADED'},strategy:gm.strategy,recommendations:gm.items??[],scanAvailability:gm.scanAvailability,diagnostics:{...diag,noActionExplanation:diag.noActionExplanation??(gm.actionCount===0?'No evaluated move cleared the recommendation gate.':null)}};
}
function leagueTable(r){
 const rows=r.league?.outlook??[];
 return `<div class="table-wrap"><table><thead><tr><th>Team</th><th>Record</th><th>Seed</th><th>Avg Wins</th><th>Playoffs</th><th>Champion</th></tr></thead><tbody>${rows.map(x=>`<tr class="${String(x.id)===String(r.team?.id)?'selected':''}"><td><strong>${esc(x.name)}</strong></td><td>${record(x.record)}</td><td>#${x.currentSeed??'—'}</td><td>${Number(x.averageWins??0).toFixed(2)}</td><td>${pct(x.playoffProbability)}</td><td>${pct(x.championshipProbability)}${r.trust?.postseason?.trusted?'':'*'}</td></tr>`).join('')}</tbody></table></div>`;
}
export function renderLiveReport(root,payload){
 const r=payload?.report??payload;if(!r?.team||!r?.outlook)throw new Error('Invalid weekly intelligence payload');
 const matchup=r.matchup??{},proj=r.trust?.projections??{},post=r.trust?.postseason??{},starters=r.roster?.starters??[];
 root.innerHTML=`<div class="dash-head"><div><div class="eyebrow">Live Yahoo League</div><h2>${esc(r.team.name)} · Week ${esc(matchup.week??'—')}</h2></div><div class="sim-note">${Number(r.outlook.simulations??0).toLocaleString()} simulations · seed ${esc(r.outlook.seed??'—')}</div></div>
 ${renderWeeklyIntelligence(intelligenceAdapter(r))}
 <div class="detail-grid"><div class="detail-card"><div class="eyebrow">Current State</div><h3>${esc(r.team.name)} · ${record(r.team.record)}</h3><div class="metric-grid"><div><span>Current seed</span><strong>#${r.team.currentSeed??'—'}</strong></div><div><span>Avg final wins</span><strong>${Number(r.outlook.averageWins??0).toFixed(2)}</strong></div><div><span>Remaining</span><strong>${r.outlook.remainingGames??'—'}</strong></div></div><h4>Current starting lineup</h4>${starters.map(p=>`<div class="player-row"><span>${esc(p.slot??p.position)}</span><strong>${esc(p.name)}</strong><em>${Number(p.projection??0).toFixed(1)} proj</em></div>`).join('')}</div>
 <div class="detail-card"><div class="eyebrow">Projection Trust</div><h3>${r.trust?.trusted?'Ready':'Degraded'}</h3><p>Direct weeks: ${(proj.directWeeks??[]).join(', ')||'—'}<br>Derived weeks: ${(proj.longRangeWeeks??[]).join(', ')||'—'}<br>Coverage: ${pct(proj.coverage?.matchRate??proj.coverage)}</p><p><strong>Postseason:</strong> ${post.trusted?'Directly projected':'PROVISIONAL'}</p><p class="demo-disclaimer">${esc(post.reason??'')}</p></div></div>
 <div class="race-panel"><div class="eyebrow">League Monte Carlo</div><h3>Playoff race</h3>${leagueTable(r)}${post.trusted?'':'<p class="demo-disclaimer">* Championship probabilities are provisional until playoff-week projections are available.</p>'}</div>`;
}
export async function renderLiveDashboard(root,{url='./demo/data.json',fallback}={}){
 try{const res=await fetch(url,{cache:'no-store'});if(!res.ok)throw new Error(`HTTP ${res.status}`);{const payload=await res.json();if(payload?.schemaVersion===1)renderDashboardV1(root,payload);else renderLiveReport(root,payload)}}
 catch(error){console.warn('Live dashboard data unavailable; using explicitly labeled synthetic demo.',error);if(fallback){fallback();root.insertAdjacentHTML('afterbegin','<p class="demo-disclaimer"><strong>SYNTHETIC DEMO — NOT LIVE LEAGUE DATA.</strong></p>');return;}root.innerHTML='<p>Live weekly report is unavailable.</p>'}
}
