// Builds deliverables/RouteMind_Dubai_Group2.pptx (exactly 7 slides, speaker notes on every slide).
//   node build_deck.js            draft build (missing numbers show as an em dash)
//   node build_deck.js --strict   final build: refuses to run if any number in docs/frozen_results.json is null
const fs = require("fs");
const path = require("path");
const pptxgen = require("pptxgenjs");
const QRCode = require("qrcode");
const { W, defineMaster } = require("./theme");
const { missing } = require("./lib/frozen");

const ROOT = path.join(__dirname, "..");
const strict = process.argv.includes("--strict");

(async () => {
  const gaps = missing();
  if (gaps.length && strict) {
    console.error(`STRICT: ${gaps.length} numbers not frozen: ${gaps.join(", ")}. Freeze docs/frozen_results.json first.`);
    process.exit(1);
  }
  if (gaps.length) console.warn(`DRAFT: ${gaps.length} numbers not frozen yet (shown as em dash): ${gaps.join(", ")}`);

  const linkFile = path.join(ROOT, "docs", "live_link.txt");
  const liveLink = fs.existsSync(linkFile) ? fs.readFileSync(linkFile, "utf8").trim() : "";
  if (strict && !/^https:\/\/\S+$/.test(liveLink)) {
    console.error("STRICT: docs/live_link.txt must contain the real https Vercel URL (Krishna creates it after the first deploy).");
    process.exit(1);
  }
  const qr = liveLink ? await QRCode.toDataURL(liveLink, { margin: 1, width: 300, color: { dark: "#04080F", light: "#FFFFFF" } }) : null;
  const shot = (name) => { const p = path.join(ROOT, "deliverables", "screenshots", name); return fs.existsSync(p) ? p : null; };

  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5 in
  pres.title = "RouteMind Dubai: AI in Logistics & Route Optimization";
  pres.author = "Group 2, AI in Operations (MAIB AI 218), SP Jain Dubai";
  pres.subject = "Implementing AI for Supply Chain Optimization";
  pres.theme = { headFontFace: "Calibri", bodyFontFace: "Calibri" };
  defineMaster(pres);

  const ctx = { liveLink, qr, shot };
  const files = ["s1_gagandeep", "s2_yash", "s3_atharva", "s4_krishna", "s5_advait", "s6_karan", "s7_harsh"];
  files.forEach((f) => require(`./slides/${f}`).build(pres, ctx));

  const out = path.join(ROOT, "deliverables", "RouteMind_Dubai_Group2.pptx");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await pres.writeFile({ fileName: out });
  // remove empty folder entries from the zip (some cloud viewers dislike them)
  try { require("child_process").execSync(`zip -dq "${out}" "*/"`, { stdio: "ignore" }); } catch (e) { /* zip missing or nothing to remove */ }
  console.log(`wrote ${out} (${files.length} slides)`);
  if (files.length !== 7) { console.error("ERROR: the course limit is exactly 7 slides"); process.exit(1); }
})();
