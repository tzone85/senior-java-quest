# Contributing

> This is a single-user personal tracker. "Contributing" here mostly means **Future-Thando, six weeks from now, wondering how to add a feature without breaking the cron reminders**.

## Ground rules

1. **TDD for anything in `lib/quest-core.js`.** Write a failing test in `tests/quest-core.test.js` first, watch it fail in `tests/test.html`, then implement. See [`docs/testing/`](docs/testing/).
2. **No IO in the core.** If a helper wants `Date.now()`, accept it as a parameter. If it wants `localStorage`, it belongs in the shell (`index.html`).
3. **No `innerHTML` assignments.** Use the `el(tag, opts, children)` helper or DOM API directly. The repo has a hook that blocks `innerHTML = ...`.
4. **Update all three places when task data changes.** `PHASES` in `lib/quest-core.js` is duplicated into the two cron routine prompts. See [ADR 0006](docs/adr/#0006-accept-task-data-duplication-across-app--cron-prompts).
5. **No frameworks, no npm dependencies.** The app must keep working by opening `index.html` directly.

## Workflow

```
1. Branch:   git checkout -b feat/whatever
2. Test:     write failing assertion in tests/quest-core.test.js
3. Verify:   open tests/test.html — see red
4. Code:     implement in lib/quest-core.js or index.html
5. Verify:   tests green + open index.html, exercise manually
6. ADR:      if it's a material decision, append a section to docs/adr/README.md
7. Commit:   conventional commit (feat:, fix:, refactor:, docs:, test:, chore:)
8. Push:     git push -u origin <branch>
9. PR:       gh pr create --fill
```

## File ownership

| File / dir | What lives there |
|---|---|
| `index.html` | DOM, event handlers, theme, toast, modal, confetti, `localStorage` IO, GitHub sync |
| `lib/quest-core.js` | Pure data + pure helpers + state machine. **No DOM, no fetch, no storage** |
| `tests/` | Browser-runnable unit tests against the core |
| `docs/` | All documentation. Each topic is a subfolder with a `README.md` |
| `docs/diagrams/` | Mermaid sources (`.mmd`) and rendered SVGs |
| `docs/adr/` | Architecture decision records (single file, numbered sections) |
| `CHANGELOG` | We don't keep one — `git log` is the changelog |

## Diagrams

Diagrams are committed both as Mermaid source and as rendered SVG. The SVG is what gets embedded in docs (so GitHub renders it consistently in any theme).

Render after any change:

```bash
cd docs/diagrams && for f in *.mmd; do mmdc -i "$f" -o "${f%.mmd}.svg" -b transparent; done
```

Requires `@mermaid-js/mermaid-cli` (install globally: `npm i -g @mermaid-js/mermaid-cli`).

## Cron routines

If you change the schedule, the task data, or the tone of the reminders, update the routine config via `RemoteTrigger update`. See [`docs/operations/`](docs/operations/) for the exact payload shape and routine IDs.

## Memory and personal context

`lib/quest-core.js` defaults to `tzone85/senior-java-quest` for sync. If you fork this for your own quest:

1. Change the GitHub owner/repo in the app Settings (or default in `defaultSyncConfig()`).
2. Update the routine prompts' `https://github.com/...` references.
3. Update the quest start date in both routine prompts (currently `2026-05-27`).
