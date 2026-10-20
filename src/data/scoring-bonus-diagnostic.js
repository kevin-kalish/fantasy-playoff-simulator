import {scoreOffense} from '../scoring.js';
const cases=[
 {name:'passing 299 yards',stats:{passYds:299}},
 {name:'passing 300 yards',stats:{passYds:300}},
 {name:'passing 400 yards',stats:{passYds:400}},
 {name:'rushing 99 yards',stats:{rushYds:99}},
 {name:'rushing 100 yards',stats:{rushYds:100}},
 {name:'rushing 200 yards',stats:{rushYds:200}},
 {name:'receiving 99 yards',stats:{recYds:99}},
 {name:'receiving 100 yards',stats:{recYds:100}},
 {name:'receiving 200 yards',stats:{recYds:200}}
];
export function scoringBonusDiagnostic(){
 const results=cases.map(({name,stats})=>{
  const modelPoints=scoreOffense(stats);
  const basePoints=(stats.passYds||0)*0.04+(stats.rushYds||0)*0.1+(stats.recYds||0)*0.1;
  return {name,modelPoints,basePoints,bonusPoints:Number((modelPoints-basePoints).toFixed(8))};
 });
 return {schemaVersion:1,verified:false,results,note:'Base points use captured yardage rates; bonus points are model behavior, not independently confirmed Yahoo settings. No model changes made.'};
}
