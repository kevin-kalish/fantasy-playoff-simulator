const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const percent = value => typeof value === 'number' && Number.isFinite(value) ? (100 * value).toFixed(1) + '%' : '—';
const points = value => typeof value === 'number' && Number.isFinite(value) ? (100 * value).toFixed(1) + ' pp' : '—';
const decimal = value => typeof value === 'number' && Number.isFinite(value) ? value.toFixed(2) : '—';
const record = value => [value?.wins ?? 0, value?.losses ?? 0, value?.ties ?? 0].join('-');

export function renderDashboardV1(root, payload) {
  if (payload?.schemaVersion !== 1 || payload.mode !== 'live' || !Array.isArray(payload.teams)) throw new Error('Unsupported dashboard data');
  const teamId = String(payload.league?.userTeamId ?? '');
  const focus = payload.teams.find(team => team.id === teamId);
  if (!focus) throw new Error('Focus team missing');
  const provisional = payload.model?.championshipStatus === 'provisional';
  const titleSuffix = provisional ? ' *' : '';
  const sections = [['dashboard-matchup','Matchup'],['dashboard-schedule','Schedule'],['dashboard-leverage','Leverage'],['dashboard-gm','GM review'],['dashboard-race','Playoff race']];
  const navigation = `<nav aria-label="Dashboard sections" class="schedule-view-controls">${sections.filter(([id]) => id !== 'dashboard-gm' || payload.gmDiagnostics).map(([id,label]) => `<a href="#${id}">${label}</a>`).join('')}</nav>`;
  const history = Array.isArray(payload.playoffHistory) ? [...payload.playoffHistory].sort((a,b)=>a.week-b.week) : [];
  const historyValid = history.filter(point => Number.isInteger(point.week) && point.week >= 0 && typeof point.probability === 'number' && Number.isFinite(point.probability) && point.probability >= 0 && point.probability <= 1);
  const historyChart = (() => {
    if (!historyValid.length) return '<p class="demo-disclaimer">No recorded weekly playoff probability snapshots yet. This chart will populate as weekly snapshots are saved; previous weeks cannot be reconstructed from the latest forecast.</p>';
    const left=55, right=765, top=25, bottom=270;
    const minWeek=Math.min(...historyValid.map(p=>p.week)), maxWeek=Math.max(...historyValid.map(p=>p.week));
    const x=week=>minWeek===maxWeek?(left+right)/2:left+(week-minWeek)/(maxWeek-minWeek)*(right-left);
    const y=p=>bottom-p*(bottom-top);
    const path=historyValid.map((p,i)=>(i?'L':'M')+x(p.week).toFixed(1)+' '+y(p.probability).toFixed(1)).join(' ');
    const grid=[0,.25,.5,.75,1].map(p=>`<line x1="${left}" y1="${y(p)}" x2="${right}" y2="${y(p)}" stroke="#dce2eb"/><text x="45" y="${y(p)+4}" text-anchor="end" font-size="12" fill="#526174">${Math.round(p*100)}%</text>`).join('');
    const markers=historyValid.map((p,i)=>{
      const result=p.result==='W'?'W':p.result==='L'?'L':p.result==='T'?'T':'';
      const change=i?points(p.probability-historyValid[i-1].probability):'baseline';
      const tooltip='Week '+p.week+': '+percent(p.probability)+(result?' · '+(result==='W'?'Win':result==='L'?'Loss':'Tie'):'')+' · '+change;
      const px=x(p.week), py=y(p.probability);
      const badgeY=py<top+38?py+25:py-15;
      return `<g class="history-point" tabindex="0" role="img" aria-label="${escapeHtml(tooltip)}" data-history-tooltip="${escapeHtml(tooltip)}"><title>${escapeHtml(tooltip)}</title><circle cx="${px}" cy="${py}" r="9" fill="transparent" stroke="none"/><circle cx="${px}" cy="${py}" r="5" fill="#3268a8" pointer-events="none"/>${result?`<text x="${px}" y="${badgeY}" text-anchor="middle" font-size="12" font-weight="700" fill="${result==='W'?'#167047':result==='L'?'#b03838':'#526174'}" pointer-events="none">${result}</text>`:''}<text x="${px}" y="292" text-anchor="middle" font-size="12" fill="#526174" pointer-events="none">${p.week}</text></g>`;
    }).join('');
    return `<svg role="group" aria-label="Playoff probability by completed fantasy week, from zero to one hundred percent" viewBox="0 0 800 310" style="width:100%;height:auto;max-height:360px"><title>Weekly playoff probability history</title>${grid}<path d="${path}" fill="none" stroke="#3268a8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${markers}<text x="400" y="307" text-anchor="middle" font-size="12" fill="#526174">Fantasy week</text></svg><p id="dashboard-history-tooltip" class="demo-disclaimer" aria-live="polite">Hover over or focus a point to see its probability, result, and weekly change. W = win; L = loss; T = tie.</p><div class="table-wrap"><table><thead><tr><th>Week completed</th><th>Result</th><th>Playoff probability</th><th>Change</th></tr></thead><tbody>${historyValid.map((p,i)=>`<tr><td>Week ${p.week}</td><td>${p.result ?? '—'}</td><td>${percent(p.probability)}</td><td>${i ? points(p.probability-historyValid[i-1].probability) : '—'}</td></tr>`).join('')}</tbody></table></div>`;
  })();
  const rows = payload.teams.map(team => `<tr class="${team.id === teamId ? 'selected' : ''}" data-team-id="${escapeHtml(team.id)}" tabindex="0" role="button" aria-label="View ${escapeHtml(team.name)}"><td>${escapeHtml(team.name)}</td><td>${escapeHtml(record(team.record))}</td><td>#${escapeHtml(team.currentSeed)}</td><td>${escapeHtml(decimal(team.averageWins))}</td><td>${percent(team.playoffProbability)}</td><td>${percent(team.championshipProbability)}${titleSuffix}</td></tr>`).join('');
  const showTeam = team => {
    const detail = root.querySelector?.("#dashboard-team-detail");
    if (!detail) return;
    const seeds = (team.seedDistribution ?? []).map(entry => `<div class="seed-row"><span>#${escapeHtml(entry.seed)}</span><div class="bar"><i style="width:${Math.max(0, Math.min(100, 100 * entry.probability))}%"></i></div><strong>${percent(entry.probability)}</strong></div>`).join('');
    const players = team.id === teamId ? (payload.roster?.starters ?? []) : [];
    const lineup = players.map(player => `<div class="player-row"><span>${escapeHtml(player.slot ?? player.position)}</span><strong>${escapeHtml(player.name)}</strong><em>${player.projection == null ? '—' : escapeHtml(player.projection.toFixed(1))} pts</em></div>`).join('');
    detail.innerHTML = `<h3>${escapeHtml(team.name)}</h3><p>Record: ${escapeHtml(record(team.record))} · Seed #${escapeHtml(team.currentSeed)} · Projected wins: ${escapeHtml(decimal(team.averageWins))}</p><p>Playoffs: ${percent(team.playoffProbability)} · Championship: ${percent(team.championshipProbability)}${titleSuffix}</p><h4>Seed probabilities</h4>${seeds || '<p>Seed probabilities unavailable.</p>'}${team.id === teamId ? `<h4>Starting lineup</h4>${lineup || '<p>Lineup unavailable.</p>'}` : '<p>Other team rosters are not included in this export.</p>'}`;
  };
  const matchup = payload.matchup;
  const matchupPanel = matchup ? `<div class="matchup-panel"><div class="eyebrow">Week ${escapeHtml(matchup.week)} matchup</div><h3>${escapeHtml(focus.name)} vs ${escapeHtml(matchup.opponentName)}</h3><div class="metric-grid"><div><span>Win probability</span><strong>${percent(matchup.winProbability)}</strong></div><div><span>Expected points</span><strong>${matchup.simulatedMean == null ? '—' : escapeHtml(matchup.simulatedMean.toFixed(1))}</strong></div><div><span>Opponent expected</span><strong>${matchup.opponentMean == null ? '—' : escapeHtml(matchup.opponentMean.toFixed(1))}</strong></div></div>${matchup.impact ? `<h4>Impact of matchup result</h4><div class="metric-grid"><div><span>If win</span><strong>${percent(matchup.impact.win.playoffProbability)}</strong></div><div><span>If loss</span><strong>${percent(matchup.impact.loss.playoffProbability)}</strong></div><div><span>Playoff swing</span><strong>${((matchup.impact.win.playoffProbability - matchup.impact.loss.playoffProbability) * 100).toFixed(1)} pp</strong></div></div><div class="metric-grid"><div><span>Championship if win</span><strong>${percent(matchup.impact.win.championshipProbability)}</strong></div><div><span>Championship if loss</span><strong>${percent(matchup.impact.loss.championshipProbability)}</strong></div><div><span>Championship swing</span><strong>${Number.isFinite(matchup.impact.win.championshipProbability) && Number.isFinite(matchup.impact.loss.championshipProbability) ? ((matchup.impact.win.championshipProbability - matchup.impact.loss.championshipProbability) * 100).toFixed(1) + ' pp' : '—'}</strong></div></div><p class="demo-disclaimer">Conditional scenarios from ${escapeHtml(matchup.impact.simulations)} simulations; estimates, not guarantees. Small or negative championship swings at this sample size can be sampling noise, not evidence that winning hurts your title chances.</p>` : ''}</div>` : '<p class="demo-disclaimer">No weekly matchup analysis is available in this report.</p>';
  const scheduleInput = payload.remainingSchedule ?? [];
  const championshipRanking = scheduleInput.length > 0 && scheduleInput.every(game => Number.isFinite(game.playoffImpact?.championshipSwing));
  const impactKey = championshipRanking ? 'championshipSwing' : 'swing';
  const scheduleChronological = [...scheduleInput].sort((a,b) => a.week-b.week);
  const scheduleImpact = [...scheduleInput].sort((a,b) => (b.playoffImpact?.[impactKey] ?? -Infinity) - (a.playoffImpact?.[impactKey] ?? -Infinity) || a.week-b.week);
  const schedule = scheduleImpact;
  // Hoeffding + union bound across four Bernoulli estimates (win/loss for two games).
  // Pairwise 95% coverage needs no independence; it excludes model/projection error.
  const topImpact = schedule[0]?.playoffImpact;
  const impactSample = Number(topImpact?.simulations);
  const rankingTolerance = Number.isFinite(impactSample) && impactSample > 0 ? 2 * Math.sqrt(Math.log(160) / (2 * impactSample)) : null;
  const closeGames = rankingTolerance == null ? [] : schedule.filter(game => game.playoffImpact && topImpact[impactKey] - game.playoffImpact[impactKey] <= 2 * rankingTolerance);
  const rankingCaution = closeGames.length > 1 ? `<p class="demo-disclaimer">Close ${championshipRanking ? 'championship' : 'playoff'} rankings: ${closeGames.length} games are within ${(200 * rankingTolerance).toFixed(1)} percentage points of the top estimated swing. The two compared swings have simultaneous 95% Monte Carlo error bounds of ±${(100 * rankingTolerance).toFixed(1)} pp each (Hoeffding/union bound). This is a pairwise screen, not a simultaneous guarantee across the entire schedule, and excludes projection uncertainty.</p>` : '';
  const championshipCaution = championshipRanking && provisional ? '<p class="demo-disclaimer">Championship-impact rankings are PROVISIONAL because playoff-week projections are derived; sampling-noise screening does not capture projection uncertainty.</p>' : '';
  const schedulePanel = `<div class="race-panel"><h3>Remaining schedule</h3><div class="schedule-view-controls" role="group" aria-label="Schedule order"><button type="button" data-schedule-order="chronological" aria-pressed="true">Chronological</button><button type="button" data-schedule-order="impact" aria-pressed="false">Impact ranking</button></div><div id="dashboard-schedule-games">${scheduleChronological.length ? scheduleChronological.map(game => `<div class="schedule-row"><span>Week ${escapeHtml(game.week)}</span><strong>${escapeHtml(game.opponentName)}</strong><em>${game.winProbability == null ? "Scheduled" : `${percent(game.winProbability)} · ${escapeHtml(game.projectionSource)} (${escapeHtml(game.simulations)} sims)`}${game.playoffImpact ? ` · Playoff swing ${points(game.playoffImpact.swing)}${game.playoffImpact.championshipSwing == null ? "" : ` · Championship swing ${points(game.playoffImpact.championshipSwing)}`}` : ""}</em></div>`).join('') : '<p class="demo-disclaimer">No remaining schedule supplied.</p>'}</div><p class="demo-disclaimer">Chronological order is the default; Impact ranking sorts by conditional ${championshipRanking ? 'championship' : 'playoff'}-probability swing (win versus loss); both playoff and championship swings are shown where available. Scenario estimates use a separate simulation sample; derived projections carry additional uncertainty.</p>${rankingCaution}${championshipCaution}</div>`;
  const leverageGames = scheduleInput.filter(game => Number.isFinite(game.playoffImpact?.swing) || Number.isFinite(game.playoffImpact?.championshipSwing));
  const leverageCell = (game, key) => Number.isFinite(game.playoffImpact?.[key]) ? (100 * game.playoffImpact[key]).toFixed(1) + ' pp' : '—';
  const leverageRank = key => [...leverageGames].filter(game => Number.isFinite(game.playoffImpact?.[key])).sort((a,b) => b.playoffImpact[key]-a.playoffImpact[key] || a.week-b.week);
  const playoffLeaders = leverageRank('swing');
  const titleLeaders = leverageRank('championshipSwing');
  // Conservative Hoeffding/union bound for the four conditional Bernoulli means
  // used to compare two swing estimates; no independence assumption.
  const leverageTolerance = (a,b) => {
    const n = Math.min(Number(a?.playoffImpact?.simulations),Number(b?.playoffImpact?.simulations));
    return Number.isFinite(n) && n > 0 ? 4 * Math.sqrt(Math.log(160)/(2*n)) : null;
  };
  const leverageList = (games,key) => games.length ? games.map((game,index) => {
    const top=games[0], tolerance=index ? leverageTolerance(top,game) : null;
    const close=index>0 && (tolerance == null || top.playoffImpact[key]-game.playoffImpact[key] <= tolerance);
    return `<div class="schedule-row"><span>#${index+1} · Week ${escapeHtml(game.week)}</span><strong>${escapeHtml(game.opponentName)}</strong><em>${leverageCell(game,key)} · ${escapeHtml(game.playoffImpact.simulations)} conditional simulations${index>0 ? (tolerance == null ? ' · Uncertainty unquantified' : close ? ' · Too close to distinguish from #1' : ' · Outside pairwise sampling bound') : ''}</em></div>`;
  }).join('') : '<p class="demo-disclaimer">No conditional scenario estimates available.</p>';
  const leveragePanel = leverageGames.length ? `<div class="race-panel"><h3>Playoff leverage comparison</h3><div class="metric-grid"><div><h4>Making the playoffs</h4>${leverageList(playoffLeaders,'swing')}</div><div><h4>Winning the championship</h4>${leverageList(titleLeaders,'championshipSwing')}</div></div><p class="demo-disclaimer">Leverage is the conditional probability difference if you win versus lose the specified matchup, not the probability of winning that game. Each list ranks all matchups with available estimates. Pairwise 95% Monte Carlo bounds use a conservative Hoeffding/union screen against #1 and exclude projection uncertainty; rankings are not causal guarantees or a simultaneous confidence guarantee across all games.</p>${provisional ? '<p class="demo-disclaimer">Championship leverage is PROVISIONAL because playoff-week projections are derived.</p>' : ''}${playoffLeaders[0] && titleLeaders[0] && playoffLeaders[0].week !== titleLeaders[0].week ? '<p class="demo-disclaimer">The top playoff and championship leverage games differ; prioritize the outcome relevant to your goal.</p>' : ''}</div>` : '';
  const gm = payload.gmDiagnostics;
  const reasons = gm?.rejectionCounts ? Object.entries(gm.rejectionCounts).sort((a,b)=>b[1]-a[1]).map(([reason,count])=>`<span>${escapeHtml(reason)}: ${escapeHtml(count)}</span>`).join(' · ') : '';
  const nearMisses = (gm?.nearMisses ?? []).slice(0,5).map(candidate=>`<div class="schedule-row"><strong>${escapeHtml(candidate.label)}</strong><em>${escapeHtml(candidate.type)} · ${escapeHtml(candidate.reason)} · Playoff ${candidate.playoffDelta==null?'—':(100*candidate.playoffDelta).toFixed(1)+' pp'} · Championship ${candidate.championshipDelta==null?'—':(100*candidate.championshipDelta).toFixed(1)+' pp'}</em>${candidate.explanation ? `<p class="demo-disclaimer">${escapeHtml(candidate.explanation)}</p>` : ''}${candidate.confidence && candidate.confidence !== 'unknown' ? `<p class="demo-disclaimer">Confidence: ${escapeHtml(candidate.confidence)}</p>` : ''}</div>`).join('');
  const publicationNotice = gm?.publicationReview
    ? `${escapeHtml(gm.publicationReview.withheld)} of ${escapeHtml(gm.publicationReview.evaluated)} modeled recommendations withheld by the action-publication gate; reasons: ${escapeHtml((gm.publicationReview.reasons??[]).join(', ') || 'none')}.`
    : gm?.approved>0 ? 'Approved scenarios are intentionally withheld pending a separate action-publication trust gate.' : 'No approved scenarios are available to publish.';
  const sourceKinds = [...new Set(scheduleInput.map(game => String(game.projectionSource ?? 'unknown')))];
  const projectionNotice = sourceKinds.length ? `Schedule projection sources: ${escapeHtml(sourceKinds.join(', '))}. Derived or cached forecasts may reduce confidence; this is not proof of a fresh provider retrieval.` : 'Projection freshness not verified in this export.';
  const gmStatus = gm?.approved > 0 ? `${escapeHtml(gm.approved)} scenarios approved for analysis; 0 recommendations published by this read-only preview. Approval is not authorization to act.` : 'No approved recommendations available for publication.';
  const gmPanel = gm ? `<div class="race-panel"><h3>GM decision review</h3><p><strong>${gmStatus}</strong></p><p>${escapeHtml(gm.evaluated)} actions screened · ${escapeHtml(gm.approved)} approved · ${escapeHtml(gm.rejected)} rejected. ${escapeHtml(gm.confirmation?.passed??0)} passed final confirmation.</p><p class="demo-disclaimer">${escapeHtml(gm.noActionExplanation || 'Only confirmed actions may be published.')}</p>${gm.coverageConstrained?'<p class="demo-disclaimer">Scan coverage was constrained; no recommendation does not mean no useful move exists.</p>':''}${reasons?`<p class="demo-disclaimer">Rejection reasons: ${reasons}</p>`:''}${nearMisses?`<h4>Near misses (not actionable)</h4>${nearMisses}`:''}<p class="demo-disclaimer">Scenario deltas are exploratory and may be noisy; rejected moves are not recommendations. ${publicationNotice}</p></div>` : '';
  root.innerHTML = `<div class="dash-head"><div><div class="eyebrow">Live dashboard export · read only</div><h2>${escapeHtml(focus.name)}</h2></div><div class="sim-note">${escapeHtml(payload.model?.simulations)} simulations · generated ${escapeHtml(payload.generatedAt)}</div></div>
    <div class="metric-grid"><div><span>Playoff probability</span><strong>${percent(focus.playoffProbability)}</strong></div><div><span>Championship probability</span><strong>${percent(focus.championshipProbability)}${titleSuffix}</strong></div><div><span>Expected final wins</span><strong>${escapeHtml(Number(focus.averageWins).toFixed(2))}</strong></div></div>
    <p class="demo-disclaimer"><strong>Projection reliability:</strong> ${projectionNotice} ${provisional ? "Championship estimates are provisional." : ""}</p>
    <div class="schedule-view-controls" role="tablist" aria-label="Dashboard views"><button type="button" role="tab" id="tab-overview" data-dashboard-tab="overview" aria-controls="dashboard-overview" aria-selected="true">Overview</button><button type="button" role="tab" id="tab-history" data-dashboard-tab="history" aria-controls="dashboard-history" aria-selected="false">Playoff probability history</button></div>
    <div id="dashboard-overview" role="tabpanel" aria-labelledby="tab-overview">
    ${navigation}
    <section id="dashboard-matchup" aria-label="Weekly matchup">${matchupPanel}</section>
    <section id="dashboard-schedule" aria-label="Remaining schedule">${schedulePanel}</section>
    <section id="dashboard-leverage" aria-label="Playoff leverage">${leveragePanel || '<p class="demo-disclaimer">No conditional leverage estimates available.</p>'}</section>
    ${gm ? `<section id="dashboard-gm" aria-label="GM decision review">${gmPanel}</section>` : ''}
    <section id="dashboard-race" aria-label="League playoff race"><div class="race-panel"><h3>League playoff race</h3><div class="table-wrap"><table><thead><tr><th>Team</th><th>Record</th><th>Seed</th><th>Avg wins</th><th>Playoffs</th><th>Champion</th></tr></thead><tbody>${rows}</tbody></table></div></div></section>
    <div id="dashboard-team-detail" class="detail-card" aria-live="polite"><h3>${escapeHtml(focus.name)}</h3><p>Click a team in the playoff race to inspect its outlook.</p></div>
    <p class="demo-disclaimer">${provisional ? '* Championship odds are PROVISIONAL because playoff-week projections are derived.' : 'Championship odds use direct playoff-week projections.'} Direct weeks: ${escapeHtml((payload.model?.directWeeks ?? []).join(', ') || 'none')}; derived weeks: ${escapeHtml((payload.model?.derivedWeeks ?? []).join(', ') || 'none')}.</p>
    <p class="demo-disclaimer">Recommended actions are not published by this read-only dashboard. Approved GM scenarios, if any, require a separate action-publication trust review.</p></div>
    <section id="dashboard-history" role="tabpanel" aria-labelledby="tab-history" hidden><div class="race-panel"><h3>Playoff probability by week</h3><p class="demo-disclaimer">Each point is the forecast recorded after that week's games, not a prediction of the outcome of that game. Week 0 is the preseason baseline when available. Changes reflect results, projections, and other model inputs.</p>${historyChart}</div></section>`;
  showTeam(focus);
  const scheduleGames = root.querySelector?.('#dashboard-schedule-games');
  const scheduleButtons = root.querySelectorAll?.('[data-schedule-order]') ?? [];
  const renderScheduleOrder = order => {
    if (!scheduleGames) return;
    const games = order === 'impact' ? scheduleImpact : scheduleChronological;
    scheduleGames.innerHTML = games.map(game => `<div class="schedule-row"><span>Week ${escapeHtml(game.week)}</span><strong>${escapeHtml(game.opponentName)}</strong><em>${game.winProbability == null ? 'Scheduled' : `${percent(game.winProbability)} · ${escapeHtml(game.projectionSource)} (${escapeHtml(game.simulations)} sims)`}${game.playoffImpact ? ` · Playoff swing ${points(game.playoffImpact.swing)}${game.playoffImpact.championshipSwing == null ? '' : ` · Championship swing ${points(game.playoffImpact.championshipSwing)}`}` : ''}</em></div>`).join('') || '<p class="demo-disclaimer">No remaining schedule supplied.</p>';
    for (const button of scheduleButtons) button.setAttribute('aria-pressed', String(button.getAttribute('data-schedule-order') === order));
  };
  const switchTab = tab => {
    if (!['overview','history'].includes(tab)) return;
    for (const name of ['overview','history']) {
      const panel=root.querySelector?.('#dashboard-'+name);
      const button=root.querySelector?.('#tab-'+name);
      if (panel) panel.hidden=name!==tab;
      if (button) button.setAttribute('aria-selected',String(name===tab));
    }
  };
  const tooltipDefault='Hover over or focus a point to see its probability, result, and weekly change. W = win; L = loss; T = tie.';
  const updateHistoryTooltip = event => {
    const marker=event.target?.closest?.('[data-history-tooltip]');
    const tooltip=root.querySelector?.('#dashboard-history-tooltip');
    if(marker && tooltip) tooltip.textContent=marker.getAttribute('data-history-tooltip');
  };
  const resetHistoryTooltip = event => {
    const marker=event.target?.closest?.('[data-history-tooltip]');
    const next=event.relatedTarget?.closest?.('[data-history-tooltip]');
    const tooltip=root.querySelector?.('#dashboard-history-tooltip');
    if(marker && marker!==next && tooltip) tooltip.textContent=tooltipDefault;
  };
  root.onmouseover=updateHistoryTooltip;
  root.onfocusin=updateHistoryTooltip;
  root.onmouseout=resetHistoryTooltip;
  root.onfocusout=resetHistoryTooltip;
  root.onclick = event => {
    const tabButton=event.target?.closest?.('[data-dashboard-tab]');
    if (tabButton) { switchTab(tabButton.getAttribute('data-dashboard-tab')); return; }
    const orderButton = event.target?.closest?.('[data-schedule-order]');
    if (orderButton) { renderScheduleOrder(orderButton.getAttribute('data-schedule-order')); return; }
    const row = event.target?.closest?.("[data-team-id]"); if (!row) return; const team = payload.teams.find(t => t.id === row.getAttribute("data-team-id")); if (team) showTeam(team);
  };
  root.onkeydown = event => { if (event.key !== "Enter" && event.key !== " ") return; const row = event.target?.closest?.("[data-team-id]"); if (row) { event.preventDefault(); row.click(); } };
}
