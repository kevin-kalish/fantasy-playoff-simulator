import assert from 'node:assert/strict';
import {parseCSV,importCSV,importJSON,inferFieldMap,validateFieldMap,importHistorical} from '../src/data/importers.js';
const csv='season,week,player_id,player_name,pos,team,opp,projected_points,fantasy_points,status\n2025,1,p1,"Doe, John",WR,NE,NYJ,12.5,15.2,ACTIVE\n2025,2,p2,Jane Doe,RB,NYJ,NE,10,8.5,QUESTIONABLE\n';
const parsed=parseCSV(csv);assert.equal(parsed.length,2);assert.equal(parsed[0].player_name,'Doe, John');const map=inferFieldMap(Object.keys(parsed[0]));assert.equal(map.playerId,'player_id');assert.equal(validateFieldMap(map).valid,true);const c=importCSV(csv);assert.equal(c.accepted.length,2);assert.equal(c.accepted[0].projection,12.5);assert.equal(c.accepted[0].source,'csv');
const j=importJSON(JSON.stringify({rows:[{year:2024,wk:3,id:'p3',pos:'QB',proj:20,fpts:23,team:'KC'}]}));assert.equal(j.accepted.length,1);assert.equal(j.accepted[0].season,2024);assert.equal(j.accepted[0].nflTeam,'KC');const auto=importHistorical(JSON.stringify([{season:2025,week:1,playerId:'p4',position:'TE',projection:9,actual:11}]));assert.equal(auto.accepted.length,1);
const missing=importCSV('season,week,position,projection,actual\n2025,1,QB,20,21');assert.equal(missing.mapping.valid,false);assert.deepEqual(missing.mapping.missing,['playerId']);
console.log('importer-tests: all checks passed');
