"use client";
// Charan, 16 Nov 2026: plans and prices are hidden while the new pricing is finalised (lib/priceDisplay).
// The full plan table is in git history (before branch hide-pricing) if it needs to come back.
import Link from "next/link";
import type { Market } from "../markets";
import { PRICE_FROM_LINE, PRICE_GLOBAL_LINE } from "@/lib/priceDisplay";
import { TRIAL_PACK_PRICE_LABEL, TRIAL_PACK_LINE } from "@/lib/trialPack";

const INCLUDED = [
  "Inbound answering and outbound calling campaigns",
  "11 Indian languages + Spanish, French and Japanese",
  "Both voice engines, R1 and R2",
  "Recordings, transcripts and hot / warm / cold lead scores",
  "Lead alerts on WhatsApp, Slack, email or webhook",
  "Setup on your own script by our team",
];

export default function Pricing({ market, onDemo }: { market: Market; onDemo: (source: string) => void }) {
  const india = market.key === "in";
  return (
    <section id="pricing" className="max-w-[1180px] mx-auto px-5 sm:px-8 py-28 scroll-mt-24" aria-labelledby="pricing-title">
      <div className="text-center max-w-[680px] mx-auto">
        <div className="eyebrow">Pricing</div>
        <h2 id="pricing-title" className="font-display font-semibold tracking-[-0.03em] leading-[1.05] text-[34px] sm:text-[48px] mt-3">Pay only for the calls you make.</h2>
        <p className="font-display text-signal text-[26px] sm:text-[32px] font-semibold mt-5" data-testid="price-from">{india ? PRICE_FROM_LINE : PRICE_GLOBAL_LINE}</p>
        <p className="text-ink-soft text-[16px] mt-3">Tell us roughly how many calls you answer and make, and our team will suggest the right plan for you.</p>
      </div>
      <div className="card card-hi p-7 sm:p-9 mt-12 max-w-[760px] mx-auto">
        <ul className="grid sm:grid-cols-2 gap-3 text-[14.5px]">
          {INCLUDED.map((t) => <li key={t} className="flex gap-2.5"><span className="text-signal">✓</span>{t}</li>)}
        </ul>
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          <button type="button" onClick={() => onDemo("pricing")} className="btn-glow rounded-full px-7 py-3 text-[14px] font-semibold">Book a demo</button>
          <button type="button" onClick={() => onDemo("pricing-quote")} className="btn-ghost rounded-full px-7 py-3 text-[14px] font-semibold">Get the right plan →</button>
        </div>
      </div>
      {india && (
        <Link href="/trial?from=pricing" className="group block max-w-[760px] mx-auto mt-4 rounded-2xl border border-signal/30 bg-signal/[.06] px-5 py-4 hover:border-signal/60 transition-colors" data-testid="pricing-trial">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[15px] font-semibold">Not ready for a plan? Start with the {TRIAL_PACK_PRICE_LABEL} trial pack.</div>
              <div className="text-[13px] text-ink-soft mt-0.5">{TRIAL_PACK_LINE}</div>
            </div>
            <span className="text-signal text-[14px] font-semibold group-hover:translate-x-0.5 transition-transform">Start my trial →</span>
          </div>
        </Link>
      )}
    </section>
  );
}
