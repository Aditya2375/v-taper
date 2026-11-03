/* Bounded, allowlisted state at the browser and file boundary. */
function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value + 'T12:00:00Z');
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === value;
}
function validateState(value) {
  const fail = () => { throw new Error('Invalid training-log data'); };
  const obj = v => v && typeof v === 'object' && !Array.isArray(v);
  const text = (v, max = 500) => typeof v === 'string' && v.length <= max;
  const num = (v, min, max) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
  const list = (v, max) => Array.isArray(v) && v.length <= max;
  if (!obj(value) || value.version !== 1 || !validDate(value.programStart) || !list(value.logs, 2000) || !list(value.bodyweight, 5000)) fail();
  const dates = new Set();
  const logs = value.logs.map(l => {
    if (!obj(l) || !text(l.id, 100) || !validDate(l.date) || dates.has(l.date) || !text(l.session, 150) || !list(l.exercises, 40)) fail();
    dates.add(l.date);
    return {id:l.id,date:l.date,session:l.session,pr:l.pr === true,exercises:l.exercises.map(e => {
      if (!obj(e) || !text(e.name, 150) || !text(e.note || '') || !list(e.sets, 100)) fail();
      return {name:e.name,note:e.note || '',sets:e.sets.map(s => {
        if (!obj(s) || !(s.weight === null || num(s.weight, -1000, 2000)) || !(s.reps === null || num(s.reps, 0, 1000)) || typeof s.done !== 'boolean') fail();
        return {weight:s.weight,reps:s.reps,done:s.done};
      })};
    })};
  });
  const bodyweight = value.bodyweight.map(b => {
    if (!obj(b) || !validDate(b.date) || !num(b.kg, 1, 700)) fail();
    return {date:b.date,kg:b.kg};
  }).sort((a,b) => a.date.localeCompare(b.date));
  let customProgram = null;
  if (value.customProgram != null) {
    const p = value.customProgram;
    if (!obj(p) || !text(p.name, 150) || !Number.isInteger(p.weeks) || !num(p.weeks, 1, 104) || !Array.isArray(p.days) || p.days.length !== 7) fail();
    customProgram = {name:p.name,weeks:p.weeks,days:p.days.map(d => {
      if (!obj(d) || !text(d.dow, 30) || !text(d.name, 150) || !text(d.focus) || typeof d.rest !== 'boolean' || !list(d.exercises, 40) || (!d.rest && !d.exercises.length)) fail();
      return {dow:d.dow,name:d.name,focus:d.focus,rest:d.rest,exercises:d.exercises.map(e => {
        if (!obj(e) || !text(e.name,150) || !Number.isInteger(e.sets) || !num(e.sets,1,100) || !text(e.reps,50) || !num(e.rest,0,3600) || !text(e.note || '')) fail();
        return {name:e.name,sets:e.sets,reps:e.reps,rest:e.rest,note:e.note || ''};
      })};
    })};
  }
  return {version:1,programStart:value.programStart,logs,bodyweight,customProgram};
}
