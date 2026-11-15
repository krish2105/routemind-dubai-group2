// SLIDE 7 | Owner: Harsh | Recommendation: 90-day pilot, phases, cost and payback, gates, the ask.
const { C, F, W, MX, owner, card, source, title } = require("../theme");
const { fz } = require("../lib/frozen");
const { notesFor } = require("../lib/notes");

module.exports.build = function (pres) {
  const s = pres.addSlide({ masterName: "NIGHT" });
  title(s, "Recommendation: a 90-day pilot with clear go or no-go gates");
  owner(s, "Slide 7 | Harsh");

  // three phases
  const phases = [
    ["Weeks 1 to 4", "Connect and advise", "Link order data, run RouteMind beside dispatchers, no live changes"],
    ["Weeks 5 to 8", "Live on part of fleet", "Dispatchers use AI routes with live re-routing"],
    ["Weeks 9 to 12", "Measure and decide", "Compare to baseline, check gates, go or no-go"],
  ];
  const pw = 3.95, gap = 0.19;
  phases.forEach((p, i) => {
    const x = MX + i * (pw + gap);
    card(pres, s, x, 1.8, pw, 1.95);
    s.addText(p[0].toUpperCase(), { x: x + 0.22, y: 1.9, w: pw - 0.44, h: 0.3, fontFace: F.body, fontSize: 11, color: C.ai, charSpacing: 2, margin: 0, isTextBox: true });
    s.addText(p[1], { x: x + 0.22, y: 2.25, w: pw - 0.44, h: 0.45, fontFace: F.head, fontSize: 20, bold: true, color: C.white, margin: 0, isTextBox: true });
    s.addText(p[2], { x: x + 0.22, y: 2.75, w: pw - 0.44, h: 0.9, fontFace: F.body, fontSize: 14, color: C.muted, margin: 0, valign: "top", isTextBox: true });
  });

  // money
  card(pres, s, MX, 3.95, 3.95, 1.55, { line: C.base });
  s.addText("PILOT COST (ASSUMED)", { x: MX + 0.22, y: 4.03, w: 3.5, h: 0.3, fontFace: F.body, fontSize: 11, color: C.muted, charSpacing: 2, margin: 0, isTextBox: true });
  s.addText(fz("pilot_cost", "", "AED "), { x: MX + 0.22, y: 4.35, w: 3.5, h: 0.75, fontFace: F.head, fontSize: 34, bold: true, color: C.base, margin: 0, valign: "middle", isTextBox: true });
  card(pres, s, MX + pw + gap, 3.95, 3.95, 1.55, { line: C.ai });
  s.addText("PAYBACK (SIMULATED SAVINGS)", { x: MX + pw + gap + 0.22, y: 4.03, w: 3.5, h: 0.3, fontFace: F.body, fontSize: 11, color: C.muted, charSpacing: 2, margin: 0, isTextBox: true });
  s.addText(`${fz("payback_months", " months")}`, { x: MX + pw + gap + 0.22, y: 4.35, w: 3.5, h: 0.75, fontFace: F.head, fontSize: 34, bold: true, color: C.ai, margin: 0, valign: "middle", isTextBox: true });
  s.addText(`at half the savings: ${fz("payback_half", " months")}`, { x: MX + pw + gap + 0.22, y: 5.1, w: 3.5, h: 0.3, fontFace: F.body, fontSize: 12, color: C.muted, margin: 0, isTextBox: true });
  card(pres, s, MX + 2 * (pw + gap), 3.95, 3.95, 1.55, { fill: C.panel2 });
  s.addText("Benchmark: McKinsey reports AI can cut logistics costs by about 5 to 20% in distribution. We apply a 40% adoption haircut.", { x: MX + 2 * (pw + gap) + 0.22, y: 4.03, w: 3.5, h: 1.4, fontFace: F.body, fontSize: 13, color: C.text, margin: 0, valign: "middle", isTextBox: true });

  // gates + ask
  card(pres, s, MX, 5.7, 8.0, 0.9);
  s.addText([{ text: "Go/no-go gates:  ", options: { bold: true, color: C.ai } }, { text: "cost per parcel · on-time rate · driver adoption · zero privacy incidents", options: { color: C.text } }],
    { x: MX + 0.25, y: 5.7, w: 7.5, h: 0.9, fontFace: F.body, fontSize: 15, margin: 0, valign: "middle", isTextBox: true });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 8.8, y: 5.7, w: 3.93, h: 0.9, rectRadius: 0.12, fill: { color: C.ai }, line: { color: C.ai, width: 0.5 } });
  s.addText("Our ask: approve the pilot", { x: 8.8, y: 5.7, w: 3.93, h: 0.9, fontFace: F.head, fontSize: 20, bold: true, color: C.bg, align: "center", valign: "middle", margin: 0, isTextBox: true });
  source(s, "McKinsey on AI in distribution (docs/04_research_brief.md R7). Cost and savings are assumed and simulated; the pilot measures the real numbers.");
  s.addNotes(notesFor(7));
};
