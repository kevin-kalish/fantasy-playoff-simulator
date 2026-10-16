// Local-only private beta dashboard. No remote binding, static file serving, or public data endpoint.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {randomBytes,timingSafeEqual} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {buildPrivatePreview} from './build-private-dashboard-preview.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const privateDir=path.join(root,'data','private');
const renderer=fs.readFileSync(path.join(root,'src/ui/live-dashboard-v1.js'),'utf8');
const reportName=/^fightin-kali-week-(\d+)-report\.json$/;
export function latestReport(){
 const names=fs.existsSync(privateDir)?fs.readdirSync(privateDir).filter(x=>reportName.test(x)):[];
 const selected=names.map(name=>({name,week:Number(name.match(reportName)[1]),mtime:fs.statSync(path.join(privateDir,name)).mtimeMs})).sort((a,b)=>b.mtime-a.mtime)[0];
 if(!selected)throw Error('No private weekly report. Run npm run fightin-kali:weekly first.');
 return JSON.parse(fs.readFileSync(path.join(privateDir,selected.name),'utf8'));
}
export function makeLocalDashboardHandler({token,loadReport=latestReport}){
 return (req,res)=>{
  const fail=(code,message)=>{res.writeHead(code,{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(message)};
  const host=String(req.headers.host??'');
  if(!/^127\.0\.0\.1(?::\d+)?$/.test(host))return fail(403,'Loopback host required');
  const url=new URL(req.url??'/', 'http://127.0.0.1');
  if(req.method!=='GET'||url.pathname!=='/')return fail(404,'Not found');
  const supplied=url.searchParams.get('token')??'';
  const a=Buffer.from(supplied),b=Buffer.from(token);
  if(a.length!==b.length||!timingSafeEqual(a,b))return fail(403,'Invalid private session');
  try{
   const html=buildPrivatePreview(loadReport(),renderer);
   // The preview has an offline CSP; no external connections are permitted.
   res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Pragma':'no-cache','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY'});
   res.end(html);
  }catch(error){fail(503,'Private report unavailable or not ready; run the Yahoo weekly refresh in PowerShell.')}
 };
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const token=randomBytes(32).toString('hex');
 const server=http.createServer(makeLocalDashboardHandler({token}));
 server.listen(0,'127.0.0.1',()=>{
  const port=server.address().port;
  console.log('PRIVATE LOCAL DASHBOARD (read-only): http://127.0.0.1:'+port+'/?token='+token);
  console.log('Open this address only on this computer. Ctrl+C stops the service. Never share the session URL.');
 });
}
