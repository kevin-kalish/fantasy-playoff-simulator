import assert from 'node:assert/strict';
import {buildLeagueSimulationInput} from '../src/model/league-simulation-input.js';
import {simulateLeague} from '../src/simulator.js';

const positions=['QB','RB','WR','TE','K'];
function lineup(team,base){return positions.map((position,i)=>({id:`${team}-${position}`,name:`${team} ${position}`,position,nflTeam:['BUF','PHI','KC','MIN','BAL'][i],projection:base-i}))}
const teams=Array.from({length:8},(_,i)=>({id:`T${i+1}`,name:`Team ${i+1}`,wins:10-i,losses:i,points:1200-i*25,lineup:lineup(`T${i+1}`,22-i*.4)}));
const schedule=[11,12,13,14].map((week,w)=>({week,matchups:[[0,7],[1,6],[2,5],[3,4]].map(([a,b])=>[`T${(a+w)%8+1}`,`T${(b+w)%8+1}`])}));
// Replace rotated duplicate-prone schedule with deterministic round-robin slices.
const rounds=[[[1,8],[2,7],[3,6],[4,5]],[[1,7],[8,6],[2,5],[3,4]],[[1,6],[7,5],[8,4],[2,3]],[[1,5],[6,4],[7,3],[8,2]]];
const snapshot={source:{provider:'fixture',leagueId:'full-8',season:2025},teams,schedule:rounds.map((r,i)=>({week:11+i,matchups:r.map(([a,b])=>[`T${a}`,`T${b}`])})),playoffSpots:4,playoffWeeks:[15,16],reseed:true,tiebreaker:'points'};
const report={recommendation:'bucketed',folds:34,latestParameters:{season:2025,week:18,bias:Object.fromEntries(positions.map(p=>[p,{additive:.5,multiplier:1.03,n:300}])),projectionBuckets:Object.fromEntries(positions.map(p=>[p,{parentCV:.5,buckets:[{minProjection:0,maxProjection:null,n:300,cv:.5}]}])),positionCV:Object.fromEntries(positions.map(p=>[p,.5]))}};
const input=buildLeagueSimulationInput(snapshot,{calibrationReport:report,simulations:1000,seed:42});
assert.equal(input.teams.length,8);assert.equal(input.schedule.length,4);assert.equal(input.playoffSpots,4);assert.equal(input.metadata.projectionCoverage.matchRate,1);assert.equal(input.calibration.source.recommendation,'bucketed');
const results=simulateLeague(input);
assert.equal(results.length,8);assert.equal(results[0].simulations,1000);assert.ok(results.every(x=>x.playoffProbability>=0&&x.playoffProbability<=1));assert.ok(results.every(x=>x.championshipProbability>=0&&x.championshipProbability<=1));
const playoffMass=results.reduce((s,x)=>s+x.playoffProbability,0),champMass=results.reduce((s,x)=>s+x.championshipProbability,0);
assert.ok(Math.abs(playoffMass-4)<1e-9);assert.ok(Math.abs(champMass-1)<1e-9);
const bad=structuredClone(snapshot);bad.teams[0].lineup.forEach(p=>delete p.projection);
assert.throws(()=>buildLeagueSimulationInput(bad,{calibrationReport:report,minimumProjectionMatchRate:.95}),/Projection coverage/);
console.log('league-simulation-input-tests: all checks passed');
