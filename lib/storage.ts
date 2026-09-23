"use client";

import { STORAGE_KEYS } from "./constants";
import type { BehaviorEvent, FunnelFlags } from "./funnel";
import { applyEvent, createEmptyFunnel } from "./funnel";

export type RapidoProfile = {
  name: string;
  phone: string;
  area: string;
  username?: string;
  savedAt: number;
};

export type AuthState =
  | { role: "customer"; username: string; profile: RapidoProfile }
  | { role: "admin"; email: string };

export type BehaviorSession = {
  id: string;
  riderEmail: string;
  profile: RapidoProfile;
  startedAt: number;
  updatedAt: number;
  exploredOwnly: boolean;
  events: BehaviorEvent[];
  funnel: FunnelFlags;
};

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadRapidoProfile(): RapidoProfile | null {
  if (typeof window === "undefined") return null;
  return safeParse<RapidoProfile | null>(
    localStorage.getItem(STORAGE_KEYS.PROFILE),
    null,
  );
}

export function saveRapidoProfile(profile: RapidoProfile): void {
  localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
}

export function loadAuth(): AuthState | null {
  if (typeof window === "undefined") return null;
  return safeParse<AuthState | null>(localStorage.getItem(STORAGE_KEYS.AUTH), null);
}

export function saveAuth(auth: AuthState): void {
  localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(auth));
}

export function clearAuth(): void {
  localStorage.removeItem(STORAGE_KEYS.AUTH);
}

export function loadAllSessions(): BehaviorSession[] {
  if (typeof window === "undefined") return [];
  return safeParse<BehaviorSession[]>(
    localStorage.getItem(STORAGE_KEYS.SESSIONS),
    [],
  );
}

function persistSessions(sessions: BehaviorSession[]): void {
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
}

export function createSession(profile: RapidoProfile, riderEmail: string): BehaviorSession {
  const session: BehaviorSession = {
    id: `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    riderEmail,
    profile,
    startedAt: Date.now(),
    updatedAt: Date.now(),
    exploredOwnly: false,
    events: [{ type: "session_start", at: Date.now() }],
    funnel: createEmptyFunnel(),
  };
  const all = loadAllSessions();
  all.push(session);
  persistSessions(all);
  localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, session.id);
  return session;
}

export function getActiveSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
}

export function loadActiveSession(): BehaviorSession | null {
  const id = getActiveSessionId();
  if (!id) return null;
  return loadAllSessions().find((s) => s.id === id) ?? null;
}

export function updateSession(
  sessionId: string,
  updater: (s: BehaviorSession) => BehaviorSession,
): BehaviorSession | null {
  const all = loadAllSessions();
  const idx = all.findIndex((s) => s.id === sessionId);
  if (idx === -1) return null;
  const updated = updater({ ...all[idx], updatedAt: Date.now() });
  all[idx] = updated;
  persistSessions(all);
  return updated;
}

export function appendSessionEvent(
  sessionId: string,
  event: BehaviorEvent,
): BehaviorSession | null {
  return updateSession(sessionId, (s) => {
    const funnel = applyEvent(s.funnel, event);
    return {
      ...s,
      funnel,
      events: [...s.events, event],
    };
  });
}

export function markExploredOwnly(sessionId: string): BehaviorSession | null {
  return updateSession(sessionId, (s) => ({
    ...s,
    exploredOwnly: true,
    events: [
      ...s.events,
      {
        type: "explore_ownly",
        at: Date.now(),
        url: "https://how-youth-order-food.netlify.app/",
      },
    ],
  }));
}

export function resetActiveSession(profile: RapidoProfile, riderEmail: string): BehaviorSession {
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
  return createSession(profile, riderEmail);
}
