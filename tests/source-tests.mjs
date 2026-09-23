import assert from 'node:assert/strict';
import {getSource,calibrationSourceCheck,assertCalibrationSources} from '../src/data/source-catalog.js';
assert.equal(getSource('nflverse_actuals').role,'actuals');
const research=calibrationSourceCheck({projectionSource:'fantasypros_historical',actualSource:'nflverse_actuals'});assert.equal(research.usable,true);
const pending=calibrationSourceCheck({projectionSource:'fantasypros_live',actualSource:'nflverse_actuals'});assert.equal(pending.usable,false);assert.throws(()=>assertCalibrationSources({projectionSource:'fantasypros_live',actualSource:'nflverse_actuals'}));
const wrong=calibrationSourceCheck({projectionSource:'nflverse_rankings',actualSource:'nflverse_actuals'});assert.equal(wrong.usable,false);
console.log('source-tests: all checks passed');
