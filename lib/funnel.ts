export type FunnelFlags = {
  /** 1 CRITICAL — tapped food banner unprompted */
  organicBannerClick: boolean;
  /** 2 CRITICAL — reached place-order attempt */
  orderAttempted: boolean;
  /** 10 CRITICAL — repeat intent (yes on waitlist or repeat toggle) */
  repeatIntent: boolean;
  /** 3 IMPORTANT — saw banner (impression) */
  bannerSeen: boolean;
  /** 3 — dismissed without entering food flow */
  bannerIgnored: boolean;
  /** 4 IMPORTANT — typed or picked a craving term */
  searchTermLogged: boolean;
  /** 5 IMPORTANT — named search hit catalogue */
  restaurantHit: boolean;
  /** 6 IMPORTANT — search returned no result */
  coverageMiss: boolean;
  /** 7 USEFUL — chose substitute on miss */
  substituteChosen: boolean;
  /** 7 — chose waitlist on miss */
  waitlistFromMiss: boolean;
  /** 8 USEFUL — express delivery selected */
  expressSelected: boolean;
  /** 9 USEFUL — captain trust reaction */
  captainReacted: boolean;
};

export type BehaviorEvent =
  | { type: "session_start"; at: number }
  | { type: "banner_impression"; at: number }
  | { type: "banner_click"; at: number }
  | { type: "banner_dismiss"; at: number }
  | { type: "ride_search_ad_view"; at: number; adId: string }
  | { type: "ride_search_ad_click"; at: number; adId: string }
  | { type: "search_term"; at: number; term: string; source: "chip" | "input" }
  | { type: "search_hit"; at: number; term: string; restaurantId: string }
  | { type: "search_miss"; at: number; term: string }
  | { type: "miss_notify_me"; at: number; term: string }
  | { type: "miss_see_similar"; at: number; term: string }
  | { type: "restaurant_open"; at: number; restaurantId: string }
  | { type: "speed_selected"; at: number; speed: "standard" | "express" }
  | { type: "order_attempted"; at: number; total: number }
  | { type: "captain_reaction"; at: number; reaction: "up" | "down" }
  | { type: "repeat_intent"; at: number; value: "yes" | "probably_not" }
  | { type: "waitlist_submitted"; at: number; phone: string }
  | { type: "explore_ownly"; at: number; url: string };

export function createEmptyFunnel(): FunnelFlags {
  return {
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
  };
}

export function applyEvent(flags: FunnelFlags, event: BehaviorEvent): FunnelFlags {
  const next = { ...flags };
  switch (event.type) {
    case "banner_impression":
      next.bannerSeen = true;
      break;
    case "banner_click":
      next.organicBannerClick = true;
      next.bannerSeen = true;
      break;
    case "banner_dismiss":
      next.bannerSeen = true;
      next.bannerIgnored = true;
      break;
    case "search_term":
      next.searchTermLogged = true;
      break;
    case "search_hit":
      next.restaurantHit = true;
      break;
    case "search_miss":
      next.coverageMiss = true;
      break;
    case "miss_see_similar":
      next.substituteChosen = true;
      break;
    case "miss_notify_me":
      next.waitlistFromMiss = true;
      break;
    case "speed_selected":
      if (event.speed === "express") next.expressSelected = true;
      break;
    case "order_attempted":
      next.orderAttempted = true;
      break;
    case "captain_reaction":
      next.captainReacted = true;
      break;
    case "repeat_intent":
      if (event.value === "yes") next.repeatIntent = true;
      break;
    case "waitlist_submitted":
      break;
    default:
      break;
  }
  return next;
}

export type ChecklistRow = {
  id: number;
  tier: "critical" | "important" | "useful";
  label: string;
  isComplete: (f: FunnelFlags, events: BehaviorEvent[]) => boolean;
};

export const CHECKLIST: ChecklistRow[] = [
  {
    id: 1,
    tier: "critical",
    label: "Organic conversion — tapped food banner",
    isComplete: (f) => f.organicBannerClick,
  },
  {
    id: 2,
    tier: "critical",
    label: "Placement → behavior — order attempt",
    isComplete: (f) => f.orderAttempted,
  },
  {
    id: 10,
    tier: "critical",
    label: "Repeat intent — would order again",
    isComplete: (f) => f.repeatIntent,
  },
  {
    id: 3,
    tier: "important",
    label: "Awareness — saw banner (tap or dismiss)",
    isComplete: (f) => f.bannerSeen,
  },
  {
    id: 4,
    tier: "important",
    label: "Craving — search term logged",
    isComplete: (f) => f.searchTermLogged,
  },
  {
    id: 5,
    tier: "important",
    label: "Restaurant interest — catalogue hit",
    isComplete: (f) => f.restaurantHit,
  },
  {
    id: 6,
    tier: "important",
    label: "Coverage gap — no results",
    isComplete: (f) => f.coverageMiss,
  },
  {
    id: 7,
    tier: "useful",
    label: "Miss recovery — substitute or waitlist",
    isComplete: (f) => f.substituteChosen || f.waitlistFromMiss,
  },
  {
    id: 8,
    tier: "useful",
    label: "Willingness to pay — express delivery",
    isComplete: (f) => f.expressSelected,
  },
  {
    id: 9,
    tier: "useful",
    label: "Captain trust — reacted",
    isComplete: (f) => f.captainReacted,
  },
];
