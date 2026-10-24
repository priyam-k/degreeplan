import type { AuditResult, Plan, Program } from "../types";
import type { Catalog } from "../catalog";
import type { SetPlan } from "../App";

interface Props {
  plan: Plan;
  programs: Program[];
  catalog: Catalog;
  audit: AuditResult | null;
  setPlan: SetPlan;
  onFlow: () => void;
}

export function DegreeView(_: Props) {
  return <main className="degree-main">Coming up.</main>;
}
