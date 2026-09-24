import fs from 'node:fs';
import {parseCSV} from '../src/data/csv.js';
import {ingestHistoricalRows} from '../src/data/historical.js';
import {runRollingCalibration,summarizeRollingCalibration} from '../src/model/rolling-calibration.js';
const path=process.argv[2];if(!path){console.error('Usage: npm run calibrate:model -- path/to/historical.csv [draws]');process.exit(2)}
const draws=Number(process.argv[3]||1500),raw=parseCSV(fs.readFileSync(path,'utf8')),ing=ingestHistoricalRows(raw);if(ing.rejected.length)console.error(`Rejected ${ing.rejected.length} invalid rows`);const result=runRollingCalibration(ing.accepted,{draws});console.log(JSON.stringify(summarizeRollingCalibration(result),null,2));if(!result.folds.length){console.error('No eligible rolling folds; add more historical projection/actual rows.');process.exitCode=2;}
