/**
 * EE Java Quest — pure core
 * --------------------------------------------------------------
 * No DOM. No localStorage. No fetch. No timers. No globals
 * beyond the namespace export. Everything below is a deterministic
 * function of its arguments — which is what makes it testable.
 *
 * Exposed via `window.QuestCore` for non-module browser loading.
 */
(function (root) {
  "use strict";

  /* =====================
     Static data
     ===================== */

  const QUOTES = [
    { t: "Make it work, make it right, make it fast.", a: "Kent Beck" },
    { t: "I'm not a great programmer; I'm just a good programmer with great habits.", a: "Kent Beck" },
    { t: "TDD is not about testing; it's about design.", a: "Kent Beck" },
    { t: "First make the change easy, then make the easy change.", a: "Kent Beck" },
    { t: "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.", a: "Martin Fowler" },
    { t: "Refactoring is a controlled technique for improving the design of an existing code base.", a: "Martin Fowler" },
    { t: "The only way to go fast is to go well.", a: "Robert C. Martin" },
    { t: "Truth can only be found in one place: the code.", a: "Robert C. Martin" },
    { t: "Continuous delivery is the ability to get changes of all types into production safely and quickly in a sustainable way.", a: "Dave Farley" },
    { t: "Software engineering is the application of an empirical, scientific approach to finding efficient, economic solutions to practical problems in software.", a: "Dave Farley" },
    { t: "Clean code always looks like it was written by someone who cares.", a: "Robert C. Martin" },
    { t: "Programs must be written for people to read, and only incidentally for machines to execute.", a: "Harold Abelson" },
    { t: "Simplicity is prerequisite for reliability.", a: "Edsger Dijkstra" }
  ];

  const TASK_CATEGORIES = [
    { key: "reading",     label: "O'Reilly reading" },
    { key: "pluralsight", label: "Pluralsight course" },
    { key: "coding",      label: "Coding / kata / project" },
    { key: "youtube",     label: "YouTube / AlgoExpert" }
  ];

  const PHASES = [
    {
      id: "p1", num: "Phase 1", name: "The TDD Awakening", range: "Weeks 1–4", color: "#7C3AED",
      boss: {
        title: "Fully TDD'd Shopping Cart",
        desc: "Build a shopping cart end-to-end with TDD. Every behaviour driven by a failing test first."
      },
      weeks: [
        { id: "w1", n: 1, title: "Java Sharpening & Tooling Setup", tasks: [
          "Read 'Effective Java' Ch 1–2 (Bloch)",
          "Pluralsight: Java Fundamentals — modern syntax & build tools",
          "Set up IntelliJ + Maven/Gradle; write first JUnit 5 test",
          "Watch a Java 21 features overview on YouTube"
        ]},
        { id: "w2", n: 2, title: "TDD — Red, Green, Refactor", tasks: [
          "Read 'Test-Driven Development by Example' Ch 1–5 (Kent Beck)",
          "Pluralsight: TDD with JUnit 5",
          "FizzBuzz + String Calculator katas, strictly Red-Green-Refactor",
          "Watch Kent Beck's TDD demo talk"
        ]},
        { id: "w3", n: 3, title: "Kata Immersion", tasks: [
          "Read 'Growing Object-Oriented Software' Ch 1–3 (Freeman & Pryce)",
          "Pluralsight: Refactoring fundamentals",
          "Bowling Game + Roman Numerals + Mars Rover katas",
          "Watch Coding Dojo recordings on YouTube"
        ]},
        { id: "w4", n: 4, title: "Mocking, Stubs & Testing Patterns", tasks: [
          "Read 'Working Effectively with Unit Tests' Ch 1–4 (Jay Fields)",
          "Pluralsight: Mockito Fundamentals",
          "Rebuild a kata using mocks, stubs and fakes",
          "Watch 'Test Doubles Explained' (Martin Fowler talk)"
        ]}
      ]
    },
    {
      id: "p2", num: "Phase 2", name: "Spring Boot & The Backend Craft", range: "Weeks 5–9", color: "#0EA5E9",
      boss: {
        title: "Production-Ready REST API on GitHub",
        desc: "Ship a Spring Boot REST API with tests, persistence, validation, error handling and a clean README."
      },
      weeks: [
        { id: "w5", n: 5, title: "Spring Boot Foundations", tasks: [
          "Read 'Spring Boot in Action' Ch 1–2",
          "Pluralsight: Spring Boot Getting Started",
          "Build a Spring Boot app with DI + auto-config exploration",
          "Watch 'Spring Boot in 100 Minutes' on YouTube"
        ]},
        { id: "w6", n: 6, title: "REST APIs Done Right", tasks: [
          "Read 'REST in Practice' Ch 1–4",
          "Pluralsight: Building REST APIs with Spring",
          "Build CRUD endpoints with validation + global error handling",
          "Watch a talk on REST API best practices"
        ]},
        { id: "w7", n: 7, title: "Databases — JPA, Hibernate & SQL", tasks: [
          "Read selected chapters of 'Java Persistence with Hibernate'",
          "Pluralsight: Spring Data JPA Fundamentals",
          "Persist entities + Testcontainers integration tests",
          "Watch a Hibernate internals deep dive"
        ]},
        { id: "w8", n: 8, title: "Testing the Spring Stack", tasks: [
          "Read 'Spring in Action' testing chapter",
          "Pluralsight: Testing Spring Boot Applications",
          "Write MockMvc + @SpringBootTest + slice tests",
          "Watch a talk on the Spring testing pyramid"
        ]},
        { id: "w9", n: 9, title: "Code Quality & Craft", tasks: [
          "Read 'Clean Code' Ch 1–4 (Uncle Bob)",
          "Pluralsight: Refactoring to Patterns",
          "Run SonarLint + refactor code smells in your API",
          "Watch a Clean Code talk by Robert C. Martin"
        ]}
      ]
    },
    {
      id: "p3", num: "Phase 3", name: "Distributed Systems & Cloud", range: "Weeks 10–14", color: "#10B981",
      boss: {
        title: "Docker + GitHub Actions CI Pipeline",
        desc: "Containerise your service and ship a green CI pipeline that builds, tests and pushes the image."
      },
      weeks: [
        { id: "w10", n: 10, title: "Microservices Architecture", tasks: [
          "Read 'Building Microservices' Ch 1–3 (Sam Newman)",
          "Pluralsight: Microservices Architecture",
          "Split a monolith into two services with REST calls",
          "Watch a microservices patterns talk by Chris Richardson"
        ]},
        { id: "w11", n: 11, title: "Docker", tasks: [
          "Read 'Docker Deep Dive' Ch 1–4",
          "Pluralsight: Docker Fundamentals",
          "Containerise your Spring Boot app + docker-compose stack",
          "Watch a Docker networking explainer"
        ]},
        { id: "w12", n: 12, title: "Messaging & Events", tasks: [
          "Read 'Designing Event-Driven Systems' (Ben Stopford)",
          "Pluralsight: Apache Kafka Fundamentals",
          "Wire a Kafka producer/consumer in Spring",
          "Watch a Kafka deep dive on YouTube"
        ]},
        { id: "w13", n: 13, title: "CI/CD Pipelines", tasks: [
          "Read 'Continuous Delivery' Ch 1–4 (Dave Farley)",
          "Pluralsight: GitHub Actions Fundamentals",
          "Build a CI workflow: tests + lint + container build",
          "Watch a Dave Farley CI/CD episode"
        ]},
        { id: "w14", n: 14, title: "Cloud Fundamentals & System Design", tasks: [
          "Read 'Designing Data-Intensive Applications' Ch 1–2",
          "Pluralsight: System Design Fundamentals",
          "Deploy a service to AWS free tier (ECS or EB)",
          "Watch an AlgoExpert system design walkthrough"
        ]}
      ]
    },
    {
      id: "p4", num: "Phase 4", name: "Pair Programming & Consultancy Polish", range: "Weeks 15–20", color: "#F97316",
      boss: {
        title: "Full EE Mock Interview — All 4 Rounds",
        desc: "Run a complete Equal Experts-style mock: tech screen, pairing, consultancy chat and architecture deep dive."
      },
      weeks: [
        { id: "w15", n: 15, title: "The Art of Pair Programming (Part 1)", tasks: [
          "Read 'Pair Programming Illuminated' Ch 1–4",
          "Pluralsight: Effective Pairing",
          "Pair on a kata via Live Share or Code With Me",
          "Watch a recorded pairing session on YouTube"
        ]},
        { id: "w16", n: 16, title: "The Art of Pair Programming (Part 2)", tasks: [
          "Read 'Pair Programming Illuminated' Ch 5–end",
          "Pluralsight: Advanced Pairing Techniques",
          "Driver/Navigator rotation kata with a peer",
          "Watch a mob programming session"
        ]},
        { id: "w17", n: 17, title: "Consultancy Mindset (Part 1)", tasks: [
          "Read 'The Trusted Advisor' Ch 1–5",
          "Pluralsight: Consulting Fundamentals",
          "Run a mock client requirements-gathering exercise",
          "Watch a ThoughtWorks consultancy talk"
        ]},
        { id: "w18", n: 18, title: "Consultancy Mindset (Part 2)", tasks: [
          "Read 'The Trusted Advisor' Ch 6–end",
          "Pluralsight: Stakeholder Communication",
          "Write an ADR (Architecture Decision Record) for a past project",
          "Watch a tech leadership / influence talk"
        ]},
        { id: "w19", n: 19, title: "Architecture Deep Dives (Part 1)", tasks: [
          "Read 'Software Architecture: The Hard Parts' Ch 1–5",
          "Pluralsight: Architecture Patterns",
          "Diagram your system using the C4 model",
          "Watch a Mark Richards architecture session"
        ]},
        { id: "w20", n: 20, title: "Architecture Deep Dives (Part 2)", tasks: [
          "Read 'Software Architecture: The Hard Parts' Ch 6–end",
          "Pluralsight: Distributed Systems Design",
          "Whiteboard a system design dry-run on a real problem",
          "Watch a Software Engineering Daily episode"
        ]}
      ]
    },
    {
      id: "p5", num: "Phase 5", name: "Portfolio, Application & Final Sprint", range: "Weeks 21–24", color: "#EF4444",
      boss: {
        title: "Apply to Equal Experts — Get the Offer",
        desc: "Submit the application, tailor the cover letter, prep the interview loop, land the offer."
      },
      weeks: [
        { id: "w21", n: 21, title: "Portfolio Audit & Polish", tasks: [
          "Read 'The Pragmatic Programmer' Ch 1–3",
          "Pluralsight: GitHub for Developers",
          "Polish 3 portfolio repos: READMEs, tests, CI badges",
          "Watch a GitHub portfolio walkthrough"
        ]},
        { id: "w22", n: 22, title: "CV & LinkedIn Polish", tasks: [
          "Read CV chapter from 'Cracking the Coding Career'",
          "Pluralsight: LinkedIn for Developers",
          "Rewrite CV + overhaul LinkedIn profile",
          "Watch a tech CV review session on YouTube"
        ]},
        { id: "w23", n: 23, title: "Final Mock Interview", tasks: [
          "Read selected chapters of 'Cracking the Coding Interview'",
          "Pluralsight: Behavioural Interview Prep",
          "Run two timed mock interviews with a peer",
          "Solve 3 AlgoExpert system design problems"
        ]},
        { id: "w24", n: 24, title: "Application & Final Preparation", tasks: [
          "Deep-read the Equal Experts blog + careers page",
          "Pluralsight: Salary Negotiation",
          "Submit application + tailored cover letter",
          "Watch Equal Experts talks/podcasts on YouTube"
        ]}
      ]
    }
  ];

  /* =====================
     Pure helpers
     ===================== */

  function todayStr(now) {
    const d = now ? new Date(now) : new Date();
    return d.toISOString().slice(0, 10);
  }

  function daysBetween(a, b) {
    const A = new Date(a), B = new Date(b);
    A.setHours(0, 0, 0, 0);
    B.setHours(0, 0, 0, 0);
    return Math.round((B - A) / 86400000);
  }

  function isWeekComplete(state, weekId) {
    return !!(state && state.progress && state.progress[weekId] && state.progress[weekId].complete);
  }

  function allWeeks() {
    return PHASES.flatMap(p => p.weeks);
  }

  function phaseWeeksComplete(state, phase) {
    return phase.weeks.filter(w => isWeekComplete(state, w.id)).length;
  }

  function phaseAllWeeksComplete(state, phase) {
    return phase.weeks.every(w => isWeekComplete(state, w.id));
  }

  function phaseStatus(state, phase) {
    const allWeeksDone = phaseAllWeeksComplete(state, phase);
    const bossDone = !!(state && state.bossBattles && state.bossBattles[phase.id]);
    if (allWeeksDone && bossDone) return { key: "complete", label: "Complete" };
    if (allWeeksDone) return { key: "boss-unlocked", label: "Boss Unlocked" };
    if (phaseWeeksComplete(state, phase) > 0) return { key: "in-progress", label: "In Progress" };
    const idx = PHASES.findIndex(p => p.id === phase.id);
    if (idx === 0) return { key: "in-progress", label: "Ready" };
    const prev = PHASES[idx - 1];
    const prevDone = phaseAllWeeksComplete(state, prev) && state && state.bossBattles && state.bossBattles[prev.id];
    return prevDone ? { key: "in-progress", label: "Ready" } : { key: "locked", label: "Locked" };
  }

  function totalWeeksComplete(state) {
    return allWeeks().filter(w => isWeekComplete(state, w.id)).length;
  }

  function totalBossesComplete(state) {
    return state && state.bossBattles
      ? Object.values(state.bossBattles).filter(Boolean).length
      : 0;
  }

  function totalBadgesEarned(state) {
    return state && Array.isArray(state.achievements) ? state.achievements.length : 0;
  }

  function allDone(state) {
    return totalWeeksComplete(state) === 24 && totalBossesComplete(state) === 5;
  }

  function findPhaseForWeek(weekId) {
    return PHASES.find(p => p.weeks.some(w => w.id === weekId));
  }

  function currentPhase(state) {
    for (const p of PHASES) {
      if (phaseStatus(state, p).key !== "complete") return p;
    }
    return PHASES[PHASES.length - 1];
  }

  function currentWeek(state) {
    for (const p of PHASES) {
      for (const w of p.weeks) {
        if (!isWeekComplete(state, w.id)) return { phase: p, week: w };
      }
    }
    const last = PHASES[PHASES.length - 1];
    return { phase: last, week: last.weeks[last.weeks.length - 1] };
  }

  function defaultState(now) {
    const progress = {};
    PHASES.forEach(p => p.weeks.forEach(w => {
      progress[w.id] = { tasks: [false, false, false, false], reflection: "", complete: false };
    }));
    return {
      progress,
      bossBattles: { p1: false, p2: false, p3: false, p4: false, p5: false },
      achievements: [],
      startDate: todayStr(now),
      theme: "dark",
      lastCheckIn: null,
      streak: 0
    };
  }

  /* Badges depend on the pure helpers above. */
  const BADGES = [
    { id: "redLight",    name: "Red Light",        icon: "🔴", desc: "Wrote your first failing test.",          check: s => isWeekComplete(s, "w2") },
    { id: "greenLight",  name: "Green Light",      icon: "🟢", desc: "Made the failing test pass.",             check: s => isWeekComplete(s, "w2") },
    { id: "refactor",    name: "Refactor Hero",    icon: "🛠️", desc: "Cleaned it up without breaking it.",      check: s => isWeekComplete(s, "w3") },
    { id: "cart",        name: "Cart Conqueror",   icon: "🛒", desc: "Phase 1 boss defeated.",                  check: s => !!(s && s.bossBattles && s.bossBattles.p1) },
    { id: "api",         name: "API Architect",    icon: "🌐", desc: "Phase 2 boss defeated.",                  check: s => !!(s && s.bossBattles && s.bossBattles.p2) },
    { id: "whale",       name: "Whale Whisperer",  icon: "🐳", desc: "Tamed Docker. Week 11 complete.",         check: s => isWeekComplete(s, "w11") },
    { id: "pipeline",    name: "Pipeline Pro",     icon: "⚙️", desc: "Shipped a CI pipeline. Week 13 complete.",check: s => isWeekComplete(s, "w13") },
    { id: "pair",        name: "Pair Magician",    icon: "🧙", desc: "Pair programming, mastered.",             check: s => isWeekComplete(s, "w16") },
    { id: "consultant",  name: "Consultant Voice", icon: "🎙️", desc: "Speaks fluent client.",                   check: s => isWeekComplete(s, "w18") },
    { id: "equalExpert", name: "Equal Expert",     icon: "👑", desc: "All 24 weeks. All 5 bosses. The offer.",  check: s => allDone(s) }
  ];

  /* Streak: pure transition function. Given prior state and a check-in date,
     return the new {streak, lastCheckIn}. */
  function nextStreak(prevStreak, prevLastCheckIn, todayDateStr) {
    if (prevLastCheckIn === todayDateStr) {
      return { streak: prevStreak, lastCheckIn: prevLastCheckIn };
    }
    if (!prevLastCheckIn) {
      return { streak: 1, lastCheckIn: todayDateStr };
    }
    const diff = daysBetween(prevLastCheckIn, todayDateStr);
    if (diff === 1) return { streak: prevStreak + 1, lastCheckIn: todayDateStr };
    if (diff > 1) return { streak: 1, lastCheckIn: todayDateStr };
    return { streak: prevStreak, lastCheckIn: prevLastCheckIn };
  }

  /* Quote selection by elapsed days (used by app + cron). */
  function quoteForDay(dayIndex) {
    const safe = ((dayIndex % QUOTES.length) + QUOTES.length) % QUOTES.length;
    return QUOTES[safe];
  }

  /* Compute achievement diff: given current state, return the list of badge
     ids the state earns. Caller decides what to do with newly unlocked ones. */
  function earnedBadgeIds(state) {
    return BADGES.filter(b => b.check(state)).map(b => b.id);
  }

  /* =====================
     Export
     ===================== */
  root.QuestCore = {
    PHASES, BADGES, QUOTES, TASK_CATEGORIES,
    todayStr, daysBetween,
    isWeekComplete, allWeeks, findPhaseForWeek,
    phaseWeeksComplete, phaseAllWeeksComplete, phaseStatus,
    totalWeeksComplete, totalBossesComplete, totalBadgesEarned, allDone,
    currentPhase, currentWeek,
    defaultState, nextStreak, quoteForDay, earnedBadgeIds
  };
})(typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this));
