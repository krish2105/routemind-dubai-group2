import type { CopilotRequest } from "./validate";
import type { Lang } from "./templates";

/**
 * Optional LLM path for the copilot (owner: Advait). Only runs when LLM_API_KEY is set (Anthropic Messages API).
 * Raw HTTP on purpose: adding the SDK would be a package.json contract change.
 * Any error, timeout, refusal or failed output check returns null -> the route uses the template fallback.
 * The request body holds only validated synthetic fields (order id, community, times, reason code, aggregate KPIs).
 */

const SYSTEM = [
  "You draft short operational messages for DubaiDash Express, a fictional Dubai courier, in a university demo.",
  "Rules: use ONLY the facts in the JSON input. Never invent times, numbers, order ids, places, names or causes.",
  "Never promise refunds, compensation, discounts or a guaranteed time. No personal data. No emojis. No links.",
  "Customer delay message: polite, under 60 words, apologise once, give the new estimated arrival and the planned time, invite a reply to change the delivery time.",
  "Dispatcher shift summary: 4 to 6 short lines with the KPIs given, the events, the orders to watch first, one suggested action.",
  "Arabic: clear Modern Standard Arabic suitable for UAE customers; keep order ids and HH:MM times exactly as given in Latin digits.",
  "A human dispatcher reviews every draft before anything is sent.",
].join("\n");

export const LLM_MODEL = process.env.LLM_MODEL || "claude-opus-5-5";

export async function draftWithLlm(req: CopilotRequest, apiKey: string, timeoutMs = 9000): Promise<Partial<Record<Lang, string>> | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const task = req.kind === "delay" ? "Write the customer delay message" : "Write the dispatcher shift summary";
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2026-10-21",
        "anthropic-beta": "server-side-fallback-2026-07-01",
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        max_tokens: 2000,
        output_config: {
          effort: "low",
          format: {
            type: "json_schema",
            schema: {
              type: "object",
              properties: Object.fromEntries(req.langs.map((l) => [l, { type: "string" }])),
              required: req.langs,
              additionalProperties: false,
            },
          },
        },
        fallbacks: "default",
        system: SYSTEM,
        messages: [{ role: "user", content: `${task} in: ${req.langs.join(" and ")}. Return JSON with one key per language.\nInput: ${JSON.stringify(req.input)}` }],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { stop_reason?: string; content?: { type: string; text?: string }[] };
    if (data.stop_reason !== "end_turn") return null; // refusal, max_tokens, etc.
    const text = (data.content ?? []).filter((b) => b.type === "text").map((b) => b.text ?? "").join("");
    const parsed = JSON.parse(text) as Record<string, unknown>;
    const out: Partial<Record<Lang, string>> = {};
    for (const l of req.langs) {
      const v = parsed[l];
      if (typeof v !== "string" || !passesChecks(req, v)) return null;
      out[l] = v.trim();
    }
    return out;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Guard rails on LLM output: must mention the order id and the new time; no extra times; no money promises; length cap. */
export function passesChecks(req: CopilotRequest, text: string): boolean {
  if (text.length < 20 || text.length > 1200) return false;
  if (/refund|compensat|discount|voucher|AED|درهم|تعويض|استرداد|خصم/i.test(text)) return false;
  if (/\{[^}]*\}/.test(text)) return false;
  if (req.kind === "delay") {
    const i = req.input;
    if (!text.includes(i.orderId) || !text.includes(i.newEta)) return false;
    const times = text.match(/\b\d{1,2}:\d{2}\b/g) ?? [];
    if (times.some((t) => t !== i.newEta && t !== i.oldEta)) return false;
  }
  return true;
}
