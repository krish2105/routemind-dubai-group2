// SLIDE 1 | Owner: Gagandeep | Hook, solution in one line, headline result, the ask, four C-suite angles.
const { C, F, W, MX, owner, card, stat, source, title } = require("../theme");
const { fz } = require("../lib/frozen");
const { notesFor } = require("../lib/notes");

module.exports.build = function (pres, ctx) {
  const s = pres.addSlide({ masterName: "NIGHT" });
  title(s, `AI routing cuts DubaiDash's cost per parcel by ${fz("cost_pct", "%", "", "X%")}, and we ask for a 90-day pilot`);
  owner(s, "Slide 1 | Gagandeep");

  // headline stats (simulated, same orders)
  const y = 1.85, w = 2.883, h = 1.9, gap = 0.2;
  stat(pres, s, MX, y, w, h, "Cost per parcel", `-${fz("cost_pct", "%")}`, C.ai, "simulated, same orders");
  stat(pres, s, MX + (w + gap), y, w, h, "Fewer vans", fz("vans_fewer"), C.ai, "same 300 orders");
  stat(pres, s, MX + 2 * (w + gap), y, w, h, "Distance", `-${fz("km_pct", "%")}`, C.ai, "total km driven");
  stat(pres, s, MX + 3 * (w + gap), y, w, h, "On-time", fz("ontime_ai", "%"), C.ok, `baseline ${fz("ontime_base", "%")}`);

  // one-line story
  card(pres, s, MX, 4.0, 8.5, 1.05);
  s.addText([
    { text: "Last mile is the biggest slice of shipping cost (about 53%, worldwide). ", options: { color: C.text } },
    { text: "RouteMind Dubai", options: { color: C.ai, bold: true } },
    { text: " is one AI loop: predict, cluster, optimise, re-route, inform.", options: { color: C.text } },
  ], { x: MX + 0.25, y: 4.05, w: 8.0, h: 0.95, fontFace: F.body, fontSize: 16, valign: "middle", margin: 0, isTextBox: true });

  // QR + link
  card(pres, s, 9.35, 4.0, 3.38, 1.05, { line: C.ai });
  if (ctx.qr) s.addImage({ data: ctx.qr, x: 9.5, y: 4.08, w: 0.9, h: 0.9 });
  s.addText([
    { text: "Live prototype", options: { bold: true, color: C.white, breakLine: true } },
    { text: ctx.liveLink || "link after Vercel deploy", options: { color: C.ai, fontSize: 11 } },
  ], { x: 10.5, y: 4.08, w: 2.15, h: 0.9, fontFace: F.body, fontSize: 13, valign: "middle", margin: 0, isTextBox: true });

  // four C-suite angles
  const angles = [
    ["Business model", "Lockers, delivery slots, premium urgent"],
    ["Tech investment", `Pilot ${fz("pilot_cost", "", "AED ")} (assumed)`],
    ["Ecosystem", "TMS/WMS, Makani, EV, robots"],
    ["Operational risk", "Human override and fallbacks"],
  ];
  const aw = 2.9;
  angles.forEach((a, i) => {
    const x = MX + i * (aw + 0.17);
    card(pres, s, x, 5.3, aw, 1.2, { fill: C.panel2 });
    s.addText(a[0], { x: x + 0.2, y: 5.4, w: aw - 0.4, h: 0.35, fontFace: F.head, fontSize: 15, bold: true, color: C.ai, margin: 0, isTextBox: true });
    s.addText(a[1], { x: x + 0.2, y: 5.78, w: aw - 0.4, h: 0.62, fontFace: F.body, fontSize: 14, color: C.text, margin: 0, valign: "top", isTextBox: true });
  });
  source(s, "Statista (Feb 2024), worldwide. Company and results: fictional DubaiDash Express, assumed inputs, simulated results.");
  s.addNotes(notesFor(1));
};
