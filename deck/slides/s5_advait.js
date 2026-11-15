// SLIDE 5 | Owner: Advait | Operations impact: utilisation, CO2, on-time, SLA, fairness, GenAI message (EN/AR), revenue options.
// Numbers: only fz() from docs/frozen_results.json. The delay message is the copilot's template output
// (web/lib/copilot/templates.ts, order O042, illustrative times) and is circled in red as GenAI content.
const { C, F, MX, owner, card, stat, genaiCircle, genaiLegend, source, title } = require("../theme");
const { fz } = require("../lib/frozen");
const { notesFor } = require("../lib/notes");
const path = require("path");

const MSG_EN = "Hello from DubaiDash Express. Sorry, your order O042 to Dubai Marina is running about 25 minutes late because of a traffic jam on Sheikh Zayed Road. The new estimated arrival is 14:35 (planned 14:10).";
const MSG_AR = "مرحباً، معك DubaiDash Express. نعتذر، طلبك رقم O042 إلى دبي مارينا سيتأخر حوالي 25 دقيقة بسبب ازدحام مروري على شارع الشيخ زايد. موعد الوصول المتوقع الجديد هو 14:35 بدلاً من 14:10.";
// PowerPoint reorders the Latin order id inside RTL text (shows "042O"), so the Arabic line is a browser render
// of MSG_AR (Arial 14 pt, RTL, 3x scale, headless Edge) placed as an image with MSG_AR as alt text.
const MSG_AR_PNG = path.join(__dirname, "s5_advait_msg_ar.png");

module.exports.build = function (pres) {
  const s = pres.addSlide({ masterName: "NIGHT" });
  title(s, "Better routes lift utilisation, cut CO2 and protect SLAs");
  owner(s, "Slide 5 | Advait");

  // KPI tiles: baseline (amber) -> AI (teal), frozen numbers only
  const w = 2.9, h = 1.55, gap = 0.18, y = 1.5;
  stat(pres, s, MX, y, w, h, "Utilisation", `${fz("util_base", "%")} → ${fz("util_ai", "%")}`, C.ai, "van capacity used (baseline → AI)");
  stat(pres, s, MX + (w + gap), y, w, h, "CO2", `-${fz("co2_pct", "%")}`, C.ok, "fewer km, assumed kg/km");
  stat(pres, s, MX + 2 * (w + gap), y, w, h, "On-time", `${fz("ontime_base", "%")} → ${fz("ontime_ai", "%")}`, C.ai, "windows met (baseline → AI)");
  stat(pres, s, MX + 3 * (w + gap), y, w, h, "SLA breaches", `${fz("breaches_base")} → ${fz("breaches_ai")}`, C.risk, "late + unserved (proxy)");

  // left: fairness, heat rule, scale check, revenue
  const cy = 3.25, ch = 3.28;
  card(pres, s, MX, cy, 5.9, ch, { fill: C.panel2 });
  s.addText([
    { text: "Fair to drivers", options: { bold: true, color: C.white, breakLine: true } },
    { text: "Workload spread (coefficient of variation) is a KPI, so AI does not overload some drivers. Summer plans keep the 12:30-15:00 midday break for riders.", options: { color: C.text, breakLine: true } },
    { text: " ", options: { breakLine: true, fontSize: 6 } },
    { text: "Scale check", options: { bold: true, color: C.white, breakLine: true } },
    { text: "UPS reports about 100,000 t CO2 avoided a year with ORION routing.", options: { color: C.text, breakLine: true } },
    { text: " ", options: { breakLine: true, fontSize: 6 } },
    { text: "New revenue options", options: { bold: true, color: C.white, breakLine: true } },
    { text: "Paid delivery slots, parcel lockers, premium urgent delivery.", options: { color: C.text } },
  ], { x: MX + 0.25, y: cy + 0.12, w: 5.4, h: ch - 0.2, fontFace: F.body, fontSize: 14, margin: 0, valign: "top", isTextBox: true });

  // right: GenAI copilot delay message EN + AR (circled: GenAI output)
  const rx = 6.7, rw = 6.03;
  card(pres, s, rx, cy, rw, ch, { line: C.base });
  s.addText("GenAI copilot: delay message (AI-drafted, human to approve)", { x: rx + 0.25, y: cy + 0.1, w: rw - 0.5, h: 0.3, fontFace: F.body, fontSize: 12, bold: true, color: C.base, margin: 0, isTextBox: true });
  s.addText(MSG_EN, { x: rx + 0.25, y: cy + 0.45, w: rw - 0.5, h: 1.3, fontFace: F.body, fontSize: 14, color: C.text, margin: 0, valign: "top", isTextBox: true });
  s.addImage({ path: MSG_AR_PNG, x: rx + 0.25, y: cy + 1.85, w: rw - 0.5, h: (rw - 0.5) * (288 / 1593), altText: MSG_AR });
  genaiCircle(pres, s, rx - 0.1, cy - 0.1, rw + 0.2, ch + 0.2);
  genaiLegend(pres, s);
  source(s, "Simulated results on seed 2611, assumed data and CO2 factors. UPS ORION figure is UPS-reported (research brief R4). Heat rule: R14. Message: copilot template example.");
  s.addNotes(notesFor(5));
};
