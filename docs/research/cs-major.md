# UMD Computer Science B.S. — Degree Requirements Spec

Researched 2026-10-21. Every fact here was fetched from a primary source (see §5 Sources). Source tags such as `[S1]` follow each fact.

## 0. Catalog-year status

| Catalog | Status | Notes |
|---|---|---|
| 2025-2026 (Fall 2025 entrants) | Fetched from the Wayback snapshot (2025-11-12) of the catalog page `[S2]` | Base catalog for this spec. |
| 2026-2027 | **Exists.** This is the live catalog page `[S1]` | Diffed line by line against 2025-26. **Only one change:** CMSC423 was retitled from "Bioinformatic Algorithms, Databases, and Tools" (2025-26) to "Computational Genomics" (2026-27). All requirements, counts, areas and footnotes are identical. |

The department site `[S3..S9]` is *live*, not versioned. Its General Track tracking sheet is labelled "Effective Spring 2026" `[S10]`. The department lists are **more current and more detailed** than the catalog (for example CMSC431, the CMSC498x topics, CMSC133/141/142 and the full non-area elective list). In practice the advisor-maintained degree audit follows the department lists. See §3 for the places where catalog and department disagree.

---

## 1. Structured spec (General Track)

### 1.1 Global rules

| Rule | Value | Source |
|---|---|---|
| Minimum grade, every major requirement | **C-** | `[S1]` `[S2]` `[S10]` |
| University minimum GPA across all courses used for the major (matriculated Fall 2012 or later) | 2.00 cumulative | `[S12]` |
| Degree minimum credits | 120 | `[S12]` `[S10]` |
| Catalog "Total Credits" for the major | 63-64. **This total omits the 6 elective credits** (see §2 T1) | `[S1]` |
| Transfer of major courses after admission | Not allowed. CMSC and MATH courses required for the major must be taken at UMD once a student is in the major (exception only by petition) | `[S6]` FAQ |
| Exemption exams | CMSC131, CMSC132, CMSC216, CMSC250. Passing exempts the student from the course but gives **no credit** | `[S1]` `[S6]` |
| Limited Enrollment Program | One line: Fall 2024+ matriculants need a B- in each gateway course (MATH140, CMSC131/141, CMSC132/142), a 3.0 GPA, and a selective review. There are also 45- and 75-credit benchmarks | `[S3]` `[S10]` |

### 1.2 Lower-level requirements (all tracks)

| Slot ID | Requirement | Acceptable courses (exhaustive per sources) | Credits | Source |
|---|---|---|---|---|
| `MATH140` | Calculus I | MATH140 | 4 | `[S1]` |
| `MATH141` | Calculus II | MATH141 | 4 | `[S1]` |
| `CMSC131` | OOP I | **CMSC131 (4)** OR **CMSC133 (2)** OR **CMSC141 (4)** OR exemption exam | 2-4 | CMSC133: `[S3]`. CMSC141: `[S10]` gateway table, plus the catalog course entry "Credit Only Granted for: CMSC131, CMSC133 or CMSC141" `[S11]` |
| `CMSC132` | OOP II | **CMSC132 (4)** OR **CMSC142 (4)** OR exemption exam | 4 | `[S1]` `[S10]` `[S11]` |
| `CMSC216` | Intro to Computer Systems | CMSC216 or exemption exam | 4 | `[S1]` |
| `CMSC250` | Discrete Structures | CMSC250 or exemption exam | 4 | `[S1]` |
| `CMSC330` | Org. of Programming Languages | CMSC330 | 3 | `[S1]` |
| `CMSC351` | Algorithms | CMSC351 | 3 | `[S1]` |
| `STAT4XX` | One STAT 4xx course | Any STAT4xx whose prerequisite is MATH141 or higher and that is **not cross-listed with CMSC**. Candidates are listed below | 3 | `[S1]` fn 2, `[S3]` |
| `MATHSTAT_XXX` | One MATH, AMSC or STAT course | Any MATH/AMSC/STAT course whose prerequisite is MATH141 or higher and that is **not cross-listed with CMSC**. Candidates are listed below | 3-4 | `[S1]` fn 2, `[S3]`, `[S10]` |

Notes:
- CMSC141 and CMSC142 ("Programming with Purpose I: Data-Centric Computing" and "Programming with Purpose II: Data Structures and Algorithms", 4 credits each) are real courses (PlanetTerp `[S15]`). They are named in the department tracking sheets `[S10]` and in the catalog's credit-only-granted-for notes `[S11]`. However, they **do not appear on the catalog major page itself**, and the CMSC141 and CMSC142 entries are missing from the 2026-27 approved-course list.
- CMSC133 is worth only 2 credits, so a student who takes it has 2 fewer major credits.

**STAT4XX candidate list.** These are all STAT 4xx courses in the 2026-27 catalog `[S13]`, sorted by whether they meet the "prereq ≥ MATH141" rule. The rule is applied by advisors, so this list is derived, not published:

| Course | Prereq (catalog) | Eligible? |
|---|---|---|
| STAT400 Applied Prob & Stat I | MATH131 or MATH141 | **Yes**. This is the canonical choice, and it is *required* for the Data Science track. Cross-listed with DATA400. Credit is granted for only one of DATA400, ENEE324 or STAT400 |
| STAT401 Applied Prob & Stat II | STAT400 or STAT410 | Yes (transitively) |
| STAT410 Intro Probability Theory | MATH240/461/341 and MATH241/340 | Yes |
| STAT420 Theory & Methods of Stat | STAT410 and MATH410 | Yes |
| STAT422 Probability Models | STAT400 or STAT410 | Yes |
| STAT426 Intro Data Sci & ML | MATH241/340, MATH240/461/341, STAT400/410 | **Doubtful.** Credit is granted for only one of STAT426 or CMSC320. It is not formally cross-listed, but the ULC page treats credit-only-granted-for courses like cross-lists |
| STAT430 Stat Computing with SAS | STAT400/410 | Yes |
| STAT440 Sampling Theory | STAT401/420 | Yes |
| STAT464 Intro Biostatistics | **MATH120/136/140** (not MATH141) | **No** by the rule as written |
| STAT470 Actuarial Mathematics | STAT400/410 and MATH241/340 | Yes |
| STAT498 Selected Topics | varies | Case by case |

**MATHSTAT_XXX candidate list.** These are derived from catalog prerequisites `[S13]`. Any eligible STAT4xx course from the table above also qualifies (for example a second STAT course).
- Eligible (prereq is MATH141 directly or transitively; not cross-listed with CMSC): MATH240 (4), MATH241 (4), MATH243 (4), MATH246 (3), MATH310 (3), MATH340 (4), MATH341 (4), MATH401, 402, 403, 404, 405, 406, 410, 411, 416, 420/AMSC420, 423, 424, 430, 431, 432, 436, 437, 440, 445, 446, 452/AMSC452, 461, 462, 463, 464, 470, 484 (all 3 credits).
- **Not eligible:**
  - Cross-listed with CMSC: AMSC460, AMSC466, MATH456, MATH475.
  - Prereq below MATH141: MATH206 (1 credit, MATH140 prereq); MATH212-214, 274, 312, 314, 315, 480, 481.
  - Permission-only or teacher-education courses (status unclear): MATH299, 386, 478, 487, 489, 498.
- The department sample plan places "MATH24x" in this slot `[S10]`. Most students use MATH240, 241 or 246 here.
- **DS, ML and QI tracks:** this slot must be a **linear algebra** course. Allowed: MATH240, MATH461, or MATH341 (MATH341 requires MATH340 first) `[S3]` `[S7]`. The catalog text names only "MATH240" for these tracks `[S1]`.

### 1.3 General Track upper-level CMSC requirements

```
GENERAL_TRACK_UPPER = {
  area_courses: {
    count: 5,                       # five CMSC 400-level courses
    level: 400,
    min_distinct_areas: 3,
    max_per_area: 3,                # extra courses beyond 3 in one area overflow into electives
    credits: 15                     # nominal; CMSC412 is 4 credits
  },
  electives: {
    credits: 6,                     # "two (2) electives, totaling 6 credits"
    eligible: CMSC 3xx/4xx EXCEPT CMSC330, CMSC351 (and any area course not used as one of the 5),
    stic_cap_credits: 3             # at most 3 credits of 1-cr STICs toward degree reqs (3 STICs = 1 elective)
  },
  min_grade: "C-"
}
```
Sources: `[S1]` fn 3, `[S4]`, `[S3]`, `[S6]` FAQ on STICs.

#### 1.3.1 Area assignments (department list, which is authoritative for audits) `[S4]`

| Area | Permanent courses (credits) | Term-limited CMSC498x topics (count **only** if taken in the listed term) |
|---|---|---|
| **1 Systems** | CMSC411 (3), CMSC412 (**4**), CMSC414 (3), CMSC416 (3), CMSC417 (3) | 498B Cloud Computing: Fa2024, Fa2025 · 498C Blockchains/Applied Crypto/Cryptocurrency: Sp2024, Sp2025, Sp2026, Fa2026 · 498I Real World Computer Security: Fa2022 · 498N The Science of Scams: Sp2027 · 498X Intro Parallel Computing: Fa2020 |
| **2 Information Processing** | CMSC420, 421, 422, 423, 424, 426, 427, 470, **471**, 472 (all 3) | 498D Computational Photography: Sp2025, Sp2026 · 498E Robotics: Fa2023, Sp2026, Sp2027 · 498F Advances in XR: Sp2022, Sp2023, Sp2024, Sp2026 · 498K Multimodal Deep Learning: Fa2025 · 498P Generative AI: Sp2027 · 498Y Stat Inference & ML for Genomics: Sp2024, Sp2025, Sp2026, Sp2027 · 498Z Differentiable Programming: Fa2023, Fa2025, Fa2026 |
| **3 Software Eng. & Programming Languages** | CMSC430, **431**, 433, 434, 435, 436, **471** (all 3) | 498G Intro to Privacy: Sp2025, Sp2026 (the course is now CMSC431) · 498J Human-Robot Interaction, Device Prototyping & Embodied AI: Fa2025 |
| **4 Theory** | CMSC451, 452, 454, 456, 457, 474 (all 3) | 498W Economics and Computation: Sp2027 |
| **5 Numerical Analysis** | CMSC460 (3) **or** CMSC466 (3). Credit is granted for only one of AMSC460, AMSC466, CMSC460 or CMSC466 | — |

- **CMSC471 is dual-area (Area 2 OR Area 3).** A solver must assign it to exactly one area.
- Area 5 contributes at most one course in practice, because of the credit-only-granted-for rule.
- **Catalog area lists `[S1][S2]`** are a subset of the department lists. The catalog omits CMSC431 from Area 3 and omits all 498x topics. Otherwise it matches.

#### 1.3.2 Upper-level CMSC courses that count ONLY as electives (no area) `[S4]`

| Course | Credits | Notes |
|---|---|---|
| CMSC320 Intro to Data Science | 3 | |
| CMSC335 Web App Dev with JavaScript | 3 | formerly 398N / 389N |
| CMSC389A Modern Software Development with GenAI | 3 | The suffix "389A" is reused for 1-credit STICs in other terms (PlanetTerp shows "Law and Computer Science", 1 credit). Match on title and term |
| CMSC388x / CMSC389x / CMSC398x STICs | 1 each | max 3 STIC credits toward the degree |
| CMSC395 Teaching Techniques for CS | 1 | TAs only |
| CMSC396 CS Honors Seminar | 1 | Departmental Honors only |
| CMSC401 Algorithms for Geospatial Computing | 3 | cross-listed GEOG470 |
| CMSC425 Game Programming | 3 | |
| CMSC437 Intro to Quantum Software Lab | 3 | |
| CMSC473 Capstone in ML | 3 | formerly 498P |
| CMSC475 Combinatorics & Graph Theory | 3 | cross-listed MATH475 |
| CMSC476 | 3 | The department page says "Robotics and Perception". PlanetTerp says "Capstone in Artificial Intelligence". Not in the 2026-27 approved-course list |
| CMSC477 Robotics Perception and Planning | 3 | **Required by the RAS minor** |
| CMSC488A Quantum Boot Camp | 1 | |
| CMSC498 (any topic not listed under an area) | 1-3 | |
| CMSC498A Independent Study | 1-3 | needs CMSC330 and CMSC351 first |
| CMSC499A Independent Undergraduate Research | 1-3 | needs CMSC330 and CMSC351 first |
| Any 400-level area course beyond the 5 area slots | 3-4 | overflow, for example a 4th course in one area |

**Never count toward upper-level CS:** CMSC330 and CMSC351 (these are separate requirements); all 1xx and 2xx CMSC, including CMSC298A ("does not meet a CS major requirement" `[S8]`). STIC credits beyond 3 count only as general electives `[S6]`.

### 1.4 Upper Level Concentration (ULC) — still required for every track (2025-26 and 2026-27)

```
ULC = {
  credits_min: 12,
  level: 300-499,
  single_discipline: true,          # exceptions: MATH+STAT may be mixed; LGBT+WGSS; multi-prefix minors when declared
  excluded: [any CMSC course, any course cross-listed with CMSC, any course "credit only granted for" with a CMSC course,
             any course used to satisfy a CS major requirement, explicit ineligible list (below)],
  min_credits_per_course: 3,        # catalog only
  max_independent_study_or_experiential: 1 course / 3 credits,
  max_transfer_credits: 6,          # dept only
  gpa_min: 2.0 (catalog) | 1.7 (department, D grades allowed if avg ≥ 1.7),
  pass_fail: only P grades from Spring 2020 / Spring 2021
}
```
Sources: `[S1]` fn 5, `[S3]`, `[S5]`, `[S6]`, `[S10]`.

**Second major or minor:** "Students pursuing a minor or a double major/dual degree may use those courses towards their ULC", with exceptions for a few ineligible disciplines `[S5]`. **MATH/STAT is explicitly an accepted ULC discipline** `[S5]`. So a Math double major will normally satisfy the ULC with 12 credits of MATH/STAT 3xx/4xx courses that are **not** used for the CS major. The ULC does **not** count toward the 6-credit (2-course) major/minor overlap cap `[S5]`.

**Disciplines/programs NOT eligible for ULC** `[S5]`: College Park Scholars, Computer Engineering, Data Science, Honors (HONR/HNUH), Information Science (all INST except certain Shady Grove minors), Quantum Science Engineering.

**Explicitly ineligible courses** `[S5]`. The source says this list is not exhaustive. Courses relevant to this student are in bold.
- AMSC460, AMSC466
- AOSC445, 447
- AREC380
- BIOE442
- BSCI411
- BMGT300, 301/301F, 302/302F, 347, 400, 401, 402, 403, 404, 408E, 408C, 431, 408V
- DATA320, 400
- ECON414, 432, 433
- ENEE350, 426, 436, 446, 447, 456, **457**, 459L, 464
- ENGL381, plus any 39x course used for the FSPW GenEd
- GEOG371, 376, 377, 461, 470, 476, 498I
- GEOL377
- IMDM327, 390, 498I, 498K
- **MATH440, MATH456, MATH461 (after Spring 2020), MATH475**
- PHIL308F, 408F
- PHPE408J
- PHYS457, 474, 476, 486
- PSYC417
- **STAT426, STAT464**
- **Robotics minor: ENAE450, ENEE457, ENEE467, ENEE408I, ENME440, CMSC477, and all CMSC technical electives**
- **The STAT4xx used for the CS major requirement**

**Math/Stat ULC note** `[S5]`: "The STAT4xx course used toward the Statistics requirement for the CS major cannot also be used toward the ULC, so students thinking about the minor in Math or Statistics will need to plan for an extra MATH4xx/STAT4xx." The same logic applies to the `MATHSTAT_XXX` slot if it is filled with a 3xx/4xx course: no course used for the major may also count toward the ULC.

**Robotics minor as ULC** `[S5]`: discouraged. ENAE450, ENEE467 and CMSC477 cannot be used, so the student "will need to take additional courses beyond the minor requirements". For this student, the Math major should be the ULC.

### 1.5 Double-counting rules (CS + Math double major + RAS minor)

| Rule | Detail | Source |
|---|---|---|
| Major ↔ minor overlap | At most **6 credits or 2 courses** may count toward both a major and a minor. The RAS minor states "A maximum of 2 courses may be used to satisfy the requirements of both a major and a minor." | `[S12]` `[S14]` `[S16]` |
| Minor ↔ minor | No course may count toward more than one minor | `[S12]` |
| Major ↔ major (double major, single degree) | **No university-level numeric cap found.** The policy only requires completing all requirements of both majors and filing a plan with both departments. CS imposes no cap on courses shared with a second major. The only CS-side restriction is the ULC rule (a course used for a CS requirement cannot also count for the ULC) | `[S12]` `[S5]` |
| Dual degree (two B.S. degrees) | Minimum 150 credits, and at least 18 credits applied to one degree must not be applied to the other | `[S12]` |
| ULC ↔ minor cap | ULC courses do not count against the 6-credit major/minor overlap | `[S5]` |
| RAS supporting math course | MATH240/340/341/461 or ENEE290. The minor says it "may waive this requirement if they complete the course for another minor or major", so a linear algebra course taken for Math or CS satisfies it | `[S16]` |
| CMSC courses in the RAS minor | CMSC477 (required), plus electives from CMSC421, 422, 426, 427, 451, 498E. Each one used for **both** the CS major and RAS uses one of the 2 overlap slots. **Open question:** is the overlap counted per major (CS and Math separately) or overall? Not stated | `[S16]` `[S12]` |
| BS/MS (FYI) | Up to 9 credits of CMSC 400-level or higher (excluding 498 and 499), or suitable AMSC/MATH/STAT courses, can double-count | `[S6]` FAQ |

### 1.6 Specializations (alternatives to the General Track's upper-level block)

All four specializations keep the lower-level requirements, CMSC330, CMSC351, the STAT and MATH slots, and the ULC. They replace only the upper-level CMSC block (§1.3). The general rule from `[S3]`: "Regardless of track, all CS students must complete 5 Distributive Area courses from at least 3 different areas." The catalog says "from at least 3 areas" for every track `[S1]`.

**Cybersecurity** (21-22 credits) `[S1]` `[S7]`
- Required: CMSC414, CMSC456
- Choose 4 from: CMSC411, 412, 417, 430, **431** (department only), 433, 451
- Electives: 3 credits of CMSC 3xx/4xx, excluding 330 and 351
- Math slots: same as General Track (STAT4xx plus MATH/STAT xxx)

**Data Science** (18-19 credits) `[S1]` `[S7]`
- Math slots are **fixed**: STAT4XX must be **STAT400**, and MATHSTAT_XXX must be **MATH240, MATH461 or MATH341** (the catalog says MATH240)
- Required: CMSC320, CMSC422, CMSC424
- Choose 1 from: CMSC420, 421, 423, 425, 426, 427, 470
- Choose 1 from: CMSC451, 454, 460
- Choose 2 from: CMSC411, 412, 414, 417, 430, 431\*, 433, 434, 435, 471\* (\* department list only)
- No separate elective block

**Machine Learning** (21 credits) `[S1]` `[S7]`
- Math: STAT4xx (prereq MATH141), and MATHSTAT_XXX must be MATH240, 461 or 341
- Required: CMSC320, 421, 422
- Choose 2 from: CMSC426; {CMSC/AMSC460 or CMSC/AMSC466 or MATH401}; CMSC470; 472; 473; 474; 476 (476 is catalog only)
- Electives: 6 credits of CMSC 3xx/4xx, excluding 330 and 351

**Quantum Information** (21-22 credits) `[S1]` `[S7]` `[S10]`
- Math: STAT4xx, and MATHSTAT_XXX must be MATH240, 461 or 341
- Required: CMSC457 (counts as Area 4), PHYS467
- Choose 4 courses from the area lists. Together with CMSC457 these make 5 area courses from ≥3 areas, ≤3 per area. The 4 must cover ≥2 areas other than Area 4. Note that the QI area list omits CMSC498x topics. The catalog version of the QI list also omits CMSC471 and CMSC472 from Area 2 and CMSC431 from Area 3, and the department version includes them
- Electives: 3 credits of CMSC 3xx/4xx, excluding 330 and 351

---

## 2. Tricky rules (hard to encode)

- **T1. Credit totals.** The catalog total of 63-64 = 8 (calc) + 16 (131/132/216/250) + 6 (330/351) + 3 (STAT) + 3-4 (MATH) + 15 (areas) + 12 (ULC). It **excludes** the required 6 elective credits, which appear only in footnote 3. The real major total is 69-70 credits plus 1 if CMSC412 is used, minus 2 if CMSC133 replaces CMSC131. The ULC counts toward this total even though it is not CMSC.
- **T2. Area assignment is a matching problem.** CMSC471 is Area 2 or 3. Courses beyond 3 in an area overflow into the elective pool. Use a bipartite or ILP assignment: choose 5 area slots with ≥3 distinct areas and ≤3 per area, then put leftovers into electives (6 credits).
- **T3. Term-dependent area membership.** CMSC498x topics count for an area only if taken in specific semesters (§1.3.1). The same suffix letter maps to different topics in different terms (498P = Generative AI in Sp2027, formerly 473's number; 389A is reused). Encode (course, suffix, term) → area. Any 498 topic not in the table is a non-area elective.
- **T4. Elective credit vs course count.** The requirement is phrased as "two electives totaling 6 credits", but the 1-credit rules (3 STICs = 1 elective, 1-credit winter courses, 1-3-credit 498A/499A) make it effectively a **≥6 credits** rule. STIC (388/389/398 1-credit) credit is capped at 3.
- **T5. Credit-only-granted-for (COGF) exclusions.** Examples: AMSC/CMSC460/466 mutually exclusive; CMSC131/133/141; CMSC132/142; CMSC320/STAT426/DATA320; CMSC411/ENEE446; CMSC412/ENEE447; CMSC414/ENEE457; CMSC474/ECON414; CMSC416/498X; CMSC431/498G; CMSC471/498O; CMSC473/498P; CMSC335/389N. A planner must refuse double credit.
- **T6. Cross-listed courses.** CMSC456 = MATH456 = ENEE456; CMSC457 = PHYS457; CMSC460 = AMSC460; CMSC466 = AMSC466; CMSC475 = MATH475; CMSC401 = GEOG470. For the ULC and the MATH/STAT slots, any cross-listed version is **excluded**. Whether registering under MATH456 rather than CMSC456 satisfies Area 4 is **not stated** (see U4).
- **T7. "Prerequisite MATH141 or higher".** Whether this means a direct or transitive prerequisite is unstated. Advisors evidently accept 4xx MATH and STAT courses whose prerequisites are MATH240/241 and similar (for example STAT410). The candidate lists in §1.2 assume transitive.
- **T8. ULC exclusivity.** The ULC must not reuse any course already used for a CS requirement. With a Math double major, the Math courses used for STAT4XX and MATHSTAT_XXX cannot be among the 12 ULC credits. Also, MATH440/456/461/475 and STAT426/464 are never ULC-eligible.
- **T9. Track-specific slot narrowing.** DS forces STAT400 plus linear algebra. ML and QI force linear algebra. MATH401 in the ML track counts as a CS requirement and therefore cannot count toward the ULC `[S5]`.
- **T10. Specialization distribution.** Every track must reach 5 area courses from ≥3 areas, but the Cyber and ML pages do not restate the "≤3 per area" cap. Cyber's required 414 and the 411/412/417 choices are all Area 1, so 4 Area 1 courses are possible. It is unclear whether the cap applies (U5).
- **T11. 1.7 vs 2.0 ULC GPA.** The catalog says a 2.0 average. The department FAQ, ULC page and tracking sheets say 1.7, with D grades allowed. Make this configurable; the department figure is what advisors apply.
- **T12. ULC is advisor-entered.** It is updated manually in the audit, around 90 credits.

---

## 3. Catalog vs department discrepancies

| Topic | Catalog (2025-26 = 2026-27) | Department site (live) |
|---|---|---|
| CMSC131 alternatives | CMSC131 only (on the major page) | CMSC131, CMSC133 (2 credits) or CMSC141. CMSC132 or CMSC142 |
| Area 3 list | 430, 433, 434, 435, 436, 471 | adds **431** and term-limited 498G/498J |
| Area topics | none | many 498x topics, term-limited |
| ULC GPA | 2.0 | 1.7 |
| ULC independent study | "Only 1 special topics or independent study course" | "Only up to 3 credits from an independent study or experiential learning course" |
| ULC transfer limit | — | max 6 transfer credits |
| ULC per-course minimum | 3 credits each | not stated |
| DS/ML/QI linear algebra | MATH240 | MATH240, MATH461 or MATH341 |
| CMSC475 title | Combinatorics and Graph Theory | "Combinatorics and Game Theory" (probably a typo) |
| CMSC476 | Listed in ML choices with no title; absent from the course list | "Robotics and Perception" (non-area elective). PlanetTerp: "Capstone in Artificial Intelligence" |

---

## 4. Uncertainties (not verifiable from sources)

- **U1.** There is no official published enumeration of courses acceptable for `MATHSTAT_XXX` or `STAT4XX`. The lists in §1.2 are derived from catalog prerequisites. In particular, STAT426 (COGF with CMSC320), STAT498, MATH4xx topics and DATA400 (cross-listed with STAT400) are unconfirmed.
- **U2.** Whether the 2-course major/minor overlap for the RAS minor is counted against each major separately or in total across both majors. The RAS minor's own text is only "a major".
- **U3.** No limit was found on how many 498A/499A credits can count toward the 6 elective credits (beyond "1-3 credits"). No source says whether graduate CMSC courses (6xx/7xx/8xx) can count as electives or area courses.
- **U4.** Whether registering for a course under a non-CMSC cross-listed number (MATH456, PHYS457, AMSC460/466, MATH475, GEOG470) satisfies the corresponding CMSC area or elective slot.
- **U5.** Whether the "no more than 3 per area" cap applies within the Cybersecurity and ML specializations. Also, how the Cyber and ML elective credits interact with the "5 distributive area courses" rule.
- **U6.** CMSC476's actual title and status. CMSC141 and CMSC142 are missing from the approved-course listing.
- **U7.** I could not retrieve a reliable 2025-26 snapshot of the department General Track page. The live page (effective Spring 2026) was used. Term-limited 498x entries cover terms from Fall 2020 to Spring 2027, so they apply regardless of catalog year.
- **U8.** I found no Math-department rule on CS/Math double-major overlap (the Math double-major page returned 404). Check the Math major research for any cap on CMSC-cross-listed courses (for example MATH456/475) counting toward Math.
- **U9.** Pass/fail eligibility for major courses (other than the ULC exception for Spring 2020/2021) was not checked.

---

## 5. Sources

- `[S1]` UMD Catalog 2026-27, Computer Science Major (live): https://academiccatalog.umd.edu/undergraduate/colleges-schools/computer-mathematical-natural-sciences/computer-science/computer-science-major/
- `[S2]` Same page, **2025-26 catalog**, Wayback snapshot 2025-11-12: https://web.archive.org/web/20251112153406/https://academiccatalog.umd.edu/undergraduate/colleges-schools/computer-mathematical-natural-sciences/computer-science/computer-science-major/
- `[S3]` CS Dept, Degree Requirements for CS Major: https://undergrad.cs.umd.edu/degree-requirements-cs-major
- `[S4]` CS Dept, General Track Degree Requirements / Distributive Areas (All Tracks): https://undergrad.cs.umd.edu/general-track-degree-requirements
- `[S5]` CS Dept, Upper Level Concentration: https://undergrad.cs.umd.edu/upper-level-concentration
- `[S6]` CS Dept, FAQ (STICs, transfer, BS/MS, ULC): https://undergrad.cs.umd.edu/faq
- `[S7]` CS Dept track pages: https://undergrad.cs.umd.edu/cybersecurity-degree-requirements , https://undergrad.cs.umd.edu/data-science-degree-requirements , https://undergrad.cs.umd.edu/machine-learning-degree-requirements , https://undergrad.cs.umd.edu/quantum-information-degree-requirements
- `[S8]` CS Dept, Independent Study CMSC498A: https://undergrad.cs.umd.edu/independent-study-cmsc498a ; CMSC499A: https://undergrad.cs.umd.edu/research-professorial-faculty-cmsc499a
- `[S9]` CS Dept, What 4XX should I take (area per course): https://undergrad.cs.umd.edu/4xxinfo
- `[S10]` CS Dept Academic Plan Templates / tracking sheets (Google Sheet; "Computer Science - General, Effective Spring 2026" tab, plus track tabs): https://docs.google.com/spreadsheets/d/18U7bde-gPG_Bzu-EUTZAZl4PTGI8GQkcPbJRAKRKX5I/
- `[S11]` UMD Catalog, CMSC approved courses: https://academiccatalog.umd.edu/undergraduate/approved-courses/cmsc/
- `[S12]` UMD Catalog, Degree Information (minors, second majors, dual degrees, GPA): https://academiccatalog.umd.edu/undergraduate/registration-academic-requirements-regulations/degree-information/
- `[S13]` UMD Catalog, MATH / STAT / AMSC approved courses: https://academiccatalog.umd.edu/undergraduate/approved-courses/math/ , .../stat/ , .../amsc/
- `[S14]` UMD Provost, Minors policy: https://provost.umd.edu/leadership/minors
- `[S15]` PlanetTerp course API (CMSC141, CMSC142, CMSC476, CMSC389A, CMSC488A): https://planetterp.com/api/v1/course?name=CMSC141 (unofficial; used only to confirm that courses exist and to get titles)
- `[S16]` UMD Catalog, Robotics and Autonomous Systems Minor: https://academiccatalog.umd.edu/undergraduate/colleges-schools/computer-mathematical-natural-sciences/computer-science/robotics-autonomous-systems-minor/
