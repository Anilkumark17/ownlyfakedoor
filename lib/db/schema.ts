import { pgTable, text, timestamp, jsonb, serial, boolean, integer } from "drizzle-orm/pg-core";

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  riderEmail: text("rider_email").notNull(),
  profileName: text("profile_name").notNull(),
  profilePhone: text("profile_phone").notNull(),
  profileArea: text("profile_area").notNull(),
  startedAt: timestamp("started_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  exploredOwnly: boolean("explored_ownly").default(false),
  funnel: jsonb("funnel").notNull(),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  eventType: text("event_type").notNull(),
  eventData: jsonb("event_data").notNull(),
  timestamp: timestamp("timestamp").notNull(),
});

const ownlyVisitShape = {
  id: serial("id").primaryKey(),
  sessionId: text("session_id"),
  source: text("source").notNull().default(""),
  dish: text("dish").notNull().default(""),
  restaurantName: text("restaurant_name").notNull().default(""),
  deliveryId: text("delivery_id").notNull().default(""),
  billTotal: integer("bill_total").notNull().default(0),
  whyOffer: text("why_offer").notNull().default(""),
  whyFilter: text("why_filter").notNull().default(""),
  whyDish: text("why_dish").notNull().default(""),
  whyRest: text("why_rest").notNull().default(""),
  appGap: text("app_gap").notNull().default(""),
  missingDish: text("missing_dish").notNull().default(""),
  missingAction: text("missing_action").notNull().default(""),
  whyItem: text("why_item").notNull().default(""),
  whyBill: text("why_bill").notNull().default(""),
  whyDelivery: text("why_delivery").notNull().default(""),
  rapidoLinkTrust: text("rapido_link_trust").notNull().default(""),
  mealSlot: text("meal_slot").notNull().default(""),
  placedOrder: boolean("placed_order").notNull().default(false),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
};

/** Rapido study → Ownly prototype visits */
export const ownlyRapido = pgTable("ownly_rapido", ownlyVisitShape);

/** Direct / standalone Ownly entry (no Rapido ride context) */
export const ownlyDirect = pgTable("ownly_direct", ownlyVisitShape);

/** One row per micro-question answer (append-only) */
export const ownlyResponses = pgTable("ownly_responses", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  channel: text("channel").notNull(),
  qId: text("q_id").notNull(),
  answer: text("answer").notNull(),
  subject: text("subject").notNull().default(""),
  createdAt: timestamp("created_at").notNull(),
});

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type OwnlyRapidoRow = typeof ownlyRapido.$inferSelect;
export type OwnlyDirectRow = typeof ownlyDirect.$inferSelect;
export type OwnlyResponseRow = typeof ownlyResponses.$inferSelect;
export type NewOwnlyRapido = typeof ownlyRapido.$inferInsert;
export type NewOwnlyDirect = typeof ownlyDirect.$inferInsert;
export type NewOwnlyResponse = typeof ownlyResponses.$inferInsert;

export type OwnlyVisitRow = OwnlyRapidoRow | OwnlyDirectRow;
