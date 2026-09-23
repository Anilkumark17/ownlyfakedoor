import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sessions, events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, event } = body;

    console.log("Logging event:", { sessionId, eventType: event.type });

    // Save event
    await db.insert(events).values({
      sessionId,
      eventType: event.type,
      eventData: event,
      timestamp: new Date(event.at),
    });

    // Update funnel flags based on event
    const funnelUpdates: Record<string, boolean> = {};
    
    switch (event.type) {
      case "banner_impression":
        funnelUpdates.bannerSeen = true;
        break;
      case "banner_click":
        funnelUpdates.organicBannerClick = true;
        break;
      case "banner_dismiss":
        funnelUpdates.bannerIgnored = true;
        break;
      case "search_term":
        funnelUpdates.searchTermLogged = true;
        break;
      case "destination_selected":
        funnelUpdates.restaurantHit = true;
        break;
      case "vehicle_selected":
        if (event.vehicleType === "express") funnelUpdates.expressSelected = true;
        break;
      case "captain_found":
        funnelUpdates.captainReacted = true;
        break;
      case "ride_started":
        funnelUpdates.orderAttempted = true;
        break;
      case "ride_complete":
        funnelUpdates.repeatIntent = true;
        break;
    }

    // Update session with new funnel flags
    if (Object.keys(funnelUpdates).length > 0) {
      const [existingSession] = await db
        .select()
        .from(sessions)
        .where(eq(sessions.sessionId, sessionId))
        .limit(1);

      if (existingSession) {
        const existingFunnel = existingSession.funnel as Record<string, boolean>;
        const updatedFunnel = { ...existingFunnel, ...funnelUpdates };
        await db
          .update(sessions)
          .set({
            funnel: updatedFunnel,
            updatedAt: new Date(),
          })
          .where(eq(sessions.sessionId, sessionId));
        
        console.log("Funnel updated:", funnelUpdates);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Log event error:", error);
    return NextResponse.json({ 
      error: "Failed to log event",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
