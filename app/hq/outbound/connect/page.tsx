"use client";
import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import OutboundShell, { Notice, Pill, btn, field, primary, getJson, when } from "@/components/OutboundShell";

/** RANA HQ → Outbound → Connect WhatsApp.
 *  Meta's Embedded Signup for the "Rana AI Connect" app (Tech Provider). With "Keep using the WhatsApp Business app"
 *  ticked it runs Coexistence onboarding: the number stays on the phone app (team replies there) and the API sends the
 *  automated messages. The code from Meta is exchanged server-side (wa-connect Edge Function); no token reaches the browser. */
const APP_ID = "2174868309818434";
const CONFIG_ID = "1674223797819655";
const GRAPH_VERSION = "v21.0";

type Session = { waba_id?: string; phone_number_id?: string; event?: string };

declare global { interface Window { FB?: any; fbAsyncInit?: () => void } }

export default function ConnectWhatsApp() {
  const [label, setLabel] = useState("");
  const [coex, setCoex] = useState(true);
  const [sdk, setSdk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [data, setData] = useState<any>(null);
  const [steps, setSteps] = useState<any>(null);
  const pending = useRef<{ code?: string; session?: Session }>({});
  const labelRef = useRef(""); labelRef.current = label;
  const coexRef = useRef(true); coexRef.current = coex;

  const load = () => getJson("/api/hq/wa-connect").then(setData).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);

  // Meta posts the chosen WhatsApp account / number to this window while the pop-up runs.
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (!/(^|\.)facebook\.com$/.test(new URL(e.origin).hostname)) return;
      let d: any; try { d = typeof e.data === "string" ? JSON.parse(e.data) : e.data; } catch { return; }
      if (d?.type !== "WA_EMBEDDED_SIGNUP") return;
      if (String(d.event || "").startsWith("FINISH")) { pending.current.session = { ...d.data, event: d.event }; finish(); }
      else if (d.event === "CANCEL") { setBusy(false); setErr(d.data?.current_step ? `Cancelled at: ${d.data.current_step}` : "Sign-up was cancelled."); }
      else if (d.event === "ERROR") { setBusy(false); setErr(d.data?.error_message || "Meta reported an error during sign-up."); }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    window.fbAsyncInit = () => { window.FB.init({ appId: APP_ID, autoLogAppEvents: true, xfbml: false, version: GRAPH_VERSION }); setSdk(true); };
    if (window.FB) setSdk(true);
  }, []);

  /** Runs once both halves have arrived (the login code and the WhatsApp account details), in either order. */
  async function finish() {
    const { code, session } = pending.current;
    if (!code || !session?.waba_id) return;
    pending.current = {};
    try {
      const r = await fetch("/api/hq/wa-connect", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, waba_id: session.waba_id, phone_number_id: session.phone_number_id, label: labelRef.current, coexistence: coexRef.current }) });
      const j = await r.json().catch(() => ({}));
      setSteps(j.steps || null);
      if (!r.ok || !j.ok) throw new Error(j.error || j.connection?.last_error || `Connection failed (${r.status})`);
      setMsg(`Connected ${j.connection?.verified_name || ""} ${j.connection?.display_phone || ""}`.trim() + ".");
      load();
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }

  function start() {
    setErr(""); setMsg(""); setSteps(null);
    if (!label.trim()) { setErr("Give this number a name first (e.g. Rana AI, AN Farms)."); return; }
    if (!window.FB) { setErr("Meta's login script hasn't loaded yet. Check your connection or ad blocker and try again."); return; }
    setBusy(true);
    pending.current = {};
    window.FB.login((res: any) => {
      if (res?.authResponse?.code) { pending.current.code = res.authResponse.code; finish(); }
      else { setBusy(false); if (!pending.current.session) setErr("Sign-up was closed before it finished."); }
    }, {
      config_id: CONFIG_ID, response_type: "code", override_default_response_type: true,
      extras: { setup: {}, sessionInfoVersion: "3", ...(coex ? { featureType: "whatsapp_business_app_onboarding" } : {}) },
    });
  }

  const conns: any[] = data?.connections || [];
  const secretMissing = data?.status && data.status.secret_set === false;

  return (
    <OutboundShell title="Connect WhatsApp" sub="Connect a WhatsApp number to RANA through Meta. Keep the WhatsApp Business app on the phone and let RANA send the automated messages from the same number.">
      <Script src="https://connect.facebook.net/en_US/sdk.js" strategy="afterInteractive" crossOrigin="anonymous" onLoad={() => { if (window.FB && !sdk) window.fbAsyncInit?.(); }} />
      <Notice err={err} msg={msg} onClear={() => { setErr(""); setMsg(""); }} />
      {secretMissing && <div className="text-[13px] text-miss border border-miss/40 bg-miss-tint rounded-lg p-3" data-testid="wac-secret">The Meta app secret (WA_CONNECT_APP_SECRET) isn't set in Supabase yet, so a sign-up can't be finished. Add it under Supabase → Edge Functions → Secrets.</div>}

      <div className="border border-line rounded-xl bg-raised p-4 md:p-5 flex flex-col gap-4 max-w-[640px]" data-testid="wac-form">
        <label className="text-[13px] font-semibold">Name for this number
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Rana AI, AN Farms" className={field + " text-[16px] md:text-[13px]"} maxLength={80} data-testid="wac-label" />
        </label>
        <label className="flex items-start gap-2 text-[13px]">
          <input type="checkbox" checked={coex} onChange={(e) => setCoex(e.target.checked)} className="mt-0.5" data-testid="wac-coex" />
          <span><b>Keep using the WhatsApp Business app on the phone</b> (Coexistence). The team keeps replying from the phone app; RANA sends automated messages from the same number. Untick only for a brand-new number that isn&apos;t on WhatsApp yet.</span>
        </label>
        {coex && <ul className="text-[12.5px] text-ink-soft list-disc pl-5 flex flex-col gap-1">
          <li>The phone needs WhatsApp Business app version 2.24.17 or newer, with the number already registered in it.</li>
          <li>Meta shows a QR code during sign-up: scan it from the WhatsApp Business app (Settings → Linked devices) to approve.</li>
          <li>Linked laptops are logged out once; link WhatsApp Web again afterwards. WhatsApp for Windows isn&apos;t supported with Coexistence.</li>
        </ul>}
        <div><button onClick={start} disabled={busy || !sdk} className={primary} data-testid="wac-start">{busy ? "Waiting for Meta…" : !sdk ? "Loading Meta…" : "Connect WhatsApp number"}</button></div>
        {steps && <details className="text-[12px] text-ink-soft"><summary className="cursor-pointer">Setup details</summary><pre className="whitespace-pre-wrap break-words mt-2">{JSON.stringify(steps, null, 2)}</pre></details>}
      </div>

      <div className="border border-line rounded-xl bg-raised" data-testid="wac-list">
        <div className="px-4 py-3 border-b border-line flex items-center justify-between"><div className="text-[14px] font-semibold">Connected numbers</div><button onClick={load} className={btn}>Refresh</button></div>
        {!data ? <div className="p-4 text-[13px] text-ink-soft">{err ? "" : "Loading…"}</div> : !conns.length ? <div className="p-4 text-[13px] text-ink-soft">No numbers connected through Rana AI Connect yet.</div> : (
          <div className="divide-y divide-line">
            {conns.map((c) => (
              <div key={c.id} className="px-4 py-3 flex flex-col gap-1 text-[13px]">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold">{c.label}</span>
                  <span className="text-ink-soft">{[c.verified_name, c.display_phone].filter(Boolean).join(" · ")}</span>
                  <Pill tone={c.status === "connected" ? "bg-signal-tint text-signal" : "bg-miss-tint text-miss"}>{c.status}</Pill>
                  {c.coexistence && <Pill>Phone app + API</Pill>}
                </div>
                <div className="text-[11.5px] text-ink-soft">Connected {when(c.created_at)}{c.connected_by ? ` by ${c.connected_by}` : ""}{c.token_expires_at ? ` · access renews by ${when(c.token_expires_at)}` : ""}</div>
                {c.last_error && <div className="text-[12px] text-miss">{c.last_error}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </OutboundShell>
  );
}
