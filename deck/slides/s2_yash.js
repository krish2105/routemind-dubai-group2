// SLIDE 2 | Owner: Yash | The problem and market: last mile cost share, UAE e-commerce, Dubai pain points.
const { C, F, W, MX, owner, card, source, title } = require("../theme");
const { notesFor } = require("../lib/notes");

module.exports.build = function (pres) {
  const s = pres.addSlide({ masterName: "NIGHT" });
  title(s, "The last mile is 53% of shipping cost, and Dubai makes it harder");
  owner(s, "Slide 2 | Yash");

  // native chart: share of total shipping cost (Statista, worldwide) - research brief R1
  card(pres, s, MX, 1.8, 5.6, 4.7);
  s.addText("Last-mile share of total shipping cost (worldwide)", { x: MX + 0.25, y: 1.9, w: 5.1, h: 0.4, fontFace: F.body, fontSize: 14, bold: true, color: C.white, margin: 0, isTextBox: true });
  s.addChart(pres.charts.BAR, [{ name: "Share of shipping cost", labels: ["2018", "2023"], values: [41, 53] }], {
    x: MX + 0.2, y: 2.35, w: 5.2, h: 4.0, barDir: "col", chartColors: [C.base, C.ai], varyColors: true,
    showValue: true, dataLabelFormatCode: '0"%"', dataLabelColor: C.white, dataLabelFontSize: 20, dataLabelFontBold: true, dataLabelPosition: "outEnd",
    catAxisLabelColor: C.muted, catAxisLabelFontSize: 14, catAxisLabelFontFace: F.body,
    valAxisHidden: true, valAxisMinVal: 0, valAxisMaxVal: 65, valGridLine: { style: "none" }, catGridLine: { style: "none" },
    showLegend: false, barGapWidthPct: 60,
  });

  // UAE context
  card(pres, s, 6.45, 1.8, 3.0, 2.2);
  s.addText("AED 42.2B", { x: 6.65, y: 1.95, w: 2.6, h: 0.8, fontFace: F.head, fontSize: 34, bold: true, color: C.ai, margin: 0, isTextBox: true });
  s.addText("UAE e-commerce in 2025, about 15.7% of all retail", { x: 6.65, y: 2.8, w: 2.6, h: 1.1, fontFace: F.body, fontSize: 14, color: C.text, margin: 0, valign: "top", isTextBox: true });
  card(pres, s, 9.6, 1.8, 3.13, 2.2);
  s.addText("Static", { x: 9.8, y: 1.95, w: 2.8, h: 0.8, fontFace: F.head, fontSize: 34, bold: true, color: C.base, margin: 0, isTextBox: true });
  s.addText("DubaiDash today: routes planned once each morning, rarely changed", { x: 9.8, y: 2.8, w: 2.75, h: 1.1, fontFace: F.body, fontSize: 14, color: C.text, margin: 0, valign: "top", isTextBox: true });

  // Dubai pain points
  const pain = [
    ["Traffic by the hour", "Sheikh Zayed Road, Al Khail Road"],
    ["Heat, rain, sandstorms", "Slower vans, riders at risk"],
    ["Addresses and access", "Gated areas, not at home, failed first attempts"],
    ["Urgent-order surges", "Same-day promises are hard to keep"],
  ];
  pain.forEach((p, i) => {
    const x = 6.45 + (i % 2) * 3.15, y = 4.2 + Math.floor(i / 2) * 1.2;
    card(pres, s, x, y, 3.0, 1.08, { fill: C.panel2 });
    s.addText(p[0], { x: x + 0.18, y: y + 0.1, w: 2.65, h: 0.35, fontFace: F.head, fontSize: 14, bold: true, color: C.white, margin: 0, isTextBox: true });
    s.addText(p[1], { x: x + 0.18, y: y + 0.47, w: 2.65, h: 0.55, fontFace: F.body, fontSize: 12, color: C.muted, margin: 0, valign: "top", isTextBox: true });
  });
  source(s, "Sources: Statista (Feb 2024), worldwide figure; UAE e-commerce 2025 market figures (see docs/04_research_brief.md R1, R2).");
  s.addNotes(notesFor(2));
};
