#!/usr/bin/env python3
"""Evidence for the 'Team Collaboration' criterion: commits and lines per author, from git history.
Run from the repo root:  python3 tools/contribution_report.py   ->  docs/contribution_report.md"""
import subprocess, collections
from pathlib import Path
root = Path(__file__).resolve().parent.parent
log = subprocess.run(["git", "log", "--no-merges", "--numstat", "--format=@@%an"], cwd=root, capture_output=True, text=True).stdout
stats = collections.defaultdict(lambda: [0, 0, 0])
cur = None
for line in log.splitlines():
    if line.startswith("@@"):
        cur = line[2:]; stats[cur][0] += 1
    elif line.strip() and cur:
        a, d, *_ = line.split("\t")
        if a.isdigit(): stats[cur][1] += int(a)
        if d.isdigit(): stats[cur][2] += int(d)
tot = sum(v[0] for v in stats.values()) or 1
rows = sorted(stats.items(), key=lambda kv: -kv[1][0])
md = ["# Contribution report (from git history)", "", "| Author | Commits | Share | Lines added | Lines removed |", "|---|---|---|---|---|"]
md += [f"| {n} | {c} | {c*100//tot}% | {a} | {d} |" for n, (c, a, d) in rows]
md += ["", "Commits are counted per author, excluding merge commits. Read together with the PR list on GitHub and `docs/contributions/<Name>.md`."]
(root / "docs" / "contribution_report.md").write_text("\n".join(md) + "\n")
print("\n".join(md))
