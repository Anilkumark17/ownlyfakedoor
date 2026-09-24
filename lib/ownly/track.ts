export type OwnlyEventPayload = Record<string, string | number | boolean | null | undefined>;

export async function logOwnlyEvent(
  sessionId: string,
  eventName: string,
  payload: OwnlyEventPayload = {},
  extra: { variant?: string; source?: string } = {},
) {
  if (!sessionId) return;
  const event = {
    type: `ownly_${eventName}`,
    at: Date.now(),
    event_name: eventName,
    payload,
    variant: extra.variant || "",
    source: extra.source || "",
    q_id: String(payload.q_id || ""),
    answer: String(payload.answer || ""),
    subject: String(payload.subject || ""),
    dish: String(payload.dish || ""),
    restaurant_name: String(payload.restaurant_name || ""),
    delivery_id: String(payload.delivery_id || ""),
    bill_total: Number(payload.bill_total) || 0,
    query: String(payload.query || ""),
    ...payload,
  };
  try {
    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, event }),
    });
  } catch {
    /* keep the prototype usable offline */
  }
}
