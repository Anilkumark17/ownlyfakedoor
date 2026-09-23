import { CHECKLIST } from "./funnel";
import type { BehaviorSession } from "./storage";

export type OverallAnalysis = {
  sessionCount: number;
  uniqueRiders: number;
  exploredOwnlyCount: number;
  bannerImpressions: number;
  bannerClicks: number;
  bannerDismisses: number;
  orderAttempts: number;
  waitlistSubmits: number;
  adClicks: number;
  searchTerms: { term: string; count: number }[];
  missTerms: { term: string; count: number }[];
  substituteCount: number;
  waitlistFromMissCount: number;
  expressSelections: number;
  captainUp: number;
  captainDown: number;
  repeatYes: number;
  repeatNo: number;
  objectiveRates: { id: number; label: string; tier: string; rate: number }[];
};

function pct(n: number, d: number) {
  if (d === 0) return 0;
  return Math.round((n / d) * 100);
}

function tallyTerms(sessions: BehaviorSession[], type: "search_term" | "search_miss") {
  const map = new Map<string, number>();
  for (const s of sessions) {
    for (const e of s.events) {
      if (e.type === type) {
        const key = e.term.toLowerCase();
        map.set(key, (map.get(key) ?? 0) + 1);
      }
    }
  }
  return [...map.entries()]
    .map(([term, count]) => ({ term, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

export function computeOverallAnalysis(sessions: BehaviorSession[]): OverallAnalysis {
  const n = sessions.length;
  const riders = new Set(sessions.map((s) => s.riderEmail));

  let bannerImpressions = 0;
  let bannerClicks = 0;
  let bannerDismisses = 0;
  let orderAttempts = 0;
  let waitlistSubmits = 0;
  let adClicks = 0;
  let substituteCount = 0;
  let waitlistFromMissCount = 0;
  let expressSelections = 0;
  let captainUp = 0;
  let captainDown = 0;
  let repeatYes = 0;
  let repeatNo = 0;
  let exploredOwnlyCount = 0;

  for (const s of sessions) {
    if (s.exploredOwnly) exploredOwnlyCount++;
    for (const e of s.events) {
      switch (e.type) {
        case "banner_impression":
          bannerImpressions++;
          break;
        case "banner_click":
          bannerClicks++;
          break;
        case "banner_dismiss":
          bannerDismisses++;
          break;
        case "order_attempted":
          orderAttempts++;
          break;
        case "waitlist_submitted":
          waitlistSubmits++;
          break;
        case "ride_search_ad_click":
          adClicks++;
          break;
        case "miss_see_similar":
          substituteCount++;
          break;
        case "miss_notify_me":
          waitlistFromMissCount++;
          break;
        case "speed_selected":
          if (e.speed === "express") expressSelections++;
          break;
        case "captain_reaction":
          if (e.reaction === "up") captainUp++;
          else captainDown++;
          break;
        case "repeat_intent":
          if (e.value === "yes") repeatYes++;
          else repeatNo++;
          break;
        default:
          break;
      }
    }
  }

  const objectiveRates = CHECKLIST.map((row) => {
    const hit = sessions.filter((s) => row.isComplete(s.funnel, s.events)).length;
    return {
      id: row.id,
      label: row.label,
      tier: row.tier,
      rate: pct(hit, n),
    };
  });

  return {
    sessionCount: n,
    uniqueRiders: riders.size,
    exploredOwnlyCount,
    bannerImpressions,
    bannerClicks,
    bannerDismisses,
    orderAttempts,
    waitlistSubmits,
    adClicks,
    searchTerms: tallyTerms(sessions, "search_term"),
    missTerms: tallyTerms(sessions, "search_miss"),
    substituteCount,
    waitlistFromMissCount,
    expressSelections,
    captainUp,
    captainDown,
    repeatYes,
    repeatNo,
    objectiveRates,
  };
}
