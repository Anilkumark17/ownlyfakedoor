"use client";

import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ADMIN_EMAIL, ADMIN_PASSWORD, STORAGE_KEYS } from "@/lib/constants";
import { DIRECT_PARTICIPANT_USERNAME } from "@/lib/ownly/channel";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/app";
  const [mode, setMode] = useState<"select" | "customer" | "admin">("select");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleCustomerLogin = (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("Please enter a username");
      return;
    }

    // Store auth and profile
    const profile = {
      username: username.trim(),
      name: username.trim(),
      phone: "9XXXXXXXXX",
      area: "Gachibowli",
      savedAt: Date.now(),
    };

    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify({
      role: "customer",
      username: username.trim(),
      profile,
    }));
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);

    router.push(nextPath.startsWith("/") ? nextPath : "/app");
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

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setMode("customer")}
              className="w-full rounded-2xl bg-[#16140F] px-6 py-4 text-center text-base font-extrabold text-white shadow-lg active:scale-[0.98] transition-transform"
            >
              Continue as Customer
            </button>
            <button
              type="button"
              onClick={() => setMode("admin")}
              className="w-full rounded-2xl bg-white px-6 py-4 text-center text-base font-extrabold text-[#16140F] shadow-lg active:scale-[0.98] transition-transform"
            >
              Admin Login
            </button>
            <button
              type="button"
              onClick={handleDirectOwnlyLogin}
              className="w-full rounded-2xl border-2 border-[#16140F] bg-transparent px-6 py-4 text-center text-base font-extrabold text-[#16140F] active:scale-[0.98] transition-transform"
            >
              Ownly direct (username: direct)
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
            <p className="text-3xl font-extrabold tracking-tight text-[#16140F]">Welcome</p>
            <p className="mt-2 text-sm font-semibold text-[#16140F] opacity-70">
              Enter a unique username to start
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
              {nextPath === "/ownly" ? "Log in to Ownly" : "Start Experience"}
            </button>
            <button
              type="button"
              onClick={handleDirectOwnlyLogin}
              className="w-full rounded-2xl border-2 border-[#16140F] bg-white px-6 py-3 text-sm font-extrabold text-[#16140F]"
            >
              Or continue as direct
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Admin mode
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
