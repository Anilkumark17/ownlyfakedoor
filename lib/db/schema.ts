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

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
