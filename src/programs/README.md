# Program files

Each `.yaml` file in this folder defines one program, or several tracks of one major. To add a major, minor or
other program, add a file here. It is picked up automatically: majors and minors appear in the program picker,
and `gened`/`university` programs are always audited.

`load.ts` checks every field when the app builds and when tests run, so a typo fails with the file and the
location (for example `bad.yaml at buckets[2].cours: unknown field`) instead of quietly matching nothing. Run
`npm test` after editing.

## A small example

```yaml
# Example minor — 2025-26 catalog. Cite the catalog page under sources.
id: example-minor
name: Example Minor
short: Example minor        # optional; used on chips and buttons
kind: minor                 # major | minor | gened | university
buckets:
  - CMSC131                 # a bare course code = that one course is required
  - id: core
    label: Two of CMSC420/421/422
    match: [CMSC420, CMSC421, CMSC422]
    choose: 2               # exactly 2: sets courses and maxCourses
  - id: electives
    label: Upper-level electives (6 cr)
    match: { any: [CMSC300-499, MATH400-499], except: [CMSC330, CMSC351] }
    credits: 6
constraints:
  - { kind: minFrom, id: umd2, label: ≥ 2 taken at UMD, buckets: [core, electives], match: "@umd", courses: 2 }
notes:
  - C- or better in every minor course.
sources:
  - https://academiccatalog.umd.edu/...
```

## Matching courses

A `match` decides which courses can fill a bucket, constraint or slot.

| Write | Matches |
| --- | --- |
| `CMSC131` | that course, and its honors version `CMSC131H` |
| `CMSC498A` | only that topic |
| `CMSC300-499` | any CMSC course numbered 300 to 499, any suffix |
| `"*300-999"` | any department, numbered 300 to 999 |
| `[A, B, …]` | any of the items (lists nest) |
| `{ any: [A, B], except: C }` | any of A, B but not C (`except` also works with `all`, `topic` and `slotOf`) |
| `{ all: [A, B] }` | courses matching every item |
| `{ topic: CMSC498B, terms: [Fall 2024, Fall 2025] }` | that topic, only when taken in one of those terms |
| `{ slotOf: $SEQUENCES }` | any course in any slot of those `anySet` options |
| `"*"` | anything, including GenEd-only credit with no course code |
| `"@umd"` | anything taken at UMD (not transfer or AP) |
| `"@ap"` | AP/IB exam credit |

## Bucket fields

| Field | Meaning |
| --- | --- |
| `id`, `label` | required. Ids are unique within a program and are used as waiver keys, so keep them stable. |
| `match` | required unless `gened` is set (then it defaults to `"*"`) |
| `courses`, `credits` | minimum number of courses and/or credits |
| `maxCourses` | hard cap on courses assigned here |
| `choose` | shorthand for `courses` = `maxCourses` |
| `gened` | GenEd codes this bucket accepts, e.g. `[DSHU]` |
| `useGroup` | a course is used at most once per use-group within a program (default `main`). Give a bucket its own group when a course may fill it *and* another bucket. |
| `noShare` | courses used only here don't count against major/minor overlap limits |
| `discipline` | all courses here must come from one department: `{ exclude: [CMSC, CP*], merge: { MATH/STAT: [MATH, STAT] } }`. Excluded departments can't be used at all. |
| `note` | shown under the requirement |

## Constraints

Constraints apply to the courses already assigned to the listed `buckets`. Each needs an `id`, a `label` and a
`kind`:

| Kind | Fields | Meaning |
| --- | --- | --- |
| `minFrom` | `buckets`, `match`, `courses` | at least N of those courses match |
| `maxFrom` | `buckets`, `match`, `courses` and/or `credits` | at most N courses (or credits) match |
| `maxEach` | `buckets`, `groups`, `courses`/`credits`, optional `omit` | one `maxFrom` per group; `{id}` and `{label}` in the rule's id and label are filled from each group |
| `distinct` | `buckets`, `groups`, `min`, optional `omit` | the courses cover at least `min` different groups (each course counts for one group) |
| `anySet` | `buckets`, `options` | the courses complete at least one option (supporting sequences, depth pairs) |
| `within` | `bucket`, `of` | every course in `bucket` must also be in one of `of` (SCIS on a DS course) |
| `outsideMajors` | `buckets`, `min` | at least `min` courses are not used by any major |

Groups are `{ id, label, match }`. Options are `{ label, slots }`; the label defaults to the slots joined with
" + ". A slot can be:
- a course (`PHYS161`);
- a list of alternatives (`[BSCI180, BSCI171]`, labelled `BSCI180/BSCI171`);
- `{ match, count, label }` for "two of …".

## Sharing between programs

- **`defs` and `$NAME`:** `defs` holds named values. `$NAME` anywhere is replaced by that value, and
  `"...$NAME"` inside a list splices a list in. Use this for shared course lists, area definitions and common
  buckets.
- **Several tracks in one file:** put them under `programs:`. Fields at the top of the file (`kind`, `short`,
  `notes`, `sources`, …) are defaults for every track. A major's `family` defaults to the file name; tracks in
  one family are mutually exclusive in the picker.
- **`patch`:** adjusts buckets brought in from a shared list:
  `patch: { mathstat: { label: Linear algebra, match: [MATH240, MATH461] } }`.

See `cs.yaml` and `math.yaml` for all of these together.

## YAML gotchas

Quote text that contains `": "` or `" #"`, or that starts with `*`, `@`, `{`, `[`, `&`, `!` or `%`.
Examples: `"Depth: a one-year sequence"`, `"*300-499"`, `"@umd"`. The loader reports an unknown field or a
non-text value if YAML read something differently than you meant.

## What stays in code

- **Rules across programs:** the major/minor overlap caps live in `index.ts`. They are university policy, not a
  program's own rule.
- **New kinds of rules:** a rule none of the forms above can express needs a new constraint kind. Add it to
  `ProgramConstraint` in `types.ts`, to the solver in `engine/solver.ts` (both the LP rows and the re-check),
  and to `load.ts`. Every program file can use it after that.
