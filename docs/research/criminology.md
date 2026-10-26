# UMD Criminology and Criminal Justice Major: Requirements Research

Researched 2026-10-25. The live catalog is the **2026-2027** edition `[S1]`. The **2025-2026** edition was read from the Wayback snapshot of 2025-11-12 `[S2]`. The requirements text of the two editions is **identical**: their extracted text diffs clean. Encoded file: `src/programs/criminology.yaml` (program `ccjs`).

The department "offers a Bachelor of Arts degree" `[S3]`. There is no B.S. and there are no tracks or specializations, so there is one program. A separate Shady Grove catalog page has the same requirements. It is not a separate program in this planner.

## 1. Structured spec `[S1][S2][S3]`

The major is 36 CCJS credits plus a gateway math course, 39 credits in total.

| Slot | Courses | Encoded |
|---|---|---|
| Required | CCJS100, CCJS105, CCJS230, CCJS300 | bare-code buckets |
| Statistics | CCJS200, **or** a department-approved substitute: BIOM301, BMGT230, ECON230, ECON321, EPIB315, GEOG306, GEOL351, GVPT422, INST314, JOUR405, PSYC200, QMMS251/451 (formerly EDMS451), SOCY201 `[S3]` | bucket `ccjs200` |
| Criminal justice | 2 of CCJS340, 342, 345 | bucket `cj` (choose 2) |
| Criminology/theory | 1 of CCJS450, 451, 454 | bucket `theory` (choose 1) |
| Courses of Choice | 4 CCJS courses, 12 credits | bucket `choice` (`courses: 4`, `credits: 12`) |
| …two at the 400 level | "Two CCJS Courses of Choice must be at the 400 level" | `minFrom` `choice-400` |
| …≤ 1 independent study (max 3 cr) | CCJS399 | `maxFrom` `indep-study` (1 course) |
| …≤ 1 internship (max 3 cr) | CCJS359 (catalog/department) and CCJS398 (internship program page `[S5]`) | `maxFrom` `internship` (1 course) |
| …never count | CCJS386, CCJS332 `[S3]` | excluded from `choice` |
| Math (LEP gateway) | MATH107 or STAT100; calculus MATH120/130/140 (catalog) or MATH120/136/140 (department) with a C- | bucket `math` (accepts all of them) |

Courses of Choice may be any CCJS course not used elsewhere. The catalog's examples are CCJS325, 360 and 418, and the department adds 225, 346, 352 and 370. Honors courses count, because "Honors courses can count toward the CCJS Course of Choice major requirement" (catalog department page). A course cannot fill both a named requirement and a Course of Choice `[S3]`. The single default use-group enforces this.

## 2. BSOS college requirements `[S4]`
These are identical in 2025-26 and 2026-27:
- 120 credits and a 2.0 GPA (university.yaml).
- A 2.0 GPA in the major courses (note).
- A graduation plan filed on entry.
- English and math fundamentals done by 60 credits (GenEd/university).
- **15 upper-level credits in the final 30 credits.** This is sequencing, so it is a note.

## 3. Approximations and notes
- **3-credit cap on the independent study and the internship:** CCJS399 runs for 1–3 credits and CCJS359/398 for 1–6. The engine cannot count only part of a course's credits, so each is capped at one course, and its full credits count. A 6-credit internship therefore overstates the Courses of Choice credits by 3. It cannot replace a fourth course, because `courses: 4` still applies.
- **36 CCJS credits:** a student who substitutes a non-CCJS statistics course has only 33 CCJS credits. Whether the department then requires another CCJS course is unconfirmed, so it is not checked.
- **CCJS369 Law Enforcement Practicum (12 cr) and CCJS367:** these are police-academy courses. They match the open Courses of Choice list, but whether they count is unconfirmed.
- **Old numbers:** CCJS452 (old Corrections, credit-only with CCJS342) and CCJS350 (credit-only with CCJS450) are not encoded as alternatives.
- **Notes only:**
  - C- minimum and a 2.0 major GPA.
  - CCJS399 eligibility: 56 credits, B- in CCJS300 and a 3.0 GPA `[S6]`.
  - Internship eligibility: 56 credits, a 2.5 GPA, at most 6 credits per term and 12 per degree `[S5]`.
  - Department permission is needed for most CCJS classes `[S1]`.

## 4. Codes missing from public/courses.json
- GVPT422, one of the approved substitutes for CCJS200. It is kept because the department list names it.
- Every required code is present.

## 5. Open questions
- Whether CCJS398 (Law Enforcement Field Training) counts as the "one internship". The internship program page `[S5]` names both CCJS359 and CCJS398, while the major page names CCJS359.
- Whether a 6-credit internship can count 3 credits toward the Courses of Choice and 3 as general electives. The engine can't split a course.
- Whether the "36 CCJS credits" rule still holds when CCJS200 is replaced by an outside statistics course.

## Sources
- `[S1]` https://academiccatalog.umd.edu/undergraduate/colleges-schools/behavioral-social-sciences/criminology-criminal-justice/criminology-criminal-justice-major/ (2026-27, live)
- `[S2]` http://web.archive.org/web/20251112053240/https://academiccatalog.umd.edu/undergraduate/colleges-schools/behavioral-social-sciences/criminology-criminal-justice/criminology-criminal-justice-major/ (2025-26)
- `[S3]` https://ccjs.umd.edu/content/ccjs-major-requirements
- `[S4]` https://academiccatalog.umd.edu/undergraduate/colleges-schools/behavioral-social-sciences/ (2025-26 snapshot 20251112014338 identical)
- `[S5]` https://ccjs.umd.edu/undergraduate/internship-program
- `[S6]` https://ccjs.umd.edu/content/independent-studies
- Catalog department page (internship and honors rules): https://academiccatalog.umd.edu/undergraduate/colleges-schools/behavioral-social-sciences/criminology-criminal-justice/
