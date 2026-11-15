import { AREAS, REASONS, type DelayInput, type Lang, type Reason, type ShiftInput } from "./templates";

/**
 * Strict allow-list validation for /api/copilot (owner: Advait).
 * Only known keys with known shapes pass, so no free text (names, phones, addresses) can reach a prompt or a log.
 */
export type CopilotRequest =
  | { kind: "delay"; langs: Lang[]; input: DelayInput }
  | { kind: "summary"; langs: Lang[]; input: ShiftInput };

type Result = { ok: true; value: CopilotRequest } | { ok: false; error: string };

const ORDER_ID = /^[OU]\d{3}$/;
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const isObj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === "object" && !Array.isArray(x);
const num = (x: unknown, min: number, max: number) => typeof x === "number" && Number.isFinite(x) && x >= min && x <= max;
const onlyKeys = (o: Record<string, unknown>, keys: string[]) => Object.keys(o).every((k) => keys.includes(k));
const isReason = (x: unknown): x is Reason => typeof x === "string" && (REASONS as readonly string[]).includes(x);
const isArea = (x: unknown): x is string => typeof x === "string" && AREAS.includes(x);

function langs(x: unknown): Lang[] | null {
  if (x === "en" || x === "ar") return [x];
  if (x === "both" || x === undefined) return ["en", "ar"];
  return null;
}

export function validateCopilot(body: unknown): Result {
  if (!isObj(body)) return { ok: false, error: "body must be a JSON object" };
  if (!onlyKeys(body, ["kind", "lang", "input"])) return { ok: false, error: "unknown top-level field" };
  const l = langs(body.lang);
  if (!l) return { ok: false, error: "lang must be en, ar or both" };
  const i = body.input;
  if (!isObj(i)) return { ok: false, error: "input must be an object" };

  if (body.kind === "delay") {
    if (!onlyKeys(i, ["orderId", "area", "oldEta", "newEta", "delayMin", "reason"])) return { ok: false, error: "unknown input field" };
    if (typeof i.orderId !== "string" || !ORDER_ID.test(i.orderId)) return { ok: false, error: "orderId must look like O123 or U001" };
    if (!isArea(i.area)) return { ok: false, error: "area must be a known Dubai community" };
    if (typeof i.oldEta !== "string" || !HHMM.test(i.oldEta) || typeof i.newEta !== "string" || !HHMM.test(i.newEta)) return { ok: false, error: "oldEta/newEta must be HH:MM" };
    if (!num(i.delayMin, 1, 240) || !Number.isInteger(i.delayMin)) return { ok: false, error: "delayMin must be an integer 1 to 240" };
    if (!isReason(i.reason)) return { ok: false, error: "unknown reason" };
    return { ok: true, value: { kind: "delay", langs: l, input: { orderId: i.orderId, area: i.area, oldEta: i.oldEta, newEta: i.newEta, delayMin: i.delayMin as number, reason: i.reason } } };
  }

  if (body.kind === "summary") {
    const keys = ["plan", "orders", "served", "onTimePct", "slaBreaches", "atRisk", "vehiclesUsed", "km", "co2Kg", "events", "topRisks"];
    if (!onlyKeys(i, keys)) return { ok: false, error: "unknown input field" };
    if (typeof i.plan !== "string" || !/^[A-Za-z0-9 +()\-.,]{1,60}$/.test(i.plan)) return { ok: false, error: "plan label invalid" };
    for (const k of ["orders", "served", "slaBreaches", "atRisk", "vehiclesUsed"]) if (!num(i[k], 0, 10000) || !Number.isInteger(i[k])) return { ok: false, error: `${k} must be an integer` };
    for (const k of ["onTimePct"]) if (!num(i[k], 0, 100)) return { ok: false, error: `${k} must be 0 to 100` };
    for (const k of ["km", "co2Kg"]) if (!num(i[k], 0, 1e6)) return { ok: false, error: `${k} out of range` };
    if (!Array.isArray(i.events) || i.events.length > 5 || !i.events.every(isReason)) return { ok: false, error: "events invalid" };
    if (!Array.isArray(i.topRisks) || i.topRisks.length > 5) return { ok: false, error: "topRisks invalid" };
    const risks: ShiftInput["topRisks"] = [];
    for (const r of i.topRisks) {
      if (!isObj(r) || !onlyKeys(r, ["orderId", "area", "slackMin"]) || typeof r.orderId !== "string" || !ORDER_ID.test(r.orderId) || !isArea(r.area) || !num(r.slackMin, -600, 600)) return { ok: false, error: "topRisks item invalid" };
      risks.push({ orderId: r.orderId, area: r.area, slackMin: r.slackMin as number });
    }
    return {
      ok: true,
      value: {
        kind: "summary", langs: l,
        input: {
          plan: i.plan, orders: i.orders as number, served: i.served as number, onTimePct: i.onTimePct as number, slaBreaches: i.slaBreaches as number,
          atRisk: i.atRisk as number, vehiclesUsed: i.vehiclesUsed as number, km: i.km as number, co2Kg: i.co2Kg as number, events: i.events as Reason[], topRisks: risks,
        },
      },
    };
  }
  return { ok: false, error: "kind must be delay or summary" };
}
