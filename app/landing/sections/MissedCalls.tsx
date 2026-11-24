"use client";
import { useState } from "react";
import { CALC } from "../content";
import { CURRENCY_SYMBOL as SYMBOL, moneyShort, type Currency } from "@/lib/pricing";
import { type Market } from "../markets";

export default function MissedCalls({ onDemo, market, init }: { onDemo: () => void; market: Market; init?: { value: number; conv: number } }) {
  const cur: Currency = market.currency;
  const C = CALC[cur];
  const niceRound = (v: number) => { const m = 10 ** Math.max(0, Math.floor(Math.log10(v)) - 1); return Math.max(C.min, Math.round(v / m) * m); };
  const valueOfPos = (p: number) => niceRound(C.min * (C.max / C.min) ** (p / 1000));
  const posOfValue = (v: number) => Math.round((1000 * Math.log(Math.min(C.max, Math.max(C.min, v)) / C.min)) / Math.log(C.max / C.min));
  const [missed, setMissed] = useState(15);
  const [conv, setConv] = useState(init?.conv ?? 10);
  const [value, setValue] = useState(init?.value ?? C.def);
  const perMonth = missed * market.workDays;
  const won = perMonth * (conv / 100);
  const lost = Math.round(won * value);
  const slider = "w-full accent-[rgb(45,225,194)]";
  return (
    <section className="max-w-[1160px] mx-auto px-5 sm:px-8 pb-24">
      <div className="card card-hi p-6 sm:p-10 grid lg:grid-cols-[1.1fr_1fr] gap-10 items-center" data-testid="missed-calc">
        <div>
          <div className="eyebrow">What missed calls cost you</div>
          <h2 className="font-display text-[28px] sm:text-[38px] font-semibold tracking-[-0.025em] leading-[1.08] mt-3">Every unanswered call<br />is a customer who called someone else.</h2>
          <div className="flex flex-wrap gap-2 mt-6" role="group" aria-label="Pick your business">
            {C.presets.map(([label, v, c]) => (
              <button key={label} type="button" onClick={() => { setValue(v); setConv(c); }} data-testid={`calc-preset-${label.split(" ")[0].toLowerCase()}`}
                className={`rounded-full border px-3 py-1.5 text-[12.5px] transition-colors ${value === v ? "border-signal/60 bg-signal/10 text-signal font-semibold" : "border-white/10 text-ink-soft hover:text-ink hover:border-white/25"}`}>{label}</button>
            ))}
          </div>
          <div className="flex flex-col gap-6 mt-6 text-[14px]">
            <label className="block"><div className="flex justify-between mb-2"><span className="text-ink-soft">Calls you miss or can&apos;t call back, per day</span><b className="tabular-nums">{missed}</b></div>
              <input type="range" min={1} max={300} value={missed} onChange={(e) => setMissed(+e.target.value)} className={slider} aria-label="Missed calls per day" /></label>
            <label className="block"><div className="flex justify-between mb-2"><span className="text-ink-soft">Of those, how many would have bought</span><b className="tabular-nums">{conv}%</b></div>
              <input type="range" min={0.5} max={50} step={0.5} value={conv} onChange={(e) => setConv(+e.target.value)} className={slider} aria-label="Conversion percent" /></label>
            <label className="block"><div className="flex justify-between items-center gap-3 mb-2"><span className="text-ink-soft">What one customer or sale is worth to you</span>
                <span className="flex items-center gap-1 font-bold tabular-nums">{SYMBOL[cur]}<input type="number" min={C.min} max={C.max} value={value} onChange={(e) => setValue(Math.min(C.max, Math.max(0, Math.round(+e.target.value || 0))))}
                  className="w-[132px] bg-transparent border border-white/15 rounded-md px-2 py-1 text-right" aria-label="Customer value" data-testid="calc-value" /></span></div>
              <input type="range" min={0} max={1000} value={posOfValue(value)} onChange={(e) => setValue(valueOfPos(+e.target.value))} className={slider} aria-label="Customer value slider" />
              <div className="relative h-4 text-[11px] text-ink-soft mt-1 font-mono">{C.ticks.map(([t, v], i, a) => (
                <span key={t} className="absolute whitespace-nowrap" style={{ left: `${posOfValue(v) / 10}%`, transform: i === 0 ? "none" : i === a.length - 1 ? "translateX(-100%)" : "translateX(-50%)" }}>{t}</span>))}</div></label>
          </div>
        </div>
        <div className="text-center lg:text-left">
          <div className="text-[13px] font-medium text-ink-soft">Business you may be losing each month</div>
          <div className="font-display text-[46px] sm:text-[60px] font-semibold tracking-tight text-signal leading-none mt-3" data-testid="calc-lost">{moneyShort(cur, lost)}</div>
          <div className="text-[13.5px] text-ink-soft mt-3">{perMonth.toLocaleString("en-US")} missed calls × {conv}% = about {won >= 10 ? Math.round(won).toLocaleString("en-US") : Math.round(won * 10) / 10} customers × {moneyShort(cur, value)}, over {market.workDays} working days. Your numbers — change them.</div>
          <div className="mt-6 rounded-xl border border-white/10 bg-white/[.03] p-4 text-[14px]" data-testid="calc-roi">RANA answers and calls back every one of them{cur === "INR" ? <>, with pricing that <b>starts from ₹3 a minute</b>.</> : <>, for a small per-minute fee.</>}</div>
          <div className="flex flex-wrap gap-3 mt-6 justify-center lg:justify-start">
            <button onClick={onDemo} className="btn-glow rounded-full px-6 py-3 text-[14px] font-semibold">Book a demo</button>
          </div>
        </div>
      </div>
    </section>
  );
}
