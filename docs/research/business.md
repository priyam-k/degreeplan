# UMD Smith School of Business: Finance, Accounting, Marketing, OMBA (B.S.): Degree Requirements Spec

Researched 2026-10-25. Every fact here comes from a primary source (see §6 Sources); a tag such as `[S1]` follows each fact. Encoded in `src/programs/business.yaml`, tested in `src/programs/tests/business.test.ts`.

## 0. Catalog-year status

| Catalog | Status | Notes |
|---|---|---|
| 2025-2026 (Fall 2025 entrants) | Fetched from Wayback snapshots (2025-11) of the five catalog pages `[S2]` | Base catalog for this spec. |
| 2026-2027 | **Exists** and is the live catalog `[S1]` | Diffed line by line against 2025-26. **No requirement changes.** Only course retitles: BMGT301 became "Information Systems, AI, and Digital Transformation", BMGT402 "AI Augmented Database Systems", BMGT431 "Data Analytics and AI for Business", BMGT400 "Storytelling with AI and Data Visualization", BMGT401 "Big Data and AI Infrastructure", BMGT404 "Essential Data and AI Skills for Business Analytics". The statistics substitute EDMS451 was renumbered QMMS251. MATH130 was dropped from the gateway list and the calculus footnote. The sentence capping community-college credit at 60 was removed. |

The Smith School "Academic Majors" page `[S3]` links per-major curriculum checklists and four-year plans (Google Drive PDFs) by entry term. These are the advisor-facing versions and agree with the catalog:

| Major | Smith checklist in force for Fall 2025 entrants | Source |
|---|---|---|
| Finance | "Effective Fall 2020", four-year plan "Effective Fall 2024" | `[S4]` |
| Accounting, Public Accounting (CPA) Track | "Effective Fall 2024" | `[S5]` |
| Accounting, Business and Accounting Advisory Track | "Effective Fall 2024" | `[S6]` |
| Marketing | "New Requirements, effective Fall 2025". The checklist body still says "Major Requirements (effective Fall 2023)", so nothing changed in the major list | `[S7]` |
| Operations Management & Business Analytics | "Effective Fall 2025" | `[S8]` |

---

## 1. Smith School requirements (every business major)

### 1.1 Global rules

| Rule | Value | Encoded? | Source |
|---|---|---|---|
| Business credits | At least 45 of the 120 credits in business and management (BMGT) subjects | Yes: bucket `bmgt-credits` (any BMGT, 45 cr, own use-group) | `[S1]` `[S4]` ("45 credits of BMGT coursework completed") |
| Upper-level credits | At least 58 credits at the 300-400 level. Equivalently, at most 62 lower-level credits count toward 120 | Yes: bucket `upper58` (`*300-999`, 58 cr, own use-group) | `[S1]` `[S4]` |
| BMGT residency | 50% of the required BMGT credit hours at UMD College Park | **Approximated**: bucket `bmgt-umd`, at least 23 BMGT credits at UMD (half of 45). See §3 | `[S1]` `[S4]` |
| Grades | C- or better in all required courses, including ECON, MATH and COMM; regular grading option | Note | `[S1]` `[S4]` |
| GPA | 2.0 cumulative; 2.0 across Smith required courses (and across major courses for Fall 2012+ matriculants) | Note | `[S1]` `[S4]` |
| Gateway (LEP) | BMGT220, BMGT230 (or 231) and MATH120/136/140, each C- or better, by 45 credits (AP/IB/dual enrollment excluded); only one repeat of one gateway course | Note | `[S1]` `[S4]` |
| Transfer of BMGT credit | From community colleges, only intro business, business statistics and elementary accounting. Junior/senior BMGT from AACSB schools is accepted; other schools are evaluated course by course | Note | `[S1]` |
| 60 credits at a 4-year school | Applies only to students who matriculated before Fall 2022 | Not encoded | `[S4]` |
| Last 30 credits at UMD | University rule (`university.yaml`) | Not encoded here | `[S4]` |
| Professional writing | FSPW. Smith checklists list ENGL390-395 or ENGL398 | Not encoded; GenEd covers it | `[S4]` |

### 1.2 Freshman-sophomore school requirements (lower core)

| Bucket id | Requirement | Acceptable courses | Source |
|---|---|---|---|
| `bmgt110` | Introduction to the Business Value Chain | BMGT110. **Required only of students admitted as freshmen**; "not required for transfer students" (waive) | `[S1]` `[S4]` |
| `bmgt220` | Principles of Accounting I | BMGT220 | `[S1]` |
| `bmgt221` | Principles of Accounting II | BMGT221 | `[S1]` |
| `econ200` | Principles of Microeconomics | ECON200 | `[S1]` |
| `econ201` | Principles of Macroeconomics | ECON201 | `[S1]` |
| `calc` | Calculus | MATH120 or MATH140. MATH220 (old number of 120) and MATH130 are listed on the Smith checklist. MATH136 is accepted only if completed for a previous major (catalog footnote 1), but the four-year plans list "MATH120, 140, or 136" | `[S1]` `[S4]` |
| `stats` | Business Statistics | BMGT230 or BMGT231, or an approved substitute. For BMGT230: BIOM301, CCJS200, ECON230, ECON321, EDMS451/QMMS251, EPIB300, EPIB315, GEOG306, HLTH300, INST314, PSYC200, SOCY201. For BMGT231: BIOE372, ENCE302, ENEE324, ENME392, STAT400, STAT420 | `[S1]` gateway footnote |
| `oral-comm` | Public speaking | COMM100/107/200. Footnote 2: "Any course that fulfills the University's Oral Communication General Education requirement will also satisfy" it. Encoded as `gened: [FSOC]` | `[S1]` |

### 1.3 Junior-senior school requirements (upper core, 19 cr)

BMGT301 Information Systems, AI and Digital Transformation (3); BMGT340 Business Finance (3); BMGT350 Marketing Principles and Organization (3); BMGT364 Managing People and Organizations (3); BMGT367 Career Search Strategies in Business (1); BMGT380 Business Law I (3); BMGT495 Strategic Management (3) `[S1]` `[S4]`.

There is also an economics requirement: "0-3 credits of approved upper-level economics courses... listed with the majors' specific requirements" `[S1]`. Of these four majors, only Finance has one (ECON330 or BMGT341).

## 2. Major requirements

### 2.1 Finance (`finance`): 24 cr, catalog `[S1]`/`[S2]`, checklist `[S4]`

| Bucket id | Requirement | Courses |
|---|---|---|
| `fin-econ` | Upper-level economics | ECON330 Money and Banking **or** BMGT341 Financial Markets |
| `bmgt343` | Investments | BMGT343 |
| `bmgt440` | Advanced Financial Management | BMGT440 |
| `fin-electives` | 4 courses (12-13 cr) | BMGT342, 347, 441, 442, 443, 444, 445, 446, 447; **at most one** intermediate ECON (ECON305/325 macro, ECON306/326 micro); **at most one** of BMGT349, BMGT448 (topics), BMGT449 |
| `fin-option` | One course | BMGT310, 313, 332 or 430. Approved substitutes: BMGT438A (now BMGT394H per Smith) and ECON423 |

The two "at most one" rules are `maxFrom` constraints on `fin-electives` (`fin-econ-max`, `fin-limited-max`). The 12-13 credit range comes from the 4-credit ECON courses, so the bucket counts courses (4), not credits. BMGT449 (Lemma Senbet Fund) requires Smith permission and BMGT443 as a corequisite.

### 2.2 Accounting: two tracks, catalog `[S1]`/`[S2]`, checklists `[S5]` `[S6]`

All accounting majors take BMGT310 Intermediate Accounting I, BMGT321 Managerial Accounting and BMGT326 Accounting Systems, then one track. The tracks apply to Fall 2024+ entrants; earlier students may opt in `[S3]`.

**Public Accounting Track (`accounting-public`), 24 cr:** BMGT311, BMGT323, BMGT411, BMGT422 (the four are "Required for CPA in Maryland"), plus one of BMGT313, 410, 417, 423, 424, 428 (`acct-elective`).

**Business and Accounting Advisory Track (`accounting-advisory`), 18 cr:**
- `acct-two`: two of BMGT311, 313, 323, 410, 411, 417, 422, 423, 424, 428.
- `acct-broad`: one of BMGT362, 372, 385, 392, 402, 440, 454, 461, **or** an accounting course from that list not already selected. "Not selected above" holds automatically because a course fills one bucket per program.

BMGT428 Special Topics in Accounting is repeatable to 9 credits with different content, so it is matched as the range `BMGT428-428` (any topic suffix, such as BMGT428J/L/M).

CPA licensure in most states (Maryland included) needs 150 credits; that is a note only `[S1]`.

### 2.3 Marketing (`marketing`): 18 cr, catalog `[S1]`/`[S2]`, checklist `[S7]`

- BMGT351 Marketing Research Methods, BMGT354 Consumer Analysis, BMGT457 Marketing Policies and Strategies.
- `mkt-electives`: three of BMGT456, 453, 357, 372, 450, 454, 455, 458, 484.
  - BMGT357 Marketing Internship counts for 3 credits at most. The course is 3 credits and the solver counts a code once, so this needs no extra rule.
  - BMGT458 Special Topics in Marketing counts for 6 credits at most: `maxFrom` constraint `mkt-458-max`, matched as `BMGT458-458`.
- Fall 2023 renumbering: BMGT452 became 351, BMGT451 became 354, BMGT353 became 453, BMGT352 became 456 `[S3]` `[S7]`. The Smith page lists BMGT408D (Google AdWords and Analytics) as an alternative to BMGT484. These old numbers are **not** matched (they predate a Fall 2025 entrant); they are listed in the notes as waivable.

### 2.4 Operations Management & Business Analytics (`omba`): 18 cr, catalog `[S1]`/`[S2]`, checklist `[S8]`

- BMGT332 Quantitative Models for Management Decisions, BMGT385 Operations Analytics (the Smith checklist says "Operations Management"), BMGT430 Data Modeling in Business, BMGT431 Data Analytics and AI for Business.
- `omba-electives` takes "two courses from List A, or one from A and one from B":
  - List A: BMGT434, or BMGT490 (QUEST only; cross-listed ENED490), and BMGT435.
  - List B: BMGT400 (formerly BMGT408V), BMGT401 (formerly BMGT408E), BMGT404 (CMSC/DATA320 may substitute), BMGT485 (INST453 may substitute) `[S3]` `[S8]`.
  - Encoded as `choose: 2` over A ∪ B plus a `minFrom` constraint `omba-list-a`: at least 1 from List A. This is exactly equivalent.
- Advice, not a requirement: students aiming at graduate study should take MATH141, MATH240 and MATH241 `[S1]`.

## 3. Approximations and tricky rules

| Rule | How it is handled |
|---|---|
| "50% of the required BMGT credit hours at UMD" | The threshold depends on the student's own required BMGT total, which varies by major and by whether substitutes are used. Fixed at 23 credits (half of the 45-credit BMGT minimum). For a typical Finance student with about 50 required BMGT credits, the real threshold is 25, so this check can pass a student a couple of credits short. An exact check would need a **ratio constraint**: UMD credits ≥ 50% of the credits assigned to a set of buckets. |
| 45 BMGT credits | Encoded exactly. It matters in practice: a Finance plan using PSYC200 for statistics, ECON423 for the option course and an intermediate ECON elective has only 43 BMGT credits (see the test). |
| BMGT110 for transfer students only | Required by default; transfer students waive `*/bmgt110`. |
| MATH136 conditional acceptance | Accepted unconditionally, with a note. |
| Oral communication | Any FSOC course, via `gened: [FSOC]`. COMM100 (still printed in the catalog table, without a title) is not in the course data and is not listed separately. |
| Upper-level credits | 58 credits at 300+, counted across all courses including ones used elsewhere. |
| Course-number history (Marketing 2023 renumbering, BMGT408D) | Not matched; waive. BMGT408V/E (old OMBA List B numbers) and BMGT438A (old Finance option) **are** matched because they appear in the recent course data. |

## 4. Course codes not in `public/courses.json`

Kept because the catalog or the Smith checklist still lists them:

| Code | Where | Status |
|---|---|---|
| BMGT231 | Statistics alternative | Catalog lists it in the core table ("or BMGT231") and as a prerequisite, but has no course entry. Probably discontinued |
| BMGT342 Wall Street Finance | Finance elective | In the 2026-27 approved-course list `[S9]`; not offered in the last 4 years of data |
| BMGT447 (Computational Finance per Smith) | Finance elective | Catalog table lists it **without a title**; no course entry `[S9]`. Possibly not yet approved or no longer offered |
| BMGT349 Private Equity and Venture Capital, BMGT449 Lemma Senbet Fund | Finance limited list | In the approved-course list `[S9]` |
| BMGT490 / ENED490 | OMBA List A | Only the honors sections BMGT490H/ENED490H appear in the data, and the plain code matches its H version |
| MATH130, MATH220 | Calculus | Older numbers named on the Smith checklist; not in the data |
| HLTH300 | Statistics substitute | Not in the data |

## 5. Open questions

- The exact BMGT residency threshold (see §3).
- Whether BMGT394H itself, not only BMGT438A, is accepted as the Finance option. The Smith page says "BMGT394H (formerly BMGT438A)"; both are encoded.
- Whether MATH136 should be accepted for students who did not start in another major. The four-year plans list it without the restriction.
- Testudo's spelling of these majors on the "Major:" line is unconfirmed. The aliases cover "FINANCE", "BUSINESS: FINANCE", "OPERATIONS MANAGEMENT & BUSINESS ANALYTICS", "Operations Management" and similar.

## 6. Sources

- `[S1]` UMD Catalog 2026-27 (live): Robert H. Smith School of Business: https://academiccatalog.umd.edu/undergraduate/colleges-schools/business/ ; Finance: https://academiccatalog.umd.edu/undergraduate/colleges-schools/business/finance/finance-major/ ; Accounting: https://academiccatalog.umd.edu/undergraduate/colleges-schools/business/accounting/accounting-major/ ; Marketing: https://academiccatalog.umd.edu/undergraduate/colleges-schools/business/marketing/marketing-major/ ; OMBA: https://academiccatalog.umd.edu/undergraduate/colleges-schools/business/decision-operations-information-technologies/operations-management-business-analytics-major/
- `[S2]` The same pages in the **2025-26 catalog** (Wayback): https://web.archive.org/web/20251112011945/https://academiccatalog.umd.edu/undergraduate/colleges-schools/business/ ; https://web.archive.org/web/20251103144304/https://academiccatalog.umd.edu/undergraduate/colleges-schools/business/finance/finance-major/ ; https://web.archive.org/web/20251112082056/https://academiccatalog.umd.edu/undergraduate/colleges-schools/business/accounting/accounting-major/ ; https://web.archive.org/web/20251112004432/https://academiccatalog.umd.edu/undergraduate/colleges-schools/business/marketing/marketing-major/ ; https://web.archive.org/web/20251103110409/https://academiccatalog.umd.edu/undergraduate/colleges-schools/business/decision-operations-information-technologies/operations-management-business-analytics-major/
- `[S3]` Smith School, Academic Majors (major requirement summaries and checklist links by entry term): https://www.rhsmith.umd.edu/programs/undergraduate/academics/academic-majors
- `[S4]` Smith, Finance Curriculum Checklist (effective Fall 2020): https://drive.google.com/file/d/1PTKA8eUvxUleozH9EvUCamwUkKX2_5XW/view ; Finance Four Year Plan (effective Fall 2024): https://drive.google.com/file/d/1zl__a5n-jNycoQgslANXfOQ3DfUBq1ZE/view
- `[S5]` Smith, Accounting, Public Accounting Track checklist and plan (Fall 2024): https://drive.google.com/file/d/1jfNXQkyh1MekPbTe0ObZ_ia-_QgTCu3a/view ; https://drive.google.com/file/d/1v8e3iCQbtn6j90NkhcQaLFNfkuG7uIaw/view
- `[S6]` Smith, Accounting, Business and Accounting Advisory Track checklist and plan (Fall 2024): https://drive.google.com/file/d/1lul_RQfaaeX0G0FE2ROooAVc84KqcbN_/view ; https://drive.google.com/file/d/1sxnwZal5e80gvW6AjavevxGAFvDS1Y_N/view
- `[S7]` Smith, Marketing checklist and plan (Fall 2025): https://drive.google.com/file/d/1of7M39imwUOPjnDF-sCFJTFPauGNlP_2/view ; https://drive.google.com/file/d/1hSmDqUTEpGBlUSoEtWvxGsrL6_EMdo9i/view
- `[S8]` Smith, Operations Management & Business Analytics checklist and plan (Fall 2025): https://drive.google.com/file/d/1uiNDiVS2PMsxuiayMh2EAguCU2RiZxXk/view ; https://drive.google.com/file/d/1Vau0VZRUN4xH8aROIPqz-iOziwmYFRAl/view
- `[S9]` UMD Catalog, BMGT approved courses: https://academiccatalog.umd.edu/undergraduate/approved-courses/bmgt/
