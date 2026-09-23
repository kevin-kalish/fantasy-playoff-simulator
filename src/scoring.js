export function scoreOffense(s = {}) {
  const passYds=s.passYds||0, rushYds=s.rushYds||0, recYds=s.recYds||0;
  let pts = passYds/25 + (s.passTD||0)*4 - (s.interceptions||0)
    + rushYds/10 + (s.rushTD||0)*6
    + (s.receptions||0)*0.5 + recYds/10 + (s.recTD||0)*6
    + (s.returnTD||0)*6 + (s.twoPoint||0)*2 - (s.fumblesLost||0)*2
    + (s.offensiveFumbleReturnTD||0)*6;
  if (passYds >= 300) pts += 5;
  if (passYds >= 400) pts += 10;
  if (rushYds >= 100) pts += 5;
  if (rushYds >= 200) pts += 10;
  if (recYds >= 100) pts += 5;
  if (recYds >= 200) pts += 10;
  return pts;
}

export function scoreKicker(s = {}) {
  return (s.fg0_19||0)*3 + (s.fg20_29||0)*3 + (s.fg30_39||0)*3 +
    (s.fg40_49||0)*4 + (s.fg50plus||0)*5 + (s.xpMade||0);
}

export function scoreDefense(s = {}) {
  const pa=s.pointsAllowed ?? 21;
  let paPts=0;
  if (pa===0) paPts=10; else if (pa<=6) paPts=7; else if (pa<=13) paPts=4;
  else if (pa<=20) paPts=1; else if (pa<=27) paPts=0; else if (pa<=34) paPts=-1; else paPts=-4;
  return (s.sacks||0) + (s.interceptions||0)*2 + (s.fumbleRecoveries||0)*2 +
    (s.touchdowns||0)*6 + (s.safeties||0)*2 + (s.blockedKicks||0)*2 +
    (s.returnTD||0)*6 + (s.extraPointReturned||0)*2 + paPts;
}
