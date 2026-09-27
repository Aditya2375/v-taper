/* V-TAPER — app logic. State lives in localStorage under "vtaper.v1". */

const STORE_KEY = "vtaper.v1";

const state = loadState();
let view = "today";
let programDayIdx = (new Date().getDay() + 6) % 7; // Mon=0
let progressEx = "Barbell Bench Press";
let draft = null; // in-progress session edits, keyed by date

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* corrupted storage falls through to fresh seed */ }
  const seed = buildSeed();
  const fresh = {
    version: 1,
    programStart: "2026-08-03",
    logs: seed.logs,
    bodyweight: seed.bodyweight,
    customProgram: null
  };
  localStorage.setItem(STORE_KEY, JSON.stringify(fresh));
  return fresh;
}
function save() { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const isoToday = () => {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
};
const fmtDate = iso => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};
const fmtShort = iso => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function getProgram() { return state.customProgram || PROGRAM; }
function dayIndex(dateIso) {
  const [y, m, d] = dateIso.split("-").map(Number);
  return (new Date(y, m - 1, d).getDay() + 6) % 7;
}
function weekNumber() {
  const start = new Date(state.programStart + "T00:00:00");
  const diff = Date.now() - start.getTime();
  return Math.max(1, Math.min(getProgram().weeks, Math.floor(diff / (7 * 864e5)) + 1));
}
function sessionVolume(log) {
  return log.exercises.reduce((t, ex) =>
    t + ex.sets.reduce((s, st) => s + (st.done ? Math.max(st.weight, 0) * st.reps : 0), 0), 0);
}
function allPRs() {
  const prs = {}; // name -> {weight, reps, date}
  [...state.logs].sort((a, b) => a.date.localeCompare(b.date)).forEach(log => {
    log.exercises.forEach(ex => {
      ex.sets.forEach(st => {
        if (!st.done || st.weight <= 0) return;
        const cur = prs[ex.name];
        if (!cur || st.weight > cur.weight || (st.weight === cur.weight && st.reps > cur.reps)) {
          prs[ex.name] = { weight: st.weight, reps: st.reps, date: log.date };
        }
      });
    });
  });
  return prs;
}
function bestSetFor(exName) {
  const pr = allPRs()[exName];
  return pr ? pr.weight + " kg × " + pr.reps : null;
}

/* ———————————————— header ———————————————— */
function renderHeader() {
  const now = new Date();
  $("#today-line").textContent = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  $("#week-line").textContent = "Week " + weekNumber() + " of " + getProgram().weeks;
}

/* ———————————————— view: today ———————————————— */
function renderToday() {
  const today = isoToday();
  const di = dayIndex(today);
  const day = getProgram().days[di];
  const app = $("#app");


  if (day.rest) {
    app.innerHTML = `<div class="view">
      <div class="section-head"><span class="section-num">01</span><h2 class="section-title">Today</h2>
      <span class="section-note">Week ${weekNumber()} · ${esc(day.dow)}</span></div>
      <div class="rest-day">
        <h3>Rest day. <em>Earned.</em></h3>
        <p>${esc(day.focus)} The next session is on the Program tab. Growth happens between sessions, not during them.</p>
      </div>
      ${recentStrip()}
    </div>`;
    return;
  }

  if (!draft || draft.date !== today) {
    const existing = state.logs.find(l => l.date === today);
    draft = existing
      ? JSON.parse(JSON.stringify(existing))
      : { date: today, session: day.name, exercises: day.exercises.map(ex => ({
          name: ex.name, note: "",
          sets: Array.from({ length: ex.sets }, () => ({ weight: null, reps: null, done: false }))
        })) };
  }

  const doneSets = draft.exercises.reduce((t, ex) => t + ex.sets.filter(s => s.done).length, 0);
  const totalSets = draft.exercises.reduce((t, ex) => t + ex.sets.length, 0);
  const prs = allPRs();

  app.innerHTML = `<div class="view">
    <div class="session-banner">
      <h2 class="session-name">${esc(day.name).replace(/(\w+)$/, "<em>$1</em>")}</h2>
      <div class="session-facts">
        <b>${esc(day.dow)}</b> · ${esc(day.focus)}<br>
        Week <b>${weekNumber()}</b> of ${getProgram().weeks} · <b>${day.exercises.length}</b> movements
      </div>
    </div>
    <div class="ex-list">
      ${draft.exercises.map((ex, i) => {
        const plan = day.exercises[i] || {};
        const allDone = ex.sets.every(s => s.done);
        const pr = prs[ex.name];
        return `<div class="ex-card ${allDone ? "done" : ""}" data-ex="${i}">
          <div class="ex-top">
            <span class="ex-index">${String(i + 1).padStart(2, "0")}</span>
            <span class="ex-name">${esc(ex.name)}</span>
            ${pr ? `<span class="ex-pr">PR ${pr.weight}×${pr.reps}</span>` : ""}
            <span class="ex-target">${plan.sets || ex.sets.length} × ${esc(plan.reps || "—")}${plan.rest ? " · rest " + Math.floor(plan.rest / 60) + ":" + String(plan.rest % 60).padStart(2, "0") : ""}</span>
          </div>
          <div class="set-rows">
            <div class="set-row head"><span>Set</span><span class="set-prev-lab">Previous</span><span class="set-prev-lab"></span><span>kg × reps</span><span></span></div>
            ${ex.sets.map((st, si) => {
              const prev = previousSet(ex.name, si);
              return `<div class="set-row ${st.done ? "logged" : ""}">
                <span class="set-label">${si + 1}</span>
                <span class="set-prev">${prev ? esc(prev) : "—"}</span>
                <span></span>
                <span style="display:flex;gap:6px;justify-content:flex-end;align-items:center">
                  <input class="set-input" inputmode="decimal" placeholder="kg" value="${st.weight ?? ""}" data-ex="${i}" data-set="${si}" data-field="weight">
                  <input class="set-input" inputmode="numeric" placeholder="reps" value="${st.reps ?? ""}" data-ex="${i}" data-set="${si}" data-field="reps">
                </span>
                <button class="set-check ${st.done ? "on" : ""}" data-ex="${i}" data-set="${si}" aria-label="Mark set done"><svg viewBox="0 0 16 16"><path d="M2 8.5 6 12.5 14 3.5"/></svg></button>
              </div>`;
            }).join("")}
          </div>
          <div class="ex-notes">
            <button class="linklike" data-rest="${plan.rest || 90}">Rest ${Math.floor((plan.rest || 90) / 60)}:${String((plan.rest || 90) % 60).padStart(2, "0")}</button>
            <input placeholder="${plan.note ? esc(plan.note) : "A note for next time…"}" value="${esc(ex.note || "")}" data-ex="${i}" data-field="note">
          </div>
        </div>`;
      }).join("")}
    </div>
    <div class="session-bar">
      <span class="session-progress"><b>${doneSets}</b> of <b>${totalSets}</b> sets logged</span>
      <button class="chip" id="rest-chip" hidden>Rest</button>
      <button class="btn ghost small" id="add-set">+ Add a set</button>
      <button class="btn" id="finish-session" ${doneSets === 0 ? "disabled" : ""}>Log the session</button>
    </div>
  </div>`;

  // bind inputs
  $$(".set-input").forEach(inp => {
    inp.addEventListener("change", () => {
      const ex = draft.exercises[+inp.dataset.ex], st = ex.sets[+inp.dataset.set];
      const v = inp.value === "" ? null : parseFloat(inp.value);
      st[inp.dataset.field] = isNaN(v) ? null : v;
    });
  });
  $$(".set-check").forEach(btn => {
    btn.addEventListener("click", () => {
      const st = draft.exercises[+btn.dataset.ex].sets[+btn.dataset.set];
      if (!st.done && (st.weight == null && st.reps == null)) {
        // prefill from previous session for one-tap logging
        const prevEx = previousExercise(draft.exercises[+btn.dataset.ex].name);
        if (prevEx && prevEx.sets[+btn.dataset.set]) {
          st.weight = prevEx.sets[+btn.dataset.set].weight;
          st.reps = prevEx.sets[+btn.dataset.set].reps;
        }
      }
      st.done = !st.done;
      if (st.done) maybeStartRest(btn);
      renderToday();
    });
  });
  $$("[data-rest]").forEach(b => b.addEventListener("click", () => startTimer(+b.dataset.rest)));
  $$("input[data-field='note']").forEach(inp => {
    inp.addEventListener("change", () => { draft.exercises[+inp.dataset.ex].note = inp.value; });
  });
  $("#add-set").addEventListener("click", () => {
    // add a set to the last exercise
    const last = draft.exercises[draft.exercises.length - 1];
    last.sets.push({ weight: null, reps: null, done: false });
    renderToday();
  });
  $("#finish-session").addEventListener("click", finishSession);
  $("#rest-chip").addEventListener("click", () => { if (!$("#timer-overlay").hidden) return; startTimer(getProgram().days[dayIndex(isoToday())].exercises.find(e => e.rest)?.rest || 90); });
  bindSampleWipe();
}

function previousExercise(exName) {
  const logs = [...state.logs].sort((a, b) => b.date.localeCompare(a.date));
  for (const log of logs) {
    if (log.date >= isoToday()) continue;
    const ex = log.exercises.find(e => e.name === exName);
    if (ex) return ex;
  }
  return null;
}
function previousSet(exName, setIdx) {
  const prev = previousExercise(exName);
  if (!prev || !prev.sets[setIdx]) return null;
  const s = prev.sets[setIdx];
  return (s.weight || 0) + "×" + (s.reps || 0);
}
let restChipInt = null;
function maybeStartRest() {
  const day = getProgram().days[dayIndex(isoToday())];
  const plan = day.exercises.find(e => e.rest);
  if (!plan) return;
  startRestChip(plan.rest);
}
function startRestChip(seconds) {
  clearInterval(restChipInt);
  let left = seconds;
  const chip = $("#rest-chip");
  if (!chip) return;
  chip.hidden = false;
  const tick = () => {
    const m = Math.floor(left / 60), s = left % 60;
    chip.textContent = "Rest " + m + ":" + String(s).padStart(2, "0");
    if (left <= 0) { clearInterval(restChipInt); chip.textContent = "Go."; beep(); setTimeout(() => { chip.hidden = true; }, 1500); return; }
    left--;
  };
  tick();
  restChipInt = setInterval(tick, 1000);
}
function finishSession() {
  draft.exercises = draft.exercises.filter(ex => ex.sets.some(s => s.done));
  if (!draft.exercises.length) return;
  const oldPRs = allPRs();
  draft.id = "log-" + draft.date;
  const idx = state.logs.findIndex(l => l.date === draft.date);
  if (idx >= 0) state.logs[idx] = JSON.parse(JSON.stringify(draft));
  else state.logs.push(JSON.parse(JSON.stringify(draft)));
  const newPRs = allPRs();
  const hitPR = Object.keys(newPRs).some(k => {
    const n = newPRs[k], o = oldPRs[k];
    return n.date === draft.date && (!o || n.weight > o.weight || (n.weight === o.weight && n.reps > o.reps));
  });
  if (hitPR) state.logs.find(l => l.date === draft.date).pr = true;
  save();
  draft = null;
  switchView("log");
}


function recentStrip() {
  const recent = [...state.logs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  if (!recent.length) return "";
  return `<div class="panel" style="margin-top:24px">
    <div class="panel-head"><span class="panel-title">Last sessions</span></div>
    ${recent.map(l => `<div class="log-ex-line" style="padding:10px 18px">
      <span class="log-date">${fmtShort(l.date)}</span><span class="nm">${esc(l.session)}</span>
      <span class="sets">${Math.round(sessionVolume(l)).toLocaleString()} kg moved</span></div>`).join("")}
  </div>`;
}

/* ———————————————— view: program ———————————————— */
function renderProgram() {
  const prog = getProgram();
  const todayDi = dayIndex(isoToday());
  const sel = prog.days[programDayIdx];
  $("#app").innerHTML = `<div class="view">
    <div class="section-head"><span class="section-num">02</span><h2 class="section-title">The program</h2>
      <span class="section-note">${prog.name} · ${prog.weeks} weeks</span></div>
    <div class="sample-banner"><span class="tag">Template</span>
      The split (Upper A / Lower A / Upper B / Lower B / Delts &amp; Arms) is a starting point — swap in your own exercises and it becomes your plan.
    </div>
    <div class="week-grid">
      ${prog.days.map((d, i) => `
        <div class="day-cell ${d.rest ? "rest" : ""} ${i === todayDi ? "today" : ""}" data-day="${i}">
          <span class="day-dow">${esc(d.dow)}${i === todayDi ? " · today" : ""}</span>
          <span class="day-name">${esc(d.name)}</span>
          <span class="day-focus">${esc(d.focus)}</span>
        </div>`).join("")}
    </div>
    <div class="program-detail">
      <div class="section-head" style="margin-top:36px"><span class="section-num">—</span>
        <h2 class="section-title" style="font-size:22px">${esc(sel.dow)} · ${esc(sel.name)}</h2>
        <span class="section-note">${esc(sel.focus)}</span></div>
      ${sel.rest
        ? `<div class="empty"><div class="big">Nothing scheduled.</div>${esc(sel.focus)}</div>`
        : sel.exercises.map((ex, i) => `
          <div class="ex-line"><span class="n">${String(i + 1).padStart(2, "0")}</span>
            <span class="nm">${esc(ex.name)}</span>
            <span class="tg">${ex.sets} × ${esc(ex.reps)}${ex.rest ? " · " + ex.rest + "s rest" : ""}</span></div>`).join("")}
    </div>
  </div>`;
  $$(".day-cell").forEach(c => c.addEventListener("click", () => { programDayIdx = +c.dataset.day; renderProgram(); }));
}

/* ———————————————— view: logbook ———————————————— */
function renderLog() {
  const logs = [...state.logs].sort((a, b) => b.date.localeCompare(a.date));
  $("#app").innerHTML = `<div class="view">
    <div class="section-head"><span class="section-num">03</span><h2 class="section-title">The logbook</h2>
      <span class="section-note">${logs.length} sessions</span></div>
    ${logs.length === 0 ? `<div class="empty"><div class="big">No sessions yet.</div>Log today's work and it lands here, permanently.</div>` : ""}
    ${logs.map(l => `
      <div class="log-entry" data-id="${esc(l.id)}">
        <button class="log-entry-head">
          <span class="log-date">${fmtDate(l.date)}</span>
          <span class="log-name">${esc(l.session)}</span>
          ${l.pr ? `<span class="log-badge pr">PR day</span>` : ""}
          <span class="log-vol">${Math.round(sessionVolume(l)).toLocaleString()} kg</span>
        </button>
        <div class="log-body">
          ${l.exercises.map(ex => `<div class="log-ex-line"><span class="nm">${esc(ex.name)}</span>
            <span class="sets">${ex.sets.filter(s => s.done).map(s => (s.weight || 0) + "×" + (s.reps || 0)).join(" · ")}</span></div>`).join("")}
        </div>
      </div>`).join("")}
  </div>`;
  $$(".log-entry-head").forEach(h => h.addEventListener("click", () => h.parentElement.classList.toggle("open")));
  bindSampleWipe();
}

/* ———————————————— charts ———————————————— */
let tipEl = null;
function tip(html, x, y) {
  if (!tipEl) { tipEl = document.createElement("div"); tipEl.className = "chart-tip"; document.body.appendChild(tipEl); }
  tipEl.innerHTML = html; tipEl.style.left = x + 12 + "px"; tipEl.style.top = y - 10 + "px"; tipEl.classList.add("show");
}
function untip() { if (tipEl) tipEl.classList.remove("show"); }

function lineChart(points, opts = {}) {
  const W = 720, H = 240, P = { l: 46, r: 14, t: 14, b: 30 };
  if (points.length === 0) return `<div class="empty" style="padding:32px">No data yet.</div>`;
  const xs = points.map((p, i) => i), ys = points.map(p => p.y);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const padY = Math.max((maxY - minY) * 0.15, 1);
  const lo = minY - padY, hi = maxY + padY;
  const X = i => points.length === 1 ? W / 2 : P.l + (i / (points.length - 1)) * (W - P.l - P.r);
  const Y = v => P.t + (1 - (v - lo) / (hi - lo)) * (H - P.t - P.b);
  const path = points.map((p, i) => (i ? "L" : "M") + X(i).toFixed(1) + "," + Y(p.y).toFixed(1)).join(" ");
  const area = path + ` L${X(points.length - 1)},${Y(lo)} L${X(0)},${Y(lo)} Z`;
  const ticks = 4;
  return `<svg class="chart-svg" viewBox="0 0 ${W} ${H}">
    ${Array.from({ length: ticks + 1 }, (_, i) => {
      const v = lo + (i / ticks) * (hi - lo);
      return `<line class="grid-line" x1="${P.l}" x2="${W - P.r}" y1="${Y(v)}" y2="${Y(v)}"/>
        <text x="${P.l - 8}" y="${Y(v) + 3}" text-anchor="end">${Math.round(v * 10) / 10}</text>`;
    }).join("")}
    <path class="data-area" d="${area}"/>
    <path class="data-line" d="${path}"/>
    ${points.map((p, i) => `<circle class="data-dot" cx="${X(i)}" cy="${Y(p.y)}" r="3.5" data-tip="${esc(p.label)}" data-i="${i}"/>`).join("")}
    ${points.map((p, i) => (i % Math.ceil(points.length / 6) === 0 || i === points.length - 1)
      ? `<text x="${X(i)}" y="${H - 8}" text-anchor="middle">${esc(p.x)}</text>` : "").join("")}
  </svg>`;
}

function barChart(bars, opts = {}) {
  const W = 720, H = 240, P = { l: 46, r: 14, t: 14, b: 30 };
  if (!bars.length) return `<div class="empty" style="padding:32px">No data yet.</div>`;
  const max = Math.max(...bars.map(b => b.y), 1);
  const bw = (W - P.l - P.r) / bars.length;
  return `<svg class="chart-svg" viewBox="0 0 ${W} ${H}">
    ${[0, 0.5, 1].map(f => {
      const v = max * f, y = P.t + (1 - f) * (H - P.t - P.b);
      return `<line class="grid-line" x1="${P.l}" x2="${W - P.r}" y1="${y}" y2="${y}"/>
        <text x="${P.l - 8}" y="${y + 3}" text-anchor="end">${v >= 1000 ? (v / 1000).toFixed(1) + "k" : Math.round(v)}</text>`;
    }).join("")}
    ${bars.map((b, i) => {
      const h = (b.y / max) * (H - P.t - P.b);
      const x = P.l + i * bw + bw * 0.18, y = P.t + (H - P.t - P.b) - h;
      return `<rect class="bar ${b.accent ? "accent" : ""}" x="${x}" y="${y}" width="${bw * 0.64}" height="${Math.max(h, 1)}" rx="1.5" data-tip="${esc(b.label)}"/>`;
    }).join("")}
    ${bars.map((b, i) => (i % Math.ceil(bars.length / 8) === 0) ? `<text x="${P.l + i * bw + bw / 2}" y="${H - 8}" text-anchor="middle">${esc(b.x)}</text>` : "").join("")}
  </svg>`;
}

function bindChartTips() {
  $$(".chart-svg [data-tip]").forEach(el => {
    el.addEventListener("mousemove", e => tip(el.dataset.tip, e.clientX, e.clientY));
    el.addEventListener("mouseleave", untip);
  });
}

/* ———————————————— view: progress ———————————————— */
function renderProgress() {
  const exNames = [...new Set(state.logs.flatMap(l => l.exercises.map(e => e.name)))];
  if (!exNames.includes(progressEx)) progressEx = exNames[0] || "Barbell Bench Press";

  // per-exercise top set over time
  const series = [...state.logs].sort((a, b) => a.date.localeCompare(b.date)).map(l => {
    const ex = l.exercises.find(e => e.name === progressEx);
    if (!ex) return null;
    const top = Math.max(...ex.sets.filter(s => s.done).map(s => s.weight), 0);
    return { x: fmtShort(l.date), y: top, label: `${fmtDate(l.date)}<br>Top set: ${top} kg` };
  }).filter(Boolean);

  // weekly volume
  const weeks = {};
  state.logs.forEach(l => {
    const [y, m, d] = l.date.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    const monday = new Date(dt); monday.setDate(dt.getDate() - ((dt.getDay() + 6) % 7));
    const key = monday.toISOString().slice(0, 10);
    weeks[key] = (weeks[key] || 0) + sessionVolume(l);
  });
  const weekKeys = Object.keys(weeks).sort();
  const bars = weekKeys.map((k, i) => ({ x: "W" + (i + 1), y: Math.round(weeks[k]), label: `Week of ${fmtShort(k)}<br>${Math.round(weeks[k]).toLocaleString()} kg`, accent: i === weekKeys.length - 1 }));

  // bodyweight
  const bw = state.bodyweight.map(b => ({ x: fmtShort(b.date), y: b.kg, label: `${fmtDate(b.date)}<br>${b.kg} kg` }));

  const totalSessions = state.logs.length;
  const totalVol = state.logs.reduce((t, l) => t + sessionVolume(l), 0);
  const prCount = Object.keys(allPRs()).length;
  const currentBw = state.bodyweight.length ? state.bodyweight[state.bodyweight.length - 1].kg : null;

  $("#app").innerHTML = `<div class="view">
    <div class="section-head"><span class="section-num">04</span><h2 class="section-title">Progress</h2>
      <span class="section-note">the proof, in ink</span></div>
    <div class="stat-strip">
      <div class="stat-cell"><div class="stat-num">${totalSessions}</div><div class="stat-lab">Sessions logged</div></div>
      <div class="stat-cell"><div class="stat-num">${totalVol >= 1000 ? (totalVol / 1000).toFixed(1) + "<small>t</small>" : Math.round(totalVol)}</div><div class="stat-lab">Total volume</div></div>
      <div class="stat-cell"><div class="stat-num">${prCount}</div><div class="stat-lab">Movements tracked</div></div>
      <div class="stat-cell"><div class="stat-num">${currentBw ?? "—"}<small>${currentBw ? " kg" : ""}</small></div><div class="stat-lab">Bodyweight</div></div>
    </div>
    <div class="chart-block">
      <h4>${esc(progressEx)}</h4>
      <div class="chart-sub">top set per session · pick another movement:</div>
      <div class="picker-row">${exNames.map(n => `<button class="chip ${n === progressEx ? "on" : ""}" data-ex="${esc(n)}">${esc(n)}</button>`).join("")}</div>
      ${lineChart(series)}
    </div>
    <div class="chart-block">
      <h4>Weekly volume</h4>
      <div class="chart-sub">kilograms moved per training week</div>
      ${barChart(bars)}
    </div>
    <div class="chart-block">
      <h4>Bodyweight</h4>
      <div class="chart-sub">weigh-in per week, morning, fasted</div>
      ${lineChart(bw)}
      <div style="margin-top:14px"><button class="btn small ghost" id="add-bw">Log today's weight</button></div>
    </div>
  </div>`;
  $$(".chip").forEach(c => c.addEventListener("click", () => { progressEx = c.dataset.ex; renderProgress(); }));
  $("#add-bw").addEventListener("click", () => {
    const v = prompt("Bodyweight today (kg):", currentBw || 62);
    if (v == null) return;
    const kg = parseFloat(v); if (isNaN(kg)) return;
    const today = isoToday();
    state.bodyweight = state.bodyweight.filter(b => b.date !== today);
    state.bodyweight.push({ date: today, kg });
    state.bodyweight.sort((a, b) => a.date.localeCompare(b.date));
    save(); renderProgress();
  });
  bindChartTips();
  bindSampleWipe();
}

/* ———————————————— view: records ———————————————— */
function renderRecords() {
  const prs = allPRs();
  const entries = Object.entries(prs).sort((a, b) => b[1].date.localeCompare(a[1].date));
  const recentCut = new Date(Date.now() - 14 * 864e5).toISOString().slice(0, 10);
  $("#app").innerHTML = `<div class="view">
    <div class="section-head"><span class="section-num">05</span><h2 class="section-title">Records</h2>
      <span class="section-note">best set ever, per movement</span></div>
    ${entries.length === 0 ? `<div class="empty"><div class="big">No records yet.</div>The board fills itself the first time you log a session.</div>` : ""}
    <div class="pr-grid">
      ${entries.map(([name, pr]) => `
        <div class="pr-card">
          ${pr.date >= recentCut ? `<span class="pr-stamp">Recent</span>` : ""}
          <div class="pr-ex">${esc(name)}</div>
          <div class="pr-val">${pr.weight}<small> kg × ${pr.reps}</small></div>
          <div class="pr-when">${fmtDate(pr.date)}</div>
        </div>`).join("")}
    </div>
  </div>`;
  bindSampleWipe();
}

/* ———————————————— rest timer ———————————————— */
let timerInt = null, timerLeft = 0, timerTotal = 0;
function startTimer(seconds) {
  timerTotal = timerLeft = seconds;
  $("#timer-overlay").hidden = false;
  clearInterval(timerInt);
  tickTimer();
  timerInt = setInterval(tickTimer, 1000);
  renderPresets();
}
function tickTimer() {
  const face = $("#timer-face");
  const m = Math.floor(timerLeft / 60), s = timerLeft % 60;
  face.textContent = m + ":" + String(s).padStart(2, "0");
  face.classList.toggle("urgent", timerLeft <= 10);
  if (timerLeft <= 0) {
    clearInterval(timerInt);
    beep();
    setTimeout(() => { $("#timer-overlay").hidden = true; }, 900);
  }
  timerLeft--;
}
function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.22, 0.44].forEach(t => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.28, ctx.currentTime + t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.2);
      o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.22);
    });
  } catch (e) {}
}
function renderPresets() {
  const box = $("#timer-presets");
  box.innerHTML = [60, 90, 120, 180].map(s =>
    `<button class="chip ${s === timerTotal ? "on" : ""}" data-t="${s}">${s >= 60 ? Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0") : s + "s"}</button>`).join("");
  $$("#timer-presets .chip").forEach(c => c.addEventListener("click", () => startTimer(+c.dataset.t)));
}

/* ———————————————— data & settings ———————————————— */
function renderDataSheet() {
  $("#data-sheet-body").innerHTML = `
    <h5>Program</h5>
    <p>Week counting starts from your program's first Monday.</p>
    <div class="sheet-row">
      <label for="prog-start" style="font-family:var(--mono);font-size:12px">Start date</label>
      <input type="date" id="prog-start" value="${state.programStart}">
      <button class="btn small" id="save-start">Save</button>
    </div>
    <h5>Your data</h5>
    <p>Everything lives in this browser's local storage. Export before switching devices or clearing site data.</p>
    <div class="sheet-row">
      <button class="btn small ghost" id="export-json">Export JSON</button>
      <button class="btn small ghost" id="import-json">Import JSON</button>
      <input type="file" id="import-file" accept="application/json" hidden>
    </div>
    <h5>Danger zone</h5>
    <div class="sheet-row">
      <button class="linklike danger" id="reset-all">Erase everything and start over</button>
    </div>`;
  $("#save-start").addEventListener("click", () => {
    const v = $("#prog-start").value;
    if (v) { state.programStart = v; save(); renderHeader(); renderDataSheet(); }
  });
  $("#export-json").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "v-taper-" + isoToday() + ".json";
    a.click();
  });
  $("#import-json").addEventListener("click", () => $("#import-file").click());
  $("#import-file").addEventListener("change", e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(r.result);
        if (!data.logs) throw new Error("bad file");
        Object.assign(state, data); save(); draft = null;
        $("#data-overlay").hidden = true; render();
      } catch (err) { alert("That file doesn't look like a V-TAPER export."); }
    };
    r.readAsText(f);
  });
  $("#reset-all").addEventListener("click", () => {
    if (!confirm("Erase all logs, records and history? This cannot be undone.")) return;
    localStorage.removeItem(STORE_KEY);
    location.reload();
  });
}

/* ———————————————— router ———————————————— */
function render() {
  renderHeader();
  ({ today: renderToday, program: renderProgram, log: renderLog, progress: renderProgress, records: renderRecords })[view]();
  $("#app").scrollTo?.(0, 0);
}
function switchView(v) {
  view = v;
  $$(".tab").forEach(t => t.classList.toggle("is-active", t.dataset.view === v));
  render();
}

$("#tabs").addEventListener("click", e => {
  const t = e.target.closest(".tab");
  if (t) switchView(t.dataset.view);
});
$("#timer-skip").addEventListener("click", () => { clearInterval(timerInt); $("#timer-overlay").hidden = true; });
$("#timer-close").addEventListener("click", () => { clearInterval(timerInt); $("#timer-overlay").hidden = true; });
$("#data-menu-btn").addEventListener("click", () => { renderDataSheet(); $("#data-overlay").hidden = false; });
$("#data-close").addEventListener("click", () => { $("#data-overlay").hidden = true; });
$$(".overlay").forEach(o => o.addEventListener("click", e => { if (e.target === o) { o.hidden = true; clearInterval(timerInt); } }));
document.addEventListener("keydown", e => {
  if (e.key === "Escape") { $$(".overlay").forEach(o => o.hidden = true); clearInterval(timerInt); }
});

render();
