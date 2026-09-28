export function buildWeeklyRefreshPlan(snapshot,config={},options={}){
 const season=Number(config.season??snapshot?.source?.season);
 const currentWeek=Number(options.week??snapshot?.currentWeek??snapshot?.state?.currentWeek??snapshot?.source?.week);
 if(!season) throw new Error('Weekly refresh requires a season.');
 if(!currentWeek) throw new Error('Weekly refresh requires the current NFL week.');
 const aliases=new Set([config.teamName,...(config.teamAliases??[])].filter(Boolean));
 const team=(snapshot?.teams??[]).find(t=>aliases.has(t.name));
 if(!team) throw new Error(`Configured team not found: ${config.teamName??'unknown'}`);
 const playoffStart=Math.min(...(config.playoffs?.weeks??snapshot?.playoffWeeks??[15]));
 const horizonEnd=Math.min(playoffStart-1,currentWeek+Number(options.lookahead??2));
 const weeks=[]; for(let w=currentWeek;w<=horizonEnd;w++) weeks.push(w);
 const defaults=config.defaults??{};
 return {season,week:currentWeek,teamId:team.id,weeks,minimumProjectionRows:Number(options.minimumProjectionRows??1),minimumProjectionMatchRate:Number(defaults.minimumProjectionMatchRate??.9),simulations:Number(defaults.simulations??50000),seed:Number(defaults.seed??20260923),modelVariant:defaults.modelVariant??'correlated',maxActions:Number(defaults.maxActions??5),outputPath:options.outputPath??`data/private/fightin-kali-week-${currentWeek}-report.json`};
}
