# UMD Information Science B.S.: Degree Requirements Spec

Researched 2026-10-25. Every fact here comes from a primary source listed in §5. Source tags such as `[S1]` follow each fact.
Encoded in `src/programs/information-science.yaml` and tested in `src/programs/tests/information-science.test.ts`.

## 0. Catalog-year status

| Catalog | Status | Notes |
|---|---|---|
| 2025-2026 (Fall 2025 entrants) | Read from the Wayback snapshot of 2025-11-02, which carries the "2025-2026 Catalog" banner `[S2]` | Base catalog for this spec. |
| 2026-2027 | **Published.** It is the live catalog page `[S1]` | Diffed line by line against 2025-26. **The requirements are identical.** Only the prose changed: "Program Director" became "Faculty Program Director", and one sentence in Program Objectives was reworded. |

The catalog defers to the College of Information (INFO, formerly the iSchool) for two things: the cognate-area course lists and what counts as a major elective. The college pages `[S3]` `[S4]` are live, not versioned.

---

## 1. Structured spec

### 1.1 Global rules

| Rule | Value | Source |
|---|---|---|
| Minimum grade, every major requirement | **C-** | `[S1]` `[S6]` |
| Major GPA | 2.0 overall average | `[S1]` |
| Major credits | Catalog "Total Credits 57" = 12 benchmark + 30 core + 15 electives. The college counts 45, leaving out the benchmarks other than INST201 | `[S1]` `[S3]` `[S4]` |
| INST credit | 30 of the 45 major credits must be approved INST-prefix coursework. The 30 core credits meet this on their own | `[S4]` |
| Residency | Once in the major, benchmark and core courses must be taken at UMD. AP credit that UMD accepted may satisfy benchmarks | `[S4]` |
| Double major | Not allowed with the B.A. in Technology and Information Design | `[S1]` |
| Benchmarks | Benchmark I (MATH115 or higher, PSYC100) within the first 30 credits after declaring. Benchmark II (STAT100, INST126, INST201) within 60. C- or better within two attempts, or the student must leave the major | `[S3]` `[S4]` |
| Sequencing | Benchmark I before any 300-level core course. All benchmarks before any upper-level major elective | `[S4]` |

### 1.2 Benchmark courses

| Slot id | Requirement | Accepted | Source |
|---|---|---|---|
| `math115` | MATH115 Precalculus **or higher** | MATH115 and any higher MATH course (encoded as `MATH115-499`) | `[S1]` `[S3]` `[S4]` |
| `psyc100` | PSYC100 | PSYC100 | `[S1]` |
| `stat100` | STAT100 | STAT100, DATA100 (credit-equivalent: "Credit only granted for DATA100 or STAT100") | `[S1]` `[S7]` |
| `inst126` | INST126 | INST126, GEOG276. Footnote 1 says "Other courses exist which fulfill this requirement. Please check with your advisor". GEOG276 is the alternative that every INST prerequisite names (for example INST326: "INST126 or GEOG276") | `[S1]` `[S7]` |

### 1.3 Core (10 courses, 30 credits)

INST201 (or INST301, its Shady Grove twin: "Credit Only Granted for INST201 or INST301"), INST311, INST314, INST326, INST327, INST335, INST346, INST352, INST362, INST490 `[S1]` `[S7]`. Encoded with id `core-umd`: no transfer credit may fill a core slot `[S4]`.

### 1.4 Major electives (15 credits): "Select ONE of the following options"

1. **At least 15 credits of INST-coded major electives** `[S1]`. These are "approved upper-level [300-400 level] electives" `[S4]` `[S5]`, "which include INST300-level and INST400-level courses" `[S8]`. The program must approve a non-INST course before the student enrolls (Upper-Level Major Elective Proposal Form) `[S4]`.
2. **An InfoSci cognate area**: Data Science, Cybersecurity and Privacy, Digital Curation, or Health Information `[S1]`. The catalog describes each area but lists no courses. The lists below come from the college `[S3]`:

| Cognate | Courses listed by the college `[S3]` | How many | Encoded as |
|---|---|---|---|
| Data Science | INST354, INST377, INST410, INST414, INST447, INST462 | Not stated. Five courses = 15 credits | `infosci-data-science`: any 5 of the 6 |
| Cybersecurity & Privacy | INST364, INST365, INST366, INST464, INST466, INST467 | "A total of 5 courses are required … Complete 5 Courses from below" | `infosci-cybersecurity`: 5 of the 6 |
| Digital Curation | INST341, INST441, INST442, INST443 | Not stated; 4 listed | `infosci-digital-curation`: all 4, plus 3 credits of INST upper-level electives |
| Health Information | INST402, INST408A (now INST451), INST452 | Not stated; 3 listed. "Students are also encouraged to consider outside courses … via the Non-INST Upper-Level Elective Proposal Form" | `infosci-health-info`: all 3, plus 6 credits of INST upper-level electives |

The 2021 handbook `[S5]` gives older lists. Data Science lacked INST410. Digital Curation also had INST448. Health Information also had INST401. The cognates are labelled "(Optional)" `[S3]`, so the general program `infosci` stays the default.

---

## 2. Approximations and judgement calls

| # | Issue | Decision |
|---|---|---|
| A1 | Elective scope. The catalog says "INST-coded"; the college says "approved 300-400 level" | Encoded as `INST300-499` minus the core, INST301 (equivalent to INST201) and INST491 (the TDI capstone; "Credit only granted for INST490, INST491, or SDSI492"). 1-credit INST388x, INST309 independent study and INST389 internship are allowed, because no source excludes them (unconfirmed). Approved non-INST courses: waive. |
| A2 | Cognate counts for Data Science, Digital Curation and Health Information aren't stated | Five courses of the 15-credit block, as above. A Digital Curation or Health Information student fills the rest with other INST electives, which is our reading. |
| A3 | INST365 Ethical Hacking is listed by the college `[S3]` but is **not in the catalog** `[S7]` and has never been scheduled (absent from `public/courses.json`) | Kept in the list. Ethical Hacking ran as the special topic INST408C in Fall 2026 and Spring 2027; whether that counts is an advisor call (waive). In practice the other five cyber courses are required. |
| A4 | INST408A (Consumer Health Informatics) became INST451 ("Credit only granted for INST408A or INST451", first offered Fall 2023). INST408A was reused for "AI and Music" in Spring 2026 | Encoded INST451 only. A Fall 2025 entrant cannot have the old INST408A. |
| A5 | "MATH115 (or higher)" | Any MATH 115-499. |
| A6 | Benchmark and core courses must be at UMD `[S4]` | `core-umd` (maxFrom, no non-UMD courses in core slots). A transferred core course shows as an unmet core slot. Benchmarks aren't restricted, because AP is accepted for them. |
| A7 | Timing of benchmarks, the two-attempt rule, and benchmarks before electives | Notes only. |

## 3. Open questions

- Exact course counts for the Data Science, Digital Curation and Health Information cognates, and whether a cognate is recorded on the transcript or the degree audit.
- Whether INST408C (Ethical Hacking) substitutes for INST365.
- Whether 1-credit INST388x maker courses, INST309 and INST389 count toward the 15 elective credits, and whether any 300-400 level INST courses written for the TDI major are excluded.
- Whether higher statistics (for example STAT400) satisfies the STAT100 benchmark.

## 4. Sample plan used in tests

The college graduation plan `[S6]` (updated 4/22). Year 1: MATH115, STAT100, ENGL101, INST126, PSYC100. Year 2: INST201, INST326, INST311, INST327, INST335. Year 3: INST314, INST352, ENGL39x and two INST upper-level electives. Year 4: INST346, INST362, INST490 and three INST upper-level electives.

## 5. Sources

- `[S1]` UMD Catalog 2026-27, Information Science Major (live): https://academiccatalog.umd.edu/undergraduate/colleges-schools/information/information-science-major/
- `[S2]` Same page, **2025-26 catalog**, Wayback 2025-11-02: https://web.archive.org/web/20251102203855/https://academiccatalog.umd.edu/undergraduate/colleges-schools/information/information-science-major/
- `[S3]` INFO College, Curriculum & Cognate Areas (B.S. InfoSci, College Park): https://info.umd.edu/academics/bachelors-programs/bachelor-of-science-in-information-science-college-park/curriculum-cognate-areas/
- `[S4]` INFO College, Handbook, Policies & Forms for Undergraduate Students: https://ischool.umd.edu/academics/bachelors-programs/handbook-policies-forms/
- `[S5]` InfoSci Undergraduate Student Handbook, Fall 2021: https://info.umd.edu/wp-content/uploads/InfoSci-UG-Handbook-Fall-2021-v.-4.pdf
- `[S6]` B.S. Information Science Graduation Plan (PDF): https://info.umd.edu/wp-content/uploads/Bachelor-of-Science-in-Information-Science-GRADUATION-PLAN-1.pdf, linked from https://info.umd.edu/academics/student-services/undergraduate-college-park/four-year-plans/
- `[S7]` UMD Catalog, INST approved courses: https://academiccatalog.umd.edu/undergraduate/approved-courses/inst/
- `[S8]` Montgomery College → UMD InfoSci transfer guide 2025-26: https://www.montgomerycollege.edu/_documents/academics/transfer/umd-compsci-to-infosci-25-26.pdf
