"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { OWNLY_EXPLORE_URL, STORAGE_KEYS } from "@/lib/constants";
import { isDirectParticipant } from "@/lib/ownly/channel";

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
  const [sessionId, setSessionId] = useState<string>("");
  const [profile, setProfile] = useState({ name: "Rider", phone: "9XXXXXXXXX", area: "Gachibowli", username: "Rider" });
  const [journeyState, setJourneyState] = useState<JourneyState>("home");
  const [topBannerVisible, setTopBannerVisible] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDestination, setSelectedDestination] = useState<typeof DESTINATIONS[0] | null>(null);
  const [selectedRideType, setSelectedRideType] = useState<RideType>("bike");
  const [captain, setCaptain] = useState<{
    name: string;
    rating: string;
    plate: string;
    phone: string;
  } | null>(null);
  const [rideProgress, setRideProgress] = useState(0);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  // Check authentication
  useEffect(() => {
    const auth = localStorage.getItem(STORAGE_KEYS.AUTH);
    if (!auth) {
      router.replace("/login");
      return;
    }

    try {
      const authData = JSON.parse(auth);
      if (authData.role !== "customer") {
        router.replace("/login");
        return;
      }

      const savedProfile = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile) as typeof profile;
        setProfile(parsed);
        if (isDirectParticipant(parsed.username, parsed.name)) {
          router.replace("/ownly?source=direct");
          return;
        }
      }
    } catch {
      router.replace("/login");
    }
  }, [router]);

  // Initialize session
  useEffect(() => {
    if (!profile.username || profile.username === "Rider") return;

    const initSession = async () => {
      try {
        const existing = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
        const sid = existing || `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        setSessionId(sid);
        localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, sid);

        if (existing) {
          console.log("Reusing session:", sid);
          return;
        }

        const response = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: sid,
            profile,
            startedAt: Date.now(),
          }),
        });
        
        const data = await response.json();
        console.log("Session created:", data);
      } catch (error) {
        console.error("Failed to create session:", error);
      }
    };

    initSession();
  }, [profile]);

  const logEvent = async (event: any) => {
    if (!sessionId) {
      console.warn("No session ID, skipping event:", event.type);
      return;
    }
    
    console.log("Logging event:", event.type, sessionId);
    
    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          event: { ...event, at: Date.now() },
        }),
      });
      const data = await response.json();
      console.log("Event logged:", data);
    } catch (error) {
      console.error("Failed to log event:", error);
    }
  };

  useEffect(() => {
    if (topBannerVisible && sessionId) {
      logEvent({ type: "banner_impression" });
    }
  }, [topBannerVisible, sessionId]);

  useEffect(() => {
    if (journeyState === "searching_captain") {
      const timer = setTimeout(() => {
        const randomCaptain = CAPTAIN_NAMES[Math.floor(Math.random() * CAPTAIN_NAMES.length)];
        const captainData = {
          name: randomCaptain,
          rating: (4.5 + Math.random() * 0.4).toFixed(1),
          plate: `TS 09 ${Math.floor(Math.random() * 9000) + 1000}`,
          phone: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        };
        setCaptain(captainData);
        setJourneyState("captain_found");
        logEvent({ 
          type: "captain_found",
          captainName: captainData.name,
          rating: captainData.rating 
        });
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [journeyState, sessionId]);

  useEffect(() => {
    if (journeyState === "ride_started") {
      progressInterval.current = setInterval(() => {
        setRideProgress((prev) => {
          if (prev >= 100) {
            setJourneyState("ride_complete");
            logEvent({ type: "ride_complete" });
            if (progressInterval.current) clearInterval(progressInterval.current);
            return 100;
          }
          return prev + 2;
        });
      }, 60); // 3 seconds total (100 / 2 = 50 steps * 60ms = 3000ms)
      return () => {
        if (progressInterval.current) clearInterval(progressInterval.current);
      };
    }
  }, [journeyState, sessionId]);

  const redirectToOwnly = async (source: string) => {
    if (sessionId) {
      await logEvent({ type: "banner_click" });
      if (source.includes("ad") || source.includes("_snippet") || source.includes("bottom_nav")) {
        await logEvent({ type: "ride_search_ad_click", adId: source });
      }
      await fetch("/api/mark-explored", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, source }),
      });
    }
    localStorage.setItem(STORAGE_KEYS.OWNLY_RAPIDO_ENTRY, String(Date.now()));
    router.push(
      `${OWNLY_EXPLORE_URL}?from=${encodeURIComponent(source)}&session=${encodeURIComponent(sessionId)}`
    );
  };

  const handleDestinationSelect = (dest: typeof DESTINATIONS[0]) => {
    setSelectedDestination(dest);
    setJourneyState("vehicle_selection");
    setSearchQuery("");
    logEvent({ 
      type: "destination_selected", 
      destination: dest.name,
      distance: dest.distance 
    });
  };

  const handleBookRide = () => {
    setJourneyState("searching_captain");
    logEvent({ 
      type: "vehicle_selected", 
      vehicleType: selectedRideType,
      estimatedPrice: estimatedPrice 
    });
  };

  const handleStartRide = () => {
    setJourneyState("ride_started");
    setRideProgress(0);
    logEvent({ type: "ride_started" });
  };

  const handleRestart = () => {
    setJourneyState("home");
    setSelectedDestination(null);
    setCaptain(null);
    setRideProgress(0);
    // Keep showOwnlyInline state so advertisement doesn't reload
    const newSid = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    setSessionId(newSid);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, newSid);
    fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: newSid,
        profile,
        startedAt: Date.now(),
      }),
    });
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

  if (!sessionId) {
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
            <p className="mt-0.5 text-xs font-semibold opacity-80">{profile.area}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem(STORAGE_KEYS.AUTH);
              localStorage.removeItem(STORAGE_KEYS.PROFILE);
              localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
              router.push("/login");
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#16140F] text-sm font-bold text-white shadow-md"
          >
            {profile.name.charAt(0).toUpperCase()}
          </button>
        </div>

        {topBannerVisible && journeyState === "home" && (
          <div className="mt-3 overflow-hidden rounded-2xl bg-gradient-to-r from-[#E91E8C] to-[#C2185B] p-3 shadow-lg animate-slide-down">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 text-2xl">
                🎉
              </div>
              <div className="min-w-0 flex-1 text-white">
                <p className="text-xs font-extrabold leading-tight">Food delivery is here!</p>
                <p className="text-[10px] font-semibold text-[#FFC80A]">
                  Zero fees · 2,847 orders in {profile.area}
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

      <main className="relative z-10 -mt-2 flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-3xl bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-32">
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

          {journeyState === "searching_destination" && (
            <>
              <div className="sticky top-0 z-10 -mx-4 bg-white px-4 pb-3 pt-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setJourneyState("home")}
                    className="text-xl"
                  >
                    ←
                  </button>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (e.target.value.length > 0) {
                        logEvent({ type: "search_term", term: e.target.value });
                      }
                    }}
                    placeholder="Search destination..."
                    autoFocus
                    className="flex-1 rounded-2xl border-2 border-[#EDE9E0] px-4 py-4 text-sm font-semibold outline-none focus:border-[#FFC80A]"
                  />
                </div>
              </div>

              <div className="mt-2 space-y-2">
                {filteredDestinations.map((dest) => (
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
            </>
          )}

          {journeyState === "vehicle_selection" && selectedDestination && (
            <>
              <div className="sticky top-0 z-10 -mx-4 bg-white px-4 pb-3 pt-4">
                <button
                  type="button"
                  onClick={() => setJourneyState("searching_destination")}
                  className="text-xl"
                >
                  ←
                </button>
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <span className="text-lg">📍</span>
                  <span className="font-bold">{selectedDestination.name}</span>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {RIDE_TYPES.map((ride) => {
                  const price =
                    ride.basePrice + Math.round(selectedDestination.distance * ride.perKm);
                  const isSelected = selectedRideType === ride.id;
                  return (
                    <button
                      key={ride.id}
                      type="button"
                      onClick={() => setSelectedRideType(ride.id)}
                      className={`flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-all ${
                        isSelected
                          ? "bg-[#FFF8D6] border-2 border-[#FFC80A] scale-[1.02]"
                          : "bg-[#FAF8F3] border-2 border-transparent active:scale-[0.98]"
                      }`}
                    >
                      <span className="text-4xl">{ride.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-bold">{ride.name}</p>
                        <p className="text-xs text-[#5C574F]">{ride.time} away</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-extrabold">₹{price}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleBookRide}
                  className="w-full rounded-2xl bg-[#FFC80A] py-4 text-base font-extrabold shadow-md active:scale-[0.98] transition-transform"
                >
                  Book {RIDE_TYPES.find((r) => r.id === selectedRideType)?.name} · ₹{estimatedPrice}
                </button>
              </div>
            </>
          )}

          {journeyState === "searching_captain" && (
            <div className="flex min-h-[400px] flex-col items-center justify-center">
              <div className="h-20 w-20 rounded-full border-4 border-[#FFC80A] border-t-transparent animate-spin" />
              <p className="mt-6 text-lg font-bold">Finding your captain...</p>
              <p className="mt-2 text-sm text-[#5C574F]">This will take 2-4 minutes</p>
            </div>
          )}

          {journeyState === "captain_found" && captain && (
            <>
              <div className="mt-4 text-center">
                <p className="text-xl font-extrabold">Captain Found!</p>
              </div>

              <div className="mt-6 rounded-2xl bg-[#FAF8F3] p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#FFC80A] text-2xl font-extrabold">
                    {captain.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-bold">{captain.name}</p>
                    <p className="text-sm text-[#5C574F]">⭐ {captain.rating} · {captain.plate}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleStartRide}
                  className="w-full rounded-2xl bg-[#1C7A4E] py-4 text-base font-extrabold text-white shadow-md active:scale-[0.98] transition-transform"
                >
                  Start Ride
                </button>
              </div>
            </>
          )}

          {journeyState === "ride_started" && captain && selectedDestination && (
            <>
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <p className="text-lg font-extrabold">Ride in progress...</p>
                  <p className="text-sm font-semibold text-[#5C574F]">{rideProgress}%</p>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#F0EDE6]">
                  <div
                    className="h-full bg-[#1C7A4E] transition-all duration-500"
                    style={{ width: `${rideProgress}%` }}
                  />
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-[#FAF8F3] p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-[#5C574F]">
                  Captain
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#FFC80A] text-lg font-extrabold">
                    {captain.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">{captain.name}</p>
                    <p className="text-xs text-[#5C574F]">{captain.plate}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-[#F5F3EE] p-4">
                <p className="text-xs text-[#5C574F] text-center">
                  Your ride is in progress. Sit back and relax! 🚗
                </p>
              </div>
            </>
          )}

          {journeyState === "ride_complete" && (
            <>
              <div className="mt-8 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#1C7A4E] text-4xl">
                  ✓
                </div>
                <p className="mt-4 text-2xl font-extrabold">Ride Complete!</p>
                <p className="mt-2 text-sm text-[#5C574F]">
                  You've reached {selectedDestination?.name}
                </p>
              </div>

              <div className="mt-8 rounded-3xl bg-gradient-to-br from-[#FFE5F5] via-[#FFF0FA] to-white border-2 border-[#F5D0E8] p-6 shadow-lg">
                <div className="text-center">
                  <span className="text-5xl">🍽️</span>
                  <p className="mt-3 text-lg font-extrabold text-[#C2185B]">
                    Perfect timing!
                  </p>
                  <p className="mt-2 text-sm text-[#16140F]">
                    You just finished your ride. Now try Ownly and get food delivered with{" "}
                    <span className="font-extrabold text-[#1C7A4E]">zero fees</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => redirectToOwnly("ride_complete_ad")}
                    className="mt-5 w-full rounded-2xl bg-gradient-to-r from-[#E91E8C] to-[#C2185B] py-4 text-base font-extrabold text-white shadow-md active:scale-[0.98] transition-transform"
                  >
                    Order food on Ownly →
                  </button>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleRestart}
                  className="w-full rounded-2xl bg-[#FAF8F3] py-4 text-sm font-bold text-[#5C574F] active:scale-[0.98] transition-transform"
                >
                  Book another ride
                </button>
              </div>
            </>
          )}
        </div>
      </main>

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
