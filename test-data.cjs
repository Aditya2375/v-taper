const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const c = vm.createContext({Date, Set});
vm.runInContext(['data.js','program.js','seed.js'].map(p=>fs.readFileSync(p,'utf8')).join('\n'),c);
const check = s => vm.runInContext('validateState('+JSON.stringify(s)+')',c);
const seed = vm.runInContext('({version:1,programStart:"2026-08-03",logs:buildSeed().logs,bodyweight:buildSeed().bodyweight,customProgram:null})',c);
assert.equal(check(seed).logs.length,38);
let tests=1;
for(const edit of [s=>s.logs='bad',s=>s.programStart='2026-02-30',s=>s.logs[0].exercises[0].sets[0].weight='"><img>',s=>s.logs[0].exercises[0].sets[0].reps=1e20,s=>s.bodyweight=[{date:'2026-01-01',kg:-3}],s=>s.customProgram={},s=>s.logs.push(s.logs[0]),s=>s.logs[0].exercises[0].note='x'.repeat(501)]){
 const s=JSON.parse(JSON.stringify(seed));edit(s);assert.throws(()=>check(s));tests++;
}
const extra=JSON.parse(JSON.stringify(seed));extra.pollution=true;assert.equal(check(extra).pollution,undefined);tests++;
console.log(tests+' data checks passed');
