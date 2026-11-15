#!/usr/bin/env python3
"""Build speaker-script PDFs for Group 2 (RouteMind Dubai).

Reads  : scripts/speaker_scripts.md  and  docs/frozen_results.json
Writes : scripts_pdf/Group2_Speaker_Scripts.pdf        (all 7 slides, one file)
         scripts_pdf/0N_<Member>_Slide<N>.pdf           (one per member)

Run    : python3 tools/build_speaker_pdfs.py
Needs  : pip install reportlab
Tokens : {{name}} is replaced from docs/frozen_results.json. If the value is null
         the PDF shows a red [name] so nobody reads a blank number out loud.
Pace   : 135 words per minute; [CUE: ...] = 3 s; [PAUSE] = 5 s.
"""
import json
import re
import sys
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (PageBreak, Paragraph, SimpleDocTemplate, Spacer,
                                Table, TableStyle)

ROOT = Path(__file__).resolve().parent.parent
SCRIPT_MD = ROOT / "scripts" / "speaker_scripts.md"
RESULTS = ROOT / "docs" / "frozen_results.json"
OUT = ROOT / "scripts_pdf"

WPM = 135
CUE_S = 3
PAUSE_S = 5
NAVY, TEAL, AMBER, RED, GREY = "#0B1F3A", "#0E8A8A", "#C77D0A", "#C0392B", "#555555"

TOKEN_RE = re.compile(r"\{\{(\w+)\}\}")
CUE_RE = re.compile(r"\[CUE:\s*([^\]]+)\]")
PAUSE_RE = re.compile(r"\[PAUSE\]")


def load_results():
    if RESULTS.exists():
        return json.loads(RESULTS.read_text(encoding="utf-8"))
    return {}


def parse_slides(text):
    slides, cur = [], None
    for line in text.splitlines():
        m = re.match(r"^##\s+SLIDE\s+(\d+)\s*\|\s*([^|]+)\|\s*(\d+)\s*\|\s*(.+)$", line)
        if m:
            cur = dict(n=int(m.group(1)), who=m.group(2).strip(), secs=int(m.group(3)),
                       title=m.group(4).strip(), notes=[], lines=[])
            slides.append(cur)
        elif cur is not None and line.strip():
            if line.startswith(">"):
                cur["notes"].append(re.sub(r"^Delivery:\s*", "", line.lstrip("> ").strip()))
            else:
                cur["lines"].append(line.strip())
    return slides


def fill_plain(s, results):
    """Plain text version (for word counting)."""
    def rep(m):
        v = results.get(m.group(1))
        return str(v) if v is not None else "0"
    return TOKEN_RE.sub(rep, s)


def count_and_time(slide, results):
    words, cues, pauses = 0, 0, 0
    for ln in slide["lines"]:
        cues += len(CUE_RE.findall(ln))
        pauses += len(PAUSE_RE.findall(ln))
        t = CUE_RE.sub("", ln)
        t = PAUSE_RE.sub("", t)
        t = fill_plain(t, results)
        words += len(t.split())
    secs = words / WPM * 60 + cues * CUE_S + pauses * PAUSE_S
    return words, secs


def to_markup(line, results):
    """Return reportlab markup with coloured tokens and cues."""
    out, pos = [], 0
    pattern = re.compile(r"\{\{(\w+)\}\}|\[CUE:\s*([^\]]+)\]|\[PAUSE\]")
    for m in pattern.finditer(line):
        out.append(escape(line[pos:m.start()]))
        if m.group(1):
            name = m.group(1)
            v = results.get(name)
            if v is None:
                out.append(f'<font color="{RED}"><b>[{name}]</b></font>')
            else:
                out.append(f'<font color="{TEAL}"><b>{escape(str(v))}</b></font>')
        elif m.group(2):
            out.append(f'<font color="{AMBER}"><b>[{escape(m.group(2).strip())}]</b></font>')
        else:
            out.append(f'<font color="{AMBER}"><b>[PAUSE]</b></font>')
        pos = m.end()
    out.append(escape(line[pos:]))
    return "".join(out)


def styles():
    base = dict(fontName="Helvetica", textColor=colors.HexColor("#111111"))
    return dict(
        title=ParagraphStyle("t", fontName="Helvetica-Bold", fontSize=22, leading=26,
                             textColor=colors.HexColor(NAVY), spaceAfter=4),
        sub=ParagraphStyle("s", fontName="Helvetica", fontSize=11, leading=15,
                           textColor=colors.HexColor(GREY), spaceAfter=10),
        h2=ParagraphStyle("h2", fontName="Helvetica-Bold", fontSize=14, leading=18,
                          textColor=colors.HexColor(TEAL), spaceBefore=8, spaceAfter=4),
        body=ParagraphStyle("b", fontSize=10.5, leading=15, spaceAfter=4, **base),
        script=ParagraphStyle("sc", fontSize=14, leading=22, spaceAfter=9, alignment=TA_LEFT, **base),
        note=ParagraphStyle("n", fontName="Helvetica-Oblique", fontSize=10.5, leading=14,
                            textColor=colors.HexColor(GREY), spaceAfter=3),
        small=ParagraphStyle("sm", fontName="Helvetica", fontSize=9, leading=12,
                             textColor=colors.HexColor(GREY)),
        cell=ParagraphStyle("c", fontName="Helvetica", fontSize=9.5, leading=12),
        cellb=ParagraphStyle("cb", fontName="Helvetica-Bold", fontSize=9.5, leading=12,
                             textColor=colors.white),
    )


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor(GREY))
    canvas.drawString(18 * mm, 10 * mm,
                      "Group 2 | AI in Operations (MAIB AI 218) | RouteMind Dubai | speaker script")
    canvas.drawRightString(A4[0] - 18 * mm, 10 * mm, f"Page {doc.page}")
    canvas.restoreState()


def fmt(secs):
    secs = int(round(secs))
    return f"{secs // 60}:{secs % 60:02d}"


def cover_story(slides, results, st, member=None):
    unfilled = sorted(k for k, v in results.items()
                      if v is None and not k.startswith("_") and k not in ("frozen_at",))
    st_list = []
    st_list.append(Paragraph("RouteMind Dubai: Speaker Scripts", st["title"]))
    st_list.append(Paragraph(
        "AI in Operations (MAIB AI 218), Group 2 | Presentation Tue 17 Nov 2026, 9:30 am Dubai | "
        "10 minutes + peer Q&amp;A", st["sub"]))
    if member:
        st_list.append(Paragraph(f"Your script: <b>{escape(member)}</b>", st["h2"]))

    data = [[Paragraph("No.", st["cellb"]), Paragraph("Speaker", st["cellb"]),
             Paragraph("Title", st["cellb"]), Paragraph("Target", st["cellb"]),
             Paragraph("Script", st["cellb"])]]
    total_t = total_s = 0
    for s in slides:
        w, secs = count_and_time(s, results)
        total_t += s["secs"]
        total_s += secs
        data.append([Paragraph(str(s["n"]), st["cell"]), Paragraph(s["who"], st["cell"]),
                     Paragraph(escape(s["title"]), st["cell"]), Paragraph(fmt(s["secs"]), st["cell"]),
                     Paragraph(f"{w} words, about {fmt(secs)}", st["cell"])])
    data.append([Paragraph("", st["cell"]), Paragraph("<b>Total</b>", st["cell"]), Paragraph("", st["cell"]),
                 Paragraph(f"<b>{fmt(total_t)}</b>", st["cell"]),
                 Paragraph(f"<b>about {fmt(total_s)}</b>", st["cell"])])
    t = Table(data, colWidths=[11 * mm, 24 * mm, 78 * mm, 15 * mm, 46 * mm], repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor(NAVY)),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#BBBBBB")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -2), [colors.white, colors.HexColor("#F2F6F8")]),
        ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#E3EEF0")),
        ("TOPPADDING", (0, 0), (-1, -1), 3), ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    st_list += [t, Spacer(1, 8)]

    st_list.append(Paragraph("How to read your script", st["h2"]))
    for b in [
        f'<font color="{TEAL}"><b>Teal bold</b></font> = a number filled from the frozen results. '
        f'<font color="{RED}"><b>[red]</b></font> = number not frozen yet: do not read it out; ask Krishna.',
        f'<font color="{AMBER}"><b>[Amber]</b></font> = an action (click or pause), not spoken.',
        "Pace is 135 words a minute. Rehearse twice with a timer. Hand over by name to the next speaker.",
        "Quote Statista as <b>worldwide</b>. Say <b>simulated</b> and <b>assumed</b> for our own numbers.",
        "Read <b>docs/08_qa_prep.md</b> before Tuesday. Anyone can be asked a question.",
    ]:
        st_list.append(Paragraph("&bull; " + b, st["body"]))
    if unfilled:
        st_list.append(Spacer(1, 6))
        st_list.append(Paragraph(
            f'<font color="{RED}"><b>DRAFT:</b> {len(unfilled)} numbers are not frozen yet '
            f'({escape(", ".join(unfilled))}). Rebuild this PDF after Monday 6 pm.</font>', st["body"]))
    return st_list


def slide_story(s, results, st):
    w, secs = count_and_time(s, results)
    out = [Paragraph(f"Slide {s['n']}: {escape(s['who'])}", st["title"]),
           Paragraph(escape(s["title"]), st["sub"]),
           Paragraph(f"Target {fmt(s['secs'])} | script {w} words, about {fmt(secs)}"
                     + ("" if secs <= s["secs"] + 5 else
                        f' <font color="{RED}"><b>(over target: trim)</b></font>'), st["small"]),
           Spacer(1, 6)]
    for n in s["notes"]:
        out.append(Paragraph("Delivery note: " + escape(n), st["note"]))
    out.append(Spacer(1, 4))
    for ln in s["lines"]:
        out.append(Paragraph(to_markup(ln, results), st["script"]))
    return out


def build(path, story):
    doc = SimpleDocTemplate(str(path), pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm,
                            topMargin=16 * mm, bottomMargin=18 * mm,
                            title="RouteMind Dubai Speaker Scripts", author="Group 2")
    doc.build(story, onFirstPage=footer, onLaterPages=footer)


def main():
    if not SCRIPT_MD.exists():
        sys.exit(f"Missing {SCRIPT_MD}")
    results = load_results()
    slides = parse_slides(SCRIPT_MD.read_text(encoding="utf-8"))
    if len(slides) != 7:
        print(f"WARNING: expected 7 slides, found {len(slides)}")
    st = styles()
    OUT.mkdir(exist_ok=True)

    story = cover_story(slides, results, st)
    for s in slides:
        story += [PageBreak()] + slide_story(s, results, st)
    build(OUT / "Group2_Speaker_Scripts.pdf", story)
    print("wrote Group2_Speaker_Scripts.pdf")

    for i, s in enumerate(slides, 1):
        safe = re.sub(r"[^A-Za-z0-9]+", "_", s["who"]).strip("_")
        story = slide_story(s, results, st)
        build(OUT / f"{i:02d}_{safe}_Slide{s['n']}.pdf", story)
        print(f"wrote {i:02d}_{safe}_Slide{s['n']}.pdf")

    for s in slides:
        w, secs = count_and_time(s, results)
        flag = "OVER" if secs > s["secs"] + 5 else "ok"
        print(f"slide {s['n']} {s['who']:<12} {w:>4} words  {fmt(secs)} vs {fmt(s['secs'])}  {flag}")


if __name__ == "__main__":
    main()
