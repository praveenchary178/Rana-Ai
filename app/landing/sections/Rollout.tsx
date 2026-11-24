import type { Vertical } from "../verticals";

const STEPS = [
  { t: "Tell it your business", d: "Start from an industry template, add your fees, FAQs and brochure. RANA writes the call playbook for you." },
  { t: "Talk to it", d: "Test your AI employee in the browser or have it call your own phone. Tweak until it sounds right." },
  { t: "Go live", d: "Point your calls at it or launch a campaign to your lead list. Most teams are live within days." },
  { t: "Watch the leads land", d: "Hot leads, follow-ups and every transcript on one dashboard. We review results with you and tune it." },
];

/** Sign-up to live calls, as a numbered timeline. */
export default function Rollout({ vertical: v }: { vertical?: Vertical }) {
  const steps = v ? v.steps : STEPS;
  return (
    <section id="how" className="border-y border-white/[.06] bg-raised/30 scroll-mt-24" aria-labelledby="rollout-title">
      <div className="max-w-[1180px] mx-auto px-5 sm:px-8 py-24">
        <div className="eyebrow">Rollout</div>
        <h2 id="rollout-title" className="font-display font-semibold tracking-[-0.03em] leading-[1.05] text-[34px] sm:text-[48px] mt-3">
          {v ? `Live for your ${v.label.toLowerCase()} business in days.` : "From sign-up to live calls in days."}
        </h2>
        <ol className={`relative mt-16 grid sm:grid-cols-2 ${steps.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4"} gap-10 lg:before:content-[''] lg:before:absolute lg:before:inset-x-0 lg:before:top-[13px] lg:before:h-px lg:before:bg-white/10`}>
          {steps.map((s, i) => (
            <li key={s.t} className="relative">
              <span className="relative z-[1] grid place-items-center w-7 h-7 rounded-full border border-signal/50 bg-paper font-mono text-[12px] text-signal">{i + 1}</span>
              <h3 className="mt-6 font-display text-[19px] font-semibold">{s.t}</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-ink-soft">{s.d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
