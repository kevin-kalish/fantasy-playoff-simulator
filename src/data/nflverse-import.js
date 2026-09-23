import {NflverseActualsAdapter} from './nflverse.js';
import {joinProjectionActuals} from './join.js';
import {assessDatasetReadiness} from './readiness.js';

export const NFLVERSE_FANTASY_POSITIONS=new Set(['QB','RB','WR','TE','K']);

export function importNflverseActuals(rawRows,{regularSeasonOnly=true,fantasyPositionsOnly=true}={}){
 const seasonRows=regularSeasonOnly?rawRows.filter(r=>!r.season_type||String(r.season_type).toUpperCase()==='REG'):rawRows;
 const filtered=fantasyPositionsOnly?seasonRows.filter(r=>NFLVERSE_FANTASY_POSITIONS.has(String(r.position||'').toUpperCase())):seasonRows;
 const adapter=new NflverseActualsAdapter(),rows=filtered.map(r=>adapter.normalize(r));
 return{rows,metadata:adapter.metadata(),summary:{input:rawRows.length,accepted:rows.length,filtered:rawRows.length-rows.length}};
}
export function buildNflverseBacktestDataset({projections,nflverseRows,readiness={}}){const actuals=importNflverseActuals(nflverseRows).rows,joined=joinProjectionActuals(projections,actuals),quality=assessDatasetReadiness(joined.rows,{reconciliation:joined.reconciliation,...readiness});return{rows:joined.rows,reconciliation:joined.reconciliation,readiness:quality}}
