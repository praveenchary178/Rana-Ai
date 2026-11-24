"use client";
import "../../landing/landing.css";
import "../../book-demo/book-demo.css";
import { useEffect, useState } from "react";
import Link from "next/link";

type State = { kind: "checking" } | { kind: "paid"; company: string | null; ends: string | null; number: string | null } | { kind: "pending"; payUrl: string | null } | { kind: "error" };

/** /trial/done — Razorpay sends the buyer here after paying. Confirms the payment and opens their workspace. */
export default function TrialDone() {
  const [s, setS] = useState<State>({ kind: "checking" });

  useEffect(() => {
    const q = Object.fromEntries(new URLSearchParams(window.location.search));
    let tries = 0, stop = false;
    const check = async () => {
      try {
        const r = await fetch("/api/trial/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(q) });
        const j = await r.json();
        if (!r.ok) { setS({ kind: "error" }); return; }
        if (j.paid) { setS({ kind: "paid", company: j.company, ends: j.trialEndsAt, number: j.number }); return; }
        // Razorpay can take a few seconds to confirm a UPI payment.
        if (++tries < 8 && !stop) setTimeout(check, 4000); else setS({ kind: "pending", payUrl: j.payUrl || null });
      } catch { setS({ kind: "error" }); }
    };
    check();
    return () => { stop = true; };
  }, []);

  return (
    <div className="site theme-night min-h-screen grid place-items-center px-5 py-16">
      <div className="aurora" aria-hidden><div className="bd-grid" /></div>
      <div className="bd-panel p-7 sm:p-10 w-full max-w-[560px] relative" data-testid="trial-done" role="status">
        {s.kind === "checking" && (
          <>
            <p className="bd-chip"><span className="bd-pulse" aria-hidden />Confirming your payment…</p>
            <h1 className="font-display text-[28px] font-semibold tracking-tight mt-6">One moment.</h1>
            <p className="text-ink-soft text-[15px] mt-2">We&apos;re checking with Razorpay. This usually takes a few seconds.</p>
          </>
        )}
        {s.kind === "paid" && (
          <>
            <div className="bd-check" aria-hidden>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
            </div>
            <h1 className="font-display text-[30px] font-semibold tracking-tight mt-6">Your trial is live{s.company ? `, ${s.company}` : ""}.</h1>
            <p className="text-ink-soft text-[15px] leading-relaxed mt-2">
              Your payment is received and your workspace is open. Your invoice{s.number ? ` (${s.number})` : ""} is on its way to your email, and our team will call you shortly to set up your AI employee.
            </p>
            <ol className="bd-steps mt-8">
              {[["We set up your AI employee", "Our team builds it on your script, prices, FAQs and language."], ["Talk to it", "Call it yourself and test it before it talks to a customer."], ["Go live", "Forward your calls to it or give it your leads to call."]].map(([t, d], i) => (
                <li key={t}><span className="bd-step-num">{String(i + 1).padStart(2, "0")}</span><div><div className="text-[15px] font-semibold">{t}</div><div className="text-[13.5px] text-ink-soft mt-0.5">{d}</div></div></li>
              ))}
            </ol>
            <a href="/" className="btn-glow inline-flex items-center justify-center h-12 px-7 rounded-full text-[15px] font-semibold mt-9 w-full sm:w-auto" data-testid="trial-open">Open RANA →</a>
          </>
        )}
        {s.kind === "pending" && (
          <>
            <h1 className="font-display text-[28px] font-semibold tracking-tight">We haven&apos;t received the payment yet.</h1>
            <p className="text-ink-soft text-[15px] leading-relaxed mt-2">If money left your account, it can take a few minutes to reach us; your trial switches on by itself and you&apos;ll get an email. Otherwise, you can finish paying below.</p>
            <div className="flex flex-wrap gap-3 mt-7">
              {s.payUrl && <a href={s.payUrl} className="btn-glow inline-flex items-center h-11 px-6 rounded-full text-[14px] font-semibold">Finish payment</a>}
              <Link href="/trial" className="btn-ghost inline-flex items-center h-11 px-6 rounded-full text-[14px] font-medium">Back to the trial page</Link>
            </div>
          </>
        )}
        {s.kind === "error" && (
          <>
            <h1 className="font-display text-[28px] font-semibold tracking-tight">Something didn&apos;t load.</h1>
            <p className="text-ink-soft text-[15px] leading-relaxed mt-2">If you paid, your trial switches on by itself and you&apos;ll get an email in a few minutes. Questions? Call +91 78997 93001.</p>
            <a href="/" className="btn-ghost inline-flex items-center h-11 px-6 rounded-full text-[14px] font-medium mt-7">Open RANA</a>
          </>
        )}
      </div>
    </div>
  );
}
