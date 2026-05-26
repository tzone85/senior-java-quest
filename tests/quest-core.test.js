/**
 * Quest Core test suite.
 *
 * Runs in any browser tab. No framework. No build. Open tests/test.html.
 * If you want to run in Node: `node tests/quest-core.test.js` (the runner
 * shim at the bottom of test.html doubles as a Node compatibility check
 * via globalThis).
 */
(function () {
  "use strict";

  const QC = (typeof window !== "undefined" ? window : globalThis).QuestCore;
  if (!QC) throw new Error("QuestCore not loaded. Include lib/quest-core.js first.");

  /* ------------- Tiny harness ------------- */
  const results = [];

  function assert(name, fn) {
    try {
      fn();
      results.push({ name, pass: true });
    } catch (e) {
      results.push({ name, pass: false, err: e && e.message ? e.message : String(e) });
    }
  }

  function eq(actual, expected, msg) {
    const a = JSON.stringify(actual);
    const b = JSON.stringify(expected);
    if (a !== b) {
      throw new Error((msg ? msg + " — " : "") + "expected " + b + ", got " + a);
    }
  }
  function truthy(v, msg) { if (!v) throw new Error(msg || "expected truthy, got " + JSON.stringify(v)); }
  function falsy(v, msg)  { if (v)  throw new Error(msg || "expected falsy, got "  + JSON.stringify(v)); }
  function throws(fn, msg) {
    let threw = false;
    try { fn(); } catch (_) { threw = true; }
    if (!threw) throw new Error(msg || "expected function to throw");
  }

  /* ------------- Fixtures ------------- */

  function blank() {
    return QC.defaultState("2026-05-27T00:00:00Z");
  }
  function withWeekComplete(s, weekId) {
    const next = JSON.parse(JSON.stringify(s));
    next.progress[weekId].tasks = [true, true, true, true];
    next.progress[weekId].complete = true;
    return next;
  }
  function withBoss(s, bossId) {
    const next = JSON.parse(JSON.stringify(s));
    next.bossBattles[bossId] = true;
    return next;
  }
  function completeAllWeeksInPhase(s, phaseId) {
    let next = s;
    const phase = QC.PHASES.find(p => p.id === phaseId);
    phase.weeks.forEach(w => { next = withWeekComplete(next, w.id); });
    return next;
  }
  function completeEverything() {
    let s = blank();
    QC.PHASES.forEach(p => { s = completeAllWeeksInPhase(s, p.id); s = withBoss(s, p.id); });
    return s;
  }

  /* ------------- daysBetween ------------- */

  assert("daysBetween: same date = 0", () => {
    eq(QC.daysBetween("2026-05-27", "2026-05-27"), 0);
  });
  assert("daysBetween: next day = 1", () => {
    eq(QC.daysBetween("2026-05-27", "2026-05-28"), 1);
  });
  assert("daysBetween: 7 days = 7", () => {
    eq(QC.daysBetween("2026-05-27", "2026-06-03"), 7);
  });
  assert("daysBetween: backwards is negative", () => {
    eq(QC.daysBetween("2026-05-28", "2026-05-27"), -1);
  });

  /* ------------- todayStr ------------- */

  assert("todayStr: ISO format YYYY-MM-DD with injected date", () => {
    eq(QC.todayStr("2026-05-27T14:30:00Z"), "2026-05-27");
  });
  assert("todayStr: deterministic across calls when 'now' is passed", () => {
    eq(QC.todayStr("2026-05-27T00:00:00Z"), QC.todayStr("2026-05-27T23:59:59Z"));
  });

  /* ------------- defaultState ------------- */

  assert("defaultState: all 24 weeks present", () => {
    const s = blank();
    eq(Object.keys(s.progress).sort(), Array.from({length: 24}, (_, i) => "w" + (i + 1)).sort());
  });
  assert("defaultState: every week starts empty", () => {
    const s = blank();
    for (let i = 1; i <= 24; i++) {
      eq(s.progress["w" + i].tasks, [false, false, false, false]);
      eq(s.progress["w" + i].complete, false);
      eq(s.progress["w" + i].reflection, "");
    }
  });
  assert("defaultState: bossBattles p1..p5 all false", () => {
    eq(blank().bossBattles, { p1: false, p2: false, p3: false, p4: false, p5: false });
  });
  assert("defaultState: empty achievements + zero streak", () => {
    const s = blank();
    eq(s.achievements, []);
    eq(s.streak, 0);
    eq(s.lastCheckIn, null);
  });
  assert("defaultState: startDate reflects injected 'now'", () => {
    eq(QC.defaultState("2026-08-15T00:00:00Z").startDate, "2026-08-15");
  });

  /* ------------- isWeekComplete ------------- */

  assert("isWeekComplete: false on blank state", () => {
    falsy(QC.isWeekComplete(blank(), "w1"));
  });
  assert("isWeekComplete: true after marking", () => {
    truthy(QC.isWeekComplete(withWeekComplete(blank(), "w1"), "w1"));
  });
  assert("isWeekComplete: safe against missing week id", () => {
    falsy(QC.isWeekComplete(blank(), "w999"));
  });
  assert("isWeekComplete: safe against null state", () => {
    falsy(QC.isWeekComplete(null, "w1"));
    falsy(QC.isWeekComplete({}, "w1"));
  });

  /* ------------- phaseWeeksComplete / phaseAllWeeksComplete ------------- */

  assert("phaseWeeksComplete: 0 on blank", () => {
    eq(QC.phaseWeeksComplete(blank(), QC.PHASES[0]), 0);
  });
  assert("phaseWeeksComplete: counts ticked weeks", () => {
    let s = blank();
    s = withWeekComplete(s, "w1");
    s = withWeekComplete(s, "w2");
    eq(QC.phaseWeeksComplete(s, QC.PHASES[0]), 2);
  });
  assert("phaseAllWeeksComplete: false until every week is ticked", () => {
    let s = blank();
    falsy(QC.phaseAllWeeksComplete(s, QC.PHASES[0]));
    s = completeAllWeeksInPhase(s, "p1");
    truthy(QC.phaseAllWeeksComplete(s, QC.PHASES[0]));
  });

  /* ------------- phaseStatus ------------- */

  assert("phaseStatus: p1 = Ready on blank state", () => {
    eq(QC.phaseStatus(blank(), QC.PHASES[0]).key, "in-progress");
    eq(QC.phaseStatus(blank(), QC.PHASES[0]).label, "Ready");
  });
  assert("phaseStatus: p2..p5 = Locked on blank state", () => {
    eq(QC.phaseStatus(blank(), QC.PHASES[1]).key, "locked");
    eq(QC.phaseStatus(blank(), QC.PHASES[4]).key, "locked");
  });
  assert("phaseStatus: p1 = In Progress with partial weeks", () => {
    const s = withWeekComplete(blank(), "w1");
    eq(QC.phaseStatus(s, QC.PHASES[0]).label, "In Progress");
  });
  assert("phaseStatus: Boss Unlocked when all weeks done, boss not", () => {
    const s = completeAllWeeksInPhase(blank(), "p1");
    eq(QC.phaseStatus(s, QC.PHASES[0]).key, "boss-unlocked");
  });
  assert("phaseStatus: Complete when all weeks + boss done", () => {
    let s = completeAllWeeksInPhase(blank(), "p1");
    s = withBoss(s, "p1");
    eq(QC.phaseStatus(s, QC.PHASES[0]).key, "complete");
  });
  assert("phaseStatus: p2 = Ready once p1 fully complete", () => {
    let s = completeAllWeeksInPhase(blank(), "p1");
    s = withBoss(s, "p1");
    eq(QC.phaseStatus(s, QC.PHASES[1]).label, "Ready");
  });

  /* ------------- aggregations ------------- */

  assert("totalWeeksComplete: 0 on blank", () => {
    eq(QC.totalWeeksComplete(blank()), 0);
  });
  assert("totalWeeksComplete: 4 after completing p1 weeks", () => {
    const s = completeAllWeeksInPhase(blank(), "p1");
    eq(QC.totalWeeksComplete(s), 4);
  });
  assert("totalWeeksComplete: 24 when everything is done", () => {
    eq(QC.totalWeeksComplete(completeEverything()), 24);
  });
  assert("totalBossesComplete: 0 on blank, 5 when full", () => {
    eq(QC.totalBossesComplete(blank()), 0);
    eq(QC.totalBossesComplete(completeEverything()), 5);
  });
  assert("totalBadgesEarned: 0 on blank", () => {
    eq(QC.totalBadgesEarned(blank()), 0);
  });

  /* ------------- allDone ------------- */

  assert("allDone: false on blank", () => {
    falsy(QC.allDone(blank()));
  });
  assert("allDone: false with weeks done but bosses pending", () => {
    let s = blank();
    QC.PHASES.forEach(p => { s = completeAllWeeksInPhase(s, p.id); });
    falsy(QC.allDone(s));
  });
  assert("allDone: true with weeks + bosses done", () => {
    truthy(QC.allDone(completeEverything()));
  });

  /* ------------- currentWeek / currentPhase ------------- */

  assert("currentWeek: w1 on blank", () => {
    eq(QC.currentWeek(blank()).week.id, "w1");
  });
  assert("currentWeek: w2 after w1 done", () => {
    const s = withWeekComplete(blank(), "w1");
    eq(QC.currentWeek(s).week.id, "w2");
  });
  assert("currentWeek: w5 after all of p1 weeks done", () => {
    const s = completeAllWeeksInPhase(blank(), "p1");
    eq(QC.currentWeek(s).week.id, "w5");
  });
  assert("currentWeek: walks all the way to w24", () => {
    let s = blank();
    for (let i = 1; i <= 23; i++) s = withWeekComplete(s, "w" + i);
    eq(QC.currentWeek(s).week.id, "w24");
  });
  assert("currentPhase: p1 on blank", () => {
    eq(QC.currentPhase(blank()).id, "p1");
  });
  assert("currentPhase: p2 after p1 fully complete", () => {
    let s = completeAllWeeksInPhase(blank(), "p1");
    s = withBoss(s, "p1");
    eq(QC.currentPhase(s).id, "p2");
  });

  /* ------------- nextStreak ------------- */

  assert("nextStreak: first check-in starts streak at 1", () => {
    eq(QC.nextStreak(0, null, "2026-05-27"), { streak: 1, lastCheckIn: "2026-05-27" });
  });
  assert("nextStreak: same-day check-in is a no-op", () => {
    eq(QC.nextStreak(3, "2026-05-27", "2026-05-27"), { streak: 3, lastCheckIn: "2026-05-27" });
  });
  assert("nextStreak: next-day check-in increments", () => {
    eq(QC.nextStreak(3, "2026-05-27", "2026-05-28"), { streak: 4, lastCheckIn: "2026-05-28" });
  });
  assert("nextStreak: gap of >1 day resets to 1", () => {
    eq(QC.nextStreak(7, "2026-05-27", "2026-05-30"), { streak: 1, lastCheckIn: "2026-05-30" });
  });

  /* ------------- earnedBadgeIds ------------- */

  assert("earnedBadgeIds: empty on blank state", () => {
    eq(QC.earnedBadgeIds(blank()), []);
  });
  assert("earnedBadgeIds: redLight + greenLight after w2 complete", () => {
    const s = withWeekComplete(blank(), "w2");
    const ids = QC.earnedBadgeIds(s);
    truthy(ids.includes("redLight"));
    truthy(ids.includes("greenLight"));
  });
  assert("earnedBadgeIds: refactor after w3", () => {
    truthy(QC.earnedBadgeIds(withWeekComplete(blank(), "w3")).includes("refactor"));
  });
  assert("earnedBadgeIds: cart after p1 boss", () => {
    truthy(QC.earnedBadgeIds(withBoss(blank(), "p1")).includes("cart"));
  });
  assert("earnedBadgeIds: equalExpert only when everything done", () => {
    falsy(QC.earnedBadgeIds(blank()).includes("equalExpert"));
    truthy(QC.earnedBadgeIds(completeEverything()).includes("equalExpert"));
  });
  assert("earnedBadgeIds: completing everything earns all 10", () => {
    eq(QC.earnedBadgeIds(completeEverything()).length, 10);
  });

  /* ------------- quoteForDay ------------- */

  assert("quoteForDay: index 0 returns first quote", () => {
    eq(QC.quoteForDay(0), QC.QUOTES[0]);
  });
  assert("quoteForDay: wraps around modulo QUOTES.length", () => {
    eq(QC.quoteForDay(QC.QUOTES.length), QC.QUOTES[0]);
    eq(QC.quoteForDay(QC.QUOTES.length + 3), QC.QUOTES[3]);
  });
  assert("quoteForDay: negative input still safe", () => {
    truthy(QC.quoteForDay(-1));
    truthy(QC.quoteForDay(-1).t);
  });

  /* ------------- findPhaseForWeek ------------- */

  assert("findPhaseForWeek: w1 → p1", () => {
    eq(QC.findPhaseForWeek("w1").id, "p1");
  });
  assert("findPhaseForWeek: w13 → p3", () => {
    eq(QC.findPhaseForWeek("w13").id, "p3");
  });
  assert("findPhaseForWeek: w24 → p5", () => {
    eq(QC.findPhaseForWeek("w24").id, "p5");
  });

  /* ------------- shape sanity ------------- */

  assert("PHASES: 5 phases", () => eq(QC.PHASES.length, 5));
  assert("PHASES: each has 4–6 weeks", () => {
    QC.PHASES.forEach(p => {
      truthy(p.weeks.length >= 4 && p.weeks.length <= 6, p.id + " has " + p.weeks.length + " weeks");
    });
  });
  assert("PHASES: 24 weeks total", () => {
    eq(QC.allWeeks().length, 24);
  });
  assert("PHASES: every week has exactly 4 tasks", () => {
    QC.allWeeks().forEach(w => eq(w.tasks.length, 4, w.id));
  });
  assert("BADGES: exactly 10", () => eq(QC.BADGES.length, 10));

  /* ------------- Export results for the renderer ------------- */
  (typeof window !== "undefined" ? window : globalThis).__QUEST_TEST_RESULTS__ = results;
})();
