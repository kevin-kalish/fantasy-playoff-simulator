import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

const configPath='config/fightin-kali-2026.json';
const snapshotPath=process.argv[2]??process.env.FIGHTIN_KALI_SNAPSHOT??'data/private/fightin-kali-current.json';
const weekArg=process.argv[3]??process.env.NFL_WEEK;
if(!fs.existsSync(configPath)){console.error(`Missing league config: ${configPath}`);process.exit(2)}
if(!fs.existsSync(snapshotPath)){console.error(`Missing current league snapshot: ${snapshotPath}`);console.error('Until Yahoo live access is available, place/update the normalized snapshot there or pass its path as the first argument.');process.exit(2)}
const config=JSON.parse(fs.readFileSync(configPath,'utf8'));
const snapshot=JSON.parse(fs.readFileSync(snapshotPath,'utf8'));
const normalized=s=>String(s??'').replace(/[’‘]/g,"'").trim().toLowerCase();
const aliases=(config.teamAliases??[config.teamName]).map(normalized);
const team=(snapshot.teams??[]).find(t=>aliases.includes(normalized(t.name)));
if(!team){console.error(`Could not find ${config.teamName} in ${snapshotPath}.`);process.exit(2)}
const inferredWeek=(()=>{const weeks=(snapshot.schedule??[]).map(s=>Number(s.week)).filter(Number.isFinite);return weeks.length?Math.min(...weeks):null})();
const week=Number(weekArg??inferredWeek);
if(!week){console.error('Week is required. Pass it as the second argument or set NFL_WEEK.');process.exit(2)}
const spec={teamId:team.id,season:config.season,week,scoring:'HALF',simulations:config.defaults.simulations,seed:config.defaults.seed,modelVariant:config.defaults.modelVariant,minimumProjectionMatchRate:config.defaults.minimumProjectionMatchRate,maxActions:config.defaults.maxActions,outputPath:`data/private/fightin-kali-week-${week}-report.json`};
const specPath='data/private/fightin-kali-weekly-spec.generated.json';
fs.mkdirSync('data/private',{recursive:true});
fs.writeFileSync(specPath,JSON.stringify(spec,null,2));
console.error(`FIGHTIN' KALI: ${config.season} Week ${week}; snapshot ${snapshotPath}; team ${team.name} (${team.id}).`);
const result=spawnSync(process.execPath,['scripts/run-weekly-intelligence.mjs',snapshotPath,specPath],{stdio:'inherit',env:process.env});
process.exit(result.status??1);
