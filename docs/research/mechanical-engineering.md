# UMD Mechanical Engineering B.S.: Degree Requirements Spec

Researched 2026-10-25. Encoded in `src/programs/mechanical-engineering.yaml` (program `me`). Source tags such as `[S1]` follow each fact (see §5 Sources).

## 0. Catalog-year status

| Catalog | Status | Notes |
|---|---|---|
| 2025-2026 | Fetched from the Wayback snapshot (2026-03-03) of the catalog page `[S2]` | Base catalog for this spec. |
| 2026-2027 | **Exists.** This is the live page `[S1]` | Diffed line by line against 2025-26. The only change is the program director (Patrick McCluskey → Nikhil Chopra). Requirements are identical. |

The catalog's Requirements tab for ME is **only a sample four-year plan** (124 credits). It has no course list or elective rules. The elective rules come from the department's graduation plan `[S4]`, course map `[S5]` and registration handout `[S6]`. There are no tracks or concentrations.

## 1. Global rules (in `notes`, not machine-checked)

| Rule | Source |
|---|---|
| C- or better in all engineering degree requirements, including technical coursework and the MATH, PHYS and CHEM courses | `[S3]` |
| 2.0 GPA in major courses: departmental, basic sciences, engineering sciences, technical electives and Professional Writing | `[S4]` |
| 45-credit review: ENES100, MATH141, PHYS161 and CHEM135 (or CHEM271, or CHEM131 + CHEM134), each with a C- or better | `[S3]` |
| At least 120 credits (the sample plan totals 124) | `[S1]` `[S4]` |
| Alternate courses need written advisor approval before registering. Example: STAT400 or BMGT230 for ENME392, only for double majors or minors | `[S6]` |
| ENME332 and ENME400 are interchangeable between the junior spring and the senior fall | `[S4]` `[S5]` |
| ENME202 and ENME272 can be earned by credit by exam | `[S7]` |

## 2. Required courses

| Area | Courses | Source |
|---|---|---|
| Engineering sciences | ENES100, ENES102, ENES220, ENES221, ENES232; **ENES200 or ENEE200** | `[S1]` `[S4]` |
| ME core | ENME202, 272, 331, 332, 350, 351, 361, 371, 382, 392, 400, 462, 472 | `[S1]` `[S4]` |
| Math | MATH140, 141, 241, 246 | `[S1]` `[S4]` |
| Chemistry | CHEM135, **or CHEM131 + CHEM134** | `[S4]` |
| Physics | PHYS161, PHYS260 + PHYS261, PHYS270 + PHYS271 | `[S1]` `[S4]` |
| Technical electives | 15 credits (5 courses) | `[S1]` `[S4]` `[S5]` |

Equivalents I accepted:
- ENAE202 for ENME202: the catalog grants credit for only one of the two.
- MATH340 for MATH241, and MATH341 for MATH246: the honors versions, again with credit for only one.
- CHEM271: the Clark School gateway list accepts it in place of CHEM135 `[S3]`.

## 3. Technical electives (bucket `tech-electives`)

- The graduation plan lists three "ENME 4XX" slots plus two "ENME 4XX or TECH 4XX" slots `[S4]`.
- Course map (Fall 2023): "15 credits of tech electives are required. You are allowed … to take up to 6 credits of electives outside of your major. These may be any 300 or 400 level courses in MATH, PHYS, COMP-SCIENCE, CHEM, BMGT, BMIN or ENGINEERING." `[S5]`
- Registration handout (Spring 2025): "Two technical electives can be out-of-major … 300/400 level courses in: CHEM, PHYS, BMGT, MATH, CMSC, ENES or other engineering … except for classes that duplicate ENME required courses." ENRE447 "counts as in-major elective." `[S6]`

How these rules are encoded:
- **In major:** ENME400-499, except the required ENME400, 462 and 472, plus ENRE447.
- **Out of major:** 300-499 in CHEM, PHYS, BMGT, BMIN, MATH, CMSC, ENES, ENAE, ENCE, ENEE, ENFP, ENMA, ENNU, ENRE, BIOE, CHBE, ENBC, ENEB and ENMT. "Other engineering" is approximated by the Clark School department codes.
- **Duplicates removed:** these courses are credit-only-granted-for equivalents of required courses, so they don't count: BIOE331, ENCE305 and ENFP300 (= ENME331), ENFP312 (= ENME332), BIOE437 (= ENME272), ENMA300 (= ENME382), MATH340 and MATH341.
- **Cap:** the constraint `outside-major` allows at most **2 courses** from outside the major. The handout counts courses and the course map counts 6 credits; the two agree for 3-credit courses.

## 4. Open questions

- Whether ENME 3xx courses outside the core would count. None exist today.
- Whether AMSC, STAT or other science departments count as out-of-major electives. They are not listed, so they are excluded.
- The 45- and 75-credit benchmarks are admission policy and are not encoded.

## 5. Sources

- `[S1]` https://academiccatalog.umd.edu/undergraduate/colleges-schools/engineering/mechanical-engineering/mechanical-engineering-major/ (2026-27)
- `[S2]` https://web.archive.org/web/20260303140204/https://academiccatalog.umd.edu/undergraduate/colleges-schools/engineering/mechanical-engineering/mechanical-engineering-major/ (2025-26)
- `[S3]` https://academiccatalog.umd.edu/undergraduate/colleges-schools/engineering/ (Clark School requirements)
- `[S4]` https://eng.umd.edu/sites/clark.umd.edu/files/resource_documents/mechanical-fall-2025-gradlan-ADA.pdf (the Fall 2026 version, `mechanical_fall_2026_gradplan.pdf`, is identical)
- `[S5]` ME course map, Tangerine, Fall 2023+: https://drive.google.com/file/d/18ltF7_4N_qjo5w5GCfkBojYaqrdeAHc7/view (linked from https://meugrad.umd.edu/course-information/)
- `[S6]` "Spring 2025 Registration & Electives" handout: https://drive.google.com/drive/folders/1GxpvplaLTX_TBux4S_7tq9gitqDmI2S4 (linked from https://meugrad.umd.edu/students/advising-registration/)
- `[S7]` https://meugrad.umd.edu/enme202-credit-by-exam/, https://meugrad.umd.edu/enme272-credit-by-exam/
