// Reads docs/frozen_results.json. null = not frozen yet (shown as an em dash; --strict build refuses to continue).
const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "..", "..", "docs", "frozen_results.json");
const data = JSON.parse(fs.readFileSync(FILE, "utf8"));

const REQUIRED = ["cost_pct","km_pct","vans_fewer","risk_before","risk_after","util_base","util_ai","co2_pct",
  "ontime_base","ontime_ai","breaches_base","breaches_ai","eta_mae","eta_naive_mae","pilot_cost","payback_months","payback_half"];

function fz(key, suffix = "", prefix = "", fallback = "\u2014") {
  const v = data[key];
  if (v === null || v === undefined) return "—";
  const n = typeof v === "number" && Math.abs(v) >= 10000 ? v.toLocaleString("en-US") : v;
  return `${prefix}${n}${suffix}`;
}
const missing = () => REQUIRED.filter((k) => data[k] === null || data[k] === undefined);
module.exports = { fz, data, missing, REQUIRED };
