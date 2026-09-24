"use client";

import { useState, FormEvent, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ADMIN_EMAIL, ADMIN_PASSWORD, STORAGE_KEYS } from "@/lib/constants";
import { DIRECT_PARTICIPANT_USERNAME } from "@/lib/ownly/channel";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const entry = searchParams.get("entry");
  const [mode, setMode] = useState<"select" | "customer" | "admin">("select");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (entry === "direct") setMode("select");
  }, [entry]);

  const handleCustomerLogin = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) {
      setError("Please enter a username");
      return;
    }
    if (trimmed.toLowerCase() === DIRECT_PARTICIPANT_USERNAME) {
      setError('Use "Start Ownly (direct)" on the previous screen for the food-only flow.');
      return;
    }

    const profile = {
      username: trimmed,
      name: trimmed,
      phone: "9XXXXXXXXX",
      area: "Gachibowli",
      savedAt: Date.now(),
    };

    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify({
      role: "customer",
      username: trimmed,
      profile,
    }));
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
    localStorage.removeItem(STORAGE_KEYS.OWNLY_RAPIDO_ENTRY);

    router.push("/app");
  };

  const handleDirectOwnlyLogin = () => {
    const profile = {
      username: DIRECT_PARTICIPANT_USERNAME,
      name: DIRECT_PARTICIPANT_USERNAME,
      phone: "",
      area: "Gachibowli",
      savedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify({
      role: "customer",
      username: DIRECT_PARTICIPANT_USERNAME,
      profile,
    }));
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
    localStorage.removeItem(STORAGE_KEYS.OWNLY_RAPIDO_ENTRY);
    router.push("/ownly?source=direct");
  };

  const handleAdminLogin = (e: FormEvent) => {
    e.preventDefault();
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify({
        role: "admin",
        email: ADMIN_EMAIL,
      }));
      router.push("/admin");
    } else {
      setError("Invalid admin credentials");
    }
  };

  if (mode === "select") {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-[#FFC80A] p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <p className="text-4xl font-extrabold tracking-tight text-[#16140F]">rapido</p>
            <p className="mt-2 text-sm font-semibold text-[#16140F] opacity-70">
              Ownly Research Prototype
            </p>
          </div>

          {entry === "direct" && (
            <p className="mb-4 rounded-xl bg-white/80 px-3 py-2 text-center text-xs font-semibold text-[#16140F]">
              Log in with <strong>Start Ownly (direct)</strong> for food ordering only.
            </p>
          )}

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setMode("customer")}
              className="w-full rounded-2xl bg-[#16140F] px-6 py-4 text-center text-base font-extrabold text-white shadow-lg active:scale-[0.98] transition-transform"
            >
              Start Rapido
            </button>
            <p className="px-1 text-center text-[11px] font-semibold text-[#16140F]/70">
              Ride app first — discover Ownly from banners &amp; ads inside
            </p>
            <button
              type="button"
              onClick={handleDirectOwnlyLogin}
              className="w-full rounded-2xl border-2 border-[#1a8a4a] bg-[#e8f6ee] px-6 py-4 text-center text-base font-extrabold text-[#1a8a4a] active:scale-[0.98] transition-transform"
            >
              Start Ownly (direct)
            </button>
            <p className="px-1 text-center text-[11px] font-semibold text-[#16140F]/70">
              Food ordering UI only — no Rapido ride flow
            </p>
            <button
              type="button"
              onClick={() => setMode("admin")}
              className="w-full rounded-2xl bg-white px-6 py-4 text-center text-base font-extrabold text-[#16140F] shadow-lg active:scale-[0.98] transition-transform"
            >
              Admin Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "customer") {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-[#FFC80A] p-6">
        <div className="w-full max-w-sm">
          <button
            type="button"
            onClick={() => setMode("select")}
            className="mb-4 text-2xl text-[#16140F]"
          >
            ←
          </button>

          <div className="text-center mb-6">
            <p className="text-3xl font-extrabold tracking-tight text-[#16140F]">Rapido</p>
            <p className="mt-2 text-sm font-semibold text-[#16140F] opacity-70">
              Pick a username — you&apos;ll book rides and see Ownly in context
            </p>
          </div>

          <form onSubmit={handleCustomerLogin} className="space-y-4">
            <div>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError("");
                }}
                placeholder="Your username"
                className="w-full rounded-2xl border-2 border-[#16140F] bg-white px-4 py-4 text-base font-semibold text-[#16140F] placeholder:text-[#5C574F] outline-none focus:border-[#E91E8C]"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-sm font-semibold text-[#C2185B]">{error}</p>
            )}

            <button
              type="submit"
              className="w-full rounded-2xl bg-[#16140F] px-6 py-4 text-base font-extrabold text-white shadow-lg active:scale-[0.98] transition-transform"
            >
              Open Rapido app
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center bg-[#16140F] p-6">
      <div className="w-full max-w-sm">
        <button
          type="button"
          onClick={() => setMode("select")}
          className="mb-4 text-2xl text-white"
        >
          ←
        </button>

        <div className="text-center mb-6">
          <p className="text-3xl font-extrabold tracking-tight text-white">Admin Login</p>
          <p className="mt-2 text-sm font-semibold text-[#FFC80A]">
            Analytics Dashboard Access
          </p>
        </div>

        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              placeholder="Email"
              className="w-full rounded-2xl border-2 border-[#FFC80A] bg-[#16140F] px-4 py-4 text-base font-semibold text-white placeholder:text-[#5C574F] outline-none focus:border-[#E91E8C]"
              autoFocus
            />
          </div>

          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              placeholder="Password"
              className="w-full rounded-2xl border-2 border-[#FFC80A] bg-[#16140F] px-4 py-4 text-base font-semibold text-white placeholder:text-[#5C574F] outline-none focus:border-[#E91E8C]"
            />
          </div>

          {error && (
            <p className="text-sm font-semibold text-[#E91E8C]">{error}</p>
          )}

          <button
            type="submit"
            className="w-full rounded-2xl bg-[#FFC80A] px-6 py-4 text-base font-extrabold text-[#16140F] shadow-lg active:scale-[0.98] transition-transform"
          >
            Login to Dashboard
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center bg-[#FFC80A] p-6 text-sm font-semibold">Loading…</div>}>
      <LoginContent />
    </Suspense>
  );
}
