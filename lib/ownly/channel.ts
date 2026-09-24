export const RAPIDO_SOURCES = new Set([
  "bottom_nav",
  "ride_complete_ad",
  "top_banner",
  "home_feed_card",
  "vehicle_selection_snippet",
  "captain_found_ad",
  "ride_in_progress_ad",
  "banner",
]);

export type OwnlyChannel = "rapido" | "direct";

export function ownlyChannel(source: string, previous: OwnlyChannel | "" = ""): OwnlyChannel {
  if (RAPIDO_SOURCES.has(source)) return "rapido";
  if (previous) return previous;
  if (source === "direct" || source === "in_app" || !source) return "direct";
  return "rapido";
}
