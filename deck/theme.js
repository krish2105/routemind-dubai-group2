// Shared look for all 7 slides (LIGHT "daylight dispatch" theme, same as the dashboard).
const C = {
  bg: "F5F8FC", panel: "FFFFFF", panel2: "EAF1F8", line: "CBD8E6",
  ai: "0891B2", aiDeep: "0E7490", base: "D97706", risk: "DC2626", ok: "059669",
  text: "1E293B", white: "0B1B2E" /* headline ink (navy). Name kept for compatibility: never use real white text */, muted: "475569", red: "FF0000",
};
const F = { head: "Calibri", body: "Calibri", mono: "Courier New" };
const W = 13.333, H = 7.5, MX = 0.6;

function defineMaster(pres) {
  pres.defineSlideMaster({
    title: "NIGHT",
    background: { color: C.bg },
    objects: [
      { text: { text: "Group 2 | AI in Operations (MAIB AI 218) | RouteMind Dubai | All data simulated or assumed",
        options: { x: MX, y: 7.08, w: 9.5, h: 0.3, fontFace: F.body, fontSize: 10, color: C.muted, margin: 0 } } },
      { placeholder: { options: { name: "title", type: "title", x: MX, y: 0.4, w: W - 2 * MX, h: 1.15, fontFace: F.head, fontSize: 30, bold: true, color: C.white, valign: "top", align: "left", margin: 0 }, text: "" } },
    ],
    slideNumber: { x: 12.2, y: 7.08, w: 0.6, h: 0.3, fontFace: F.body, fontSize: 10, color: C.muted, align: "right" },
  });
}

function owner(slide, name) {
  slide.addText(name, { x: W - MX - 3, y: 0.12, w: 3, h: 0.28, fontFace: F.body, fontSize: 10, color: C.muted, align: "right", margin: 0, isTextBox: true });
}

function card(pres, slide, x, y, w, h, opts = {}) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.12, fill: { color: opts.fill || C.panel }, line: { color: opts.line || C.line, width: 0.75 } });
}

/** Big number tile: label on top, number, small caption. */
function stat(pres, slide, x, y, w, h, label, value, color, caption) {
  card(pres, slide, x, y, w, h);
  slide.addText(label.toUpperCase(), { x: x + 0.2, y: y + 0.15, w: w - 0.4, h: 0.3, fontFace: F.body, fontSize: 11, color: C.muted, margin: 0, charSpacing: 2, isTextBox: true });
  slide.addText(value, { x: x + 0.2, y: y + 0.45, w: w - 0.4, h: h - 0.95, fontFace: F.head, fontSize: 40, bold: true, color, margin: 0, valign: "middle", isTextBox: true });
  if (caption) slide.addText(caption, { x: x + 0.2, y: y + h - 0.45, w: w - 0.4, h: 0.3, fontFace: F.body, fontSize: 11, color: C.muted, margin: 0, isTextBox: true });
}

/** Red oval outline = "this is GenAI-generated" (course rule on slide 54). */
function genaiCircle(pres, slide, x, y, w, h) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: Math.min(w, h) / 6, fill: { color: C.red, transparency: 100 }, line: { color: C.red, width: 3 } });
}
function genaiLegend(pres, slide) {
  slide.addShape(pres.shapes.OVAL, { x: 9.55, y: 7.12, w: 0.28, h: 0.2, fill: { color: C.red, transparency: 100 }, line: { color: C.red, width: 1.75 } });
  slide.addText("Red circle = GenAI-assisted", { x: 9.9, y: 7.07, w: 2.2, h: 0.3, fontFace: F.body, fontSize: 10, color: C.red, margin: 0, isTextBox: true });
}
function source(slide, text) {
  slide.addText(text, { x: MX, y: 6.7, w: W - 2 * MX, h: 0.32, fontFace: F.body, fontSize: 10, color: C.muted, margin: 0, isTextBox: true });
}
function title(slide, text) { slide.addText(text, { placeholder: "title" }); }

module.exports = { C, F, W, H, MX, defineMaster, owner, card, stat, genaiCircle, genaiLegend, source, title };
