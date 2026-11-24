"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import MarketSwitcher from "./MarketSwitcher";
import { MARKETS, type Market } from "./markets";
import { bookDemoHref } from "../book-demo/link";

export const NAV: ReadonlyArray<readonly [label: string, href: string]> = [
  ["Industries", "/for"],
  ["How it works", "#how"],
  ["Pricing", "#pricing"],
  ["FAQ", "#faq"],
  ["Contact", "/contact"],
];

export const CONTACT_EMAIL = "hello@ranaai.in";
const CTA = "h-9 items-center rounded-full px-4 text-[13.5px] font-semibold";

function NavLink({ href, className, onClick, children }: { href: string; className: string; onClick?: () => void; children: React.ReactNode }) {
  return href.startsWith("/")
    ? <Link href={href} className={className} onClick={onClick}>{children}</Link>
    : <a href={href} className={className} onClick={onClick}>{children}</a>;
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
      {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
    </svg>
  );
}

export function Wordmark({ size = 30 }: { size?: number }) {
  return (
    <span className="flex items-center gap-2.5">
      <Logo size={size} />
      <span className="font-display text-[18px] font-semibold tracking-[-0.01em]">RANA<span className="text-signal"> AI</span></span>
    </span>
  );
}

type Props = {
  market?: Market;
  /** Offer the free proof run in the mobile menu (India only). */
  showProof?: boolean;
  /** The homepage (or a country / vertical variant of it): nav anchors like "#faq" stay on the page. */
  isHome?: boolean;
  /** Tag saved with demo requests booked from this header (e.g. "industry-real-estate"). Defaults to "nav". */
  demoFrom?: string;
  /** Open the proof-run dialog in place. Pages without it omit this; the button then links to the homepage (`?proof=1`). */
  onProof?: () => void;
};

/** On inner pages, homepage anchors become absolute links ("#faq" -> "/#faq"); pricing has its own page. */
const resolveHref = (href: string, home: boolean) =>
  home || !href.startsWith("#") ? href : href === "#pricing" ? "/pricing" : `/${href}`;

/**
 * Site header: one clean sticky row — logo, primary navigation (incl. Contact), region, Sign in and the primary CTA.
 * Phone, WhatsApp and email live on the /contact page (and in the footer), not in the header.
 */
export default function SiteHeader({ market = MARKETS.in, showProof = false, isHome = false, demoFrom = "nav", onProof }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    if (!menuOpen) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false); };
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("keydown", esc); document.body.style.overflow = ""; };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header className="sticky top-0 z-50" data-testid="site-header">
        <div className={`border-b transition-colors duration-200 ${scrolled || menuOpen ? "glass border-line/80" : "border-transparent"}`}>
          <div className="max-w-[1280px] mx-auto h-16 px-5 sm:px-8 grid grid-cols-[auto_1fr_auto] items-center gap-6 whitespace-nowrap">
            {isHome
              ? <a href="#top" className="shrink-0" aria-label="RANA AI home"><Wordmark /></a>
              : <Link href="/" className="shrink-0" aria-label="RANA AI home"><Wordmark /></Link>}

            <nav aria-label="Primary" className="hidden lg:flex justify-center gap-8 text-[14px] text-ink-soft">
              {NAV.map(([label, href]) => (
                <NavLink key={href} href={resolveHref(href, isHome)} className="hover:text-ink">{label}</NavLink>
              ))}
            </nav>

            <div className="col-start-3 flex items-center gap-2">
              <span className="hidden md:block"><MarketSwitcher market={market} compact /></span>
              <Link href="/login" className="hidden md:inline-flex h-9 items-center px-3 text-[14px] font-medium text-ink-soft hover:text-ink">Sign in</Link>
              <Link href={bookDemoHref(demoFrom)} className={`btn-glow hidden sm:inline-flex ${CTA}`} data-testid="nav-trial">Book a demo</Link>
              <button type="button" onClick={() => setMenuOpen((o) => !o)} aria-expanded={menuOpen} aria-controls="site-menu" aria-label={menuOpen ? "Close menu" : "Open menu"}
                className="lg:hidden grid place-items-center w-9 h-9 rounded-full border border-line text-ink hover:border-white/25" data-testid="menu-btn">
                <MenuIcon open={menuOpen} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div id="site-menu" className="fixed inset-x-0 top-16 bottom-0 z-[60] bg-paper overflow-y-auto animate-rise lg:hidden" data-testid="menu">
          <div className="max-w-[640px] mx-auto px-5 sm:px-8 py-6 flex flex-col min-h-full">
            <nav aria-label="Mobile" className="flex flex-col divide-y divide-line/70 border-y border-line/70">
              {NAV.map(([label, href]) => (
                <NavLink key={href} href={resolveHref(href, isHome)} onClick={closeMenu} className="py-4 font-display text-[22px] font-semibold tracking-[-0.01em] hover:text-signal">{label}</NavLink>
              ))}
            </nav>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <Link href={bookDemoHref(`${demoFrom}-menu`)} onClick={closeMenu} className="btn-glow col-span-2 h-12 inline-flex items-center justify-center rounded-full text-[15px] font-semibold">Book a demo</Link>
              <Link href="/login" onClick={closeMenu} className={`btn-ghost h-12 inline-flex items-center justify-center rounded-full text-[14px] font-medium ${showProof ? "" : "col-span-2"}`}>Sign in</Link>
              {showProof && (onProof
                ? <button type="button" onClick={() => { closeMenu(); onProof?.(); }} className="btn-ghost h-12 rounded-full text-[14px] font-medium">Free proof run</button>
                : <Link href="/?proof=1" onClick={closeMenu} className="btn-ghost h-12 inline-flex items-center justify-center rounded-full text-[14px] font-medium">Free proof run</Link>)}
            </div>

            <div className="mt-auto pt-8 text-[14px] text-ink-soft">
              <div className="flex items-center justify-between pt-3 border-t border-line/70">
                <span className="text-[12.5px]">Region</span>
                <MarketSwitcher market={market} align="up" />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
