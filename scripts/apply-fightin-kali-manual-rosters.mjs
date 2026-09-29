import fs from 'node:fs';

const inputPath = process.argv[2] ?? 'data/private/fightin-kali-capture.json';
const outputPath = process.argv[3] ?? inputPath;

const p = (name, position, nflTeam, lineupSlot, status) => ({
  name, position, nflTeam, lineupSlot, ...(status ? { status } : {})
});

const rosters = {
  'The Fightin’ Kali': [
    p('Drake Maye','QB','NE','QB'), p('Bijan Robinson','RB','ATL','RB'), p('David Montgomery','RB','HOU','RB'),
    p('George Pickens','WR','DAL','WR'), p('Matthew Golden','WR','GB','WR'), p('Brock Bowers','TE','LV','TE'),
    p('TreVeyon Henderson','RB','NE','W/R/T'), p('Emeka Egbuka','WR','TB','BN'), p('Jake Ferguson','TE','DAL','BN'),
    p('Stefon Diggs','WR','WAS','BN'), p('J.K. Dobbins','RB','DEN','BN'), p('Baker Mayfield','QB','TB','BN'),
    p('Kaelon Black','RB','SF','BN'), p('Isiah Pacheco','RB','DET','IR','IR'), p('Brandon Aubrey','K','DAL','K'), p('Texans','DEF','HOU','DEF')
  ],
  'AI Generated Slop': [
    p('Justin Herbert','QB','LAC','QB'), p('Derrick Henry','RB','BAL','RB'), p('Quinshon Judkins','RB','CLE','RB'),
    p('Ladd McConkey','WR','LAC','WR'), p('Jaylen Waddle','WR','DEN','WR'), p('Trey McBride','TE','ARI','TE'),
    p('Denzel Boston','WR','CLE','W/R/T'), p('Jaylen Warren','RB','PIT','BN'), p('Puka Nacua','WR','LAR','BN'),
    p('Chris Godwin','WR','TB','BN'), p('Kyler Murray','QB','MIN','BN'), p('KC Concepcion Jr.','WR','CLE','BN'),
    p('Josh Jacobs','RB','GB','BN'), p('Andy Borregales','K','NE','K'), p('Rams','DEF','LAR','DEF')
  ],
  'AiLi’s Football Guys': [
    p('Jalen Hurts','QB','PHI','QB'), p('Saquon Barkley','RB','PHI','RB'), p('Kenneth Walker III','RB','KC','RB'),
    p('Tee Higgins','WR','CIN','WR'), p('Terry McLaurin','WR','WAS','WR'), p('Kyle Pitts Sr.','TE','ATL','TE'),
    p('Javonte Williams','RB','DAL','W/R/T'), p('Christian Watson','WR','GB','BN'), p('Dak Prescott','QB','DAL','BN'),
    p('Chuba Hubbard','RB','CAR','BN'), p("De'Zhaun Stribling",'WR','SF','BN'), p('Isaiah Likely','TE','NYG','BN'),
    p('Kenny Gainwell','RB','TB','BN'), p('Cairo Santos','K','CHI','K'), p('Seahawks','DEF','SEA','DEF')
  ],
  'Bens Big Boys': [
    p('Brock Purdy','QB','SF','QB'), p('Christian McCaffrey','RB','SF','RB'), p('Chase Brown','RB','CIN','RB'),
    p('Zay Flowers','WR','BAL','WR'), p('Mike Evans','WR','SF','WR'), p('Tucker Kraft','TE','GB','TE'),
    p('Ashton Jeanty','RB','LV','W/R/T'), p('Luther Burden III','WR','CHI','BN'), p('Daniel Jones','QB','IND','BN'),
    p('Jonathon Brooks','RB','CAR','BN'), p('Michael Wilson','WR','ARI','BN'), p('Mark Andrews','TE','BAL','BN'),
    p('Michael Pittman Jr.','WR','IND','BN'), p('Tyler Loop','K','BAL','K'), p('Ravens','DEF','BAL','DEF')
  ],
  'Captain Marrvelous': [
    p('Jared Goff','QB','DET','QB'), p('Kyren Williams','RB','LAR','RB'), p('Bucky Irving','RB','TB','RB'),
    p("Ja'Marr Chase",'WR','CIN','WR'), p('Davante Adams','WR','LAR','WR'), p('Travis Kelce','TE','KC','TE'),
    p('Cam Skattebo','RB','NYG','W/R/T'), p('Tyler Warren','TE','IND','BN'), p('Matthew Stafford','QB','LAR','BN'),
    p('Jalen McMillan','WR','TB','BN'), p('Jordan Addison','WR','MIN','BN'), p('Makai Lemon','WR','PHI','BN'),
    p('Nico Collins','WR','HOU','IR','IR'), p('Jake Bates','K','DET','K'), p('Vikings','DEF','MIN','DEF')
  ],
  'End zone Em-pire': [
    p('Patrick Mahomes','QB','KC','QB'), p('Aaron Jones Sr.','RB','MIN','RB'), p('Travis Etienne Jr.','RB','NO','RB'),
    p('Jaxon Smith-Njigba','WR','SEA','WR'), p('Justin Jefferson','WR','MIN','WR'), p('Dalton Kincaid','TE','BUF','TE'),
    p('Tetairoa McMillan','WR','CAR','W/R/T'), p('Jeremiyah Love','RB','ARI','BN'), p('Jadarian Price','RB','SEA','BN'),
    p('Caleb Williams','QB','CHI','BN'), p('Hunter Henry','TE','NE','BN'), p('Romeo Doubs','WR','NE','BN'),
    p('Dontayvion Wicks','WR','PHI','BN'), p('Rico Dowdle','RB','PIT','IR','IR'), p('Alec Pierce','WR','IND','IR','IR'),
    p('Evan McPherson','K','CIN','K'), p('Lions','DEF','DET','DEF')
  ],
  "James's Great Team": [
    p('Joe Burrow','QB','CIN','QB'), p('James Cook III','RB','BUF','RB'), p('Breece Hall','RB','NYJ','RB'),
    p('CeeDee Lamb','WR','DAL','WR'), p('Chris Olave','WR','NO','WR'), p('Harold Fannin Jr.','TE','CLE','TE'),
    p('DJ Moore','WR','BUF','W/R/T'), p('Parker Washington','WR','JAX','BN'), p('Tony Pollard','RB','TEN','BN'),
    p('Josh Downs','WR','IND','BN'), p('Bo Nix','QB','DEN','BN'), p('Juwan Johnson','TE','NO','BN'),
    p("Wan'Dale Robinson",'WR','TEN','BN'), p("Ka'imi Fairbairn",'K','HOU','K'), p('Steelers','DEF','PIT','DEF')
  ],
  'Shambala': [
    p('Josh Allen','QB','BUF','QB'), p('Omarion Hampton','RB','LAC','RB'), p("D'Andre Swift",'RB','CHI','RB'),
    p('Amon-Ra St. Brown','WR','DET','WR'), p('DeVonta Smith','WR','PHI','WR'), p('George Kittle','TE','SF','TE'),
    p('Jalen Coker','WR','CAR','W/R/T'), p('Jameson Williams','WR','DET','BN'), p('Bhayshul Tuten','RB','JAX','BN'),
    p('Quentin Johnston','WR','LAC','BN'), p('Mike Gesicki','TE','CIN','BN'), p('Bryce Young','QB','CAR','BN'),
    p('Jayden Reed','WR','GB','IR','IR'), p('Will Reichard','K','MIN','K'), p('Eagles','DEF','PHI','DEF')
  ],
  'The Desmond Diamonds': [
    p('Lamar Jackson','QB','BAL','QB'), p('Jahmyr Gibbs','RB','DET','RB'), p('Rhamondre Stevenson','RB','NE','RB'),
    p('Drake London','WR','ATL','WR'), p('DK Metcalf','WR','PIT','WR'), p('Colston Loveland','TE','CHI','TE'),
    p('Rome Odunze','WR','CHI','W/R/T'), p('Dallas Goedert','TE','PHI','BN'), p('Brian Thomas Jr.','WR','JAX','BN'),
    p('Jordan Mason','RB','MIN','BN'), p('Kyle Monangai','RB','CHI','BN'), p('Jordan Love','QB','GB','BN'),
    p('A.J. Brown','WR','NE','IR','IR'), p('Cam Little','K','JAX','K'), p('Jaguars','DEF','JAX','DEF')
  ],
  'THE KALISH KABANA!!!!': [
    p('Tyler Shough','QB','NO','QB'), p('Jonathan Taylor','RB','IND','RB'), p("De'Von Achane",'RB','MIA','RB'),
    p('Malik Nabers','WR','NYG','WR'), p('Garrett Wilson','WR','NYJ','WR'), p('Sam LaPorta','TE','DET','TE'),
    p('Rashee Rice','WR','KC','W/R/T'), p('Trevor Lawrence','QB','JAX','BN'), p('Blake Corum','RB','LAR','BN'),
    p('Marvin Harrison Jr.','WR','ARI','BN'), p('Carnell Tate','WR','TEN','BN'), p('Courtland Sutton','WR','DEN','BN'),
    p('Dalton Schultz','TE','HOU','BN'), p('Jayden Daniels','QB','WAS','IR','IR'), p('Jason Myers','K','SEA','K'), p('Broncos','DEF','DEN','DEF')
  ]
};

const canonical = s => String(s ?? '').toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9]+/g, ' ').trim();
const capture = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
let updated = 0;
for (const team of capture.teams ?? []) {
  const match = Object.entries(rosters).find(([name]) => canonical(name) === canonical(team.name));
  if (!match) continue;
  team.roster = match[1];
  updated += 1;
}
if (updated !== Object.keys(rosters).length) throw new Error(`Expected ${Object.keys(rosters).length} roster matches; updated ${updated}.`);

capture.capturedAt = '2026-09-29T15:45:00-04:00';
capture.sourceNotes = [...new Set([...(capture.sourceNotes ?? []), 'Week 4 Yahoo roster screenshots manually captured 2026-09-29; temporary bootstrap until Yahoo API access is available.'])];
fs.mkdirSync(new URL('../data/private/', import.meta.url), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(capture, null, 2) + '\n');
console.log(`MANUAL ROSTERS: READY | ${updated} teams | ${Object.values(rosters).reduce((n,r)=>n+r.length,0)} players`);
console.log(`Wrote: ${outputPath}`);
