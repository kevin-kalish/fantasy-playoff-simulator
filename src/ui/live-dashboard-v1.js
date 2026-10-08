const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const percent = value => typeof value === 'number' && Number.isFinite(value) ? (100 * value).toFixed(1) + '%' : '—';
const record = value => [value?.wins ?? 0, value?.losses ?? 0, value?.ties ?? 0].join('-');

export function renderDashboardV1(root, payload) {
  if (payload?.schemaVersion !== 1 || payload.mode !== 'live' || !Array.isArray(payload.teams)) throw new Error('Unsupported dashboard data');
  const teamId = String(payload.league?.userTeamId ?? '');
  const focus = payload.teams.find(team => team.id === teamId);
  if (!focus) throw new Error('Focus team missing');
  const provisional = payload.model?.championshipStatus === 'provisional';
  const titleSuffix = provisional ? ' *' : '';
  const rows = payload.teams.map(team => `<tr class="${team.id === teamId ? 'selected' : ''}"><td>${escapeHtml(team.name)}</td><td>${escapeHtml(record(team.record))}</td><td>#${escapeHtml(team.currentSeed)}</td><td>${escapeHtml(Number(team.averageWins).toFixed(2))}</td><td>${percent(team.playoffProbability)}</td><td>${percent(team.championshipProbability)}${titleSuffix}</td></tr>`).join('');
  root.innerHTML = `<div class="dash-head"><div><div class="eyebrow">Live dashboard export · read only</div><h2>${escapeHtml(focus.name)}</h2></div><div class="sim-note">${escapeHtml(payload.model?.simulations)} simulations · generated ${escapeHtml(payload.generatedAt)}</div></div>
    <div class="metric-grid"><div><span>Playoff probability</span><strong>${percent(focus.playoffProbability)}</strong></div><div><span>Championship probability</span><strong>${percent(focus.championshipProbability)}${titleSuffix}</strong></div><div><span>Projected wins</span><strong>${escapeHtml(Number(focus.averageWins).toFixed(2))}</strong></div></div>
    <div class="race-panel"><h3>League playoff race</h3><div class="table-wrap"><table><thead><tr><th>Team</th><th>Record</th><th>Seed</th><th>Avg wins</th><th>Playoffs</th><th>Champion</th></tr></thead><tbody>${rows}</tbody></table></div></div>
    <p class="demo-disclaimer">${provisional ? '* Championship odds are PROVISIONAL because playoff-week projections are derived.' : 'Championship odds use direct playoff-week projections.'} Direct weeks: ${escapeHtml((payload.model?.directWeeks ?? []).join(', ') || 'none')}; derived weeks: ${escapeHtml((payload.model?.derivedWeeks ?? []).join(', ') || 'none')}.</p>
    <p class="demo-disclaimer">Recommended actions: none published in this dashboard export until confirmation status is verified.</p>`;
}
