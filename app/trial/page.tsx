import type { Metadata } from "next";
import Link from "next/link";
import "../landing/landing.css";
import "../book-demo/book-demo.css";
import SiteHeader from "../landing/SiteHeader";
import MarketingFooter from "../landing/MarketingFooter";
import { LEGAL } from "../legal/legal";
import { TRIAL_PACK_PRICE_LABEL as TRIAL_PACK_PRICE, TRIAL_PACK_INCLUDES, TRIAL_PACK_PATH } from "@/lib/trialPack";
import TrialForm from "./TrialForm";

export const metadata: Metadata = {
  title: `Start your RANA AI trial pack — ${TRIAL_PACK_PRICE} one-time`,
  description: `Pay ${TRIAL_PACK_PRICE} once and test an AI employee on your real business calls, set up by our team on your script and language. No auto-renewal.`,
  // The checkout. The page Google should rank for the trial pack is /ai-calling-trial.
  alternates: { canonical: TRIAL_PACK_PATH },
  robots: { index: false, follow: true },
};

const STEPS: [title: string, text: string][] = [
  ["Pay once, securely", "UPI, card or netbanking through Razorpay. Takes a minute."],
  ["We set it up on your script", "Your workspace opens the moment you pay, and our team builds your AI employee with you."],
  ["Put it on real calls", "Test it yourself, then let it answer your calls or call your leads."],
];

const FAQ: [q: string, a: string][] = [
  ["Will I be charged again after the trial?", `No. ${TRIAL_PACK_PRICE} is a one-time payment and nothing renews automatically. To continue, our team suggests the plan that fits your calls.`],
  ["When does it start?", "Your workspace opens the moment your payment goes through — no waiting for approval — and our team calls you to set up your AI employee."],
  ["Is the ₹2,500 adjusted in my monthly plan?", "No. The trial pack is a separate one-time payment for testing RANA on your business."],
  ["Do I need to write the script myself?", "No. Tell us how you handle calls today — what customers ask, your prices, your offers — and our team writes the script and builds the AI employee."],
  ["Which languages can it speak?", "Telugu, Hindi, Tamil, Kannada, Malayalam, Marathi, Bengali, Gujarati, Punjabi, Odia and English. It switches language mid-call."],
  ["Do I get an invoice?", "Yes, an invoice is emailed to you as soon as you pay."],
];

/** /trial — the paid trial pack (₹2,500). Promoted from the homepage section and the scroll nudge. */
export default function TrialPage() {
  return (
    <div className="site theme-night min-h-screen">
      <div className="aurora" aria-hidden><div className="bd-grid" /></div>
      <SiteHeader />

      <main className="max-w-[1180px] mx-auto px-5 sm:px-8 pt-12 sm:pt-20 pb-20" data-testid="trial-page">
        <div className="grid lg:grid-cols-[1fr_minmax(0,520px)] gap-12 lg:gap-16 items-start">
          <section className="lg:sticky lg:top-28">
            <p className="bd-chip"><span className="bd-pulse" aria-hidden />Trial pack · India</p>
            <h1 className="font-display text-[40px] sm:text-[56px] font-semibold tracking-[-0.03em] leading-[1.02] mt-5">
              Put an AI employee on<br className="hidden sm:block" /> your <span className="bd-gradient-text">real calls.</span>
            </h1>
            <p className="text-ink-soft text-[16.5px] leading-relaxed mt-5 max-w-[500px]">
              No canned demo. Pay <b className="text-ink">{TRIAL_PACK_PRICE}</b> once, and our team sets up an AI employee on your script so you can test it on your own customers.
            </p>

            <div className="flex items-end gap-3 mt-8">
              <span className="font-display text-[54px] leading-none font-semibold tracking-tight">{TRIAL_PACK_PRICE}</span>
              <span className="text-ink-soft text-[14px] pb-1.5">one-time · no auto-renewal</span>
            </div>

            <ul className="grid sm:grid-cols-2 gap-3 mt-8 max-w-[560px]">
              {TRIAL_PACK_INCLUDES.map(([t, d]) => (
                <li key={t} className="bd-stat">
                  <span className="text-[14.5px] font-semibold"><span className="text-signal mr-1.5">✓</span>{t}</span>
                  <span className="text-[12.5px] text-ink-soft leading-snug">{d}</span>
                </li>
              ))}
            </ul>

            <ol className="bd-steps mt-10" aria-label="How it works">
              {STEPS.map(([title, text], i) => (
                <li key={title}>
                  <span className="bd-step-num">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <div className="text-[15.5px] font-semibold">{title}</div>
                    <div className="text-[14px] text-ink-soft mt-0.5">{text}</div>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section aria-label="Start your trial">
            <TrialForm />
            <p className="text-[13px] text-ink-soft text-center mt-5">
              Rather see it first? <Link href="/book-demo?from=trial" className="text-signal">Book a free demo</Link> or call{" "}
              <a href={`tel:${LEGAL.phoneTel}`} className="text-signal tabular-nums whitespace-nowrap">{LEGAL.phone}</a>.
            </p>
          </section>
        </div>

        <section className="max-w-[820px] mx-auto mt-24" aria-labelledby="trial-faq">
          <h2 id="trial-faq" className="font-display text-[28px] sm:text-[34px] font-semibold tracking-[-0.02em] text-center">Questions about the trial</h2>
          <div className="mt-8 grid gap-3">
            {FAQ.map(([q, a]) => (
              <details key={q} className="card p-5 group">
                <summary className="cursor-pointer text-[15.5px] font-semibold list-none flex justify-between gap-4">{q}<span className="text-signal group-open:rotate-45 transition-transform">+</span></summary>
                <p className="text-ink-soft text-[14.5px] leading-relaxed mt-3">{a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
