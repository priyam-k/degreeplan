import { describe, expect, test } from "vitest";
import type { CatalogCourse } from "../types";
import { searchCatalog } from "./CourseSearch";
import { shortUsage } from "../components/SemesterTable";

const course = (c: string, n: string, t: number[] = [2508]): CatalogCourse => ({ c, n, cr: 3, mx: null, g: [], p: null, x: null, t });
const catalog = new Map(
  [
    course("CMSC421", "Introduction to Artificial Intelligence"),
    course("CMSC422", "Introduction to Machine Learning"),
    course("CMSC472", "Introduction to Deep Learning"),
    course("CMSC720", "Foundations of Deep Learning"),
    course("DATA612", "Deep Learning"),
    course("CMSC498X", "Deep Learning Topics", []),
  ].map((c) => [c.c, c]),
);

describe("course search", () => {
  test("exact code first, then code prefix", () => {
    expect(searchCatalog(catalog, "cmsc 421")[0].c).toBe("CMSC421");
    expect(searchCatalog(catalog, "CMSC42").map((c) => c.c)).toEqual(["CMSC421", "CMSC422"]);
  });
  test("title words rank undergraduate, recently offered courses first", () => {
    expect(searchCatalog(catalog, "deep learning").map((c) => c.c)).toEqual(["CMSC472", "CMSC498X", "DATA612", "CMSC720"]);
  });
  test("filter restricts results", () => {
    expect(searchCatalog(catalog, "learning", 40, (c) => c.c.startsWith("DATA")).map((c) => c.c)).toEqual(["DATA612"]);
  });
});

describe("requirement chips", () => {
  test("program prefix and no parentheticals", () => {
    expect(shortUsage("Mathematics: One of MATH246/436/462 (or 341)")).toBe("Math · One of MATH246/436/462");
    expect(shortUsage("Robotics and Autonomous Systems: 2 electives (6 cr)")).toBe("RAS · 2 electives");
  });
  test("GenEd chips show the GenEd the course has", () => {
    expect(shortUsage("GenEd: Second diversity: DVUP or DVCC", ["DVCC"])).toBe("DVCC");
    expect(shortUsage("GenEd: DSHS History & Social Sciences (×2)", ["DSHS"])).toBe("DSHS");
  });
});
