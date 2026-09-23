import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    await db
      .update(sessions)
      .set({
        exploredOwnly: true,
        updatedAt: new Date(),
      })
      .where(eq(sessions.sessionId, sessionId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mark explored error:", error);
    return NextResponse.json({ error: "Failed to mark explored" }, { status: 500 });
  }
}
