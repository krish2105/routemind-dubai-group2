// SLIDE 4 | Owner: Krishna | Live demo slide: screenshot, baseline vs AI, jam moment, honesty footnotes.
const { C, F, W, MX, owner, card, genaiCircle, genaiLegend, source, title } = require("../theme");
const { fz } = require("../lib/frozen");
const { notesFor } = require("../lib/notes");

module.exports.build = function (pres, ctx) {
  const s = pres.addSlide({ masterName: "NIGHT" });
  title(s, `Live demo: same Dubai orders, ${fz("km_pct", "%", "", "X%")} fewer km and ${fz("vans_fewer", "", "", "X")} fewer vans`);
  owner(s, "Slide 4 | Krishna");

  // left: dashboard screenshot (deliverables/screenshots/01_command.png) or a clear placeholder
  const shot = ctx.shot("01_command.png");
  if (shot) s.addImage({ path: shot, x: MX, y: 1.8, w: 7.6, h: 4.75, sizing: { type: "contain", w: 7.6, h: 4.75 } });
  else {
    card(pres, s, MX, 1.8, 7.6, 4.75, { line: C.base });
    s.addText("Insert dashboard screenshot here\n(deliverables/screenshots/01_command.png)", { x: MX, y: 1.8, w: 7.6, h: 4.75, fontFace: F.body, fontSize: 18, color: C.base, align: "center", valign: "middle", isTextBox: true });
  }
  // GenAI marking: the prototype was built with AI assistance
  genaiCircle(pres, s, MX - 0.1, 1.7, 7.8, 4.95);
  genaiLegend(pres, s);

  // right: baseline vs AI
  const x = 8.5, w = 4.23;
  card(pres, s, x, 1.8, w, 1.7);
  s.addText("BASELINE vs AI (simulated)", { x: x + 0.2, y: 1.9, w: w - 0.4, h: 0.3, fontFace: F.body, fontSize: 11, color: C.muted, charSpacing: 2, margin: 0, isTextBox: true });
  s.addText([{ text: "Cost per parcel  ", options: { color: C.text, fontSize: 14 } }, { text: `-${fz("cost_pct", "%")}`, options: { color: C.ai, bold: true, fontSize: 30 } }],
    { x: x + 0.2, y: 2.25, w: w - 0.4, h: 0.55, fontFace: F.head, margin: 0, valign: "middle", isTextBox: true });
  s.addText([{ text: "On-time  ", options: { color: C.text, fontSize: 14 } }, { text: `${fz("ontime_base", "%")} → ${fz("ontime_ai", "%")}`, options: { color: C.ok, bold: true, fontSize: 24 } }],
    { x: x + 0.2, y: 2.85, w: w - 0.4, h: 0.5, fontFace: F.head, margin: 0, valign: "middle", isTextBox: true });

  card(pres, s, x, 3.65, w, 1.75, { line: C.risk });
  s.addText("LIVE EVENT: SHEIKH ZAYED ROAD JAM, 13:00", { x: x + 0.2, y: 3.75, w: w - 0.4, h: 0.3, fontFace: F.body, fontSize: 11, color: C.risk, charSpacing: 1, margin: 0, isTextBox: true });
  s.addText([{ text: "At-risk deliveries  ", options: { color: C.text, fontSize: 14 } }, { text: `${fz("risk_before")} → ${fz("risk_after")}`, options: { color: C.ai, bold: true, fontSize: 30 } }],
    { x: x + 0.2, y: 4.1, w: w - 0.4, h: 0.65, fontFace: F.head, margin: 0, valign: "middle", isTextBox: true });
  s.addText("Before vs after one-click re-routing", { x: x + 0.2, y: 4.85, w: w - 0.4, h: 0.4, fontFace: F.body, fontSize: 12, color: C.muted, margin: 0, isTextBox: true });

  card(pres, s, x, 5.55, w, 1.0, { fill: C.panel2 });
  s.addText("Simulated results. Baseline is an assumed nearest-neighbour method. A dispatcher can override any route.", { x: x + 0.2, y: 5.6, w: w - 0.4, h: 0.9, fontFace: F.body, fontSize: 12, color: C.text, margin: 0, valign: "middle", isTextBox: true });
  source(s, "Prototype built with AI assistance (Claude Code); prompts shared separately. All data synthetic or assumed.");
  s.addNotes(notesFor(4));
};
