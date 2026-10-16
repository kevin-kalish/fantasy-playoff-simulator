// Local-only private beta dashboard. No remote binding, static file serving, or public data endpoint.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {randomBytes,timingSafeEqual} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {buildPrivatePreview} from './build-private-dashboard-preview.mjs';
import {createRefreshController} from './private-dashboard-refresh.mjs';
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
export function makeLocalDashboardHandler({token,loadReport=latestReport,controller=createRefreshController()}){
 return (req,res)=>{
  const headers={'Cache-Control':'no-store','Pragma':'no-cache','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY'};
  const send=(code,type,body)=>{res.writeHead(code,{...headers,'Content-Type':type});res.end(body)};
  const fail=(code,message)=>send(code,'text/plain; charset=utf-8',message);
  const host=String(req.headers.host??'');
  if(!/^127\.0\.0\.1(?::\d+)?$/.test(host))return fail(403,'Loopback host required');
  let url;try{url=new URL(req.url??'/', 'http://127.0.0.1')}catch{return fail(400,'Invalid URL')}
  const supplied=req.headers['x-private-session']??url.searchParams.get('token')??'';
  if(typeof supplied!=='string')return fail(403,'Invalid private session');
  const a=Buffer.from(supplied),b=Buffer.from(token);
  if(a.length!==b.length||!timingSafeEqual(a,b))return fail(403,'Invalid private session');
  if(url.pathname==='/status'&&req.method==='GET')return send(200,'application/json; charset=utf-8',JSON.stringify(controller.status()));
  if(url.pathname==='/refresh'&&req.method==='POST'){
   // Exact same-origin check plus custom header prevent cross-site form/CSRF.
   const origin=String(req.headers.origin??'');
   if(origin!=='http://'+host||req.headers['x-private-session']!==token)return fail(403,'Same-origin session required');
   if(req.headers['content-length']&&Number(req.headers['content-length'])>0)return fail(413,'No request body allowed');
   const accepted=controller.refresh();
   return send(accepted?202:409,'application/json; charset=utf-8',JSON.stringify(controller.status()));
  }
  if(req.method!=='GET'||url.pathname!=='/')return fail(404,'Not found');
  try{
   let html=buildPrivatePreview(loadReport(),renderer);
   const controls=`<section id="private-controls" style="padding:12px;border:1px solid #c8d3e2;border-radius:8px;margin-bottom:14px"><button id="refresh-yahoo" type="button">Refresh Yahoo data</button> <span id="refresh-status" role="status" aria-live="polite">Ready</span><p style="font-size:12px">Private localhost only. Refresh can take a minute or more. Do not share this URL.</p></section>`;
   const script=`<script>(function(){
    const token=new URLSearchParams(location.search).get('token');
    const button=document.getElementById('refresh-yahoo'),label=document.getElementById('refresh-status');
    async function status(){
     try{
      const r=await fetch('/status',{headers:{'x-private-session':token},cache:'no-store'});
      if(!r.ok)throw Error('Status unavailable');
      const s=await r.json();button.disabled=s.phase==='running';
      label.textContent=s.phase==='running'?'Refreshing Yahoo data…':s.phase==='succeeded'?'Refresh complete. Reloading…':s.phase==='failed'?(s.error||'Refresh failed'):'Ready';
      if(s.phase==='succeeded'&&window.__refreshStarted)location.reload();
      if(s.phase==='running'||window.__refreshStarted&&s.phase==='running')setTimeout(status,2000);
     }catch{label.textContent='Unable to check refresh status';button.disabled=false}
    }
    button.addEventListener('click',async()=>{
     button.disabled=true;label.textContent='Starting refresh…';window.__refreshStarted=true;
     try{
      const r=await fetch('/refresh',{method:'POST',headers:{'x-private-session':token},cache:'no-store'});
      if(r.status!==202&&r.status!==409)throw Error('Refresh request rejected');
      status();
     }catch{label.textContent='Unable to start refresh';button.disabled=false;window.__refreshStarted=false}
    });
    status();
   })();</script>`;
   html=html.replace('<main id="dashboard"></main>',controls+'<main id="dashboard"></main>');
   html=html.replace("connect-src 'none'","connect-src 'self'");
   html=html.replace('</body></html>',script+'</body></html>');
   return send(200,'text/html; charset=utf-8',html);
  }catch{return fail(503,'Private report unavailable or not ready; run the Yahoo weekly refresh in PowerShell.')}
 };
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const token=randomBytes(32).toString('hex');
 const server=http.createServer(makeLocalDashboardHandler({token}));
 server.listen(0,'127.0.0.1',()=>{
  const port=server.address().port;
  console.log('PRIVATE LOCAL DASHBOARD (Yahoo refresh enabled): http://127.0.0.1:'+port+'/?token='+token);
  console.log('Open this address only on this computer. Ctrl+C stops the service. Never share the session URL.');
 });
}
