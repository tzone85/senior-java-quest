# Operations

Runbook for the scheduled remote agents and the GitHub sync.

---

## Scheduled routines

Two cron routines run on Anthropic's remote agent infrastructure (`claude.ai/code/routines`), one repo-scoped session each.

| Routine | Schedule (UTC) | Local (SAST) | ID | URL |
|---|---|---|---|---|
| Morning Nudge | `0 6 * * *` | 08:00 daily | `trig_01J2nejch5Ub8AzmfSeGhDHu` | [view](https://claude.ai/code/routines/trig_01J2nejch5Ub8AzmfSeGhDHu) |
| Afternoon Check-in | `0 14 * * *` | 16:00 daily | `trig_011WzA6osumwnUBdDK2CqCwz` | [view](https://claude.ai/code/routines/trig_011WzA6osumwnUBdDK2CqCwz) |

Both:
- Clone this repo.
- Read `state.json` if present, else fall back to calendar week from the start date `2026-05-27`.
- Compose a personalised markdown reminder.
- Output goes to the routine page (and `claude.ai` notifications, if enabled).

### Manual run

If you want to fire a reminder now without waiting for cron:

```
# From a Claude Code session attached to this repo (or any session)
# the `RemoteTrigger` tool supports `action: "run"`:

RemoteTrigger({ action: "run", trigger_id: "trig_01J2nejch5Ub8AzmfSeGhDHu" })
```

Or use the **Run now** button in the routine UI at the URL above.

### Updating a prompt

The 24-week task table is duplicated inside each routine prompt (intentionally — see [ADR 0006](../adr/#0006-accept-task-data-duplication-across-app--cron-prompts)). When you change `PHASES` in `lib/quest-core.js`, you **must** also update both routine prompts via:

```
RemoteTrigger({ action: "update", trigger_id: "<id>", body: { job_config: { ... } } })
```

Pass the full `job_config` with the new `events[0].data.message.content`. The other fields can stay the same.

### Disabling temporarily

```
RemoteTrigger({ action: "update", trigger_id: "<id>", body: { enabled: false } })
```

### Deleting

You can't delete via the API. Use the UI: https://claude.ai/code/routines

---

## GitHub sync

Optional. Without it, reminders fall back to calendar-week computation. With it, reminders surface your *actual* week and tick status.

### Setup

1. Generate a **fine-grained PAT** at https://github.com/settings/personal-access-tokens/new
   - **Repository access:** only `tzone85/ee-java-quest`
   - **Permissions:** `Contents` → `Read and write`
   - **Expiration:** whatever you can live with (90 days is reasonable)
2. Open the app → **Settings** → **GitHub progress sync**
3. Confirm `owner`, `repo`, `branch` (defaults are correct)
4. Paste the PAT into the **GitHub personal access token (PAT)** field
5. Click **Sync now**

If it works, the status line shows `Last synced <date>` in green and `state.json` appears in the repo on the configured branch.

### What gets pushed

Only the `state` object: progress, boss battles, achievements, start date, theme, last check-in, streak. **The sync config (owner/repo/branch/token) is NEVER pushed** — it lives in a separate `localStorage` key (`eeq_sync`) that the sync function does not serialise.

### What gets pulled

Nothing. Sync is one-way: app → repo. The cron routines read the repo themselves.

### Failure modes

| Symptom | Likely cause | Fix |
|---|---|---|
| `Sync failed: HTTP 401` | PAT expired or revoked | Regenerate, paste new token |
| `Sync failed: HTTP 403` | PAT missing `Contents: write` permission | Regenerate with correct permission |
| `Sync failed: HTTP 404` | Wrong owner/repo, or PAT not scoped to this repo | Check Settings fields against the actual repo |
| `Sync failed: HTTP 409` (rare) | SHA mismatch — concurrent write | Click `Sync now` again; the app re-fetches SHA |
| Status reads "Not configured" forever | PAT field is empty | Paste the token |

### Conflict policy

If you tick something on two devices simultaneously, the **last write wins** (the second push uses the SHA from the first, so it overwrites). Acceptable for a personal tracker. If this becomes painful, add an `updatedAt` timestamp + merge logic (not currently planned).

### Rotating the PAT

1. Generate a new token (same scope)
2. App → Settings → paste over the old one
3. Click **Sync now** to verify
4. Revoke the old token at https://github.com/settings/personal-access-tokens

---

## State recovery

### Lost everything (cleared browser data)

1. Open the app on the affected device
2. Settings → **Import progress**
3. Pick the latest `state.json` from the repo (download from GitHub UI)
4. Done

### Started over by mistake

If you reset progress in the app, the **next sync** overwrites `state.json` with the empty state. To recover:

1. **Don't** click Sync now
2. Go to the repo on GitHub
3. Open `state.json` → **History** → previous revision
4. Copy the JSON, save as `state.json` locally
5. Settings → **Import progress** → pick that file
6. Then **Sync now** to push the restored state

### Reminders went stale

If a routine output references the wrong week:

1. Check Settings → sync status. Is `lastSynced` recent?
2. If not, click **Sync now**
3. Run the routine manually to verify (see "Manual run" above)
4. If still wrong, the routine prompt may need a refresh — check the `WEEK DATA` table in the prompt for parsing issues

---

## Removing the cron jobs entirely

If you ever want to stop the reminders:

1. Go to https://claude.ai/code/routines
2. Find each routine
3. Disable or delete via the UI

The repo and the app keep working without them.
