"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { INDUSTRY_CALLS, GLOBAL_CALLS, faqFor } from "./content";
import { MARKETS, type MarketKey } from "./markets";
import { goToBookDemo } from "../book-demo/link";
import type { LiveMode } from "./RanaLive";
import { SCENARIOS, type DemoKey } from "./talkContent";
import { captureUtm } from "./utm";
import type { Vertical } from "./verticals";
import SiteHeader, { NAV, CONTACT_EMAIL } from "./SiteHeader";
import MarketSwitcher from "./MarketSwitcher";
import { LEGAL, LEGAL_LINKS, SOCIAL_LINKS } from "@/app/legal/legal";
import MarketHint from "./sections/MarketHint";
import Hero from "./sections/Hero";
import Highlights from "./sections/Highlights";
import TrialPack from "./sections/TrialPack";
import ProductFlow from "./sections/ProductFlow";
import Languages from "./sections/Languages";
import Capabilities from "./sections/Capabilities";
import VerticalStory from "./sections/VerticalStory";
import DashboardShowcase from "./sections/DashboardShowcase";
import MissedCalls from "./sections/MissedCalls";
import ProofRunBlock from "./sections/ProofRunBlock";
import Rollout from "./sections/Rollout";
import Pricing from "./sections/Pricing";
import { About, Faq, FinalCta } from "./sections/Closing";
import TrialNudge from "./TrialNudge";

// Dialogs load on first open, so their code (including the Sarvam / ElevenLabs voice clients behind
// "Talk to Rana") stays out of the page's first download.
const ProofRunForm = dynamic(() => import("./ProofRunForm"), { ssr: false });
const RanaLive = dynamic(() => import("./RanaLive"), { ssr: false });

/**
 * Crawlable links to the SEO pages (kept small here so the client bundle doesn't load their content).
 * Industry links point at the final /for pages, not the /industries URLs that redirect there
 * (see INDUSTRY_TO_FOR in app/seo/index.ts and the redirects in next.config.js).
 */
const EXPLORE: [string, [string, string][]][] = [
  ["Solutions", [["AI calling agent", "/ai-calling-agent"], ["AI receptionist", "/ai-receptionist"], ["AI receptionist for clinics", "/ai-receptionist-for-clinics"], ["AI telecaller", "/ai-telecaller"], ["AI voice calling", "/ai-voice-calling"], ["Telecaller software", "/telecaller-software"], ["Pricing", "/pricing"], ["₹2,500 trial pack", "/trial"]]],
  ["Languages & cities", [["Telugu AI voice agent", "/telugu-ai-voice-agent"], ["Hindi AI voice agent", "/hindi-ai-voice-agent"], ["Tamil AI voice agent", "/tamil-ai-voice-agent"], ["Kannada AI voice agent", "/kannada-ai-voice-agent"], ["Hyderabad", "/ai-voice-agent-hyderabad"], ["Vijayawada", "/ai-voice-agent-vijayawada"], ["Visakhapatnam", "/ai-voice-agent-visakhapatnam"], ["Bengaluru", "/ai-voice-agent-bangalore"]]],
  ["Industries", [["Real estate", "/for/real-estate"], ["Clinics & hospitals", "/for/healthcare"], ["Education & coaching", "/for/education"], ["E-commerce & D2C", "/for/ecommerce"], ["Banking & NBFC", "/for/bfsi"], ["Insurance", "/industries/insurance"], ["All industries →", "/for"]]],
  ["Compare & learn", [["Best AI voice agents in India", "/best-ai-voice-agents-india"], ["AI calling cost calculator", "/tools/ai-calling-cost-calculator"], ["Vapi alternative India", "/vapi-alternative-india"], ["RANA AI vs Retell AI", "/compare/rana-ai-vs-retell-ai"], ["RANA AI vs Bland AI", "/compare/rana-ai-vs-bland-ai"], ["AI vs human telecaller", "/compare/ai-vs-human-telecaller"], ["TRAI DLT rules", "/glossary/trai-tcccpr-rules"], ["Glossary", "/glossary"], ["Blog", "/blog"]]],
];

/**
 * The public homepage — also rendered for each country (/us, /ae, /eu, /jp, /global) and each industry
 * vertical (/for/[slug]). This component owns page state (dialogs, deep links); sections live in ./sections.
 */
export default function Site({ marketKey = "in", vertical }: { marketKey?: MarketKey; vertical?: Vertical }) {
  const v = vertical;
  const market = MARKETS[marketKey] || MARKETS.in;
  const india = market.key === "in";
  const faq = v ? [...v.faq, ...faqFor(market).filter(([q]) => !/Which businesses/.test(q))] : faqFor(market);

  // Dialogs. Deep links open them directly (for ads, WhatsApp, email):
  //   ?proof=1 / #proof → free proof run   ?talk=1 / #talk → talk to Rana   ?try=<scenario> → instant demo
  // Booking a demo always happens on /book-demo (old ?demo=1 / #demo links are sent there).
  const [proof, setProof] = useState(false);
  const [live, setLive] = useState<{ mode: LiveMode; scenario: DemoKey | null } | null>(null);
  const openProof = () => setProof(true);
  const showDemo = (from: string) => goToBookDemo(v ? `${v.slug}-${from}` : from);
  const openDemo = (from: string) => () => showDemo(from);
  const openTalk = () => setLive({ mode: "talk", scenario: null });
  const openTry = (k: DemoKey | null = null) => setLive({ mode: "demo", scenario: k });

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    captureUtm();
    if (hash === "#demo") { window.location.replace("/book-demo?from=link"); return; } // ?demo=1 is redirected by middleware
    if (hash === "#talk" || q.get("talk") === "1") setLive({ mode: "talk", scenario: null });
    const t = q.get("try");
    if (t) setLive({ mode: "demo", scenario: (SCENARIOS.some((x) => x.key === t) ? t : null) as DemoKey | null });
    if (q.get("proof") === "1" || hash === "#proof") setProof(true);
  }, []);

  // Mark the page as scrolling (pauses decorative animation and the voice core) and clear it shortly after.
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    const html = document.documentElement;
    const onScroll = () => { html.classList.add("is-scrolling"); clearTimeout(t); t = setTimeout(() => html.classList.remove("is-scrolling"), 160); };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); clearTimeout(t); html.classList.remove("is-scrolling"); };
  }, []);

  return (
    <div className="site theme-night min-h-screen font-sans">
      <div className="aurora" aria-hidden />
      <MarketHint market={market} />
      <SiteHeader isHome market={market} showProof={india} demoFrom={v ? `${v.slug}-nav` : "nav"} onProof={openProof} />

      <main id="top">
        <Hero market={market} vertical={v} calls={v ? [v.call] : india ? INDUSTRY_CALLS : GLOBAL_CALLS}
          onTry={() => openTry(v ? v.demo : null)} onDemo={openDemo("hero")} onProof={openProof} onTalk={openTalk} />
        <Highlights india={india} />
        {/* The ₹2,500 trial pack: the first offer a visitor meets once they scroll past the hero (India only). */}
        {india && <TrialPack from={v ? v.slug : "home"} />}
        <ProductFlow />
        <Languages india={india} onTry={() => openTry()} />
        <Capabilities india={india} />
        {/* Every industry has its own page (header → Industries → /for); the story only shows there. */}
        {v && <VerticalStory v={v} onProof={openProof} onTry={() => openTry(v.demo)} />}
        <DashboardShowcase />
        <MissedCalls key={market.currency} market={market} onDemo={openDemo("calculator")} init={v?.calc} />
        {india && <ProofRunBlock onProof={openProof} win={v?.win} />}
        <Rollout vertical={v} />
        <Pricing market={market} onDemo={showDemo} />
        <About />
        <Faq items={faq} />
        <FinalCta
          primary={v
            ? <button type="button" onClick={openProof} className="btn-glow rounded-full px-7 py-3.5 text-[15px] font-semibold">Free proof run on my leads</button>
            : <button type="button" onClick={openDemo("footer-cta")} className="btn-glow rounded-full px-7 py-3.5 text-[15px] font-semibold">Book a demo</button>}
          secondary={v
            ? <button type="button" onClick={openDemo("footer-cta")} className="btn-ghost rounded-full px-7 py-3.5 text-[15px] font-medium">Book a demo</button>
            : india
              ? <Link href="/trial?from=footer-cta" className="btn-ghost rounded-full px-7 py-3.5 text-[15px] font-medium">Start the ₹2,500 trial</Link>
              : <button type="button" onClick={() => openTry()} className="btn-ghost rounded-full px-7 py-3.5 text-[15px] font-medium">Try an instant demo</button>} />
      </main>

      {india && !proof && !live && <TrialNudge from={v ? `${v.slug}-nudge` : "nudge"} />}
      {proof && <ProofRunForm open onClose={() => setProof(false)} industry={v?.label} win={v?.win} />}
      {live && <RanaLive open mode={live?.mode || "talk"} scenario={live?.scenario || null} market={market} onClose={() => setLive(null)}
        onBookDemo={(p) => goToBookDemo(`live-${live?.mode || "talk"}${live?.scenario ? `-${live.scenario}` : ""}`, p)} />}

      <nav aria-label="Explore RANA AI" className="border-t border-white/[.06]" data-testid="explore-links">
        <div className="max-w-[1180px] mx-auto px-5 sm:px-8 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-[13.5px]">
          {EXPLORE.map(([title, links]) => (
            <div key={title}>
              <div className="text-[13px] font-semibold text-ink mb-3">{title}</div>
              <ul className="grid gap-2">{links.map(([l, h]) => <li key={h}><Link href={h} className="text-ink-soft hover:text-signal">{l}</Link></li>)}</ul>
            </div>
          ))}
        </div>
      </nav>
      <footer className="border-t border-white/[.06]">
        <div className="max-w-[1180px] mx-auto px-5 sm:px-8 py-10 flex flex-col md:flex-row gap-6 items-center justify-between text-[13px] text-ink-soft">
          <div className="flex items-center gap-3"><Logo size={24} /><span>RANA AI — Hyderabad, India · serving businesses worldwide</span></div>
          <nav className="flex flex-wrap gap-6 justify-center text-[13px]">
            {NAV.map(([l, h]) => <a key={h} href={h} className="hover:text-signal">{l}</a>)}
            <Link href="/blog" className="hover:text-signal">Blog</Link>
            <Link href="/login" className="hover:text-signal">Sign in</Link>
          </nav>
          <div className="flex items-center gap-3"><MarketSwitcher market={market} align="up" /><span>© {new Date().getFullYear()} RANA AI</span></div>
        </div>
        <div className="max-w-[1180px] mx-auto px-5 sm:px-8 pb-8 flex flex-col md:flex-row gap-3 items-center justify-between text-[12px] text-ink-soft/80">
          <nav className="flex flex-wrap gap-x-5 gap-y-2 justify-center">
            {LEGAL_LINKS.map(([l, h]) => <Link key={h} href={h} className="hover:text-signal">{l}</Link>)}
            {SOCIAL_LINKS.map(([l, h]) => <a key={h} href={h} target="_blank" rel="noopener noreferrer" className="hover:text-signal">{l}</a>)}
          </nav>
          <div className="tabular-nums">RANA AI · Hyderabad, India · Sales <a href={`tel:${LEGAL.phoneTel}`} className="hover:text-signal">{LEGAL.phone}</a> · <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-signal">{CONTACT_EMAIL}</a></div>
        </div>
      </footer>
    </div>
  );
}
