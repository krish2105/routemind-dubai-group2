/**
 * GenAI ops copilot: deterministic template fallback (owner: Advait).
 * Used when LLM_API_KEY is not set, when the LLM call fails, or when the LLM output fails the checks.
 * Inputs are synthetic order ids, a community name, times and a reason code only. No names, phones or addresses.
 * Every output is "AI-drafted, human to approve": nothing is sent automatically.
 * Arabic wording: Modern Standard Arabic, to be checked by a native speaker (record who checked in the PR).
 */

export const APPROVAL_LABEL = "AI-drafted, human to approve";

export const REASONS = ["traffic", "szr_jam", "al_khail_jam", "sandstorm", "rain", "high_volume", "vehicle_issue"] as const;
export type Reason = (typeof REASONS)[number];
export type Lang = "en" | "ar";

const REASON_TEXT: Record<Reason, Record<Lang, string>> = {
  traffic: { en: "heavy traffic", ar: "الازدحام المروري" },
  szr_jam: { en: "a traffic jam on Sheikh Zayed Road", ar: "ازدحام مروري على شارع الشيخ زايد" },
  al_khail_jam: { en: "a traffic jam on Al Khail Road", ar: "ازدحام مروري على شارع الخيل" },
  sandstorm: { en: "a sandstorm slowing traffic", ar: "عاصفة رملية أبطأت حركة السير" },
  rain: { en: "heavy rain on the roads", ar: "الأمطار الغزيرة على الطرق" },
  high_volume: { en: "a high number of orders today", ar: "ارتفاع عدد الطلبات اليوم" },
  vehicle_issue: { en: "a problem with the delivery vehicle", ar: "مشكلة في مركبة التوصيل" },
};

export const AREA_AR: Record<string, string> = {
  "Al Barsha": "البرشاء", "Al Karama": "الكرامة", "Al Nahda": "النهدة", "Al Quoz": "القوز", "Al Qusais": "القصيص",
  "Al Satwa": "السطوة", "Al Wasl": "الوصل", "Arabian Ranches": "المرابع العربية", "Bur Dubai": "بر دبي",
  "Business Bay": "الخليج التجاري", "City Walk": "سيتي ووك", "DIFC": "مركز دبي المالي العالمي", "Deira": "ديرة",
  "Discovery Gardens": "ديسكفري جاردنز", "Downtown Dubai": "وسط مدينة دبي", "Dubai Hills": "دبي هيلز",
  "Dubai Investment Park": "مجمع دبي للاستثمار", "Dubai Marina": "دبي مارينا", "Dubai Silicon Oasis": "واحة دبي للسيليكون",
  "Emirates Hills": "تلال الإمارات", "Festival City": "دبي فستيفال سيتي", "International City": "المدينة العالمية",
  "Jebel Ali": "جبل علي", "Jumeirah Lakes Towers": "أبراج بحيرات جميرا", "Jumeirah Village Circle": "قرية جميرا الدائرية",
  "Jumeirah": "جميرا", "Mirdif": "مردف", "Motor City": "موتور سيتي", "Nad Al Sheba": "ند الشبا", "Oud Metha": "عود ميثاء",
  "Palm Jumeirah": "نخلة جميرا", "Ras Al Khor": "رأس الخور", "Sports City": "مدينة دبي الرياضية", "The Springs": "الينابيع",
  "Umm Suqeim": "أم سقيم", "Warqa": "الورقاء",
};
export const AREAS = Object.keys(AREA_AR);

export interface DelayInput {
  orderId: string;
  area: string;
  /** planned arrival before the delay, "HH:MM" */
  oldEta: string;
  /** new estimated arrival, "HH:MM" */
  newEta: string;
  delayMin: number;
  reason: Reason;
}

export interface ShiftInput {
  /** label of the plan, e.g. "AI plan (Clarke-Wright + 2-opt)" */
  plan: string;
  orders: number;
  served: number;
  onTimePct: number;
  slaBreaches: number;
  atRisk: number;
  vehiclesUsed: number;
  km: number;
  co2Kg: number;
  events: Reason[];
  /** up to 5 synthetic order ids with community and slack (negative = late) */
  topRisks: { orderId: string; area: string; slackMin: number }[];
}

/** Customer delay message (deterministic). */
export function delayMessage(i: DelayInput, lang: Lang): string {
  const reason = REASON_TEXT[i.reason][lang];
  if (lang === "ar") {
    const area = AREA_AR[i.area] ?? i.area;
    return `مرحباً، معك DubaiDash Express. نعتذر، طلبك رقم ${i.orderId} إلى ${area} سيتأخر حوالي ${i.delayMin} دقيقة بسبب ${reason}. موعد الوصول المتوقع الجديد هو ${i.newEta} بدلاً من ${i.oldEta}. إذا كنت تفضّل موعداً آخر للتوصيل، يُرجى الرد على هذه الرسالة.`;
  }
  return `Hello from DubaiDash Express. Sorry, your order ${i.orderId} to ${i.area} is running about ${i.delayMin} minutes late because of ${reason}. The new estimated arrival is ${i.newEta} (planned ${i.oldEta}). If another delivery time suits you better, please reply to this message.`;
}

const n0 = (x: number) => Math.round(x).toLocaleString("en-US");
const n1 = (x: number) => (Math.round(x * 10) / 10).toFixed(1);

/** Dispatcher shift summary (deterministic). */
export function shiftSummary(s: ShiftInput, lang: Lang): string {
  const risks = s.topRisks.slice(0, 5);
  if (lang === "ar") {
    const ev = s.events.length ? s.events.map((e) => REASON_TEXT[e].ar).join("، ") : "لا توجد أحداث";
    const list = risks.length
      ? risks.map((r) => `${r.orderId} (${AREA_AR[r.area] ?? r.area}، ${r.slackMin < 0 ? `متأخر ${-Math.round(r.slackMin)} دقيقة` : `هامش ${Math.round(r.slackMin)} دقيقة`})`).join("، ")
      : "لا يوجد";
    return [
      `ملخص الوردية: ${s.plan}.`,
      `تم جدولة ${s.served} من ${s.orders} طلباً باستخدام ${s.vehiclesUsed} مركبة، بمسافة ${n0(s.km)} كم وانبعاثات ${n0(s.co2Kg)} كغ من ثاني أكسيد الكربون.`,
      `نسبة التسليم في الموعد ${n1(s.onTimePct)}٪، ومخالفات مستوى الخدمة ${s.slaBreaches}، والطلبات المعرّضة للخطر ${s.atRisk}.`,
      `الأحداث: ${ev}.`,
      `أولوية المتابعة: ${list}.`,
      "الإجراء المقترح: تواصل مع العملاء المتأخرين أولاً وراجع التوزيع قبل إرساله.",
    ].join("\n");
  }
  const ev = s.events.length ? s.events.map((e) => REASON_TEXT[e].en).join(", ") : "none";
  const list = risks.length
    ? risks.map((r) => `${r.orderId} (${r.area}, ${r.slackMin < 0 ? `${-Math.round(r.slackMin)} min late` : `${Math.round(r.slackMin)} min slack`})`).join("; ")
    : "none";
  return [
    `Shift summary: ${s.plan}.`,
    `${s.served} of ${s.orders} orders planned on ${s.vehiclesUsed} vehicles, ${n0(s.km)} km, ${n0(s.co2Kg)} kg CO2.`,
    `On-time ${n1(s.onTimePct)}%, SLA breaches ${s.slaBreaches}, at risk ${s.atRisk}.`,
    `Events: ${ev}.`,
    `Watch first: ${list}.`,
    "Suggested action: message the late customers first and review the plan before dispatch.",
  ].join("\n");
}
