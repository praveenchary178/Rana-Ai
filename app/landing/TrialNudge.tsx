"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { TRIAL_PACK_PRICE_LABEL as PRICE, TRIAL_PACK_LINE, TRIAL_CHECKOUT_PATH } from "@/lib/trialPack";

const KEY = "rana_trial_nudge_closed";

/**
 * A small card that slides in once the visitor has scrolled a little (past the hero), offering the ₹2,500 trial.
 * It hides while the homepage trial section is on screen (no double offer), and a close stays closed for the visit.
 * Sits bottom-left on desktop (and above the chat button on phones) so it never covers the website chat.
 */
export default function TrialNudge({ from = "nudge" }: { from?: string }) {
  const [show, setShow] = useState(false);
  const [closed, setClosed] = useState(true);

  useEffect(() => {
    let dismissed = false;
    try { dismissed = sessionStorage.getItem(KEY) === "1"; } catch {}
    setClosed(dismissed);
    if (dismissed) return;
    const block = () => document.getElementById("trial");
    const onScroll = () => {
      const el = block();
      const r = el?.getBoundingClientRect();
      const blockVisible = !!r && r.top < window.innerHeight && r.bottom > 0;
      setShow(window.scrollY > 650 && !blockVisible);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const close = () => { setClosed(true); try { sessionStorage.setItem(KEY, "1"); } catch {} };
  if (closed) return null;
  return (
    <aside
      aria-label="Trial pack offer"
      data-testid="trial-nudge"
      className={`fixed z-40 left-4 right-4 bottom-24 sm:right-auto sm:left-6 sm:bottom-6 sm:w-[340px] transition-all duration-500 ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 pointer-events-none"}`}
    >
      <div className="relative rounded-2xl border border-signal/35 bg-[rgb(var(--c-paper)/.92)] backdrop-blur-xl p-4 pr-10 shadow-[0_24px_60px_-20px_rgb(var(--c-signal)/.55)]">
        <button type="button" onClick={close} aria-label="Close" className="absolute top-2.5 right-3 text-ink-soft hover:text-ink text-[18px] leading-none">×</button>
        <div className="flex items-center gap-2 text-[11.5px] font-semibold text-signal uppercase tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-signal animate-pulse" aria-hidden />New · Trial pack
        </div>
        <div className="font-display text-[19px] font-semibold leading-snug mt-1.5">Try RANA AI on your real calls for {PRICE}</div>
        <div className="text-[13px] text-ink-soft mt-1">{TRIAL_PACK_LINE}</div>
        <Link href={`${TRIAL_CHECKOUT_PATH}?from=${from}`} onClick={() => { try { sessionStorage.setItem(KEY, "1"); } catch {} }}
          className="btn-glow inline-flex items-center justify-center w-full h-10 rounded-full text-[14px] font-semibold mt-3.5">Start my trial →</Link>
      </div>
    </aside>
  );
}
