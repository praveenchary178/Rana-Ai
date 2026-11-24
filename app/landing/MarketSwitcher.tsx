"use client";
import { useEffect, useRef, useState } from "react";
import { CURRENCY_SYMBOL as SYMBOL } from "@/lib/pricing";
import { MARKETS, MARKET_KEYS, MARKET_COOKIE, type Market, type MarketKey } from "./markets";

type Align = "right" | "left" | "up";

function GlobeIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9S14.5 18.3 12 21M12 3C9.5 5.7 8.2 8.7 8.2 12s1.3 6.3 3.8 9" />
    </svg>
  );
}

const rememberMarket = (k: MarketKey) => {
  try { document.cookie = `${MARKET_COOKIE}=${k}; path=/; max-age=31536000; samesite=lax`; } catch {}
};

/**
 * Region / currency picker. Each choice is its own page (/, /global, /us, /ae, /eu, /jp) so Google can index them.
 * `compact` renders a borderless trigger for dense bars (the header's utility row). */
export default function MarketSwitcher({ market, align = "right", compact = false }: { market: Market; align?: Align; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, [open]);

  const position = align === "up" ? "bottom-full mb-2 left-1/2 -translate-x-1/2" : align === "left" ? "left-0 mt-2" : "right-0 mt-2";
  const trigger = compact
    ? "px-1.5 py-1 text-[12.5px]"
    : "rounded-full border border-white/10 hover:border-white/25 px-3 py-2 text-[12.5px]";

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open} data-testid="market-switch"
        className={`flex items-center gap-1.5 text-ink-soft hover:text-ink tabular-nums ${trigger}`}>
        <GlobeIcon size={compact ? 13 : 14} />
        <span>{market.short} · {SYMBOL[market.currency]}</span>
      </button>
      {open && (
        <div role="menu" className={`absolute z-[70] w-[232px] rounded-xl border border-line bg-raised p-1.5 shadow-2xl ${position}`} data-testid="market-menu">
          {MARKET_KEYS.map((k) => {
            const m = MARKETS[k];
            const active = k === market.key;
            return (
              <a key={k} role="menuitem" href={m.path} onClick={() => rememberMarket(k)} data-testid={`market-${k}`}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-[13px] ${active ? "bg-signal/10 text-signal font-semibold" : "text-ink-soft hover:bg-white/[.05] hover:text-ink"}`}>
                <span>{m.name}</span>
                <span className="font-mono text-[11.5px]">{SYMBOL[m.currency]} {m.currency}</span>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
