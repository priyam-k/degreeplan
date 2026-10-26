# UMD Public Health Science B.S. (College Park): Degree Requirements Spec

Researched 2026-10-25. Every fact here comes from a primary source listed in §5. Source tags such as `[S1]` follow each fact.
Encoded in `src/programs/public-health-science.yaml` (id `phsc`) and tested in `src/programs/tests/public-health-science.test.ts`.

## 0. Catalog-year status

| Catalog | Status | Notes |
|---|---|---|
| 2025-2026 (Fall 2025 entrants) | Read from the Wayback snapshot of 2025-11-12, which carries the "2025-2026 Catalog" banner `[S2]` | Base catalog for this spec. |
| 2026-2027 | **Published.** It is the live catalog page `[S1]` | Diffed line by line. **One change:** the biology lab line. 2025-26 has "BSCI170 & BSCI171" (4 credits); 2026-27 has BSCI170 (3) plus "BSCI180 Principles Biology Laboratory (1) **or** BSCI171". The department page calls BSCI180 "previously BSCI171" `[S3]`. Both are accepted. |

The Shady Grove Public Health Science program is marked "(Discontinued)" in the 2026-27 catalog. Only College Park is encoded.

---

## 1. Structured spec

### 1.1 Global rules

| Rule | Value | Source |
|---|---|---|
| Major credits | 74 of the 120 | `[S1]` |
| Minimum grade | C- in all major coursework: foundations and options | `[S1]` `[S3]` |
| Benchmarks (Fall 2026 & later; the only version on the page) | 1: CHEM131 and CHEM132 by the end of two semesters in the major. 2: CHEM231 and CHEM232 by the end of four semesters | `[S6]` `[S3]` |
| Courses away | Since Summer 2023 any major course may be taken elsewhere with a permission-to-enroll form | `[S3]` |
| Capstone | PHSC497 in the final term, 100+ credits, after FSPW and PHSC450 (both C- or better) | `[S3]` `[S5]` |
| GenEd interaction | A PHSC Option may not also be the DSSP outside the major | `[S3]` |

### 1.2 Scientific foundations (31 credits) `[S1]` `[S3]`

| Slot id | Course | Also accepted (credit-equivalent per catalog) |
|---|---|---|
| `math120` | MATH120 Elementary Calculus I | MATH140 (**our assumption**, see A2) |
| `bsci170` | BSCI170 | none |
| `bsci-lab` | BSCI180 or BSCI171 | none |
| `bsci201`, `bsci202` | BSCI201, BSCI202 Anatomy & Physiology I/II | none |
| `chem131` | CHEM131 | CHEM135, CHEM146 |
| `chem132` | CHEM132 | CHEM136, CHEM177 |
| `chem231` | CHEM231 | CHEM237 (honors, includes the lab) |
| `chem232` | CHEM232 | CHEM237 (its own use group, so one CHEM237 fills lecture and lab) |
| `bsci222` | BSCI222 Genetics | none |
| `bsci223` | BSCI223 Microbiology | BSCI283 Principles of Microbiology ("Credit only granted for BSCI223 or BSCI283") |

### 1.3 Public health science foundations (31 credits) `[S1]` `[S3]`

SPHL100, HLTH366, EPIB301, EPIB315 (or EPIB300, its former number), HLSA300, MIEH300, PHSC450, KNES320 (or KNES360, its former number), PHSC415, PHSC497.

### 1.4 Public Health Science Options (12 credits)

- 300-400 level courses, "primarily offered within the School of Public Health". "Please visit the PHSC website for the current list of approved options." `[S1]`
- Guidelines `[S3]` `[S4]`:
  - at least 3 option credits with an SPH prefix (EPIB, FMSC, HLSA, HLTH, KNES, MIEH, GBHL, PHSC). Encoded as `options-sph`;
  - only one of HLTH431 / GBHL310. Encoded as `options-hlth431`;
  - at most 6 credits of experiential learning (internship or research). Encoded as `options-experiential` over PHSC389, PHSC399, MIEH309 and ENVH381;
  - other courses can be approved through a request form. Waive in the app.
- The approved list is the "Master List of PHSC Options" spreadsheet linked as go.umd.edu/phsclasses `[S4]`, read 2026-10-25. Encoded verbatim, plus:
  - the former numbers it shows (BSCI330, MIEH333, MIEH480) and PHSC426 (now ENVH426);
  - every PHSC 300-499 course other than the required PHSC415/450/497. These are option-type electives restricted to PHSC majors in the catalog `[S7]`, for example PHSC401, 405, 410, 412, 425 and 440.

## 2. Approximations and judgement calls

| # | Issue | Decision |
|---|---|---|
| A1 | The full approved options list is in the ELMS "PHSC Toolkit", which needs a login `[S3]`. The public spreadsheet lists the courses "offered recently" | Encoded the public list plus all PHSC 300-499. Anything else: waive after approval. |
| A2 | MATH120 vs MATH140. The catalog names only MATH120 | MATH140 is also accepted. It is UMD's standard Calculus I and outranks MATH120, but no PHSC source confirms it. Flagged in the bucket note. |
| A3 | ENVH is the new SPH prefix (for example ENVH414 was MIEH480), but the guideline's prefix list predates it | ENVH counts as SPH for `options-sph`. |
| A4 | Benchmark timing, the C- minimums and capstone sequencing | Notes only. |
| A5 | The benchmark text on the SPH page is headed "Fall 2026 & Later". The rule for Fall 2025 entrants isn't shown | Notes only; doesn't affect the course audit. |

## 3. Open questions

- Is MATH140 (or MATH136) accepted for MATH120?
- Is the public options spreadsheet the complete approved list? Do all PHSC 3xx/4xx courses count as options?
- Does the 2026-27 BSCI180 change apply retroactively to 2025-26 entrants? The department page treats BSCI171 and BSCI180 as the same lab, so both are accepted.

## 4. Sample plan used in tests

SPH sample eight-semester plan `[S5]`, for a student with MATH120 eligibility:
- Year 1: ENGL101, MATH120, BSCI170, SPHL100, UNIV100, CHEM131/132, BSCI180.
- Year 2: CHEM231/232, BSCI223, HLTH366, EPIB301.
- Year 3: BSCI201, EPIB315, MIEH300, BSCI202, PHSC450, FSPW, Options #1-2.
- Year 4: PHSC415, HLSA300, BSCI222, PHSC497, KNES320, Options #3-4.

## 5. Sources

- `[S1]` UMD Catalog 2026-27, Public Health Science Major (live): https://academiccatalog.umd.edu/undergraduate/colleges-schools/public-health/public-health-science/public-health-science-major/
- `[S2]` Same page, **2025-26 catalog**, Wayback 2025-11-12: https://web.archive.org/web/20251112025352/https://academiccatalog.umd.edu/undergraduate/colleges-schools/public-health/public-health-science/public-health-science-major/
- `[S3]` SPH, Curriculum: Public Health Science, College Park: https://sph.umd.edu/academics/departments-units/public-health-science/student-resources-public-health-science/curriculum-public-health-science-college-park
- `[S4]` PHSC Options spreadsheet (Master List, Fall 2026 offerings, guidelines tabs), via https://go.umd.edu/phsclasses: https://docs.google.com/spreadsheets/d/1EXUt-mppC7Ql6t48ZXZHqwgHQEsjrxZmwRDz3vEDgCY
- `[S5]` PHSC Sample Plan & Checklist (PDF, updated 8/21/26): https://sph.umd.edu/sites/default/files/2026-09/PHSC%20Sample%20Plan%20%26%20Checklist.pdf
- `[S6]` SPH CASA, Four Year Plans and Benchmarks: https://sph.umd.edu/academics/advising-resources/undergraduate-center-academic-success-and-achievement/casa-advising/undergraduate-center-academic-success-and-achievement-four-year-plans-and-benchmarks
- `[S7]` UMD Catalog, PHSC approved courses: https://academiccatalog.umd.edu/undergraduate/approved-courses/phsc/
