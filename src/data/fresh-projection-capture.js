import {loadWeeklyProjectionHorizon} from './weekly-projection-provider.js';
import {buildProjectionArchive,saveProjectionArchive} from './projection-archive.js';
import {parseKickoffScheduleCSV,enrichProjectionArchiveWithKickoffs} from './projection-kickoff-enrichment.js';
import {evaluatePregameCaptureArchive} from './pregame-capture-eligibility.js';
import fs from 'node:fs';

export async function captureFreshProjectionArchive({spec,projectionNames=[],load=loadWeeklyProjectionHorizon,save=saveProjectionArchive,directory='data/private/projection-archives',kickoffPath='data/private/nfl-kickoffs.csv',readSchedule=path=>fs.readFileSync(path,'utf8')}){
 if(spec?.projectionFixturePath)throw new Error('Fixture projections are not eligible for capture');
 const weeks=spec.weeks?.length?spec.weeks:[spec.week];
 const result=await load({season:Number(spec.season),weeks,scoring:spec.scoring??'HALF',minimumRows:Number(spec.minimumProjectionRows??1),projectionNames});
 const fresh=(result.trust?.weekResults??[]).filter(r=>['jerrygm','fantasypros'].includes(r.provider)&&typeof r.observedAt==='string'&&Number.isFinite(Date.parse(r.observedAt)));
 if(!fresh.length)throw new Error('No fresh provider observations; cache-only or fixture projections cannot create a capture archive');
 const providerByWeek=Object.fromEntries((result.trust?.weekResults??[]).map(r=>[r.week,r.provider]));
 const observedAtByWeek=Object.fromEntries(fresh.map(r=>[r.week,r.observedAt]));
 const archive=buildProjectionArchive(result.rows,{scoring:spec.scoring??'HALF',provider:result.provider,providerByWeek,observedAtByWeek,leagueKey:spec.sourceAudit?.leagueKey,refreshRequested:true});
 const verified=archive.rows.filter(r=>r.forecastProvenance.kind==='fresh-provider-response').length;
 if(!verified)throw new Error('No rows have verified fresh provider provenance');
 const schedule=parseKickoffScheduleCSV(readSchedule(kickoffPath));
 if(!schedule.length)throw new Error('Independent kickoff schedule is empty');
 const enriched=enrichProjectionArchiveWithKickoffs(archive,schedule);
 const eligibility=evaluatePregameCaptureArchive(enriched.archive);
 if(!eligibility.pregameKickoffVerifiedRows)throw new Error('No fresh provider rows with independently matched future kickoff; archive not saved');
 const file=save(directory,enriched.archive);
 return {file,rows:archive.rows.length,freshProviderRows:verified,provider:result.provider,eligibility,kickoffStats:enriched.stats};
}
