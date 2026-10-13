import {runCalibrationRefresh} from '../src/data/calibration-refresh.js';
const season=Number(process.argv[2]??2026);
try{
 const report=runCalibrationRefresh({season,refreshSchedule:process.argv.includes('--refresh-schedule')});
 for(const s of report.steps){
  console.log('CALIBRATION '+s.name.toUpperCase()+': '+s.status+' (exit '+s.exitCode+')');
  if(s.stdout.trim())console.log(s.stdout.trim());
  if(s.stderr.trim())console.error(s.stderr.trim());
 }
 console.log('CALIBRATION REFRESH: '+report.status+'; private status data/private/calibration-refresh-status.json');
 if(report.status==='failed')process.exitCode=1;
}catch(error){console.error('CALIBRATION REFRESH: FAIL; '+error.message);process.exitCode=1;}
