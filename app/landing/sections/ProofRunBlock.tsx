"use client";
import { art } from "../verticals";

/** The free proof-run offer: we call their old enquiries, free, and send a report. */
export default function ProofRunBlock({ onProof, win }: { onProof: () => void; win?: string }) {
  return (
    <section id="proof-run" className="max-w-[1160px] mx-auto px-5 sm:px-8 pb-24 scroll-mt-28">
      <div className="card card-hi p-6 sm:p-10 grid lg:grid-cols-[1.2fr_1fr] gap-8 items-center" data-testid="proof-block">
        <div>
          <div className="eyebrow">Free proof run</div>
          <h2 className="font-display text-[28px] sm:text-[40px] font-semibold tracking-[-0.025em] leading-[1.06] mt-3">Don&apos;t take our word for it.<br /><span className="text-signal">Test it on your own leads.</span></h2>
          <p className="text-ink-soft text-[15.5px] leading-relaxed mt-4 max-w-[560px]">Send us up to 200 enquiries your team never called back. RANA calls them in their language during permitted hours, and within 5 working days you get a report: who picked up, who&apos;s still interested, and who wants {win ? `${art(win)} ${win}` : "the next step"} — with recordings.</p>
        </div>
        <div className="flex flex-col gap-3">
          <ul className="flex flex-col gap-2 text-[14.5px]">
            {["₹0 — no card, no contract", "Only people who enquired with you", "Anyone who says no is never called again", "Your list stays private"].map((t) => <li key={t} className="flex gap-2.5"><span className="text-signal">✓</span>{t}</li>)}
          </ul>
          <button onClick={onProof} className="btn-glow rounded-full px-6 py-3.5 text-[15px] font-semibold mt-2" data-testid="proof-cta">Start my free proof run →</button>
        </div>
      </div>
    </section>
  );
}
