import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { QUESTION_FIELDS, isQuestionId } from "../lib/ownly/answers";
import { RAPIDO_SOURCES } from "../lib/ownly/channel";

const sql = neon(process.env.DATABASE_URL!);

function channelForSource(source: string, cameFrom: string) {
  if (RAPIDO_SOURCES.has(source) || cameFrom === "rapido") return "rapido";
  return "direct";
}

function answersFromQuestions(raw: unknown) {
  const answers = Object.fromEntries(QUESTION_FIELDS.map(({ id }) => [id, ""]));
  if (!Array.isArray(raw)) return answers;
  for (const item of raw) {
    const q = String(item?.q || "");
    if (!isQuestionId(q)) continue;
    answers[q] = String(item?.answer || "skipped");
  }
  return answers;
}

async function createVisitTables() {
  const ddl = `
    id SERIAL PRIMARY KEY,
    session_id TEXT,
    source TEXT NOT NULL DEFAULT '',
    dish TEXT NOT NULL DEFAULT '',
    restaurant_name TEXT NOT NULL DEFAULT '',
    delivery_id TEXT NOT NULL DEFAULT '',
    bill_total INTEGER NOT NULL DEFAULT 0,
    why_offer TEXT NOT NULL DEFAULT '',
    why_filter TEXT NOT NULL DEFAULT '',
    why_dish TEXT NOT NULL DEFAULT '',
    why_rest TEXT NOT NULL DEFAULT '',
    app_gap TEXT NOT NULL DEFAULT '',
    missing_dish TEXT NOT NULL DEFAULT '',
    missing_action TEXT NOT NULL DEFAULT '',
    why_item TEXT NOT NULL DEFAULT '',
    why_bill TEXT NOT NULL DEFAULT '',
    why_delivery TEXT NOT NULL DEFAULT '',
    rapido_link_trust TEXT NOT NULL DEFAULT '',
    meal_slot TEXT NOT NULL DEFAULT '',
    placed_order BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  `;
  await sql.query(`CREATE TABLE IF NOT EXISTS ownly_rapido (${ddl})`);
  await sql.query(`CREATE TABLE IF NOT EXISTS ownly_direct (${ddl})`);
}

async function migrate() {
  try {
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

    await createVisitTables();

    await sql`
      CREATE TABLE IF NOT EXISTS ownly_responses (
        id SERIAL PRIMARY KEY,
        session_id TEXT NOT NULL,
        channel TEXT NOT NULL,
        q_id TEXT NOT NULL,
        answer TEXT NOT NULL,
        subject TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS ownly (
        id SERIAL PRIMARY KEY,
        session_id TEXT,
        came_from TEXT NOT NULL DEFAULT 'direct',
        source TEXT NOT NULL DEFAULT '',
        dish TEXT NOT NULL DEFAULT '',
        restaurant_name TEXT NOT NULL DEFAULT '',
        delivery_id TEXT NOT NULL DEFAULT '',
        bill_total INTEGER NOT NULL DEFAULT 0,
        why_offer TEXT NOT NULL DEFAULT '',
        why_filter TEXT NOT NULL DEFAULT '',
        why_dish TEXT NOT NULL DEFAULT '',
        why_rest TEXT NOT NULL DEFAULT '',
        app_gap TEXT NOT NULL DEFAULT '',
        missing_dish TEXT NOT NULL DEFAULT '',
        missing_action TEXT NOT NULL DEFAULT '',
        why_item TEXT NOT NULL DEFAULT '',
        why_bill TEXT NOT NULL DEFAULT '',
        why_delivery TEXT NOT NULL DEFAULT '',
        rapido_link_trust TEXT NOT NULL DEFAULT '',
        meal_slot TEXT NOT NULL DEFAULT '',
        placed_order BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    const legacyOwnly = await sql`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'ownly'
      ) AS ok
    `;
    if (legacyOwnly[0]?.ok) {
      const hasQuestions = await sql`
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'ownly' AND column_name = 'questions'
      `;
      if (hasQuestions.length) {
        const rows = await sql`SELECT id, source, came_from, questions FROM ownly`;
        for (const row of rows) {
          const source = String(row.source || "");
          const cameFrom = channelForSource(source, String(row.came_from || ""));
          const answers = answersFromQuestions(row.questions);
          await sql`
            UPDATE ownly SET
              came_from = ${cameFrom},
              why_offer = ${answers.why_offer},
              why_filter = ${answers.why_filter},
              why_dish = ${answers.why_dish},
              why_rest = ${answers.why_rest},
              app_gap = ${answers.app_gap},
              missing_dish = ${answers.missing_dish},
              missing_action = ${answers.missing_action},
              why_item = ${answers.why_item},
              why_bill = ${answers.why_bill},
              why_delivery = ${answers.why_delivery},
              rapido_link_trust = ${answers.rapido_link_trust},
              meal_slot = ${answers.meal_slot}
            WHERE id = ${row.id}
          `;
        }
        await sql`ALTER TABLE ownly DROP COLUMN IF EXISTS questions`;
      }

      const [{ count: rapidoCount }] = await sql`SELECT COUNT(*)::int AS count FROM ownly_rapido`;
      const [{ count: directCount }] = await sql`SELECT COUNT(*)::int AS count FROM ownly_direct`;
      const rows =
        rapidoCount === 0 && directCount === 0 ? await sql`SELECT * FROM ownly` : [];

      let moved = 0;
      for (const row of rows) {
        const source = String(row.source || "");
        const channel = channelForSource(source, String(row.came_from || "direct"));
        const created = row.created_at ? new Date(row.created_at as string | Date) : new Date();
        const updated = row.updated_at ? new Date(row.updated_at as string | Date) : created;
        const payload = {
          session_id: row.session_id,
          source: row.source,
          dish: row.dish,
          restaurant_name: row.restaurant_name,
          delivery_id: row.delivery_id,
          bill_total: row.bill_total,
          why_offer: row.why_offer,
          why_filter: row.why_filter,
          why_dish: row.why_dish,
          why_rest: row.why_rest,
          app_gap: row.app_gap,
          missing_dish: row.missing_dish,
          missing_action: row.missing_action,
          why_item: row.why_item,
          why_bill: row.why_bill,
          why_delivery: row.why_delivery,
          rapido_link_trust: row.rapido_link_trust,
          meal_slot: row.meal_slot,
          placed_order: row.placed_order,
          created_at: created,
          updated_at: updated,
        };
        if (channel === "rapido") {
          await sql`
            INSERT INTO ownly_rapido (
              session_id, source, dish, restaurant_name, delivery_id, bill_total,
              why_offer, why_filter, why_dish, why_rest, app_gap, missing_dish, missing_action,
              why_item, why_bill, why_delivery, rapido_link_trust, meal_slot, placed_order,
              created_at, updated_at
            ) VALUES (
              ${payload.session_id}, ${payload.source}, ${payload.dish}, ${payload.restaurant_name},
              ${payload.delivery_id}, ${payload.bill_total},
              ${payload.why_offer}, ${payload.why_filter}, ${payload.why_dish}, ${payload.why_rest},
              ${payload.app_gap}, ${payload.missing_dish}, ${payload.missing_action},
              ${payload.why_item}, ${payload.why_bill}, ${payload.why_delivery},
              ${payload.rapido_link_trust}, ${payload.meal_slot}, ${payload.placed_order},
              ${payload.created_at}, ${payload.updated_at}
            )
          `;
        } else {
          await sql`
            INSERT INTO ownly_direct (
              session_id, source, dish, restaurant_name, delivery_id, bill_total,
              why_offer, why_filter, why_dish, why_rest, app_gap, missing_dish, missing_action,
              why_item, why_bill, why_delivery, rapido_link_trust, meal_slot, placed_order,
              created_at, updated_at
            ) VALUES (
              ${payload.session_id}, ${payload.source}, ${payload.dish}, ${payload.restaurant_name},
              ${payload.delivery_id}, ${payload.bill_total},
              ${payload.why_offer}, ${payload.why_filter}, ${payload.why_dish}, ${payload.why_rest},
              ${payload.app_gap}, ${payload.missing_dish}, ${payload.missing_action},
              ${payload.why_item}, ${payload.why_bill}, ${payload.why_delivery},
              ${payload.rapido_link_trust}, ${payload.meal_slot}, ${payload.placed_order},
              ${payload.created_at}, ${payload.updated_at}
            )
          `;
        }
        moved++;
      }
      if (moved) console.log(`✅ Migrated ${moved} legacy ownly rows → rapido/direct tables`);
    }

    const [{ count: responseCount }] = await sql`SELECT COUNT(*)::int AS count FROM ownly_responses`;
    const microEvents =
      responseCount === 0
        ? await sql`
            SELECT session_id, event_data, timestamp FROM events
            WHERE event_type = 'ownly_micro_answer'
          `
        : [];

    let backfilled = 0;
    for (const ev of microEvents) {
      const data = ev.event_data as Record<string, unknown>;
      const payload = (data.payload || {}) as Record<string, unknown>;
      const qId = String(data.q_id || payload.q_id || "");
      if (!qId) continue;
      const source = String(data.source || payload.source || "");
      const channel = channelForSource(source, "");
      await sql`
        INSERT INTO ownly_responses (session_id, channel, q_id, answer, subject, created_at)
        VALUES (
          ${ev.session_id},
          ${channel},
          ${qId},
          ${String(data.answer || payload.answer || "skipped")},
          ${String(data.subject || payload.subject || "")},
          ${ev.timestamp}
        )
      `;
      backfilled++;
    }
    if (backfilled) console.log(`✅ Backfilled ${backfilled} ownly_responses from events`);

    await sql`CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON sessions(session_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_events_session_id ON events(session_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ownly_rapido_session_id ON ownly_rapido(session_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ownly_direct_session_id ON ownly_direct(session_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ownly_responses_session_id ON ownly_responses(session_id)`;

    console.log("✅ Database migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

migrate();
