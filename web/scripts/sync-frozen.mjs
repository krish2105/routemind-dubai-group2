// Copies docs/frozen_results.json into web/public/data so the deployed site shows the frozen numbers.
// Run from web/:  npm run sync:frozen   (Krishna, Monday 18:00 after numbers are frozen)
import { copyFileSync } from "node:fs";
copyFileSync(new URL("../../docs/frozen_results.json", import.meta.url), new URL("../public/data/frozen_results.json", import.meta.url));
console.log("synced docs/frozen_results.json -> web/public/data/frozen_results.json");
