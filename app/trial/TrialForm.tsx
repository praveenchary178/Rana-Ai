"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { utmTag, captureUtm } from "../landing/utm";
import { TRIAL_PACK_PRICE_LABEL as TRIAL_PACK_PRICE } from "@/lib/trialPack";

type Form = { name: string; phone: string; company: string; email: string; password: string; industry: string; consent: boolean; website: string };
const EMPTY: Form = { name: "", phone: "", company: "", email: "", password: "", industry: "other", consent: false, website: "" };
const INDUSTRIES: [string, string][] = [["edtech", "Education / coaching"], ["realestate", "Real estate"], ["hospitality", "Hotel / travel / restaurant"], ["saas", "Software / SaaS"], ["other", "Other business"]];

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return <div><label htmlFor={id} className="bd-label">{label}</label>{children}</div>;
}

/** The /trial checkout: creates the workspace, then sends the buyer to Razorpay. */
export default function TrialForm() {
  const [f, setF] = useState<Form>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [source, setSource] = useState("trial-page");
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }));

  useEffect(() => {
    captureUtm();
    const from = new URLSearchParams(window.location.search).get("from");
    if (from) setSource(`trial|${from.replace(/[^\w.-]/g, "").slice(0, 60)}`);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const tag = utmTag();
      const r = await fetch("/api/trial/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, source: tag ? `${source}|${tag}` : source }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.payUrl) throw new Error(j.error || "Couldn't start the payment. Please try again.");
      window.location.href = j.payUrl;
    } catch (err: any) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="bd-panel p-6 sm:p-8 flex flex-col gap-5" data-testid="trial-form">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-[22px] font-semibold tracking-tight">Start your trial</h2>
        <span className="text-[12px] text-ink-soft">Takes ~1 minute</span>
      </div>

      <input type="text" name="website" value={f.website} onChange={(e) => set("website", e.target.value)} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden />

      <div className="grid sm:grid-cols-2 gap-4">
        <Field id="tr-name" label="Your name">
          <input id="tr-name" required value={f.name} onChange={(e) => set("name", e.target.value)} className="bd-input" autoComplete="name" />
        </Field>
        <Field id="tr-phone" label="Mobile number">
          <input id="tr-phone" required inputMode="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="98xxxxxxxx" className="bd-input tabular-nums" autoComplete="tel" />
        </Field>
        <Field id="tr-company" label="Business name">
          <input id="tr-company" required value={f.company} onChange={(e) => set("company", e.target.value)} className="bd-input" autoComplete="organization" />
        </Field>
        <Field id="tr-industry" label="Your business">
          <select id="tr-industry" value={f.industry} onChange={(e) => set("industry", e.target.value)} className="bd-input">
            {INDUSTRIES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </Field>
        <Field id="tr-email" label="Work email (your login)">
          <input id="tr-email" type="email" required value={f.email} onChange={(e) => set("email", e.target.value)} className="bd-input" autoComplete="email" />
        </Field>
        <Field id="tr-password" label="Choose a password">
          <input id="tr-password" type="password" required minLength={8} value={f.password} onChange={(e) => set("password", e.target.value)} placeholder="8+ characters" className="bd-input" autoComplete="new-password" />
        </Field>
      </div>

      <div className="rounded-2xl border border-white/[.08] bg-white/[.02] px-4 py-3.5 text-[14px]" data-testid="trial-summary">
        <div className="flex justify-between gap-3"><span>RANA AI trial pack</span><span className="tabular-nums">{TRIAL_PACK_PRICE}</span></div>
        <div className="text-[12.5px] text-ink-soft mt-0.5">1 AI employee, set up by our team on your script</div>
        <div className="flex justify-between gap-3 mt-3 pt-3 border-t border-white/[.08] font-semibold"><span>You pay today</span><span className="tabular-nums">{TRIAL_PACK_PRICE}</span></div>
        <div className="text-[12px] text-ink-soft mt-1">One-time. No auto-renewal. Pay by UPI, card or netbanking. Invoice by email.</div>
      </div>

      <label className="flex items-start gap-2.5 text-[12.5px] text-ink-soft">
        <input type="checkbox" required checked={f.consent} onChange={(e) => set("consent", e.target.checked)} className="mt-0.5 accent-[rgb(var(--c-signal))]" />
        <span>I agree to the <Link href="/legal/terms" className="text-signal">Terms</Link> and <Link href="/legal/refunds" className="text-signal">Refund policy</Link>, and RANA AI may call or message me about my trial.</span>
      </label>

      {error && <div role="alert" className="text-[13px] text-miss bg-miss/10 border border-miss/30 rounded-xl px-3 py-2">{error}</div>}

      <button type="submit" disabled={busy} className="btn-glow h-12 rounded-full text-[15px] font-semibold disabled:opacity-50" data-testid="trial-submit">
        {busy ? "Opening secure payment…" : `Pay ${TRIAL_PACK_PRICE} & start my trial →`}
      </button>
      <p className="text-[12px] text-ink-soft text-center -mt-2">🔒 Secured by Razorpay. Already have a login? <Link href="/login?next=/billing" className="text-signal">Sign in</Link></p>
    </form>
  );
}
