import { PhoneIcon, ChatIcon, MailIcon } from "@/components/ContactIcons";
import { LEGAL } from "@/app/legal/legal";
import { CONTACT_EMAIL } from "../SiteHeader";

/** Who builds RANA. */
export function About() {
  return (
    <section className="max-w-[1180px] mx-auto px-5 sm:px-8 py-24 border-t border-white/[.06] grid lg:grid-cols-[1.25fr_1fr] gap-8 lg:gap-16" aria-labelledby="about-title">
      <div>
        <div className="eyebrow">Who builds RANA</div>
        <h2 id="about-title" className="font-display font-semibold tracking-[-0.03em] leading-[1.1] text-[28px] sm:text-[38px] mt-3">
          Built in Hyderabad by people who have run sales teams, admissions and franchise operations.
        </h2>
      </div>
      <div className="text-[16px] leading-relaxed text-ink-soft lg:pt-9">
        <p>We know what a missed call costs, because we have chased those leads ourselves. RANA is the teammate we wanted: one that picks up every time, in the customer&apos;s language.</p>
        <p className="mt-4">Our first deployment runs enquiries and outbound campaigns for a medical-entrance coaching network across South India. Full results will be published here as the numbers come in.</p>
      </div>
    </section>
  );
}

/** FAQ: heading on the left, a ruled accordion on the right. */
export function Faq({ items }: { items: [string, string][] }) {
  return (
    <section id="faq" className="max-w-[1180px] mx-auto px-5 sm:px-8 py-24 grid lg:grid-cols-[1fr_1.6fr] gap-10 lg:gap-16 scroll-mt-24" aria-labelledby="faq-title">
      <div className="lg:sticky lg:top-28 lg:self-start">
        <div className="eyebrow">FAQ</div>
        <h2 id="faq-title" className="font-display font-semibold tracking-[-0.03em] leading-[1.05] text-[34px] sm:text-[44px] mt-3">Questions, answered.</h2>
        <p className="text-ink-soft text-[15px] mt-4">Something else? Call sales on <a href={`tel:${LEGAL.phoneTel}`} className="text-ink hover:text-signal tabular-nums">{LEGAL.phone}</a>.</p>
      </div>
      <div className="border-t border-white/[.08]">
        {items.map(([q, a]) => (
          <details key={q} className="group border-b border-white/[.08]">
            <summary className="flex items-center justify-between gap-6 cursor-pointer list-none py-5 text-[16.5px] font-semibold hover:text-signal transition-colors">
              {q}<span className="plus text-ink-soft text-[22px] leading-none transition-transform">+</span>
            </summary>
            <p className="text-ink-soft text-[15px] leading-relaxed pb-6 pr-8">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

const contactItem = "group flex items-start gap-3.5 px-6 py-5 hover:bg-white/[.03] transition-colors";

/** Closing call to action with the three ways to reach sales. */
export function FinalCta({ primary, secondary }: { primary: React.ReactNode; secondary?: React.ReactNode }) {
  return (
    <section className="relative max-w-[1180px] mx-auto px-5 sm:px-8 pt-12 pb-24" aria-labelledby="cta-title">
      <div className="relative text-center pt-20">
        <div className="horizon" aria-hidden />
        <div className="relative">
          <h2 id="cta-title" className="font-display font-semibold display-lg">Got a call<br /><span className="text-signal">you&apos;re missing?</span></h2>
          <p className="text-ink-soft text-[17px] mt-6">Hire your first AI employee. It starts answering this week.</p>
          <div className="flex flex-wrap gap-3 justify-center mt-10">{primary}{secondary}</div>
        </div>
      </div>
      <div className="relative mt-16 grid sm:grid-cols-3 rounded-2xl border border-white/[.08] overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-white/[.08] text-left" data-testid="contact-phone">
        <a href={`tel:${LEGAL.phoneTel}`} className={contactItem} data-testid="contact-call">
          <span className="mt-0.5 text-signal"><PhoneIcon size={18} /></span>
          <span><span className="block text-[13px] text-ink-soft">Call sales</span><span className="block text-[15.5px] font-semibold tabular-nums group-hover:text-signal">{LEGAL.phone}</span><span className="block text-[12.5px] text-ink-soft mt-0.5">{LEGAL.hours}</span></span>
        </a>
        <a href={LEGAL.whatsapp} target="_blank" rel="noopener noreferrer" className={contactItem} data-testid="contact-whatsapp">
          <span className="mt-0.5 text-signal"><ChatIcon size={18} /></span>
          <span><span className="block text-[13px] text-ink-soft">WhatsApp</span><span className="block text-[15.5px] font-semibold group-hover:text-signal">Chat with our team</span><span className="block text-[12.5px] text-ink-soft mt-0.5">Quick replies in working hours</span></span>
        </a>
        <a href={`mailto:${CONTACT_EMAIL}`} className={contactItem} data-testid="contact-email">
          <span className="mt-0.5 text-signal"><MailIcon size={18} /></span>
          <span><span className="block text-[13px] text-ink-soft">Email</span><span className="block text-[15.5px] font-semibold group-hover:text-signal">{CONTACT_EMAIL}</span><span className="block text-[12.5px] text-ink-soft mt-0.5">Reply within 1 working day</span></span>
        </a>
      </div>
    </section>
  );
}
