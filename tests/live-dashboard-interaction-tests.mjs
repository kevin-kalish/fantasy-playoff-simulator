import assert from 'node:assert/strict';
import {renderDashboardV1} from '../src/ui/live-dashboard-v1.js';

// Deterministic delegated-event interaction tests; no network or browser needed.
const elements=new Map();
const element=id=>{
 if(!elements.has(id))elements.set(id,{
  innerHTML:'',hidden:false,attributes:{},
  setAttribute(name,value){this.attributes[name]=value;},
  getAttribute(name){return this.attributes[name];}
 });
 return elements.get(id);
};
const buttons=['chronological','impact'].map(order=>({
 attributes:{'data-schedule-order':order},
 setAttribute(name,value){this.attributes[name]=value;},
 getAttribute(name){return this.attributes[name];}
}));
const root={
 innerHTML:'',
 querySelector(selector){return element(selector);},
 querySelectorAll(selector){return selector==='[data-schedule-order]'?buttons:[];}
};
const teams=[
 {id:'A',name:'Alpha',record:{wins:4,losses:2,ties:0},currentSeed:1,averageWins:8,playoffProbability:.8,championshipProbability:.2,seedDistribution:[]},
 {id:'B',name:'Bravo',record:{wins:3,losses:3,ties:0},currentSeed:2,averageWins:7,playoffProbability:.6,championshipProbability:.1,seedDistribution:[]}
];
const game=(week,opponentName,swing)=>({week,opponentName,winProbability:.5,projectionSource:'derived',simulations:1000,playoffImpact:{swing,simulations:1000}});
renderDashboardV1(root,{
 schemaVersion:1,mode:'live',generatedAt:'2026-10-14T12:00:00Z',
 league:{userTeamId:'A'},model:{simulations:1000,championshipStatus:'provisional',directWeeks:[],derivedWeeks:[]},
 teams,remainingSchedule:[game(7,'First opponent',.05),game(8,'Second opponent',.3)],
 playoffHistory:[{week:0,probability:.8,result:null},{week:1,probability:.6,result:'L'}]
});
const eventTarget=(selector,attributes)=>({
 closest(query){return query===selector?{getAttribute(name){return attributes[name];}}:null;}
});
assert.equal(element('#dashboard-history').hidden,false===true);
root.onclick({target:eventTarget('[data-dashboard-tab]',{'data-dashboard-tab':'history'})});
assert.equal(element('#dashboard-history').hidden,false);
assert.equal(element('#dashboard-overview').hidden,true);
assert.equal(element('#tab-history').attributes['aria-selected'],'true');
assert.equal(element('#tab-overview').attributes['aria-selected'],'false');
root.onclick({target:eventTarget('[data-dashboard-tab]',{'data-dashboard-tab':'overview'})});
assert.equal(element('#dashboard-history').hidden,true);
assert.equal(element('#dashboard-overview').hidden,false);

root.onclick({target:eventTarget('[data-schedule-order]',{'data-schedule-order':'impact'})});
assert.ok(element('#dashboard-schedule-games').innerHTML.indexOf('Second opponent')<element('#dashboard-schedule-games').innerHTML.indexOf('First opponent'));
assert.equal(buttons[1].attributes['aria-pressed'],'true');
assert.equal(buttons[0].attributes['aria-pressed'],'false');
root.onclick({target:eventTarget('[data-schedule-order]',{'data-schedule-order':'chronological'})});
assert.ok(element('#dashboard-schedule-games').innerHTML.indexOf('First opponent')<element('#dashboard-schedule-games').innerHTML.indexOf('Second opponent'));

root.onclick({target:eventTarget('[data-team-id]',{'data-team-id':'B'})});
assert.match(element('#dashboard-team-detail').innerHTML,/Bravo/);
assert.match(element('#dashboard-team-detail').innerHTML,/60.0%/);
let prevented=false,clicked=false;
root.onkeydown({key:'Enter',target:{closest(selector){return selector==='[data-team-id]'?{click(){clicked=true;}}:null;}},preventDefault(){prevented=true;}});
assert.equal(prevented,true);
assert.equal(clicked,true);

const marker=eventTarget('[data-history-tooltip]',{'data-history-tooltip':'Week 1: 60.0% · Loss · -20.0 pp'});
root.onmouseover({target:marker});
assert.equal(element('#dashboard-history-tooltip').textContent,'Week 1: 60.0% · Loss · -20.0 pp');
root.onmouseout({target:marker,relatedTarget:null});
assert.match(element('#dashboard-history-tooltip').textContent,/Hover over or focus a point/);
root.onfocusin({target:marker});
assert.match(element('#dashboard-history-tooltip').textContent,/Week 1: 60.0%/);
root.onfocusout({target:marker,relatedTarget:null});
assert.match(element('#dashboard-history-tooltip').textContent,/Hover over or focus a point/);
console.log('live-dashboard-interaction-tests: all checks passed');
