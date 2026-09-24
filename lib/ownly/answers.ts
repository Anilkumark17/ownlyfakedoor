import { QBANK } from "./catalog";

export const QUESTION_FIELDS = [
  { id: "why_offer", field: "whyThisOffer", question: "Why this offer?" },
  { id: "why_filter", field: "whatWereYouLookingFor", question: "What were you looking for?" },
  { id: "why_dish", field: "whyThisDish", question: "Why this dish?" },
  { id: "why_rest", field: "whyThisRestaurant", question: "Why this restaurant?" },
  { id: "app_gap", field: "isThisOnYourUsualApp", question: "Is this on the food app you use most?" },
  { id: "missing_dish", field: "noSuchDishWhatNext", question: "We don't have this dish. What next?" },
  { id: "missing_action", field: "notHereWhatNext", question: "This isn't here. What next?" },
  { id: "why_item", field: "whyAddThis", question: "Why add this?" },
  { id: "why_bill", field: "whyThisWayToPay", question: "Why this way to pay?" },
  { id: "why_delivery", field: "whyThisDelivery", question: "Why this delivery?" },
  { id: "rapido_link_trust", field: "worryIfRapidoBringsFood", question: "Any worry if a Rapido rider brings the food?" },
  { id: "meal_slot", field: "whenDoYouUsuallyOrderThis", question: "When do you usually order this?" },
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

export function labelForAnswer(id: QuestionId, answer: string): string {
  if (!answer) return "";
  if (answer === "skipped") return "Skip";
  const def = QBANK[id];
  const byCode = def?.opts.find((item) => item.v === answer);
  if (byCode) return byCode.l;
  return answer;
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

export function answersFromVisit(visit: AnswerVisit) {
  return QUESTION_FIELDS.flatMap(({ id, field, question }) => {
    const stored = visit[field] || "";
    if (!stored) return [];
    return [{
      q: id,
      question,
      answer: stored,
      label: labelForAnswer(id, stored),
      subject: subjectFor(id, visit),
    }];
  });
}
