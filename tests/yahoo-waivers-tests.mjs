import assert from 'node:assert/strict';
import {loadYahooWaiverPool,candidateDropPlayerIds,prescreenWaiverScenarios} from '../src/data/yahoo-waivers.js';

const prop=(key,value)=>({[key]:value});
const player=(id,name,pos,slot='BN')=>[prop('player_key',id),prop('name',{full:name}),prop('display_position',pos),prop('selected_position',{position:slot})];
const collection=rows=>Object.fromEntries([...rows.map((row,i)=>[String(i),{player:row}]),['count',rows.length]]);
const payload=rows=>({fantasy_content:{league:[{}, {players:collection(rows)}]}});
const calls=[];
async function get(path){calls.push(path);const start=Number(path.match(/start=(\d+)/)?.[1]??0);if(start===0)return payload([player('461.p.1','Free RB','RB'),player('461.p.2','Free WR','WR')]);return payload([])}
const pool=await loadYahooWaiverPool(get,{leagueKey:'461.l.1',limit:30});
assert.equal(pool.length,2);assert.equal(pool[0].name,'Free RB');assert.equal(pool[1].position,'WR');assert.ok(calls[0].includes('status=A'));assert.ok(calls[0].includes('sort=AR'));
const drops=candidateDropPlayerIds({roster:[{id:'a',lineupSlot:'RB',projection:3},{id:'b',lineupSlot:'BN',projection:7},{id:'c',lineupSlot:'BN',projection:2}]},{limit:2});
assert.deepEqual(drops,['c','b']);

const team={roster:[{id:'qb',position:'QB',lineupSlot:'QB',projection:20},{id:'rb1',position:'RB',lineupSlot:'RB',projection:14},{id:'rb2',position:'RB',lineupSlot:'BN',projection:8},{id:'wr1',position:'WR',lineupSlot:'WR',projection:13},{id:'wr2',position:'WR',lineupSlot:'BN',projection:4}]};
const available=[{id:'free-qb',name:'Free QB',position:'QB',projection:12},{id:'free-rb',name:'Free RB',position:'RB',projection:11},{id:'free-wr',name:'Free WR',position:'WR',projection:10}];
const screen=prescreenWaiverScenarios(team,available,{candidateLimit:2,dropsPerCandidate:1,overallDropLimit:1});
assert.equal(screen.screenedCandidates,2);assert.equal(screen.totalCandidates,3);assert.equal(screen.candidates[0].id,'free-qb');
assert.ok(screen.dropMap['free-rb']?.includes('rb2')||screen.dropMap['free-qb']?.includes('wr2'));
console.log('yahoo-waivers-tests: all checks passed');
