// Append an independently labeled historical-report comparison to a COPY of a saved private dashboard.
// Never change the immutable archive or the original HTML.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {compareHistoricalReports} from './compare-private-historical-reports.mjs';

const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function appendHistoricalComparison(html,rows){
 if(typeof html!=='string'||!/<\/body>/i.test(html))throw Error('Saved dashboard HTML is missing a closing body');
 if(html.includes('id="historical-report-comparison"'))throw Error('Comparison already present; use the original saved HTML');
 if(!Array.isArray(rows)||rows.length<1)throw Error('No validated comparison points');
 const table=rows.map(p=>'<tr><td>Report week '+p.week+'</td><td>'+escapeHtml(p.generatedAt)+'</td><td>'+(100*p.playoffProbability).toFixed(1)+'%</td></tr>').join('');
 const section='<section id="historical-report-comparison" aria-labelledby="historical-comparison-heading" style="margin:2rem auto;padding:1.25rem;max-width:1100px;border:2px solid #526174;border-radius:10px;background:white;color:#192436"><h2 id="historical-comparison-heading">Historical saved-report comparison (not the pregame history archive)</h2><p>These are dated probabilities from separate saved, readiness-passing reports. They are not certified immutable pregame snapshots, and are not current forecasts. The original dashboard results above are unchanged.</p><div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse"><thead><tr><th>Report</th><th>Generated (UTC)</th><th>Playoff probability</th></tr></thead><tbody>'+table+'</tbody></table></div><p>Legacy reports without comparable outlook fields are excluded. No schedule-impact estimates were reconstructed.</p></section>';
 return html.replace(/<\/body>/i,section+'</body>');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
 const privateDir=path.join(root,'data','private');
 const input=path.resolve(process.argv[2]??path.join(privateDir,'live-dashboard-preview.html'));
 const output=path.resolve(process.argv[3]??path.join(privateDir,'live-dashboard-with-comparison.html'));
 const inside=p=>p.startsWith(privateDir+path.sep);
 if(!inside(input)||!inside(output)||input===output)throw Error('Input/output must be different private HTML paths');
 if(!fs.existsSync(input))throw Error('Original saved dashboard not found');
 if(fs.existsSync(output))throw Error('Output already exists; refusing to overwrite');
 const files=fs.readdirSync(privateDir).filter(n=>/^fightin-kali-week-\d+-report\.json$/.test(n));
 const documents=files.map(name=>({week:Number(name.match(/week-(\d+)/)[1]),document:JSON.parse(fs.readFileSync(path.join(privateDir,name),'utf8'))}));
 const rows=compareHistoricalReports(documents);
 const html=appendHistoricalComparison(fs.readFileSync(input,'utf8'),rows);
 fs.writeFileSync(output,html,{flag:'wx',mode:0o600});
 console.log('PRIVATE DASHBOARD WITH HISTORICAL COMPARISON: '+output);
 console.log('Source HTML unchanged; '+rows.length+' validated historical points; '+rows.excluded.length+' legacy reports excluded.');
}
