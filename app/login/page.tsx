// @ts-nocheck
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import { bookDemoHref } from "@/app/book-demo/link";

// Messages for /login?error=… set by the Google sign-in callback.
const GOOGLE_ERRORS = {
  google_no_account: "No RANA account uses this Google email. Ask your team's owner to invite you, or sign in with the email your workspace uses.",
  google_removed: "Your access has been removed. Ask your team's owner or admin.",
  google_disabled: "This workspace is turned off. Contact support@ranaai.in.",
  google_cancelled: "Google sign-in was cancelled.",
  google_expired: "That Google sign-in took too long. Please try again.",
  google_failed: "Google sign-in didn't work just now. Try again, or use your email and password.",
  google_off: "Google sign-in isn't available yet. Use your email and password.",
};

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [justReset, setJustReset] = useState(false);
  const [google, setGoogle] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ticket, setTicket] = useState("");
  const [code, setCode] = useState("");
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const e = q.get("email"); if (e) setEmail(e);
    setJustReset(q.get("reset") === "1");
    const ge = q.get("error"); if (ge && GOOGLE_ERRORS[ge]) setError(GOOGLE_ERRORS[ge]);
    // Back from Google with two-step login on: the signed ticket arrives in the URL fragment.
    const h = new URLSearchParams(window.location.hash.slice(1)).get("2fa");
    if (h) { setTicket(h); history.replaceState(null, "", window.location.pathname + window.location.search); }
    fetch("/api/auth/providers").then((r) => r.json()).then((p) => setGoogle(!!p.google)).catch(() => {});
  }, []);
  function go(data) {
    // Invited with a one-time password: set their own before anything else.
    if (data.mustChangePassword) { router.push("/settings?tab=account&first=1"); return; }
    const next = new URLSearchParams(window.location.search).get("next"); const safe = !!next && /^\/(?![\/\\])/.test(next) && !/[\\\s]/.test(next) && next !== "/"; // blocks //evil and /\evil
    router.push(safe ? next! : (data.home || "/"));
  }
  function googleHref() {
    const q = new URLSearchParams();
    const next = new URLSearchParams(window.location.search).get("next"); if (next) q.set("next", next);
    if (email.trim()) q.set("email", email.trim());
    const s = q.toString();
    return `/api/auth/google${s ? `?${s}` : ""}`;
  }
  async function handleCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/2fa", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticket, code }) });
      const data = await res.json();
      if (!res.ok) { if (res.status === 401 && /took too long/.test(data.error || "")) setTicket(""); throw new Error(data.error || "Sign-in failed"); }
      go(data);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim(), password }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      if (data.twoFactor) { setTicket(data.ticket); setCode(""); return; }
      go(data);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }
  const field = "w-full border border-line rounded-xl px-3.5 py-3 text-[14px] bg-sunken outline-none focus:border-signal";
  return (
    <AuthShell foot={<>New to RANA? <a href={bookDemoHref("login")} className="text-signal font-semibold">Book a demo</a> · Help: <span className="text-signal font-medium">support@ranaai.in</span></>}>
      {ticket ? (
        <form onSubmit={handleCode} className="flex flex-col gap-4" data-testid="twofa-form">
          <div className="eyebrow">Step 2 of 2</div>
          <h1 className="font-display text-[28px] font-semibold tracking-tight -mt-2">Enter your 6-digit code</h1>
          <p className="text-[13px] text-ink-soft -mt-2">Open your authenticator app and type the code shown for RANA AI.</p>
          <input id="twofa-code" inputMode="numeric" autoComplete="one-time-code" autoFocus value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="123456" className="w-full border border-line rounded-xl px-3 py-3.5 text-[24px] font-mono tracking-[0.4em] text-center bg-sunken outline-none focus:border-signal" />
          {error && <div className="text-[12.5px] text-miss bg-miss-tint border border-miss/20 rounded-xl px-3 py-2.5">{error}</div>}
          <button type="submit" disabled={loading || code.length !== 6} className="bg-signal text-on-accent rounded-xl py-3 text-[14px] font-semibold disabled:opacity-40">{loading ? "Checking…" : "Verify and sign in"}</button>
          <button type="button" onClick={() => { setTicket(""); setError(""); }} className="text-[12.5px] text-ink-soft hover:text-ink">← Use a different account</button>
        </form>
      ) : (
        <>
          <div className="eyebrow">Welcome back</div>
          <h1 className="font-display text-[30px] font-semibold tracking-tight mt-1 mb-1.5">Sign in to RANA</h1>
          <p className="text-[13.5px] text-ink-soft mb-7">Your AI employees kept working while you were away.</p>
          {justReset && <div className="text-[13px] bg-signal/10 border border-signal/25 rounded-xl px-3.5 py-2.5 mb-4" data-testid="reset-ok">✓ Password changed. Sign in with your new password.</div>}
          {google && (
            <>
              <a href="/api/auth/google" onClick={(e) => { e.preventDefault(); window.location.href = googleHref(); }} className="w-full flex items-center justify-center gap-2.5 border border-line rounded-xl py-3 text-[14px] font-semibold bg-sunken hover:border-signal" data-testid="google-signin">
                <GoogleMark />Continue with Google
              </a>
              <div className="flex items-center gap-3 my-5 text-[11.5px] text-ink-soft" aria-hidden="true"><span className="flex-1 h-px bg-line" />or use your email<span className="flex-1 h-px bg-line" /></div>
            </>
          )}
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div><label htmlFor="login-email" className="text-[12px] font-semibold text-ink-soft block mb-1.5">Work email</label><input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" autoFocus className={field} /></div>
            <div><div className="flex items-center justify-between mb-1.5"><label htmlFor="login-password" className="text-[12px] font-semibold text-ink-soft">Password</label><a href={`/forgot-password${email.trim() ? `?email=${encodeURIComponent(email.trim())}` : ""}`} className="text-[12px] text-signal font-semibold" data-testid="forgot-link">Forgot password?</a></div><input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={field} /></div>
            {error && <div className="text-[12.5px] text-miss bg-miss-tint border border-miss/20 rounded-xl px-3 py-2.5">{error}</div>}
            <button type="submit" disabled={loading || !email.trim() || !password.trim()} className="bg-signal text-on-accent rounded-xl py-3 text-[14px] font-semibold disabled:opacity-40 mt-1">{loading ? "Signing in…" : "Sign in →"}</button>
          </form>
        </>
      )}
    </AuthShell>
  );
}
