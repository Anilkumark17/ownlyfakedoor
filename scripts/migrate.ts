import dotenv from "dotenv";
import { neon } from "@neondatabase/serverless";
import {
  ARMS,
  BILLS,
  DELIVERY,
  DISHES,
  OFFERS,
  QBANK,
  RESTAURANTS,
  RL_PRICES,
  WALLET_AMOUNTS,
  PROTECT_PRICES,
} from "../lib/ownly/catalog";
import { QUESTION_FIELDS } from "../lib/ownly/answers";
import { RAPIDO_SOURCES } from "../lib/ownly/channel";

dotenv.config({ path: ".env.local" });
dotenv.config();

const sql = neon(process.env.DATABASE_URL!);

const VISIT_DDL = `
  id SERIAL PRIMARY KEY,
  session_id TEXT,
  source TEXT NOT NULL DEFAULT '',
  placed_order BOOLEAN NOT NULL DEFAULT FALSE,
  variant TEXT NOT NULL DEFAULT '',
  dish TEXT NOT NULL DEFAULT '',
  restaurant_name TEXT NOT NULL DEFAULT '',
  delivery_id TEXT NOT NULL DEFAULT '',
  bill_id TEXT NOT NULL DEFAULT '',
  offer_id TEXT NOT NULL DEFAULT '',
  filter TEXT NOT NULL DEFAULT '',
  rl_price INTEGER NOT NULL DEFAULT 0,
  wallet_amt INTEGER NOT NULL DEFAULT 0,
  protect_price INTEGER NOT NULL DEFAULT 0,
  bill_total INTEGER NOT NULL DEFAULT 0,
  item_count INTEGER NOT NULL DEFAULT 0,
  why_this_offer TEXT NOT NULL DEFAULT '',
  what_were_you_looking_for TEXT NOT NULL DEFAULT '',
  why_this_dish TEXT NOT NULL DEFAULT '',
  why_this_restaurant TEXT NOT NULL DEFAULT '',
  is_this_on_your_usual_app TEXT NOT NULL DEFAULT '',
  no_such_dish_what_next TEXT NOT NULL DEFAULT '',
  not_here_what_next TEXT NOT NULL DEFAULT '',
  why_add_this TEXT NOT NULL DEFAULT '',
  why_this_way_to_pay TEXT NOT NULL DEFAULT '',
  why_this_delivery TEXT NOT NULL DEFAULT '',
  worry_if_rapido_brings_food TEXT NOT NULL DEFAULT '',
  when_do_you_usually_order_this TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
`;

const NEW_COLUMNS = [
  ["variant", "TEXT NOT NULL DEFAULT ''"],
  ["bill_id", "TEXT NOT NULL DEFAULT ''"],
  ["offer_id", "TEXT NOT NULL DEFAULT ''"],
  ["filter", "TEXT NOT NULL DEFAULT ''"],
  ["rl_price", "INTEGER NOT NULL DEFAULT 0"],
  ["wallet_amt", "INTEGER NOT NULL DEFAULT 0"],
  ["protect_price", "INTEGER NOT NULL DEFAULT 0"],
  ["item_count", "INTEGER NOT NULL DEFAULT 0"],
  ["why_this_offer", "TEXT NOT NULL DEFAULT ''"],
  ["what_were_you_looking_for", "TEXT NOT NULL DEFAULT ''"],
  ["why_this_dish", "TEXT NOT NULL DEFAULT ''"],
  ["why_this_restaurant", "TEXT NOT NULL DEFAULT ''"],
  ["is_this_on_your_usual_app", "TEXT NOT NULL DEFAULT ''"],
  ["no_such_dish_what_next", "TEXT NOT NULL DEFAULT ''"],
  ["not_here_what_next", "TEXT NOT NULL DEFAULT ''"],
  ["why_add_this", "TEXT NOT NULL DEFAULT ''"],
  ["why_this_way_to_pay", "TEXT NOT NULL DEFAULT ''"],
  ["why_this_delivery", "TEXT NOT NULL DEFAULT ''"],
  ["worry_if_rapido_brings_food", "TEXT NOT NULL DEFAULT ''"],
  ["when_do_you_usually_order_this", "TEXT NOT NULL DEFAULT ''"],
] as const;

const OLD_COLUMNS = [
  "why_offer",
  "why_filter",
  "why_dish",
  "why_rest",
  "app_gap",
  "missing_dish",
  "missing_action",
  "why_item",
  "why_bill",
  "why_delivery",
  "rapido_link_trust",
  "meal_slot",
];

const FILTERS = ["offers", "fast", "rated"] as const;

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function channelForSource(source: string, cameFrom: string) {
  if (RAPIDO_SOURCES.has(source) || cameFrom === "rapido") return "rapido";
  return "direct";
}

function randomVisit(channel: "rapido" | "direct", source: string) {
  const dish = pick(DISHES);
  const matches = RESTAURANTS.filter((r) => r.cu === dish.cu);
  const restaurant = pick(matches.length ? matches : RESTAURANTS);
  const delivery = pick(DELIVERY);
  const bill = pick(BILLS);
  const offer = pick(OFFERS);
  const itemCount = 1 + Math.floor(Math.random() * 3);
  const billTotal = 180 + Math.floor(Math.random() * 420);
  const answers = Object.fromEntries(
    QUESTION_FIELDS.map(({ id }) => [id, pick(QBANK[id].opts).l]),
  );
  return {
    source: source || (channel === "rapido" ? "banner" : "direct"),
    placed_order: Math.random() > 0.45,
    variant: pick(ARMS),
    dish: dish.n,
    restaurant_name: restaurant.n,
    delivery_id: delivery.id,
    bill_id: bill.id,
    offer_id: offer.id,
    filter: pick(FILTERS),
    rl_price: pick(RL_PRICES),
    wallet_amt: pick(WALLET_AMOUNTS),
    protect_price: pick(PROTECT_PRICES),
    bill_total: billTotal,
    item_count: itemCount,
    why_this_offer: answers.why_offer,
    what_were_you_looking_for: answers.why_filter,
    why_this_dish: answers.why_dish,
    why_this_restaurant: answers.why_rest,
    is_this_on_your_usual_app: answers.app_gap,
    no_such_dish_what_next: answers.missing_dish,
    not_here_what_next: answers.missing_action,
    why_add_this: answers.why_item,
    why_this_way_to_pay: answers.why_bill,
    why_this_delivery: answers.why_delivery,
    worry_if_rapido_brings_food: answers.rapido_link_trust,
    when_do_you_usually_order_this: answers.meal_slot,
  };
}

async function columnExists(table: string, column: string) {
  const rows = await sql`
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = ${table} AND column_name = ${column}
  `;
  return rows.length > 0;
}

async function tableExists(table: string) {
  const rows = await sql`
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = ${table}
  `;
  return rows.length > 0;
}

async function addNewColumns(table: "ownly_rapido" | "ownly_direct") {
  for (const [name, type] of NEW_COLUMNS) {
    await sql.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${name} ${type}`);
  }
}

async function dropOldColumns(table: "ownly_rapido" | "ownly_direct") {
  for (const name of OLD_COLUMNS) {
    await sql.query(`ALTER TABLE ${table} DROP COLUMN IF EXISTS ${name}`);
  }
}

async function fillRandom(table: "ownly_rapido" | "ownly_direct", channel: "rapido" | "direct") {
  const rows = await sql.query(`SELECT id, source FROM ${table}`);
  for (const row of rows) {
    const sample = randomVisit(channel, String(row.source || ""));
    await sql.query(
      `UPDATE ${table} SET
        source = $1,
        placed_order = $2,
        variant = $3,
        dish = $4,
        restaurant_name = $5,
        delivery_id = $6,
        bill_id = $7,
        offer_id = $8,
        filter = $9,
        rl_price = $10,
        wallet_amt = $11,
        protect_price = $12,
        bill_total = $13,
        item_count = $14,
        why_this_offer = $15,
        what_were_you_looking_for = $16,
        why_this_dish = $17,
        why_this_restaurant = $18,
        is_this_on_your_usual_app = $19,
        no_such_dish_what_next = $20,
        not_here_what_next = $21,
        why_add_this = $22,
        why_this_way_to_pay = $23,
        why_this_delivery = $24,
        worry_if_rapido_brings_food = $25,
        when_do_you_usually_order_this = $26,
        updated_at = NOW()
      WHERE id = $27`,
      [
        sample.source,
        sample.placed_order,
        sample.variant,
        sample.dish,
        sample.restaurant_name,
        sample.delivery_id,
        sample.bill_id,
        sample.offer_id,
        sample.filter,
        sample.rl_price,
        sample.wallet_amt,
        sample.protect_price,
        sample.bill_total,
        sample.item_count,
        sample.why_this_offer,
        sample.what_were_you_looking_for,
        sample.why_this_dish,
        sample.why_this_restaurant,
        sample.is_this_on_your_usual_app,
        sample.no_such_dish_what_next,
        sample.not_here_what_next,
        sample.why_add_this,
        sample.why_this_way_to_pay,
        sample.why_this_delivery,
        sample.worry_if_rapido_brings_food,
        sample.when_do_you_usually_order_this,
        row.id,
      ],
    );
  }
  return rows.length;
}

async function copyLegacyOwnly() {
  if (!(await tableExists("ownly"))) return 0;
  const [{ count: rapidoCount }] = await sql`SELECT COUNT(*)::int AS count FROM ownly_rapido`;
  const [{ count: directCount }] = await sql`SELECT COUNT(*)::int AS count FROM ownly_direct`;
  if (rapidoCount > 0 || directCount > 0) return 0;

  const rows = await sql`SELECT * FROM ownly`;
  for (const row of rows) {
    const source = String(row.source || "");
    const channel = channelForSource(source, String(row.came_from || "direct")) as "rapido" | "direct";
    const sample = randomVisit(channel, source);
    const created = row.created_at ? new Date(row.created_at as string | Date) : new Date();
    const table = channel === "rapido" ? "ownly_rapido" : "ownly_direct";
    await sql.query(
      `INSERT INTO ${table} (
        session_id, source, placed_order, variant, dish, restaurant_name, delivery_id,
        bill_id, offer_id, filter, rl_price, wallet_amt, protect_price, bill_total, item_count,
        why_this_offer, what_were_you_looking_for, why_this_dish, why_this_restaurant,
        is_this_on_your_usual_app, no_such_dish_what_next, not_here_what_next, why_add_this,
        why_this_way_to_pay, why_this_delivery, worry_if_rapido_brings_food, when_do_you_usually_order_this,
        created_at, updated_at
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29
      )`,
      [
        row.session_id,
        sample.source,
        row.placed_order ?? sample.placed_order,
        sample.variant,
        row.dish || sample.dish,
        row.restaurant_name || sample.restaurant_name,
        row.delivery_id || sample.delivery_id,
        sample.bill_id,
        sample.offer_id,
        sample.filter,
        sample.rl_price,
        sample.wallet_amt,
        sample.protect_price,
        row.bill_total || sample.bill_total,
        sample.item_count,
        sample.why_this_offer,
        sample.what_were_you_looking_for,
        sample.why_this_dish,
        sample.why_this_restaurant,
        sample.is_this_on_your_usual_app,
        sample.no_such_dish_what_next,
        sample.not_here_what_next,
        sample.why_add_this,
        sample.why_this_way_to_pay,
        sample.why_this_delivery,
        sample.worry_if_rapido_brings_food,
        sample.when_do_you_usually_order_this,
        created,
        new Date(),
      ],
    );
  }
  return rows.length;
}

async function migrate() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing. Set it in .env.local");
  }

  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id SERIAL PRIMARY KEY,
      session_id TEXT NOT NULL UNIQUE,
      rider_email TEXT NOT NULL,
      profile_name TEXT NOT NULL,
      profile_phone TEXT NOT NULL,
      profile_area TEXT NOT NULL,
      started_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL,
      explored_ownly BOOLEAN DEFAULT FALSE,
      funnel JSONB NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY,
      session_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      event_data JSONB NOT NULL,
      timestamp TIMESTAMP NOT NULL
    )
  `;

  await sql.query(`CREATE TABLE IF NOT EXISTS ownly_rapido (${VISIT_DDL})`);
  await sql.query(`CREATE TABLE IF NOT EXISTS ownly_direct (${VISIT_DDL})`);

  await addNewColumns("ownly_rapido");
  await addNewColumns("ownly_direct");

  const moved = await copyLegacyOwnly();
  if (moved) console.log(`Moved ${moved} legacy ownly rows`);

  const needsSample =
    (await columnExists("ownly_rapido", "why_offer")) ||
    (await columnExists("ownly_direct", "why_offer"));

  if (needsSample) {
    const rapido = await fillRandom("ownly_rapido", "rapido");
    const direct = await fillRandom("ownly_direct", "direct");
    console.log(`Filled random catalog answers on ${rapido} rapido rows and ${direct} direct rows`);
  }

  await dropOldColumns("ownly_rapido");
  await dropOldColumns("ownly_direct");

  await sql`DROP TABLE IF EXISTS ownly_responses`;
  await sql`DROP TABLE IF EXISTS ownly`;

  await sql`CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON sessions(session_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_events_session_id ON events(session_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_ownly_rapido_session_id ON ownly_rapido(session_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_ownly_direct_session_id ON ownly_direct(session_id)`;

  console.log("Database migration completed");
}

migrate().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
