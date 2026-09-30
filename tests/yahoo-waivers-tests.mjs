import assert from 'node:assert/strict';
import {loadYahooWaiverPool,candidateDropPlayerIds} from '../src/data/yahoo-waivers.js';

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
console.log('yahoo-waivers-tests: all checks passed');
