export const STATUS_PLAY_PROBABILITY={ACTIVE:1,PROBABLE:.95,QUESTIONABLE:.72,DOUBTFUL:.20,OUT:0,IR:0,SUSPENDED:0,BYE:0};
export function playProbability(player,override=null){if(override!=null)return Math.max(0,Math.min(1,override));return STATUS_PLAY_PROBABILITY[String(player?.status||'ACTIVE').toUpperCase()]??1}
export function availableThisWeek(player,week,rng=Math.random){if(player?.byeWeek===week)return false;return rng()<playProbability(player)}
export function injuryAdjustedProjection(projection,player){return Number(projection||0)*playProbability(player)}
