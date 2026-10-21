export function selectParticipationReviewBatch(queue) {
  if (!queue || queue.schemaVersion!==1 || !Array.isArray(queue.records)) {
    throw new Error('Invalid private participation queue');
  }
  const batch=queue.records.filter(r=>r.reviewPriority==='first');
  if (batch.some(r=>Number(r.season)!==2026 || Number(r.week)!==5 ||
      !['WR','RB'].includes(r.position) || r.yahooActual!==0 ||
      r.reviewStatus!=='unverified' || r.evidenceRequired!==true)) {
    throw new Error('First-priority batch contains ineligible records');
  }
  return batch;
}
