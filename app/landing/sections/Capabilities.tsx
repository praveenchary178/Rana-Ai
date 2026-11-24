import Integrations from "@/components/Integrations";

const featuresFor = (india: boolean) => [
  { k: "inbound", t: "Answers every call, 24×7", d: "After hours, during the rush, on Sundays. It picks up in the caller's language, answers from your own knowledge, and captures their details." },
  { k: "outbound", t: "Calls your lead lists", d: `Upload a list and launch a campaign. Your AI employee dials, follows up and books the next step — ${india ? "no telecaller hiring" : "no extra hiring"}.` },
  { k: "qualify", t: "Hot · warm · cold, automatically", d: "Every call is recorded, transcribed, summarised and scored. Your team opens the dashboard and calls the ready-to-close leads first." },
  { k: "voice", t: "A voice that sounds like you", d: `Pick from ${india ? "natural Indian voices" : "900+ natural voices"} or clone your own, and set the tone — warm counsellor, crisp sales, patient support.` },
  { k: "control", t: "You're in control", d: "Change the script, voice and knowledge yourself, and test it in the browser before a single customer hears it." },
  { k: "numbers", t: india ? "Your number, or ours" : "Local numbers", d: india ? "Start on a shared Indian number, take your own, or forward the number your customers already call." : "US numbers are ready now; UK, UAE, Europe and Japan on request. Or forward the number you already have." },
];

/** What one AI employee does, as a ruled grid rather than a wall of cards; then the integrations. */
export default function Capabilities({ india }: { india: boolean }) {
  return (
    <section className="max-w-[1180px] mx-auto px-5 sm:px-8 py-28" aria-labelledby="capabilities-title">
      <div className="max-w-[720px]">
        <div className="eyebrow">What you get</div>
        <h2 id="capabilities-title" className="font-display font-semibold tracking-[-0.03em] leading-[1.05] text-[34px] sm:text-[48px] mt-3">
          One AI employee. <span className="text-ink-soft">Every call your team can&apos;t get to.</span>
        </h2>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-12 mt-16">
        {featuresFor(india).map((f, i) => (
          <div key={f.k} className="pt-6 border-t border-white/[.09]">
            <div className="font-mono text-[12px] text-ink-soft">{String(i + 1).padStart(2, "0")}</div>
            <h3 className="mt-3 font-display text-[20px] font-semibold tracking-[-0.01em]">{f.t}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{f.d}</p>
          </div>
        ))}
      </div>
      <div className="mt-16"><Integrations /></div>
      <div className="flex flex-wrap items-center gap-2 mt-5 text-[12.5px]">
        <span className="font-medium text-ink-soft mr-1">Coming next</span>
        {["WhatsApp follow-ups to customers", "Two-way CRM sync", "Predictive lead scoring"].map((t) => <span key={t} className="rounded-full border border-white/10 px-3 py-1 text-ink-soft">{t}</span>)}
      </div>
    </section>
  );
}
