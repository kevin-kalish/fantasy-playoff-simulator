import {parseCSV} from './csv.js';
import {fetchNflverseCSV} from './nflverse-source.js';
import {importNflverseActuals} from './nflverse-import.js';
import {importNflverseDST} from './nflverse-dst.js';
export async function loadNflverseSeason(season,{fetchImpl=fetch,includeDST=true}={}){const playerDownload=await fetchNflverseCSV('player',season,{fetchImpl}),playerRaw=parseCSV(playerDownload.text),players=importNflverseActuals(playerRaw).rows;let dst=[];let teamURL=null;if(includeDST){const teamDownload=await fetchNflverseCSV('team',season,{fetchImpl});teamURL=teamDownload.url;dst=importNflverseDST(parseCSV(teamDownload.text))}return{season:Number(season),rows:[...players,...dst],players,dst,provenance:{playerURL:playerDownload.url,teamURL,playerRows:players.length,dstRows:dst.length}}}
export async function loadNflverseHistory(seasons,opts={}){const loaded=[];for(const season of seasons)loaded.push(await loadNflverseSeason(season,opts));return{seasons:loaded.map(x=>x.season),rows:loaded.flatMap(x=>x.rows),provenance:loaded.map(x=>x.provenance)}}
