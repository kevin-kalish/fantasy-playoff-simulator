import fs from 'node:fs';
import {reviewParticipationCandidates} from '../src/data/yahoo-participation-candidate-review.js';
const candidates=[
  {season:2026,week:5,yahooPlayerId:'470.p.30972',name:'Saquon Barkley',position:'RB',nflTeam:'PHI'},
  {season:2026,week:5,yahooPlayerId:'470.p.33398',name:'DeVonta Smith',position:'WR',nflTeam:'PHI'},
  {season:2026,week:5,yahooPlayerId:'470.p.40042',name:'Jordan Addison',position:'WR',nflTeam:'MIN'}
];
try {
  const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
  const actuals=read('data/private/yahoo-player-actuals.json');
  if (!Array.isArray(actuals.rows)) throw new Error('Yahoo actuals rows missing');
  const evidencePath='data/private/yahoo-participation-evidence.json';
  const evidence=fs.existsSync(evidencePath)?read(evidencePath):[];
  const results=reviewParticipationCandidates(candidates,actuals.rows,evidence);
  console.table(results);
  if(results.some(r=>!r.eligibleForManualReview)) process.exitCode=2;
  console.log('CANDIDATE REVIEW: read-only; source evidence not independently verified; no evidence written.');
} catch(e) {
  console.error('CANDIDATE REVIEW: ERROR; '+e.message);
  process.exitCode=1;
}
