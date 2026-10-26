# UMD Psychology Major (B.A. and B.S.): Requirements Research

Researched 2026-10-25. The live catalog is the **2026-2027** edition `[S1]`. The **2025-2026** edition was read from the Wayback snapshot of 2025-11-12 (footer "2025-2026 Catalog") `[S2]`. Encoded file: `src/programs/psychology.yaml` (programs `psyc-ba` and `psyc-bs`).

UMD offers both a **B.A.** and a **B.S.** in Psychology. They share the 35-credit major. The B.S. adds a math and science requirement `[S1][S2][S4]`. The catalog has one page for both. The B.A./B.S. distinction appears only in its "Bachelor of Science: Math and Science Requirement" section.

## 0. Catalog-year status

| Item | 2025-26 `[S2]` | 2026-27 `[S1]` |
|---|---|---|
| Major | 35 credits (11 courses) in PSYC | Same, plus the sentence "All students must also complete MATH140 or MATH120 and BSCI170 with a grade of C- or higher" (previously only the LEP gateway) |
| Grade text | "C- … in all **38** credits" (typo; table totals 35) | "all 35 credits" |
| B.S. math & science | 5 courses / **17** credits, ≥ 3 advanced, ≥ **2** with a lab, 2.0 average; "MATH140 (highly recommended) or MATH120 … and BSCI170 **plus BSCI171**" may count | 5 courses / **16** credits, ≥ 3 advanced, ≥ **1** with a lab, 2.0 average; "MATH140 or MATH120 and BSCI170" |

The YAML encodes 2025-26. Both years fit the department's description `[S4][S5]`: gateway math + BSCI170 (+171), plus "three additional advanced courses (10 credits) … one must be a lab". With MATH120 (3), BSCI170 (3) and BSCI171 (1), that is 7 + 10 = 17 credits in 2025-26. Without BSCI171 it is 6 + 10 = 16 credits in 2026-27.

## 1. Structured spec

### 1.1 Gateways (Limited Enrollment Program) `[S4]`
| Requirement | Courses | Grade | Encoded |
|---|---|---|---|
| Intro psych | PSYC100 (or PSYC221 if PSYC100 came from AP/IB) | **B-** | bucket `psyc100` (AP credit arrives as PSYC100) |
| Math gateway | MATH120 or MATH140; MATH136 (and MATH130 per the LEP text) only for Biological Sciences majors | C- | bucket `gateway-math` |
| Science gateway | BSCI170 | C- | bucket `gateway-bsci` |

Other LEP rules (notes only): a 45-credit academic review for direct admits; a 2.70 GPA for students changing into the major `[S4]`.

### 1.2 Major: 35 credits / 11 courses `[S1][S2]`
| Slot | Rule | Encoded |
|---|---|---|
| PSYC100 (3), PSYC200 (3), PSYC300 (4 cr lab) | required | buckets `psyc100`, `psyc200`, `psyc300` |
| Additional courses | 25 credits; with the 3 above, 11 courses → **8 courses** | bucket `electives` (`courses: 8`, `credits: 25`) |
| Themes | "a minimum of two courses from each of the following three thematic areas" | `minFrom` `theme1`, `theme2`, `theme3` |
| Multicultural | "one of these six courses must be a designated multicultural course" | `minFrom` `multicultural` |
| 400-level | "Two of the courses must be 400 level, 3 credit PSYC courses"; the department says "2 400-level non-labs" `[S4]` | `minFrom` `upper400` (PSYC400-499 minus labs) |
| Lab | "One of the courses must be a 4 credit PSYC lab course"; the department says "1 400-level lab" `[S4]` | `minFrom` `lab` |

The theme, 400-level and lab courses may overlap. For example, PSYC420 is a Theme III course and a lab. The catalog defers the theme lists to the department `[S1]` fn 1.

**Courses that never count** (department list "do not apply towards degree requirements") `[S5]`: PSYC111, 123, 303, 309F, 309G, 309P, 389, 409, 468H, 469H, 478, 479, 499H. Also excluded: PSYC309R (a 1-credit PREP section `[S4]`) and the 1-credit honors seminars PSYC498H/498O. The `electives` bucket matches `PSYC200-499` minus these.

### 1.3 Theme lists `[S5]`
These lists combine the current department page and its 2025-11 version `[S6]`. The 2025 version also listed PSYC207, 309I, 337, 410, 423, 434, 444, 445, 451, 452, 489C, 489H and 489O.

- **Theme I, Mind, Brain & Behavior:** PSYC202, 206, 207/307, 301, 302, 304, 310, 341, 355, 401, 402, 403, 404, 406, 407, 410, 411, 413, 414, 417, 431, 440, 442, 443, 455, 489G, 489J, 489N, 489X.
- **Theme II, Mental Health & Interventions:** PSYC210, 234, 262, 330, 332, 336, 337, 344, 353, 381, 391, 425, 432, 433, 434, 435, 436, 437, 444, 445, 457, 459A, 489A, 489E, 489M, 489Q, 489V, 489W.
- **Theme III, Social, Developmental & Organizational:** PSYC221, 232, 237, 309D, 309I, 334, 354, 356, 357, 361, 362, 416, 420, 423, 424, 426, 447, 450, 451, 452, 456, 460, 463, 464, 465, 489C, 489F, 489H, 489I, 489K, 489O, 489P, 489T, 489Y.
- **Multicultural:** PSYC232, 262, 336, 354, 391, 447, 489E, 489F `[S4]`. The current list also marks PSYC489Q (Psychology of the Black Experience, Spring 2026 syllabus) `[S5]`; it is encoded as a topic for Spring 2026 and Spring 2027 only.
- **4-credit labs:** PSYC401, 407, 410, 417, 420, 433, 440, 450, 456, 457, 459A.

**Topic letters are reused:**
- PSYC489J appears under Theme I ("Applied Introduction to Human Brain Mapping") and under Theme III ("Advanced Statistics in Psychology"). The local schedule shows only the brain-mapping title (Winter 2024, 2026, 2027), so the YAML puts 489J in Theme I.
- PSYC489C (Early Social Cognition) and PSYC489O (History of Psychology) are Theme III, but in Spring 2027 the schedule uses those letters for "Decoding the Brain" and "ADHD". Those terms are excluded.
- PSYC489Q was "Social Media" on the 2025 list and "Psychology of the Black Experience" on the current one. Both versions are Theme II.

Courses in the local schedule that appear on no theme list are PSYC309J (Cyberpsychology, probably the old PSYC444), 346, 489B, 489D and 489L. They count toward the 25 credits but not toward a theme. Students should ask an advisor and record a waiver.

### 1.4 B.S. math and science `[S2][S7]`
| Rule | Encoded |
|---|---|
| 3 advanced courses (10 credits) from the department list | bucket `bs-advanced` (`courses: 3`, `credits: 10`) |
| One of those is a lab (bold on the list) | `minFrom` `bs-lab` |
| 5 courses / 17 credits including the gateway math and BSCI170/171 | `minFrom` `bs-total` over `gateway-math`, `gateway-bsci`, `bs-advanced` |
| At least two lab courses (BSCI171 counts) | `minFrom` `bs-labs` |
| BSCI170 still required | `gateway-bsci` widened to BSCI170/171 (max 2) + `minFrom` `bsci170` |
| PSYC courses used for the B.S. don't count toward the themes, the 400-level rule or the 35 credits `[S4]` | default single use-group |
| 2.0 average across the B.S. courses | note |

The department list (PDF updated 02/02/2022) `[S7]` has these entries; **bold** = lab:
- BSCI **201, 202**, 207, **222, 223, 224, 230, 330, 312**, 338*, 342, 360, 361, 363, 370, 375, **380**, 390, 394, 410, **412**, 413, **414, 415**, 416, 417, 420, **421**, 422, 423, **424**, 425, 426, 430, 433, **434**, 436, 437, 440, 441, **442**, 443, 444, **445**, 446, 447, 451, 462–465, 470, 471, 473, **474, 485**
- BCHM 261, 461–464, **465**, 485
- CHEM **227**, 231/**232**, 237, 241/**242**, 247, 271/**272**, 276/**277**, 401, 403, **425**, 441, 450, 460, 474, 481, 482, **483/484, 491, 492, 493**
- CMSC **114, 131, 132**, 212, **214**, 250, 311, **330**, 351, 411, **412**, 414, 415, 417, 420–424, 426, 427, 430, 433–435, 450–452, 456, 460, 462, 466, 475, 477
- MATH 121, 131, 141, 221, 241, 242, 246, 274, 310, 340, 341, 400–406, 410–412, 414, 420, 424, 430–432, 436, 437, 445, 446, 450, 452, 456, 461–464, 475
- NEUR 305, 306, **405**
- PHYS **141, 142**, 161, 165, 171/**174**, 260, **261**, 270, **271**, 272, 273, **275, 276**, 374, **375**, 401, 402, 404–406, 410, 411, 420, 426, 429, 431, 441, 451, 461, 463, 465, 474, 483, 485
- PSYC 302, 304, 341, 355, **401**, 403, 406, **407**, 414, **417, 420, 433**, 437, **440, 450**, 464
- STAT 400, 401, 405, 410, 420, 430, 440, 464, 470

The asterisk on 338* means it needs PSYC advisor permission. It is not encoded; students should get the permission and record a waiver. Lecture/lab pairs such as CHEM231/232 are encoded as two separate courses, so a pair counts as 2 of the 3 courses. The department may count a pair as one course.

## 2. BSOS college requirements `[S3]`
These are identical in 2025-26 and 2026-27. None are checkable from a course list beyond what `university.yaml` already does:
- 120 credits and a 2.0 cumulative GPA (university).
- A 2.0 GPA across courses used for the major (note).
- A graduation plan filed on entry (note-worthy only).
- Fundamental English and math attempted by 30 credits and completed by 60 (university/GenEd).
- **15 upper-level credits within the final 30 credits.** This is sequencing, so it is a note.

## 3. Not encoded (notes)
- Grade rules (C- in major courses, B- in PSYC100) and the 2.0 major GPA.
- Prerequisite grade rule (C- before use as a prerequisite).
- The 3-PSYC-courses-per-semester cap.
- The multicultural rule applies only to students who declared after Fall 2021.
- The MATH130/136 restriction to Biological Sciences majors.
- The B.S. 2.0 average.
- Advisors manually adding PSYC courses to the B.S. audit.

## 4. Codes missing from public/courses.json
These codes are kept because the department lists still name them; most simply haven't run in the last 4 years.
- **Themes and labs:** PSYC206, 301, 309I, 337, 356, 357, 401, 402, 410, 416, 423, 434, 435, 442, 443, 444, 445, 451, 452, 455, 456, 457, 463, 465, 489H, 489M, 489N, 489P, 489V, 489X.
- **Gateway:** MATH130.
- **B.S. list:**
  - BSCI224, 230, 312, 375, 380, 390, 394, 413, 421, 434, 440, 441, 444, 445, 463, 465, 470, 471, 474, 485
  - BCHM261; CHEM227, 450, 474, 491, 492, 493
  - CMSC114, 212, 214, 311, 415, 450, 462
  - MATH131, 221, 242, 400, 412, 414, 450
  - PHYS374, 426, 429, 451, 461, 463, 465
  - PSYC401; STAT405

  Several of these (BSCI230, CMSC114/212/214) are renumbered or retired.
- Every required code (PSYC100, 200, 300, MATH120/140/136, BSCI170/171) is present.

## 5. Open questions
- Whether "5 courses" in the B.S. counts BSCI170 and BSCI171 as one course or two.
- Whether CHEM lecture/lab pairs count as one or two advanced courses.
- How Testudo prints the B.A. vs B.S. on the "Major:" line (aliases cover "PSYCHOLOGY"; the B.A. is the default track).
- Theme placement of unlisted topics (PSYC309J, 346, 489B/D/L and the Spring 2027 489C/O topics).
- Whether NEUR200 (credit-only-with PSYC202) counts as PSYC202 for Theme I. It is not counted, since the catalog says "credits in Psychology (PSYC)".

## Sources
- `[S1]` https://academiccatalog.umd.edu/undergraduate/colleges-schools/behavioral-social-sciences/psychology/psychology-major/ (2026-27, live)
- `[S2]` http://web.archive.org/web/20251112125038/https://academiccatalog.umd.edu/undergraduate/colleges-schools/behavioral-social-sciences/psychology/psychology-major/ (2025-26)
- `[S3]` https://academiccatalog.umd.edu/undergraduate/colleges-schools/behavioral-social-sciences/ ("Undergraduate Degree Requirements/Degree Options"; 2025-26 snapshot 20251112014338 identical)
- `[S4]` https://psyc.umd.edu/undergraduate/degree-requirements-bs-and-ba
- `[S5]` https://psyc.umd.edu/undergraduate/psyc-courses-psyc-syllabi
- `[S6]` https://psyc.umd.edu/undergraduate/program-overview (embeds the 2025-11-09 Wayback copy of the course list)
- `[S7]` https://psyc.umd.edu/sites/psyc.umd.edu/files/2025-03/BS%20Revised%202022_0.pdf
