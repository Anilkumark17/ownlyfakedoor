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
  placedOrder: boolean("placed_order").notNull().default(false),
  variant: text("variant").notNull().default(""),
  dish: text("dish").notNull().default(""),
  restaurantName: text("restaurant_name").notNull().default(""),
  deliveryId: text("delivery_id").notNull().default(""),
  billId: text("bill_id").notNull().default(""),
  offerId: text("offer_id").notNull().default(""),
  filter: text("filter").notNull().default(""),
  rlPrice: integer("rl_price").notNull().default(0),
  walletAmt: integer("wallet_amt").notNull().default(0),
  protectPrice: integer("protect_price").notNull().default(0),
  billTotal: integer("bill_total").notNull().default(0),
  itemCount: integer("item_count").notNull().default(0),
  whyThisOffer: text("why_this_offer").notNull().default(""),
  whatWereYouLookingFor: text("what_were_you_looking_for").notNull().default(""),
  whyThisDish: text("why_this_dish").notNull().default(""),
  whyThisRestaurant: text("why_this_restaurant").notNull().default(""),
  isThisOnYourUsualApp: text("is_this_on_your_usual_app").notNull().default(""),
  noSuchDishWhatNext: text("no_such_dish_what_next").notNull().default(""),
  notHereWhatNext: text("not_here_what_next").notNull().default(""),
  whyAddThis: text("why_add_this").notNull().default(""),
  whyThisWayToPay: text("why_this_way_to_pay").notNull().default(""),
  whyThisDelivery: text("why_this_delivery").notNull().default(""),
  worryIfRapidoBringsFood: text("worry_if_rapido_brings_food").notNull().default(""),
  whenDoYouUsuallyOrderThis: text("when_do_you_usually_order_this").notNull().default(""),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
};

/** Rapido study → Ownly prototype visits */
export const ownlyRapido = pgTable("ownly_rapido", ownlyVisitShape);

/** Direct / standalone Ownly entry (no Rapido ride context) */
export const ownlyDirect = pgTable("ownly_direct", ownlyVisitShape);

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type OwnlyRapidoRow = typeof ownlyRapido.$inferSelect;
export type OwnlyDirectRow = typeof ownlyDirect.$inferSelect;
export type NewOwnlyRapido = typeof ownlyRapido.$inferInsert;
export type NewOwnlyDirect = typeof ownlyDirect.$inferInsert;

export type OwnlyVisitRow = OwnlyRapidoRow | OwnlyDirectRow;
