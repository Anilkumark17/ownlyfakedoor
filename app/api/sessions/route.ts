import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sessions, events } from "@/lib/db/schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, profile, startedAt } = body;

    console.log("Creating session in DB:", { sessionId, profile });

    // Create session
    const result = await db.insert(sessions).values({
      sessionId,
      riderEmail: profile.username ? `${profile.username}@rapido.local` : profile.email || `user_${Date.now()}@rapido.local`,
      profileName: profile.name || profile.username,
      profilePhone: profile.phone,
      profileArea: profile.area,
      startedAt: new Date(startedAt),
      updatedAt: new Date(),
      exploredOwnly: false,
      funnel: {
        organicBannerClick: false,
        orderAttempted: false,
        repeatIntent: false,
        bannerSeen: false,
        bannerIgnored: false,
        searchTermLogged: false,
        restaurantHit: false,
        coverageMiss: false,
        substituteChosen: false,
        waitlistFromMiss: false,
        expressSelected: false,
        captainReacted: false,
      },
    });

    // Log session start event
    await db.insert(events).values({
      sessionId,
      eventType: "session_start",
      eventData: { profile },
      timestamp: new Date(startedAt),
    });

    console.log("Session created successfully:", result);

    return NextResponse.json({ success: true, sessionId });
  } catch (error) {
    console.error("Create session error:", error);
    return NextResponse.json({ 
      error: "Failed to create session", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
