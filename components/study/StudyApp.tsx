"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { OWNLY_EXPLORE_URL } from "@/lib/constants";
import {
  appendSessionEvent,
  getActiveSessionId,
  loadAuth,
  markExploredOwnly,
  resetActiveSession,
  type BehaviorSession,
} from "@/lib/storage";

type RideType = "auto" | "bike" | "cab";
type JourneyState =
  | "home"
  | "searching_destination"
  | "vehicle_selection"
  | "searching_captain"
  | "captain_found"
  | "ride_started"
  | "ride_complete";

const RIDE_TYPES = [
  { id: "auto" as const, name: "Auto", emoji: "🛺", basePrice: 35, perKm: 12, time: "2-4 min" },
  { id: "bike" as const, name: "Bike", emoji: "🏍️", basePrice: 25, perKm: 8, time: "1-3 min" },
  { id: "cab" as const, name: "Cab", emoji: "🚗", basePrice: 60, perKm: 15, time: "3-6 min" },
];

const DESTINATIONS = [
  { id: 1, name: "IIIT Hyderabad", area: "Gachibowli Main Road", distance: 4.2, popular: true },
  { id: 2, name: "Inorbit Mall", area: "HITEC City", distance: 5.8, popular: true },
  { id: 3, name: "Cyber Towers", area: "HITEC City", distance: 4.5, popular: false },
  { id: 4, name: "DLF Cyber City", area: "Gachibowli", distance: 3.1, popular: true },
  { id: 5, name: "Botanical Garden", area: "Kondapur", distance: 6.2, popular: false },
  { id: 6, name: "Forum Sujana Mall", area: "Kukatpally", distance: 8.5, popular: false },
  { id: 7, name: "Shilparamam", area: "HITEC City", distance: 5.3, popular: false },
  { id: 8, name: "Lumbini Park", area: "Secretariat", distance: 12.4, popular: false },
];

const CAPTAIN_NAMES = ["Ravi Kumar", "Suresh Reddy", "Anil Sharma", "Venkat Rao", "Krishna"];

export function StudyApp() {
  const router = useRouter();
  const [session, setSession] = useState<BehaviorSession | null>(null);
  const [journeyState, setJourneyState] = useState<JourneyState>("home");
  const [topBannerVisible, setTopBannerVisible] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDestination, setSelectedDestination] = useState<typeof DESTINATIONS[0] | null>(null);
  const [selectedRideType, setSelectedRideType] = useState<RideType>("auto");
  const [showOwnlyInline, setShowOwnlyInline] = useState(false);
  const [captain, setCaptain] = useState<{
    name: string;
    rating: string;
    plate: string;
    phone: string;
  } | null>(null);
  const [rideProgress, setRideProgress] = useState(0);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const auth = loadAuth();
    if (!auth || auth.role !== "customer") {
      router.replace("/login");
      return;
    }
    const s = resetActiveSession(auth.profile, auth.email);
    setSession(s);
  }, [router]);

  useEffect(() => {
    if (topBannerVisible && session) {
      appendSessionEvent(session.id, { type: "banner_impression", at: Date.now() });
    }
  }, [topBannerVisible, session]);

  // Show inline Ownly card after 3s on home
  useEffect(() => {
    if (journeyState === "home" && !showOwnlyInline) {
      const timer = setTimeout(() => setShowOwnlyInline(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [journeyState, showOwnlyInline]);

  // Auto-find captain after search
  useEffect(() => {
    if (journeyState === "searching_captain") {
      const timer = setTimeout(() => {
        const randomCaptain = CAPTAIN_NAMES[Math.floor(Math.random() * CAPTAIN_NAMES.length)];
        setCaptain({
          name: randomCaptain,
          rating: (4.5 + Math.random() * 0.4).toFixed(1),
          plate: `TS 09 ${Math.floor(Math.random() * 9000) + 1000}`,
          phone: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        });
        setJourneyState("captain_found");
        const sid = getActiveSessionId();
        if (sid) {
          appendSessionEvent(sid, {
            type: "ride_search_ad_view",
            at: Date.now(),
            adId: "captain_found_food_ad",
          });
        }
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [journeyState]);

  // Simulate ride progress
  useEffect(() => {
    if (journeyState === "ride_started") {
      progressInterval.current = setInterval(() => {
        setRideProgress((prev) => {
          if (prev >= 100) {
            setJourneyState("ride_complete");
            if (progressInterval.current) clearInterval(progressInterval.current);
            return 100;
          }
          return prev + 2;
        });
      }, 600);
      return () => {
        if (progressInterval.current) clearInterval(progressInterval.current);
      };
    }
  }, [journeyState]);

  const redirectToOwnly = (source: string) => {
    const sid = getActiveSessionId();
    if (sid) {
      appendSessionEvent(sid, { type: "banner_click", at: Date.now() });
      if (source.includes("ad")) {
        appendSessionEvent(sid, {
          type: "ride_search_ad_click",
          at: Date.now(),
          adId: source,
        });
      }
      markExploredOwnly(sid);
    }
    Object.keys(localStorage).forEach((key) => {
      if (key !== "ownly_auth") localStorage.removeItem(key);
    });
    window.location.href = OWNLY_EXPLORE_URL;
  };

  const handleDestinationSelect = (dest: typeof DESTINATIONS[0]) => {
    setSelectedDestination(dest);
    setJourneyState("vehicle_selection");
    setSearchQuery("");
  };

  const handleBookRide = () => {
    setJourneyState("searching_captain");
  };

  const handleStartRide = () => {
    setJourneyState("ride_started");
    setRideProgress(0);
  };

  const handleRestart = () => {
    setJourneyState("home");
    setSelectedDestination(null);
    setCaptain(null);
    setRideProgress(0);
    setShowOwnlyInline(false);
  };

  const filteredDestinations = DESTINATIONS.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.area.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const estimatedPrice = selectedDestination
    ? RIDE_TYPES.find((r) => r.id === selectedRideType)!.basePrice +
      Math.round(selectedDestination.distance * RIDE_TYPES.find((r) => r.id === selectedRideType)!.perKm)
    : 0;

  if (!session) {
    return (
      <div className="flex h-full items-center justify-center bg-[#FFC80A]">
        <div className="text-center">
          <p className="text-2xl font-extrabold tracking-tight text-[#16140F]">rapido</p>
          <div className="mt-2 h-1 w-12 mx-auto rounded-full bg-[#16140F] animate-pulse-soft" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col bg-[#F5F3EE] text-[#16140F]">
      {/* Header */}
      <header className="relative z-20 bg-[#FFC80A] px-4 pb-3 pt-12 safe-top">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-extrabold tracking-tight">rapido</p>
            <p className="mt-0.5 text-xs font-semibold opacity-80">{session.profile.area}</p>
          </div>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#16140F] text-sm font-bold text-white shadow-md"
          >
            {session.profile.name.charAt(0).toUpperCase()}
          </button>
        </div>

        {/* Top Banner - Only on Home */}
        {topBannerVisible && journeyState === "home" && (
          <div className="mt-3 overflow-hidden rounded-2xl bg-gradient-to-r from-[#E91E8C] to-[#C2185B] p-3 shadow-lg animate-slide-down">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 text-2xl">
                🎉
              </div>
              <div className="min-w-0 flex-1 text-white">
                <p className="text-xs font-extrabold leading-tight">Food delivery is here!</p>
                <p className="text-[10px] font-semibold text-[#FFC80A]">
                  Zero fees · 2,847 orders in {session.profile.area}
                </p>
              </div>
              <button
                type="button"
                onClick={() => redirectToOwnly("top_banner")}
                className="shrink-0 rounded-full bg-white px-4 py-2 text-xs font-extrabold text-[#E91E8C] shadow active:scale-95 transition-transform"
              >
                Try
              </button>
              <button
                type="button"
                onClick={() => setTopBannerVisible(false)}
                className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white text-lg"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="relative z-10 -mt-2 flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-3xl bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-32">
          {/* HOME STATE */}
          {journeyState === "home" && (
            <>
              <div className="sticky top-0 z-10 -mx-4 bg-white px-4 pb-3 pt-4">
                <button
                  type="button"
                  onClick={() => setJourneyState("searching_destination")}
                  className="flex w-full items-center gap-3 rounded-2xl border-2 border-[#EDE9E0] bg-white px-4 py-4 text-left shadow-sm active:scale-[0.99] transition-transform"
                >
                  <span className="text-xl">🔍</span>
                  <span className="text-base font-semibold text-[#5C574F]">
                    Where do you want to go?
                  </span>
                </button>
              </div>

              {showOwnlyInline && (
                <div className="mt-4 animate-slide-up">
                  <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#FFE5F5] via-[#FFF0FA] to-white shadow-lg border border-[#F5D0E8]">
                    <div className="relative p-5">
                      <div className="absolute right-3 top-3 rounded-full bg-[#1C7A4E] px-2.5 py-1 text-[10px] font-bold text-white shadow">
                        NEW
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E91E8C] to-[#C2185B] text-4xl shadow-lg">
                          🍽️
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-extrabold text-[#C2185B]">OWNLY</p>
                          <p className="mt-1 text-lg font-extrabold leading-tight text-[#16140F]">
                            Food delivery, minus the fees
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <div className="rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-[#1C7A4E] shadow-sm">
                              ✓ Zero platform fees
                            </div>
                            <div className="rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-[#1C7A4E] shadow-sm">
                              ✓ Free delivery
                            </div>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => redirectToOwnly("home_feed_card")}
                        className="mt-4 w-full rounded-2xl bg-gradient-to-r from-[#E91E8C] to-[#C2185B] py-4 text-sm font-extrabold text-white shadow-md active:scale-[0.98] transition-transform"
                      >
                        Order food now →
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6">
                <p className="text-xs font-bold uppercase tracking-wide text-[#5C574F]">
                  Popular destinations
                </p>
                <div className="mt-2 space-y-2">
                  {DESTINATIONS.filter((d) => d.popular).map((dest) => (
                    <button
                      key={dest.id}
                      type="button"
                      onClick={() => handleDestinationSelect(dest)}
                      className="flex w-full items-center gap-3 rounded-2xl bg-[#FAF8F3] px-4 py-3 text-left active:bg-[#F5F3EE] transition-all active:scale-[0.99]"
                    >
                      <span className="text-xl">📍</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-[#16140F]">{dest.name}</p>
                        <p className="truncate text-xs text-[#5C574F]">
                          {dest.area} · {dest.distance} km
                        </p>
                      </div>
                      <span className="text-lg">→</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* SEARCHING DESTINATION */}
          {journeyState === "searching_destination" && (
            <>
              <div className="sticky top-0 z-10 -mx-4 bg-white px-4 pb-3 pt-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setJourneyState("home")}
                    className="flex h-10 w-10 items-center justify-center rounded-full active:bg-[#FAF8F3]"
                  >
                    <span className="text-2xl">←</span>
                  </button>
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search destination..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 rounded-2xl border-2 border-[#FFC80A] bg-white px-4 py-3 text-base font-semibold outline-none"
                  />
                </div>
              </div>

              <div className="mt-2 space-y-2">
                {filteredDestinations.map((dest) => (
                  <button
                    key={dest.id}
                    type="button"
                    onClick={() => handleDestinationSelect(dest)}
                    className="flex w-full items-center gap-3 rounded-2xl bg-[#FAF8F3] px-4 py-3 text-left active:scale-[0.99] transition-transform"
                  >
                    <span className="text-xl">📍</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-[#16140F]">{dest.name}</p>
                      <p className="truncate text-xs text-[#5C574F]">
                        {dest.area} · {dest.distance} km away
                      </p>
                    </div>
                    <span className="text-lg">→</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* VEHICLE SELECTION */}
          {journeyState === "vehicle_selection" && (
            <>
              <div className="sticky top-0 z-10 -mx-4 bg-white px-4 pb-3 pt-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setJourneyState("home")}
                    className="flex h-10 w-10 items-center justify-center rounded-full active:bg-[#FAF8F3]"
                  >
                    <span className="text-2xl">←</span>
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold text-[#16140F]">
                      {selectedDestination?.name}
                    </p>
                    <p className="truncate text-xs text-[#5C574F]">
                      {selectedDestination?.distance} km · {selectedDestination?.area}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[#5C574F]">
                  Choose your ride
                </p>
                <div className="mt-3 space-y-3">
                  {RIDE_TYPES.map((ride) => {
                    const price =
                      ride.basePrice +
                      Math.round((selectedDestination?.distance || 0) * ride.perKm);
                    return (
                      <button
                        key={ride.id}
                        type="button"
                        onClick={() => setSelectedRideType(ride.id)}
                        className={`flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all active:scale-[0.99] ${
                          selectedRideType === ride.id
                            ? "border-[#FFC80A] bg-[#FFF8D6] shadow-md"
                            : "border-[#EDE9E0] bg-white"
                        }`}
                      >
                        <span className="text-4xl">{ride.emoji}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-base font-extrabold text-[#16140F]">{ride.name}</p>
                          <p className="text-xs text-[#5C574F]">{ride.time} away</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-extrabold text-[#16140F]">₹{price}</p>
                          <p className="text-[10px] text-[#5C574F]">Est. fare</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Small Ownly teaser during vehicle selection */}
              <div className="mt-4 animate-slide-up">
                <button
                  type="button"
                  onClick={() => redirectToOwnly("vehicle_selection_snippet")}
                  className="w-full overflow-hidden rounded-2xl border-2 border-[#FFD700] bg-gradient-to-r from-[#FFF8DC] to-white p-3 shadow-md active:scale-[0.99] transition-transform"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">💡</span>
                    <div className="min-w-0 flex-1 text-left">
                      <p className="text-xs font-bold text-[#C2185B]">Pro tip</p>
                      <p className="text-sm font-extrabold text-[#16140F]">
                        Order food while riding → Collect on arrival
                      </p>
                    </div>
                    <span className="text-lg">→</span>
                  </div>
                </button>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleBookRide}
                  className="w-full rounded-2xl bg-[#FFC80A] py-4 text-base font-extrabold text-[#16140F] shadow-lg active:scale-[0.98] transition-transform"
                >
                  Confirm {RIDE_TYPES.find((r) => r.id === selectedRideType)!.name} · ₹
                  {estimatedPrice}
                </button>
              </div>
            </>
          )}

          {/* SEARCHING CAPTAIN */}
          {journeyState === "searching_captain" && (
            <div className="flex min-h-[60vh] flex-col items-center justify-center">
              <div className="text-center">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#FFF8D6] animate-pulse-soft">
                  <span className="text-5xl">
                    {RIDE_TYPES.find((r) => r.id === selectedRideType)!.emoji}
                  </span>
                </div>
                <p className="mt-6 text-xl font-extrabold text-[#16140F]">
                  Finding nearby captains...
                </p>
                <p className="mt-2 text-sm text-[#5C574F]">
                  Searching for {RIDE_TYPES.find((r) => r.id === selectedRideType)!.name}s in{" "}
                  {session.profile.area}
                </p>
              </div>
            </div>
          )}

          {/* CAPTAIN FOUND */}
          {journeyState === "captain_found" && captain && (
            <>
              <div className="mt-4 overflow-hidden rounded-3xl bg-[#E7F4EC] p-5 shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl font-extrabold shadow">
                    {captain.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-extrabold text-[#1C7A4E]">
                      ✓ Captain found nearby
                    </p>
                    <p className="text-lg font-extrabold text-[#16140F]">{captain.name}</p>
                    <p className="text-xs text-[#5C574F]">
                      {captain.rating}★ · {captain.plate}
                    </p>
                  </div>
                </div>
                <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-[#5C574F]">Arriving in</p>
                      <p className="text-2xl font-extrabold text-[#16140F]">
                        {RIDE_TYPES.find((r) => r.id === selectedRideType)!.time}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-[#5C574F]">Fare</p>
                      <p className="text-2xl font-extrabold text-[#16140F]">₹{estimatedPrice}</p>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleStartRide}
                  className="mt-4 w-full rounded-2xl bg-[#1C7A4E] py-4 text-base font-extrabold text-white shadow-lg active:scale-[0.98] transition-transform"
                >
                  Captain arrived · Start ride
                </button>
              </div>

              {/* Ownly while waiting for captain */}
              <div className="mt-4 animate-slide-up">
                <button
                  type="button"
                  onClick={() => redirectToOwnly("captain_found_ad")}
                  className="w-full overflow-hidden rounded-2xl border-2 border-[#E91E8C] bg-white shadow-lg active:scale-[0.99] transition-transform"
                >
                  <div className="bg-gradient-to-r from-[#FFE5F5] to-[#FFF0FA] px-3 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#C2185B]">
                      ⭐ While your {RIDE_TYPES.find((r) => r.id === selectedRideType)!.name}{" "}
                      arrives
                    </p>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#E91E8C] to-[#C2185B] text-2xl">
                        🍕
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <p className="text-base font-extrabold leading-tight text-[#16140F]">
                          Pre-order lunch for delivery
                        </p>
                        <p className="mt-1 text-xs text-[#5C574F]">
                          Order now · Ready when you reach destination
                        </p>
                        <div className="mt-3 inline-block rounded-xl bg-[#1C7A4E] px-4 py-2.5 text-sm font-extrabold text-white shadow">
                          Browse restaurants →
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </>
          )}

          {/* RIDE IN PROGRESS */}
          {journeyState === "ride_started" && captain && (
            <>
              <div className="mt-4 overflow-hidden rounded-3xl bg-gradient-to-br from-[#FFF8D6] to-[#FFEFB3] p-5 shadow-lg">
                <p className="text-sm font-extrabold text-[#1C7A4E]">✓ Ride in progress</p>
                <div className="mt-4 flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl font-extrabold shadow">
                    {captain.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-extrabold text-[#16140F]">{captain.name}</p>
                    <p className="text-xs text-[#5C574F]">
                      {captain.rating}★ · {captain.plate}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-xs font-semibold text-[#5C574F] mb-2">
                    <span>To {selectedDestination?.name}</span>
                    <span>{rideProgress}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full bg-[#FFC80A] transition-all duration-300 ease-linear"
                      style={{ width: `${rideProgress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Ownly during ride - perfect time! */}
              {rideProgress < 80 && (
                <div className="mt-4 animate-slide-up">
                  <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#FFE5F5] via-[#FFF0FA] to-white shadow-xl border-2 border-[#E91E8C]">
                    <div className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E91E8C] to-[#C2185B] text-4xl shadow-lg">
                          🍽️
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-extrabold text-[#C2185B]">OWNLY</p>
                          <p className="mt-1 text-lg font-extrabold leading-tight text-[#16140F]">
                            Order food to your destination
                          </p>
                          <p className="mt-2 text-xs text-[#5C574F]">
                            Zero fees · Free delivery · Arrives with you
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => redirectToOwnly("ride_in_progress_ad")}
                        className="mt-4 w-full rounded-2xl bg-gradient-to-r from-[#E91E8C] to-[#C2185B] py-4 text-sm font-extrabold text-white shadow-md active:scale-[0.98] transition-transform"
                      >
                        Browse food now →
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* RIDE COMPLETE */}
          {journeyState === "ride_complete" && captain && (
            <div className="flex min-h-[60vh] flex-col items-center justify-center">
              <div className="text-center">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#E7F4EC]">
                  <span className="text-5xl">✓</span>
                </div>
                <p className="mt-6 text-2xl font-extrabold text-[#1C7A4E]">
                  Ride completed!
                </p>
                <p className="mt-2 text-sm text-[#5C574F]">
                  You've reached {selectedDestination?.name}
                </p>
                <div className="mt-6 rounded-2xl bg-[#FAF8F3] p-6">
                  <p className="text-xs font-semibold text-[#5C574F]">Total fare</p>
                  <p className="text-4xl font-extrabold text-[#16140F]">₹{estimatedPrice}</p>
                  <p className="mt-2 text-xs text-[#5C574F]">
                    {selectedDestination?.distance} km · {captain.name}
                  </p>
                </div>

                {/* Post-ride Ownly promotion */}
                <div className="mt-6 animate-slide-up">
                  <button
                    type="button"
                    onClick={() => redirectToOwnly("ride_complete_ad")}
                    className="w-full overflow-hidden rounded-2xl border-2 border-[#1C7A4E] bg-white shadow-lg active:scale-[0.99] transition-transform"
                  >
                    <div className="bg-gradient-to-r from-[#E7F4EC] to-white px-4 py-3">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-[#1C7A4E]">
                        🎉 Now that you're here...
                      </p>
                    </div>
                    <div className="p-4">
                      <p className="text-base font-extrabold text-[#16140F]">
                        Get lunch delivered in 30 min
                      </p>
                      <p className="mt-1 text-xs text-[#5C574F]">
                        Zero platform fees · Free delivery above ₹99
                      </p>
                      <div className="mt-3 rounded-xl bg-[#1C7A4E] px-5 py-3 text-sm font-extrabold text-white shadow">
                        Order food now →
                      </div>
                    </div>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleRestart}
                  className="mt-6 w-full max-w-xs rounded-2xl border-2 border-[#EDE9E0] bg-white py-3 text-sm font-bold text-[#5C574F] active:scale-[0.98] transition-transform"
                >
                  Book another ride
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="absolute bottom-0 left-0 right-0 z-30 border-t border-[#EDE9E0] bg-white px-2 pb-6 pt-2 safe-bottom">
        <div className="flex justify-around">
          <NavItem label="Ride" active icon="🚗" />
          <NavItem
            label="Ownly"
            icon="🍽️"
            badge="NEW"
            highlight
            onClick={() => redirectToOwnly("bottom_nav")}
          />
          <NavItem label="Parcel" icon="📦" />
          <NavItem label="Travel" icon="✈️" />
          <NavItem label="You" icon="👤" />
        </div>
      </nav>
    </div>
  );
}

function NavItem({
  label,
  icon,
  active,
  highlight,
  badge,
  onClick,
}: {
  label: string;
  icon: string;
  active?: boolean;
  highlight?: boolean;
  badge?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick && !active}
      className={`relative flex min-w-[62px] flex-col items-center gap-1 px-2 py-1.5 active:scale-95 transition-transform disabled:active:scale-100 ${
        highlight ? "text-[#E91E8C]" : active ? "text-[#16140F]" : "text-[#5C574F]"
      }`}
    >
      {badge && (
        <span className="absolute -right-1 -top-1 rounded-full bg-[#1C7A4E] px-1.5 py-0.5 text-[8px] font-bold text-white animate-pulse-soft">
          {badge}
        </span>
      )}
      <span className="text-2xl">{icon}</span>
      <span className={`text-[10px] ${active || highlight ? "font-extrabold" : "font-semibold"}`}>
        {label}
      </span>
    </button>
  );
}
