import { desc, eq } from "drizzle-orm";
import { db } from "./index";
import {
  ownlyDirect,
  ownlyRapido,
  sessions,
  type NewOwnlyDirect,
  type NewOwnlyRapido,
  type OwnlyVisitRow,
} from "./schema";
import { isQuestionId, labelForAnswer, questionField, QUESTION_FIELDS } from "../ownly/answers";
import { isDirectParticipant, resolveOwnlyChannel, type OwnlyChannel } from "../ownly/channel";

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

async function sessionParticipant(sessionId: string) {
  const rows = await db.select().from(sessions).where(eq(sessions.sessionId, sessionId)).limit(1);
  const row = rows[0];
  if (!row) return { username: "", name: "" };
  const email = row.riderEmail || "";
  const username = email.endsWith("@rapido.local")
    ? email.slice(0, -"@rapido.local".length)
    : "";
  return { username, name: row.profileName || "" };
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
    placedOrder: row.placedOrder,
    variant: row.variant,
    dish: row.dish,
    restaurantName: row.restaurantName,
    deliveryId: row.deliveryId,
    billId: row.billId,
    offerId: row.offerId,
    filter: row.filter,
    rlPrice: row.rlPrice,
    walletAmt: row.walletAmt,
    protectPrice: row.protectPrice,
    billTotal: row.billTotal,
    itemCount: row.itemCount,
    ...answers,
    createdAt: row.createdAt.getTime(),
    updatedAt: row.updatedAt.getTime(),
  };
}

export async function getOwnlyVisitForSession(sessionId: string) {
  const participant = await sessionParticipant(sessionId);
  const forceDirect = isDirectParticipant(participant.username, participant.name);

  if (forceDirect) {
    const direct = await latestVisit(sessionId, "direct");
    return direct ? serializeVisit(direct, "direct") : null;
  }

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
  const eventUsername = asString(pick(event, "username"));
  const participant = sid ? await sessionParticipant(sid) : { username: "", name: "" };
  const username = eventUsername || participant.username;
  const forceDirect = isDirectParticipant(username, participant.name);

  let row: OwnlyVisitRow | undefined;
  let channel: OwnlyChannel;

  if (forceDirect) {
    channel = "direct";
    if (sid) row = await latestVisit(sid, "direct");
  } else if (sid) {
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
    } else {
      channel = resolveOwnlyChannel(source);
    }
  } else {
    channel = resolveOwnlyChannel(source);
  }

  const table = visitTable(channel);
  const now = new Date();
  const offerId = asString(pick(event, "offer") || pick(event, "offer_id"));
  const filter = name === "filter_tab_click" ? asString(pick(event, "detail")) : "";
  const values: Partial<NewOwnlyRapido & NewOwnlyDirect> = {
    sessionId: sid || row?.sessionId || null,
    source: source || row?.source || "",
    variant: asString(event.variant) || row?.variant || "",
    dish: asString(pick(event, "dish")) || row?.dish || "",
    restaurantName: asString(pick(event, "restaurant_name")) || row?.restaurantName || "",
    deliveryId: asString(pick(event, "delivery_id")) || row?.deliveryId || "",
    billId: asString(pick(event, "bill_id")) || row?.billId || "",
    offerId: offerId || row?.offerId || "",
    filter: filter || row?.filter || "",
    rlPrice: asNumber(pick(event, "rl_price")) || row?.rlPrice || 0,
    walletAmt: asNumber(pick(event, "wallet_amt")) || row?.walletAmt || 0,
    protectPrice: asNumber(pick(event, "protect_price")) || row?.protectPrice || 0,
    billTotal: asNumber(pick(event, "bill_total")) || row?.billTotal || 0,
    itemCount: asNumber(pick(event, "n_selected")) || row?.itemCount || 0,
    placedOrder: Boolean(row?.placedOrder || name === "place_order_click"),
    updatedAt: now,
  };

  if (name === "place_order_click") {
    values.placedOrder = true;
  }

  if (name === "micro_answer") {
    const qId = asString(pick(event, "q_id"));
    const answer = asString(pick(event, "answer")) || "skipped";
    if (isQuestionId(qId)) {
      values[questionField(qId)] = labelForAnswer(qId, answer);
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
