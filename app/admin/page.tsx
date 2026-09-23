"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { computeOverallAnalysis } from "@/lib/analytics";
import {
  clearAuth,
  loadAllSessions,
  loadAuth,
} from "@/lib/storage";

export default function AdminPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState(() => loadAllSessions());
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const auth = loadAuth();
    if (!auth || auth.role !== "admin") {
      router.replace("/login");
      return;
    }
    const id = window.setInterval(() => {
      setSessions(loadAllSessions());
      setTick((t) => t + 1);
    }, 2000);
    return () => clearInterval(id);
  }, [router]);

  const a = useMemo(() => computeOverallAnalysis(sessions), [sessions, tick]);

  const logout = () => {
    clearAuth();
    router.replace("/login");
  };

  const bannerCtr = a.bannerImpressions
    ? Math.round((a.bannerClicks / a.bannerImpressions) * 100)
    : 0;

  return (
    <div className="min-h-dvh bg-[#FAF8F3] text-[#16140F]">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E8E4DC] bg-white px-4 py-3">
        <div>
          <h1 className="text-lg font-extrabold">Overall analysis</h1>
          <p className="text-[11px] text-[#5C574F]">
            Live · refreshes every 2s · {a.sessionCount} sessions
          </p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="rounded-full bg-[#16140F] px-4 py-2 text-xs font-bold text-white"
        >
          Log out
        </button>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 p-4 pb-10">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Sessions" value={String(a.sessionCount)} />
          <Stat label="Unique riders" value={String(a.uniqueRiders)} />
          <Stat label="Banner CTR" value={`${bannerCtr}%`} accent />
          <Stat label="Order attempts" value={String(a.orderAttempts)} accent />
          <Stat label="Explored Ownly" value={String(a.exploredOwnlyCount)} />
          <Stat label="Ride ads clicked" value={String(a.adClicks)} />
          <Stat label="Express picks" value={String(a.expressSelections)} />
          <Stat label="Waitlists" value={String(a.waitlistSubmits)} />
        </div>

        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="text-sm font-extrabold">Funnel objectives</h2>
          <ul className="mt-3 space-y-2">
            {a.objectiveRates.map((o) => (
              <li key={o.id}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="font-medium">{o.label}</span>
                  <span className="font-bold">{o.rate}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#F0EDE6]">
                  <div
                    className="h-full rounded-full bg-[#1C7A4E] transition-all duration-500"
                    style={{ width: `${o.rate}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <div className="grid gap-4 sm:grid-cols-2">
          <section className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="text-sm font-extrabold">Top cravings</h2>
            {a.searchTerms.length === 0 ? (
              <p className="mt-2 text-xs text-[#5C574F]">No searches yet.</p>
            ) : (
              <ul className="mt-2 space-y-1">
                {a.searchTerms.map((t) => (
                  <li
                    key={t.term}
                    className="flex justify-between text-xs font-medium"
                  >
                    <span>{t.term}</span>
                    <span className="text-[#5C574F]">{t.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="text-sm font-extrabold">Coverage gaps</h2>
            {a.missTerms.length === 0 ? (
              <p className="mt-2 text-xs text-[#5C574F]">No misses yet.</p>
            ) : (
              <ul className="mt-2 space-y-1">
                {a.missTerms.map((t) => (
                  <li
                    key={t.term}
                    className="flex justify-between text-xs font-medium text-[#B23B2E]"
                  >
                    <span>{t.term}</span>
                    <span>{t.count}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-[11px] text-[#5C574F]">
              Substitute: {a.substituteCount} · Notify on miss:{" "}
              {a.waitlistFromMissCount}
            </p>
          </section>
        </div>

        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="text-sm font-extrabold">Trust & retention signals</h2>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-xl bg-[#E7F4EC] p-3">
              <p className="text-2xl font-extrabold text-[#1C7A4E]">{a.captainUp}</p>
              <p className="font-medium">Captain 👍</p>
            </div>
            <div className="rounded-xl bg-[#FBE7E4] p-3">
              <p className="text-2xl font-extrabold text-[#B23B2E]">{a.captainDown}</p>
              <p className="font-medium">Captain 👎</p>
            </div>
            <div className="rounded-xl bg-[#FFF8D6] p-3">
              <p className="text-2xl font-extrabold">{a.repeatYes}</p>
              <p className="font-medium">Order again · Yes</p>
            </div>
          </div>
          <p className="mt-2 text-center text-[11px] text-[#5C574F]">
            Banner dismissed without food: {a.bannerDismisses} · Impressions:{" "}
            {a.bannerImpressions}
          </p>
        </section>
      </main>
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
    <div
      className={`rounded-xl p-3 ${accent ? "bg-[#FFC80A]" : "bg-white shadow-sm"}`}
    >
      <p className="text-[10px] font-bold uppercase text-[#5C574F]">{label}</p>
      <p className="text-xl font-extrabold">{value}</p>
    </div>
  );
}
