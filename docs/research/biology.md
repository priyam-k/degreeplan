# UMD Biological Sciences B.S. — Degree Requirements Spec

Researched 2026-10-25. Every fact here comes from a primary source (see §6 Sources); tags such as `[S1]` follow each
fact. Encoded in `src/programs/biology.yaml`, tested in `src/programs/tests/biology.test.ts`.

## 0. Catalog-year status

| Catalog | Status | Notes |
|---|---|---|
| 2025-2026 (Fall 2025 entrants) | Fetched from the Wayback snapshot of 2025-11-12 `[S2]` | Base catalog for this spec. |
| 2026-2027 | **Published**: the live catalog page `[S1]` | Diffed line by line against 2025-26. Only two requirement changes (below); otherwise only staff names changed. |

2026-27 changes (both accepted by the encoding, so either catalog year audits cleanly):

1. **Intro labs.** 2025-26 requires BSCI170 & BSCI171 and BSCI160 & BSCI161 (4 cr each). In 2026-27, BSCI170 and BSCI160
   are 3-credit lectures plus one 1-credit lab, **BSCI180** Principles of Biology Laboratory. "Beginning in Fall 2026,
   BSCI161 and BSCI171 will be replaced with BSCI180" and "BSCI161 and BSCI171 may count for BSCI180" `[S1]`.
2. **Cell biology.** 2025-26 lists **BSCI330** Cell Biology and Physiology (Lab), 4 cr. 2026-27 splits it into
   **BSCI331** (3 cr lecture) and **BSCI332** (1 cr lab) in every list where BSCI330 appeared `[S1]` `[S2]`.

The department site `[S3]` publishes one degree sheet per specialization `[S4..S8]` (dated 2023-2024, still showing
BSCI330 and BSCI161/171) and a four-year plan per specialization `[S9..S13]`. The degree sheets list **more** area
courses than the catalog (newer courses such as BSCI343, 355, 357, 381, 431, 436, 453, 455, 456, 476, 477, 487, 497).
The encoding takes the **union** of catalog and degree-sheet lists.

## 1. Major-wide rules

| Rule | Value | Source | Encoded? |
|---|---|---|---|
| Minimum grade in every major course (basic, supporting, advanced) | C- | `[S1]` `[S4..S8]` | note |
| GPA | 2.0 in all courses for the major and cumulative | `[S1]` | note |
| Total degree credits | 120 (basic + supporting 47-48, advanced 27, GenEd 27, electives 18-19) | `[S1]` | university.yaml |
| Limited Enrollment Program, benchmark courses | see lep.umd.edu, bsci.umd.edu/benchmarks | `[S1]` `[S4]` | note |
| First-semester freshman seminar (UNIV100, CMNS100, HONR100, GEMS100, HLSC100, …) | on the degree sheets only, not in the catalog | `[S4..S8]` `[S9]` | note |
| ILS honors substitutions | HLSC322 for BSCI222, HLSC374 for BSCI374 | `[S4..S8]` | yes (alternatives) |

## 2. Basic program and supporting courses (every specialization)

| Bucket id | Requirement | Accepted | Source |
|---|---|---|---|
| `bsci160` | BSCI160 Principles of Ecology & Evolution | BSCI160 | `[S1]` `[S2]` |
| `bsci170` | BSCI170 Principles of Molecular & Cellular Biology | BSCI170 | `[S1]` `[S2]` |
| `intro-lab` + `intro-lab-set` | Intro labs | BSCI161 **and** BSCI171 (2025-26), or BSCI180 (2026-27) | `[S1]` `[S2]` |
| `bsci207` | BSCI207 Principles of Biology III | BSCI207 | `[S1]` |
| `bsci222` | BSCI222 Principles of Genetics | BSCI222 or HLSC322 (ILS) | `[S1]` `[S4]` |
| `math` + `math-set` | Math (fn 1) | MATH135 + 136, or MATH140 + 141, or MATH140 + 135 | `[S1]` |
| `chem131` | CHEM131 & CHEM132 | both | `[S1]` |
| `chem231` | CHEM231 & CHEM232 | both | `[S1]` |
| `chem241` | CHEM241 & CHEM242 | both | `[S1]` |
| `chem271` | CHEM271 & CHEM272 | both | `[S1]` |
| `phys1` | PHYS131 or PHYS141 | either | `[S1]` |
| `phys2` | PHYS132 or PHYS142 | either | `[S1]` |

Catalog footnote 1: "MATH140 and MATH141 taken together will fulfill the Mathematics Supporting Courses requirement …
Students who enter the Biological Sciences major after satisfactorily completing MATH140 should take MATH135 instead of
MATH141" `[S1]`.

## 3. Advanced Program, rules for every specialization `[S1]`

- **27 credits minimum** → constraint `advanced-27` (minFrom over all advanced buckets, credits 27).
- **Two 300-400 level lab courses** → constraint `labs`, over all advanced buckets except Enrichment ("Courses counted as
  Enrichment do not satisfy the requirement to take two 300- or 400-level laboratory courses"). A stand-alone lab needs a
  C- in its lecture (note).
- **Research/independent study, including H and L versions: at most 3 credits** → `research-cap` (BSCI379/389/399, any
  suffix). Several research semesters may count as one lab with advisor approval (note; waive `labs`).
- **One credit of Departmental Honors Seminar** (BSCI378H, BSCI398H) → `honors-cap`.
- **Special topics** are approved per specialization; "See testudo.umd.edu" → accepted in every area list (BSCI328,
  338, 339, 348, 439, any topic), flagged in a note. *Approximation.*
- **Enrichment** (every specialization except General Biology and Individualized Studies): "a maximum of 3 credits from
  any 300-level or 400-level BSCI, CHEM, or BCHM course"; the course lists say "Enrichment 3 … Minimum 3 credits"
  → bucket `enrichment` (credits 3) plus `enrichment-cap` (at most 4 credits, so a single 4-credit course still fits).
  Other departments need advisor permission (waive). *Approximation.*

### Upper-level lab list (derived)

No single published list exists. The planner's `LABS` list is every 300-400 course the catalog marks "(Lab)", titles
"Laboratory", or the degree sheets mark "w/Lab" or footnote with "requires a C- in the pre-/co-requisite lecture to
count as a Lab" `[S1]` `[S4..S8]`:

BSCI330, 332, 333, 335, 337, 348C, 364, 374 (HLSC374), 393, 405, 411, 412, 414, 415, 423, 424, 425, 442, 451, 454, 455,
467, 480, 481, 487, 497; BCHM464. BSCI223/283 are explicitly **not** upper-level labs `[S1]`.

## 4. Specializations

### 4.1 Cell Biology & Genetics (CEBG, 0404A) → `bio-cbg`

| Part | Requirement | Source |
|---|---|---|
| Required (16 cr) | BCHM461, BCHM462, BSCI330 (or 331 + 332), BSCI410, BSCI420 | `[S1]` `[S5]` |
| Area (8 cr) | One course from the Cell Biology group **and** one from the Genetics group; the rest from any group | `[S1]` |
| Cell Biology group | BSCI353, 404, 406, 417, 422, 423, 430, 432, 433, 442, 443, 454; sheet adds 343, 436, 455 | `[S1]` `[S5]` |
| Genetics group | BSCI402, 405, 406, 407, 411, 412, 414, 415, 416, BCHM465; sheet adds 381 | `[S1]` `[S5]` |
| Additional | BSCI223/283, 374, 425, 427, 437, BCHM464; **one** of BIOM301/STAT400/STAT464 | `[S1]` |
| Enrichment | 3 cr | `[S1]` |

Encoded with `distinct` (`cebg-groups`, min 2) and `stats-cap`. BSCI406 is in both groups; the `distinct` rule counts
each course once, so BSCI406 alone can't cover both. The degree sheet says "one course (3 credits)" per group; the
catalog doesn't say 3 credits, so the encoding follows the catalog.

### 4.2 Ecology & Evolution (ECEV, 0404B) → `bio-ee`

| Part | Requirement | Source |
|---|---|---|
| Required (10 cr) | BSCI361, BSCI370, one of BIOM301/STAT400/STAT464 | `[S1]` |
| Area (14 cr) | 300-level: BSCI330/331+332, 333, 334, 335, 337, 360, 363, 364, 373, 374, 392, 393; sheet adds 366 | `[S1]` `[S6]` |
| | 400-level: BSCI401, 403, 405, 407, 410, 430, 460, 462, 464, 465, 467, 471, 473, 475, 480, 481, 483, 494; sheet adds 400, 426, 431, 476, 477, 487, 497 | `[S1]` `[S6]` |
| | **At least two 400-level courses** → `ecev-400` | `[S1]` |
| Enrichment | 3 cr | `[S1]` |

Not encoded: "BSCI460 and BSCI461 count as one required 400-level course" (both discontinued; see §5).

### 4.3 General Biology (GENB, 0404C) → `bio-gen`

| Part | Requirement | Source |
|---|---|---|
| Biochemistry | BCHM461 or BCHM463 | `[S1]` |
| Quantitative | BIOM301, BSCI374, STAT400, STAT464 or MATH240 ("MATH240 or higher w/ advisor approval" on the sheet) | `[S1]` `[S4]` |
| Area (20-21 cr) | At least one course from each of Genetics & Evolution; Cell Biology, Development & Physiology; Ecology, Behavior & Organismal. Sheet: "At least one course (3 credits)" | `[S1]` `[S4]` |
| Optional in area | BSCI223/283, honors seminars, special topics, research credit BSCI379/389/399 | `[S1]` |
| Enrichment | none | `[S1]` |

Encoded with `distinct` (`genb-areas`, min 3) plus three `minFrom` rules of 3 credits each (`genb-ge-3`, `genb-cdp-3`,
`genb-ebo-3`). BSCI403 sits in two groups on the sheet. GENB sheet lists "BSCI457 Advanced Cellular Neuroscience";
the course is BSCI456 (PHNB sheet; local catalog), so BSCI456 is encoded.

### 4.4 Microbiology (MICB, 0404D) → `bio-micro`

| Part | Requirement | Source |
|---|---|---|
| Required | BSCI283 (or BSCI223 with the Director's permission), BSCI412, BSCI443 | `[S1]` |
| Biochemistry (6 cr) | BCHM461 + 462, **or** BCHM463 + 465 → `biochem` + `biochem-pair` | `[S1]` |
| Area (7 cr) | BSCI411, 417, 422, 423, 424, 437, 464; sheet adds 348J, 348M; special topics BSCI338/339/348 (+439 on the sheet) | `[S1]` `[S7]` |
| | "Must include a 300- or 400-level laboratory course" → `area-lab` | `[S7]` |
| Enrichment | 3 cr | `[S1]` |

Credit only for one of BSCI424/BSCI348J (note).

### 4.5 Physiology & Neurobiology (PHNB, 0404E) → `bio-pn`

| Part | Requirement | Source |
|---|---|---|
| Required (13 cr) | BCHM461 or 463; BSCI330 (or 331 + 332); BSCI353; BSCI450 | `[S1]` |
| Area (11 cr) | BCHM462, 464, 465; BSCI360, 370, 374, 401, 402, 403, 407, 410, 414, 416, 420, 422, 423, 425, 430, 433, 442, 443, 446, 447, 451, 452, 454; sheet adds 343, 355, 357, 381, 404, 406, 431, 453, 455, 456 | `[S1]` `[S8]` |
| | Statistics: one course maximum (BIOM301, STAT400, STAT464) → `stats-cap` | `[S1]` |
| Enrichment | 3 cr | `[S1]` |

Sheet footnote: BSCI450/451 were formerly BSCI440/441 (and BSCI338L); credit for only one of each set. BSCI440 and 338L
are accepted for BSCI450, BSCI441 in the area.

### 4.6 Individualized Studies (BIVS, 0404) → `bio-ivs`

Requires an approved proposal `[S1]`. Encoded as a best-effort approximation:

| Catalog rule | Encoding |
|---|---|
| 6 credits of biochemistry and/or quantitative work, advisor-approved | `core`: any BCHM 300-400, BIOM301, STAT 400-499, BSCI374, MATH 240-499 (6 cr) |
| 21 credits of advisor-approved area courses | `area`: any 200-400 course (21 cr) |
| Maximum 4 credits at the 200 level | `lower-cap` |
| 3-6 credits from courses outside CMNS | `outside-min`, `outside-max` (CMNS = AMSC, AOSC, ASTR, BCHM, BIOI, BIOL, BIOM, BIPH, BSCI, BSCV, CBMG, CHEM, CHPH, CMNS, CMSC, DATA, ENTM, GEOL, HLSC, MATH, MOCB, NACS, NEUR, PHSC, PHYS, STAT; this department list is my assumption) |
| Two upper-level labs | `labs` |
| Two credits for an independent research paper | `research-paper` (≥ 2 cr of BSCI379/389/399, assumed) |
| Courses must support the BIVS topic | note only |

## 5. Codes missing from `public/courses.json`

Named in the catalog or degree-sheet lists but absent from the last four years of classes. They are kept in the lists
(harmless; they match old transcripts):

- No catalog course entry at all (blank title in the catalog list; probably discontinued): **BSCI402, BSCI364,
  BSCI427, BSCI460, BSCI465** (BSCI461 is only in a footnote).
- Catalog entry exists but not offered recently: **BSCI373, BSCI413, BSCI471, BSCI475**.
- Older codes and topics: **BSCI348C** (Cell Biology Lab topic, GENB list), **BSCI440, BSCI441, BSCI338L** (former
  BSCI450/451), **BSCI457** (GENB sheet; not encoded, see 4.3).
- Special-topic numbers without a bare course (BSCI328, 338, 339, 439, 379) are matched by range, so any topic counts.

## 6. Open questions

1. Whether BSCI161 **or** BSCI171 alone, plus BSCI180, satisfies the 2026-27 lab ("may count for BSCI180"). The encoding
   requires BSCI180, or both 161 and 171.
2. Enrichment is "a maximum of 3 credits" in the prose but "minimum 3 credits" in the tables; the encoding takes 3-4.
3. Whether chemistry-major sequences (CHEM146/177/237/247) or PHYS161/260/270 substitute for the listed supporting
   courses. Not encoded.
4. Which special topics are approved for each specialization. Not knowable from a course list.
5. Upper-level lab designations are inferred (§3).

## 7. Sources

- `[S1]` UMD Catalog 2026-27, Biological Sciences major, Requirements tab:
  https://academiccatalog.umd.edu/undergraduate/colleges-schools/computer-mathematical-natural-sciences/biological-sciences/
- `[S2]` UMD Catalog 2025-26, same page (Wayback 2025-11-12):
  https://web.archive.org/web/20251112012234/https://academiccatalog.umd.edu/undergraduate/colleges-schools/computer-mathematical-natural-sciences/biological-sciences/
- `[S3]` Biological Sciences Program, Major Specializations: https://bsci.umd.edu/specialize
- `[S4]` GENB degree sheet (effective Aug 2024): https://bsci.umd.edu/s/GENB-GENEd-2024.pdf
- `[S5]` CEBG degree sheet (updated 3/2024): https://bsci.umd.edu/s/CEBG-GENEd-2023-2z9a.pdf
- `[S6]` ECEV degree sheet: https://bsci.umd.edu/s/ECEV-GENEd-2023-95sx.pdf
- `[S7]` MICB degree sheet: https://bsci.umd.edu/s/MICB-GENEd-2023-mr6s.pdf
- `[S8]` PHNB degree sheet (updated 3/2024): https://bsci.umd.edu/s/PHNB-GENEd-2023-fx5k.pdf
- `[S9..S13]` Four-year graduation plans: https://bsci.umd.edu/s/{GENB,CEBG,ECEV,MICB,PHNB}-4-Year-Graduation-Plan-2024.pdf
