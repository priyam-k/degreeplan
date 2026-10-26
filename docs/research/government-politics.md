# UMD Government and Politics B.A. and B.S. — Degree Requirements Spec

Researched 2026-10-25. Every fact comes from a primary source (see §6). Source tags such as `[S1]` follow each fact.
Encoded in `src/programs/government-politics.yaml` (programs `gvpt-ba` and `gvpt-bs`) and tested in
`src/programs/tests/government-politics.test.ts`.

## 0. Catalog-year status

| Catalog | Status | Notes |
|---|---|---|
| 2024-2025 | Wayback snapshot of 2025-01-07 `[S2]` | Had a B.A. **International Relations Concentration**; math benchmark list without MATH113/115; Academic Writing benchmark. |
| 2025-2026 (Fall 2025 entrants) | **No archived copy of the GVPT major page.** Reconstructed (see below). | Base catalog for this spec. |
| 2026-2027 | **Exists.** Live page `[S1]` | B.A. and B.S. only, MATH113/115 accepted, no Academic Writing benchmark, a new "may not double-major with International Relations" restriction. |

**How 2025-26 was reconstructed.** The 2025-26 catalog already has a separate **International Relations major**
(the BSOS major list `[S6]` and the IR major page `[S3]`, both 2025-26 snapshots). That IR page already has the
"no double major with GVPT" restriction, MATH113/115 in the math benchmark, and Academic Writing in Benchmark 1.
Since the IR concentration became its own major, the 2025-26 GVPT major is taken to be the 2026-27 B.A./B.S. text plus the
Academic Writing benchmark. The course requirements are identical in 2024-25 and 2026-27 apart from the IR concentration
and MATH113/115, so the only real uncertainty is whether a Fall 2025 GVPT student could still declare the IR concentration.
A search-engine summary claimed the 2025-26 page still listed it, but I could not open that page and the department now
offers the IR concentration only as the IR major `[S4]`. **The IR concentration and the IR major are not encoded here.**

UMD offers **both a B.A. and a B.S.** `[S1]`, modelled as two programs in one family.

---

## 1. Global rules

| Rule | Value | Encoded? | Source |
|---|---|---|---|
| GVPT credits | ≥ 36 GVPT credits in the major | `gvpt36` constraint | `[S1]` |
| GVPT cap | No more than 42 GVPT credits without permission | note (it limits registration, not the audit) | `[S1]` |
| Upper level | ≥ 18 of the 36 GVPT credits at 300-400 level | `upper18` constraint | `[S1]` |
| Residency | ≥ 12 upper-level GVPT credits (4 courses) in residence at UMD | `umd12` constraint (`@umd`) | `[S4b]` `[S4c]` |
| Grades | C- in all major requirements, regular grading method | note | `[S1]` `[S4b]` |
| No double counting | A course fills one requirement only; skills courses may not count elsewhere | yes (single use-group; the language bucket has its own, see §2.3) | `[S1]` `[S5]` |
| Restriction | No double major / double degree with the International Relations major | note | `[S1]` `[S3]` |
| Benchmarks | §2.4 | note | `[S1]` |

### BSOS college requirements `[S6]`

The same as for Economics: a 2.0 major GPA, a graduation plan, fundamental English and math by 60 credits (university rule) and
**15 upper-level credits within the final 30 credits**. None are checkable with the existing blocks; they are notes.

## 2. Structured spec

### 2.1 B.A. (`gvpt-ba`)

| Bucket id | Requirement | Accepted | Credits | Source |
|---|---|---|---|---|
| `gvpt170` | American Government | GVPT170 | 3 | `[S1]` |
| `math` | One of STAT100, MATH107, 113, 115, 120, 135, 136, 140 | those (+ DATA100, cross-listed with STAT100) | 3-4 | `[S1]` |
| `gvpt241` | Theory: Political Philosophy | GVPT241 | 3 | `[S1]` |
| `gvpt201` | Methods: Scope and Methods | GVPT201 | 3 | `[S1]` |
| `choice` | GVPT courses of choice, any level | GVPT100-499, 3 courses / 9 cr | 9 | `[S1]` `[S4b]` |
| `choice-upper` | GVPT courses of choice, 300-400 | GVPT300-499, 6 courses / 18 cr | 18 | `[S1]` `[S4b]` |
| `econ200` | Skills: Principles of Microeconomics | ECON200 | 3 | `[S1]` |
| `language` + `language-level` | Skills: the whole elementary level of a foreign language | §2.3 | 4-12 | `[S1]` `[S5]` |
| `quant` | Skills: one quantitative skills course (B.A. list) | §2.5 | 3 | `[S1]` `[S5]` |
| `additional` | Skills: a second B.A. quantitative course **or** one intermediate language course | §2.5 + intermediate list | 3-6 | `[S1]` `[S5]` |

### 2.2 B.S. (`gvpt-bs`)

| Bucket id | Requirement | Accepted | Credits | Source |
|---|---|---|---|---|
| `gvpt170`, `math`, `gvpt201` | as for the B.A. | | | `[S1]` |
| `gvpt320` | Advanced Empirical Research | GVPT320 | 3 | `[S1]` |
| `methods` | One GVPT methods course (300-400) | Methods list §2.6 | 3 | `[S1]` `[S4d]` |
| `quant-methods` | Two GVPT quantitative methods courses (300-400) | Quantitative methods list §2.6 | 6 | `[S1]` `[S4e]` |
| `foundation` | One of GVPT200, 280, 282 | those | 3 | `[S1]` |
| `choice` | GVPT courses of choice, any level | GVPT100-499, 2 courses | 6 | `[S1]` |
| `choice-upper` | GVPT courses of choice, 300-400 | GVPT300-499, 3 courses | 9 | `[S1]` |
| `econ200` | ECON200 | ECON200 | 3 | `[S1]` |
| `language` + `language-level` | Whole elementary level of a language | §2.3 | 4-12 | `[S1]` |
| `quant` | Two quantitative skills courses (B.S. list) | §2.5 | 6 | `[S1]` `[S5]` |

GVPT credits work out to exactly 36 for both tracks when every course is 3 credits.

### 2.3 Foreign language `[S5a]` `[S5b]`

Elementary level (all courses in the sequence): ARAB101+102, CHIN121+122, FREN103, GERS103, GREK101+102 or GREK111+112,
HEBR106+107, ITAL103, JAPN101+102, KORA101+102, LATN101+102, PERS103+104, PORT103, RUSS101+102, SPAN103.
Intermediate (one course): ARAB201, CHIN206, FREN203, GERS203, GREK201, GREK211, HEBR206, ITAL203, JAPN201, KORA201,
LATN201, PERS201, PORT203, RUSS201, SPAN203.

"Students who complete or bring in transfer credit for an intermediate language course will be waived from the
Elementary Foreign Language requirement", and that course still counts toward Additional Skills `[S4b]`. The encoding
puts the elementary bucket in its own use-group and adds "an intermediate course" as an `anySet` option, so one
intermediate course can fill both. Other exemptions (level 3 in high school, placement, ACTFL, a course above the
intermediate one, SLLC self-instructional languages) are waivers.

### 2.4 Benchmarks (notes only)

| Track | Requirement `[S1]` |
|---|---|
| B.A. | GVPT170, one 200-level GVPT course (not experiential; GVPT201 or 241 counts), and the math course, all C-, within two semesters; one of the GVPT courses not from AP/IB/CLEP |
| B.S. | Benchmark 1: GVPT170, GVPT201, the math course within two semesters; Benchmark 2: GVPT320 within one more semester |
| 2025-26 / 2024-25 only | Academic Writing (C-) is also in Benchmark 1 `[S2]` `[S3]` |

### 2.5 Quantitative skills lists (department sheets updated 3/11/26) `[S5c]` `[S5d]`

The math benchmark course may not also count as a skills course (enforced: both are in the main use-group).
Bracketed restrictions ("ECON students only" and so on) are notes; the encoding accepts every listed course.

- **B.A.:** MATH107, 113, 115, 120, 135, 136, 140, "MATH121/141 or higher" (encoded as MATH121 + MATH141-499); BIOM301,
  BMGT230, CCJS200, ECON230, ECON321, ENME392, GEOG306, GEOL351, INST314, JOUR405, PLCY610, PSYC200, QMMS451, SOCY201,
  STAT100/DATA100, STAT400; ECON201, 300, 305, 306, 325, 326, 330, 402, 426, FMSC290, PLCY640; GEOG170, 372, 373, 376;
  AREC380, ENST431, INST123, INST126, INST155, SDSB233, SDSB326, SURV400, SURV630; CMSC474, ECON414, GVPT221, GVPT390,
  GVPT429D, PHIL170, 171, 370, 470; AAAS297, AAAS301, ANTH360, CCJS300, COMM307, EDHD306, EPIB315, FMSC302, GVPT320,
  GVPT368Q, 373, 392, 393, 399A/F, 412, 419P, 429A/B/C/F/J/K/T/W, 479I/J/L/M/O, GVPT601, 628, HLTH200, PLCY304, PSYC300,
  SOCY202.
- **B.S.:** MATH107, 113, 115, 120, 135, 136, 140; BIOM301, BMGT230, CCJS200, ECON230, 321, 402, 422, 423, 424, 426,
  ENME392, GEOG170, 306, 372, 373, 376, GEOL351, INST314, JOUR405, PLCY610, PSYC200, QMMS451, SOCY201, STAT100/DATA100,
  STAT400; AREC380, ENST431, INST123, INST126, INST155, SDSB233, SDSB326, SURV400, SURV630, HLTH200; GVPT309C, 373, 390,
  392, 393, 399A/F, 412, 419P, 429A/B/C/F/J/K/T/W, 479I/J/L/M/O, 601, 628.

### 2.6 B.S. methods lists (department sheets updated 3/31/26) `[S4d]` `[S4e]`

- **Quantitative methods:** GVPT309C, 373, 392, 393, 399A, 399F, 419P, 429A, 429B, 429C, 479I, 479J, 479L, 479M, 479O,
  601, 628, SURV630, plus the IR/CP quantitative methods courses GVPT309C, 412, 429F, 429J, 429K, 429T, 429W ("may also be
  applied as GVPT Quantitative Methods courses").
- **Methods:** everything above plus GVPT368Q, 390, 429D.

## 3. Approximations and open questions

| # | Issue | What the encoding does |
|---|---|---|
| A1 | The 2025-26 GVPT page isn't archived (§0). | Encodes the 2026-27 text, with 2025-26 benchmarks in notes. |
| A2 | Whether Fall 2025 entrants could still choose the GVPT B.A. **IR concentration**. | Not encoded; IR is a separate major in 2025-26. |
| A3 | Skills and methods lists are live sheets dated March 2026; topic numbers (GVPT429x, 479x, 399x, 309C, 368Q) may mean different topics in other terms. | Exact topic codes, any term. |
| A4 | "Courses of choice" are "three-credit GVPT courses"; GVPT has 1-2 credit courses (318C, 357, 388). | Course and credit minimums together (3 courses and 9 credits, and so on). |
| A5 | Major-restricted quantitative courses ("ECON students only", "APAN only", and so on). | Accepted for everyone; the note warns. |
| A6 | "MATH121/141 or higher". | MATH121 + MATH141-499. |
| A7 | DATA100 is cross-listed with STAT100. | Accepted wherever STAT100 is. |
| A8 | The 42-credit GVPT cap. | Note only. |

## 4. Engine features that would help

- **Final-30-credits rule (BSOS):** "15 upper-level credits in the final 30 credits" needs a constraint over the
  chronologically last N credits (term order). Not expressible now.
- **Transcript-wide caps:** "no more than 42 GVPT credits" counts every GVPT course taken, not just the ones assigned
  to buckets; `maxFrom` only sees assigned courses. It is a registration rule, so a note is enough.

## 5. Courses missing from `public/courses.json`

All required courses and the math benchmark courses are present. Missing department-listed courses:
GVPT309C, GVPT373, GVPT392, GVPT429A, GVPT429C, GVPT429D, GVPT429W and PHIL171 are in the 2026-27 catalog
`[S7]` (topics or courses not offered in the local data's window). **GVPT393 and GEOG372 are not in the 2026-27 catalog.**
They are kept because the department's current sheets list them.

## 6. Sources

- `[S1]` 2026-27 catalog, Government and Politics Major: https://academiccatalog.umd.edu/undergraduate/colleges-schools/behavioral-social-sciences/government-politics/government-politics-major/
- `[S2]` 2024-25 catalog (Wayback 2025-01-07): https://web.archive.org/web/20250107054226/https://academiccatalog.umd.edu/undergraduate/colleges-schools/behavioral-social-sciences/government-politics/government-politics-major/
- `[S3]` 2025-26 catalog, International Relations Major (Wayback 2025-11-13): https://web.archive.org/web/20251113222948/https://academiccatalog.umd.edu/undergraduate/colleges-schools/behavioral-social-sciences/government-politics/international-relations-major/
- `[S4]` Department, Major Requirements overview: https://gvpt.umd.edu/undergraduate/major-requirements
  - `[S4b]` B.A. requirements: https://gvpt.umd.edu/undergraduate/government-and-politics-major-requirements-bachelor-arts
  - `[S4c]` B.S. requirements: https://gvpt.umd.edu/undergraduate/government-and-politics-major-requirements-bachelor-science
  - `[S4d]` B.S. Methods list: https://gvpt.umd.edu/sites/gvpt.umd.edu/files/2026-03/BS%20Methods%20Course%20List.pdf
  - `[S4e]` B.S. Quantitative Methods list: https://gvpt.umd.edu/sites/gvpt.umd.edu/files/2026-03/BS%20Quantitative%20Methods%20Course%20List.pdf
- `[S5]` Department, Skills Requirements, approved courses: https://gvpt.umd.edu/undergraduate/gvpt-skills-requirement-approved-courses
  - `[S5a]` Elementary language: https://gvpt.umd.edu/sites/gvpt.umd.edu/files/2026-03/Foreign%20Language%20Sheet%20-%20Elementary%20Level.pdf
  - `[S5b]` Intermediate language: https://gvpt.umd.edu/sites/gvpt.umd.edu/files/2026-03/Foreign%20Language%20Sheet-%20Intermediate%20Level.pdf
  - `[S5c]` Quantitative skills, B.A.: https://gvpt.umd.edu/sites/gvpt.umd.edu/files/2026-03/Quantitative%20Skills%20Sheet%20-%20B.A%20Track.pdf
  - `[S5d]` Quantitative skills, B.S.: https://gvpt.umd.edu/sites/gvpt.umd.edu/files/2026-03/Quantitative%20Skills%20Sheet%20-%20B.S%20Track.pdf
- `[S6]` BSOS college page (2025-26 Wayback 2025-11-12; 2026-27 live, identical requirements): https://academiccatalog.umd.edu/undergraduate/colleges-schools/behavioral-social-sciences/
- `[S7]` 2026-27 approved GVPT courses: https://academiccatalog.umd.edu/undergraduate/approved-courses/gvpt/
- IR major announcement (Oct 2025): https://today.umd.edu/umd-debuts-international-relations-major
