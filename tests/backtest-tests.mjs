import assert from 'node:assert/strict';
import {mae,rmse,brier,calibrationBins,expectedCalibrationError} from '../src/model/metrics.js';
import {evaluatePointForecasts,evaluateProbabilityForecasts,compareModels} from '../src/backtest.js';
const points=[{predicted:10,actual:12},{predicted:20,actual:18}];assert.equal(mae(points),2);assert.equal(rmse(points),2);assert.deepEqual(evaluatePointForecasts(points),{n:2,mae:2,rmse:2});
const probs=[{probability:.9,outcome:1},{probability:.8,outcome:1},{probability:.2,outcome:0},{probability:.1,outcome:0}];assert.ok(brier(probs)<.03);const ev=evaluateProbabilityForecasts(probs,{bins:5});assert.equal(ev.n,4);assert.ok(ev.logLoss<.2);assert.ok(expectedCalibrationError(probs,5)<.2);assert.equal(calibrationBins(probs,5).reduce((s,b)=>s+b.n,0),4);
const cmp=compareModels({weak:[{predicted:0,actual:10}],strong:[{predicted:9,actual:10}]});assert.equal(cmp[0].model,'strong');
console.log('backtest-tests: all checks passed');
