import assert from 'node:assert/strict';
import {parseStandingsText,parseScheduleText,captureToPatch} from '../src/data/current-state-capture.js';

const standings=parseStandingsText("The Fightin' Kali | 2-1 | 318.44 | 290.10 | 3\nAlpha | 1-2 | 275.2 | 301.4 | 7");
assert.equal(standings.length,2);
assert.deepEqual(standings[0],{name:"The Fightin' Kali",wins:2,losses:1,ties:0,points:318.44,pointsAgainst:290.1,rank:3});
const schedule=parseScheduleText("4 | The Fightin' Kali vs Alpha\n4 | Bravo @ Charlie\n5 | Alpha vs Charlie");
assert.equal(schedule.length,2);
assert.equal(schedule[0].week,4);
assert.deepEqual(schedule[0].matchups[0],["The Fightin' Kali",'Alpha']);
const patch=captureToPatch({capturedAt:'2026-09-28T12:00:00Z',standings:"The Fightin' Kali | 2-1 | 318.44",scheduleText:"4 | The Fightin' Kali vs Alpha"});
assert.equal(patch.provider,'manual-capture');
assert.equal(patch.teams[0].wins,2);
assert.equal(patch.schedule[0].week,4);
assert.throws(()=>parseStandingsText('Bad Team | nope'),/Invalid record/);
assert.throws(()=>parseScheduleText('garbage'),/Invalid schedule/);
console.log('current-state-capture-tests: all checks passed');
