import type { Metadata } from "next";
import Link from "next/link";
import "../landing/landing.css";
import "./book-demo.css";
import SiteHeader from "../landing/SiteHeader";
import MarketingFooter from "../landing/MarketingFooter";
import { LEGAL } from "../legal/legal";
import BookDemoForm from "./BookDemoForm";

export const metadata: Metadata = {
  title: "Book a Demo — See RANA AI Answer Your Calls",
  description: "Book a free 20-minute RANA AI demo. We call you back within one working day and show an AI employee answering and calling for a business like yours, in your customers' language.",
  alternates: { canonical: "/book-demo" },
};

const STEPS: [title: string, text: string][] = [
  ["We call you back", "Within one working day, at the time that suits you."],
  ["20 minutes on your calls", "Which calls you miss today and which leads go cold."],
  ["Live demo, your language", "An AI employee handling calls for a business like yours."],
];

const STATS: [value: string, label: string][] = [
  ["20 min", "Demo call"],
  ["< 1 day", "Callback"],
  ["11", "Languages"],
  ["24×7", "AI answers"],
];

/** /book-demo — the one place to book a demo. Every "Book a demo" button on the site links here (see ./link.ts). */
export default function BookDemoPage() {
  return (
    <div className="site theme-night min-h-screen">
      <div className="aurora" aria-hidden><div className="bd-grid" /></div>
      <SiteHeader />

      <main className="max-w-[1180px] mx-auto px-5 sm:px-8 pt-12 sm:pt-20 pb-20" data-testid="book-demo-page">
        <div className="grid lg:grid-cols-[1fr_minmax(0,540px)] gap-12 lg:gap-16 items-start">
          {/* Left: what you get */}
          <section className="lg:sticky lg:top-28">
            <p className="bd-chip"><span className="bd-pulse" aria-hidden />Free demo · No obligation</p>
            <h1 className="font-display text-[40px] sm:text-[56px] font-semibold tracking-[-0.03em] leading-[1.02] mt-5">
              See your AI employee<br className="hidden sm:block" /> take a <span className="bd-gradient-text">real call.</span>
            </h1>
            <p className="text-ink-soft text-[16.5px] leading-relaxed mt-5 max-w-[480px]">
              Tell us about your business in under a minute. We&apos;ll show RANA answering and calling for you, in your customers&apos; language.
            </p>

            <ol className="bd-steps mt-10" aria-label="What happens next">
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

            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-10 max-w-[480px]">
              {STATS.map(([value, label]) => (
                <div key={label} className="bd-stat">
                  <dt className="text-[11.5px] text-ink-soft order-2">{label}</dt>
                  <dd className="font-display text-[19px] font-semibold tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Right: the form */}
          <section aria-label="Book a demo">
            <BookDemoForm />
            <p className="text-[13px] text-ink-soft text-center mt-5">
              Rather talk now? Call <a href={`tel:${LEGAL.phoneTel}`} className="text-signal tabular-nums whitespace-nowrap">{LEGAL.phone}</a>
              {" "}or <Link href="/contact" className="text-signal">see all contact options</Link>.
            </p>
          </section>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
