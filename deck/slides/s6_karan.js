// SLIDE 6 | Owner: Karan Baid's slide (built by Yash after Karan left) | Integration, risks with fallbacks, human override,
// and the four C-suite themes: business model, tech investment, ecosystem integration, operational risk.
// Facts: R13 (Makani), R14 (midday break), R19 (UAE PDPL; no fine claims). Body text >= 14 pt; footnote 10 pt.
const { C, F, MX, owner, card, genaiCircle, genaiLegend, source, title } = require("../theme");
const { fz } = require("../lib/frozen");
const { notesFor } = require("../lib/notes");

module.exports.build = function (pres) {
  const s = pres.addSlide({ masterName: "NIGHT" });
  title(s, "Integration is the real risk, and we have a fallback for each");
  owner(s, "Slide 6 | Integration and risk");

  // LEFT: integration map, RouteMind in the centre (lines first so the boxes cover them)
  card(pres, s, MX, 1.75, 5.6, 3.5);
  const hub = { x: MX + 2.8, y: 3.5 };
  const nodes = [
    ["TMS / WMS", MX + 0.2, 1.95, 2.1], ["Driver app", MX + 3.3, 1.95, 2.1],
    ["E-commerce", MX + 0.2, 3.2, 1.55], ["Robots, EV", MX + 3.85, 3.2, 1.55],
    ["Traffic, weather", MX + 0.2, 4.45, 2.1], ["Makani", MX + 3.3, 4.45, 2.1],
  ];
  nodes.forEach((n) => {
    const nx = n[1] + n[3] / 2, ny = n[2] + 0.3;
    s.addShape(pres.shapes.LINE, { x: Math.min(nx, hub.x), y: Math.min(ny, hub.y), w: Math.abs(nx - hub.x) || 0.01, h: Math.abs(ny - hub.y) || 0.01,
      line: { color: C.ai, width: 1.25 }, flipV: (nx - hub.x) * (ny - hub.y) < 0 });
  });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: hub.x - 0.75, y: hub.y - 0.35, w: 1.5, h: 0.7, rectRadius: 0.14, fill: { color: C.aiDeep }, line: { color: C.ai, width: 1.5 } });
  s.addText("RouteMind", { x: hub.x - 0.75, y: hub.y - 0.35, w: 1.5, h: 0.7, fontFace: F.head, fontSize: 16, bold: true, color: "FFFFFF", align: "center", valign: "middle", margin: 0, isTextBox: true });
  nodes.forEach((n) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: n[1], y: n[2], w: n[3], h: 0.6, rectRadius: 0.1, fill: { color: C.panel2 }, line: { color: C.line, width: 0.75 } });
    s.addText(n[0], { x: n[1], y: n[2], w: n[3], h: 0.6, fontFace: F.body, fontSize: 14, color: C.text, align: "center", valign: "middle", margin: 0.04, isTextBox: true });
  });

  // RIGHT: risk to fallback table (4 rows from docs/05_slide_content.md + heat rule)
  const hdr = (t) => ({ text: t, options: { bold: true, color: "FFFFFF", fill: { color: C.aiDeep }, fontFace: F.head, fontSize: 14 } });
  const cell = (t, o = {}) => ({ text: t, options: { color: C.text, fill: { color: C.panel }, fontFace: F.body, fontSize: 14, ...o } });
  const rows = [
    [hdr("Risk"), hdr("Fallback")],
    [cell("Data quality", { bold: true }), cell("Makani addresses; dispatcher confirms flagged stops")],
    [cell("Driver adoption", { bold: true }), cell("Accept, edit or reject any route; fair workload")],
    [cell("Privacy (UAE PDPL)", { bold: true }), cell("Minimum personal data, consent; confirm with legal counsel")],
    [cell("Model or API failure", { bold: true }), cell("Drivers keep the last accepted plan, then baseline")],
    [cell("Heat rules", { bold: true }), cell("Midday break 12:30 to 15:00, 15 Jun to 15 Sep")],
  ];
  s.addTable(rows, { x: 6.45, y: 1.75, w: 6.28, colW: [2.0, 4.28], border: { type: "solid", pt: 0.75, color: C.line }, valign: "middle", margin: [0.06, 0.1, 0.06, 0.1] });

  // BOTTOM: the four C-suite themes
  const themes = [
    ["Business model", "Zone lockers, paid slots, premium urgent"],
    ["Tech investment", `Pilot ${fz("pilot_cost", "", "AED ")} (assumed), advisory first`],
    ["Ecosystem", "TMS/WMS, Makani, robots, EV charging"],
    ["Operational risk", "Human override; fallback for every risk"],
  ];
  const tw = 2.883, gap = 0.2; // 4 cards span W - 2*MX exactly
  themes.forEach((t, i) => {
    const x = MX + i * (tw + gap);
    card(pres, s, x, 5.42, tw, 1.15, { fill: C.panel2 });
    s.addText(t[0], { x: x + 0.18, y: 5.5, w: tw - 0.36, h: 0.36, fontFace: F.head, fontSize: 15, bold: true, color: C.ai, margin: 0, isTextBox: true });
    s.addText(t[1], { x: x + 0.18, y: 5.88, w: tw - 0.36, h: 0.62, fontFace: F.body, fontSize: 14, color: C.text, margin: 0, valign: "top", isTextBox: true });
  });

  // GenAI marking: the integration diagram layout was generated with GenAI (Claude Code)
  genaiCircle(pres, s, MX - 0.08, 1.67, 5.76, 3.66);
  genaiLegend(pres, s);
  source(s, "Sources: Makani (Gulf News), UAE midday break (Khaleej Times), UAE PDPL Federal Decree-Law 45/2021 (docs/04_research_brief.md R13, R14, R19). Pilot cost assumed.");
  s.addNotes(notesFor(6));
};
