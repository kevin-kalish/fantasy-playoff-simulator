import assert from 'node:assert/strict';
import fs from 'node:fs';

for(const file of ['demo/index.html','demo/styles.css','demo/app.js','scripts/build-demo-data.mjs','scripts/serve-demo.mjs']) assert.equal(fs.existsSync(file),true,`${file} should exist`);
const html=fs.readFileSync('demo/index.html','utf8');
assert.match(html,/The Fightin/);
assert.match(html,/data-view="lineup"/);
assert.match(html,/data-view="playoffs"/);
assert.match(html,/data-view="actions"/);
const app=fs.readFileSync('demo/app.js','utf8');
assert.match(app,/\.\/data\.json/);
assert.match(app,/playoffProbability/);
assert.match(app,/recommendations/);
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
assert.equal(pkg.scripts['demo:build'],'node scripts/build-demo-data.mjs');
assert.equal(pkg.scripts['demo:serve'],'node scripts/serve-demo.mjs');
console.log('demo-dashboard-tests: all checks passed');
