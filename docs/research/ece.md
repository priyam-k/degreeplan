# UMD Computer Engineering B.S. and Electrical Engineering B.S. — Degree Requirements Spec

Researched 2026-10-25. Encoded in `src/programs/ece.yaml` as two separate majors, `compe` (family `compe`) and `ee` (family `ee`). Source tags such as `[S1]` refer to §6.

## 0. Catalog-year status

| Catalog | Status | Notes |
|---|---|---|
| 2025-2026 | Fetched from Wayback snapshots (CompE 2026-02-23, EE 2026-02-26) of the catalog pages `[S1]` `[S2]`. Both are headed "2025-2026 Catalog" | This is the base catalog. |
| 2026-2027 | **Published.** This is the live catalog `[S1]` `[S2]` | The "Requirements" tab text was diffed against 2025-26 and is **identical for both majors**. |

The catalog pages give only a sample four-year plan, the category minimums and the special-case rules. They **defer the course lists** for each category to the ECE department `[S5]` `[S6]` `[S8]` `[S9]`. The department pages are live and unversioned, and they also define the Fall 2024 curriculum `[S3]` `[S4]`. Students entering Fall 2024 or later must follow that curriculum; earlier students may choose. Only the Fall 2024+ curriculum is encoded, which covers Fall 2025 entrants.

There are **no required tracks**:
- **EE:** the six tracks are "recommended but not required" for Fall 2024+ entrants `[S4]` `[S7]`. The old curriculum's two-course specialization requirement is gone.
- **CompE:** Cybersecurity is an optional specialization (5 courses chosen among electives) with no catalog presence `[S10]`. It is noted, not encoded.

## 1. Shared foundation (both majors)

| Bucket id | Requirement | Accepted | Source |
|---|---|---|---|
| `math140`, `math141` | Calculus I, II | MATH140, MATH141 | `[S3]` `[S4]` |
| `enee290` | Differential Equations and Linear Algebra for Engineers (4) | ENEE290 | `[S3]` `[S4]` |
| `phys161` | Physics I | PHYS161 | `[S3]` `[S4]` |
| `phys260` | Physics II + lab | PHYS260 & PHYS261 (both) | `[S3]` `[S4]` |
| `chem` + constraint `chem-set` | Chemistry for engineers | CHEM135, or CHEM271, or CHEM131+CHEM134 | CHEM135: `[S3]` `[S4]`. Alternatives: Clark School gateway rule `[S11]` |
| `enes100` | Intro to Engineering Design | ENES100 | `[S3]` `[S4]` |
| `enee101` | Intro to ECE | ENEE101. Transfer substitutes: ENEE301 (CompE page) or ENES489P (EE page). EE accepts all three | `[S3]` `[S4]` |
| `enee200` | Engineering ethics (also DSHU + SCIS) | ENEE200 | `[S3]` `[S4]` |
| `enee205`, `enee222`, `enee244`, `enee245`, `enee350` | ECE core | these courses | `[S3]` `[S4]` |

Not encoded:
- Professional writing (any ENGL39x with FSPW) is covered by `gened.yaml` `[S3]` `[S4]`.
- ENEE140 (EE) and CMSC131 (CompE) are prerequisites in the sample plans, not listed degree requirements `[S1]` `[S2]` `[S3]` `[S4]`.

## 2. Computer Engineering (`compe`)

Required beyond §1 `[S3]`: CMSC250, CMSC132, CMSC216, CMSC330, CMSC351, CMSC412 or ENEE447, ENEE304 or ENEE322, ENEE324 or STAT400 (DATA400 is STAT400's cross-list), and ENEE446. The degree is 125 credits.

**Technical electives: 26 credits** `[S1]` `[S3]` `[S5]`

| Bucket | Category | Minimum | Course list `[S5]` |
|---|---|---|---|
| `cat-a` | Math & basic science | 6 cr, of which ≥ 3 at the 400 level (`cat-a-400`) | CMSC/MATH/ENEE456; CMSC/AMSC460, 466; CMSC475; MATH241, 401, 402, 403, 405, 406, 410, 411, 423, 461, 462, 463, 464; PHYS270/271; PHYS420; "most PHYS4xx" (encoded as PHYS400-499 minus prohibited and research courses); MATH240 (footnote 2) |
| `cat-b` | CS theory & applications | 3 cr | CMSC414, 416, 417, 420-427, 430, 433, 434, 436, 451, 452, 457, 472, 474, CMSC460/466/475 (taken under CMSC), CMSC498x (needs ECE approval; encoded as any CMSC498 topic) |
| `cat-c` | EE theory & applications | 6 cr | ENEE322, 323, 382, 411, 413, 420, 425, 426, 429Z, 435, 436, 439G, 440, 452, 457, 459A (1 cr), 459C, 459P, 460, 464, 474, 475, 476, 484, 488, 491, 492, 499 |
| `cat-d` | Advanced lab | 2 cr | ENEE415, 416, 427, 445, 459B, 459L, 461, 473, 493, 499L |
| `cat-e` | Capstone | 3 cr | ENEE408A, C, D, I, J, M, N, V, W; CMSC435 |
| `cat-f` | General technical elective | 3 cr | See §4 |
| `cat-more` | Additional A-F courses | none | The union of A-F |

Constraints:
- `te-26`: the total across all seven buckets is ≥ 26 credits. The constraint carries the total, rather than a fixed 3-credit "additional" bucket, so that a category taken above its minimum (for example 7 credits in A) reduces what is still needed.
- `enee499-cat-c`: at most 5 credits of ENEE499 count in Category C `[S1]`.
- `enee499-total`: at most 6 credits of ENEE488/499/499L in total `[S5]` footnote 5.

Other rules:
- No course counts in two categories. This falls out of the default `main` use-group.
- Foundation courses can't be technical electives. This is automatic for whichever course fills a core bucket.
- Former codes are accepted for renamed courses: ENEE459V→452, 469O→464, 489I→484, 489Q→491, 439M→436, 419M→415 and 439D→408N `[S5]` `[S6]`.

## 3. Electrical Engineering (`ee`)

Required beyond §1 `[S4]`: MATH241, PHYS270 & 271, ENEE150, ENEE304, ENEE305, ENEE323, ENEE324 (STAT400 is prohibited for EE `[S8]`), and ENEE382. The degree is 120 credits.

**EE technical electives: 22 credits of 400-level ENEE** `[S2]` `[S4]` `[S6]`

| Bucket | Category | Minimum | Course list `[S6]` |
|---|---|---|---|
| `ee-a` | Advanced theory & applications | 3 cr | ENEE411, 413, 420, 425, 426, 429Z, 435, 436, 439G, 440, 446, 452, 457, 459A, 459C, 459P, 460, 464, 474, 475, 476, 484, 488, 489R, 489W, 491, 492, 499. A **second capstone may substitute** for this category `[S6]`, so Category C courses are also accepted here |
| `ee-b` | Advanced lab | 2 cr | ENEE415, 416, 427, 445, 459B, 459L, 461, 473, 486, 493, 499L |
| `ee-c` | Capstone | 3 cr | ENEE408A, C, D, I, J, M, N, V, W (not ENEE499) |
| `ee-more` | Remaining credits | none | Categories A-C, any other ENEE400-499 except ENEE456, and the department's approved Non-ENEE list `[S12]` |
| `gentech` | General technical elective | 3 cr | See §4 |

Constraints:
- `te-22`: the total across `ee-a`, `ee-b`, `ee-c` and `ee-more` is ≥ 22 credits.
- `non-enee`: at most **7** credits of non-ENEE courses (catalog footnote 5 `[S2]`). Non-ENEE courses are only in `ee-more`, so they never fill B or C.
- `enee499-total`: at most 5 credits of ENEE488/499/499L `[S6]`.

## 4. General technical elective (both majors)

The catalog `[S1]` `[S2]` allows "any upper-level course (300 level or higher)" with the prefixes AMSC, BCHM, BIOE, BSCI, CHEM, CMSC, ENAE, ENCE, ENCH, ENEE, ENES, ENFP, ENMA, ENME, ENNU, ENRE, MATH, PHYS or STAT, provided it is not on the prohibited list. Other upper-level courses need Associate Chair approval.

The encoding is an approximation:
- **Prefixes:** the catalog prefixes at 300-499, with CHBE (ENCH's new prefix; ENCH no longer appears in Testudo), plus AOSC, GEOL, GEMS396/397/496/497 and NAVY300/400 from the department's approved GTE spreadsheet `[S9]`.
- **Excluded:** the prohibited list `[S8]`; MATH312-315 and 478-499; all x86, x399 and x499 courses (experiential learning, research, special problems); named research and practicum courses; other departments' capstones (ENME472, ENAE482/484, ENCE465-467, ENMA487/490, CHBE446, BIOE485/486, CMSC473/476, ENES424/440/490H); and ENEE488.
- **CompE only:** ENEE305 is also excluded `[S8]`.
- **Left to waivers:** BMGT and ECON courses on the spreadsheet, and anything else the department approves.

## 5. Discrepancies and open questions

1. **CompE foundation list.** The catalog says CMSC412, ENEE447, CMSC330, CMSC351, **ENEE303, ENEE322**, ENEE350 and ENEE446 may not be used as technical electives `[S1]`. The department page says **ENEE304, ENEE305** instead, and lists ENEE322 in Category C `[S5]`. ENEE303 is the pre-2024 course. The encoding follows the department: whichever of ENEE304/322 fills the core can't double-count, and the other may count in Category C.
2. **EE non-ENEE cap.** The catalog says 7 credits `[S2]`; the department pages say 9 `[S4]` `[S6]`. The encoding uses 7, and the notes say to waive if the advisor allows 9.
3. **ENEE499 caps differ.**
   - CompE catalog: 5 credits toward Category C (6 for departmental honors).
   - CompE department: 6 credits of 488/499/499L in total.
   - EE: 5 credits in total (6 for honors).
   - All three are encoded as written; the honors exceptions are notes.
4. **ENEE499L** is not a Testudo course code (missing from `public/courses.json`). It is the department's label for lab-designated ENEE499 credits. It is kept in the lists; a transcript will show ENEE499, which counts as Category C (CompE) or A (EE), so a waiver is needed to use it as the lab.
5. **CompE Category A footnote.** MATH240 and MATH461 duplicate ENEE290, so ENEE290 students "should not take" them. They are accepted in Category A anyway; the planner can't tell who took ENEE290 first.
6. **Category A PHYS4xx** needs advisor approval. It is encoded as PHYS400-499 minus prohibited and research courses.
7. **CMSC498x in Category B** needs ECE approval, and topics cross-listed with ENEE can't be used. Every CMSC498 topic is accepted.
8. **CHEM alternatives** (CHEM271; CHEM131+134) come from the Clark School gateway rule `[S11]`, not the ECE pages. PHYS171 for PHYS161 isn't documented and is not accepted (waive).

## 6. Sources

- `[S1]` CompE major, UMD catalog (2026-27 live; 2025-26 via Wayback 20260223213339): https://academiccatalog.umd.edu/undergraduate/colleges-schools/engineering/electrical-and-computer/computer-engineering-major/
- `[S2]` EE major, UMD catalog (2026-27 live; 2025-26 via Wayback 20260226024244): https://academiccatalog.umd.edu/undergraduate/colleges-schools/engineering/electrical-and-computer/electrical-engineering-major/
- `[S3]` CE Degree Requirements, effective Fall 2024: https://ece.umd.edu/node/2153
- `[S4]` EE Degree Requirements, Fall 2024: https://ece.umd.edu/node/2148
- `[S5]` CompE Technical Electives: https://ece.umd.edu/undergraduate/degrees/bs-computer-engineering/technical-electives-0 (same as https://ece.umd.edu/node/2081)
- `[S6]` EE Technical Electives: https://ece.umd.edu/undergraduate/degrees/bs-electrical-engineering/technical-electives
- `[S7]` EE Tracks: https://ece.umd.edu/undergraduate/degrees/bs-electrical-engineering/specializations
- `[S8]` Prohibited Course List: https://ece.umd.edu/undergraduate/current-students/courses/prohibited
- `[S9]` General Technical Electives: https://ece.umd.edu/undergraduate/current-students/courses/technical-electives and its approved-course spreadsheet https://docs.google.com/spreadsheets/d/1_m8sjY1aDk-irlZ2r1sr0UNRHqeywbf0x4tHQUmPKNQ
- `[S10]` CompE Cybersecurity specialization: https://ece.umd.edu/undergraduate/degrees/bs-computer-engineering/cybersecurity
- `[S11]` Clark School catalog page (gateway requirements): https://academiccatalog.umd.edu/undergraduate/colleges-schools/engineering/
- `[S12]` EE Non-ENEE Course List: https://docs.google.com/spreadsheets/d/1nZc9iTHoDQnLJIpsKy3UbyormW4e6akMlmKFTyxCXd8
- Sample plans (Fall 2024): https://ece.umd.edu/undergraduate/degrees/bs-computer-engineering/sample-plans and https://ece.umd.edu/undergraduate/degrees/bs-electrical-engineering/sample-plans
