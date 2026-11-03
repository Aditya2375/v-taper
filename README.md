# V-TAPER — a training log

A ten-week V-taper training log. Sessions, records, and progress — kept on paper rules, run by a machine.

Live: https://aditya2375.github.io/v-taper/

## What it is

- **Today** — the day's session with one-tap set logging, previous-session ghosts, and a built-in rest timer.
- **Program** — the full 5-day V-taper split (Upper A / Lower A / Upper B / Lower B / Delts & Arms, Monday and Sunday rest).
- **Logbook** — every session ever logged, expandable, with volume totals.
- **Progress** — top-set line charts per movement, weekly volume bars, bodyweight tracking.
- **Records** — a PR board that fills itself from your logs.

## Run it

It's a static site. Open `index.html` or serve the folder:

```
python3 -m http.server 8000
```

## Data

Everything is stored in the browser's local storage — no accounts, no servers. Export/import JSON from "Data & settings". The app ships with eight weeks of clearly-badged sample history; use Data & settings to erase it and start your own log.


## Privacy and reliability

Local only: no account, tracking or shared workout API. The old shared demo loader has been retired so it cannot replace a personal log. Browser data is not a backup: use Data & settings to export JSON. Clearing site storage removes it. Import replaces the log only after confirmation and validates version, dates, numeric ranges, text lengths and collection limits (5 MB file maximum). If storage fails, the site warns that changes are in memory only; export them before leaving.

Sample history is illustrative, not actual training results. Reset clears the log without reloading sample data. The program is a template, not medical advice. Adjust to your ability and seek qualified guidance for pain or health conditions.

Self-hosted fonts and licence text are included. No build or runtime dependencies. Serve with Python as above. `node test-data.cjs` checks the data boundary. Backend authentication, queues, payments and rate limits do not apply to this static app. GitHub Pages controls HTTP response headers; page CSP is defense in depth, not a substitute for those headers.
