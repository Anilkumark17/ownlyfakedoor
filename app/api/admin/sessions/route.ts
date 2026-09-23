import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sessions, events } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const allSessions = await db
      .select()
      .from(sessions)
      .orderBy(desc(sessions.startedAt));

    // Get events for each session
    const sessionsWithEvents = await Promise.all(
      allSessions.map(async (session) => {
        const sessionEvents = await db
          .select()
          .from(events)
          .where(eq(events.sessionId, session.sessionId))
          .orderBy(events.timestamp);

        return {
          id: session.sessionId,
          riderEmail: session.riderEmail,
          profile: {
            name: session.profileName,
            phone: session.profilePhone,
            area: session.profileArea,
            savedAt: session.startedAt.getTime(),
          },
          startedAt: session.startedAt.getTime(),
          updatedAt: session.updatedAt.getTime(),
          exploredOwnly: session.exploredOwnly,
          funnel: session.funnel,
          events: sessionEvents.map((e) => {
            const eventData = e.eventData as Record<string, any>;
            return {
              ...eventData,
              type: e.eventType,
              at: e.timestamp.getTime(),
            };
          }),
        };
      })
    );

    return NextResponse.json(sessionsWithEvents);
  } catch (error) {
    console.error("Fetch sessions error:", error);
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}
