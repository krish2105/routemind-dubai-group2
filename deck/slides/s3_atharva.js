// SLIDE 3 | Owner: Atharva | The AI loop: predict, cluster, optimise, re-route, inform + ETA result.
const { C, F, W, MX, owner, card, genaiCircle, genaiLegend, source, title } = require("../theme");
const { fz, data } = require("../lib/frozen");
const { notesFor } = require("../lib/notes");

const T = (s, text, o) => s.addText(text, { fontFace: F.body, fontSize: 14, color: C.text, margin: 0, isTextBox: true, ...o });

module.exports.build = function (pres) {
  const s = pres.addSlide({ masterName: "NIGHT" });
  title(s, "One AI loop: predict, cluster, optimise, re-route, inform");
  owner(s, "Slide 3 | Atharva");

  const steps = [
    ["1", "Predict", "LightGBM model: delivery time and delay risk", C.ai],
    ["2", "Cluster", "k-means zones, micro-hubs, lockers", C.ai],
    ["3", "Optimise", "Clarke-Wright + 2-opt, genetic algorithm", C.ai],
    ["4", "Re-route", "Live re-plan on jam, storm, urgent order", C.ai],
    ["5", "Inform", "GenAI copilot: English and Arabic", C.base],
  ];
  const bw = 2.15, gap = 0.37, y = 1.72;
  steps.forEach((st, i) => {
    const x = MX + i * (bw + gap);
    card(pres, s, x, y, bw, 2.3);
    s.addShape(pres.shapes.OVAL, { x: x + 0.2, y: y + 0.2, w: 0.6, h: 0.6, fill: { color: st[3] }, line: { color: st[3], width: 0.5 } });
    T(s, st[0], { x: x + 0.2, y: y + 0.2, w: 0.6, h: 0.6, fontFace: F.head, fontSize: 20, bold: true, color: C.panel, align: "center", valign: "middle" });
    T(s, st[1], { x: x + 0.2, y: y + 0.95, w: bw - 0.4, h: 0.4, fontFace: F.head, fontSize: 20, bold: true, color: C.white });
    T(s, st[2], { x: x + 0.2, y: y + 1.4, w: bw - 0.35, h: 0.85, color: C.muted, valign: "top" });
    if (i < steps.length - 1) T(s, "→", { x: x + bw + 0.04, y: y + 0.95, w: gap - 0.08, h: 0.4, fontSize: 18, color: C.ai, align: "center" });
  });
  T(s, "Data in: orders, traffic, weather, vehicle state", { x: MX, y: 4.24, w: 6, h: 0.3, color: C.muted });
  T(s, "Decisions out: routes, ETAs, customer messages", { x: W - MX - 6, y: 4.24, w: 6, h: 0.3, color: C.muted, align: "right" });

  // ETA result: model vs naive rule, numbers only from docs/frozen_results.json
  card(pres, s, MX, 4.7, 6.1, 1.8, { line: C.ai });
  T(s, "ETA error on held-out test deliveries", { x: MX + 0.25, y: 4.82, w: 5.6, h: 0.3, color: C.muted });
  T(s, [
    { text: fz("eta_mae", " min"), options: { color: C.ai, bold: true } },
    { text: `   vs ${fz("eta_naive_mae", " min")} naive rule`, options: { color: C.base, fontSize: 20 } },
  ], { x: MX + 0.25, y: 5.15, w: 5.6, h: 0.8, fontFace: F.head, fontSize: 36, valign: "middle" });
  const gain = data.eta_mae != null && data.eta_naive_mae != null
    ? `${Math.round((1 - data.eta_mae / data.eta_naive_mae) * 100)}% lower error. ` : "";
  T(s, `${gain}Mean absolute error; naive = median time per 2 km.`, { x: MX + 0.25, y: 6.0, w: 5.6, h: 0.4, color: C.muted });

  card(pres, s, 6.9, 4.7, 5.83, 1.8, { fill: C.panel2 });
  T(s, "Next step: reinforcement learning for urgent-order dispatch (learning curve in our notebook).", { x: 7.1, y: 4.84, w: 5.45, h: 0.7, valign: "top" });
  T(s, "Caution: the ETA model learned from Indian delivery data. It proves the method, not Dubai ground truth.", { x: 7.1, y: 5.62, w: 5.45, h: 0.75, color: C.base, valign: "top" });

  // GenAI marking: the loop diagram and this slide's layout were drafted with Claude Code (prompts in docs/prompt_logs/Atharva.md)
  genaiCircle(pres, s, MX - 0.12, 1.6, W - 2 * MX + 0.24, 2.54);
  genaiLegend(pres, s);
  source(s, "ETA data: Kaggle Amazon Delivery Dataset (MIT licence), Indian cities, 2022; DubaiDash data simulated. Methods: LightGBM, k-means, Clarke-Wright, 2-opt, GA (research brief R9, R10).");
  s.addNotes(notesFor(3));
};
