const issue=(code,message,details={})=>({code,message,...details});

export function assessSimulationTrust(input,{audit=null,requireAudit=false,dataQuality=null}={}){
 const errors=[],warnings=[];
 const provider=input?.metadata?.source?.provider??null;
 const yahoo=String(provider||'').toLowerCase()==='yahoo';
 if(dataQuality&&dataQuality.passed===false)errors.push(issue('DATA_QUALITY_BLOCKED','Simulation data quality checks failed.',{blockingCodes:dataQuality.blockingCodes||[]}));
 if(requireAudit||yahoo){
  if(!audit)errors.push(issue('MISSING_SOURCE_AUDIT','A successful source reconciliation audit is required before trusted simulation results can be produced.',{provider}));
  else if(audit.passed!==true)errors.push(issue('SOURCE_AUDIT_FAILED','Source reconciliation audit failed.',{provider,failures:audit.failures||[]}));
 }
 if(!input?.metadata?.rosterProjectionCoverage&&!input?.metadata?.projectionCoverage)warnings.push(issue('MISSING_PROJECTION_DIAGNOSTICS','Projection coverage diagnostics are missing.'));
 const trusted=errors.length===0;
 return {trusted,status:trusted?(warnings.length?'TRUSTED_WITH_WARNINGS':'TRUSTED'):'BLOCKED',errors,warnings,provider,auditRequired:Boolean(requireAudit||yahoo),auditPassed:audit?.passed===true};
}

export function requireSimulationTrust(input,options={}){
 const trust=assessSimulationTrust(input,options);
 if(!trust.trusted){const error=new Error(`Simulation trust gate blocked execution: ${trust.errors.map(x=>x.code).join(', ')}`);error.code='SIMULATION_TRUST_BLOCKED';error.trust=trust;throw error;}
 return trust;
}
