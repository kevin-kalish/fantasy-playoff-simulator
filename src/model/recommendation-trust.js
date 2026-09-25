const LARGE_WARNING_CODES=new Set(['LARGE_CHAMPIONSHIP_DELTA','LARGE_PLAYOFF_DELTA']);

const unique=a=>[...new Set((a||[]).filter(x=>x!=null).map(String))];

function affectedPlayers(r){
 const d=r.details||{};
 if(r.type==='waiver')return unique([d.addPlayerId,d.dropPlayerId]);
 if(r.type==='start-sit')return unique([d.startPlayerId,d.sitPlayerId]);
 if(r.type==='trade')return unique([...(d.trade?.teamAGives||[]),...(d.trade?.teamBGives||[])]);
 return [];
}

export function classifyRecommendationTrust(recommendation){
 const confirmation=recommendation.confirmation;
 const warnings=recommendation.validation?.warnings||[];
 const sanityWarnings=warnings.filter(w=>LARGE_WARNING_CODES.has(w.code));
 let simulationConfidence='preview';
 let status='PREVIEW';
 if(confirmation){
  const stability=confirmation.stability?.confidence;
  const complete=confirmation.samples?.length===confirmation.seeds?.length&&confirmation.samples?.length>0;
  if(!complete||!confirmation.directionConsistent||stability==='low'||stability==='insufficient'||stability==='unknown'){
   simulationConfidence='low';status='LOW_CONFIDENCE';
  }else if(stability==='high'){
   simulationConfidence='high';status='CONFIRMED_HIGH';
  }else if(stability==='moderate'){
   simulationConfidence='moderate';status='CONFIRMED_MODERATE';
  }
 }
 if(recommendation.validation?.confidence==='low'&&!confirmation){simulationConfidence='low';status='LOW_CONFIDENCE';}
 return {status,simulationConfidence,inputSanity:sanityWarnings.length?'review':'normal',sanityWarnings};
}

export function buildRecommendationProvenance(recommendation,{input={},spec={},confirmationOptions={}}={}){
 const c=recommendation.confirmation;
 return {
  recommendationType:recommendation.type,
  affectedPlayerIds:affectedPlayers(recommendation),
  teamId:spec.teamId??recommendation.details?.teamId??recommendation.details?.result?.teamId??null,
  week:spec.week??null,
  weeks:unique(recommendation.details?.result?.transaction?.weeks??recommendation.details?.trade?.weeks??spec.waivers?.weeks??[spec.week]),
  projectionSource:spec.projectionSource??input.metadata?.projectionSource??input.metadata?.source?.provider??null,
  modelVariant:input.modelVariant??null,
  preview:{simulations:Number(input.simulations)||0,seed:input.seed??null},
  confirmation:c?{simulationsPerSeed:c.simulationsPerSeed,seeds:[...(c.seeds||[])],totalSimulations:(Number(c.simulationsPerSeed)||0)*(c.seeds?.length||0)}:null,
  generatedFrom:'paired-scenario-simulation'
 };
}

export function finalizeRecommendationTrust(recommendation,context={}){
 const trust=classifyRecommendationTrust(recommendation);
 return {...recommendation,trust,provenance:buildRecommendationProvenance(recommendation,context)};
}
