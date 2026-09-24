import { desc, eq } from "drizzle-orm";
import { db } from "./index";
import {
  ownlyDirect,
  ownlyRapido,
  ownlyResponses,
  type NewOwnlyDirect,
  type NewOwnlyRapido,
  type OwnlyVisitRow,
} from "./schema";
import { isQuestionId, questionField, QUESTION_FIELDS } from "../ownly/answers";
import { ownlyChannel, type OwnlyChannel } from "../ownly/channel";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function pick(event: Record<string, unknown>, key: string): unknown {
  const payload = asRecord(event.payload);
  return event[key] ?? payload[key];
}

function asString(value: unknown): string {
  if (value == null) return "";
  return String(value);
}

function asNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function visitTable(channel: OwnlyChannel) {
  return channel === "rapido" ? ownlyRapido : ownlyDirect;
}

async function latestVisit(sessionId: string, channel: OwnlyChannel) {
  const table = visitTable(channel);
  const rows = await db
    .select()
    .from(table)
    .where(eq(table.sessionId, sessionId))
    .orderBy(desc(table.id))
    .limit(1);
  return rows[0];
}

export function serializeVisit(row: OwnlyVisitRow, channel: OwnlyChannel) {
  const answers = Object.fromEntries(
    QUESTION_FIELDS.map(({ field }) => [field, row[field] || ""]),
  );
  return {
    id: row.id,
    sessionId: row.sessionId || "",
    cameFrom: channel,
    source: row.source,
    dish: row.dish,
    restaurantName: row.restaurantName,
    deliveryId: row.deliveryId,
    billTotal: row.billTotal,
    ...answers,
    placedOrder: row.placedOrder,
    createdAt: row.createdAt.getTime(),
    updatedAt: row.updatedAt.getTime(),
  };
}

export async function getOwnlyVisitForSession(sessionId: string) {
  const [rapido, direct] = await Promise.all([
    latestVisit(sessionId, "rapido"),
    latestVisit(sessionId, "direct"),
  ]);
  if (rapido && direct) {
    return rapido.updatedAt >= direct.updatedAt
      ? serializeVisit(rapido, "rapido")
      : serializeVisit(direct, "direct");
  }
  if (rapido) return serializeVisit(rapido, "rapido");
  if (direct) return serializeVisit(direct, "direct");
  return null;
}

export async function upsertOwnlyFromEvent(sessionId: string | undefined, event: Record<string, unknown>) {
  const type = asString(event.type);
  if (!type.startsWith("ownly_")) return;

  const name = type.replace(/^ownly_/, "");
  const sid = sessionId || asString(event.sessionId) || "";
  const source = asString(event.source || pick(event, "source"));

  let row: OwnlyVisitRow | undefined;
  let channel: OwnlyChannel = ownlyChannel(source);

  if (sid) {
    const rapidoRow = await latestVisit(sid, "rapido");
    const directRow = await latestVisit(sid, "direct");
    if (rapidoRow && directRow) {
      if (rapidoRow.updatedAt >= directRow.updatedAt) {
        row = rapidoRow;
        channel = "rapido";
      } else {
        row = directRow;
        channel = "direct";
      }
    } else if (rapidoRow) {
      row = rapidoRow;
      channel = "rapido";
    } else if (directRow) {
      row = directRow;
      channel = "direct";
    }
  }

  if (!row) {
    channel = ownlyChannel(source);
  }

  const table = visitTable(channel);
  const now = new Date();
  const values: Partial<NewOwnlyRapido & NewOwnlyDirect> = {
    sessionId: sid || row?.sessionId || null,
    source: source || row?.source || "",
    dish: asString(pick(event, "dish")) || row?.dish || "",
    restaurantName: asString(pick(event, "restaurant_name")) || row?.restaurantName || "",
    deliveryId: asString(pick(event, "delivery_id")) || row?.deliveryId || "",
    billTotal: asNumber(pick(event, "bill_total")) || row?.billTotal || 0,
    placedOrder: Boolean(row?.placedOrder || name === "place_order_click"),
    updatedAt: now,
  };

  if (name === "dish_selected" || name === "dish_added_custom") {
    values.dish = asString(pick(event, "dish")) || values.dish;
  }
  if (name === "restaurant_card_click" || name === "restaurant_search_selected") {
    values.restaurantName = asString(pick(event, "restaurant_name")) || values.restaurantName;
  }
  if (name === "delivery_option_chosen" || name === "delivery_confirmed") {
    values.deliveryId = asString(pick(event, "delivery_id")) || values.deliveryId;
  }
  if (name === "place_order_click") {
    values.billTotal = asNumber(pick(event, "bill_total")) || values.billTotal;
    values.placedOrder = true;
  }

  if (name === "micro_answer") {
    const qId = asString(pick(event, "q_id"));
    const answer = asString(pick(event, "answer")) || "skipped";
    const subject = asString(pick(event, "subject"));

    if (sid) {
      await db.insert(ownlyResponses).values({
        sessionId: sid,
        channel,
        qId,
        answer,
        subject,
        createdAt: now,
      });
    }

    if (isQuestionId(qId)) {
      values[questionField(qId)] = answer;
    }
  }

  if (row) {
    await db.update(table).set(values).where(eq(table.id, row.id));
    return;
  }

  await db.insert(table).values({
    ...values,
    createdAt: now,
  } as NewOwnlyRapido);
}
