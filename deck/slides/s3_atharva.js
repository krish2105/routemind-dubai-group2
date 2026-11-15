// SLIDE 3 | Owner: Atharva | The AI loop: predict, cluster, optimise, re-route, inform + ETA result.
const { C, F, W, MX, owner, card, genaiCircle, genaiLegend, source, title } = require("../theme");
const { fz } = require("../lib/frozen");
const { notesFor } = require("../lib/notes");

module.exports.build = function (pres) {
  const s = pres.addSlide({ masterName: "NIGHT" });
  title(s, "One AI loop: predict, cluster, optimise, re-route, inform");
  owner(s, "Slide 3 | Atharva");

  const steps = [
    ["1", "Predict", "Gradient-boosting ETA and delay model", C.ai],
    ["2", "Cluster", "k-means zones, micro-hubs, lockers", C.ai],
    ["3", "Optimise", "Clarke-Wright + 2-opt, genetic algorithm", C.ai],
    ["4", "Re-route", "Live re-plan on jam, storm, urgent order", C.ai],
    ["5", "Inform", "GenAI copilot: English and Arabic", C.base],
  ];
  const bw = 2.15, gap = 0.37, y = 1.95;
  steps.forEach((st, i) => {
    const x = MX + i * (bw + gap);
    card(pres, s, x, y, bw, 2.35);
    s.addShape(pres.shapes.OVAL, { x: x + 0.2, y: y + 0.2, w: 0.6, h: 0.6, fill: { color: st[3] }, line: { color: st[3], width: 0.5 } });
    s.addText(st[0], { x: x + 0.2, y: y + 0.2, w: 0.6, h: 0.6, fontFace: F.head, fontSize: 20, bold: true, color: C.bg, align: "center", valign: "middle", margin: 0, isTextBox: true });
    s.addText(st[1], { x: x + 0.2, y: y + 0.95, w: bw - 0.4, h: 0.4, fontFace: F.head, fontSize: 20, bold: true, color: C.white, margin: 0, isTextBox: true });
    s.addText(st[2], { x: x + 0.2, y: y + 1.4, w: bw - 0.4, h: 0.85, fontFace: F.body, fontSize: 13, color: C.muted, margin: 0, valign: "top", isTextBox: true });
    if (i < steps.length - 1) s.addText("\u2192", { x: x + bw + 0.04, y: y + 0.95, w: gap - 0.08, h: 0.4, fontFace: F.body, fontSize: 14, color: C.ai, align: "center", margin: 0, isTextBox: true });
  });
  // data in, decisions out
  s.addText("Data in: orders, traffic, weather, vehicle state", { x: MX, y: 4.45, w: 6, h: 0.3, fontFace: F.body, fontSize: 12, color: C.muted, margin: 0, isTextBox: true });
  s.addText("Decisions out: routes, ETAs, customer messages", { x: W - MX - 6, y: 4.45, w: 6, h: 0.3, fontFace: F.body, fontSize: 12, color: C.muted, align: "right", margin: 0, isTextBox: true });

  // ETA result
  card(pres, s, MX, 4.9, 6.1, 1.6, { line: C.ai });
  s.addText("ETA error (test data)", { x: MX + 0.25, y: 5.0, w: 3, h: 0.3, fontFace: F.body, fontSize: 12, color: C.muted, margin: 0, isTextBox: true });
  s.addText([
    { text: `${fz("eta_mae", " min")}`, options: { color: C.ai, bold: true } },
    { text: `   vs ${fz("eta_naive_mae", " min")} naive`, options: { color: C.muted, fontSize: 18 } },
  ], { x: MX + 0.25, y: 5.3, w: 5.6, h: 0.8, fontFace: F.head, fontSize: 36, margin: 0, valign: "middle", isTextBox: true });
  s.addText("Mean absolute error, held-out data", { x: MX + 0.25, y: 6.12, w: 5.6, h: 0.3, fontFace: F.body, fontSize: 12, color: C.muted, margin: 0, isTextBox: true });

  card(pres, s, 6.9, 4.9, 5.83, 1.6, { fill: C.panel2 });
  s.addText("Next step: reinforcement learning for urgent-order dispatch (one learning curve in our notebook).", { x: 7.1, y: 5.0, w: 5.45, h: 0.75, fontFace: F.body, fontSize: 14, color: C.text, margin: 0, valign: "top", isTextBox: true });
  s.addText("Caution: ETA training data is from Indian cities. It shows the method, not Dubai ground truth.", { x: 7.1, y: 5.75, w: 5.45, h: 0.65, fontFace: F.body, fontSize: 13, color: C.base, margin: 0, valign: "top", isTextBox: true });

  // GenAI marking: circle the workflow diagram ONLY if GenAI generated it (delete these two lines if not)
  genaiCircle(pres, s, MX - 0.12, 1.8, W - 2 * MX + 0.24, 2.65);
  genaiLegend(pres, s);
  source(s, "Methods: gradient boosting (XGBoost/LightGBM), k-means, Clarke-Wright savings, 2-opt, genetic algorithm (see docs/04_research_brief.md R9, R10).");
  s.addNotes(notesFor(3));
};
