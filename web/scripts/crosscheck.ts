/**
 * Number cross-check after the freeze (owner: Harsh). Read-only: it changes no file.
 *   cd web && npx tsx scripts/crosscheck.ts                       uses docs/frozen_results.json
 *   cd web && npx tsx scripts/crosscheck.ts --frozen <file.json>   e.g. a saved dry-run output, before the real freeze
 *
 * Scans every slide module (deck/slides/*.js), the spoken scripts (scripts/speaker_scripts.md) and the Q&A sheet
 * (docs/08_qa_prep.md). For each place a number appears it decides:
 *   TOKEN      {{x}} / fz("x") / data.x: must exist in the frozen file and not be null
 *   BYPASS     a typed number equal to a frozen result: should be a token (fails)
 *   ASSUMED    equals an input in data_seed/assumptions.json (fine, must be labelled assumed)
 *   SOURCED    appears in docs/04_research_brief.md (row R#); rows that are not verified are flagged
 *   TIMING     dates, clock times, durations, slide/step/phase numbers
 *   REVIEW     none of the above: a person checks it (listed, does not fail)
 * Prints a markdown report (paste into docs/verification_log.md) and exits 1 on any missing token or BYPASS.
 */
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "../..");
const args = process.argv.slice(2);
const frozenPath = args.includes("--frozen") ? resolve(process.cwd(), args[args.indexOf("--frozen") + 1]) : resolve(ROOT, "docs/frozen_results.json");
const frozen = JSON.parse(readFileSync(frozenPath, "utf8")) as Record<string, unknown>;
const assumptionsRaw = JSON.parse(readFileSync(resolve(ROOT, "data_seed/assumptions.json"), "utf8"));
const brief = readFileSync(resolve(ROOT, "docs/04_research_brief.md"), "utf8");
const verification = readFileSync(resolve(ROOT, "docs/verification_log.md"), "utf8");

/* ---------- reference sets ---------- */
const frozenNums = new Map<number, string>();
for (const [k, v] of Object.entries(frozen)) if (typeof v === "number" && !k.startsWith("_") && k !== "seed") frozenNums.set(v, k);

const assumed = new Map<number, string>();
const PERCENT_KEYS = /share|probability|extra|haircut/;
(function walk(o: unknown, path: string) {
  if (typeof o === "number") {
    if (!assumed.has(o)) assumed.set(o, path); // first wins: vehicles.van.count before costs.failed_delivery_cost_aed
    if (o > 0 && o < 1 && PERCENT_KEYS.test(path) && !assumed.has(Math.round(o * 100))) assumed.set(Math.round(o * 100), `${path} (as %)`);
    return;
  }
  if (o && typeof o === "object") for (const [k, v] of Object.entries(o)) if (k !== "provenance") walk(v, path ? `${path}.${k}` : k);
})(assumptionsRaw, "");
const haircut = assumptionsRaw.business_case.adoption_haircut as number;
assumed.set(Math.round((1 - haircut) * 100), "business_case.adoption_haircut (haircut %)");

/** number -> research rows that mention it; row -> row text (to match the source named next to a number) */
const sourced = new Map<number, Set<number>>();
const rowText = new Map<number, string>();
for (const line of brief.split("\n")) {
  const m = line.match(/^\|\s*(\d+)\s*\|(.*)$/);
  if (!m) continue;
  const row = Number(m[1]);
  rowText.set(row, (rowText.get(row) ?? "") + m[2]);
  for (const n of numbersIn(m[2])) (sourced.get(n) ?? sourced.set(n, new Set()).get(n)!).add(row);
}
/** Rows the fact-check could not verify (docs/04 section 7a and verification_log). */
// the log is newest-first, so the first status seen for a row wins (a later manual check overrides an older failed fetch)
const unverifiedRows = new Set<number>();
const seenRows = new Set<number>();
for (const m of verification.matchAll(/\|\s*R(\d+)\s*\|\s*([^|\n]+)\|/g)) {
  const row = Number(m[1]);
  if (seenRows.has(row)) continue;
  seenRows.add(row);
  if (/could not verify|not checked/i.test(m[2])) unverifiedRows.add(row);
}

function numbersIn(text: string): number[] {
  return [...text.matchAll(/(?<![\w.])(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)(?![\w])/g)].map((m) => Number(m[1].replace(/,/g, "")));
}

/* ---------- sources to scan ---------- */
interface Hit { file: string; line: number; owner: string; text: string; kind: string; detail: string }
const hits: Hit[] = [];
const OWNERS: Record<string, string> = { s1: "Gagandeep", s2: "Yash", s3: "Atharva", s4: "Krishna", s5: "Advait", s6: "Yash", s7: "Harsh" };
const TIMING = /(\b\d{1,2}:\d{2}\b|\b(19|20)\d{2}\b|\b(slide|slides|step|phase|week|weeks|day|days|minute|minutes|min|mins|second|seconds|hour|hours|h|month|months|pm|am|jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|january|february|march|june|july|september|november|december)\b)/i;

/** Words that mean "this number is a cited fact" (research brief sources). */
const SOURCE_WORDS = /McKinsey|Statista|UPS|ORION|RTA|Makani|PDPL|WAM|Gulf|Khaleej|EZDubai|Euromonitor|talabat|DEWA|Road2\.0|WWF|Yango|noon|midday break|e-?commerce|online shopping|shipping cost/i;

function classify(file: string, lineNo: number, owner: string, text: string) {
  // tokens
  for (const m of text.matchAll(/\{\{(\w+)\}\}|fz\("(\w+)"|data\.(\w+)/g)) {
    const key = m[1] ?? m[2] ?? m[3];
    if (key === "token") continue; // the format line in speaker_scripts.md
    const v = frozen[key];
    hits.push({ file, line: lineNo, owner, text: key, kind: v === undefined ? "MISSING" : v === null ? "NULL" : "TOKEN", detail: v === undefined ? "not in the frozen file" : String(v) });
  }
  const plain = text
    .replace(/\{\{\w+\}\}|fz\("[^"]*"[^)]*\)|data\.\w+|\$\{[^}]*\}/g, " ")
    .replace(/^\|\s*\d+\s*\|/, "| |")          // Q&A table row numbers
    .replace(/^\s*\d+\.\s/, " ")                 // numbered list items
    .replace(/\b2-opt\b/gi, "two-opt");           // algorithm name, not a number
  for (const m of plain.matchAll(/(?<![\w.#])(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)(?![\w])/g)) {
    const n = Number(m[1].replace(/,/g, ""));
    const around = plain.slice(Math.max(0, (m.index ?? 0) - 18), (m.index ?? 0) + m[0].length + 18);
    let kind = "REVIEW", detail = "";
    // precedence: exact assumed input > frozen result > research row > timing; ambiguous small integers go to a person
    const distinctive = !Number.isInteger(n) || n > 30;
    const wide = plain.slice(Math.max(0, (m.index ?? 0) - 90), (m.index ?? 0) + m[0].length + 60);
    const word = wide.match(SOURCE_WORDS)?.[0];
    const cited = !!word && sourced.has(n);
    if (cited) {
      const all = [...sourced.get(n)!];
      const named = all.filter((r) => rowText.get(r)!.toLowerCase().includes(word!.toLowerCase()));
      const rows = named.length ? named : all;
      kind = rows.every((r) => unverifiedRows.has(r)) ? "UNVERIFIED" : "SOURCED";
      detail = rows.map((r) => `R${r}${unverifiedRows.has(r) ? " (unverified)" : ""}`).join(", ");
    } else if (TIMING.test(around) && Number.isInteger(n) && n <= 31) { kind = "TIMING"; detail = "time, date, count or ordinal"; }
    else if (assumed.has(n)) { kind = "ASSUMED"; detail = assumed.get(n)!; }
    else if (frozenNums.has(n) && distinctive) { kind = "BYPASS"; detail = `equals frozen ${frozenNums.get(n)}: use the token`; }
    else if (frozenNums.has(n)) { kind = "REVIEW"; detail = `small number that equals frozen ${frozenNums.get(n)}: token or a different fact?`; }
    else if (sourced.has(n)) {
      const rows = [...sourced.get(n)!];
      const bad = rows.filter((r) => unverifiedRows.has(r));
      kind = bad.length === rows.length ? "UNVERIFIED" : "SOURCED";
      detail = rows.map((r) => `R${r}${unverifiedRows.has(r) ? " (unverified)" : ""}`).join(", ");
    } else if (TIMING.test(around) || n <= 10) { kind = "TIMING"; detail = "time, date, count or ordinal"; }
    hits.push({ file, line: lineNo, owner, text: around.trim().replace(/\s+/g, " "), kind, detail });
  }
}

// slide modules: only text inside string literals (layout numbers like x: 0.6 are not text)
const slideDir = resolve(ROOT, "deck/slides");
for (const f of readdirSync(slideDir).filter((x) => /^s\d_.*\.js$/.test(x)).sort()) {
  const owner = OWNERS[f.slice(0, 2)] ?? "?";
  readFileSync(resolve(slideDir, f), "utf8").split("\n").forEach((line, i) => {
    if (/^\s*\/\//.test(line)) return; // comments
    for (const fzm of line.matchAll(/fz\("(\w+)"/g)) classify(`deck/slides/${f}`, i + 1, owner, `fz("${fzm[1]}"`);
    for (const dm of line.matchAll(/\bdata\.(\w+)/g)) classify(`deck/slides/${f}`, i + 1, owner, `data.${dm[1]}`);
    for (const s of line.matchAll(/"((?:[^"\\]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g)) {
      const str = s[1] ?? s[2] ?? "";
      if (!/[A-Za-z]{2}/.test(str)) continue; // colours, ids, file names without words
      if (/^[\w./-]+\.(png|js|json|md)$/.test(str)) continue;
      classify(`deck/slides/${f}`, i + 1, owner, str.replace(/fz\([^)]*\)/g, " "));
    }
  });
}

// speaker scripts (spoken lines only) and Q&A sheet
function scanMarkdown(rel: string, ownerOf: (line: string, current: string) => string) {
  let owner = "?";
  readFileSync(resolve(ROOT, rel), "utf8").split("\n").forEach((line, i) => {
    owner = ownerOf(line, owner);
    if (rel.endsWith("speaker_scripts.md") && (owner === "?" || line.startsWith("##") || line.startsWith(">"))) return;
    if (!line.trim()) return;
    classify(rel, i + 1, owner, line.replace(/\[CUE:[^\]]*\]|\[PAUSE\]|\(R\d+\)|R\d+/g, " "));
  });
}
scanMarkdown("scripts/speaker_scripts.md", (line, cur) => line.match(/^##\s+SLIDE\s+\d+\s*\|\s*([^|]+)\|/)?.[1].trim() ?? cur);
scanMarkdown("docs/08_qa_prep.md", (line, cur) => line.match(/^## [A-Z]\..*\(owner: ([^),]+)/)?.[1].trim() ?? cur);

/* ---------- report ---------- */
const order = ["MISSING", "NULL", "BYPASS", "UNVERIFIED", "REVIEW", "ASSUMED", "SOURCED", "TOKEN", "TIMING"];
const count = (k: string) => hits.filter((h) => h.kind === k).length;
console.log(`## Cross-check: numbers in slides, scripts and Q&A vs ${frozenPath.replace(ROOT + "/", "")}`);
console.log(`Frozen at ${String(frozen.frozen_at)} · ${hits.length} numbers and tokens scanned · ` + order.map((k) => `${k} ${count(k)}`).join(" · "));
const show = (kinds: string[], title: string) => {
  const rows = hits.filter((h) => kinds.includes(h.kind));
  if (!rows.length) return;
  console.log(`\n### ${title}\n| file:line | owner | text | class | detail |\n|---|---|---|---|---|`);
  for (const h of rows) console.log(`| ${h.file}:${h.line} | ${h.owner} | ${h.text.replace(/\|/g, "/")} | ${h.kind} | ${h.detail} |`);
};
show(["MISSING", "NULL", "BYPASS"], "Must fix before the deck is rebuilt");
show(["UNVERIFIED"], "Sourced from a research row that is not verified");
show(["REVIEW"], "Not classified automatically (a person checks these)");
if (args.includes("--all")) show(["SOURCED", "ASSUMED", "TIMING"], "Everything else (for the record)");
const tokens = new Set(hits.filter((h) => h.kind === "TOKEN").map((h) => h.text));
console.log(`\nTokens used and present (${tokens.size}): ${[...tokens].sort().join(", ")}`);
const unused = Object.keys(frozen).filter((k) => !k.startsWith("_") && !["frozen_at", "seed"].includes(k) && !tokens.has(k));
console.log(`Frozen keys not used by slides, scripts or Q&A (fine if used by pages): ${unused.join(", ") || "none"}`);
const fail = count("MISSING") + count("NULL") + count("BYPASS");
console.log(fail ? `\nRESULT: ${fail} problem(s) to fix.` : "\nRESULT: every token resolves and no frozen result is typed by hand.");
process.exit(fail ? 1 : 0);
