/* History — eight weeks of realistic beginner logs so the
   product feels lived-in on first open. Deterministic, no randomness
   at runtime: written out by the generator below and frozen. */

function buildSeed() {
  // Deterministic PRNG so the seed is stable across machines.
  let s = 20260927;
  const rnd = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;

  // Starting weights (kg) for a beginner and weekly jumps.
  const lifts = {
    "Barbell Bench Press":      { start: 20, jump: 2.5, reps: [7, 8, 6, 8] },
    "Wide-Grip Lat Pulldown":   { start: 25, jump: 2.5, reps: [9, 10, 8, 10] },
    "Seated Dumbbell Press":    { start: 8,  jump: 1,   reps: [9, 8, 10] },   // per dumbbell
    "Chest-Supported Row":      { start: 15, jump: 2.5, reps: [11, 10, 12] },
    "Incline Push-Up":          { start: 0,  jump: 0,   reps: [12, 14] },     // bodyweight
    "Back Squat":               { start: 20, jump: 2.5, reps: [7, 8, 6, 8] },
    "Romanian Deadlift":        { start: 30, jump: 2.5, reps: [9, 8, 10] },
    "Leg Press":                { start: 40, jump: 5,   reps: [11, 12, 10] },
    "Standing Calf Raise":      { start: 20, jump: 2.5, reps: [13, 12, 15, 14] },
    "Assisted Pull-Up":         { start: -18, jump: 2,  reps: [7, 8, 6, 8] }, // negative = assistance
    "Overhead Press":           { start: 15, jump: 1.25,reps: [7, 8, 6] },
    "One-Arm Dumbbell Row":     { start: 12, jump: 1,   reps: [11, 10, 12] },
    "Barbell Curl":             { start: 12.5,jump: 1.25,reps: [11, 10, 12] },
    "Rope Pushdown":            { start: 12.5,jump: 1.25,reps: [13, 12, 14] },
    "Deadlift":                 { start: 40, jump: 5,   reps: [5, 5, 5] },
    "Front Foot Elevated Split Squat": { start: 8, jump: 1, reps: [8, 8, 8] },
    "Lying Leg Curl":           { start: 20, jump: 2.5, reps: [11, 10, 12] },
    "Seated Calf Raise":        { start: 15, jump: 2.5, reps: [13, 12, 14, 15] },
    "Hanging Knee Raise":       { start: 0,  jump: 0,   reps: [9, 10, 11] },
    "Lateral Raise":            { start: 5,  jump: 0.5, reps: [13, 12, 14, 12, 15] },
    "Rear-Delt Fly":            { start: 4,  jump: 0.5, reps: [13, 12, 14, 15] },
    "Incline Dumbbell Curl":    { start: 6,  jump: 0.5, reps: [11, 10, 12] },
    "Overhead Extension":       { start: 10, jump: 1,   reps: [11, 10, 12] },
    "Hammer Curl":              { start: 7,  jump: 0.5, reps: [12, 12] }
  };

  // Eight weeks ending the Saturday before "now" (Sep 27, 2026 is a Sunday).
  // Program began Monday, Aug 3, 2026. Log Tue-Sat each week.
  const logs = [];
  const start = new Date(2026, 7, 3); // Mon Aug 3 2026
  for (let week = 0; week < 8; week++) {
    for (let d = 1; d <= 6; d++) { // Tue..Sat
      const day = PROGRAM.days[d];
      if (day.rest) continue;
      // occasional missed session: week 4 Friday, week 6 Wednesday
      if ((week === 3 && d === 4) || (week === 5 && d === 2)) continue;
      const date = new Date(start);
      date.setDate(start.getDate() + week * 7 + d);
      const iso = date.toISOString().slice(0, 10);
      const exercises = day.exercises.map(ex => {
        const L = lifts[ex.name];
        // stall weeks 5-6 on pressing, resume after
        const stall = (week >= 4 && week <= 5 && /Bench|Overhead/.test(ex.name)) ? (week - 3) * 0 : 1;
        const w = Math.round((L.start + L.jump * week * stall) * 2) / 2;
        const sets = L.reps.slice(0, ex.sets).map(r => ({
          weight: Math.max(w, 0),
          reps: Math.max(r + Math.floor(rnd() * 3) - 1, 4),
          done: true
        }));
        return { name: ex.name, sets, note: "" };
      });
      const pr = week >= 6 && d !== 6; // recent weeks carry a PR badge
      logs.push({ id: "seed-" + iso + "-" + d, date: iso, session: day.name, exercises, pr: week >= 6 && (d === 1 || d === 3) });
    }
  }
  // Bodyweight entries: 62.0 → 63.4 kg over the same eight weeks
  const bodyweight = [];
  for (let week = 0; week <= 8; week++) {
    const date = new Date(start); date.setDate(start.getDate() + week * 7);
    bodyweight.push({ date: date.toISOString().slice(0, 10), kg: Math.round((62 + week * 0.2) * 10) / 10 });
  }
  return { logs, bodyweight, seededAt: new Date().toISOString() };
}
