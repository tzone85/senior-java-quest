# Testing strategy

## Policy

- **All new behaviour in `lib/quest-core.js` lands behind a failing test first.** Red, green, refactor — strict.
- **Pure functions must not have IO.** If a helper needs `Date.now()`, accept it as a parameter (see `defaultState(now)`, `nextStreak(streak, lastCheckIn, today)`).
- **Coverage target: 80% of `quest-core.js`.** The shell (DOM, fetch, localStorage) is covered manually in-browser.
- **No mocking frameworks.** The core has no dependencies to mock. The shell isn't unit-tested.

## Why this works

The architecture is set up so the *interesting* logic — phase status, week computation, streak transitions, achievement rules — is in `quest-core.js`, which is a pure module with **zero dependencies on the DOM, network, storage, or timers**. That makes it trivially testable in a browser script tag.

The shell (`index.html`) is mostly glue: read state → render DOM → handle clicks → write state. Manual browser testing catches regressions there cheaply.

---

## Running the tests

```bash
open tests/test.html
```

That's it. The page loads `lib/quest-core.js` and runs every test, displaying pass/fail with red/green indicators and a final summary.

There's no `npm test`, no CI, no headless runner. If you want one later, the test file is plain JS and can be wrapped with `node --experimental-vm-modules` or a Vitest config — but YAGNI for now.

---

## What's covered

| Function | Cases |
|---|---|
| `daysBetween(a, b)` | Same day → 0, next day → 1, week → 7, backwards → negative |
| `todayStr(now)` | ISO date format, deterministic with injected `now` |
| `defaultState(now)` | Shape: all 24 weeks present, all bosses false, empty achievements, `startDate` matches `now` |
| `isWeekComplete(state, weekId)` | True / false / missing-week safety |
| `phaseWeeksComplete` / `phaseAllWeeksComplete` | 0, partial, full |
| `phaseStatus` | Locked / Ready / In Progress / Boss Unlocked / Complete |
| `totalWeeksComplete` / `totalBossesComplete` / `totalBadgesEarned` | Aggregation correctness |
| `allDone` | False until 24 weeks + 5 bosses |
| `currentWeek` / `currentPhase` | First incomplete week walks across phases |
| `nextStreak` | First check-in, same-day no-op, +1 day, gap day reset, no `lastCheckIn` |
| `earnedBadgeIds` | Empty state → no badges; W2 complete → `redLight` + `greenLight`; all complete → `equalExpert` |
| `quoteForDay` | Modular rotation across 13 quotes |

---

## How to add a test

`tests/quest-core.test.js` uses a tiny inline harness — no framework:

```js
assert("daysBetween: same day = 0", () => {
  eq(QC.daysBetween("2026-05-27", "2026-05-27"), 0);
});
```

Helpers available:

| Helper | What it does |
|---|---|
| `assert(name, fn)` | Runs `fn`; pass if it doesn't throw |
| `eq(actual, expected, msg?)` | Deep equality via JSON.stringify |
| `truthy(value, msg?)` | Throws unless value is truthy |
| `falsy(value, msg?)` | Throws unless value is falsy |
| `throws(fn, msg?)` | Throws unless `fn` throws |

Add tests at the bottom of the file. They run top-to-bottom. Each `assert` is independent — no `beforeEach`, no shared state. If you need fixtures, build them inline.

---

## What's NOT covered (and why)

| Not covered | Reason |
|---|---|
| DOM rendering (`renderDashboard`, `openWeek`, etc.) | Pure projection of state — exercised by opening the app |
| `localStorage` IO | Browser primitive, trust it |
| GitHub sync (`syncToGitHub`) | Network IO; would need mocked `fetch`. Manually tested |
| Confetti, toast, modal | Visual; manually tested |
| Theme toggle | Visual; manually tested |
| Cron routine prompts | Live-tested via `RemoteTrigger` run; failures surface in the routine output |

If a bug ever lands in one of these, the right fix is usually to extract the impure-but-buggy bit into the pure core, write a test that fails, then fix it. That's how the core grows.

---

## TDD workflow for a new feature

1. **Write the test first.** Add a fresh `assert(...)` block describing what you want.
2. **Open `tests/test.html`** — see the red.
3. **Implement** the minimum change in `quest-core.js` to turn it green.
4. **Refactor** if needed. Tests stay green.
5. **Wire** the new pure function into `index.html` (the shell).
6. **Verify in the browser.**

If you can't write a test for it, ask whether the logic actually belongs in the core — or whether it's IO that should sit in the shell instead.
