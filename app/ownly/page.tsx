"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { OwnlyApp } from "@/components/ownly/OwnlyApp";

function OwnlyFlow() {
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = useState("");
  const source = searchParams.get("from") || searchParams.get("source") || "in_app";

  useEffect(() => {
    const fromQuery = searchParams.get("session") || "";
    const stored = localStorage.getItem("ownly_active_session") || "";
    const sid = fromQuery || stored || `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem("ownly_active_session", sid);
    setSessionId(sid);

    if (!fromQuery && !stored) {
      let profile: Record<string, string> = {
        name: "Direct visitor",
        phone: "",
        area: "Gachibowli",
        username: "direct",
      };
      try {
        const raw = localStorage.getItem("ownly_rapido_profile");
        if (raw) profile = { ...profile, ...JSON.parse(raw) };
      } catch {
        /* ignore */
      }
      void fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sid, profile, startedAt: Date.now() }),
      });
    }

    void fetch("/api/mark-explored", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: sid, source }),
    });
  }, [searchParams, source]);

  if (!sessionId) {
    return <div className="p-6 text-sm">Opening Ownly…</div>;
  }

  return <OwnlyApp sessionId={sessionId} source={source} />;
}

export default function OwnlyPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm">Opening Ownly…</div>}>
      <OwnlyFlow />
    </Suspense>
  );
}
