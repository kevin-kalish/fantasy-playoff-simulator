import crypto from 'node:crypto';
import {yahooProperties,yahooValue} from './yahoo-normalize.js';
const props=yahooProperties, val=yahooValue;
function find(node,key){
 if(!node||typeof node!=='object')return null;
 if(Array.isArray(node)){for(const x of node){const v=find(x,key);if(v!==null)return v;}return null;}
 if(Object.hasOwn(node,key))return node[key];
 for(const x of Object.values(node)){const v=find(x,key);if(v!==null)return v;}
 return null;
}
function collect(node,out=[]){
 if(!node||typeof node!=='object')return out;
 if(Array.isArray(node)){for(const x of node)collect(x,out);return out;}
 if(Object.hasOwn(node,'stat_id')&&Object.hasOwn(node,'value'))out.push(node);
 else for(const x of Object.values(node))collect(x,out);
 return out;
}
export function extractYahooScoringSettings(response,{leagueKey,season,capturedAt=new Date().toISOString()}={}){
 const settings=props(find(response?.fantasy_content??response,'settings')??{});
 const raw=find(settings,'stat_modifiers');
 const rows=collect(raw).map(r=>({statId:String(val(r.stat_id)),value:Number(val(r.value))}));
 const errors=[];
 if(!leagueKey)errors.push('missing-league-key');
 if(!Number.isInteger(Number(season))||Number(season)<2000)errors.push('invalid-season');
 if(!Number.isFinite(Date.parse(capturedAt)))errors.push('invalid-capture-time');
 if(!raw||!rows.length)errors.push('missing-stat-modifiers');
 if(rows.some(r=>!r.statId||!Number.isFinite(r.value)))errors.push('invalid-stat-modifier');
 if(new Set(rows.map(r=>r.statId)).size!==rows.length)errors.push('duplicate-stat-id');
 rows.sort((a,b)=>a.statId.localeCompare(b.statId,undefined,{numeric:true}));
 const fingerprint=rows.length?crypto.createHash('sha256').update(JSON.stringify(rows)).digest('hex'):null;
 return {schemaVersion:1,source:'yahoo-league-settings',leagueKey:String(leagueKey??''),season:Number(season),capturedAt,scoringRules:rows,fingerprint,valid:errors.length===0,errors,verifiedAgainstModel:false};
}
