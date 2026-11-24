import { PhoneIcon, ChatIcon } from "@/components/ContactIcons";

/** "The gap" statement, then how RANA closes it: answer → qualify → hand off, each with a small product visual. */
export default function ProductFlow() {
  return (
    <section id="product" className="max-w-[1180px] mx-auto px-5 sm:px-8 py-28 scroll-mt-24">
      <div className="grid lg:grid-cols-[1.25fr_1fr] gap-8 lg:gap-16 items-end">
        <h2 className="font-display font-semibold tracking-[-0.035em] leading-[1.03] text-[36px] sm:text-[54px]">
          Every missed call is a customer <span className="text-ink-soft">who called someone else.</span>
        </h2>
        <div className="text-[16px] leading-relaxed">
          <p className="text-ink-soft">A call after hours, during a rush, or in a language the front desk isn&apos;t fluent in — it just doesn&apos;t get answered. Nobody finds out what that lead was worth.</p>
          <p className="mt-4">RANA picks up every one, understands what the caller wants, and turns it into a lead your team can close.</p>
        </div>
      </div>

      <ol className="relative mt-20 grid md:grid-cols-3 gap-12 md:gap-6 md:before:content-[''] md:before:absolute md:before:inset-x-0 md:before:top-[13px] md:before:h-px md:before:bg-white/10">
        <Step n={1} title="Answers, in their language" body="Every inbound call picked up on the first ring — or your lead list dialled for you — in the caller's language, switching when they do.">
          <div className="flex items-center justify-between text-[12px] text-ink-soft"><span>Incoming call</span><span className="font-mono">11:42 PM</span></div>
          <div className="mt-3 flex items-center gap-3">
            <span className="grid place-items-center w-9 h-9 rounded-full bg-signal/15 text-signal"><PhoneIcon size={16} /></span>
            <div><div className="font-mono text-[13.5px] tabular-nums">+91 ••••• 30417</div><div className="text-[12px] text-ink-soft">Telugu · after hours</div></div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-[12.5px] text-signal"><span className="w-1.5 h-1.5 rounded-full bg-signal live-dot" aria-hidden />Answered by Rana</div>
        </Step>
        <Step n={2} title="Qualifies every lead" body="Each call is recorded, transcribed, summarised and scored hot, warm or cold — from what the caller actually said.">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[12.5px]">
            <dt className="text-ink-soft">Intent</dt><dd className="text-right">Site visit this weekend</dd>
            <dt className="text-ink-soft">Budget</dt><dd className="text-right">₹1–1.5 Cr</dd>
            <dt className="text-ink-soft">Timeline</dt><dd className="text-right">This month</dd>
          </dl>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-[12px] text-ink-soft">Lead score</span>
            <span className="flex gap-1 text-[11.5px] font-semibold">
              <span className="rounded-full bg-hot/15 text-hot px-2 py-0.5">Hot</span>
              <span className="rounded-full text-ink-soft/50 px-2 py-0.5">Warm</span>
              <span className="rounded-full text-ink-soft/50 px-2 py-0.5">Cold</span>
            </span>
          </div>
        </Step>
        <Step n={3} title="Hands off to your team" body="The moment the call ends, hot leads land on WhatsApp, Slack, email or your CRM — with the summary, score and recording.">
          <div className="flex items-center gap-2 text-[12px] text-ink-soft"><span className="grid place-items-center w-5 h-5 rounded-md bg-signal/15 text-signal"><ChatIcon size={12} /></span>WhatsApp · now</div>
          <p className="mt-3 text-[13.5px] leading-snug"><b>Hot lead:</b> Kiran wants a site visit on Sunday at 4 PM.</p>
          <p className="mt-2 text-[12.5px] text-ink-soft">Summary, score and recording attached.</p>
        </Step>
      </ol>
    </section>
  );
}

function Step({ n, title, body, children }: { n: number; title: string; body: string; children: React.ReactNode }) {
  return (
    <li className="relative">
      <span className="relative z-[1] grid place-items-center w-7 h-7 rounded-full border border-signal/50 bg-paper font-mono text-[12px] text-signal">{n}</span>
      <h3 className="mt-6 font-display text-[21px] font-semibold tracking-[-0.01em]">{title}</h3>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{body}</p>
      <div className="mt-6 rounded-2xl border border-white/[.08] bg-raised/50 p-4">{children}</div>
    </li>
  );
}
