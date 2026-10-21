import type { CatalogCourse } from "./types";
import { fromUmdIo } from "./geneds";

export type Catalog = Map<string, CatalogCourse>;

export async function loadCatalog(): Promise<Catalog> {
  const r = await fetch(`${import.meta.env.BASE_URL}courses.json`);
  if (!r.ok) throw new Error(`courses.json: ${r.status}`);
  const list: CatalogCourse[] = await r.json();
  return new Map(list.map((c) => [c.c, { ...c, g: fromUmdIo(c.g) }]));
}

// "Credit only granted for: CMSC131, CMSC133 or CMSC141." -> codes
export function exclusiveWith(c: CatalogCourse | undefined): string[] {
  if (!c?.x) return [];
  return (c.x.match(/[A-Z]{4}\d{3}[A-Z]?/g) ?? []).filter((x) => x !== c.c);
}
