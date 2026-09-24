"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { OwnlyApp } from "@/components/ownly/OwnlyApp";
import { isDirectParticipant } from "@/lib/ownly/channel";
import { STORAGE_KEYS } from "@/lib/constants";

type Profile = {
  username: string;
  name: string;
  phone: string;
  area: string;
};

function cameFromRapidoFlow(searchParams: URLSearchParams) {
  const from = searchParams.get("from") || searchParams.get("source") || "";
  if (from === "direct") return false;
  if (from && from !== "in_app") return true;
  if (searchParams.get("session")) return true;
  if (localStorage.getItem(STORAGE_KEYS.OWNLY_RAPIDO_ENTRY)) return true;
  return false;
}

function OwnlyFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);

  const querySource = searchParams.get("from") || searchParams.get("source") || "in_app";

  useEffect(() => {
    const authRaw = localStorage.getItem(STORAGE_KEYS.AUTH);
    if (!authRaw) {
      router.replace("/login?entry=direct");
      return;
    }

    try {
      const auth = JSON.parse(authRaw) as { role?: string; username?: string; profile?: Profile };
      if (auth.role !== "customer") {
        router.replace("/login?entry=direct");
        return;
      }

      let loaded: Profile = {
        username: auth.username || "guest",
        name: auth.profile?.name || auth.username || "guest",
        phone: auth.profile?.phone || "",
        area: auth.profile?.area || "Gachibowli",
      };
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (saved) loaded = { ...loaded, ...JSON.parse(saved) };

      const directUser = isDirectParticipant(loaded.username, loaded.name);

      if (!directUser && !cameFromRapidoFlow(searchParams)) {
        router.replace("/app");
        return;
      }

      if (directUser && querySource !== "direct") {
        router.replace("/ownly?source=direct");
        return;
      }

      setProfile(loaded);

      const fromQuery = searchParams.get("session") || "";
      const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION) || "";
      const sid = fromQuery || stored || `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, sid);
      setSessionId(sid);

      const source = directUser ? "direct" : querySource;

      if (!directUser) {
        localStorage.setItem(STORAGE_KEYS.OWNLY_RAPIDO_ENTRY, String(Date.now()));
      }

      if (!fromQuery && !stored) {
        void fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: sid, profile: loaded, startedAt: Date.now() }),
        });
      }

      void fetch("/api/mark-explored", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sid, source }),
      });

      setReady(true);
    } catch {
      router.replace("/login?entry=direct");
    }
  }, [router, searchParams, querySource]);

  if (!ready || !sessionId || !profile) {
    return <div className="p-6 text-sm">Opening Ownly…</div>;
  }

  const directUser = isDirectParticipant(profile.username, profile.name);
  const source = directUser ? "direct" : querySource;

  return (
    <OwnlyApp
      sessionId={sessionId}
      source={source}
      username={profile.username}
      displayName={profile.name}
      isDirectParticipant={directUser}
    />
  );
}

export default function OwnlyPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm">Opening Ownly…</div>}>
      <OwnlyFlow />
    </Suspense>
  );
}
