# UMD Robotics and Autonomous Systems (RAS) Minor: Requirements Research

Researched 2026-10-21. The live catalog at academiccatalog.umd.edu is now the **2026-2027** edition (footer "© 2026-2027"). The **2025-2026** edition was compared using Wayback Machine snapshots from 2025-11-05 and 2026-05-17. The 2024-2025 snapshot from 2024-09-15 was also compared.

**Result:** The RAS requirements text is **identical** in 2024-25, 2025-26 and 2026-27. There is one cosmetic difference: in 2026-27, ENME476 is listed with a blank title (see Uncertainties). The 2026-27 Curricular Addenda (published to date) contain no RAS changes.

The minor is cross-listed under two catalog URLs with identical content:
- ENGR: https://academiccatalog.umd.edu/undergraduate/colleges-schools/engineering/robotics-autonomous-systems-minor/
- CMSC: https://academiccatalog.umd.edu/undergraduate/colleges-schools/computer-mathematical-natural-sciences/computer-science/robotics-autonomous-systems-minor/

The program is administered by the Maryland Robotics Center (MRC), Institute for Systems Research, in the Clark School. The MRC page is https://robotics.umd.edu/minor.

---

## (a) Structured spec

### A0. Eligibility and admission (limited participation; cohort-based)
- `eligible_majors` = {Aerospace Engineering, Electrical Engineering, Computer Engineering, Mechanical Engineering, Computer Science}. A Mathematics major alone is **not** eligible. A CS+MATH double major is eligible through CS. [S1, S3]
- Application requirements [S3]:
  - Completed at least 30 university credits.
  - Cumulative GPA of at least 3.0.
  - At least 4 semesters remaining at UMD before graduation.
  - The prerequisites in A1 are completed.
- You apply through an online form (https://umdsurvey.umd.edu/jfe/form/SV_5j8aBfd8DekHqYd).
  - It is a once-a-year **Fall cohort** with priority deadline "the Friday before spring break". After that deadline, applications go to a waitlist.
  - Fall 2026 applications are closed. Fall 2027 applications open in Spring 2027. [S3]
- The minor must be completed simultaneously with a major degree program. [S3]

### A1. Prerequisites (must be complete before entry; grade C- or better) [S1]
```
PREREQ_MATH  = one_of(MATH246, ENES221)
PREREQ_PROG  = one_of(CMSC131, ENME202, ENAE202, ENEE150)
min_grade(prereqs) = "C-"
```
- The MRC site also accepts **MATH243** or **ENEE290** for PREREQ_MATH. [S3] The catalog does not list them. See Uncertainties.
- For a CS+MATH student, the realistic path is MATH246 + CMSC131. ENES221 is restricted to Clark School engineering majors. [S5]

### A2. Required core: all 4 courses, 12 credits [S1]
| Course | Cr | Course prereq (catalog) | Restriction | Typical term (MRC) |
|---|---|---|---|---|
| ENME480 Introduction to Robotics | 3 | MATH246 or ENES221; and (CMSC131, ENME202, ENAE202 or ENEE150) | RAS minor or ME dept permission. Credit only for ENME480 **or ENMT380** | Fall, cohort year 1 |
| ENAE450 Robotics Programming | 3 | ENME480 or ENAE380 | RAS minor or dept permission | Spring, year 1 |
| ENEE467 Robotics Project Laboratory | 3 | C- in ENAE450 | RAS minor **and** ECE dept permission | Fall, year 2 |
| CMSC477 Robotics Perception and Planning | 3 | one of (MATH240, MATH341, MATH461, ENEE290); and (ENEE467 or CMSC420) | RAS minor **and** CS dept permission | Spring, year 2 |

```
CORE = all_of(ENME480, ENAE450, ENEE467, CMSC477)       # 12 cr
sequence: ENME480 -> ENAE450 -> ENEE467 -> CMSC477      # strictly serial, 4 consecutive semesters (F,S,F,S)
```
- There are **no alternates** for core courses in the catalog. ENAE450, ENME480, ENEE467 and CMSC477 are not interchangeable; all four are required.
- The non-minor prereq paths (ENAE380, ENEE322, CMSC420) apply only to non-minor students. [S3]

### A3. Supporting math: 1 course, 3-4 credits, waivable [S1]
```
SUPPORT_MATH = one_of(MATH240[4], MATH340[4], MATH341[4], MATH461[3], ENEE290[4])
constraint: SUPPORT_MATH.completed_term < CMSC477.term     # "Must be completed prior to enrollment in CMSC477"
waiver: if the student completes the course "for another minor or major", the requirement is waived
        (footnote 1, verbatim: "Students may waive this requirement if they complete the course for another minor or major.")
```
- MRC also lists MATH243 as a supporting-math option. [S3] However, MRC says "only engineering students may use ENEE290 or MATH243 to satisfy the linear algebra requirement for CMSC477". So for a CS student, **ENEE290 and MATH243 are invalid**. ENEE290 is also restricted to EE/CompE majors. [S5]
- MATH340 is in the catalog list, but CMSC477's catalog prereq list does not include MATH340 alone; MRC lists "MATH 340 and MATH341". Encode MATH340 as satisfying the SUPPORT_MATH slot only if MATH341 is also completed. This is a conservative choice; see Uncertainties.
- MRC: "MATH 461 ... requirement might be waived in special cases." [S3]
- Credit-only-granted overlaps:
  - MATH240 / MATH341 / MATH461 are mutually exclusive for credit.
  - ENEE290 excludes MATH240, MATH246 and MATH461.
  - MATH341 excludes MATH246. [S5]

### A4. Electives: exactly "select two courses", 6 credits [S1]
These are the catalog list, verbatim order, 2025-26 = 2026-27. **This list is not exhaustive by design.** The catalog says: "Course options will depend on the student's academic major and being able to meet course requirements/restrictions set by each Department. **Other electives may be available. Contact minor advisor for assistance.**"

```
ELECTIVES = choose(n=2, credits>=6) from {
  ENME400  Machine Design
  ENME410  Design Optimization
  ENME413  Bio-Inspired Robotics
  ENME435  Remote Sensing Instrumentation
  ENME441  Mechatronics and the Internet of Things
  ENME461  Control Systems Laboratory
  ENME467 | ENES467  Engineering for Social Change   (cross-listed; counts as ONE course; non-ME majors register ENES467)
  ENME444  Assistive Robotics
  ENME476  Microelectromechanical Systems (MEMS) I   (title blank in 2026-27 catalog; "MEMS" on MRC page)
  ENEE440  Microprocessors
  ENEE460  Control Systems
  ENEE461  Control Systems Laboratory
  ENEE425  Digital Signal Processing
  ENEE426  Communication Networks                     (in catalog; NOT on MRC page)
  ENEE408  only section/topic ENEE408I "Capstone Autonomous Robotics"
  ENAE380  Flight Software Systems
  ENAE403  Aircraft Flight Dynamics
  ENAE432  Control of Aerospace Systems
  ENAE441  Space Navigation and Guidance
  ENAE488  only topic ENAE488O "Introduction to Autonomous Multi-Robot Swarms"
  CMSC421  Introduction to Artificial Intelligence
  CMSC422  Introduction to Machine Learning
  CMSC426  Computer Vision
  CMSC427  Computer Graphics
  CMSC451  Design and Analysis of Computer Algorithms
  CMSC498  only topic CMSC498E "Robotics"
}
```
The list has 26 distinct courses, counting ENME467/ENES467 as one.

Mutual exclusions (credit-only-granted) relevant within the list [S5]:
- ENME461 ⟂ ENEE461.
- ENME467 ⟂ ENES467.
- ENEE426 ⟂ CMSC417.

All listed fixed-credit electives are 3 cr. Topic courses have variable credit in the course catalog: ENAE488 is 1-4 and CMSC498 is 1-3. The catalog does not state what credit ENAE488O or CMSC498E carry.

### A5. Totals, grades, GPA
```
total_credits = 12 (core) + 3-4 (support math) + 6 (electives) = 21-22    # catalog "Total Credits 21-22"
  if SUPPORT_MATH waived -> 18 credits of minor-specific coursework (inference; catalog does not restate total)
min_grade(every minor course AND every prerequisite course) = "C-"        # RAS catalog [S1]
cumulative GPA over all courses used for the minor >= 2.00               # UMD policy [S2]; MRC also says "Minimum of 2.0 GPA" [S3]
```

### A6. Double-counting (major/minor overlap)
**RAS-specific, verbatim from the catalog [S1]:**
> "A maximum of 2 courses may be used to satisfy the requirements of both a major and a minor."

**UMD university-wide, verbatim from the catalog's Degree Information > Minors section [S2]:**
> "The structures of minors vary in detail, but, with rare exceptions, they all require:
> - No fewer than 15, and no more than 24 credits
> - At least 9 credits in upper division courses (300-level or above)
> - No more than six credits (or two courses) may be applied to satisfy both the requirements of a minor and a major program
> - No more than six credits (or two courses) may be taken at an institution other than the University of Maryland, College Park
> - At least six upper-division credits applied to the minor must be taken at this university
> - No course may be used to satisfy the requirements of more than one minor
> - All courses taken for a minor must be completed with a minimum grade of "C-"
> - A minimum C (2.00) cumulative grade point average across all courses used to satisfy the minor."

**Historical (2021 launch announcement) [S4]:** "Two electives may be double-counted towards the student's academic major." The current catalog says "2 courses", not restricted to electives.

**Encodable rules:**
```
R_DC1: |{c in minor_courses : c also applied to ANY major requirement}| <= 2      # RAS catalog wording ("courses")
R_DC2: credits of those overlapping courses <= 6                                  # UMD-wide wording ("six credits (or two courses)")
R_ONE_MINOR: each course may count toward at most one minor
R_TRANSFER: <= 2 courses / 6 credits of minor taken outside UMD; >= 6 upper-division minor credits taken at UMD
R_WAIVED_MATH: a waived supporting-math course is not "used for the minor" -> should not consume a double-count slot (inference)
```
- R_DC1 vs R_DC2: every RAS course except the supporting math is 3 cr, so 2 courses means 6 credits in practice. If a 4-credit MATH course were double-counted, "2 courses" and "6 credits" would diverge. The RAS rule states "courses", and the university rule says "six credits (or two courses)". Recommend checking `count <= 2` as the hard rule. Flag `credits > 6` as a warning.
- **Double major (CS + MATH):** No source addresses whether the limit is 2 per major or 2 total. Literal reading of "both a major and a minor": a course counted for minor + any major consumes a slot. Recommend encoding as **2 total across all majors** (conservative). See Uncertainties.

### A7. Which RAS courses can also count toward the CS or MATH major (for overlap detection)
From the CS major catalog page [S6]:
- CMSC421, CMSC422, CMSC426, CMSC427 are **Area 2 (Information Processing)**.
- CMSC451 is **Area 4 (Theory)**.
- CMSC477 and CMSC498E are not in any Area. They can count as one of the CS major's two "additional electives" ("other courses at the 300 or 400 level").
- The CS major's "MATH/AMSC/STAT xxx" slot (MATH141 prerequisite or higher) can be filled by MATH240/MATH461/MATH341.
- The CS "Upper Level Concentration" requires 12 cr of 300-400-level courses from **one** non-CMSC discipline. "No course in or cross-listed with CMSC can be counted." ENME/ENAE/ENEE RAS courses are three different disciplines, so they would not form a concentration by themselves. Typically the Math major covers this for a CS+MATH student.

From the Math major (Traditional track) [S7]:
- MATH240 is required (or the MATH340-341 honors sequence).
- MATH461 "may not be used towards the upper level math requirements for MATH/STAT majors" [S5].
- So for a MATH major, SUPPORT_MATH is essentially always completed in the major. Apply the waiver (A3).

Overlap set for this student: {CMSC477, CMSC421, CMSC422, CMSC426, CMSC427, CMSC451, CMSC498E, MATH240/340/341/461}.

---

## (b) Tricky rules

1. **Cohort and fixed sequence.**
   - All four core courses are restricted to admitted RAS students, and each needs dept permission.
   - They run in a strict F-S-F-S chain over four consecutive semesters: ENME480 (F) → ENAE450 (S) → ENEE467 (F) → CMSC477 (S). [S3, S5]
   - A planner must schedule them in four consecutive semesters starting in a Fall after admission. "At least four semesters remaining" is an entry condition.
2. **CS majors have a practically very limited elective pool.** Department restrictions [S5]:
   - ENEE440/425/426/460/461/408: "Must be in Engineering: Computer or Electrical".
   - ENAE380, ENAE432: Aerospace majors only. ENAE403, ENAE441: Aerospace or dept permission, and they need ENAE prereq chains.
   - ENME400/410/413/435/441/444/461: "Permission of ENGR-Mechanical Engineering department", plus ME prereqs (ENME351/361/462/271).
   - ENAE488O: instructor permission.
   - **Realistic electives for a CS student:** CMSC421, CMSC422, CMSC426, CMSC427, CMSC451, CMSC498E (when offered), and **ENES467** (only restriction: junior standing; non-ME majors must register as ENES467, not ENME467). ENAE488O is possible only by permission.
3. **Double-count squeeze for CS majors.**
   - CMSC477 (required) plus two CMSC electives are all usable in the CS major. That would be 3 overlapping courses, above the limit of 2.
   - The limit is on courses *applied* to both programs. The student must either take one non-CMSC elective (e.g., ENES467), or take the CMSC course(s) beyond what the CS major needs, so they are applied only to the minor.
   - The planner should model course→requirement **assignment**, not mere membership.
4. **No CS-specific "outside the major department" rule** exists in the RAS minor. Nothing says CMSC electives are disallowed for CS majors. The only constraint is the 2-course double-count cap, plus the generic catalog caveat "Course options will depend on the student's academic major".
5. **Supporting math waiver.** For a MATH major, linear algebra is in the major, so the requirement is waived. The minor's own coursework drops to 18 cr (12 core + 6 elective). The waived course should not count against the 2-course cap (inference). Note that 18 cr still satisfies the university's 15-24 range.
6. **ENEE290 / MATH243 are engineering-only** for the CMSC477 linear-algebra prereq (MRC). MATH243 "Does not satisfy requirements for the Mathematics or Computer Science major" [S5].
7. **Topic-restricted electives.** ENEE408, ENAE488 and CMSC498 count **only** for the specified topic/section (408I, 488O, 498E). Match on the full course+suffix.
8. **Cross-listing.** ENME467 and ENES467 are one course (one elective slot). The MRC page lists them as two bullets, but they are the same course.
9. **Grade rule applies to prerequisites too.** C- or better is required in MATH246/CMSC131 etc., not just in minor courses. [S1]
10. **ENME480 credit exclusion:** ENME480 is credit-only-granted with ENMT380.
11. **University minor rule "No course may be used to satisfy the requirements of more than one minor"** matters if the student adds another minor (e.g., a MATH or STAT minor).

---

## (c) Sources

- **[S1]** UMD Undergraduate Catalog, RAS Minor (ENGR and CMSC listings; identical text).
  - https://academiccatalog.umd.edu/undergraduate/colleges-schools/engineering/robotics-autonomous-systems-minor/
  - https://academiccatalog.umd.edu/undergraduate/colleges-schools/computer-mathematical-natural-sciences/computer-science/robotics-autonomous-systems-minor/
  - Source for: prereqs, core, supporting math and footnote, elective list, total 21-22 credits, C- rule, "maximum of 2 courses" rule.
  - The 2025-26 edition was verified via Wayback snapshots, identical to 2026-27 except the ENME476 title:
    - https://web.archive.org/web/20251105123710/https://academiccatalog.umd.edu/undergraduate/colleges-schools/engineering/robotics-autonomous-systems-minor/
    - https://web.archive.org/web/20260517055310/https://academiccatalog.umd.edu/undergraduate/colleges-schools/engineering/robotics-autonomous-systems-minor/
- **[S2]** UMD Undergraduate Catalog, Academic Policies > Degree Information > Minors (university-wide minor rules, 2.00 GPA rule). https://academiccatalog.umd.edu/undergraduate/registration-academic-requirements-regulations/degree-information/
- **[S3]** Maryland Robotics Center, RAS Minor page. https://robotics.umd.edu/minor
  - Source for: eligibility (30 cr, 3.0 GPA, 4 semesters left), application timing, "completed simultaneously with a major", 2.0 GPA.
  - Also: MATH243/ENEE290 as prereq options, the engineering-only note for ENEE290/MATH243, semester sequence, and the MRC elective list (omits ENEE426).
- **[S4]** UMD CS news, "New for Fall 2021: An undergraduate minor in robotics and autonomous systems" (2021-03-08). https://www.cs.umd.edu/node/21633 (historical "two electives may be double-counted").
- **[S5]** UMD catalog course listings (prereqs, restrictions, credits, credit-only-granted):
  - https://academiccatalog.umd.edu/undergraduate/approved-courses/enme/
  - https://academiccatalog.umd.edu/undergraduate/approved-courses/enee/
  - https://academiccatalog.umd.edu/undergraduate/approved-courses/enae/
  - https://academiccatalog.umd.edu/undergraduate/approved-courses/enes/
  - https://academiccatalog.umd.edu/undergraduate/approved-courses/cmsc/
  - https://academiccatalog.umd.edu/undergraduate/approved-courses/math/
- **[S6]** CS major requirements (Areas 1-5, electives, upper-level concentration). https://academiccatalog.umd.edu/undergraduate/colleges-schools/computer-mathematical-natural-sciences/computer-science/computer-science-major/
- **[S7]** Mathematics major requirements (MATH240 required; MATH340-341 honors substitution). https://academiccatalog.umd.edu/undergraduate/colleges-schools/computer-mathematical-natural-sciences/mathematics/mathematics-major/
- **[S8]** Curricular Addenda, 2026-27 (no RAS changes listed as of 2026-10-21). https://academiccatalog.umd.edu/undergraduate/addenda/

---

## (d) Uncertainties

1. **Double major interpretation.** No source says whether "maximum of 2 courses ... both a major and a minor" means 2 per major or 2 total when the student has two majors. Recommend: 2 total (conservative). Confirm with robotics-minor@umd.edu.
2. **Elective list is explicitly non-exhaustive.** The catalog says "Other electives may be available. Contact minor advisor". Substitutions are advisor-approved and cannot be enumerated. The app should support manual "approved substitution" overrides.
3. **Catalog vs MRC discrepancies:**
   - **ENEE426:** in the catalog, absent from MRC.
   - **MATH243 / ENEE290 as entry prereqs:** on MRC, not in the catalog.
   - **MATH243 as supporting math:** on MRC, not in the catalog.
   - **Supporting-math credits:** MRC says "4 credits of MATH240 or 3 credits of MATH461"; the catalog lists 5 options.
   - Treat the catalog as authoritative for degree audit.
4. **ENME476:**
   - In the 2026-27 catalog it is still on the RAS elective list but with a blank title.
   - It does not appear as a course block in the 2026-27 ENME course listing; it is only referenced as the prereq of ENME477, MEMS II.
   - It was titled "Microelectromechanical Systems (MEMS) I" in the 2024-25 and 2025-26 catalogs.
   - It may have been renumbered or discontinued.
5. **MATH340 alone:** the catalog lists MATH340 as a supporting-math option, but CMSC477's prereq list does not include it; MRC says "MATH 340 and MATH341". Unclear whether MATH340 alone satisfies the slot.
6. **Credits for ENAE488O and CMSC498E:** these are variable-credit topic courses, and their credit for the RAS slot is not stated. It is also unclear whether "select two courses" with a 6-credit total means a 1-credit topic course would fall short.
7. **Whether CMSC477 counts toward the CS major.** It is not in any Area list. Per the CS footnote it should qualify as a 300/400-level CS "additional elective", but no source names it explicitly.
8. **Whether a waived supporting-math course consumes a double-count slot.** Logically it should not, since it is not used for the minor, but this is not stated.
9. **The UMD-wide rule is hedged with "with rare exceptions".** The RAS-specific wording ("2 courses") is what was published for this minor.
10. **Course offering frequency** of ENAE488O, CMSC498E and ENEE408I is not guaranteed. CMSC498E may not be offered currently.
