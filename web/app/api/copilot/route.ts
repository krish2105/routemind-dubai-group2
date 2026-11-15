import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { APPROVAL_LABEL, delayMessage, shiftSummary, type Lang } from "@/lib/copilot/templates";
import { validateCopilot, type CopilotRequest } from "@/lib/copilot/validate";
import { createRateLimiter } from "@/lib/copilot/rateLimit";
import { draftWithLlm, LLM_MODEL } from "@/lib/copilot/llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GenAI ops copilot (owner: Advait).
 * POST { kind: "delay" | "summary", lang?: "en" | "ar" | "both", input: {...} }
 *   delay   input: { orderId, area, oldEta, newEta, delayMin, reason }
 *   summary input: { plan, orders, served, onTimePct, slaBreaches, atRisk, vehiclesUsed, km, co2Kg, events, topRisks }
 * -> 200 { drafts: { en?, ar? }, source: "llm" | "template", label: "AI-drafted, human to approve", model? }
 * Works WITHOUT LLM_API_KEY (deterministic templates). Never logs or stores request text. 20 requests/min per client.
 */
const allow = createRateLimiter(20, 60_000);
const MAX_BODY = 4096;

function templates(req: CopilotRequest): Partial<Record<Lang, string>> {
  return Object.fromEntries(req.langs.map((l) => [l, req.kind === "delay" ? delayMessage(req.input, l) : shiftSummary(req.input, l)]));
}

export async function POST(request: Request) {
  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
  const key = createHash("sha256").update(ip).digest("hex").slice(0, 16);
  if (!allow(key)) return NextResponse.json({ error: "Too many requests, try again in a minute." }, { status: 429, headers: { "retry-after": "60" } });

  const raw = await request.text().catch(() => "");
  if (raw.length > MAX_BODY) return NextResponse.json({ error: "Request too large." }, { status: 413 });
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Body must be JSON." }, { status: 400 });
  }
  const v = validateCopilot(body);
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });

  const apiKey = process.env.LLM_API_KEY;
  if (apiKey) {
    const drafts = await draftWithLlm(v.value, apiKey);
    if (drafts) return NextResponse.json({ drafts, source: "llm", model: LLM_MODEL, label: APPROVAL_LABEL }, { headers: { "cache-control": "no-store" } });
  }
  return NextResponse.json({ drafts: templates(v.value), source: "template", label: APPROVAL_LABEL }, { headers: { "cache-control": "no-store" } });
}
