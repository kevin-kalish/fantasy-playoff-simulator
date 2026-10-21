import fs from 'node:fs';
import {selectParticipationReviewBatch} from '../src/data/yahoo-participation-review-batch.js';
try {
  const queue=JSON.parse(fs.readFileSync('data/private/yahoo-participation-review-queue.json','utf8'));
  const batch=selectParticipationReviewBatch(queue);
  console.log('PRIVATE PARTICIPATION REVIEW: '+batch.length+' first-priority cases; no evidence accepted.');
  console.table(batch.map(r=>({week:r.week,name:r.name,position:r.position,team:r.nflTeam,
    status:'unverified',sourceUrl:'',reviewedAt:'',documentedStatus:''})));
  console.log('PRIVATE PARTICIPATION REVIEW: keep player details local; independent HTTPS source, exact week and supported status required.');
} catch(e) {
  console.error('PRIVATE PARTICIPATION REVIEW: ERROR; '+e.message);
  process.exitCode=1;
}
