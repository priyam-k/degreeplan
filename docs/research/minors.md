# Popular UMD Minors: Requirements Research

Researched 2026-10-25. The live catalog at academiccatalog.umd.edu is now the **2026-2027** edition. The **2025-2026** pages were read from Wayback Machine snapshots (Nov 2025 to Mar 2026; footer "© 2025-2026") and diffed against the live pages. All six minors have the **same requirements in both editions**; differences are listed per minor (titles, one Spring 2026 addendum).

Program files: `src/programs/{stat,math,cs,data-science,general-business,tech-entrepreneurship}-minor.yaml`, with tests in `src/programs/tests/`.

Major/minor overlap (at most 2 courses, none between minors) is applied globally in `index.ts` and is not re-encoded in these files.

---

## Why these minors

UMD publishes no headcount by minor. IRPA's Campus Counts reports count primary majors only [P1], and no Diamondback or university report ranks minors by current enrollment. The choice therefore combines the capacity figures that departments do publish with how well each minor fits the majors being added to the planner.

**The majors this planner covers are UMD's largest.** Fall 2021 undergraduate headcount by primary major [P1]: Computer Science 3,092; Biological Sciences 1,675; Mechanical Engineering 1,218; Information Science 1,207; Public Health Science 1,137; Psychology 1,130; Finance 935; Criminology 907; Government & Politics 837; Economics 760. CS reached 3,725 majors by Fall 2023 [P2].

| Minor | Evidence of demand / fit |
|---|---|
| **General Business** (Smith) | The Smith School admits about **250 students a year**, its largest minor intake. Entrepreneurial Leadership admits about 180 and Business Analytics about 65 [P3]. Open to every non-business major, so it serves CS, engineering, bio, psych and econ students alike. |
| **Data Science** (CMNS) | **100 seats for AY 2025-26 were all filled by September 2025.** Thirty extra seats opened for Spring 2026, and up to 100 more are offered for AY 2026-27 [P4]. The minor began in 2023 and grew quickly. It fits bio, public health, psych, econ and engineering students. |
| **Computer Science** (CMNS) | CS is the largest major, and the minor uses the same limited-enrollment (LEP) gateway as the major. The department says it can't advise students before they declare "due to the volume" [P5]. It is the usual minor for Math, Econ, Info Sci, engineering (not CompE) and science majors. |
| **Statistics** (CMNS) | It complements CS, Econ, Psych, Public Health and engineering. MATH241 and STAT400 already appear in many of those majors. No published counts. |
| **Mathematics** (CMNS) | This is the classic pairing for CS, Econ, Physics and engineering majors, who already have MATH240/241. No published counts. |
| **Technology Entrepreneurship & Corporate Innovation** (Clark/Mtech) | Open to any major with rolling, uncapped admission. Mtech's entrepreneurship courses enroll over 1,000 students a year [P6]. Its courses (ENES140/210) are popular GenEd courses for engineering and CS students. |

Also considered:
- **Sustainability Studies:** a 2013 report named it UMD's second-largest minor with 213 students [P7], but the data is old and it fits these majors less well.
- **Business Analytics:** small intake (about 65 a year) and many electives restricted by major.
- **Actuarial Mathematics:** small. It is also mutually exclusive with the Math and Stat minors [S-M].
- **Entrepreneurial Leadership:** a competitive Smith minor. TECI covers the same students without a cap.

---

## 1. Statistics Minor (`stat-minor`)

Sources: catalog [S1], Math department minors page [S-M]. 2025-26 and 2026-27 text identical.

**Requirements (16 credits)**
- MATH241 or MATH340 (4 cr).
- One pair: **STAT400 + STAT401**, **STAT410 + STAT420**, or **STAT410 + STAT401** (6 cr).
- STAT430 (3 cr).
- One of: a third course from the pairs, STAT422, STAT426, STAT440, STAT470, MATH424 (3 cr).

**Rules**
- Not open to Mathematics majors. A student may hold only one of the Math, Stat and Actuarial minors [S-M].
- C- or better in each course; 2.0 minor GPA.
- At most 2 courses from another institution, and at most 1 upper-level course from elsewhere.
- STAT400 and ENEE324 are duplicate credit [S-M]. ENEE324 is not listed as a substitute.

**Encoding**
- Buckets: `calc3`, `pair` (choose 2 of STAT400/401/410/420), `stat430`, `elective`.
- `anySet pair-seq` enforces the three allowed pairs.
- `maxFrom transfer-max` (2 courses) and `maxFrom transfer-upper` (1 course at 300+) use the match `{any: ["*"], except: "@umd"}`.
- SURV410 and SURV440 are accepted as the cross-listed STAT410 and STAT440. Their catalog entries say "credit only for STAT410 or SURV410".

## 2. Mathematics Minor (`math-minor`)

Sources: [S2], [S-M]. 2025-26 and 2026-27 text identical.

**Requirements: at least 22 credits beyond first-year calculus (19 if exempt from MATH310)**
- MATH241 or MATH340.
- One of MATH240, MATH461, MATH341.
- MATH310, unless exempted. Exemption needs B- or better in CMSC250, A- or better in MATH240 and 241, or B- or better in MATH340 and 341 [S-M].
- Theory: one of MATH403, 405, 410.
- Algebra: one of MATH401, 402, 403, 405, 406, 423.
- Analysis: one of MATH410, 416, 462, 463, 464.
- Probability: STAT400 or STAT410 ("others as approved by UGO"). ENEE324 is not accepted [S-M].
- If the credits fall short, any 400-level MATH/STAT/AMSC course counts, except:
  - catalog: MATH478, MATH480-484, MATH489, MATH498, STAT464;
  - department page, additionally: MATH400, MATH461, MATH477.

**Rules**
- Not open to Math majors; only one of the Math, Stat and Actuarial minors.
- C- or better in each course; 2.0 minor GPA.
- At most one 400-level course from another institution (catalog). The department page adds at most 2 transferred courses in total.

**Encoding**
- Buckets: `calc3`, `linalg`, `math310` (waivable), `theory`, `algebra`, `analysis`, `probability`, and an optional `extra` bucket that uses the union of both exclusion lists.
- `minFrom credits` requires **19 credits over every bucket except MATH310**. That equals the 22-credit rule when MATH310 is taken and the 19-credit rule when it is waived.
- `maxFrom transfer-max` (2 courses) and `transfer-400` (1 course at 400+).
- **Interpretation:** theory, algebra and analysis must be **different courses**. The 22-23 credit total in the catalog assumes four distinct 400-level courses. Whether MATH403/405/410 may fill two areas at once is unconfirmed.

## 3. Computer Science Minor (`cs-minor`)

Sources:
- catalog 2025-26 [S3];
- CS department minor page [S5];
- department tracking sheet "2608 CS Minor Curriculum Tracking Sheet" (Fall 2026) [S5b].

**Requirements**
- The catalog requires CMSC132, CMSC216, CMSC250, CMSC330 and CMSC351, plus two 400-level CMSC courses from a list. MATH140 and CMSC131 are prerequisites for entry. Total 15-24 credits.
- The department's current version differs:
  - CMSC131, CMSC132 and MATH140 (B- or better) are **admission gateways**;
  - "Required coursework" is MATH141, CMSC216, CMSC250, CMSC330 and CMSC351;
  - the 2 electives come from a list that adds **CMSC431** to the catalog's list.
- Elective list: CMSC411, 412, 414, 416, 417, 420, 421, 422, 423, 424, 426, 427, 430, 431\*, 433, 434, 435, 436, 451, 452, 454, 456, 457, 460, 466, 470, 471, 472, 474. (\* department list only.)
- At most one of CMSC460/466.
- One CMSC498 independent study (3 cr) may replace one elective, with the Undergraduate Director's permission.
- Students who place out of all three of CMSC132, 216 and 250 take one more 400-level course.

**Rules [S5]**
- Admission:
  - limited enrollment with a 3.0 UMD GPA;
  - only one application allowed;
  - not open to Computer Engineering majors or the Immersive Media Design computing track (nor, obviously, to CS majors).
- Grades: C- or better in every minor course (gateways excepted); 2.0 minor GPA; 2.0 cumulative GPA to stay in the minor.
- At least 6 upper-level credits must be taken at UMD.
- At most 2 courses (6 credits) shared with a major.
- The student must be in the minor for at least two semesters before graduating.

**Encoding**
- Required buckets: CMSC216, 250, 330 and 351.
- CMSC132 is required, following the catalog. It is `noShare`, because the department now treats it as a gateway rather than a minor course. MATH141 is required (department sheet) and also `noShare`, as a supporting prerequisite.
- `electives` takes 2 from the union list. `maxFrom numerical` limits it to one of CMSC460/466.
- `minFrom umd-upper` requires 6 credits at 300+ taken at UMD.
- The CMSC498 substitution and the exemption-exam rule are notes (handled by waiver).

## 4. Data Science Minor (`data-science-minor`)

Sources: catalog [S4] (listed under both CMSC and MATH; text identical in 2025-26 and 2026-27); program site [P4].

**Requirements (18 credits)**
- Prerequisite, C- or better: DATA100, STAT100, MATH135, DATA400, or any 400-level STAT. The program site also accepts ENEE324, SURV410, SURV440, BIOE372 and AP Statistics with a 4 or higher.
- DATA110 (1) and DATA120 (1).
- DATA200 (3).
- DATA250 (4), or CMSC250 together with one of MATH240, MATH341 or MATH461.
- DATA320 (3), or CMSC320.
- DATA350 (3).
- DATA400 (3), or STAT400, STAT410 or ENEE324 (SURV410 per [P4]).
- **If the prerequisite was DATA400, STAT400, ENEE324, STAT410 or SURV410, another 400-level STAT course or CMSC498Y replaces DATA400** [P4].

**Rules**
- Not open to Math (Statistics track 1701S), CS (Data Science 0701B) or CS (Machine Learning 0701F) students.
- C- or better in all minor courses.
- At most 2 courses (catalog) or 6 transfer credits (program site) from elsewhere.
- At least 6 upper-division credits at UMD.
- The prerequisite does not count toward major or minor overlap.
- A multi-course substitution counts as one course for overlap.

**Encoding**
- `prereq` bucket, `noShare` (per the overlap rule). It is in the main use-group, so it can't also fill the DATA400 slot.
- `discrete` bucket plus `anySet discrete-set`: DATA250, or CMSC250 with linear algebra.
- `prob` bucket accepts the DATA400 equivalents or any STAT4xx / CMSC498Y. `minFrom prob-course` requires that the prerequisite or the `prob` course be one of DATA400/STAT400/STAT410/SURV410/ENEE324. That is exactly the conditional rule above, because DATA400, STAT400 and ENEE324 are mutually exclusive for credit, as are STAT410 and SURV410.
- `maxFrom transfer` (6 credits) and `minFrom umd-upper` (6 credits at 300+ at UMD).
- **Approximation:** CMSC250 + MATH240 count as two courses toward the 2-course major overlap, where the program counts them as one. This is conservative and needs an engine feature (see below).

## 5. General Business Minor (`general-business-minor`)

Sources:
- catalog 2025-26 [S6] and its **Spring 2026 addendum** [S6a] (BMGT301 replaced by BMIN305, published 2026-01-12);
- 2026-27 catalog (same as the addendum);
- Smith minors page [P3].

**Requirements (15 credits)**
- BMIN210 (or both BMGT220 and BMGT221).
- BMIN345 (or BMGT340).
- BMIN355 (or BMGT350).
- BMIN395 (or BMGT364).
- One elective: BMIN375 (or BMGT372), or BMIN305 (or BMGT301).

**Rules**
- Not open to declared business majors. BMIN courses can't be applied to a Smith degree [S6a].
- Admission: rolling, 2.0 GPA, 12 UMD credits, at least 2 semesters left; admission is not guaranteed.
- C- or better; no pass/fail or audit [P3].
- Smith minors need at least 9 upper-level credits, which is automatically met here.
- Only foundation courses may transfer, up to 6 credits.

**Encoding**
- Five buckets.
- `anySet accounting-set` (BMIN210, or BMGT220 + 221).
- `maxFrom transfer` (6 credits).
- "Foundation courses only" is a note, because which courses count as foundation isn't defined on the page.

## 6. Technology Entrepreneurship and Corporate Innovation Minor (`tech-entrepreneurship-minor`)

Sources: catalog [S7]; Idea Factory / Mtech page [P6b]. 2025-26 and 2026-27 requirements are identical. The 2026-27 catalog shows blank titles for ENES464, HEIP143 and HEIP240.

**Requirements:** 15 credits from 17 listed courses.
- ENES140, 210, 460, 461, 462, 463, 464, 466, 471.
- HEIP143 (1 cr), HEIP240, HEIP241 (2 cr).
- SMLP470, 471, 472, 473, 474.
- At least 9 credits at the 400 level.
- 100- and 200-level courses are limited to 6 credits.

**Rules**
- Open to any major. Submit the advising worksheet (rolling admission) at least one year before graduation.
- The SMLP courses form the Terrapin Innovation Leadership Program (Shady Grove) pathway: four SMLP courses plus ENES210 [P6b].
- Credit-exclusive pairs from the course catalog: ENES210/ENES461 and ENES463/SMLP472.

**Encoding:** one `courses` bucket (15 credits), plus `minFrom upper` (9 credits at 400-level) and `maxFrom lower` (6 credits at 100-299).

---

## Tricky rules and engine notes

- **Transfer caps** are hard `maxFrom` limits. A transferred course over the cap is left unassigned, so the audit reports the bucket it would have filled, not the cap. The tests document this behavior.
- **"Counts as one course for overlap"** (Data Science substitutions) can't be expressed. It would need a sharing unit that groups several courses as one.
- **Not open to major X** (Stat/Math: Math majors; CS: CS/CompE; Data Science: three tracks; General Business: business majors) is only a note. Enforcing it would need a program-level "excludes programs/families" field.
- **One of the Math, Stat and Actuarial minors:** also a note; it would need the same exclusion field.

## Courses not in public/courses.json

- ENES464, HEIP143, HEIP240, HEIP241 (TECI). All four are still in the catalog's course list but haven't been offered in the past 4 years; the 2026-27 catalog shows blank titles for three of them. They are kept in the TECI list.
- CMSC498 is only a topics-course parent. CMSC498Y exists.

## Uncertainties

1. **CS minor:** the catalog and the department disagree about CMSC132 (requirement or gateway), MATH141 (department only) and CMSC431 (department only). The file follows the department and keeps CMSC132 required but `noShare`.
2. **Math minor:** whether one 400-level course may satisfy two areas.
3. **Math and Stat minors:** the department page's extra rule of at most 2 transferred courses in total isn't in the catalog. It is encoded anyway.
4. **Data Science:** the catalog says at most 2 courses from elsewhere; the program site says 6 credits. 6 credits is encoded.
5. **General Business:** both BMGT301 and BMIN305 are accepted, because the 2025-26 page and its addendum disagree on the elective's code.

## Sources

- [S1] Statistics Minor: https://academiccatalog.umd.edu/undergraduate/colleges-schools/computer-mathematical-natural-sciences/mathematics/statistics-minor/
- [S2] Mathematics Minor: https://academiccatalog.umd.edu/undergraduate/colleges-schools/computer-mathematical-natural-sciences/mathematics/mathematics-minor/
- [S3] Computer Science Minor: https://academiccatalog.umd.edu/undergraduate/colleges-schools/computer-mathematical-natural-sciences/computer-science/computer-science-minor/
- [S4] Data Science Minor: https://academiccatalog.umd.edu/undergraduate/colleges-schools/computer-mathematical-natural-sciences/computer-science/data-science-minor/
- [S5] CS department minor page: https://undergrad.cs.umd.edu/computer-science-minor
- [S5b] CS minor tracking sheet: https://undergrad.cs.umd.edu/sites/undergrad.cs.umd.edu/files/images/u167/2608%20CS%20Minor%20Curriculum%20Tracking%20Sheet.pdf
- [S6] General Business Minor: https://academiccatalog.umd.edu/undergraduate/colleges-schools/business/general-business-minor/
- [S6a] 2025-26 Catalog Addenda: https://academiccatalog.umd.edu/undergraduate/addenda/#General_Business
- [S7] TECI Minor: https://academiccatalog.umd.edu/undergraduate/colleges-schools/engineering/technology-entrepreneurship-minor/
- [S-M] Math department minors page (Math, Statistics, Actuarial): https://www-math.umd.edu/minors.html
- [P1] IRPA, Enrollment by College, Fall 2021: https://www.irpa.umd.edu/CampusCounts/Fall2021/Enrollments/enroll_by_coll.pdf
- [P2] Diamondback on CS LEP and Fall 2023 enrollment: https://dbknews.com/2023/12/06/umd-computer-science-transfer
- [P3] Smith School academic minors (intake figures, rules): https://www.rhsmith.umd.edu/programs/undergraduate/academics/academic-minors
- [P4] Data Science program, prospective students: https://data.umd.edu/prospective
- [P5] = [S5]
- [P6] UMD ranked among best in entrepreneurship education (Mtech, over 1,000 students a year): https://aero.umd.edu/news/story/umd-ranked-among-nations-best-in-entrepreneurship-education
- [P6b] TECI minor page: https://ideafactory.umd.edu/learning/minor-in-technology-entrepreneurship
- [P7] "Sustainability minor among most popular at University of Maryland" (2013): https://wildcard.live.seed.umd.edu/news/sustainability-minor-among-most-popular-university-maryland
