"use client";

import Image from "next/image";

type PosterProps = {
  onClose: () => void;
  onOrderNow: () => void;
};

export function OwnlyPosterModal({ onClose, onOrderNow }: PosterProps) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/65 p-4 pb-24 backdrop-blur-sm">
      <div className="relative w-full max-w-[360px] animate-screen-forward">
        <div className="relative aspect-[9/16] max-h-[min(75vh,640px)] w-full overflow-hidden rounded-[28px] shadow-2xl">
          <Image
            src="/ownly-poster.png"
            alt="Ownly food delivery on Rapido"
            fill
            className="object-cover object-top"
            priority
          />
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-xl font-bold text-[#16140F] shadow-lg active:scale-90 transition-transform"
          >
            ×
          </button>
          <button
            type="button"
            aria-label="Order now"
            onClick={onOrderNow}
            className="absolute bottom-[5.5%] left-[7%] right-[7%] z-10 h-[11.5%] rounded-full active:scale-[0.96] transition-transform"
          />
        </div>
      </div>
    </div>
  );
}

type StickyProps = {
  onOrderNow: () => void;
};

export function OwnlyStickyBanner({ onOrderNow }: StickyProps) {
  return (
    <div className="absolute bottom-[74px] left-0 right-0 z-30 px-3 animate-screen-forward">
      <button
        type="button"
        onClick={onOrderNow}
        className="w-full overflow-hidden rounded-2xl bg-gradient-to-r from-[#E91E8C] via-[#D81B60] to-[#C2185B] p-4 shadow-xl ring-2 ring-[#FFC80A] active:scale-[0.98] transition-transform"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 text-3xl shadow-inner">
            🍽️
          </div>
          <div className="min-w-0 flex-1 text-left text-white">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#FFC80A]">
              ownly on rapido
            </p>
            <p className="text-sm font-extrabold leading-tight">
              Food delivery, minus the extra charges
            </p>
            <p className="mt-0.5 text-[11px] font-bold text-[#B4EB8B]">
              Zero fees · Free delivery*
            </p>
          </div>
          <div className="shrink-0 rounded-full bg-[#B4EB8B] px-5 py-3 text-sm font-extrabold text-[#16140F] shadow-lg">
            Try now
          </div>
        </div>
        <p className="mt-2 text-center text-[9px] text-white/80">*Above ₹99 · Tap to explore</p>
      </button>
    </div>
  );
}

type RideAdProps = {
  onTryOwnly: () => void;
  bottomOffset: number;
};

export function RideSearchOwnlyAd({ onTryOwnly, bottomOffset }: RideAdProps) {
  return (
    <div
      className="absolute left-3 right-3 z-20 space-y-2.5"
      style={{ bottom: `${bottomOffset}px` }}
    >
      <button
        type="button"
        onClick={onTryOwnly}
        className="w-full overflow-hidden rounded-2xl border-2 border-[#F0D4E8] bg-white shadow-xl active:scale-[0.98] transition-transform"
      >
        <div className="flex items-start gap-3 p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FFE5F5] to-[#FFF0FA] text-2xl shadow-inner">
            🍕
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#C2185B]">
              Sponsored · ownly
            </p>
            <p className="mt-0.5 text-base font-extrabold leading-tight text-[#16140F]">
              Save ₹114 on your usual order
            </p>
            <p className="mt-1 text-xs leading-snug text-[#5C574F]">
              Zero platform fees · Free delivery above ₹99
            </p>
            <span className="mt-2 inline-block rounded-full bg-[#1C7A4E] px-3 py-1.5 text-xs font-extrabold text-white">
              Order food now →
            </span>
          </div>
        </div>
      </button>
    </div>
  );
}
