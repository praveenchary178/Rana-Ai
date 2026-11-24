"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { utmTag, captureUtm } from "../landing/utm";
import { takeDemoPrefill } from "./link";
import { CALL_LANGUAGES, callLanguage } from "@/lib/callLanguages";

const LANGS = ["Telugu", "Hindi", "English", "Tamil", "Kannada", "Malayalam", "Marathi", "Bengali", "Gujarati", "Punjabi", "Odia"];
const WANTS: [key: string, label: string][] = [["answer", "Answer calls"], ["call", "Call leads"], ["both", "Both"]];
const INDUSTRIES = ["Clinic / hospital / diagnostics", "Real estate", "Education / coaching / college", "E-commerce / D2C", "Insurance / loans / finance", "Hotel / restaurant / travel", "Automobile dealer / service", "Home & local services", "Other"];
const VOLUMES = ["Under 500 calls / month", "500 – 2,000", "2,000 – 10,000", "10,000+", "Not sure yet"];
const TIMES = ["Morning (10–12)", "Afternoon (12–4)", "Evening (4–7)"];

type Form = {
  name: string; phone: string; company: string; email: string;
  wants: string; languages: string[]; callLanguage: string;
  industry: string; volume: string; bestTime: string; message: string;
  consent: boolean; website: string; // `website` is a hidden honeypot
};

const EMPTY: Form = { name: "", phone: "", company: "", email: "", wants: "both", languages: [], callLanguage: "en", industry: "", volume: "", bestTime: "", message: "", consent: false, website: "" };

function Field({ id, label, optional, children }: { id: string; label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="bd-label">{label}{optional && <span className="text-ink-soft/60 font-normal"> · optional</span>}</label>
      {children}
    </div>
  );
}

/** The /book-demo form. Posts to /api/demo, which saves the request for RANA HQ and confirms to the visitor. */
export default function BookDemoForm() {
  const [f, setF] = useState<Form>(EMPTY);
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [calling, setCalling] = useState(false);
  const [source, setSource] = useState("book-demo-page");
  const [talkId, setTalkId] = useState<string | undefined>();

  // Where the visitor came from (?from=hero, pricing-growth, …) and anything they already told us.
  useEffect(() => {
    captureUtm();
    const from = new URLSearchParams(window.location.search).get("from");
    if (from) setSource(`book-demo|${from.replace(/[^\w.-]/g, "").slice(0, 60)}`);
    const p = takeDemoPrefill();
    if (!p) return;
    const langs = (p.languages || []).filter((l) => LANGS.includes(l));
    setTalkId(p.talkId);
    setF((x) => ({
      ...x,
      name: p.name || x.name, phone: p.phone || x.phone, email: p.email || x.email, company: p.company || x.company, message: p.message || x.message,
      languages: langs.length ? langs : x.languages,
    }));
    if (p.message) setMore(true);
  }, []);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }));
  const toggleLang = (l: string) => set("languages", f.languages.includes(l) ? f.languages.filter((x) => x !== l) : [...f.languages, l]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const tag = utmTag();
      const r = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, talkId, source: tag ? `${source}|${tag}` : source }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Couldn't send. Please email hello@ranaai.in.");
      setCalling(!!j.calling);
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="bd-panel p-7 sm:p-9" data-testid="book-demo-done" role="status">
        <div className="bd-check" aria-hidden>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
        </div>
        <h2 className="font-display text-[28px] font-semibold tracking-tight mt-6">You&apos;re booked, {f.name.split(" ")[0]}.</h2>
        {calling ? (
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-signal/30 bg-signal/[.07] px-4 py-3" data-testid="book-demo-calling">
            <span className="bd-pulse shrink-0" aria-hidden />
            <p className="text-[15px] leading-snug">
              <b>Priya, our AI assistant, is calling you right now</b> on <span className="tabular-nums">{f.phone}</span>, in {callLanguage(f.callLanguage).label}. Keep your phone close: she&apos;ll ask a few quick questions so your demo is about your business.
            </p>
          </div>
        ) : (
          <p className="text-ink-soft text-[15px] leading-relaxed mt-2">
            We&apos;ll call you on <span className="text-ink tabular-nums">{f.phone}</span> within one working day{f.bestTime ? `, ${f.bestTime.toLowerCase()}` : ""}.
          </p>
        )}
        {f.email && <p className="text-ink-soft text-[14px] mt-3">A confirmation is on its way to <span className="text-ink">{f.email}</span>.</p>}
        <div className="flex flex-wrap gap-3 mt-8">
          <Link href="/?try=1" className="btn-glow inline-flex items-center h-11 px-6 rounded-full text-[14px] font-semibold">Try an instant demo</Link>
          <Link href="/" className="btn-ghost inline-flex items-center h-11 px-6 rounded-full text-[14px] font-medium">Back to the site</Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="bd-panel p-6 sm:p-8 flex flex-col gap-5" data-testid="book-demo-form">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-[22px] font-semibold tracking-tight">Book your demo</h2>
        <span className="text-[12px] text-ink-soft">Takes ~1 minute</span>
      </div>

      <input type="text" name="website" value={f.website} onChange={(e) => set("website", e.target.value)} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden />

      <div className="grid sm:grid-cols-2 gap-4">
        <Field id="bd-name" label="Your name">
          <input id="bd-name" required value={f.name} onChange={(e) => set("name", e.target.value)} className="bd-input" autoComplete="name" />
        </Field>
        <Field id="bd-phone" label="Mobile number">
          <input id="bd-phone" required inputMode="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="98xxxxxxxx" className="bd-input tabular-nums" autoComplete="tel" />
        </Field>
        <Field id="bd-company" label="Company">
          <input id="bd-company" required value={f.company} onChange={(e) => set("company", e.target.value)} className="bd-input" autoComplete="organization" />
        </Field>
        <Field id="bd-email" label="Work email" optional>
          <input id="bd-email" type="email" value={f.email} onChange={(e) => set("email", e.target.value)} className="bd-input" autoComplete="email" />
        </Field>
      </div>

      <fieldset>
        <legend className="bd-label">Which language should we call you in?</legend>
        <div className="flex flex-wrap gap-1.5" role="radiogroup" data-testid="book-demo-call-language">
          {CALL_LANGUAGES.map((l) => (
            <button type="button" key={l.code} role="radio" aria-checked={f.callLanguage === l.code} onClick={() => set("callLanguage", l.code)} className={`bd-pill ${f.callLanguage === l.code ? "is-on" : ""}`}>
              {l.code === "en" ? l.label : <>{l.native} <span className="opacity-60">· {l.label}</span></>}
            </button>
          ))}
        </div>
        <p className="text-[12px] text-ink-soft mt-1.5">Our AI assistant calls you within seconds and speaks this language from the first word.</p>
      </fieldset>

      <fieldset>
        <legend className="bd-label">What should RANA do?</legend>
        <div className="bd-segment" role="radiogroup">
          {WANTS.map(([k, l]) => (
            <button type="button" key={k} role="radio" aria-checked={f.wants === k} onClick={() => set("wants", k)} className={f.wants === k ? "is-on" : ""}>{l}</button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="bd-label">Languages your customers speak</legend>
        <div className="flex flex-wrap gap-1.5">
          {LANGS.map((l) => (
            <button type="button" key={l} aria-pressed={f.languages.includes(l)} onClick={() => toggleLang(l)} className={`bd-pill ${f.languages.includes(l) ? "is-on" : ""}`}>{l}</button>
          ))}
        </div>
      </fieldset>

      <div>
        <button type="button" onClick={() => setMore((m) => !m)} aria-expanded={more} aria-controls="bd-more" className="text-[13px] text-ink-soft hover:text-ink inline-flex items-center gap-1.5">
          <span className={`inline-block transition-transform ${more ? "rotate-45" : ""}`} aria-hidden>+</span>
          {more ? "Fewer details" : "Add more details (optional)"}
        </button>
        {more && (
          <div id="bd-more" className="grid sm:grid-cols-2 gap-4 mt-4 animate-rise">
            <Field id="bd-ind" label="Your business">
              <select id="bd-ind" value={f.industry} onChange={(e) => set("industry", e.target.value)} className="bd-input"><option value="">Choose…</option>{INDUSTRIES.map((x) => <option key={x}>{x}</option>)}</select>
            </Field>
            <Field id="bd-vol" label="Calls a month">
              <select id="bd-vol" value={f.volume} onChange={(e) => set("volume", e.target.value)} className="bd-input"><option value="">Choose…</option>{VOLUMES.map((x) => <option key={x}>{x}</option>)}</select>
            </Field>
            <Field id="bd-time" label="Best time to call">
              <select id="bd-time" value={f.bestTime} onChange={(e) => set("bestTime", e.target.value)} className="bd-input"><option value="">Any time</option>{TIMES.map((x) => <option key={x}>{x}</option>)}</select>
            </Field>
            <Field id="bd-msg" label="Anything we should know?">
              <input id="bd-msg" value={f.message} onChange={(e) => set("message", e.target.value)} placeholder="e.g. we miss calls after 7 PM" className="bd-input" />
            </Field>
          </div>
        )}
      </div>

      <label className="flex items-start gap-2.5 text-[12.5px] text-ink-soft">
        <input type="checkbox" required checked={f.consent} onChange={(e) => set("consent", e.target.checked)} className="mt-0.5 accent-[rgb(var(--c-signal))]" />
        <span>RANA AI may call or message me about this demo. We never share your number.</span>
      </label>

      {error && <div role="alert" className="text-[13px] text-miss bg-miss/10 border border-miss/30 rounded-xl px-3 py-2">{error}</div>}

      <button type="submit" disabled={busy} className="btn-glow h-12 rounded-full text-[15px] font-semibold disabled:opacity-50" data-testid="book-demo-submit">
        {busy ? "Booking…" : "Book my demo →"}
      </button>
    </form>
  );
}
