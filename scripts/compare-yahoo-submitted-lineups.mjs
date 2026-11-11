// Read-only comparison of raw Yahoo selected slots with the saved normalized snapshot.
// Prints slot counts only; never prints player names, IDs, tokens, or raw API payloads.
import fs from 'node:fs';
import {createYahooClient} from '../src/data/yahoo-client.js';
import {resolveYahooAccessToken} from '../src/data/yahoo-auth-session.js';
import {yahooPlayer} from '../src/data/yahoo-normalize.js';

const snapshotPath=process.argv[2]??'data/private/fightin-kali-current.json';
const targetNames=['End zone Em-pire','The Desmond Diamonds'];
const snapshot=JSON.parse(fs.readFileSync(snapshotPath,'utf8'));
const leagueKey=snapshot.source?.leagueKey;
const week=Number(snapshot.currentWeek??snapshot.source?.currentWeek);
if(snapshot.source?.provider!=='yahoo'||!leagueKey||!Number.isInteger(week))throw new Error('A private Yahoo snapshot with leagueKey and currentWeek is required.');
const auth=await resolveYahooAccessToken();
if(!auth.accessToken)throw new Error('Yahoo authentication is unavailable.');
const get=createYahooClient({accessToken:auth.accessToken});
const ignored=new Set(['BN','IR','IL','NA']);
const counts=players=>Object.fromEntries([...players.reduce((m,p)=>{
 const slot=String(p.lineupSlot??'').toUpperCase()||'(missing)';
 if(!ignored.has(slot))m.set(slot,(m.get(slot)??0)+1);
 return m;
},new Map())].sort(([a],[b])=>a.localeCompare(b)));
function findPlayers(node){
 if(!node||typeof node!=='object')return null;
 if(!Array.isArray(node)&&node.players&&typeof node.players==='object')return node.players;
 for(const child of Object.values(node)){const found=findPlayers(child);if(found)return found;}
 return null;
}
function rawRosterPlayers(payload){
 const collection=findPlayers(payload?.fantasy_content);
 if(!collection)throw new Error('Yahoo roster players collection not found; cannot validate.');
 return Object.entries(collection).filter(([key])=>key!=='count').map(([,entry])=>yahooPlayer(entry?.player??entry));
}
let discrepancies=0;
for(const name of targetNames){
 const team=snapshot.teams.find(t=>t.name===name);
 if(!team)throw new Error('Target team missing from private snapshot: '+name);
 const raw=rawRosterPlayers(await get(`team/${team.id}/roster;week=${week}`));
 const saved=team.weeklyLineups?.[week]??team.lineup??[];
 const rawCounts=counts(raw),savedCounts=counts(saved);
 const same=JSON.stringify(rawCounts)===JSON.stringify(savedCounts);
 if(!same)discrepancies++;
 console.log(`${name} W${week}: ${same?'MATCH':'MISMATCH'}; raw Yahoo selected slots ${JSON.stringify(rawCounts)}; saved normalized starters ${JSON.stringify(savedCounts)}`);
}
console.log(`YAHOO LINEUP SOURCE CHECK: ${discrepancies?'MISMATCH':'MATCH'}; ${targetNames.length} teams; read-only; no forecast or history changes.`);
if(discrepancies)process.exitCode=2;
