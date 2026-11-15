// SLIDE 2 | Owner: Yash | One message: the last mile is big, and Dubai makes it harder.
// Facts only from verified rows of docs/04_research_brief.md (R1, R2, R3, R14; fact-check log in docs/verification_log.md).
// Body text >= 14 pt; footnote 10 pt. Light theme colours from ../theme.
const { C, F, MX, owner, card, genaiCircle, genaiLegend, source, title } = require("../theme");
const { notesFor } = require("../lib/notes");

module.exports.build = function (pres) {
  const s = pres.addSlide({ masterName: "NIGHT" });
  title(s, "The last mile is 53% of shipping cost, and Dubai makes it harder");
  owner(s, "Slide 2 | Yash");

  // LEFT: the one visual. Last-mile share of total shipping cost, worldwide (R1, Statista Feb 2024)
  card(pres, s, MX, 1.75, 5.6, 4.8);
  s.addText("Last-mile share of total shipping cost (worldwide)", { x: MX + 0.25, y: 1.88, w: 5.1, h: 0.4, fontFace: F.body, fontSize: 16, bold: true, color: C.white, margin: 0, isTextBox: true });
  s.addChart(pres.charts.BAR, [{ name: "Share of shipping cost", labels: ["2018", "2023"], values: [41, 53] }], {
    x: MX + 0.2, y: 2.3, w: 5.2, h: 3.55, barDir: "col", chartColors: [C.base, C.ai], varyColors: true,
    showValue: true, dataLabelFormatCode: '0"%"', dataLabelColor: C.white, dataLabelFontSize: 24, dataLabelFontBold: true, dataLabelPosition: "outEnd",
    catAxisLabelColor: C.muted, catAxisLabelFontSize: 16, catAxisLabelFontFace: F.body,
    valAxisHidden: true, valAxisMinVal: 0, valAxisMaxVal: 65, valGridLine: { style: "none" }, catGridLine: { style: "none" },
    showLegend: false, barGapWidthPct: 60,
  });
  s.addText("More than half of the delivery bill is the final trip to the door.", { x: MX + 0.25, y: 5.9, w: 5.1, h: 0.55, fontFace: F.body, fontSize: 14, color: C.text, margin: 0, valign: "top", isTextBox: true });

  // RIGHT TOP: market growth (R2) and today's planning (assumed, fictional DubaiDash)
  card(pres, s, 6.45, 1.75, 3.05, 2.05);
  s.addText("AED 42.2B", { x: 6.65, y: 1.88, w: 2.7, h: 0.7, fontFace: F.head, fontSize: 32, bold: true, color: C.ai, margin: 0, isTextBox: true });
  s.addText("UAE e-commerce in 2025, about 15.7% of retail, up from AED 17.6B in 2020", { x: 6.65, y: 2.6, w: 2.7, h: 1.1, fontFace: F.body, fontSize: 14, color: C.text, margin: 0, valign: "top", isTextBox: true });
  card(pres, s, 9.68, 1.75, 3.05, 2.05);
  s.addText("Static", { x: 9.88, y: 1.88, w: 2.7, h: 0.7, fontFace: F.head, fontSize: 32, bold: true, color: C.base, margin: 0, isTextBox: true });
  s.addText("DubaiDash today (assumed): routes planned once each morning, rarely changed", { x: 9.88, y: 2.6, w: 2.7, h: 1.1, fontFace: F.body, fontSize: 14, color: C.text, margin: 0, valign: "top", isTextBox: true });

  // RIGHT BOTTOM: why Dubai is harder (facts R3, R14; corridor traffic and weather are what-if scenarios)
  const pain = [
    ["Traffic by the hour", "Sheikh Zayed Rd, Al Khail Rd"],
    ["Heat, rain, sandstorms", "Midday break 12:30 to 15:00 in summer"],
    ["Addresses and access", "Towers, gated areas: failed first attempts"],
    ["Urgent-order surges", "Same-day promises mid-shift"],
  ];
  pain.forEach((p, i) => {
    const x = 6.45 + (i % 2) * 3.23, y = 4.0 + Math.floor(i / 2) * 1.3;
    card(pres, s, x, y, 3.05, 1.18, { fill: C.panel2 });
    s.addText(p[0], { x: x + 0.18, y: y + 0.1, w: 2.75, h: 0.36, fontFace: F.head, fontSize: 15, bold: true, color: C.white, margin: 0, isTextBox: true });
    s.addText(p[1], { x: x + 0.18, y: y + 0.48, w: 2.75, h: 0.62, fontFace: F.body, fontSize: 14, color: C.text, margin: 0, valign: "top", isTextBox: true });
  });

  // GenAI marking: the pain-point wording was drafted with GenAI (Claude Code); facts and numbers come from the research brief
  genaiCircle(pres, s, 6.37, 3.92, 6.44, 2.68);
  genaiLegend(pres, s);
  source(s, "Sources: Statista, Feb 2024 (worldwide); Gulf Today / WAM, Sep 2026 (UAE e-commerce); Khaleej Times (midday break). Traffic and weather are what-if scenarios. DubaiDash is fictional.");
  s.addNotes(notesFor(2));
};
