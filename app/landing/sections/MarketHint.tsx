"use client";
import { useEffect, useState } from "react";
import { MARKETS, MARKET_COOKIE, marketForZone, type Market, type MarketKey } from "../markets";

/** A quiet hint when the visitor's timezone suggests another country page. Never redirects (keeps every page crawlable). */
export default function MarketHint({ market }: { market: Market }) {
  const [to, setTo] = useState<MarketKey | null>(null);
  useEffect(() => {
    try {
      if (document.cookie.includes(`${MARKET_COOKIE}=`)) return;
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      const guess = marketForZone(tz);
      if (!guess || guess === market.key) return;
      if (market.key !== "in" && guess === "global") return;
      setTo(guess);
    } catch {}
  }, [market.key]);
  if (!to) return null;
  const m = MARKETS[to];
  const dismiss = () => { try { document.cookie = `${MARKET_COOKIE}=${market.key}; path=/; max-age=31536000; samesite=lax`; } catch {} setTo(null); };
  return (
    <div className="relative z-[55] border-b border-signal/20 bg-signal/10 text-[13px]" data-testid="market-hint">
      <div className="max-w-[1160px] mx-auto px-5 sm:px-8 py-2.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center">
        <span>{to === "in" ? "In India? See prices in rupees." : `Visiting from ${m.key === "global" ? "outside India" : m.name}? See prices in ${m.currency}.`}</span>
        <a href={m.path} onClick={() => { try { document.cookie = `${MARKET_COOKIE}=${to}; path=/; max-age=31536000; samesite=lax`; } catch {} }} className="font-semibold text-signal">Go to {m.name} →</a>
        <button type="button" onClick={dismiss} className="text-ink-soft hover:text-ink" aria-label="Stay on this page">Stay here</button>
      </div>
    </div>
  );
}
