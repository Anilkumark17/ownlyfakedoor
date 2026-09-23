"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type BehaviorEvent = {
  type: string;
  at: number;
  [key: string]: any;
};

type Session = {
  id: string;
  riderEmail: string;
  profile: {
    name: string;
    phone: string;
    area: string;
  };
  startedAt: number;
  updatedAt: number;
  exploredOwnly: boolean;
  funnel: Record<string, boolean>;
  events: BehaviorEvent[];
};

type JourneyStep = {
  state: string;
  timestamp: number;
  duration?: number;
};

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function analyzeJourney(events: BehaviorEvent[]): {
  steps: JourneyStep[];
  ownlyTouchpoints: { source: string; timestamp: number }[];
  totalDuration: number;
  completedRide: boolean;
} {
  const steps: JourneyStep[] = [];
  const ownlyTouchpoints: { source: string; timestamp: number }[] = [];
  
  let currentState = "home";
  let stateStartTime = events[0]?.at || Date.now();
  
  steps.push({ state: "home", timestamp: stateStartTime });

  for (const event of events) {
    // Track Ownly interactions
    if (event.type === "banner_click" || event.type === "ride_search_ad_click") {
      const source = event.type === "banner_click" ? "banner" : event.adId || "unknown";
      ownlyTouchpoints.push({ source: String(source), timestamp: event.at });
    }

    // Detect state changes
    let newState: string | null = null;
    
    if (event.type === "search_term") newState = "searching_destination";
    if (event.type === "destination_selected") newState = "vehicle_selection";
    if (event.type === "vehicle_selected") newState = "searching_captain";
    if (event.type === "captain_found") newState = "captain_found";
    if (event.type === "ride_started") newState = "ride_started";
    if (event.type === "ride_complete") newState = "ride_complete";

    if (newState && newState !== currentState) {
      const duration = event.at - stateStartTime;
      steps[steps.length - 1].duration = duration;
      steps.push({ state: newState, timestamp: event.at });
      currentState = newState;
      stateStartTime = event.at;
    }
  }

  const lastEvent = events[events.length - 1];
  if (lastEvent) {
    steps[steps.length - 1].duration = Date.now() - stateStartTime;
  }

  return {
    steps,
    ownlyTouchpoints,
    totalDuration: lastEvent ? lastEvent.at - events[0].at : 0,
    completedRide: steps.some(s => s.state === "ride_complete"),
  };
}

export default function AdminPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [view, setView] = useState<"overview" | "sessions">("overview");
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check authentication
    const auth = localStorage.getItem("ownly_auth");
    if (!auth) {
      router.replace("/login");
      return;
    }

    try {
      const authData = JSON.parse(auth);
      if (authData.role !== "admin") {
        router.replace("/login");
        return;
      }
      setIsAuthenticated(true);
    } catch {
      router.replace("/login");
    }
  }, [router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchSessions = async () => {
      try {
        const res = await fetch("/api/admin/sessions", {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        console.log("Fetched sessions:", data.length);
        setSessions(data);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch sessions:", error);
        setLoading(false);
      }
    };

    fetchSessions();
    const interval = setInterval(fetchSessions, 3000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleLogout = () => {
    localStorage.removeItem("ownly_auth");
    router.push("/login");
  };

  const exportJson = () => {
    const data = sessions.map(s => ({
      ...s,
      journey: analyzeJourney(s.events),
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ownly-behavior-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isAuthenticated || loading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#FAF8F3]">
        <div className="text-center">
          <div className="h-12 w-12 mx-auto rounded-full border-4 border-[#FFC80A] border-t-transparent animate-spin" />
          <p className="mt-4 text-sm font-semibold text-[#5C574F]">
            {!isAuthenticated ? "Checking authentication..." : "Loading sessions..."}
          </p>
        </div>
      </div>
    );
  }

  // Aggregated metrics
  const totalSessions = sessions.length;
  const exploredOwnly = sessions.filter(s => s.exploredOwnly).length;
  const bannerImpressions = sessions.reduce((sum, s) => 
    sum + s.events.filter(e => e.type === "banner_impression").length, 0
  );
  const bannerClicks = sessions.reduce((sum, s) => 
    sum + s.events.filter(e => e.type === "banner_click").length, 0
  );
  const ownlyAdClicks = sessions.reduce((sum, s) => 
    sum + s.events.filter(e => e.type === "ride_search_ad_click").length, 0
  );
  
  const completedRides = sessions.filter(s => 
    analyzeJourney(s.events).completedRide
  ).length;

  return (
    <div className="min-h-dvh bg-[#FAF8F3] text-[#16140F]">
      <header className="sticky top-0 z-20 border-b border-[#EDE9E0] bg-white px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold">Ownly Behavior Analytics</h1>
            <p className="text-[11px] text-[#5C574F]">
              Live · {totalSessions} sessions · Updates every 3s
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setView("overview")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                view === "overview" ? "bg-[#FFC80A]" : "bg-[#FAF8F3] hover:bg-[#F5F3EE]"
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => setView("sessions")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                view === "sessions" ? "bg-[#FFC80A]" : "bg-[#FAF8F3] hover:bg-[#F5F3EE]"
              }`}
            >
              Sessions ({totalSessions})
            </button>
            <button
              type="button"
              onClick={exportJson}
              className="rounded-lg bg-[#1C7A4E] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#16613E] transition-colors"
            >
              Export JSON
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg bg-[#E91E8C] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#C2185B] transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-4">
        {view === "overview" && (
          <div className="space-y-4">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <Stat label="Total Sessions" value={String(totalSessions)} />
              <Stat label="Explored Ownly" value={String(exploredOwnly)} accent />
              <Stat label="Banner CTR" value={`${bannerImpressions ? Math.round(bannerClicks / bannerImpressions * 100) : 0}%`} />
              <Stat label="Ad Clicks" value={String(ownlyAdClicks)} accent />
              <Stat label="Completed Rides" value={String(completedRides)} />
            </div>

            {/* Journey Funnel */}
            <section className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="text-base font-extrabold">Journey Funnel (Rapido Flow)</h2>
              <div className="mt-4 space-y-3">
                {[
                  { label: "Started Session (Home)", count: totalSessions },
                  { label: "Searched Destination", count: sessions.filter(s => s.events.some(e => e.type === "search_term")).length },
                  { label: "Selected Destination", count: sessions.filter(s => s.events.some(e => e.type === "destination_selected")).length },
                  { label: "Selected Vehicle", count: sessions.filter(s => s.events.some(e => e.type === "vehicle_selected")).length },
                  { label: "Found Captain", count: sessions.filter(s => s.events.some(e => e.type === "captain_found")).length },
                  { label: "Started Ride", count: sessions.filter(s => s.events.some(e => e.type === "ride_started")).length },
                  { label: "Completed Ride", count: completedRides },
                  { label: "→ Clicked Ownly", count: exploredOwnly, highlight: true },
                ].map((step, i) => {
                  const percentage = totalSessions ? Math.round((step.count / totalSessions) * 100) : 0;
                  return (
                    <div key={i}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className={step.highlight ? "font-extrabold text-[#E91E8C]" : "font-medium"}>
                          {step.label}
                        </span>
                        <span className="font-bold">
                          {step.count} ({percentage}%)
                        </span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-[#F0EDE6]">
                        <div
                          className={`h-full transition-all duration-500 ${
                            step.highlight ? "bg-[#E91E8C]" : "bg-[#1C7A4E]"
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Ownly Touchpoint Analysis */}
            <section className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="text-base font-extrabold">Ownly Touchpoint Performance</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  { name: "Top Banner", id: "top_banner" },
                  { name: "Home Feed Card", id: "home_feed_card" },
                  { name: "Vehicle Selection Tip", id: "vehicle_selection_snippet" },
                  { name: "Captain Found Ad", id: "captain_found_ad" },
                  { name: "Ride In Progress", id: "ride_in_progress_ad" },
                  { name: "Ride Complete", id: "ride_complete_ad" },
                  { name: "Bottom Nav", id: "bottom_nav" },
                ].map(touchpoint => {
                  const clicks = sessions.reduce((sum, s) => {
                    return sum + s.events.filter(e => 
                      (e.type === "ride_search_ad_click" && e.adId === touchpoint.id) ||
                      (e.type === "banner_click" && touchpoint.id === "top_banner")
                    ).length;
                  }, 0);
                  
                  return (
                    <div key={touchpoint.id} className="rounded-xl bg-[#FAF8F3] p-3">
                      <p className="text-xs font-bold text-[#5C574F]">{touchpoint.name}</p>
                      <p className="text-2xl font-extrabold text-[#E91E8C]">{clicks}</p>
                      <p className="text-[10px] text-[#5C574F]">clicks</p>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {view === "sessions" && (
          <div className="grid gap-4 lg:grid-cols-[350px_1fr]">
            {/* Session List */}
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <h2 className="text-sm font-extrabold">All Sessions</h2>
              <div className="mt-3 max-h-[calc(100vh-200px)] space-y-2 overflow-y-auto">
                {sessions.length === 0 && (
                  <p className="text-xs text-[#5C574F]">No sessions yet</p>
                )}
                {[...sessions].reverse().map((s) => {
                  const journey = analyzeJourney(s.events);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedSession(s)}
                      className={`w-full rounded-xl p-3 text-left transition-colors ${
                        selectedSession?.id === s.id
                          ? "bg-[#FFF8D6] border-2 border-[#FFC80A]"
                          : "bg-[#FAF8F3] hover:bg-[#F5F3EE]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold truncate">{s.profile.name}</p>
                        {s.exploredOwnly && (
                          <span className="text-xs font-bold text-[#1C7A4E]">✓ Ownly</span>
                        )}
                      </div>
                      <p className="mt-1 text-[10px] text-[#5C574F]">
                        {formatTime(s.startedAt)} · {s.events.length} events
                      </p>
                      <p className="text-[10px] font-semibold text-[#E91E8C]">
                        {journey.ownlyTouchpoints.length} Ownly interactions
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Session Detail */}
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              {selectedSession ? (
                <SessionDetail session={selectedSession} />
              ) : (
                <div className="flex h-64 items-center justify-center text-sm text-[#5C574F]">
                  Select a session to view details
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function SessionDetail({ session }: { session: Session }) {
  const journey = analyzeJourney(session.events);
  
  return (
    <div className="space-y-4">
      {/* Session Header */}
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold">Session Details</h3>
          {session.exploredOwnly && (
            <span className="rounded-full bg-[#E7F4EC] px-3 py-1 text-xs font-bold text-[#1C7A4E]">
              ✓ Explored Ownly
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-[#5C574F]">
          {session.profile.name} · {session.profile.phone} · {session.profile.area}
        </p>
        <p className="text-xs text-[#5C574F]">
          Started: {new Date(session.startedAt).toLocaleString()}
        </p>
        <p className="text-xs font-semibold text-[#E91E8C]">
          Total Duration: {formatDuration(journey.totalDuration)}
        </p>
      </div>

      {/* Journey Visualization */}
      <div className="rounded-xl bg-[#FAF8F3] p-4">
        <h4 className="text-sm font-bold">Rapido Journey Timeline</h4>
        <div className="mt-3 space-y-2">
          {journey.steps.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  i === journey.steps.length - 1 ? "bg-[#E91E8C] text-white" : "bg-white border-2 border-[#1C7A4E]"
                }`}>
                  {i + 1}
                </div>
                {i < journey.steps.length - 1 && (
                  <div className="w-0.5 flex-1 bg-[#EDE9E0] my-1" style={{ minHeight: "20px" }} />
                )}
              </div>
              <div className="flex-1 pb-2">
                <p className="text-sm font-bold capitalize">{step.state.replace(/_/g, " ")}</p>
                <p className="text-xs text-[#5C574F]">{formatTime(step.timestamp)}</p>
                {step.duration !== undefined && (
                  <p className="text-xs font-semibold text-[#E91E8C]">
                    Time spent: {formatDuration(step.duration)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ownly Interactions */}
      {journey.ownlyTouchpoints.length > 0 && (
        <div className="rounded-xl bg-gradient-to-br from-[#FFE5F5] to-[#FFF0FA] p-4">
          <h4 className="text-sm font-bold text-[#C2185B]">
            🍽️ Ownly Interactions ({journey.ownlyTouchpoints.length})
          </h4>
          <div className="mt-3 space-y-2">
            {journey.ownlyTouchpoints.map((tp, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
                <span className="text-xs font-semibold">{tp.source}</span>
                <span className="text-xs text-[#5C574F]">{formatTime(tp.timestamp)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Complete Event Log */}
      <div className="max-h-96 overflow-y-auto rounded-xl bg-[#16140F] p-4">
        <h4 className="text-sm font-bold text-white">Complete Event Log ({session.events.length} events)</h4>
        <div className="mt-3 space-y-1 font-mono text-[10px] text-[#E7F4EC]">
          {session.events.map((event, i) => (
            <div key={i} className="border-l-2 border-[#FFC80A] pl-2">
              <span className="text-[#FFC80A]">{formatTime(event.at)}</span>
              <span className="ml-2 font-bold">{event.type}</span>
              {Object.entries(event)
                .filter(([k]) => k !== "type" && k !== "at")
                .map(([k, v]) => (
                  <span key={k} className="ml-2 text-[#B4EB8B]">
                    {k}={String(v)}
                  </span>
                ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-xl p-3 ${accent ? "bg-[#FFC80A]" : "bg-white shadow-sm"}`}>
      <p className="text-[10px] font-bold uppercase text-[#5C574F]">{label}</p>
      <p className="text-xl font-extrabold">{value}</p>
    </div>
  );
}
