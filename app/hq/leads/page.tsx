"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { callLanguage } from "@/lib/callLanguages";

type Lead = {
  id: string; created_at: string; source: string; name: string | null; company: string | null; phone: string; email: string | null;
  language: string | null; call_status: string | null; call_note: string | null; called_at: string | null; wa_status: string | null; email_status: string | null;
  call_id: string | null; outcome: "picked" | "not_picked" | null; outcome_detail: string | null; duration_seconds: number | null;
  lead_status: string | null; summary: string | null; answers: Record<string, string> | null; reported_at: string | null;
  transcript: { role: string; text: string }[]; recording_url: string | null;
  meeting_at: string | null; meeting_link: string | null; meeting_status: string | null; attendees: string[] | null; followup_status: string | null;
};
type Cal = { connected: boolean; email: string | null; available: boolean; slots: { iso: string; label: string }[] };

const SOURCE: Record<string, string> = { demo: "Book a demo", signup: "Free trial", proof_run: "Proof run", talk: "Talk to Rana" };
const ANSWERS: [string, string][] = [
  ["reason_looking", "Why they're looking"], ["business", "Business"], ["city", "City"], ["call_volume", "Call volume"],
  ["role", "Their role"], ["decision_maker", "Decision maker"], ["stakeholders", "Others to involve"], ["pain_points", "Pain points"],
  ["current_setup", "Calls today"], ["languages", "Languages"], ["demo_time", "Demo / callback"], ["email", "Email"], ["next_step", "Next step"],
];
const FOLLOWUP: Record<string, string> = { booked: "Demo booked email sent", summary: "Summary + brochure sent", missed: "Missed-call email sent" };
const meetingWhen = (d: string) => new Date(d).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true });
const TONE: Record<string, string> = { hot: "text-hot border-hot/50 bg-hot/10", warm: "text-[#c98a00] border-[#c98a00]/40 bg-[#c98a00]/10", cold: "text-ink-soft border-line" };

const when = (d: string) => {
  const s = (Date.now() - Date.parse(d)) / 1000;
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
};
const dur = (s: number | null) => { const n = Math.round(Number(s) || 0); return n >= 60 ? `${Math.floor(n / 60)}m ${String(n % 60).padStart(2, "0")}s` : `${n}s`; };
const pretty = (p: string) => p.replace(/^\+91(\d{5})(\d{5})$/, "+91 $1 $2");

/** One status for the card: picked / did not pick up / calling / no call. */
function stateOf(r: Lead): { key: string; label: string; cls: string } {
  if (r.outcome === "picked") return { key: "picked", label: `Picked up · ${dur(r.duration_seconds)}`, cls: "text-signal border-signal/50 bg-signal/10" };
  if (r.outcome === "not_picked") return { key: "dnp", label: `Did not pick up · ${r.outcome_detail || "no answer"}`, cls: "text-hot border-hot/50 bg-hot/10" };
  if (r.call_status === "placed") return Date.now() - Date.parse(r.called_at || r.created_at) > 15 * 60_000
    ? { key: "dnp", label: "No result from the call", cls: "text-hot border-hot/50 bg-hot/10" }
    : { key: "calling", label: "Calling now…", cls: "text-signal border-signal/40" };
  return { key: "none", label: r.call_status === "failed" ? "Call failed" : "Not called", cls: "text-ink-soft border-line" };
}

function exportCsv(rows: Lead[]) {
  const q = (x: any) => `"${String(x ?? "").replace(/"/g, '""')}"`;
  const head = ["Date", "Name", "Company", "Phone", "Email", "Source", "Language", "Result", "Duration (s)", "Lead", ...ANSWERS.map(([, l]) => l), "Summary", "WhatsApp", "Email sent"];
  const lines = rows.map((r) => [
    new Date(r.created_at).toLocaleString("en-IN"), r.name, r.company, r.phone, r.email, SOURCE[r.source] || r.source, callLanguage(r.language).label,
    stateOf(r).label, Math.round(Number(r.duration_seconds) || 0) || "", r.lead_status, ...ANSWERS.map(([k]) => r.answers?.[k]), r.summary, r.wa_status, r.email_status,
  ].map(q).join(","));
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["﻿" + [head.map(q).join(","), ...lines].join("\n")], { type: "text/csv" }));
  a.download = `rana-website-leads-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** RANA HQ → Website leads: everyone who left a number on ranaai.in, Priya's instant call, and what they said. */
export default function HqLeadsPage() {
  const [rows, setRows] = useState<Lead[] | null>(null);
  const [err, setErr] = useState("");
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState("");
  const [cal, setCal] = useState<Cal | null>(null);
  const [calMsg, setCalMsg] = useState("");

  const load = () => fetch("/api/hq/leads").then(async (r) => { const j = await r.json(); if (!r.ok) throw new Error(j.error); setRows(j.rows); }).catch((e) => setErr(e.message));
  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, []);
  const loadCal = () => fetch("/api/hq/google-calendar").then((r) => r.json()).then((j) => { if (!j.error) setCal(j); }).catch(() => {});
  useEffect(() => {
    loadCal();
    const c = new URLSearchParams(window.location.search).get("calendar");
    const msg: Record<string, string> = { connected: "Google Calendar connected. New demo bookings get a Google Meet invite.", failed: "Couldn't connect Google Calendar. Check that the Google Calendar API is enabled in your Google Cloud project, then try again.", not_allowed: "Only a founder can connect the calendar.", google_off: "Google sign-in isn't set up on this server." };
    if (c && msg[c]) setCalMsg(msg[c]);
  }, []);
  async function disconnectCal() {
    if (!confirm("Disconnect Google Calendar? New bookings will go out as email invites without a Meet link.")) return;
    await fetch("/api/hq/google-calendar", { method: "DELETE" }).catch(() => {});
    setCalMsg("Google Calendar disconnected."); loadCal();
  }

  async function rebuild(id: string) {
    setBusy(id);
    await fetch("/api/hq/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }).catch(() => {});
    await load(); setBusy("");
  }

  const all = rows || [];
  const stats = useMemo(() => {
    const s = all.map(stateOf);
    const picked = s.filter((x) => x.key === "picked").length, dnp = s.filter((x) => x.key === "dnp").length;
    return { total: all.length, picked, dnp, rate: picked + dnp ? Math.round((picked / (picked + dnp)) * 100) : 0, hot: all.filter((r) => r.lead_status === "hot").length, warm: all.filter((r) => r.lead_status === "warm").length };
  }, [all]);

  const shown = all.filter((r) => {
    const st = stateOf(r).key;
    const ok = filter === "all" || (filter === "picked" ? st === "picked" : filter === "dnp" ? st === "dnp" : filter === "hot" || filter === "warm" ? r.lead_status === filter : r.source === filter);
    const t = q.trim().toLowerCase();
    return ok && (!t || [r.name, r.company, r.phone, r.email, r.summary].some((v) => String(v || "").toLowerCase().includes(t)));
  });

  const Tile = ({ label, value, sub, tone }: { label: string; value: string | number; sub?: string; tone?: string }) => (
    <div className="border border-line rounded-xl bg-raised px-4 py-3.5">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">{label}</div>
      <div className={`text-[26px] font-display font-semibold tabular-nums mt-0.5 ${tone || ""}`}>{value}</div>
      {sub && <div className="text-[12px] text-ink-soft">{sub}</div>}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar active="hq" />
      <div className="flex-1 p-6 md:p-10 min-w-0">
        <div className="w-full max-w-[1400px] flex flex-col gap-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-signal"><Link href="/hq">RANA HQ</Link> · Website leads</div>
              <div className="text-[22px] font-display font-semibold">Every lead, every call, in one place</div>
              <div className="text-[13px] text-ink-soft mt-0.5">Everyone who left their number on ranaai.in. Priya calls them within seconds; you see whether they picked up and exactly what they said. A call report also lands in your inbox.</div>
            </div>
            <button onClick={() => exportCsv(shown)} disabled={!shown.length} className="rounded-full border border-line px-4 py-2 text-[13px] font-semibold hover:border-ink disabled:opacity-50" data-testid="leads-export">Download CSV</button>
          </div>

          <div className={`border rounded-xl px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] ${cal?.connected ? "border-signal/40 bg-signal/5" : "border-hot/40 bg-hot/5"}`} data-testid="calendar-card">
            <div className="min-w-0 flex-1">
              <b>Demo bookings · Google Calendar</b>{" "}
              {cal == null ? <span className="text-ink-soft">checking…</span>
                : cal.connected ? <span className="text-ink-soft">Connected{cal.email ? ` (${cal.email})` : ""}. When a lead agrees a time with Priya, a Google Meet invite goes to them and to you, plus an email with the agenda.</span>
                : <span className="text-ink-soft">Not connected. Bookings still go out by email with a calendar file, but without a Google Meet link. Connect once to fix that.</span>}
              {cal?.slots?.length ? <div className="text-[12px] text-ink-soft mt-1">Priya offers the next free slots: {cal.slots.slice(0, 4).map((x) => x.label).join(" · ")} (IST)</div> : null}
              {calMsg && <div className="text-[12.5px] mt-1 font-semibold">{calMsg}</div>}
            </div>
            {cal && (cal.connected
              ? <button onClick={disconnectCal} className="rounded-full border border-line px-3.5 py-1.5 text-[12.5px] hover:border-ink">Disconnect</button>
              : <a href="/api/hq/google-calendar/connect" className="rounded-full bg-ink text-paper px-4 py-2 text-[13px] font-semibold" data-testid="calendar-connect">Connect Google Calendar</a>)}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3" data-testid="leads-stats">
            <Tile label="Website leads" value={stats.total} />
            <Tile label="Picked up" value={stats.picked} sub={`${stats.rate}% pick-up rate`} tone="text-signal" />
            <Tile label="Did not pick up" value={stats.dnp} sub="Call these back" tone={stats.dnp ? "text-hot" : ""} />
            <Tile label="Hot" value={stats.hot} tone={stats.hot ? "text-hot" : ""} />
            <Tile label="Warm" value={stats.warm} />
          </div>

          {err && <div className="text-[13px] text-miss">{err}</div>}
          <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
            {[["all", "All"], ["picked", "Picked up"], ["dnp", "Did not pick up"], ["hot", "Hot"], ["warm", "Warm"], ["demo", "Book a demo"], ["signup", "Free trial"], ["proof_run", "Proof run"], ["talk", "Talk to Rana"]].map(([k, l]) => (
              <button key={k} onClick={() => setFilter(k)} className={`rounded-full border px-3 py-1 ${filter === k ? "bg-ink text-paper border-ink font-semibold" : "border-line text-ink-soft hover:text-ink"}`}>{l}</button>
            ))}
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, company, phone…" className="ml-auto min-w-[220px] border border-line rounded-full px-3.5 py-1.5 bg-sunken text-[13px]" aria-label="Search leads" />
          </div>

          {!rows && !err && <div className="text-[13px] text-ink-soft">Loading…</div>}
          {rows && shown.length === 0 && <div className="border border-dashed border-line rounded-xl p-6 text-[13px] text-ink-soft">No leads here yet.</div>}

          <div className="flex flex-col gap-3" data-testid="leads-list">
            {shown.map((r) => {
              const st = stateOf(r);
              const lang = callLanguage(r.language);
              const answers = ANSWERS.filter(([k]) => r.answers?.[k]);
              return (
                <div key={r.id} className="border border-line rounded-xl bg-raised p-4 sm:p-5 flex flex-col gap-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[15.5px] font-semibold">{r.name || "Unknown"}{r.company && <span className="text-ink-soft font-normal"> · {r.company}</span>}</div>
                      <div className="text-[13px] mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
                        <a href={`tel:${r.phone}`} className="text-signal font-semibold tabular-nums">📞 {pretty(r.phone)}</a>
                        {r.email && <a href={`mailto:${r.email}`} className="text-signal">✉️ {r.email}</a>}
                        <span className="text-ink-soft">{SOURCE[r.source] || r.source} · {lang.label} · {when(r.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className={`text-[11.5px] font-semibold border rounded-full px-2.5 py-0.5 ${st.cls}`} data-testid="lead-outcome">{st.label}</span>
                      {r.lead_status && <span className={`text-[11.5px] font-semibold border rounded-full px-2.5 py-0.5 capitalize ${TONE[r.lead_status] || TONE.cold}`}>{r.lead_status}</span>}
                    </div>
                  </div>

                  {r.meeting_at && (
                    <div className="rounded-lg border border-signal/40 bg-signal/5 px-3 py-2 text-[13px] flex flex-wrap items-center gap-x-3 gap-y-1" data-testid="lead-meeting">
                      <b>📅 Demo: {meetingWhen(r.meeting_at)} IST</b>
                      {r.meeting_link ? <a href={r.meeting_link} target="_blank" rel="noreferrer" className="text-signal font-semibold">Google Meet</a> : <span className="text-hot">No Meet link (calendar not connected): send them one.</span>}
                      {r.attendees?.length ? <span className="text-ink-soft">Invited: {r.attendees.join(", ")}</span> : null}
                    </div>
                  )}
                  {r.summary && <div className="text-[14px] leading-relaxed border-l-2 border-signal pl-3">{r.summary}</div>}

                  {answers.length > 0 && (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
                      {answers.map(([k, l]) => (
                        <div key={k} className="rounded-lg bg-sunken px-3 py-2">
                          <div className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-soft">{l}</div>
                          <div className="text-[13px] mt-0.5">{r.answers![k]}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {st.key === "dnp" && <div className="text-[13px] text-hot">Didn&apos;t reach them — call back on <a href={`tel:${r.phone}`} className="font-semibold underline">{pretty(r.phone)}</a>.</div>}
                  {st.key === "none" && r.call_note && <div className="text-[12.5px] text-ink-soft">No instant call: {r.call_note}</div>}

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 border-t border-line/60 text-[12px] text-ink-soft">
                    <span>WhatsApp: <b className={String(r.wa_status).startsWith("sent") ? "text-signal" : ""}>{r.wa_status || "—"}</b></span>
                    <span>Email: <b className={String(r.email_status).startsWith("sent") ? "text-signal" : ""}>{r.email_status || "—"}</b></span>
                    {r.followup_status && <span>After call: <b className={FOLLOWUP[r.followup_status] ? "text-signal" : ""}>{FOLLOWUP[r.followup_status] || r.followup_status}</b></span>}
                    {r.transcript.length > 0 && <button onClick={() => setOpen((o) => ({ ...o, [r.id]: !o[r.id] }))} className="text-signal font-semibold">{open[r.id] ? "Hide conversation" : `Show conversation (${r.transcript.length})`}</button>}
                    {r.recording_url && <a href={r.recording_url} target="_blank" rel="noreferrer" className="text-signal font-semibold">Recording</a>}
                    {r.call_id && <button onClick={() => rebuild(r.id)} disabled={busy === r.id} className="ml-auto hover:text-ink">{busy === r.id ? "Refreshing…" : "Refresh report"}</button>}
                  </div>

                  {open[r.id] && (
                    <div className="rounded-lg bg-sunken p-3 flex flex-col gap-1.5 max-h-[360px] overflow-y-auto" data-testid="lead-transcript">
                      {r.transcript.map((t, i) => (
                        <div key={i} className="text-[13px] leading-relaxed"><b className={t.role === "user" ? "" : "text-signal"}>{t.role === "user" ? (r.name?.split(" ").find((w) => w.length > 1) || "Lead") : "Priya"}:</b> {t.text}</div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
