import fs from 'node:fs';
import path from 'node:path';
import {createYahooClient} from '../src/data/yahoo-client.js';
import {resolveYahooAccessToken} from '../src/data/yahoo-auth-session.js';
import {extractYahooScoringSettings} from '../src/data/yahoo-scoring-settings.js';
const leagueKey=process.env.YAHOO_LEAGUE_KEY||'470.l.244897';
const season=Number(process.env.SEASON||2026);
const output=process.env.YAHOO_SCORING_OUT||'data/private/yahoo-scoring-settings.json';
try{
 const auth=await resolveYahooAccessToken();
 if(!auth.accessToken)throw new Error('Yahoo access token unavailable');
 const get=createYahooClient({accessToken:auth.accessToken});
 const response=await get('league/'+leagueKey+'/settings');
 const report=extractYahooScoringSettings(response,{leagueKey,season});
 if(!report.valid){console.error('YAHOO SCORING: BLOCKED '+report.errors.join(', '));process.exitCode=2;}
 else{
  fs.mkdirSync(path.dirname(output),{recursive:true});
  fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n',{mode:0o600});
  console.log('YAHOO SCORING: EXTRACTED '+report.scoringRules.length+' modifiers; fingerprint '+report.fingerprint+'; model verification PENDING; saved '+output);
 }
}catch(error){console.error('YAHOO SCORING: ERROR '+error.message);process.exitCode=1;}
