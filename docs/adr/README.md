# Architecture Decision Records (ADRs)

> An ADR captures a single material architectural decision: the context, the choice, the consequences. They're written so a future maintainer (or future-you) can understand *why* the system looks the way it does without re-running every prior debate.

| # | Title | Status |
|---|---|---|
| 0001 | Record architecture decisions as ADRs | Accepted |
| 0002 | Vanilla JS, no framework, no build step | Accepted |
| 0003 | `localStorage` as the primary store; cloud as optional mirror | Accepted |
| 0004 | GitHub sync via fine-grained PAT in browser | Accepted (with caveat) |
| 0005 | Hexagonal split: pure core + adapter shell | Accepted |
| 0006 | Accept task-data duplication across app + cron prompts | Accepted (temporary) |

---

## 0001 — Record architecture decisions as ADRs

**Status:** Accepted · **Date:** 2026-05-27

### Context

This repo follows a project-wide standard: every misc repo must capture material architectural decisions so future maintenance (often by Future-Thando) doesn't repeat the same conversations from scratch. Slack discussions and PR descriptions evaporate; the repo persists.

### Decision

Use lightweight ADRs based on Michael Nygard's template, all collected in a single `docs/adr/README.md`. One H2 section per decision. Numbered sequentially. Never deleted — superseded ADRs stay in place with a status flip.

### Consequences

- ✅ Cheap to add an ADR (just append a section)
- ✅ Single file = easy to grep
- ✅ Git history shows when each decision landed
- ⚠ Can't link to individual ADR files; we anchor-link sections instead
- ⚠ File grows over time — split if it exceeds ~1000 lines

---

## 0002 — Vanilla JS, no framework, no build step

**Status:** Accepted · **Date:** 2026-05-27

### Context

The original brief was "build a single-page accountability tracker; one `index.html` file, no npm, no build tools, no backend". The user opens it from `file://` on macOS Safari/Chrome.

We considered React + Vite, Svelte, htmx, and Alpine.js. All require either a build step or a CDN dependency that breaks offline.

### Decision

Hand-rolled vanilla JS + CSS. DOM construction via a tiny `el(tag, opts, children)` helper instead of `innerHTML` (prevents XSS by construction — see [`docs/architecture/`](../architecture/) for the pattern).

### Consequences

- ✅ Opens in any modern browser with zero setup
- ✅ Inspectable: a junior dev can read top-to-bottom and understand everything
- ✅ No framework lock-in, no upgrade churn
- ✅ Tiny payload (~60KB for the entire app)
- ⚠ Manual state-to-DOM rendering — re-render is "blow it away, rebuild it"
- ⚠ No reactive state — every event handler manually triggers `renderDashboard()` / `renderStats()`
- ⚠ Won't scale to a larger app (200+ components) — but this app is finite

### Trade-off vs. testability

Vanilla JS in a single HTML file is hard to unit-test. We split the file in two — see [ADR 0005](#0005--hexagonal-split-pure-core--adapter-shell).

---

## 0003 — `localStorage` as the primary store; cloud as optional mirror

**Status:** Accepted · **Date:** 2026-05-27

### Context

The app needs to remember progress across sessions. Options:

- A) `localStorage` only
- B) Cloud database (Firebase, Supabase, etc.)
- C) `localStorage` + optional cloud sync

(B) breaks the "no backend" constraint and adds auth complexity. (A) means progress is lost if the browser is cleared. (C) wins both — local-first with optional cloud as backup.

### Decision

`localStorage` is the source of truth. The user can optionally configure GitHub sync (see [ADR 0004](#0004--github-sync-via-fine-grained-pat-in-browser)) to mirror state to `state.json` in the repo. The cron reminders read that mirror.

### Consequences

- ✅ Works offline, no auth flows, no server
- ✅ Sync is one-way (app → repo), so conflict resolution is trivial: last write wins
- ✅ Export/Import buttons provide manual backup without depending on sync
- ⚠ Clearing browser data without an export/sync = data loss
- ⚠ Multi-device sync isn't atomic — but it's "good enough" for one user

---

## 0004 — GitHub sync via fine-grained PAT in browser

**Status:** Accepted (with caveat) · **Date:** 2026-05-27

### Context

For the cron reminders to read actual progress, the app needs to push state to a place the cron can read. Options:

- A) GitHub Contents API + user's PAT in `localStorage`
- B) Custom backend (proxy that holds the credential)
- C) GitHub App with OAuth flow
- D) No remote sync, fall back to calendar week only

(B) breaks "no backend". (C) requires an OAuth callback URL (needs hosting). (D) loses the personalisation. (A) works from `file://` because GitHub's REST API sends permissive CORS headers.

### Decision

GitHub Contents API, PAT stored in `localStorage` under a separate key (`eeq_sync`), pushed on every save (2.5s debounce). The PAT is **never** included in the synced `state.json`.

### Consequences

- ✅ Single-file app, no backend, no hosting
- ✅ Works from `file://` due to permissive GitHub CORS
- ⚠ **PAT lives in plaintext in `localStorage`** — anyone with access to the browser profile can read it
- ⚠ Mitigation: use a fine-grained PAT scoped to a single private repo with `Contents: read+write` only — blast radius if leaked is "they can overwrite your progress file"
- ⚠ Mitigation: PAT is optional. If the user opts out, the app degrades to local-only and the cron uses calendar fallback

### Caveat

If this were a multi-user product, we would not ship this design. It's acceptable for a single-user personal tool where the user understands the trade-off.

---

## 0005 — Hexagonal split: pure core + adapter shell

**Status:** Accepted · **Date:** 2026-05-27

### Context

The original brief constrained us to a single `index.html` file. Then the user added a TDD-as-standard requirement. These conflict: you can't unit-test code that lives only inside an HTML `<script>` tag bound to DOM globals.

### Decision

Extract pure logic into `lib/quest-core.js`, loaded by both the app and the test runner. The shell (`index.html`) keeps all IO (DOM, `localStorage`, `fetch`, timers). The boundary follows the functional-core / imperative-shell pattern.

What's in the core:
- Static data: `PHASES`, `BADGES`, `QUOTES`, `TASK_CATEGORIES`
- Pure helpers: `daysBetween`, `todayStr(now?)`, `isWeekComplete`, `phaseStatus`, `currentPhase`, `currentWeek`, `nextStreak`, `quoteForDay`, `earnedBadgeIds`, `defaultState(now?)`

What's in the shell:
- DOM construction / event handlers
- `localStorage` read/write
- GitHub `fetch` with PAT
- Toast, modal, confetti, theme

### Consequences

- ✅ The interesting logic is testable in isolation in a browser script tag — no DOM, no fetch, no storage
- ✅ Tests run by opening `tests/test.html`. No build, no Node
- ✅ Future shell rewrites (e.g., a different UI framework) keep the same core
- ⚠ The single-file constraint is mildly broken — the app now ships `index.html` + `lib/quest-core.js`
- ⚠ Trade-off accepted: TDD-as-standard outranks single-file purity

---

## 0006 — Accept task-data duplication across app + cron prompts

**Status:** Accepted (temporary) · **Date:** 2026-05-27

### Context

The 24-week task structure (phase names, week titles, 4 tasks per week) needs to be readable by:

1. The app (`lib/quest-core.js → PHASES`)
2. The morning cron routine prompt
3. The afternoon cron routine prompt

Options:

- A) Bake the full table into each location — three copies
- B) Have the cron routines clone the repo and parse `lib/quest-core.js` (or a derived `data.json`) at run time
- C) Store the table in a single committed `data.json` and have all three read it (app via `fetch`, prompts via `cat`)

(B) is fragile (parsing JS via shell tooling) and slow (clone every cron fire). (C) is the cleanest long-term, but means the app loses its file-protocol fetch capability without a small adjustment.

### Decision

Go with (A) for now. Update all three when tasks change. Document the coupling loudly in [`docs/architecture/`](../architecture/) and accept the manual sync.

### Consequences

- ✅ App still works from `file://` with no fetch
- ✅ Cron prompts are self-contained — no repo-parse step
- ⚠ **High dangling-wires risk:** changing a task in `quest-core.js` without updating the routine prompts will produce drift
- ⚠ Mitigation: the `docs/architecture/` doc and the project memory both flag this; any task edit MUST update three places

### Future direction

When the friction bites, migrate to (C): split data into `data/quest-data.json`. The app loads it via `fetch("data/quest-data.json")` if served over HTTP, falls back to inline if `file://`. Cron prompts use `cat data/quest-data.json` directly.
