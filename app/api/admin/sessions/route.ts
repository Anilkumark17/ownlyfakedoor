import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sessions, events, ownlyDirect, ownlyRapido, ownlyResponses } from "@/lib/db/schema";
import { getOwnlyVisitForSession, serializeVisit } from "@/lib/db/ownly";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const [allSessions, rapidoRows, directRows, allResponses] = await Promise.all([
      db.select().from(sessions).orderBy(desc(sessions.startedAt)),
      db.select().from(ownlyRapido).orderBy(desc(ownlyRapido.createdAt)),
      db.select().from(ownlyDirect).orderBy(desc(ownlyDirect.createdAt)),
      db.select().from(ownlyResponses).orderBy(desc(ownlyResponses.createdAt)),
    ]);

    const visits = [
      ...rapidoRows.map((row) => serializeVisit(row, "rapido")),
      ...directRows.map((row) => serializeVisit(row, "direct")),
    ].sort((a, b) => b.createdAt - a.createdAt);

    const responsesBySession = new Map<string, typeof allResponses>();
    for (const r of allResponses) {
      const list = responsesBySession.get(r.sessionId) || [];
      list.push(r);
      responsesBySession.set(r.sessionId, list);
    }

    const sessionsWithEvents = await Promise.all(
      allSessions.map(async (session) => {
        const sessionEvents = await db
          .select()
          .from(events)
          .where(eq(events.sessionId, session.sessionId))
          .orderBy(events.timestamp);

        const ownly = await getOwnlyVisitForSession(session.sessionId);
        const responseLog = (responsesBySession.get(session.sessionId) || []).map((r) => ({
          qId: r.qId,
          answer: r.answer,
          subject: r.subject,
          channel: r.channel,
          at: r.createdAt.getTime(),
        }));

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
          ownly,
          ownlyResponses: responseLog,
          events: sessionEvents.map((e) => {
            const eventData = e.eventData as Record<string, unknown>;
            return {
              ...eventData,
              type: e.eventType,
              at: e.timestamp.getTime(),
            };
          }),
        };
      }),
    );

    return NextResponse.json({ sessions: sessionsWithEvents, visits });
  } catch (error) {
    console.error("Fetch sessions error:", error);
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}
