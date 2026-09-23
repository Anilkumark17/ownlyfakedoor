import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function migrate() {
  try {
    // Create sessions table
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

    // Create events table
    await sql`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        session_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        event_data JSONB NOT NULL,
        timestamp TIMESTAMP NOT NULL
      )
    `;

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON sessions(session_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_events_session_id ON events(session_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp)`;

    console.log("✅ Database migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

migrate();
