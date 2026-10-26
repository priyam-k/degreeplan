# UMD Aerospace Engineering B.S.: Degree Requirements Spec

Researched 2026-10-25. Encoded in `src/programs/aerospace-engineering.yaml` as `aero-aeronautical` and `aero-astronautical`. Source tags such as `[S1]` follow each fact (see §6 Sources).

## 0. Catalog-year status

| Catalog | Status | Notes |
|---|---|---|
| 2025-2026 | Fetched from the Wayback snapshot (2026-01-01) of the catalog page `[S2]` | Base catalog for this spec. It already has the **new curriculum for students starting Fall 2025**. |
| 2026-2027 | **Exists.** This is the live page `[S1]` | Diffed against 2025-26. The only addition is the sentence "The requirements listed below are for students starting Fall 2025 to present." Requirements are identical. |

The Fall 2025 curriculum renumbers several courses and adds new ones: ENAE222 (4 cr), ENAE284, ENAE310, ENAE325, ENAE364, ENAE410, ENAE480 and ENAE491-494. Students who started before Fall 2025 follow the older curriculum (ENAE311, 324, 414, 464, 481-484, and so on), which is **not modelled**.

## 1. Global rules (in `notes`, not machine-checked)

| Rule | Source |
|---|---|
| C- (2.0) or better in all engineering (ENxx), basic science and technical courses | `[S3]` `[S4]` |
| 2.0 GPA in major courses | `[S5]` |
| Clark School 45-credit gateway review (ENES100, MATH141, PHYS161, CHEM) | `[S3]` |
| **124 credits** minimum (other Clark majors need 120) | `[S1]` `[S3]` |
| Technical elective: from the approved list or pre-approved by petition. Complete the Senior Audit a semester ahead | `[S4]` `[S6]` |

## 2. Required courses (both tracks)

| Area | Courses | Source |
|---|---|---|
| Engineering sciences | ENES100; **ENES200 or ENEE200**; ENES232; **ENAE222**, or ENES102 + ENES220 (catalog fn 2) | `[S1]` `[S5]` |
| AE core | ENAE100, 202, 203, 283, 284, 301, 310, 325, 362, 364, 380, 410, 423, 432, 480 | `[S1]` `[S5]` |
| Math | MATH140, 141, 241; **MATH243**, or MATH246 + (MATH240 or MATH461) (catalog fn 3) | `[S1]` `[S5]` |
| Chemistry | CHEM135, or CHEM131 + CHEM134 | `[S5]` |
| Physics | PHYS161, PHYS260 + 261, PHYS270 + 271 | `[S1]` |

The ENAE222 and MATH243 alternatives are each a bucket plus an `anySet` constraint (`mechanics-option`, `linalg-de-option`).

Equivalents I accepted:
- The catalog's "Formerly" pairs: ENAE310/414, ENAE410/311, ENAE492/482 and ENAE494/484.
- Credit-only-granted-for pairs: ENAE202/ENME202, MATH243/ENEE290 and MATH241/MATH340.
- MATH341 (honors), in place of MATH243.
- CHEM271, which the Clark gateway list accepts.

## 3. Tracks (the catalog says "Students must select a track")

| Track | Program | Courses |
|---|---|---|
| Aeronautical | `aero-aeronautical` | ENAE403, ENAE455, ENAE491, ENAE492 |
| Astronautical | `aero-astronautical` | ENAE404, ENAE457, ENAE493, ENAE494 |

The catalog: "Students in either track who wish to gain a broader education … can take courses required in the other track as electives." `[S1]`

## 4. Electives

**ENAE electives (6 cr, bucket `enae-electives`).** Catalog fn 4: "ENAE398H, or any 400 level ENAE course not required for the student's specific track." The curriculum sheet shows "ENAE 4XX" plus "ENAE 4XX or ENAE398H (1/1/1)" `[S5]`.
- Encoded as ENAE400-499 plus ENAE398, minus the required 4xx courses, their old-curriculum versions (414, 464, 481-484) and the student's own track courses.
- The `enae398` constraint allows at most 3 credits of ENAE398H.

**Technical elective (1 course, bucket `tech-elective`).** Catalog fn 5: "A 300/400 level course in Engineering, Mathematics, or Physical Sciences that has been approved for this purpose by the Undergraduate Program Director." The department policy requires a course outside ENAE with sophomore-level technical content; business and management courses don't count `[S4]` `[S6]`.
- Encoded as the department's **approved non-ENAE list** `[S6]`.
- ASTR450 is approved "air track only", so it is added only to `aero-aeronautical`.
- Typos in the list were normalized: "ENC340" → ENCE340, "AOSC431/2" → AOSC431 and AOSC432, "ENEE/ENME461" → both codes, "ENME489_ Control of Smart Structures" → ENME489P.
- ENME489L Bio-Inspired Robotics is now ENME413 (credit-only-granted-for), so both codes are accepted.
- The list's "ENME489 internal combustion engines" has no topic letter, so it matches only the bare code ENME489.
- **Dropped:** PHYS374 and ENME483. Both are on the list, but neither is in the 2026-27 catalog or in `public/courses.json`.

## 5. Limitations and open questions

- **Repeatable courses:** ENAE398H (1 credit per term, up to 3) and ENAE499 (repeatable to 6) count only once, because the solver drops repeated codes. Enter them as one course with the combined credits.
- **Technical elective by petition:** an approved course that is not on the list has to be waived.
- **124-credit total:** not checked, because the university program checks 120.
- **ENAE200:** the department page mentions ENAE200 (Profession II), but the Fall 2025 curriculum sheet doesn't list it. It is not encoded.

## 6. Sources

- `[S1]` https://academiccatalog.umd.edu/undergraduate/colleges-schools/engineering/aerospace-engineering/aerospace-engineering-major/ (2026-27)
- `[S2]` https://web.archive.org/web/20260101203147/https://academiccatalog.umd.edu/undergraduate/colleges-schools/engineering/aerospace-engineering/aerospace-engineering-major/ (2025-26)
- `[S3]` https://academiccatalog.umd.edu/undergraduate/colleges-schools/engineering/ (Clark School requirements)
- `[S4]` https://aero.umd.edu/undergraduate/current-students/advising-support
- `[S5]` Graduation plan and curriculum sheet, Fall 2025 to present: https://aero.umd.edu/sites/aero.umd.edu/files/AE-Degree-Plan_Updated_2026-06-26-2.pdf and https://eng.umd.edu/sites/clark.umd.edu/files/resource_documents/aerospace_fall_2025_grad_plan.pdf
- `[S6]` Policy & List of Approved Technical Electives: https://docs.google.com/document/d/1KhQwxsgR8CifJfc0TFxkqTH8IWGxc6av62uInPMdUNA/edit
- ENAE course list (new course numbers, "Formerly" notes): https://academiccatalog.umd.edu/undergraduate/approved-courses/enae/
