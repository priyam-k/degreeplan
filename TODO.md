# TODO

## Next up: polish pass (requested 2026-10-23, deferred)

1. **Back up the current plan first.** A backup taken 2026-10-23 is at `misc/degree-plan.json` (gitignored). Plans now live in localStorage `degreeplan.v2`; `v1` is kept untouched. Take a fresh Export before touching storage code.
2. **Smooth out bugs.** Candidates spotted so far:
   - ~~The Load file input doesn't reset~~; ~~Export never revokes its object URL~~ (both fixed with the flowchart work).
   - ~~Reset and plan rename/delete use `confirm`/`prompt`~~ (inline popovers now).
   - The HiGHS "wedged" retry in `App.tsx` can loop if the solve keeps failing.
   - The solver re-runs on every keystroke; debounce it.
   - ~~The datalist of about 11k options may be slow~~ (replaced by a course search).
   - Old saved plans: the `degreeplan.v1` → `v2` migration is done (see `src/workspace.ts`); keep it working.
   - Re-importing the transcript should keep waivers, notes and planned courses.
3. **End-to-end tests** (browser, against the dev server), each run from a clean localStorage:
   - Import the transcript (PDF and pasted text) and check the courses, credits and auto-added programs.
   - Add, edit and remove courses; add winter/summer terms and a year; check totals and the credit-cap warnings.
   - Switch tracks, toggle the minor, waive and unwaive, edit GenEd exemptions; the audit should update correctly.
   - Export, reset, then Load; the plan should round-trip exactly.
   - Reload the page; the plan should persist.
   - Check the double-counting limits in the UI (RAS ≤ 2 shared, ULC excluded).
   - Flowchart: switch scenarios, add/move/swap/drop from the panel, explore + add with prerequisites, Compare table.

## Catalog offering data
`public/courses.json` gets a `t` field (semesters offered) from `npm run fetch-courses`. umd.io is very slow (about 10+ min per semester), so run it in the background and commit the result.
