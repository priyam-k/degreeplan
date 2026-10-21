# UMD General Education + University-Wide Degree Rules (Fall 2025 entry, 2025-2026 catalog)

Research date: 2026-10-21. Target student: matriculated Fall 2025, CMNS, CS + Math double major, Robotics & Autonomous Systems (RAS) minor.

**Catalog-year note.** academiccatalog.umd.edu now serves the **2026-2027** catalog. The 2025-2026 text was read from Wayback Machine snapshots taken Jan–Feb 2026 that carry the "2025-2026 Catalog" banner. Then it was diffed against the live 2026-2027 pages:
- The General Education, Transfer Credit and Prior Learning pages match in substance.
- The Degree Information page changed only in the combined Bachelor's/Master's section. No rule encoded below is affected.
- Policy III-7.00(A) was amended on Nov 7, 2025. See the uncertainties section.

Notation: `[S#]` refers to the numbered sources in section (c).

---

## (a) Structured spec

### a.1 GenEd category codes (complete list; Testudo shows exactly 13 codes for 202508 and 202608) [S10]

| Code | Name (Testudo label) | Block | Courses required | Nominal credits | Per-category rules |
|---|---|---|---|---|---|
| FSAW | Academic Writing | Fundamental Studies | 1 | 3 | Needs **C- or better** [S1][S2][S7]. Must be **attempted by 30 credits and completed by 60** [S2][S4]. AP/IB exemption allowed [S5][S9]. **No SAT exemption** [S5]. ENGL101 (and variants 101A/H/S/X) is the only FSAW course in 2025-26 [S10]. |
| FSPW | Professional Writing | Fundamental Studies | 1 | 3 | No GenEd timing rule. In practice every ENGL39x FSPW course has the restriction "Must have earned a minimum of 60 credits" and the prerequisite "Must have fulfilled FSAW" [S10]. ENGL381/HONR368A are honors-only. No exemption: under GenEd, an "A" in Academic Writing does **not** exempt you from FSPW [S5]. |
| FSOC | Oral Communication | Fundamental Studies | 1 | 3 | Common options: COMM107, COMM200, INAG110, THET285, JOUR130 [S3]. |
| FSMA | Math | Fundamental Studies | 1 | 3 | **Attempt by 30 credits, complete by 60** [S2][S4]. AP/IB exemption allowed. **No SAT exemption** [S5]. Rule: "If a student passes an Analytic Reasoning course that requires Fundamental Studies Math as a prerequisite, the Math requirement has also been fulfilled" [S4][S6]. |
| FSAR | Analytic Reasoning | Fundamental Studies | 1 | 3 (worksheet: 3-4) | "Courses that are designated as both FSMA and FSAR will satisfy both requirements" [S5][S8]. MATH140, MATH120, MATH135 and STAT100 carry `FSAR , FSMA` [S10]. |
| DSNL | Natural Science Lab | Distributive Studies – Natural Sciences | see NS area | 4 | At least 1 of the 2 NS courses must be a lab course [S1][S6]. |
| DSNS | Natural Sciences | Distributive Studies – Natural Sciences | see NS area | 3 | — |
| DSHS | History and Social Sciences | Distributive Studies | 2 | 6 | — |
| DSHU | Humanities | Distributive Studies | 2 | 6 | — |
| DSSP | Scholarship in Practice | Distributive Studies | 2 | 6 | "At least one course must be outside the major and all major requirements" [S1][S5]. |
| SCIS | Signature Courses – Big Question (formerly I-Series) | Big Question overlay on DS | 2 | 6 | Must be DS courses: "Big Question courses must also fulfill a Distributive Studies category" [S5]. **AP credit may not be used** [S1][S7]. The 2 SCIS courses "must be taken at the University of Maryland, College Park" [S1]. The code SCIS meant "I-Series" from Summer I 2012 to Summer II 2024 and "Big Question" from Fall 2024 on [S11]. Earlier I-Series courses count as Big Question [S7]. |
| DVUP | Understanding Plural Societies | Diversity | 1 or 2 | 3-6 | See Diversity rule below. |
| DVCC | Cultural Competency | Diversity | 0 or 1 | 0-3 (courses are 1-3 cr) | Optional. "Students are not required to take a Cultural Competence course" [S6]. |

There are no other active codes. The University Senate approved a replacement of DVUP/DVCC with **DVUS** (Understanding Structures of Racism and Inequality) and **DVSE** (Navigating Diverse Social Environments), and the new rule would be 1 DVUS **and** 1 DVSE. As of Fall 2026 it is **not implemented**: Testudo still lists only DVUP and DVCC [S1-dv][S10]. Keep both in the schema behind a flag, but encode DVUP/DVCC for this student.

### a.2 Block-level requirements (encode as constraints)

```yaml
gened:
  min_total_gened_credits: 40   # see uncertainties: stated mainly in transfer context; program "40-46 credits"
  fundamental_studies:            # 5 courses, nominally 15 credits
    FSAW: {courses: 1, min_grade: "C-", attempt_by_credits: 30, complete_by_credits: 60}
    FSPW: {courses: 1}            # course-level restriction: >=60 earned credits + FSAW done
    FSOC: {courses: 1}
    FSMA: {courses: 1, attempt_by_credits: 30, complete_by_credits: 60}
    FSAR: {courses: 1}
    rules:
      - one course coded FSMA+FSAR satisfies BOTH FSMA and FSAR
      - passing an FSAR course whose prerequisite is FS Math also satisfies FSMA
  distributive_studies:           # exactly 8 course-slots, nominally 25 credits
    natural_sciences: {courses: 2, codes: [DSNS, DSNL], min_lab_courses: 1}   # i.e. DSNL+DSNS or DSNL+DSNL
    DSHS: {courses: 2}
    DSHU: {courses: 2}
    DSSP: {courses: 2, min_outside_all_major_requirements: 1}
    rules:
      - each course may fill at most ONE DS slot even if it carries several DS codes (student chooses)
      - at most 6 of the 8 DS slots may be filled by AP/IB credit
      - up to 3 credits toward a DS category from an approved experiential-learning experience (optional)
  big_question:                   # overlay, normally double-counted with DS
    SCIS: {courses: 2, must_also_fill_DS_slot: true, ap_ib_allowed: false, must_be_taken_at_UMCP: true}
  diversity:                      # overlay, may double-count with DS
    one_of:
      - {DVUP: 2}
      - {DVUP: 1, DVCC: 1}
  general:
    pass_fail_allowed: false      # GenEd courses may not be taken P/F
    min_grade_default: "D-"       # CMNS: D- or higher in all GenEd except FSAW (C-)
```

### a.3 Double-counting matrix (one course, two or more requirements)

| Pair | Allowed? | Authority / note |
|---|---|---|
| FSMA + FSAR (same course coded both) | **Yes, both satisfied** | [S5][S8] |
| DS + DS (course has ≥2 DS codes, always shown as `X or Y`) | **No.** One DS slot only; the student picks | "While a course may be approved for more than one Distributive Studies category, a student may not use one course to meet more than one category requirement. The student may select the preferred category." [S5][S6]. FAQ: "Because students need a minimum of 8 DS courses, students are unable to use one course to meet two DS requirements." [S7] |
| SCIS + DS | **Yes, required.** SCIS always rides on a DS slot | [S5][S7]; checklist: "Normally double-counted with Distributive Studies" [S8] |
| DVUP/DVCC + DS | **Yes** | Catalog: "Courses fulfilling the Diversity requirement may double-count in an approved Distributive Studies category." [S2] |
| DS + SCIS + DV on one course (e.g. `DSHS , DVUP , SCIS`) | **Yes, all three** | Follows from the two rows above. No rule caps it, and such codes are common (15+ courses) [S10] |
| DVUP + DVCC on one course | n/a | No course carries both [S10]. Treat as one Diversity slot only |
| FS + DS / FS + DV | n/a | No course in Fall 2025, Spring 2026 or Fall 2026 carries both [S10] |
| GenEd + major requirement | **Yes** | Catalog: GenEd courses "May also be used to satisfy college, major, and/or supporting area requirements" [S2]. DS page: "Coursework within one's major is permitted to satisfy both the major and general education requirements." [S1]. **Exception:** at least 1 DSSP must be outside **all** major requirements. |
| GenEd + minor requirement | Not explicitly addressed; assume **Yes** | See uncertainties |
| Max number of double-counted courses | **No numeric cap stated** anywhere | — |

### a.4 University-wide degree rules (2025-26 catalog, "Degree Information" [S12] and Policy III-7.00(A) [S16])

| Rule | Value | Exact wording |
|---|---|---|
| Minimum credits | 120 | "No baccalaureate degree will be awarded in instances where fewer than 120 credit hours have been earned." [S12] |
| Residency | ≥30 credits at UMCP, normally the **final 30** | "All candidates for undergraduate degrees from the University of Maryland, College Park must take a minimum of 30 credits in residence. Normally these 30 credits will be the final 30 credits counted toward the degree. However, credits from university-approved study abroad and internship programs, and a maximum of 6 credits that are not part of such programs, may be included in the final 30 if approved in advance by the dean…" [S12] |
| Upper-level | ≥15 credits numbered 300+, of which ≥12 in the major field, **and these sit inside the residency credits** | Catalog: "must take a minimum of 15 credits in courses numbered 300 or above, including at least 12 credits in the major field." [S12]. Policy: "must take a minimum of 30 credits at UMCP. **These must include** a minimum of 15 credits in courses numbered 300 or above, including at least 12 credits in the major field." [S16] |
| GPA | cumulative ≥ 2.00; and ≥ 2.00 across all courses used for **each** major, **each** minor (and certificate) | "minimum 'C' (2.00) cumulative grade point average across all courses used to satisfy major degree requirements, minor requirements, and undergraduate certificate requirements, respectively." [S12] |
| Declare major | by 60 credits | "By the time they complete 60 credits, students are expected to declare a degree-granting major." [S12] |
| Final 15 credits | must be enrolled in the graduating major | [S12] |
| Pass-fail | ≥30 credits earned and GPA ≥2.0 (≥15 credits at UMD); **electives only**; 1 course per semester; ≤12 credits P/F career total | "The courses may not be college, major, field of concentration, or general education program requirements." [S13] |
| Repeats | ≤2 registrations per course (W counts); ≤18 repeated credits in total | [S13][S19] |
| Prior Learning Credit (AP/IB/A-Level/CLEP/BMT) | ≤60 credits ("up to one-half of the credits required … Usually, this is no more than 60"); CLEP ≤30 | [S14][S15] |
| Transfer max | ≤90 transfer credits from 4-yr institutions or any combination of 4-yr, 2-yr and PLC; ≤70 credits from 2-yr institutions (for students matriculating Fall 2022 or later) | [S17] |
| Credit-by-exam in final 30 | Not allowed without Provost permission; even with permission, at most 6 of the final 30 | [S14] |
| Transfer min grade | C- (regionally accredited); D- from MD public institutions, but degree requirements may need more | [S17] |

**Second major (double major, same degree, one diploma)** [S12][S16]:
- There is **no university-wide minimum of unique credits** for a second major, and the total stays at **120**.
- "Courses taken for one major may be counted as appropriate as part of the degree requirements for the general education programs." [S12]
- Policy: "Courses taken for one major may be counted as part of the degree requirements of the other and toward general education requirements as appropriate." and "Approval will not be granted if there is extensive overlap between the two programs." [S16]
- Must complete all requirements of both majors.
- Filing deadline: catalog says "no later than one full academic year before the expected date of graduation" [S12]. The Nov-2025 policy text says "one full semester" [S16].
- If two colleges are involved, the student designates one college for records and GenEd certification. Here both majors are in CMNS, so this does not apply.

**Second degree (two diplomas)**: simultaneous or sequential, **≥150 credits**, and "At least 18 of the credits applied to one degree must be in course work not applied to the requirements of the other degree program." [S12]. CS (B.S.) + Math (B.S.) in the same college is normally a **double major, not a double degree**. Encode the 150/18 rule only when `program_type == "dual_degree"`.

**Minors (university-wide, "with rare exceptions")** [S12]:
- 15–24 credits.
- ≥9 credits at 300+.
- **≤6 credits (or two courses)** may count toward both a minor and a major program.
- ≤6 credits (or two courses) from another institution.
- ≥6 upper-division minor credits taken at UMCP.
- **No course may be used for more than one minor.**
- Every minor course needs a grade of **C-** or better.
- Minor GPA ≥ 2.00.
- Declare no later than 1 full academic year before graduation.
- Posted on the transcript only when the degree is completed.
- RAS minor page: "A minimum grade of C- or better is required for all minor and all prerequisite courses. A maximum of 2 courses may be used to satisfy the requirements of both a major and a minor." [S20]

### a.5 CMNS college-level rules (beyond major + GenEd)

The 2025-26 CMNS catalog page lists **no college-level curricular requirements**: there are no extra college courses and no college GenEd overlay [S21]. The CMNS Academic Policies page adds these planner-relevant rules [S19]:
- **Minimum grades:** "A 'D-' or higher is required in all Gen Ed courses except Academic Writing (e.g., ENGL101), which requires a 'C-' or higher". Also "A 'C-' or higher is required in all major courses (unless specified otherwise…)".
- **Max credit load:** "Students may take a maximum of 17 credits per fall or spring semester, 4 credits per winter semester, and 8 credits in a single summer session."
- **Repeats:** max 2 attempts per course; max 18 repeated credits; a W counts as an attempt.
- **Final 30 credits** must be at UMD "with some exceptions". A permission-to-enroll form is required before taking a course elsewhere. A course that was attempted at UMD (including a W) cannot be repeated elsewhere.
- **Benchmarks** are major-specific; missing them risks dismissal from the major [S22].
- **Double major:** it must be officially added 1 year before graduating. A request to add a major or minor is **denied if it would require an exception to policy**, for example exceeding attempted or repeat credit limits [S23].

Related CS-major rule that touches the double major and minor (from the CS department) [S24]. The CS **Upper Level Concentration (ULC)** is 12 credits at 300-400 level in one non-CMSC discipline:
- "Students pursuing a minor or a double major/dual degree may use those courses towards their upper-level concentration."
- "No courses used for the Computer Science major can be used for the ULC."
- "ULC does not count toward the 6 credits/2 courses that can overlap between a major and minor."
- Transfer credit ≤6.
- Students using English courses cannot count the FSPW course toward the ULC.
- ULC GPA ≥ 1.7.

A Math double major therefore satisfies the ULC with upper-level MATH/STAT courses. The first STAT4xx cannot count because the CS major requires it.

### a.6 AP / IB / transfer → GenEd mapping (general rules + chart excerpts)

General rules:
- AP/IB credit carries the GenEd codes of the **UMD equivalent course** listed in the registrar's chart for the year the exam was taken. A generic credit such as "Lab Science (DSNL)" fills that DS slot with no specific course [S9].
- Limits: ≤6 of the 8 DS slots from AP/IB [S5]. **Never SCIS** from AP [S1].
- There is no duplicate credit for an exam plus the equivalent course. A UMD course supersedes the AP credit [S14].
- Exams taken after matriculation, or repeated, get no credit [S14].
- "Lower Level Elective" (L1) counts toward the 120 credits only [S9].
- Transfer codes in the TCS database/unofficial transcript [S11]: specific course, a GenEd code (`FSAW … DVCC, SCIS`), or an elective code. **G1/G2** = "elective that applies to the 40 credit Gen Ed count, but not a specific general education requirement". **L1/L2** = lower/upper elective. **N1/N2/NS/NE** = needs syllabus/evaluation. **LB** = lab.
- MD public institution with a completed GenEd program or an associate's degree = GenEd complete except "any upper-level requirements" (i.e. FSPW) plus enough credits to reach 40 [S17][S3].

AP chart for exams May 2023–May 2026 [S9]. Rows relevant to this student:

| AP exam | Score | UMD credit (GenEd) |
|---|---|---|
| Calculus AB | 4-5 | MATH140 (FSMA and FSAR), 4 cr; 3 → 3 cr lower-level elective |
| Calculus BC | 4-5 | MATH140 (FSMA and FSAR) + MATH141, 8 cr. AB and BC credit are not both granted |
| BC with AB subscore | 4-5 subscore | MATH140 (FSMA and FSAR) when BC ≤3 |
| Statistics | 4-5 | STAT100 (FSMA and FSAR) |
| Precalculus | 4-5 | MATH115 (FSMA) |
| English Language & Comp | 4-5 | Academic Writing (FSAW) → **this is the FSAW exemption** |
| English Lit & Comp | 4-5 | ENGL278 + elective (no FS code) |
| Computer Science A | 5 → CMSC131; 4 → 3 cr elective; 3 → 2 cr elective | no GenEd |
| Physics C: Mech | 4-5 | PHYS161 + PHYS261 (DSNL); 3 → generic DSNL |
| Physics C: E&M | 4-5 | PHYS260 + PHYS271 (DSNL); 3 → generic DSNL |
| Physics 1 / 2 | 4-5 | PHYS121 / PHYS122 (DSNL); 3 → generic DSNL |
| Chemistry | 4 → CHEM131+132 (DSNL); 5 → + CHEM271 | — |
| Biology | 4-5 | BSCI160/161 (DSNL) **and** BSCI170/171 (DSNL), 8 cr, which fills the whole NS area; 3 → generic DSNL |
| Environmental Sci | 4-5 | generic DSNS |
| Macro / Micro Econ | 4-5 | ECON201 / ECON200 (DSHS); 3 → generic DSHS |
| US Gov | 4-5 | GVPT170 (DSHS); 3 → generic DSHS |
| Psychology | 4-5 | PSYC100 (DSHS or DSNS) |
| US History | 4 → HIST200 (DSHS or DSHU) **or** HIST201 (DSHS or DSHU and DVUP); 5 → both | — |
| Human Geography | 4-5 → GEOG202 (DSHS and DVCC); 3 → generic DSHS | — |
| Art History | 4-5 → ARTH200 or ARTH201 (DSHU and DVUP) | — |
| African American Studies | 4-5 → AASP100 (DSHS and DVUP) | — |
| Music Theory | 3-5 → MUSC140 (DSSP) | — |
| Studio Art Drawing / 2D | 4-5 → ARTT110 / ARTT100 (DSSP) | — |

IB (Nov 2023–May 2026) [S18]: Math AA/AI HL 5-7 → MATH140 + STAT100 (FSMA & FSAR); Physics HL 5-7 → PHYS121+122 (DSNL); Chem/Bio HL → CHEM131/132 or BSCI160/161 + 170/171 (DSNL). **No IB English exam yields FSAW.** An English A L&L HL extended-essay portfolio option exists ("PF").

**Exemptions summary (encode):**
- `FSAW`: satisfied by AP English Language 4/5. A portfolio review is also possible via the Academic Writing Program (TCS footnote PF) [S11]. **Not** by SAT.
- `FSMA`: satisfied by any FSMA-coded course (MATH107/113/115/120/135/140, STAT100, DATA100), by AP/IB equivalents above, or by passing an FSAR course that has FS Math as a prerequisite. **Not** by SAT. The Math Placement Test is not listed as an exemption.
- No other GenEd category has an exemption mechanism other than AP/IB/transfer course equivalency.

### a.7 How codes appear on Testudo (Schedule of Classes) — parsing grammar

Testudo course listings show a `GenEd:` line. Grammar observed across all 1,004 distinct course/code strings in 202508, 202601 and 202608 [S10]:

```
gened_line  := group ( " , " group )*            # comma = ALL groups conferred
group       := alt ( " or " alt )*               # "or" = student picks exactly ONE alt
alt         := CODE [ " (if taken with " COURSE_ID ")" ]   # conditional alt
CODE        := FSAW|FSPW|FSOC|FSMA|FSAR|DSNL|DSNS|DSHS|DSHU|DSSP|SCIS|DVUP|DVCC
```

Precedence is "or" binding tighter than ",". So `DSHS or DSHU , DVUP` = (DSHS | DSHU) AND DVUP.

Every distinct pattern observed (count of courses across the three terms):

```
DSSP(213) DSHU(117) DSHS(73) "DSHS , SCIS"(69) "DSHU , DVUP"(64) "DSHS , DVUP"(59) DVCC(41)
"DSSP , SCIS"(35) DVUP(31) DSNS(26) "DSHU , SCIS"(25) "DSNS , SCIS"(23) FSPW(20) FSAR(16)
"DSHU or DSSP"(16) "DSHS , DVUP , SCIS"(15) "DSHU , DVUP , SCIS"(14) FSOC(13) "DSSP , DVUP"(12)
DSNL(11) "DSHS or DSHU , DVUP"(11) "DSHS or DSHU"(8) "DSSP , DVCC"(7) "DSHS or DSSP"(7)
"FSAR , FSMA"(6) FSAW(5) "DSHU or DSSP , SCIS"(5) "DSHS or DSHU , SCIS"(5) "DSHS , DVCC"(5)
"DSHS or DSSP , SCIS"(4) "DSHS or DSHU , DVUP , SCIS"(4) FSMA(3) "DSNL (if taken with PHYS275) or DSNS"(3)
"DSNL , SCIS"(3) "DSHS , DVCC , SCIS"(3) "DSNS or DSSP , SCIS"(2) "DSNL (if taken with PHYS261)"(2)
"DSNL (if taken with GEOL110) or DSNS"(2) "DSNL (if taken with BSCI180) or DSNS"(2) "DSHU or DSSP , DVUP"(2)
"DSSP , DVUP , SCIS" "DSSP , DVCC , SCIS" "DSNS or DSSP , DVUP , SCIS" "DSNS or DSSP" "DSNL or DSSP"
"DSNL (if taken with X) or DSNS" for X in {PLSC113, PLSC111, CHEM177, CHEM136, CHEM132, BSST241, BSCI171, BSCI161}
"DSNL (if taken with X)" for X in {PHYS271, PHYS107, PHYS103, GEOG211}
"DSNL (if taken with AOSC201) or DSNS , SCIS" "DSNL , DVUP" "DSHU , DVCC , SCIS" "DSHS or DSNS , SCIS" "DSHS or DSNS"
```

Facts the parser and rule engine need:
- The **lab partner course carries no GenEd code.** CHEM132, PHYS261, PHYS275 and BSCI161 show nothing. The pair counts as **one** DSNL DS-course: lecture plus lab, about 4 credits. Taken alone, the lecture is DSNS when the line has `or DSNS`; when it does not (e.g. PHYS260, GEOG201), the lecture alone gets **nothing**.
- "if taken with" means the **same term**. Course notes say "only when taken concurrently with PHYS275" and "If taken in the same term as BSST241" [S10].
- **Codes are per term and can change.** BSCI160 is "DSNL (if taken with BSCI161) or DSNS" in 202508/202601 but "(if taken with BSCI180)" in 202608. BSCI455 changed credits. Store GenEd codes keyed by (course, term).
- The AP chart uses a different textual notation, "(DSHS or DSHU and DVUP)", with the same semantics as `DSHS or DSHU , DVUP` [S9].
- The academiccatalog.umd.edu course descriptions do **not** show GenEd codes. Testudo SOC is the source.
- Relevant to this student: CMSC131/132/216/250/330/351, MATH141/240/241/246 and STAT400 carry **no** GenEd codes. MATH140 = `FSAR , FSMA`. ENGL101 = FSAW. ENGL390–395/398x = FSPW. PHYS161/171 = `DSNL (if taken with PHYS275) or DSNS`. PHYS260 = `DSNL (if taken with PHYS261)`. CHEM131 = `DSNL (if taken with CHEM132) or DSNS`. ENES210 = `DSSP , SCIS` [S10].
- Unofficial transcript / degree audit display (Testudo login) was **not** verifiable. See uncertainties.

---

## (b) Tricky rules (things a naive encoder will get wrong)

1. **The NS area is "2 courses, ≥1 DSNL"**, not "1 DSNS + 1 DSNL". Two DSNL courses are valid. The 7-credit figure is nominal (4+3).
2. **A multi-DS-coded course fills exactly one DS slot**, and its `or` alternatives are a choice. Run an assignment/matching solver (bipartite matching or ILP) over DS slots, not greedy per-course assignment. A course like `DSNS or DSSP , DVUP , SCIS` can fill DSNS **or** DSSP, and it **also** satisfies DVUP and SCIS.
3. **SCIS is an overlay, not an extra 2 courses.** It only counts if the course also fills one of the 8 DS slots. If a student's SCIS course ends up not being used as a DS slot, the SCIS should arguably not count. Enforce: `SCIS courses ⊆ DS-slot courses`.
4. **Diversity is an overlay.** DVUP/DVCC courses may also fill DS slots. A course with **only** `DVUP` or `DVCC` (31 and 41 such courses) counts toward Diversity but takes no DS slot. Diversity = 2×DVUP **or** 1×DVUP + 1×DVCC. 2×DVCC is **invalid**.
5. **FSMA+FSAR double-satisfaction.** MATH140 (required by both CS and Math) satisfies both FS math categories. An FSAR course whose prerequisite is FS Math also implies FSMA. MATH141 and higher carry no codes, so a student who placed straight into MATH141 with no AP/transfer MATH140 has **no** FSMA/FSAR on record. Flag them for advisor review.
6. **DSSP "outside the major and all major requirements".** For a CS+Math double major, assume "outside **both** majors' requirements, including supporting courses and the CS ULC". CMSC DSSP courses (CMSC122/125/115/298Q) are non-major courses anyway.
7. **AP/IB ≤6 of 8 DS slots; SCIS never from AP; SCIS must be taken at UMCP.**
8. **Timing (warnings, not hard failures):** FSAW and FSMA attempted by 30 credits and completed by 60. FSPW courses are effectively ≥60 earned credits and FSAW done (a course restriction). Whether "credits" includes AP credits for the 30/60 clocks is not specified. FSPW courses with the 60-credit restriction count total earned credits, AP included.
9. **Grades:** GenEd min D- (CMNS), FSAW C-. A GenEd course can **not** be P/F. Major and minor courses need C-, and RAS also needs C- in its prerequisites. Major GPA ≥2.0 per major. Minor GPA ≥2.0.
10. **Upper-level 15 / major-field 12 must be in residence** (policy text). For a double major, apply 12 per major to be safe (see uncertainties).
11. **Residency = final 30 credits normally.** Exceptions: approved study abroad or internship programs, or ≤6 other credits with prior dean approval. Credit-by-exam counts as resident credit, but is limited in the final 30.
12. **Major/minor overlap ≤2 courses (≤6 credits)**, and no course may count toward two minors. The CS ULC does **not** consume the RAS overlap allowance (CS dept). The rule is stated as minor-vs-"a major program". With two majors, assume the cap applies per minor against the union of both majors (conservative).
13. **Double major does not require unique credits** (unlike a dual degree: 150 credits, 18 unique). But "approval will not be granted if there is extensive overlap" is non-quantified. Surface it as a soft warning, not a hard rule.
14. **GenEd designations vary by term**, so key by course+term. "or" choices are made at audit time by the student/advisor, so the planner should optimize them.
15. **Lab partner courses have no codes.** Detect pairs from "(if taken with X)" and require the same term.
16. **The 40-credit GenEd minimum** is mainly relevant to transfers (G1/G2 codes "apply to the 40 credit Gen Ed count"). For a native student who completes all categories, overlap can push GenEd-coded credits below 40. Example: MATH140 counts 4 credits for two categories, and DV/SCIS overlay. Whether the audit then enforces 40 is unclear; implement it as a warning.
17. **CMNS load caps:** 17 credits fall/spring, 4 winter, 8 per summer session. These are useful hard constraints for a semester planner.
18. **PLC cap 60 credits; transfer cap 90; ≥30 at UMD.** Excess AP credit is not "lost", but it cannot apply beyond the cap.

---

## (c) Sources (fetched 2026-10-21)

- [S1] gened.umd.edu Distributive Studies — https://gened.umd.edu/students/requirements/distributive-studies. [S1-dv] Diversity — https://gened.umd.edu/students/requirements/diversity. Fundamental Studies — https://gened.umd.edu/students/four-categories/fundamental-studies. Big Question — https://gened.umd.edu/students/four-categories/big-question. Requirements overview — https://gened.umd.edu/node/35
- [S2] 2025-2026 Undergraduate Catalog, General Education (Wayback 2026-01-10) — https://web.archive.org/web/20260110205154/https://academiccatalog.umd.edu/undergraduate/general-education-requirements/ (live 2026-27: https://academiccatalog.umd.edu/undergraduate/general-education-requirements/, identical text)
- [S3] Gen Ed FAQs — https://gened.umd.edu/faqs-gened.html ; Transfer students — https://gened.umd.edu/students/students-transfer-students
- [S4] Gen Ed Folder text-only version (2024) — https://gened.umd.edu/sites/default/files/2024-04/genedtext_0.pdf
- [S5] General Education Summary Chart for Advisors, rev. Apr 2 2024 — https://gened.umd.edu/sites/default/files/2024-04/General%20Education%20Summary%20Chart%2C%2020240402_0.pdf
- [S6] Advisor Resources — https://gened.umd.edu/advisors/advisor-resources
- [S7] Gen Ed folder FAQ section (same PDF as S4). Includes "When a course has two Distributive Studies designations, why can't I fulfill two requirements with it?" and "Courses previously taken as I-Series courses count as Big Question courses."
- [S8] Gen Ed Checklist — https://gened.umd.edu/node/51
- [S9] Registrar AP chart, exams May 2023–May 2026 — https://registrar.umd.edu/sites/default/files/2023-03/ap-gen-ed.pdf (index: https://registrar.umd.edu/transfer-credit/prior-learning-credit)
- [S10] Testudo Schedule of Classes GenEd listings — https://app.testudo.umd.edu/soc/gen-ed/202508 (and /202601, /202608, per-code e.g. https://app.testudo.umd.edu/soc/gen-ed/202508/DSNL). Course search, e.g. https://app.testudo.umd.edu/soc/search?courseId=PHYS161&termId=202608
- [S11] Registrar Transfer Credit Services codes — https://registrar.umd.edu/node/177/
- [S12] 2025-2026 Catalog, Degree Information (Wayback 2026-02-11) — https://web.archive.org/web/20260211053820/https://academiccatalog.umd.edu/undergraduate/registration-academic-requirements-regulations/degree-information/
- [S13] 2025-2026 Catalog, Academic Records & Regulations (Wayback 2026-01-13) — https://web.archive.org/web/20260113081922/https://academiccatalog.umd.edu/undergraduate/registration-academic-requirements-regulations/academic-records-regulations/
- [S14] 2025-2026 Catalog, Prior Learning Credit (Wayback 2026-01-28) — https://web.archive.org/web/20260128231335/https://academiccatalog.umd.edu/undergraduate/registration-academic-requirements-regulations/prior-learning/
- [S15] Registrar Prior Learning Credit — https://registrar.umd.edu/transfer-credit/prior-learning-credit
- [S16] Policy III-7.00(A) UMCP Degree Requirements (amended Nov 7 2025) — https://policies.umd.edu/policy/57171f29-cf74-41b2-b3d2-ce392e75589c/
- [S17] 2025-2026 Catalog, Transfer Credit (Wayback 2026-01-04) — https://web.archive.org/web/20260104003733/https://academiccatalog.umd.edu/undergraduate/registration-academic-requirements-regulations/transfer-credit/
- [S18] Registrar IB chart Nov 2023–May 2026 — https://registrar.umd.edu/sites/default/files/2024-07/ib-gen-ed-may-2024.pdf
- [S19] CMNS Academic Policies — https://cmns.umd.edu/undergraduate/current-students/student-services/academic-policies
- [S20] 2025-2026 Catalog, Robotics and Autonomous Systems Minor (Wayback 2025-11-24) — https://web.archive.org/web/20251124110538/https://academiccatalog.umd.edu/undergraduate/colleges-schools/computer-mathematical-natural-sciences/computer-science/robotics-autonomous-systems-minor/
- [S21] 2025-2026 Catalog, CMNS college page (Wayback 2026-01-10) — https://web.archive.org/web/20260110031023/https://academiccatalog.umd.edu/undergraduate/colleges-schools/computer-mathematical-natural-sciences/
- [S22] CMNS Benchmarks — https://cmns.umd.edu/undergraduate/current-students/student-services/academic-planning/benchmarks
- [S23] CMNS Declaring a Major or Minor — https://cmns.umd.edu/undergraduate/advising-academic-planning (redirects to /undergraduate/current-students/student-services/declaring-cmns-major-or-minor)
- [S24] CS Upper Level Concentration — https://undergrad.cs.umd.edu/upper-level-concentration

Fact → source quick map:
- FSAW C-: S1, S2, S5, S17
- 30/60 timing: S2, S4
- FSMA+FSAR both: S5, S8
- FSAR-implies-FSMA: S4, S6
- One DS per course: S5, S6, S7
- AP ≤6 DS, SCIS not AP, SCIS at UMCP: S1, S5
- DV double-count with DS: S2, S5
- DSSP outside major: S1, S2, S5
- No P/F for GenEd: S2, S13
- D- GenEd min: S19
- 120 / residency / upper-level: S12, S16
- Minor rules: S12
- Second major/degree: S12, S16
- PLC 60 / CLEP 30: S14, S15
- Transfer 90/70: S17
- Testudo grammar: S10
- SCIS naming history: S11

---

## (d) Uncertainties / items to verify with an advisor or gened@umd.edu

1. **Which catalog governs, and the Nov-2025 policy amendment.** III-7.00(A) was amended Nov 7, 2025, mid-year. It now says the second-major/second-degree plan is due "one full semester" before graduation, versus "one full academic year" in the 2025-26 catalog. It also sets 180 credits for a dual degree involving Special Education. The core numbers (120, 30, 15/12, 150) did not change.
2. **Upper-level 15/12 for a double major.** Is it ≥12 upper-level resident credits in **each** major or in the primary only? Not specified. Conservative choice: each.
3. **Upper-level credits in residence.** The policy places them inside the 30 resident credits, while the catalog lists them as a separate bullet under "Credits in Residence". Treat them as resident.
4. **40-credit GenEd minimum for native students.** It is stated as a university minimum in transfer contexts and in the FAQ. Whether the degree audit fails a native student who meets every category but has <40 GenEd-coded credits is unverified.
5. **GenEd + minor double counting.** The catalog explicitly allows GenEd to overlap "college, major, and/or supporting area" requirements. Minors are not mentioned, but nothing prohibits overlap. Assume allowed.
6. **Major–minor overlap with two majors.** The ≤2 courses/6 credits cap is phrased per "a major program". Unclear whether RAS may share 2 courses with CS **and** 2 with Math. Assume 2 total against the union until confirmed by the CS/RAS advisor.
7. **DSSP "outside the major" for a double major.** Assume outside both majors and all their requirements. Also unknown: whether a DSSP course used toward the CS ULC (a CS major requirement) is "inside" the major.
8. **SCIS counting when the course is not used as a DS slot.** For example, a 9th DS course, or a course whose DS slot was taken by another course. Rules say Big Question courses "must also fulfill a Distributive Studies category"; the encoding in (b)#3 is an interpretation.
9. **SCIS by transfer.** The TCS code list includes SCIS as a possible transfer code, but the gened site says the I-Series/Big Question courses must be taken at UMCP. Edge case; not relevant to a native student.
10. **FSMA via placement only.** If a student places into MATH141 by the placement test with no MATH140 credit, no published rule grants FSMA/FSAR (an old CORE page says placement "is not a means … to satisfy" FS Math). Needs advisor confirmation.
11. **30/60-credit clocks.** Unknown whether AP/transfer credits count toward the "attempt by 30 / complete by 60" thresholds. Enforcement is via advising holds, not degree denial.
12. **GenEd code versioning.** Assumed rule: the designation in effect in the term the course was taken applies. Not explicitly stated, but implied by per-term Testudo codes and the "I-Series counts as Big Question" note.
13. **Unofficial transcript / degree audit format.** Testudo's unofficial transcript and the degree audit require UMD login and could not be inspected. The parsing grammar in a.7 is verified only for the public Schedule of Classes and the AP chart.
14. **Diversity reform (DVUS/DVSE).** Approved in March 2022, but not implemented as of Fall 2026 Testudo. If it is implemented with a catalog-year grandfathering rule, a Fall-2025 entrant would most likely stay on DVUP/DVCC. Unconfirmed.
15. **"Experiential learning up to 3 credits toward a DS category"** appears on advisor materials [S5][S6], but its implementation in the audit is unknown. Ignore unless the user adds such a course.
16. **DVCC credit range.** Advisor pages say "0-3"; actual DVCC courses are 1-3 credits. Count a DVCC course of any credit value as one Diversity course.
