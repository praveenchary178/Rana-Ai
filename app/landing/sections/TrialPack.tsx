"use client";
import Link from "next/link";
import { TRIAL_PACK_PRICE_LABEL as PRICE, TRIAL_PACK_INCLUDES, TRIAL_CHECKOUT_PATH, TRIAL_PACK_PATH } from "@/lib/trialPack";

/** Homepage offer, right after the highlights: the ₹2,500 trial pack (India). */
export default function TrialPack({ from = "home" }: { from?: string }) {
  return (
    <section id="trial" className="max-w-[1160px] mx-auto px-5 sm:px-8 py-16 scroll-mt-28" aria-labelledby="trial-title">
      <div className="card card-hi relative overflow-hidden p-6 sm:p-10 grid lg:grid-cols-[1.15fr_1fr] gap-8 lg:gap-12 items-center" data-testid="trial-block">
        <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 w-[360px] h-[360px] rounded-full opacity-40 blur-3xl" style={{ background: "radial-gradient(circle, rgb(var(--c-signal) / .45), transparent 65%)" }} />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-signal/40 bg-signal/10 px-3 py-1 text-[12px] font-semibold text-signal">
            <span className="w-1.5 h-1.5 rounded-full bg-signal animate-pulse" aria-hidden />New · Trial pack
          </span>
          <h2 id="trial-title" className="font-display text-[30px] sm:text-[44px] font-semibold tracking-[-0.03em] leading-[1.04] mt-4">
            Stop watching demos.<br /><span className="text-signal">Test it on your real calls.</span>
          </h2>
          <p className="text-ink-soft text-[15.5px] leading-relaxed mt-4 max-w-[540px]">
            Pay {PRICE} once. Our team sets up an AI employee on your script and language, and you put it on real calls: answering your phone or calling your leads. No contract, no auto-renewal.
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-7">
            <Link href={`${TRIAL_CHECKOUT_PATH}?from=${from}`} className="btn-glow rounded-full px-7 py-3.5 text-[15px] font-semibold" data-testid="trial-cta">Start my {PRICE} trial →</Link>
            <Link href={TRIAL_PACK_PATH} className="btn-ghost rounded-full px-6 py-3.5 text-[14.5px] font-medium">What&apos;s in the trial pack</Link>
          </div>
        </div>
        <div className="relative">
          <div className="flex items-end gap-3">
            <span className="font-display text-[56px] sm:text-[64px] leading-none font-semibold tracking-tight">{PRICE}</span>
            <span className="text-ink-soft text-[13.5px] pb-2">one-time</span>
          </div>
          <ul className="grid gap-2.5 mt-5 text-[14.5px]">
            {TRIAL_PACK_INCLUDES.slice(0, 5).map(([t]) => <li key={t} className="flex gap-2.5"><span className="text-signal">✓</span>{t}</li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}
