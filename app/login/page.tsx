"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "@/lib/constants";
import {
  loadAuth,
  loadRapidoProfile,
  saveAuth,
  saveRapidoProfile,
  type RapidoProfile,
} from "@/lib/storage";

export default function LoginPage() {
  const router = useRouter();
  const [adminOpen, setAdminOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const auth = loadAuth();
    if (auth?.role === "admin") router.replace("/admin");
    else if (auth?.role === "customer") router.replace("/app");
  }, [router]);

  const enterCustomer = () => {
    const saved = loadRapidoProfile();
    const profile: RapidoProfile =
      saved ??
      ({
        name: "Rider",
        phone: "9XXXXXXXXX",
        area: "Gachibowli",
        savedAt: Date.now(),
      } satisfies RapidoProfile);
    if (!saved) saveRapidoProfile(profile);
    saveAuth({
      role: "customer",
      email: `customer_${profile.savedAt}@rapido.local`,
      profile,
    });
    router.push("/app");
  };

  const submitAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (
      email.trim().toLowerCase() !== ADMIN_EMAIL ||
      password !== ADMIN_PASSWORD
    ) {
      setError("Wrong email or password.");
      return;
    }
    saveAuth({ role: "admin", email: ADMIN_EMAIL });
    router.push("/admin");
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[#FFC80A] px-6">
      <div className="w-full max-w-sm">
        <p className="text-center text-3xl font-extrabold tracking-tight text-[#16140F]">
          rapido
        </p>
        <p className="mt-2 text-center text-sm font-medium text-[#16140F]/70">
          Hyderabad
        </p>

        <button
          type="button"
          onClick={enterCustomer}
          className="mt-12 w-full rounded-2xl bg-[#16140F] py-4 text-base font-extrabold text-white shadow-lg active:scale-[0.98] transition-transform"
        >
          Customer
        </button>

        {!adminOpen ? (
          <button
            type="button"
            onClick={() => setAdminOpen(true)}
            className="mt-3 w-full py-3 text-sm font-bold text-[#16140F]/80"
          >
            Admin
          </button>
        ) : (
          <form
            onSubmit={submitAdmin}
            className="mt-4 rounded-2xl bg-white p-4 shadow-lg"
          >
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mb-2 w-full rounded-xl border border-[#E8E4DC] px-4 py-3 text-sm outline-none focus:border-[#FFC80A]"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mb-2 w-full rounded-xl border border-[#E8E4DC] px-4 py-3 text-sm outline-none focus:border-[#FFC80A]"
              required
            />
            {error && <p className="mb-2 text-xs text-[#B23B2E]">{error}</p>}
            <button
              type="submit"
              className="w-full rounded-xl bg-[#16140F] py-3 text-sm font-bold text-white"
            >
              Sign in
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
