"use client";

import { QBANK } from "@/lib/ownly/catalog";

export type PendingQ = { id: string; sub?: string };

type Props = {
  queue: PendingQ[];
  onAnswer: (id: string, answer: string, subject: string) => void;
  onSkip: (id: string, subject: string) => void;
};

export function QuestionSheet({ queue, onAnswer, onSkip }: Props) {
  const current = queue[0];
  if (!current) return null;
  const q = QBANK[current.id];
  if (!q) return null;
  const subject = current.sub || "";
  const title = q.title.replace("{sub}", subject);

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40" role="dialog" aria-modal="true">
      <div className="max-h-[85dvh] w-full overflow-y-auto rounded-t-3xl bg-white px-4 pb-6 pt-3 shadow-xl">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#ddd]" />
        <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#E2562B]">{q.kick}</p>
        <h2 className="mt-1 text-lg font-extrabold leading-snug">{title}</h2>
        <p className="mb-3 text-sm text-[#666]">{q.hint}</p>
        <div className="space-y-2">
          {q.opts.map((opt) => (
            <button
              key={opt.v}
              type="button"
              onClick={() => onAnswer(current.id, opt.v, subject)}
              className="flex w-full items-center gap-3 rounded-xl border border-[#eee] bg-[#fafafa] px-3 py-3 text-left text-sm font-semibold"
            >
              <span aria-hidden>{opt.e}</span>
              <span>{opt.l}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onSkip(current.id, subject)}
          className="mt-3 w-full py-2 text-sm font-semibold text-[#888]"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
