// SLIDE 1 | Owner: Gagandeep | Headline result, problem / solution / ask, live demo QR, four C-suite angles.
// Numbers come only from docs/frozen_results.json (fz). Text blocks drafted with GenAI carry the red outline.
const { C, F, MX, owner, card, stat, genaiCircle, genaiLegend, source, title } = require("../theme");
const { fz, data } = require("../lib/frozen");
const { notesFor } = require("../lib/notes");

const frozen = (k) => data[k] !== null && data[k] !== undefined;
/** "-12.3%" once frozen, a plain em dash before (never "-—"). */
const minus = (k) => (frozen(k) ? `-${fz(k, "%")}` : "—");

module.exports.build = function (pres, ctx) {
  const s = pres.addSlide({ masterName: "NIGHT" });
  const pct = frozen("cost_pct") ? `${data.cost_pct}%` : "[cost_pct]%";
  title(s, `AI routing cuts DubaiDash's cost per parcel by ${pct}, and we ask for a 90-day pilot`);
  owner(s, "Slide 1 | Gagandeep");

  // 1. headline proof: four simulated KPIs, baseline and AI on the same seeded orders
  const y = 1.7, w = 2.883, h = 1.85, gap = 0.2;
  stat(pres, s, MX, y, w, h, "Cost per parcel", minus("cost_pct"), C.aiDeep, "AI vs baseline, simulated");
  stat(pres, s, MX + (w + gap), y, w, h, "Fewer vans", fz("vans_fewer"), C.aiDeep, "same seeded orders");
  stat(pres, s, MX + 2 * (w + gap), y, w, h, "Distance", minus("km_pct"), C.aiDeep, "total km driven");
  stat(pres, s, MX + 3 * (w + gap), y, w, h, "On time", fz("ontime_ai", "%"), C.ok, `baseline ${fz("ontime_base", "%")}`);

  // 2. problem, solution, ask (the ask is the hero line)
  const by = 3.78, bh = 1.32, bw = 8.5;
  card(pres, s, MX, by, bw, bh);
  const rows = [
    ["PROBLEM", C.muted, "Last mile is about 53% of total shipping cost, worldwide.", C.text, false],
    ["SOLUTION", C.aiDeep, "RouteMind Dubai: one AI loop to predict, cluster, optimise, re-route, inform.", C.text, false],
    ["THE ASK", C.aiDeep, "Approve a 90-day pilot with go / no-go gates.", C.white, true],
  ];
  rows.forEach(([label, lc, text, tc, bold], i) => {
    const ry = by + 0.14 + i * 0.36;
    s.addText(label, { x: MX + 0.25, y: ry, w: 1.2, h: 0.34, fontFace: F.body, fontSize: 12, bold: true, color: lc, charSpacing: 1, valign: "middle", margin: 0, isTextBox: true });
    s.addText(text, { x: MX + 1.45, y: ry, w: bw - 1.65, h: 0.34, fontFace: F.body, fontSize: 15, bold, color: tc, valign: "middle", margin: 0, fit: "shrink", isTextBox: true });
  });

  // 3. live demo: QR to the Vercel prototype
  const qx = MX + bw + 0.25, qw = 12.733 - qx;
  card(pres, s, qx, by, qw, bh, { line: C.ai });
  if (ctx.qr) s.addImage({ data: ctx.qr, x: qx + 0.14, y: by + 0.13, w: 1.06, h: 1.06 });
  s.addText([
    { text: "Live prototype", options: { bold: true, color: C.white, fontSize: 15, breakLine: true } },
    { text: "Scan to try it", options: { color: C.muted, fontSize: 12, breakLine: true } },
    { text: (ctx.liveLink || "link after Vercel deploy").replace(/^https:\/\//, ""), options: { color: C.aiDeep, fontSize: 12 } },
  ], { x: qx + 1.32, y: by + 0.1, w: qw - 1.42, h: bh - 0.2, fontFace: F.body, valign: "middle", margin: 0, isTextBox: true });

  // 4. four C-suite angles, one line each
  const angles = [
    ["Business model", "Lockers, delivery slots, premium urgent delivery"],
    ["Tech investment", `Pilot ${fz("pilot_cost", "", "AED ")} (assumed)`],
    ["Ecosystem", "TMS/WMS, Makani addresses, EVs, robots"],
    ["Operational risk", "Human override and manual fallback"],
  ];
  const ay = 5.32, aw = 2.9, ah = 1.2;
  angles.forEach((a, i) => {
    const x = MX + i * (aw + 0.177);
    card(pres, s, x, ay, aw, ah, { fill: C.panel2 });
    s.addText(a[0], { x: x + 0.2, y: ay + 0.1, w: aw - 0.4, h: 0.36, fontFace: F.head, fontSize: 15, bold: true, color: C.aiDeep, margin: 0, isTextBox: true });
    s.addText(a[1], { x: x + 0.2, y: ay + 0.48, w: aw - 0.4, h: 0.64, fontFace: F.body, fontSize: 14, color: C.text, margin: 0, valign: "top", isTextBox: true });
  });

  // GenAI disclosure (course slide 54): the problem/solution/ask wording and the four angle lines were drafted with GenAI.
  genaiCircle(pres, s, MX - 0.08, by - 0.08, bw + 0.16, bh + 0.16);
  genaiCircle(pres, s, MX - 0.08, ay - 0.08, 12.133 + 0.16, ah + 0.16);
  genaiLegend(pres, s);

  source(s, "Source: Statista (Feb 2024), worldwide. DubaiDash Express is fictional: company inputs assumed, results simulated (baseline and AI on identical seeded orders).");
  s.addNotes(notesFor(1));
};
