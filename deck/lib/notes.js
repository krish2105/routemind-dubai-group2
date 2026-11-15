// Builds speaker notes for a slide from scripts/speaker_scripts.md (same text as the speaker PDFs).
const fs = require("fs");
const path = require("path");
const { data } = require("./frozen");

const FILE = path.join(__dirname, "..", "..", "scripts", "speaker_scripts.md");

function load() {
  const lines = fs.readFileSync(FILE, "utf8").split(/\r?\n/);
  const slides = {};
  let cur = null;
  for (const line of lines) {
    const m = line.match(/^##\s+SLIDE\s+(\d+)\s*\|\s*([^|]+)\|\s*(\d+)\s*\|\s*(.+)$/);
    if (m) { cur = slides[m[1]] = { n: +m[1], who: m[2].trim(), secs: +m[3], title: m[4].trim(), lines: [], notes: [] }; continue; }
    if (!cur || !line.trim()) continue;
    if (line.startsWith(">")) cur.notes.push(line.replace(/^>\s*(Delivery:\s*)?/, "").trim());
    else cur.lines.push(line.trim());
  }
  return slides;
}
const SLIDES = load();

function fill(s) {
  return s.replace(/\{\{(\w+)\}\}/g, (_, k) => (data[k] === null || data[k] === undefined ? `[${k}]` : String(data[k])));
}

/** Notes text shown in PowerPoint presenter view. */
function notesFor(n) {
  const s = SLIDES[n];
  if (!s) throw new Error(`No script for slide ${n} in scripts/speaker_scripts.md`);
  const body = s.lines.map((l) => fill(l).replace(/\[CUE:\s*([^\]]+)\]/g, "(ACTION: $1)").replace(/\[PAUSE\]/g, "(pause)")).join("\n\n");
  const head = `SPEAKER: ${s.who}   TARGET TIME: ${Math.floor(s.secs / 60)}:${String(s.secs % 60).padStart(2, "0")}`;
  const tip = s.notes.length ? `\n\nDELIVERY TIP: ${s.notes.join(" ")}` : "";
  return `${head}\n\n${body}${tip}`;
}
module.exports = { notesFor, SLIDES };
