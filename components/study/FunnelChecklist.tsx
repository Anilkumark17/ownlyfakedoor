"use client";

import { CHECKLIST, type BehaviorEvent, type FunnelFlags } from "@/lib/funnel";

const tierStyles = {
  critical: "bg-[#FBE7E4] text-[#B23B2E]",
  important: "bg-[#FFF4CC] text-[#8A6D00]",
  useful: "bg-[#E8E6E1] text-[#5C574F]",
} as const;

type Props = {
  funnel: FunnelFlags;
  events: BehaviorEvent[];
};

export function FunnelChecklist({ funnel, events }: Props) {
  return (
    <aside className="w-full max-w-md lg:max-w-sm shrink-0">
      <div className="rounded-2xl border border-[#E8E4DC] bg-white p-4 shadow-sm">
        <h2 className="text-sm font-extrabold text-[#16140F] tracking-tight">
          Live funnel — 10 objectives
        </h2>
        <p className="mt-1 text-xs text-[#5C574F]">
          Rows turn green when the matching interaction is logged.
        </p>
        <ul className="mt-4 space-y-2">
          {CHECKLIST.map((row) => {
            const done = row.isComplete(funnel, events);
            return (
              <li
                key={row.id}
                className={`flex items-start gap-2 rounded-xl px-3 py-2 text-xs transition-colors ${
                  done ? "bg-[#E7F4EC]" : "bg-[#F5F3EE]"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                    done ? "bg-[#1C7A4E] text-white" : "bg-[#D4D0C8] text-[#5C574F]"
                  }`}
                  aria-hidden
                >
                  {done ? "✓" : row.id}
                </span>
                <div className="min-w-0 flex-1">
                  <span
                    className={`mr-1.5 inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${tierStyles[row.tier]}`}
                  >
                    {row.tier}
                  </span>
                  <span className={`font-medium ${done ? "text-[#1C7A4E]" : "text-[#16140F]"}`}>
                    {row.label}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
