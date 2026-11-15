import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * TODO (owner: Advait): GenAI ops copilot.
 * POST { orderId, delayMin, reason, lang: "en" | "ar" } -> { message, source: "llm" | "template" }
 * Rules: per-IP rate limit, token cap, works WITHOUT LLM_API_KEY (template fallback), never log personal data,
 * no personal data in prompts (synthetic IDs only).
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { orderId?: string; delayMin?: number; reason?: string; lang?: "en" | "ar" };
  const delay = Math.max(0, Math.round(body.delayMin ?? 20));
  const reason = body.reason ?? "traffic";
  const message = body.lang === "ar"
    ? `نعتذر عن التأخير. طلبك ${body.orderId ?? ""} سيصل متأخراً حوالي ${delay} دقيقة بسبب ${reason}.`
    : `Sorry for the delay. Your order ${body.orderId ?? ""} will arrive about ${delay} minutes late because of ${reason}.`;
  return NextResponse.json({ message, source: "template" });
}
