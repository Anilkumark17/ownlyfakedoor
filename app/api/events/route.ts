import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sessions, events } from "@/lib/db/schema";
import { upsertOwnlyFromEvent } from "@/lib/db/ownly";
import { eq, sql } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, event } = body;
    const isOwnly = typeof event?.type === "string" && event.type.startsWith("ownly_");

    console.log("Logging event:", { sessionId, eventType: event?.type });

    if (sessionId) {
      await db.insert(events).values({
        sessionId,
        eventType: event.type,
        eventData: event,
        timestamp: new Date(event.at || Date.now()),
      });

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
        case "ownly_search_query":
        case "ownly_dish_search_started":
        case "ownly_search_tap":
          funnelUpdates.searchTermLogged = true;
          break;
        case "ownly_dish_selected":
        case "ownly_dish_added_custom":
          funnelUpdates.ownlyDishChosen = true;
          if (event.type === "ownly_dish_added_custom") funnelUpdates.coverageMiss = true;
          break;
        case "ownly_restaurant_search_selected":
        case "ownly_restaurant_card_click":
        case "ownly_restaurant_added_custom":
          funnelUpdates.ownlyRestaurantChosen = true;
          funnelUpdates.restaurantHit = true;
          if (event.type === "ownly_restaurant_added_custom") funnelUpdates.coverageMiss = true;
          break;
        case "ownly_menu_view":
          funnelUpdates.ownlyMenuViewed = true;
          break;
        case "ownly_item_added":
          funnelUpdates.ownlyItemAdded = true;
          break;
        case "ownly_delivery_option_chosen":
          funnelUpdates.ownlyDeliveryChosen = true;
          if (event.delivery_id === "rapido_link" || event.payload?.delivery_id === "rapido_link") {
            funnelUpdates.expressSelected = true;
          }
          break;
        case "ownly_cart_view":
          funnelUpdates.ownlyCart = true;
          break;
        case "ownly_place_order_click":
          funnelUpdates.ownlyPlaceOrder = true;
          funnelUpdates.orderAttempted = true;
          break;
        case "ownly_micro_answer":
          funnelUpdates.ownlyQuestionAnswered = true;
          break;
        case "ownly_honest_stop_view":
          funnelUpdates.ownlyStopped = true;
          break;
      }

      const patch: Record<string, unknown> = { updatedAt: new Date() };
      if (Object.keys(funnelUpdates).length > 0) {
        patch.funnel = sql`coalesce(${sessions.funnel}, '{}'::jsonb) || ${JSON.stringify(funnelUpdates)}::jsonb`;
      }
      if (isOwnly) patch.exploredOwnly = true;

      if (Object.keys(funnelUpdates).length > 0 || isOwnly) {
        await db.update(sessions).set(patch).where(eq(sessions.sessionId, sessionId));
      }
    }

    if (isOwnly) {
      await upsertOwnlyFromEvent(sessionId, event);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Log event error:", error);
    return NextResponse.json({
      error: "Failed to log event",
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
