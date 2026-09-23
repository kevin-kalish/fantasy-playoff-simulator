import {ingestHistoricalRows} from './historical.js';
export class HistoricalDataAdapter{
  constructor({id,label,version='1'}={}){if(!id)throw new Error('adapter id required');this.id=id;this.label=label||id;this.version=version}
  normalize(){throw new Error('normalize() must be implemented by provider adapter')}
  ingest(rawRows=[]){return ingestHistoricalRows(rawRows.map((row,index)=>this.normalize(row,index)))}
  metadata(){return{id:this.id,label:this.label,version:this.version}}
}
export class ColumnMapAdapter extends HistoricalDataAdapter{
  constructor({id='column-map',label='Column mapped import',version='1',columns={},defaults={}}={}){super({id,label,version});this.columns=columns;this.defaults=defaults}
  normalize(raw={}){const get=(canonical)=>{const source=this.columns[canonical];return source==null?this.defaults[canonical]:raw[source]??this.defaults[canonical]};return{season:get('season'),week:get('week'),playerId:get('playerId'),name:get('name'),position:get('position'),nflTeam:get('nflTeam'),opponent:get('opponent'),projection:get('projection'),actual:get('actual'),cv:get('cv'),status:get('status'),source:get('source')||this.id,projectionTimestamp:get('projectionTimestamp')}}
}
export function createCanonicalAdapter(){return new ColumnMapAdapter({id:'canonical',label:'Canonical historical import',columns:{season:'season',week:'week',playerId:'playerId',name:'name',position:'position',nflTeam:'nflTeam',opponent:'opponent',projection:'projection',actual:'actual',cv:'cv',status:'status',source:'source',projectionTimestamp:'projectionTimestamp'}})}
