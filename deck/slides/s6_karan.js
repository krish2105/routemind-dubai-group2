// SLIDE 6 | Owner: Karan Baid | Integration, risks with fallbacks, privacy, human override, ecosystem.
const { C, F, W, MX, owner, card, genaiCircle, genaiLegend, source, title } = require("../theme");
const { notesFor } = require("../lib/notes");

module.exports.build = function (pres) {
  const s = pres.addSlide({ masterName: "NIGHT" });
  title(s, "Integration is the real risk, and we have a fallback for each");
  owner(s, "Slide 6 | Karan Baid");

  // integration map: RouteMind in the centre, systems around it (lines are drawn first so boxes cover them)
  const hub = { x: 3.35, y: 4.05 };
  card(pres, s, MX, 1.8, 5.5, 4.75);
  const nodes = [
    ["TMS / WMS", 0.85, 2.05, 1.9], ["Driver app", 3.95, 2.05, 1.9],
    ["E-commerce platforms", 0.85, 3.7, 1.5], ["Robots, EV, lockers", 4.45, 3.7, 1.4],
    ["Traffic + weather APIs", 0.85, 5.55, 1.9], ["Makani addresses", 3.95, 5.55, 1.9],
  ];
  nodes.forEach((n) => {
    const nx = n[1] + n[3] / 2, ny = n[2] + 0.35;
    s.addShape(pres.shapes.LINE, { x: Math.min(nx, hub.x), y: Math.min(ny, hub.y), w: Math.abs(nx - hub.x) || 0.01, h: Math.abs(ny - hub.y) || 0.01,
      line: { color: C.ai, width: 1.25 }, flipV: (nx - hub.x) * (ny - hub.y) < 0 });
  });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: hub.x - 0.75, y: hub.y - 0.45, w: 1.5, h: 0.9, rectRadius: 0.14, fill: { color: C.aiDeep }, line: { color: C.ai, width: 1.5 } });
  s.addText("RouteMind", { x: hub.x - 0.75, y: hub.y - 0.45, w: 1.5, h: 0.9, fontFace: F.head, fontSize: 16, bold: true, color: "FFFFFF", align: "center", valign: "middle", margin: 0, isTextBox: true });
  nodes.forEach((n) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: n[1], y: n[2], w: n[3], h: 0.7, rectRadius: 0.1, fill: { color: C.panel2 }, line: { color: C.line, width: 0.75 } });
    s.addText(n[0], { x: n[1], y: n[2], w: n[3], h: 0.7, fontFace: F.body, fontSize: 12, color: C.text, align: "center", valign: "middle", margin: 0.05, isTextBox: true });
  });

  // risk to fallback table
  const hdr = (t) => ({ text: t, options: { bold: true, color: C.bg, fill: { color: C.ai }, fontFace: F.head, fontSize: 13 } });
  const cell = (t, o = {}) => ({ text: t, options: { color: C.text, fill: { color: C.panel }, fontFace: F.body, fontSize: 12, ...o } });
  const rows = [
    [hdr("Risk"), hdr("Fallback")],
    [cell("Poor data quality", { bold: true }), cell("Validate addresses (Makani); dispatcher confirms flagged stops")],
    [cell("Driver adoption", { bold: true }), cell("Co-design with drivers; fair workload; accept, edit or reject any route")],
    [cell("Privacy (UAE PDPL)", { bold: true }), cell("Minimum personal data, consent; confirm details with legal counsel")],
    [cell("Model failure", { bold: true }), cell("Fall back to manual plan and historical ETAs")],
    [cell("Heat rules", { bold: true }), cell("Midday break 12:30 to 15:00, 15 Jun to 15 Sep, built into scheduling")],
  ];
  s.addTable(rows, { x: 6.35, y: 1.8, w: 6.38, colW: [1.75, 4.63], border: { type: "solid", pt: 0.75, color: C.line }, valign: "middle", margin: [0.07, 0.1, 0.07, 0.1] });
  card(pres, s, 6.35, 5.75, 6.38, 0.8, { fill: C.panel2, line: C.ai });
  s.addText("Human in control: the dispatcher can override any route; the manual plan is always the fallback.", { x: 6.55, y: 5.78, w: 6.0, h: 0.74, fontFace: F.body, fontSize: 14, color: C.text, margin: 0, valign: "middle", isTextBox: true });

  // GenAI marking: circle the integration diagram ONLY if GenAI generated it (delete these two lines if not)
  genaiCircle(pres, s, MX - 0.1, 1.7, 5.7, 4.95);
  genaiLegend(pres, s);
  source(s, "Sources: Makani (Dubai), UAE PDPL (Federal Decree-Law 45/2021), UAE midday break rule (docs/04_research_brief.md R13, R14, R19).");
  s.addNotes(notesFor(6));
};
