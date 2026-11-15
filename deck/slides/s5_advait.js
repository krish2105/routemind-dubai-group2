// SLIDE 5 | Owner: Advait | Operations impact: utilisation, CO2, on-time, SLA, fairness, GenAI message, revenue options.
const { C, F, W, MX, owner, card, stat, genaiCircle, genaiLegend, source, title } = require("../theme");
const { fz } = require("../lib/frozen");
const { notesFor } = require("../lib/notes");

module.exports.build = function (pres) {
  const s = pres.addSlide({ masterName: "NIGHT" });
  title(s, "Better routes lift utilisation, cut CO2 and protect SLAs");
  owner(s, "Slide 5 | Advait");

  const w = 2.9, h = 1.75, gap = 0.18, y = 1.8;
  stat(pres, s, MX, y, w, h, "Utilisation", `${fz("util_base", "%")} → ${fz("util_ai", "%")}`, C.ai, "capacity used, fewer vans");
  stat(pres, s, MX + (w + gap), y, w, h, "CO2", `-${fz("co2_pct", "%")}`, C.ok, "fewer km (assumed factors)");
  stat(pres, s, MX + 2 * (w + gap), y, w, h, "On-time", `${fz("ontime_base", "%")} → ${fz("ontime_ai", "%")}`, C.ai, "delivery windows met");
  stat(pres, s, MX + 3 * (w + gap), y, w, h, "SLA breaches", `${fz("breaches_base")} → ${fz("breaches_ai")}`, C.ai, "proxy for satisfaction");

  // left: fairness + scale check + revenue
  card(pres, s, MX, 3.75, 5.9, 2.8, { fill: C.panel2 });
  s.addText([
    { text: "Fair to drivers", options: { bold: true, color: C.white, breakLine: true } },
    { text: "We measure workload spread (coefficient of variation), so AI does not overload some drivers.", options: { color: C.text, breakLine: true } },
    { text: " ", options: { breakLine: true, fontSize: 6 } },
    { text: "Scale check", options: { bold: true, color: C.white, breakLine: true } },
    { text: "UPS reports about 100,000 t CO2 avoided a year with ORION routing.", options: { color: C.text, breakLine: true } },
    { text: " ", options: { breakLine: true, fontSize: 6 } },
    { text: "New revenue options", options: { bold: true, color: C.white, breakLine: true } },
    { text: "Paid delivery slots, parcel lockers, premium urgent delivery.", options: { color: C.text } },
  ], { x: MX + 0.25, y: 3.85, w: 5.4, h: 2.6, fontFace: F.body, fontSize: 14, margin: 0, valign: "top", isTextBox: true });

  // right: GenAI customer message (circled: it is GenAI output)
  card(pres, s, 6.7, 3.75, 6.03, 2.8, { line: C.base });
  s.addText("GenAI copilot: delay message (example)", { x: 6.95, y: 3.85, w: 5.5, h: 0.3, fontFace: F.body, fontSize: 12, color: C.base, margin: 0, isTextBox: true });
  s.addText("Sorry for the delay. Your order O142 will arrive about 25 minutes late because of heavy traffic on Sheikh Zayed Road. New arrival: 14:10.",
    { x: 6.95, y: 4.2, w: 5.55, h: 1.05, fontFace: F.body, fontSize: 14, color: C.text, margin: 0, valign: "top", isTextBox: true });
  s.addText("نعتذر عن التأخير. سيصل طلبك O142 متأخراً حوالي 25 دقيقة بسبب ازدحام طريق الشيخ زايد.",
    { x: 6.95, y: 5.3, w: 5.55, h: 1.05, fontFace: "Arial", fontSize: 14, color: C.text, margin: 0, valign: "top", align: "right", rtlMode: true, isTextBox: true });
  genaiCircle(pres, s, 6.6, 3.65, 6.25, 3.0);
  genaiLegend(pres, s);
  source(s, "Simulated results, assumed CO2 factors. UPS ORION figure as reported by UPS (docs/04_research_brief.md R4). Delay message is an illustrative example.");
  s.addNotes(notesFor(5));
};
