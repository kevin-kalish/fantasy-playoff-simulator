export function createDashboardState(initialTeamId){
  let state={selectedTeamId:initialTeamId,selectedWeek:null,forced:{}};
  const listeners=new Set();
  const emit=()=>listeners.forEach(fn=>fn({...state,forced:{...state.forced}}));
  return{
    get:()=>({...state,forced:{...state.forced}}),
    selectTeam(id){state={selectedTeamId:id,selectedWeek:null,forced:{}};emit()},
    selectWeek(week){state={...state,selectedWeek:Number(week)};emit()},
    setPick(key,winner){state={...state,forced:{...state.forced,[key]:winner}};emit()},
    clearPicks(){state={...state,forced:{}};emit()},
    subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn)}
  };
}
