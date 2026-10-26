# UMD Economics B.A. and B.S. — Degree Requirements Spec

Researched 2026-10-25. Every fact comes from a primary source (see §5). Source tags such as `[S1]` follow each fact.
Encoded in `src/programs/economics.yaml` (programs `econ-ba` and `econ-bs`) and tested in `src/programs/tests/economics.test.ts`.

## 0. Catalog-year status

| Catalog | Status | Notes |
|---|---|---|
| 2025-2026 (Fall 2025 entrants) | Fetched from the Wayback snapshot of 2025-11-12 `[S2]` | Base catalog for this spec. |
| 2026-2027 | **Exists.** This is the live catalog page `[S1]` | Diffed line by line against 2025-26. The course requirements are **identical**. Two changes: (1) the benchmarks dropped "One additional GenEd course with a D- or higher" and "Academic Writing with a C- or higher", so the B.A. benchmark is now 3 courses (was 5) and the B.S. 4 (was 6); (2) ECON425 is still listed among the B.A. quantitative courses, but with a blank title, and it is gone from the 2026-27 ECON course listing `[S6]`. |

UMD offers **both a B.A. and a B.S.** in Economics `[S1]`. They are two curricula of one major, so they are modelled as two
programs in one family (mutually exclusive in the picker).

The catalog defers the elective lists ("ECON courses designated for B.A./B.S.") to the department's live
"ECON BA & BS Approved Course List" `[S4]`, which is undated. The B.S. curriculum in its current form took effect in
Fall 2021 `[S3]`.

---

## 1. Global rules

| Rule | Value | Encoded? | Source |
|---|---|---|---|
| Minimum major credits | 41 ("minimum of 41 credits via a combination of foundation and elective courses"); B.A. list totals 41-42, B.S. 42 | `credits` constraint (≥ 41) in both | `[S1]` `[S2]` |
| Minimum grade | C- in every major course | note | `[S1]` `[S3]` |
| Major GPA | 2.0 across all courses used for the major | note | `[S1]` `[S5]` |
| No double counting | "A course used to fulfill one requirement for the major may not count towards any other economics major requirement" | yes (single use-group) | `[S1]` `[S3]` |
| Max ECON courses per semester | 3 | note | `[S3]` |
| Prerequisites | "strictly enforced" | not checked | `[S3]` |
| Benchmarks | see §2.3 | note | `[S1]` `[S2]` |

### BSOS college requirements `[S5]`

The BSOS college page (2025-26 and 2026-27 identical) adds only:
- a 2.0 GPA across all major courses (the same as the major's own rule);
- a graduation plan filed with college advising on entering BSOS;
- fundamental English and math attempted by 30 credits and finished by 60 (university policy, in `university.yaml`);
- **15 upper-level credits within the final 30 credits.**

None of these can be checked from a list of courses with the existing building blocks; they are notes. The last rule
needs term order (see §4).

## 2. Structured spec

### 2.1 B.A. (`econ-ba`)

| Bucket id | Requirement | Accepted courses | Credits | Source |
|---|---|---|---|---|
| `econ200` | Principles of Microeconomics | ECON200 | 3 | `[S1]` |
| `econ201` | Principles of Macroeconomics | ECON201 | 3 | `[S1]` |
| `calc` | Calculus | MATH120 or MATH140 | 3-4 | `[S1]` |
| `stats` | Statistics | ECON230 or BMGT230 | 3 | `[S1]` |
| `econ305` | Intermediate Macroeconomic Theory and Policy | ECON305 | 4 | `[S1]` |
| `econ306` | Intermediate Microeconomic Theory & Policy | ECON306 | 4 | `[S1]` |
| `quant` | Select one (quantitative methods) | ECON402, 414, 424, 425, 426 | 3 | `[S1]` `[S3]` |
| `ba-300` | Two 300- or 400-level ECON courses designated for the B.A. | B.A. 300-level list + B.A. 400-level list + B.S./B.A. 400-level list | 6 | `[S1]` `[S4]` |
| `ba-400` | Three 400-level ECON courses designated for the B.A. | B.A. 400-level list + B.S./B.A. 400-level list | 9 | `[S1]` `[S4]` |
| `experiential` | ECON386, another approved experiential course, or one more 300/400-level B.A. course | experiential list + all B.A. lists; ≥ 3 credits | 3 | `[S1]` `[S4]` |

Footnote 1 on the quantitative list has no text on either catalog page. The department doc explains it: if a student
takes more than one of ECON402/414/424/425/426, one fills the quantitative requirement and the other may count as a
400-level course of choice `[S4]`. The encoding allows exactly that (ECON425 is added to the B.A. 400-level list for
this reason).

### 2.2 B.S. (`econ-bs`)

| Bucket id | Requirement | Accepted courses | Credits | Source |
|---|---|---|---|---|
| `econ200`, `econ201` | Principles | ECON200, ECON201 | 6 | `[S1]` |
| `calc` | Calculus I | MATH140 | 4 | `[S1]` |
| `methods` + `methods-path` | Methods and Tools | ECON300, **or** MATH241 plus "another statistics course" | 3 (or 4 + stats) | `[S1]` `[S3]` |
| `stats` | Economic Statistics | ECON321 or STAT401 | 3 | `[S1]` |
| `econ325` | Intermediate Macroeconomic Analysis | ECON325 | 4 | `[S1]` |
| `econ326` | Intermediate Microeconomic Analysis | ECON326 | 4 | `[S1]` |
| `econ422` | Econometrics | ECON422 | 3 | `[S1]` |
| `bs-400` | Three 400-level ECON courses designated for the B.S. | B.S. 400-level list + B.S./B.A. 400-level list | 9 | `[S1]` `[S4]` |
| `bs-ba-400` | One 400-level ECON course designated for the B.S. or B.A. | all 400-level lists | 3 | `[S1]` `[S4]` |
| `bs-ba-300` | One 300/400-level ECON course designated for the B.S. or B.A. | all lists | 3 | `[S1]` `[S4]` |

### 2.3 Benchmarks (notes only)

| Track | 2025-26 `[S2]` | 2026-27 `[S1]` |
|---|---|---|
| B.A. | ECON200, ECON201, MATH120/140 (C-), one more GenEd course (D-), Academic Writing (C-), within two semesters of entering the major | the same without the GenEd and Academic Writing items |
| B.S. | ECON200, ECON201, MATH140, ECON300 (C-), one more GenEd (D-), Academic Writing (C-) | the same without the GenEd and Academic Writing items |

The department adds "ECON300 (or MATH241 plus any statistics course)" for the B.S. benchmark `[S3]`. Each student signs an
individual benchmark contract.

### 2.4 Department designated-course lists `[S4]`

| List | Courses |
|---|---|
| B.A. 300-level | ECON310, 311, 312, 314, 315, 317, 327, 330, 340, 354, 371, 375, 398 (topics) |
| B.A. 400-level | ECON402\*, 418 (topics), 424\*, 426\*, 443, 451, 453, 455, 456, 461, 468 (topics), 472, 481, 484, 485, 486, 490 |
| B.S. or B.A. 400-level | ECON401, 414\*, 417, 432, 433, 434, 435, 454, 465, 470 |
| B.S. 400-level | ECON406, 407, 410, 412, 415, 416, 423, 427, 442, 460, 465, 498 (topics) |
| B.A. experiential (≥ 3 cr) | 4 cr: CMSC131. 3 cr: ECON386, BSOS288I, BSOS386, BSOS355, BSCV302, FGSM398, GEOG170, GEOG276, GEOG373, GVPT377, MLAW388, SDSB233 (was BSOS233), UNIV305/306. 2 cr: ECON387, UNIV362. 1 cr: COMM488I, EDCP108I, IDEA311, PSYC123 |

\* also quantitative-methods courses. ECON465 appears on both the B.S. and the B.S./B.A. lists. Topics courses (398, 418,
468, 498) are matched by number with any suffix (e.g. `ECON418-418`).

## 3. Approximations and open questions

| # | Issue | What the encoding does |
|---|---|---|
| A1 | "Another statistics course" with MATH241 isn't named. | Accepts STAT100, STAT400, STAT410, DATA400, ECON230, ECON321 or BMGT230 (an `anySet` option of MATH241 + one of these). Unconfirmed. |
| A2 | "Other experiential learning course(s)" is open-ended (advisor review). | The department's list, ≥ 3 credits in total; anything else is a waiver. |
| A3 | The designated lists are live and undated, so they may differ from what Fall 2025 students saw. | Uses the list fetched 2026-10-25. |
| A4 | ECON425 (Mathematical Economics) is in the 2025-26 catalog but has no title in 2026-27 and isn't in the 2026-27 course listing or the local course data. | Kept in the quantitative list (2025-26 rule). |
| A5 | Benchmarks, C- grades, the 2.0 major GPA, 3 ECON per semester and prerequisites. | Notes only. |
| A6 | Whether a B.A. "300 or 400 level course designated for the B.A." may be a B.S.-only course. | Not allowed (the doc lists B.S. courses separately, and only the B.S./B.A. list says it counts for both). |

## 4. Engine features that would help

- **Final-30-credits rule (BSOS):** "15 upper-level credits in the final 30 credits" needs a constraint over the
  chronologically last N credits of the whole transcript (term order), e.g. `kind: lastCredits, credits: 30, match:
  "*300-499", min: 15`. Not expressible now.

## 5. Courses missing from `public/courses.json`

All required courses are present. These listed electives are missing (not offered in the last ~4 years). All but
ECON425 are still in the 2026-27 catalog `[S6]`: ECON314, ECON340, ECON398, ECON412, ECON415, ECON425, ECON434, ECON435,
ECON460, ECON468, ECON472, ECON490, ECON498. ECON418 exists only as topics (ECON418A/C/L/M), which the range matcher
covers.

## 6. Sources

- `[S1]` 2026-27 catalog, Economics Major, Requirements tab: https://academiccatalog.umd.edu/undergraduate/colleges-schools/behavioral-social-sciences/economics/economics-major/
- `[S2]` 2025-26 catalog (Wayback 2025-11-12): https://web.archive.org/web/20251112050904/https://academiccatalog.umd.edu/undergraduate/colleges-schools/behavioral-social-sciences/economics/economics-major/
- `[S3]` Department, ECON Major Requirements: https://econ.umd.edu/undergraduate/major-requirements
- `[S4]` Department, "ECON BA & BS Approved Course List" (Google Doc linked from `[S3]`): https://docs.google.com/document/d/1Ss_mtrpY723u68m6_M68u0VnSy0OsnUklI2tnJh4xhE/
- `[S5]` BSOS college page, Undergraduate Degree Requirements (2026-27 live; 2025-26 Wayback 2025-11-12 identical): https://academiccatalog.umd.edu/undergraduate/colleges-schools/behavioral-social-sciences/
- `[S6]` 2026-27 approved ECON courses: https://academiccatalog.umd.edu/undergraduate/approved-courses/econ/
- B.A./B.S. major checklists and sample plans (Google Sheets linked from `[S3]`) were used to shape the test plans.
