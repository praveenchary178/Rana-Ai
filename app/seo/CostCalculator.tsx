"use client";
// Telecaller vs AI calling cost calculator (/tools/ai-calling-cost-calculator).
// Charan, 16 Nov 2026: plan prices hidden while the new pricing is finalised — the calculator shows the
// telecalling cost and the AI minutes needed; RANA's side says "from ₹3 per minute" and our team quotes the plan.
import { useMemo, useState } from "react";
import Link from "next/link";
import { bookDemoHref } from "@/app/book-demo/link";
import { PRICE_FROM_LINE } from "@/lib/priceDisplay";

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

function Field({ label, hint, value, set, min, max, step = 1, suffix }: { label: string; hint?: string; value: number; set: (n: number) => void; min: number; max: number; step?: number; suffix?: string }) {
  return (
    <label className="block">
      <div className="flex justify-between gap-3 text-[14px]"><span className="font-medium">{label}</span><span className="font-mono text-signal">{value.toLocaleString("en-IN")}{suffix}</span></div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => set(Number(e.target.value))} className="w-full mt-2 accent-[var(--signal,#35e0c4)]" aria-label={label} />
      {hint && <div className="text-[12px] text-ink-soft mt-1">{hint}</div>}
    </label>
  );
}

export default function CostCalculator() {
  const [people, setPeople] = useState(3);
  const [salary, setSalary] = useState(20000);
  const [calls, setCalls] = useState(100);
  const [connect, setConnect] = useState(40);
  const [mins, setMins] = useState(2);

  const r = useMemo(() => {
    const workDays = 26;
    const humanCost = people * salary * 1.2; // +20% for incentives, PF, seat, SIM, attrition
    const connected = people * calls * workDays * (connect / 100);
    const aiMinutes = Math.ceil(connected * mins * 1.1); // +10% for short unanswered attempts
    return { humanCost, connected, aiMinutes, perMinute: aiMinutes ? humanCost / aiMinutes : 0 };
  }, [people, salary, calls, connect, mins]);

  return (
    <section className="mt-10 rounded-2xl border border-signal/30 bg-signal/[.05] p-5 sm:p-7" data-testid="cost-calculator">
      <h2 className="font-display text-[22px] sm:text-[26px] font-semibold tracking-tight">Your numbers</h2>
      <div className="grid md:grid-cols-2 gap-x-8 gap-y-5 mt-5">
        <Field label="Telecallers today" value={people} set={setPeople} min={1} max={50} />
        <Field label="Monthly salary per telecaller" value={salary} set={setSalary} min={10000} max={50000} step={1000} hint="We add 20% for incentives, PF, seat, SIM and attrition." suffix=" ₹" />
        <Field label="Dials per telecaller per day" value={calls} set={setCalls} min={20} max={300} step={10} />
        <Field label="Calls that connect" value={connect} set={setConnect} min={10} max={90} step={5} suffix="%" />
        <Field label="Average connected call length" value={mins} set={setMins} min={1} max={10} step={0.5} suffix=" min" />
      </div>

      <div className="grid sm:grid-cols-3 gap-3 mt-7">
        <div className="rounded-xl border border-white/10 bg-white/[.03] p-4">
          <div className="font-mono text-[11px] uppercase tracking-wider text-ink-soft">Telecalling today</div>
          <div className="font-display text-[26px] font-semibold mt-1" data-testid="calc-human">{inr(r.humanCost)}<span className="text-[13px] text-ink-soft font-normal">/mo</span></div>
          <div className="text-[12.5px] text-ink-soft mt-1">{Math.round(r.connected).toLocaleString("en-IN")} connected calls a month</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[.03] p-4">
          <div className="font-mono text-[11px] uppercase tracking-wider text-ink-soft">Your team&apos;s cost per minute</div>
          <div className="font-display text-[26px] font-semibold mt-1" data-testid="calc-human-min">{inr(r.perMinute)}<span className="text-[13px] text-ink-soft font-normal">/min</span></div>
          <div className="text-[12.5px] text-ink-soft mt-1">{r.aiMinutes.toLocaleString("en-IN")} talk minutes a month</div>
        </div>
        <div className="rounded-xl border border-signal/40 bg-signal/[.08] p-4">
          <div className="font-mono text-[11px] uppercase tracking-wider text-ink-soft">With RANA AI</div>
          <div className="font-display text-[22px] font-semibold mt-1 text-signal" data-testid="calc-ai">{PRICE_FROM_LINE}</div>
          <div className="text-[12.5px] text-ink-soft mt-1">24×7, several calls at once. Our team will share the exact plan for your volume.</div>
        </div>
      </div>
      <p className="text-[12px] text-ink-soft mt-4">An estimate: your connect rates and call lengths will differ. <Link href={bookDemoHref("cost-calculator")} className="underline hover:text-signal">Book a demo to get your plan</Link>.</p>
    </section>
  );
}
