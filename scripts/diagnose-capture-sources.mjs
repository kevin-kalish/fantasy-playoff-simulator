import {diagnoseCaptureSources} from '../src/data/capture-source-diagnostics.js';
const season=Number(process.argv[2]??2026),week=Number(process.argv[3]??6);
const result=diagnoseCaptureSources({season,week});
console.log(JSON.stringify(result,null,2));
if(!result.readyForLiveAttempt)process.exitCode=2;
