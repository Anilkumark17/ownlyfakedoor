"use client";

import Image from "next/image";

type Props = {
  areaLabel: string;
  addressLine: string;
  onSearchRide: () => void;
  onQuickBook: () => void;
  onNavOwnly: () => void;
  rideSearching: boolean;
};

const RECENTS = [
  {
    title: "IIIT HYDERABAD",
    sub: "Gachibowli Main Road, Near, Professor CR Rao Rd",
  },
  { title: "BAKUL NIVAS", sub: "Indian Institute of Information Technology" },
  {
    title: "Saras India Systems Pvt. Ltd.",
    sub: "Gachibowli, Hyderabad, Telangana 500032",
  },
];

export function RapidoRideHome({
  areaLabel,
  addressLine,
  onSearchRide,
  onQuickBook,
  onNavOwnly,
  rideSearching,
}: Props) {
  return (
    <div className="flex h-full flex-col bg-[#ECEAE4]">
      <div className="relative h-[32%] min-h-[140px] shrink-0">
        <Image
          src="/rapido-home-map.png"
          alt=""
          fill
          className="object-cover object-top"
          priority
        />
        <div className="absolute left-3 right-3 top-10">
          <div className="flex items-start gap-2 rounded-xl bg-white px-3 py-2.5 shadow-md">
            <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#1C7A4E]" />
            <p className="line-clamp-2 text-[11px] font-semibold leading-snug text-[#16140F]">
              {addressLine}
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-10 -mt-5 flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-[24px] bg-white shadow-[0_-8px_32px_rgba(0,0,0,0.12)]">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-40">
          <div className="px-4 pt-4">
            <button
              type="button"
              onClick={onSearchRide}
              className="flex w-full items-center gap-3.5 rounded-2xl border border-[#EDE9E0] bg-white px-4 py-4 text-left shadow-[0_3px_16px_rgba(0,0,0,0.08)] active:scale-[0.99] transition-transform"
            >
              <span className="text-xl text-[#5C574F]">⌕</span>
              <span className="text-[15px] font-semibold text-[#16140F]">
                Where do you want to go?
              </span>
            </button>
            <div className="mx-1.5 mt-1.5 h-1 rounded-full bg-[#FFC80A]" />
          </div>

          <ul className="mt-2 px-2">
            {RECENTS.map((place, i) => (
              <li key={place.title}>
                <button
                  type="button"
                  onClick={onSearchRide}
                  className="flex w-full items-start gap-3 border-b border-[#F3F1EC] px-2 py-3.5 text-left active:bg-[#FAF8F3]"
                >
                  <span className="mt-0.5 text-[#5C574F]">
                    <HistoryIcon />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold text-[#16140F]">
                      {place.title}
                    </p>
                    <p className="line-clamp-2 text-[11px] leading-snug text-[#5C574F]">
                      {place.sub}
                    </p>
                  </div>
                  <span className="text-[#C2185B]">
                    <HeartIcon />
                  </span>
                </button>

                {i === 0 && (
                  <div className="mx-2 mb-2.5 flex items-center gap-3 rounded-2xl bg-gradient-to-br from-[#FFF8D6] to-[#FFEFB3] px-3.5 py-3.5 shadow-sm">
                    <div className="flex h-13 w-13 items-center justify-center rounded-xl bg-white text-2xl shadow-inner">
                      🛺
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-medium text-[#5C574F]">
                        Quick booking{" "}
                        <span className="font-extrabold text-[#16140F]">Auto</span>
                      </p>
                      <p className="text-base font-extrabold text-[#16140F]">₹114</p>
                    </div>
                    <button
                      type="button"
                      onClick={onQuickBook}
                      className="rounded-xl bg-[#FFC80A] px-5 py-2.5 text-sm font-extrabold text-[#16140F] shadow-md active:scale-95 transition-transform"
                    >
                      Book
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>

          {rideSearching && (
            <div className="mx-4 mb-3 animate-slide-up rounded-2xl bg-[#FFF8D6] px-4 py-3.5 shadow-sm">
              <p className="text-xs font-extrabold tracking-wide text-[#16140F] animate-pulse-soft">
                Finding your Auto…
              </p>
              <p className="mt-0.5 text-[11px] text-[#5C574F]">{areaLabel}</p>
            </div>
          )}

          <div className="px-4 pb-4">
            <p className="text-center text-[13px] font-extrabold text-[#16140F]">
              Everything in minutes
            </p>
            <div className="mt-3 flex gap-2">
              <div className="relative min-h-[120px] flex-1 overflow-hidden rounded-2xl bg-[#E8F4FC] p-3">
                <span className="inline-block rounded-md bg-[#1C7A4E] px-2 py-0.5 text-[10px] font-bold text-white">
                  Starts at ₹20
                </span>
                <p className="mt-2 text-sm font-extrabold">Bike Lift</p>
                <p className="text-[10px] font-medium text-[#5C574F]">
                  Affordable guaranteed rides
                </p>
                <span className="absolute bottom-2 right-2 text-3xl">🏍️</span>
              </div>
              <div className="flex w-[38%] flex-col gap-2">
                <div className="flex flex-1 flex-col justify-end rounded-2xl bg-[#F5F3EE] p-2.5">
                  <p className="text-xs font-extrabold">Metro</p>
                  <span className="self-end text-2xl">🚇</span>
                </div>
                <button
                  type="button"
                  className="rounded-2xl bg-[#F5F3EE] py-2.5 text-xs font-extrabold"
                >
                  More
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

          <nav className="absolute bottom-0 left-0 right-0 z-20 border-t border-[#EDE9E0] bg-white px-2 pb-6 pt-2 safe-bottom">
        <div className="flex justify-around">
          <NavItem label="Ride" active icon={<RideIcon />} />
          <NavItem label="Ownly" icon={<OwnlyIcon />} onClick={onNavOwnly} highlight />
          <NavItem label="Parcel" icon={<ParcelIcon />} />
          <NavItem label="Travel" icon={<TravelIcon />} />
          <NavItem label="Profile" icon={<ProfileIcon />} />
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
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  highlight?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`flex min-w-[56px] flex-col items-center gap-0.5 px-1 py-1.5 active:scale-95 transition-transform disabled:active:scale-100 ${
        highlight ? "text-[#E91E8C]" : active ? "text-[#16140F]" : "text-[#5C574F]"
      }`}
    >
      <span className={active ? "opacity-100" : "opacity-80"}>{icon}</span>
      <span className={`text-[10px] ${active ? "font-extrabold" : "font-semibold"}`}>
        {label}
      </span>
    </button>
  );
}

function HistoryIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 8v4l3 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 21s-7-4.5-9-9a5 5 0 019-2 5 5 0 019 2c-2 4.5-9 9-9 9z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function RideIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 12l16-8-6 16-2-6-8-2z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function OwnlyIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 11V8a2 2 0 114 0v3M6 11h12v2a4 4 0 01-4 4h-4a4 4 0 01-4-4v-2z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ParcelIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 8l8-4 8 4v8l-8 4-8-4V8z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TravelIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="5" y="8" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 8V6a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M5 20c1.5-3 4-4.5 7-4.5s5.5 1.5 7 4.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
