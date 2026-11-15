import { afterEach, describe, expect, it, vi } from "vitest";
import { APPROVAL_LABEL, AREAS, delayMessage, REASONS, shiftSummary, type DelayInput, type ShiftInput } from "@/lib/copilot/templates";
import { validateCopilot } from "@/lib/copilot/validate";
import { createRateLimiter } from "@/lib/copilot/rateLimit";
import { passesChecks } from "@/lib/copilot/llm";
import { POINT_POOL } from "@/lib/engine/points";
import { POST } from "@/app/api/copilot/route";

const delay: DelayInput = { orderId: "O042", area: "Dubai Marina", oldEta: "14:10", newEta: "14:35", delayMin: 25, reason: "szr_jam" };
const shift: ShiftInput = {
  plan: "AI plan (Clarke-Wright + 2-opt)", orders: 300, served: 300, onTimePct: 98.3, slaBreaches: 5, atRisk: 12,
  vehiclesUsed: 18, km: 1234.5, co2Kg: 210.2, events: ["szr_jam"], topRisks: [{ orderId: "O101", area: "Deira", slackMin: -7 }],
};
const post = (body: unknown, ip = "10.0.0.1") =>
  POST(new Request("http://localhost/api/copilot", { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": ip }, body: JSON.stringify(body) }));

describe("copilot templates (fallback)", () => {
  it("EN and AR delay messages contain the order id and both times, no placeholders", () => {
    for (const lang of ["en", "ar"] as const) {
      const m = delayMessage(delay, lang);
      expect(m).toContain("O042");
      expect(m).toContain("14:35");
      expect(m).toContain("14:10");
      expect(m).toContain("25");
      expect(m).not.toMatch(/\{|\}|undefined|NaN/);
    }
    expect(delayMessage(delay, "ar")).toMatch(/[؀-ۿ]/); // Arabic script
    expect(delayMessage(delay, "ar")).toContain("دبي مارينا");
  });

  it("every reason and every engine community has EN and AR text", () => {
    for (const reason of REASONS) for (const lang of ["en", "ar"] as const) expect(delayMessage({ ...delay, reason }, lang)).not.toMatch(/undefined/);
    for (const p of POINT_POOL) expect(AREAS).toContain(p.name);
  });

  it("is deterministic and never promises compensation", () => {
    expect(delayMessage(delay, "en")).toBe(delayMessage(delay, "en"));
    for (const lang of ["en", "ar"] as const) {
      expect(delayMessage(delay, lang)).not.toMatch(/refund|compensat|discount|voucher|تعويض|خصم/i);
      expect(shiftSummary(shift, lang)).not.toMatch(/\{|\}|undefined|NaN/);
    }
    expect(shiftSummary(shift, "en")).toContain("O101");
    expect(shiftSummary(shift, "en")).toContain("98.3%");
    expect(shiftSummary(shift, "ar")).toContain("O101");
  });
});

describe("copilot validation (no personal data can pass)", () => {
  it("accepts a clean delay request", () => {
    expect(validateCopilot({ kind: "delay", lang: "both", input: delay }).ok).toBe(true);
  });
  it("rejects extra fields such as a customer name or phone", () => {
    expect(validateCopilot({ kind: "delay", input: { ...delay, customerName: "x" } }).ok).toBe(false);
    expect(validateCopilot({ kind: "delay", input: delay, phone: "050" }).ok).toBe(false);
  });
  it("rejects bad ids, times, areas and reasons", () => {
    expect(validateCopilot({ kind: "delay", input: { ...delay, orderId: "Ahmed" } }).ok).toBe(false);
    expect(validateCopilot({ kind: "delay", input: { ...delay, newEta: "25:00" } }).ok).toBe(false);
    expect(validateCopilot({ kind: "delay", input: { ...delay, area: "Villa 12, Street 4" } }).ok).toBe(false);
    expect(validateCopilot({ kind: "delay", input: { ...delay, reason: "free text" } }).ok).toBe(false);
    expect(validateCopilot({ kind: "summary", input: { ...shift, topRisks: [{ orderId: "O1", area: "Deira", slackMin: 1 }] } }).ok).toBe(false);
  });
});

describe("LLM output checks", () => {
  const req = validateCopilot({ kind: "delay", input: delay });
  if (!req.ok) throw new Error("setup");
  it("passes a faithful message and rejects invented times or compensation", () => {
    expect(passesChecks(req.value, "Sorry, order O042 will now arrive at 14:35 instead of 14:10.")).toBe(true);
    expect(passesChecks(req.value, "Sorry, order O042 will now arrive at 14:35 or maybe 15:00.")).toBe(false);
    expect(passesChecks(req.value, "Sorry, order O042 arrives 14:35, here is a 10 AED voucher.")).toBe(false);
    expect(passesChecks(req.value, "Sorry for the delay, it arrives soon at 14:35.")).toBe(false);
  });
});

describe("POST /api/copilot", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("returns 200 with template drafts and the approval label when no API key is set", async () => {
    vi.stubEnv("LLM_API_KEY", "");
    const res = await post({ kind: "delay", lang: "both", input: delay });
    expect(res.status).toBe(200);
    const j = (await res.json()) as { drafts: { en: string; ar: string }; source: string; label: string };
    expect(j.source).toBe("template");
    expect(j.label).toBe(APPROVAL_LABEL);
    expect(j.drafts.en).toContain("O042");
    expect(j.drafts.ar).toContain("14:35");
  });

  it("summary request works too", async () => {
    vi.stubEnv("LLM_API_KEY", "");
    const res = await post({ kind: "summary", lang: "en", input: shift }, "10.0.0.2");
    expect(res.status).toBe(200);
    expect(((await res.json()) as { drafts: { en: string } }).drafts.en).toContain("Shift summary");
  });

  it("falls back to the template when the LLM call fails", async () => {
    vi.stubEnv("LLM_API_KEY", "test-key");
    const spy = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));
    const res = await post({ kind: "delay", lang: "en", input: delay }, "10.0.0.3");
    expect(res.status).toBe(200);
    expect(((await res.json()) as { source: string }).source).toBe("template");
    spy.mockRestore();
  });

  it("rejects invalid input with 400 and malformed JSON with 400", async () => {
    expect((await post({ kind: "delay", input: { ...delay, orderId: "bad" } }, "10.0.0.4")).status).toBe(400);
    const bad = await POST(new Request("http://localhost/api/copilot", { method: "POST", headers: { "x-forwarded-for": "10.0.0.4" }, body: "{not json" }));
    expect(bad.status).toBe(400);
  });

  it("rate limits a client after 20 requests a minute", async () => {
    vi.stubEnv("LLM_API_KEY", "");
    let last = 200;
    for (let i = 0; i < 21; i++) last = (await post({ kind: "delay", lang: "en", input: delay }, "10.9.9.9")).status;
    expect(last).toBe(429);
    const allow = createRateLimiter(2, 1000);
    expect([allow("a", 0), allow("a", 1), allow("a", 2), allow("a", 1500)]).toEqual([true, true, false, true]);
  });
});
