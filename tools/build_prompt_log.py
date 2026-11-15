#!/usr/bin/env python3
"""Combines docs/prompt_logs/*.md into deliverables/GenAI_Prompt_Log.md and .csv (for the Blackboard upload).
Each member's file has table rows:  | date | slide/area | prompt (verbatim) | what it produced | circled on slide? |"""
import csv, re
from pathlib import Path
root = Path(__file__).resolve().parent.parent
rows = []
for f in sorted((root / "docs" / "prompt_logs").glob("*.md")):
    member = f.stem
    for line in f.read_text(encoding="utf-8").splitlines():
        if not line.startswith("|") or re.match(r"^\|\s*(-|date|#)", line, re.I):
            continue
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if len(cells) >= 5 and any(cells):
            rows.append([member] + cells[:5])
out = root / "deliverables"
out.mkdir(exist_ok=True)
hdr = ["Member", "Date", "Slide/area", "Prompt (verbatim)", "What it produced", "Circled on slide?"]
with open(out / "GenAI_Prompt_Log.csv", "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh); w.writerow(hdr); w.writerows(rows)
md = ["# GenAI Prompt Log (Group 2, RouteMind Dubai)", "", "Prompts are shared separately as required on slide 54. GenAI-assisted content is circled in red on the slides.", "",
      "| " + " | ".join(hdr) + " |", "|" + "---|" * len(hdr)]
md += ["| " + " | ".join(c.replace("\n", " ") for c in r) + " |" for r in rows]
(out / "GenAI_Prompt_Log.md").write_text("\n".join(md) + "\n", encoding="utf-8")
print(f"{len(rows)} prompts from {len(list((root/'docs'/'prompt_logs').glob('*.md')))} members -> deliverables/GenAI_Prompt_Log.md and .csv")
