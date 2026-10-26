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
`public/courses.json` gets a `t` field (semesters offered) from `npm run fetch-courses`. The refresh workflow keeps it current; see "Deploying" in the README.

## Requirement engine gaps (from the 2026-10-25 program research)
Each is approximated today and noted in the program file and its docs/research spec.
- **Repeatable courses:** the solver counts a course code once, so ENAE398H (1 cr a term, up to 3) or a repeated research course can't add up. Students enter repeats as one course with the combined credits.
- **Programs that exclude each other:** "not open to Math majors", CompE students can't add CS/EE or the CS minor, Math/Stat/Actuarial minors are mutually exclusive. Only noted today; a program-level `excludes` list could warn in the picker and the audit.
- **Counting part of a course:** "counts at most 3 credits" (CCJS internship, Biology Enrichment).
- **Order-dependent rules:** BSOS "15 upper-level credits within the final 30".
- **Ratios:** Smith "50% of BMGT credits at UMD" (approximated as a fixed 23 credits).
- **Per-program credit minimums above 120** (Aerospace's 124).
- **Grouped substitutes counting as one course for overlap** (Data Science minor's CMSC250 + linear algebra for DATA250).
- Each spec's "open questions" section lists catalog ambiguities worth confirming with an advisor.
