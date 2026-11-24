import type { Metadata } from "next";
import Link from "next/link";
import "../landing/landing.css";
import SiteHeader from "../landing/SiteHeader";
import MarketingFooter from "../landing/MarketingFooter";
import { PhoneIcon, ChatIcon, MailIcon } from "@/components/ContactIcons";
import { LEGAL, SOCIAL_LINKS } from "../legal/legal";

export const metadata: Metadata = {
  title: "Contact RANA AI — Call, WhatsApp or Email Our Team",
  description: `Talk to RANA AI in Hyderabad. Call or WhatsApp sales on ${LEGAL.phone} (${LEGAL.hours}), email ${LEGAL.salesEmail} for demos and pricing, or ${LEGAL.email} for support.`,
  alternates: { canonical: "/contact" },
};

type Channel = { icon: React.ReactNode; label: string; value: string; note: string; href: string; external?: boolean; id: string };

const PRIMARY: Channel[] = [
  { id: "call", icon: <PhoneIcon size={20} />, label: "Call sales", value: LEGAL.phone, note: LEGAL.hours, href: `tel:${LEGAL.phoneTel}` },
  { id: "whatsapp", icon: <ChatIcon size={20} />, label: "WhatsApp", value: "Chat with our team", note: "Quick replies in working hours", href: LEGAL.whatsapp, external: true },
  { id: "email", icon: <MailIcon size={20} />, label: "Sales & demos", value: LEGAL.salesEmail, note: "Pricing, demos and new business", href: `mailto:${LEGAL.salesEmail}` },
];

const MORE: Channel[] = [
  { id: "support", icon: <MailIcon size={18} />, label: "Customer support", value: LEGAL.email, note: "Help with your account, calls and AI employees", href: `mailto:${LEGAL.email}` },
  { id: "billing", icon: <MailIcon size={18} />, label: "Billing", value: LEGAL.billingEmail, note: "Invoices, payments, refunds and cancellations", href: `mailto:${LEGAL.billingEmail}` },
];

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: "Contact RANA AI",
  url: `${LEGAL.site}/contact`,
  mainEntity: {
    "@type": "Organization",
    "@id": `${LEGAL.site}/#org`,
    name: LEGAL.brand,
    url: LEGAL.site,
    email: LEGAL.salesEmail,
    telephone: LEGAL.phoneTel,
    address: { "@type": "PostalAddress", addressLocality: "Hyderabad", addressRegion: "Telangana", addressCountry: "IN" },
    contactPoint: [
      { "@type": "ContactPoint", contactType: "sales", telephone: LEGAL.phoneTel, email: LEGAL.salesEmail, availableLanguage: ["English", "Hindi", "Telugu"] },
      { "@type": "ContactPoint", contactType: "customer support", email: LEGAL.email },
      { "@type": "ContactPoint", contactType: "billing support", email: LEGAL.billingEmail },
    ],
  },
};

function linkProps(c: Channel) {
  return c.external ? { target: "_blank", rel: "noopener noreferrer" } : {};
}

export default function ContactPage() {
  return (
    <div className="site theme-night min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
      <SiteHeader />
      <main className="max-w-[1080px] mx-auto px-5 sm:px-8 pt-14 sm:pt-20 pb-16" data-testid="contact-page">
        <header className="max-w-[680px]">
          <p className="eyebrow">Contact</p>
          <h1 className="font-display text-[38px] sm:text-[52px] font-semibold tracking-[-0.025em] leading-[1.05] mt-3">
            Talk to the <span className="text-signal">RANA AI</span> team
          </h1>
          <p className="text-ink-soft text-[16.5px] leading-relaxed mt-5">
            Questions about pricing, a demo for your business, or help with your account — call, WhatsApp or email us.
            We reply to every message within 1 working day.
          </p>
        </header>

        {/* Main ways to reach us */}
        <section aria-label="Ways to reach us" className="grid md:grid-cols-3 gap-3 mt-12" data-testid="contact-phone">
          {PRIMARY.map((c) => (
            <a key={c.id} href={c.href} {...linkProps(c)} className="card group p-6 flex flex-col gap-4 hover:border-signal/40 transition-colors" data-testid={`contact-${c.id}`}>
              <span className="w-11 h-11 rounded-xl bg-signal/10 text-signal grid place-items-center">{c.icon}</span>
              <span>
                <span className="block text-[13px] text-ink-soft">{c.label}</span>
                <span className="block font-display text-[19px] font-semibold mt-1 tabular-nums break-all group-hover:text-signal">{c.value}</span>
                <span className="block text-[13px] text-ink-soft mt-1">{c.note}</span>
              </span>
            </a>
          ))}
        </section>

        {/* Support, billing, location */}
        <section className="grid lg:grid-cols-[1fr_1fr_1.1fr] gap-3 mt-3">
          {MORE.map((c) => (
            <a key={c.id} href={c.href} className="card group p-5 flex items-start gap-3.5 hover:border-signal/40 transition-colors" data-testid={`contact-${c.id}`}>
              <span className="mt-0.5 text-signal">{c.icon}</span>
              <span className="min-w-0">
                <span className="block text-[13px] text-ink-soft">{c.label}</span>
                <span className="block text-[15.5px] font-semibold mt-0.5 break-all group-hover:text-signal">{c.value}</span>
                <span className="block text-[12.5px] text-ink-soft mt-1">{c.note}</span>
              </span>
            </a>
          ))}
          <div className="card p-5" data-testid="contact-office">
            <span className="block text-[13px] text-ink-soft">Office</span>
            <span className="block text-[15.5px] font-semibold mt-0.5">Hyderabad, Telangana, India</span>
            <span className="block text-[12.5px] text-ink-soft mt-1">Sales hours: {LEGAL.hours}. Your AI employees answer calls 24×7.</span>
          </div>
        </section>

        {/* Book a demo */}
        <section className="card card-hi mt-12 p-7 sm:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6" aria-labelledby="contact-demo">
          <div className="max-w-[560px]">
            <h2 id="contact-demo" className="font-display text-[26px] sm:text-[30px] font-semibold tracking-tight">Prefer we call you?</h2>
            <p className="text-ink-soft text-[15px] leading-relaxed mt-2">
              Book a 20-minute demo and we&apos;ll call you within one working day — we&apos;ll show an AI employee answering calls for a business like yours, in your customers&apos; language.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Link href="/book-demo" className="btn-glow inline-flex items-center h-12 px-6 rounded-full text-[15px] font-semibold" data-testid="contact-book-demo">Book a demo</Link>
            <Link href="/?proof=1" className="btn-ghost inline-flex items-center h-12 px-6 rounded-full text-[15px] font-medium">Free proof run</Link>
          </div>
        </section>

        {/* Social + legal */}
        <section className="mt-12 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-[14px] text-ink-soft">
          <nav aria-label="Social" className="flex flex-wrap gap-x-5 gap-y-2">
            <span className="text-ink">Follow RANA AI:</span>
            {SOCIAL_LINKS.map(([label, href]) => (
              <a key={href} href={href} target="_blank" rel="noopener noreferrer" className="hover:text-signal">{label}</a>
            ))}
          </nav>
          <Link href="/legal/contact" className="hover:text-signal">Business details &amp; grievance officer →</Link>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
