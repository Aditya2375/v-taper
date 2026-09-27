/* The ten-week V-taper program — TEMPLATE.
   10 weeks, 5-day split (Tue Upper A through Sat Delts, Mon+Sun rest).
   Exercises and targets below are a sensible V-taper starting point
   for a beginner; replace them with your own plan anytime. */

const PROGRAM = {
  name: "The V-Taper Ten",
  weeks: 10,
  days: [
    // index 0 = Monday … 6 = Sunday (Monday rest)
    { dow: "Monday",    name: "Rest",                rest: true,  focus: "Recover. Walk. Eat.", exercises: [] },
    { dow: "Tuesday",   name: "Upper A",             rest: false, focus: "Chest · Back · Delts", exercises: [
      { name: "Barbell Bench Press",      sets: 4, reps: "6-8",   rest: 150, note: "Full range, pause on the chest." },
      { name: "Wide-Grip Lat Pulldown",   sets: 4, reps: "8-10",  rest: 120, note: "The V-taper money movement. Squeeze the lats." },
      { name: "Seated Dumbbell Press",    sets: 3, reps: "8-10",  rest: 120, note: "" },
      { name: "Chest-Supported Row",      sets: 3, reps: "10-12", rest: 90,  note: "" },
      { name: "Incline Push-Up",          sets: 2, reps: "to failure", rest: 60, note: "Finisher. Leave one in the tank." }
    ]},
    { dow: "Wednesday", name: "Lower A",             rest: false, focus: "Quads · Hams · Calves", exercises: [
      { name: "Back Squat",               sets: 4, reps: "6-8",   rest: 180, note: "Depth first, weight second." },
      { name: "Romanian Deadlift",        sets: 3, reps: "8-10",  rest: 120, note: "Hinge, don't squat it." },
      { name: "Leg Press",                sets: 3, reps: "10-12", rest: 90,  note: "" },
      { name: "Standing Calf Raise",      sets: 4, reps: "12-15", rest: 60,  note: "Two-second squeeze at the top." }
    ]},
    { dow: "Thursday",  name: "Upper B",             rest: false, focus: "Back · Arms", exercises: [
      { name: "Assisted Pull-Up",         sets: 4, reps: "6-8",   rest: 150, note: "Reduce assistance week over week." },
      { name: "Overhead Press",           sets: 3, reps: "6-8",   rest: 120, note: "" },
      { name: "One-Arm Dumbbell Row",     sets: 3, reps: "10-12", rest: 90,  note: "" },
      { name: "Barbell Curl",             sets: 3, reps: "10-12", rest: 60,  note: "" },
      { name: "Rope Pushdown",            sets: 3, reps: "12-15", rest: 60,  note: "" }
    ]},
    { dow: "Friday",    name: "Lower B",             rest: false, focus: "Posterior chain", exercises: [
      { name: "Deadlift",                 sets: 3, reps: "5",     rest: 180, note: "The lift. Brace hard." },
      { name: "Front Foot Elevated Split Squat", sets: 3, reps: "8 each", rest: 90, note: "" },
      { name: "Lying Leg Curl",           sets: 3, reps: "10-12", rest: 90,  note: "" },
      { name: "Seated Calf Raise",        sets: 4, reps: "12-15", rest: 60,  note: "" },
      { name: "Hanging Knee Raise",       sets: 3, reps: "10-12", rest: 60,  note: "" }
    ]},
    { dow: "Saturday",  name: "Delts & Arms",        rest: false, focus: "The V-taper day", exercises: [
      { name: "Lateral Raise",            sets: 5, reps: "12-15", rest: 60,  note: "Width lives here. Strict form." },
      { name: "Rear-Delt Fly",            sets: 4, reps: "12-15", rest: 60,  note: "" },
      { name: "Incline Dumbbell Curl",    sets: 3, reps: "10-12", rest: 60,  note: "" },
      { name: "Overhead Extension",       sets: 3, reps: "10-12", rest: 60,  note: "" },
      { name: "Hammer Curl",              sets: 2, reps: "12",    rest: 45,  note: "" }
    ]},
    { dow: "Sunday",    name: "Rest",                rest: true,  focus: "Sleep in. Meal prep.", exercises: [] }
  ]
};
