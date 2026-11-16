// SLIDE 7 | Owner: Harsh | Closing slide: 3-phase rollout (Pilot -> Day-90 gate -> Scale -> Optimise), money, gates, the ask.
// Every number comes from docs/frozen_results.json through fz() (written by web/scripts/freeze.ts). Same phases, gates and ask
// as /business-case (web/components/roi/PilotRoadmap.tsx). Body text 14 pt or larger; labels 11 pt; footnote 10 pt.
// GenAI marking: the roadmap strip and this layout were drafted with Claude Code (prompts in docs/prompt_logs/Harsh.md).
const { C, F, W, MX, owner, card, genaiCircle, genaiLegend, source, title } = require("../theme");
const { fz, data } = require("../lib/frozen");
const { notesFor } = require("../lib/notes");

const T = (s, text, o) => s.addText(text, { fontFace: F.body, fontSize: 14, color: C.text, margin: 0, isTextBox: true, ...o });
const LABEL = { fontSize: 11, color: C.muted, charSpacing: 2 };

module.exports.build = function (pres) {
  const s = pres.addSlide({ masterName: "NIGHT" });
  title(s, `A capped ${fz("pilot_cost", "", "AED ")} pilot\ntests a ${fz("payback_months", "-month")} payback before we scale`);
  owner(s, "Slide 7 | Harsh");

  // ---- row 1: the 3-phase rollout (Pilot -> gate -> Scale -> Optimise) ----
  const y1 = 1.68, h1 = 1.62;
  const pilotW = 5.55, gateW = 1.35, laterW = 2.2, arrowW = 0.27;
  let x = MX;
  card(pres, s, x, y1, pilotW, h1, { line: C.ai });
  T(s, "1  PILOT · 90 DAYS · ONE HUB", { x: x + 0.2, y: y1 + 0.1, w: pilotW - 0.4, h: 0.3, ...LABEL, color: C.aiDeep, bold: true });
  const steps = [["Days 0-30", "Connect"], ["Days 31-60", "Shadow"], ["Days 61-90", "Live, one zone"]];
  const sw = (pilotW - 0.4) / 3;
  steps.forEach(([d, name], i) => {
    const sx = x + 0.2 + i * sw;
    T(s, d, { x: sx, y: y1 + 0.5, w: sw - 0.1, h: 0.28, ...LABEL, charSpacing: 0 });
    T(s, name, { x: sx, y: y1 + 0.78, w: sw - 0.1, h: 0.4, fontFace: F.head, fontSize: 18, bold: true, color: C.white });
  });
  T(s, "beside today's dispatchers, with a control zone", { x: x + 0.2, y: y1 + 1.2, w: pilotW - 0.4, h: 0.3, color: C.muted });
  x += pilotW;
  const arrow = () => { T(s, "▸", { x, y: y1, w: arrowW, h: h1, fontSize: 18, color: C.ai, align: "center", valign: "middle" }); x += arrowW; };
  arrow();
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: y1 + 0.12, w: gateW, h: h1 - 0.24, rectRadius: 0.12, fill: { color: C.panel2 }, line: { color: C.ai, width: 1.5, dashType: "dash" } });
  T(s, "◆", { x, y: y1 + 0.22, w: gateW, h: 0.35, fontSize: 18, color: C.ai, align: "center" });
  T(s, "DAY-90 GATE", { x, y: y1 + 0.6, w: gateW, h: 0.3, fontSize: 12, bold: true, color: C.white, align: "center" });
  T(s, "go · fix · stop", { x, y: y1 + 0.92, w: gateW, h: 0.3, color: C.muted, align: "center" });
  x += gateW;
  arrow();
  [["2  SCALE", "All zones, then other hubs"], ["3  OPTIMISE", "RL dispatch, lockers, EVs"]].forEach(([head, text], i) => {
    card(pres, s, x, y1, laterW, h1);
    T(s, head, { x: x + 0.18, y: y1 + 0.1, w: laterW - 0.36, h: 0.3, ...LABEL, bold: true });
    T(s, text, { x: x + 0.18, y: y1 + 0.5, w: laterW - 0.36, h: 0.95, fontSize: 16, color: C.white, valign: "top" });
    x += laterW;
    if (i === 0) arrow();
  });
  genaiCircle(pres, s, MX - 0.1, y1 - 0.1, W - 2 * MX + 0.2, h1 + 0.2);

  // ---- row 2: the money (four tiles) ----
  const y2 = 3.52, h2 = 1.5, tw = 2.88, tg = (W - 2 * MX - 4 * tw) / 3;
  const tiles = [
    ["PILOT, ALL-IN", fz("pilot_cost", "", "AED "), C.white, "assumed; most we can lose"],
    ["PAYBACK", fz("payback_months", " months"), C.ai, `after roll-out, ${fz("share_kept_pct", "%")} counted`],
    ["AT HALF THE SAVINGS", fz("payback_half", " months"), C.white, "too slow, so we gate"],
    ["DAY-90 COST GATE", `≥ ${fz("gate_cost_pct", "%")}`, C.ai, "real cut needed to scale"],
  ];
  tiles.forEach(([label, value, color, caption], i) => {
    const tx = MX + i * (tw + tg);
    card(pres, s, tx, y2, tw, h2);
    T(s, label, { x: tx + 0.2, y: y2 + 0.13, w: tw - 0.4, h: 0.28, ...LABEL });
    T(s, value, { x: tx + 0.2, y: y2 + 0.43, w: tw - 0.4, h: 0.6, fontFace: F.head, fontSize: 30, bold: true, color, valign: "middle" });
    T(s, caption, { x: tx + 0.2, y: y2 + 1.07, w: tw - 0.4, h: 0.3, color: C.muted });
  });

  // ---- row 3: gates + benchmark, and the ask ----
  const y3 = 5.22, h3 = 1.38, gw = 7.85;
  card(pres, s, MX, y3, gw, h3, { fill: C.panel2 });
  T(s, [
    { text: "Scale only if all five gates pass: ", options: { bold: true, color: C.white } },
    { text: `cost per parcel down ≥ ${fz("gate_cost_pct", "%")} · km down · on-time up · ≥ 70% of AI routes used · zero safety or privacy incidents`, options: { color: C.text, breakLine: true } },
    { text: `Benchmark: McKinsey sees 5 to 20% lower logistics costs with AI in distribution; we count ${fz("saving_pct_kept", "%")}, inside that range.`, options: { color: C.muted } },
  ], { x: MX + 0.22, y: y3 + 0.1, w: gw - 0.44, h: h3 - 0.2, valign: "middle", paraSpaceAfter: 6 });
  const ax = MX + gw + 0.2, aw = W - MX - ax;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: ax, y: y3, w: aw, h: h3, rectRadius: 0.12, fill: { color: C.aiDeep }, line: { color: C.aiDeep, width: 0.5 } });
  T(s, "TODAY WE ASK", { x: ax + 0.22, y: y3 + 0.12, w: aw - 0.44, h: 0.28, ...LABEL, color: C.bg, bold: true });
  T(s, "1  Approve the pilot\n2  Name a sponsor\n3  Gate review on 1 Mar 2027", { x: ax + 0.22, y: y3 + 0.42, w: aw - 0.44, h: 0.88, fontFace: F.head, fontSize: 16, bold: true, color: C.bg, valign: "top" });

  genaiLegend(pres, s);
  source(s, `Simulated on seed 2611 with assumed costs; simple payback from roll-out at ${data.parcels_per_day == null ? "\u2014" : Number(data.parcels_per_day).toLocaleString("en-US")} parcels a day, no discounting. McKinsey Distribution blog, Nov 2024 (research brief R7). 70% acceptance: proposed target.`);
  s.addNotes(notesFor(7));
};
