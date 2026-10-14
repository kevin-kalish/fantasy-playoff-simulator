// Generate a fully synthetic, offline dashboard for visual acceptance.
// Never use private Yahoo data or network access.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildPrivatePreview} from './build-private-dashboard-preview.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const teams=Array.from({length:10},(_,i)=>({
 id:'T'+(i+1),name:i===0?'Demo Contenders':'Demo Team '+(i+1),
 record:{wins:8-Math.floor(i/3),losses:2+Math.floor(i/3),ties:0},
 currentSeed:i+1,averageWins:11-i*.42,
 playoffProbability:[.97,.94,.90,.86,.80,.74,.66,.54,.37,.19][i],
 championshipProbability:[.29,.23,.17,.11,.08,.05,.035,.025,.008,.002][i],
 seedDistribution:[{seed:i+1,probability:.65},{seed:Math.min(i+2,10),probability:.35}]
}));
const schedule=Array.from({length:6},(_,i)=>({
 week:7+i,opponentId:'T'+(i+2),opponentName:'Demo Team '+(i+2),
 winProbability:.56-i*.035,projectionSource:i<2?'fixture':'derived',simulations:1000,
 playoffImpact:{ifWin:.95-i*.02,ifLoss:.77-i*.035,swing:.18+i*.015,
 championshipIfWin:.34-i*.02,championshipIfLoss:.24-i*.012,
 championshipSwing:.10-i*.008,simulations:1000}
}));
const document={readiness:{ready:true},report:{
 schemaVersion:11,generatedAt:'2026-10-14T12:00:00Z',team:{id:'T1'},
 league:{playoffSpots:8,outlook:teams},
 outlook:{simulations:50000,seed:20261014},
 trust:{trusted:true,projections:{directWeeks:[7,8],longRangeWeeks:[9,10,11,12,15,16,17]},postseason:{trusted:false,reason:'Synthetic derived postseason projections'}},
 playoffHistory:[{week:0,playoffProbability:.80},{week:1,playoffProbability:.60,result:'L'},{week:2,playoffProbability:.75,result:'W'},{week:3,playoffProbability:.71,result:'L'},{week:4,playoffProbability:.82,result:'W'},{week:5,playoffProbability:.87,result:'W'},{week:6,playoffProbability:.97,result:'W'}],
 remainingSchedule:schedule,
 matchup:{week:7,teamId:'T1',opponentId:'T2',opponentName:'Demo Team 2',
 simulated:{winProbability:.56,teamMean:118.4,opponentMean:114.2},
 impact:{win:{playoffProbability:.95,championshipProbability:.34,averageWins:11.2},
 loss:{playoffProbability:.77,championshipProbability:.24,averageWins:10.2},simulations:1000}},
 roster:{starters:[{id:'demo-qb',name:'Demo Quarterback',position:'QB',slot:'QB',projection:21.4},{id:'demo-rb',name:'Demo Running Back',position:'RB',slot:'RB',projection:17.2}]},
 recommendations:{actionCount:0,diagnostics:{evaluatedActionCount:12,rejectedActionCount:12,
 noActionExplanation:'Synthetic demonstration: no action is cleared for publication.',
 rejectionCounts:{'low-confidence':8,'insufficient-evidence':4},
 nearMisses:[{type:'trade',label:'Illustrative trade (rejected)',reason:'low-confidence',
 explanation:'Example only; insufficient evidence to recommend.',confidence:'low',
 playoffDelta:.004,championshipDelta:.002}]}}
}};
const renderer=fs.readFileSync(path.join(root,'src/ui/live-dashboard-v1.js'),'utf8');
const html=buildPrivatePreview(document,renderer);
const output=path.join(root,'data/private/synthetic-dashboard-preview.html');
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,html,{mode:0o600});
console.log('Synthetic, offline dashboard created: '+output);
console.log('Open this HTML file locally in a browser. Do not commit or publish data/private/.');
