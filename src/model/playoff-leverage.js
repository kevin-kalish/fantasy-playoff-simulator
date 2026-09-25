const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const abs=x=>Math.abs(Number(x)||0);

export function buildPlayoffLeverageIntelligence({outlook,matchup,currentSeed,playoffSpots,week,playoffWeeks=[]}={}){
 if(!outlook||!matchup)return null;
 const p=Number(outlook.playoffProbability||0),c=Number(outlook.championshipProbability||0);
 const win=matchup.impact?.win,loss=matchup.impact?.loss;
 if(!win||!loss)return null;
 const playoffSwing=Number(win.playoffProbability||0)-Number(loss.playoffProbability||0);
 const championshipSwing=Number(win.championshipProbability||0)-Number(loss.championshipProbability||0);
 const winsSwing=Number(win.averageWins||0)-Number(loss.averageWins||0);
 const firstPlayoffWeek=Math.min(...(playoffWeeks.length?playoffWeeks:[99]));
 const weeksUntilPlayoffs=Math.max(0,firstPlayoffWeek-Number(week||0));
 const bubbleDistance=Number(currentSeed||99)-Number(playoffSpots||0);
 const leverageScore=clamp(playoffSwing*.65+championshipSwing*.25+Math.min(abs(winsSwing),1)*.10);
 let urgency='LOW';
 if(leverageScore>=.20||playoffSwing>=.25)urgency='CRITICAL';
 else if(leverageScore>=.12||playoffSwing>=.15)urgency='HIGH';
 else if(leverageScore>=.06||playoffSwing>=.08)urgency='MODERATE';
 let posture='BALANCED';
 if(p<.45||bubbleDistance>0)posture='UPSIDE';
 else if(p>=.80&&currentSeed<=playoffSpots)posture='FLOOR';
 if(weeksUntilPlayoffs<=2&&p<.70)posture='UPSIDE';
 return {urgency,leverageScore,posture,weeksUntilPlayoffs,bubbleDistance,playoffSwing,championshipSwing,winsSwing,playoffProbability:p,championshipProbability:c,reason:posture==='UPSIDE'?'Prioritize moves with meaningful ceiling because playoff qualification or seeding remains sensitive to near-term results.':posture==='FLOOR'?'Prioritize reliable weekly scoring and downside protection because the team currently has a strong playoff position.':'Balance floor and ceiling; the current playoff position does not justify an extreme risk posture.'};
}
