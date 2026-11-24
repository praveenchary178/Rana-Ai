"use client";
import { type Vertical } from "../verticals";

/** A vertical's own story: its problems, the calls RANA takes, and how it goes live. */
export default function VerticalStory({ v, onProof, onTry }: { v: Vertical; onProof: () => void; onTry: () => void }) {
  return (
    <section id="industries" className="max-w-[1160px] mx-auto px-5 sm:px-8 pb-24 scroll-mt-28" data-testid="vertical-story">
      <div className="max-w-[760px]">
        <div className="eyebrow">The problem in {v.label.toLowerCase()}</div>
        <h2 className="font-display text-[32px] sm:text-[46px] font-semibold tracking-[-0.025em] leading-[1.05] mt-3">Where {v.wins} slip away<br /><span className="text-ink-soft">before anyone notices.</span></h2>
      </div>
      <div className="grid md:grid-cols-3 gap-3 mt-10">
        {v.pains.map((p, i) => (
          <div key={p.t} className="card p-6">
            <div className="text-[12.5px] font-semibold text-hot">Problem {i + 1}</div>
            <div className="font-display text-[19px] font-semibold mt-3 leading-snug">{p.t}</div>
            <p className="text-ink-soft text-[14px] leading-relaxed mt-2">{p.d}</p>
          </div>
        ))}
      </div>
      <div className="max-w-[760px] mt-20">
        <div className="eyebrow">What RANA does for {v.short}</div>
        <h2 className="font-display text-[30px] sm:text-[42px] font-semibold tracking-[-0.025em] leading-[1.05] mt-3">It picks up, it calls back,<br /><span className="text-signal">it books the {v.win}.</span></h2>
      </div>
      <div className="grid md:grid-cols-2 gap-3 mt-10">
        <div className="card p-6">
          <div className="text-[12.5px] font-semibold text-signal">Incoming calls · RANA answers</div>
          <ul className="mt-4 flex flex-col gap-2.5 text-[14.5px]">{v.inbound.map((t) => <li key={t} className="flex gap-2.5"><span className="text-signal">✓</span>{t}</li>)}</ul>
        </div>
        <div className="card p-6">
          <div className="text-[12.5px] font-semibold text-violet">Outgoing calls · RANA dials</div>
          <ul className="mt-4 flex flex-col gap-2.5 text-[14.5px]">{v.outbound.map((t) => <li key={t} className="flex gap-2.5"><span className="text-violet">✓</span>{t}</li>)}</ul>
        </div>
      </div>
      <div className="card mt-3 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-[14.5px]"><b>Hear it first.</b> <span className="text-ink-soft">Play the customer and hear Rana handle a real-style {v.label.toLowerCase()} call — up to 3 minutes, no sign-up.</span></div>
        <div className="flex gap-2 shrink-0">
          <button onClick={onTry} className="btn-ghost rounded-full px-5 py-2.5 text-[14px] font-semibold whitespace-nowrap">Try the demo call</button>
          <button onClick={onProof} className="btn-glow rounded-full px-5 py-2.5 text-[14px] font-semibold whitespace-nowrap">Free proof run →</button>
        </div>
      </div>
    </section>
  );
}
