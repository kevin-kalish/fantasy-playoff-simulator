const pct=x=>Number.isFinite(Number(x))?`${(100*Number(x)).toFixed(1)}%`:'—';
const signedPct=x=>Number.isFinite(Number(x))?`${Number(x)>=0?'+':''}${(100*Number(x)).toFixed(2)}%`:'—';
const signed=x=>Number.isFinite(Number(x))?`${Number(x)>=0?'+':''}${Number(x).toFixed(1)}`:'—';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function availability(report){
 const a=report?.scanAvailability??report?.diagnostics?.scanAvailability??{};
 const item=(label,x)=>{const status=x?.status??'not-configured';const detail=x?.reason?` · ${esc(x.reason)}`:x?.scenarioCount?` · ${x.scenarioCount} scenarios`:'';return `<span class="intel-source ${status}"><b>${label}</b> ${esc(status)}${detail}</span>`};
 return `<div class="intel-sources">${item('Start/Sit',a.startSit)}${item('Waivers',a.waivers)}${item('Trades',a.trades)}</div>`;
}
function actionCard(r){const d=r.details??{};return `<article class="intel-action"><div class="intel-action-head"><span class="intel-rank">#${r.rank??'—'}</span><span class="intel-type">${esc(r.type)}</span></div><h4>${esc(r.label)}</h4><div class="intel-impact"><span><b>${signed(r.projectedPointDelta)}</b> pts</span><span><b>${signedPct(r.playoffDelta)}</b> playoffs</span><span><b>${signedPct(r.championshipDelta)}</b> title</span></div>${r.decisionReadiness?`<p class="demo-disclaimer">Decision readiness: <strong>${esc(r.decisionReadiness)}</strong> · Championship signal: ${esc(r.championshipSignal?.status??'UNAVAILABLE')}${Number.isFinite(r.championshipSignal?.errorBound)?` · Monte Carlo bound ±${(100*r.championshipSignal.errorBound).toFixed(2)} pp`:''}</p>`:''}${r.seedStability?`<p class="demo-disclaimer">Seed stability: ${esc(r.seedStability.status)} · ${Number(r.seedStability.replications)} completed / ${Number(r.seedStability.requestedReplications??r.seedStability.replications)} requested runs. ${Number(r.seedStability.missingReplications)>0?' · Some runs did not reproduce this recommendation.':''} Sensitivity diagnostic only.</p>`:''}${d.dropPlayerName?`<p>Add <strong>${esc(d.addPlayerName)}</strong> · Drop <strong>${esc(d.dropPlayerName)}</strong></p>`:''}</article>`}

export function renderWeeklyIntelligence(report){
 if(!report)return '';
 const recs=report.recommendations??report.gm?.recommendations??[];
 const diag=report.diagnostics??report.gm?.diagnostics??{};
 const matchup=report.matchup??{};
 const title=report.teamName??report.team?.name??'Your Team';
 const week=report.week??'—';
 const playoffs=report.playoffProbability??report.team?.playoffProbability;
 const championship=report.championshipProbability??report.team?.championshipProbability;
 const trust=report.trust?.status??report.trustStatus??'—';
 const posture=report.strategy?.posture??report.gm?.strategy?.posture??'—';
 return `<section class="intelligence-panel"><div class="intel-head"><div><div class="eyebrow">Weekly GM Intelligence</div><h2>${esc(title)} · Week ${esc(week)}</h2></div><div class="intel-trust">Model trust <strong>${esc(trust)}</strong></div></div><div class="intel-metrics"><div><span>Playoffs</span><strong>${pct(playoffs)}</strong></div><div><span>Championship</span><strong>${pct(championship)}</strong></div><div><span>Matchup win</span><strong>${pct(matchup.winProbability)}</strong></div><div><span>Posture</span><strong>${esc(posture)}</strong></div></div>${availability(report)}${diag.readinessCounts?`<p class="demo-disclaimer">Recommendation readiness: ${Object.entries(diag.readinessCounts).map(([status,count])=>`${esc(status)} ${Number(count)}`).join(' · ')}. Monte Carlo signal excludes projection and model uncertainty.</p>`:''}<div class="intel-section-head"><h3>Recommended actions</h3><span>${recs.length?`${recs.length} positive modeled move${recs.length===1?'':'s'}`:'No positive modeled moves'}</span></div>${recs.length?`<div class="intel-actions">${recs.slice(0,5).map(actionCard).join('')}</div>`:`<div class="intel-empty"><strong>Hold current plan.</strong><p>${esc(diag.noActionExplanation??'No recommendation cleared the model gate in the evaluated scan.')}</p></div>`}${diag.nearMisses?.length?`<details class="intel-near"><summary>Closest alternatives</summary>${diag.nearMisses.slice(0,3).map(x=>`<p><strong>${esc(x.label)}</strong> — ${esc(x.explanation)}</p>`).join('')}</details>`:''}</section>`;
}
