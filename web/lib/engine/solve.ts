import type { AlgorithmId, Plan, Problem } from "@/lib/types";
import { solveBaseline } from "./baseline";
import { solveCW2opt } from "./clarkeWright";
import { solveGA } from "./ga";

/** Single entry point used by the worker and by tests. */
export function solve(p: Problem, algorithm: AlgorithmId): Plan {
  switch (algorithm) {
    case "baseline": return solveBaseline(p);
    case "cw2opt": return solveCW2opt(p);
    case "ga": return solveGA(p);
  }
}
