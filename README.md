# UMD Degree Planner

A semester-by-semester planner for UMD students. It audits requirements for CS, Math and the Robotics minor, plus GenEd and university rules, and enforces the double-counting limits between programs.

```sh
npm install
npm run dev            # http://localhost:5173
npm test               # engine tests
npm run fetch-courses  # refresh public/courses.json (Jupiterp + umd.io history; FULL=1 rebuilds every semester)
```

## Design

The UI follows the Caustic design system: an eggshell (light) or charcoal (dark) ground, Mona Sans and Geist Mono (self-hosted in `src/fonts/`, SIL Open Font License), tick meters for progress, and one accent colour. Light, dark or auto, and the accent (red, blue, forest, royal) are under the ⋯ menu → Appearance; the choice is saved in `degreeplan.theme`.

## Views

- **Degree**: one page per program (major, minor, GenEd, university rules).
  - Requirements show as tiles colored by status: done, in progress, planned or open.
  - **Open slots** list the soonest courses that fill them and what else each would count toward. Add one to any term; the term picker says whether that term works.
  - **GenEd slots** suggest courses that cover several open GenEds at once.
  - **Rules across requirements:** the CS area distribution, sequences and depth pairs, and sharing limits.
- **Semesters**: the per-term table.
  - **Course search:** type a code or a title.
  - **Course details:** click a course for prerequisites, offering history and where it counts.
  - **Rows:** drag a row by its handle to another term; status menu; row menu with Move to / Remove.
  - **Layout:** resizable columns. The requirements sidebar highlights a requirement's courses when you click it, and can be hidden.
- **Flowchart**: courses by term with prerequisite arrows.
  - **Drag** a planned course or a dashed option onto a term. The column turns green, amber or red, and a note by the cursor explains why (prerequisites, offering, courses it would break, credit load).
  - **Click** a course for Earlier/Later moves, a Move to menu, the effect of dropping it, swap options with a requirement diff, and what it leads to.
  - **Explore any course** to see the prerequisite path to it.
- **Compare**: plans side by side. Use the plan menu to duplicate the current plan and try an alternative.

Every change can be undone (⌘Z / ⌘⇧Z, or Undo in the notice that appears).

## Where data lives

- **Plans** are saved in this browser's localStorage under `degreeplan.v2`. That key holds all plans; the older `degreeplan.v1` is only read once, for migration. Nothing is uploaded. Storage is per browser and per address (port).
- **Export / Load** writes and reads every plan as one JSON file. Loading an older single-plan export replaces only the current plan.
- **Course catalog:** `public/courses.json`, a static file fetched on page load (the browser caches it). Built by `npm run fetch-courses`.
  - The script reads the last 4 years of schedules from umd.io, working out the term list itself. umd.io is slow, so it only re-downloads the 3 newest terms and any term missing from the current file; older terms are reused from it.
  - `p` is the prerequisite text. `src/prereqs.ts` parses it into and/or trees; course-free alternatives such as permission or placement are dropped.
  - `t` lists the semesters the course appeared on the schedule (umd.io, 2023 on). It drives the offering warnings. Without it, offerings show as unknown.

## Deploying

Everything runs in the browser, so the site is static files on GitHub Pages.

- **Deploy** (`.github/workflows/deploy.yml`): every push to `main` runs the tests, builds and publishes `dist/`. It can also be run by hand.
- **Refresh course catalog** (`.github/workflows/refresh-catalog.yml`): on the 1st and 15th of each month it runs `fetch-courses`, tests and builds. If the catalog changed it commits it to `main` and deploys. Run it by hand from the Actions tab, with "full" ticked to re-fetch every semester.
- **CI** (`.github/workflows/ci.yml`): tests and builds every pull request.
- One-time setup: in the repo's Settings → Pages, set Source to "GitHub Actions". For a custom domain such as `degreeplan.example.com`, enter it there and add a DNS `CNAME` record pointing at `<user>.github.io`. The build uses relative paths, so it works at a subdomain or a subpath.

## Programs encoded

| Program | Tracks | Spec |
|---|---|---|
| Computer Science B.S. | General, Cybersecurity, Data Science, Machine Learning, Quantum Information | [docs/research/cs-major.md](docs/research/cs-major.md) |
| Mathematics B.S. | Applied, Traditional, Statistics | [docs/research/math-major.md](docs/research/math-major.md) |
| Robotics & Autonomous Systems minor | — | [docs/research/ras-minor.md](docs/research/ras-minor.md) |
| GenEd + university rules | — | [docs/research/gened-and-university.md](docs/research/gened-and-university.md) |

All encodings follow the 2025-26 catalog. The research found no requirement changes in 2026-27.

## How the audit works

The requirement definitions live in `src/programs/*.ts`. Each requirement is written as one of the following:
- a **bucket**: courses matching a filter, with a minimum course and/or credit count;
- a **constraint** over buckets, of one of these kinds:
  - `minFrom` / `maxFrom`;
  - `distinct`: "≥ 3 different areas";
  - `anySet`: one of N sequences or depth pairs;
  - `within`: SCIS must ride on a DS slot;
  - `outsideMajors`: ≥ 1 DSSP outside the majors.
- a **sharing rule** between programs: at most 2 courses shared between a minor and the majors, and none shared between two minors.

`src/engine/solver.ts` turns everything into a small integer program and solves it with HiGHS (WASM). Each run finds the assignment of courses to requirements that leaves the fewest requirements unmet. It never breaks a hard rule:
- each course counts once per program;
- caps such as "≤ 3 per area" and "≤ 3 STIC credits" hold;
- the minor overlap limit holds;
- a course listed as "X or Y" GenEds uses only one of them.

Every result is then re-checked directly from the chosen assignment.

### Rules that are easy to get wrong
- **CS areas:** 5 courses covering at least 3 areas, at most 3 from any one area. CMSC471 counts for Area 2 *or* Area 3. CMSC498x topics count toward an area only in the semesters the department lists; otherwise they are general electives.
- **CS Upper Level Concentration:** 12 credits in **one** non-CS discipline (MATH and STAT may be mixed). It cannot reuse any course already used for CS. ULC courses do not count against the minor overlap limit.
- **Math Applied:** 8 distinct 400-level courses made up of 6 specific slots plus electives. They must include a depth pair, which may reuse slot courses. At least 4 must be taken at UMD. MATH461/478/480-484/487 and STAT464 never count. A supporting sequence is also required; for CS students that is usually CMSC131/132/216.
- **RAS minor:** at most 2 courses may be shared with the majors, counted across both majors combined (a conservative reading). The supporting math course does not use an overlap slot, because the minor waives it when another major already requires it.
- **GenEd:**
  - A course with several DS codes fills only one DS slot.
  - "DSHS or DSHU, DVUP" means (DSHS or DSHU) plus DVUP.
  - Natural science is 2 courses, at least 1 of them DSNL.
  - SCIS courses must be taken at UMD, not via AP, and must also fill a DS slot.
  - Diversity is 2 DVUP, or 1 DVUP + 1 DVCC.
  - AP can fill at most 6 of the 8 DS slots.
- **University:**
  - 120 credits total, at most 60 of them from AP/IB.
  - 30 credits at UMD.
  - 15 upper-level credits at UMD.

### Waivers
Any requirement can be marked **waive** in the audit panel (hover the row) for exemption exams, advisor substitutions or electives not on the list. Examples: CMSC132 or CMSC250 by exemption exam, or MATH310 by department exemption.

## Known gaps / assumptions
- Grade minimums (C-) and GPA rules are listed in notes but not checked.
- Prerequisites are checked in the flowchart, but alternatives without a course (department permission, placement exams) are ignored. A few odd catalog phrasings parse loosely; see the comments in `src/prereqs.ts`.
- DSNL "if taken with X" lab pairing is not enforced; edit the GenEd cell if needed.
- Things the research could not confirm (see each research doc's "uncertainties" section):
  - whether the minor overlap limit applies per major or in total;
  - whether CMSC131/132 can count for both Math programming and Sequence 4;
  - whether CMSC-numbered cross-lists (e.g. CMSC460) fill the Math numerical slot.
