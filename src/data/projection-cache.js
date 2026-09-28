import fs from 'node:fs';
import path from 'node:path';

const clean=s=>String(s??'').trim();
const number=v=>{const n=Number(v);return Number.isFinite(n)?n:undefined};
const first=(row,keys)=>{for(const key of keys)if(row?.[key]!==undefined&&row[key]!==null&&row[key]!=='')return row[key];};
const aliases={
 playerId:['playerId','player_id','id'],name:['name','player','playerName','player_name','player_display_name'],position:['position','pos'],nflTeam:['nflTeam','team','tm'],projection:['projection','projected','fpts','fantasyPoints','fantasy_points','points'],season:['season','year'],week:['week','wk']
};

export function parseProjectionCsv(text){
 const lines=String(text??'').replace(/^\uFEFF/,'').split(/\r?\n/).filter(line=>line.trim());
 if(lines.length<2)return [];
 const parse=line=>{const out=[];let value='',quoted=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){if(quoted&&line[i+1]==='"'){value+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){out.push(value);value='';}else value+=c;}out.push(value);return out;};
 const headers=parse(lines[0]).map(clean);
 return lines.slice(1).map(line=>Object.fromEntries(parse(line).map((value,index)=>[headers[index],clean(value)])));
}

export function normalizeProjectionRows(rows,{season,week,source='projection-cache'}={}){
 return (rows??[]).map(row=>({
  season:number(first(row,aliases.season))??number(season),week:number(first(row,aliases.week))??number(week),playerId:clean(first(row,aliases.playerId))||undefined,name:clean(first(row,aliases.name)),position:clean(first(row,aliases.position)).toUpperCase(),nflTeam:clean(first(row,aliases.nflTeam)).toUpperCase()||undefined,projection:number(first(row,aliases.projection)),source
 })).filter(row=>row.season&&row.week&&row.name&&row.position&&Number.isFinite(row.projection));
}

export function readProjectionInput(filePath,{season,week,source}={}){
 const text=fs.readFileSync(filePath,'utf8');
 const raw=filePath.toLowerCase().endsWith('.csv')?parseProjectionCsv(text):JSON.parse(text);
 const rows=Array.isArray(raw)?raw:(raw.rows??raw.projections??[]);
 return normalizeProjectionRows(rows,{season,week,source});
}

const key=row=>`${row.season}|${row.week}|${row.playerId||row.name.toLowerCase()}|${row.position}`;
export function mergeProjectionCache(existingRows,newRows){
 const merged=new Map((existingRows??[]).map(row=>[key(row),row]));
 for(const row of newRows??[])merged.set(key(row),row);
 return [...merged.values()].sort((a,b)=>a.season-b.season||a.week-b.week||a.name.localeCompare(b.name));
}

export function writeProjectionCache(filePath,rows,{source='projection-cache'}={}){
 fs.mkdirSync(path.dirname(filePath),{recursive:true});
 fs.writeFileSync(filePath,JSON.stringify({updatedAt:new Date().toISOString(),source,rows},null,2)+'\n');
}
