import { QBANK } from "./catalog";

export const QUESTION_FIELDS = [
  { id: "why_offer", field: "whyOffer" },
  { id: "why_filter", field: "whyFilter" },
  { id: "why_dish", field: "whyDish" },
  { id: "why_rest", field: "whyRest" },
  { id: "app_gap", field: "appGap" },
  { id: "missing_dish", field: "missingDish" },
  { id: "missing_action", field: "missingAction" },
  { id: "why_item", field: "whyItem" },
  { id: "why_bill", field: "whyBill" },
  { id: "why_delivery", field: "whyDelivery" },
  { id: "rapido_link_trust", field: "rapidoLinkTrust" },
  { id: "meal_slot", field: "mealSlot" },
] as const;

export type QuestionId = (typeof QUESTION_FIELDS)[number]["id"];
export type QuestionField = (typeof QUESTION_FIELDS)[number]["field"];

const FIELD_BY_ID = Object.fromEntries(
  QUESTION_FIELDS.map((item) => [item.id, item.field]),
) as Record<QuestionId, QuestionField>;

export function isQuestionId(id: string): id is QuestionId {
  return id in FIELD_BY_ID;
}

export function questionField(id: QuestionId): QuestionField {
  return FIELD_BY_ID[id];
}

export type AnswerVisit = {
  dish?: string;
  restaurantName?: string;
  deliveryId?: string;
} & Partial<Record<QuestionField, string>>;

function subjectFor(id: QuestionId, visit: AnswerVisit): string {
  if (id === "why_dish" || id === "meal_slot" || id === "missing_dish") return visit.dish || "";
  if (id === "why_rest" || id === "app_gap" || id === "missing_action") return visit.restaurantName || "";
  if (id === "why_delivery") return visit.deliveryId || "";
  return "";
}

export function describeStoredAnswer(id: QuestionId, answer: string, subject: string) {
  const def = QBANK[id];
  const question = def
    ? def.title.replace("{sub}", subject || "this").replace(/\s{2,}/g, " ").trim()
    : id;
  if (answer === "skipped" || !answer) {
    return { question, label: answer === "skipped" ? "Skip" : "" };
  }
  const opt = def?.opts.find((item) => item.v === answer);
  return { question, label: opt?.l || answer };
}

export function answersFromVisit(visit: AnswerVisit) {
  return QUESTION_FIELDS.flatMap(({ id, field }) => {
    const answer = visit[field] || "";
    if (!answer) return [];
    const subject = subjectFor(id, visit);
    const described = describeStoredAnswer(id, answer, subject);
    return [{
      q: id,
      question: described.question,
      answer,
      label: described.label,
      subject,
    }];
  });
}
