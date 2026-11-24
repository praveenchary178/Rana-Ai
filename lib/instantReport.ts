// After every instant call to a website lead: was it picked up or not (DNP), and if picked up, what they told Priya.
// Saved on the instant_calls row (HQ → Website leads) and emailed once to RANA HQ as a clean call report.
import { sb } from "./db";
import { chatJson } from "./llm";
import { hqEmails } from "./hq";
import { sendEmail } from "./notify";
import { callReportEmail, type CallAnswers } from "./leadEmails";
import { demoFollowup, type DemoRead } from "./demoFollowup";
import { istLabel } from "./googleCalendar";

type Turn = { role: string; text: string };

const turnsOf = (call: any): Turn[] =>
  (Array.isArray(call?.transcript) ? call.transcript : [])
    .map((t: any) => ({ role: t?.role === "user" ? "user" : "agent", text: String(t?.text || t?.indic_text || "").trim() }))
    .filter((t: Turn) => t.text);

/** connected + they actually spoke = picked up. Everything else is "did not pick up", with the reason. */
export function outcomeOf(call: any): { picked: boolean; detail: string } {
  const status = String(call?.connectivity_status || call?.raw_payload?.connectivity_status || "").toLowerCase();
  const dur = Number(call?.duration_seconds) || 0;
  const spoke = turnsOf(call).some((t) => t.role === "user");
  if (status === "connected" && dur > 0 && spoke) return { picked: true, detail: "connected" };
  if (status === "busy") return { picked: false, detail: "busy" };
  if (status === "connected" && dur > 0) return { picked: false, detail: "answered but said nothing" };
  if (status === "failed") return { picked: false, detail: "call failed" };
  return { picked: false, detail: status && status !== "connected" ? status.replace(/_/g, " ") : "no answer" };
}

const ANSWER_KEYS: (keyof CallAnswers)[] = ["reason_looking", "business", "city", "call_volume", "languages", "role", "decision_maker", "stakeholders", "pain_points", "current_setup", "demo_time", "email", "next_step"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function readAnswers(turns: Turn[], lead: any): Promise<{ answers: CallAnswers; summary: string | null; interest: string | null; demo: DemoRead }> {
  const transcript = turns.map((t) => `${t.role === "user" ? "Lead" : "Priya"}: ${t.text}`).join("\n").slice(0, 12000);
  const when = istLabel(new Date(lead.called_at || lead.created_at || Date.now()), true);
  const empty: DemoRead = { meetingIso: null, meetingConfirmed: false, attendeeEmails: [], solution: [], outcome: null };
  try {
    const j = await chatJson<any>([
      {
        role: "system",
        content: `You read a B2B sales call between Priya (RANA AI's AI sales assistant) and a business lead. RANA AI sells AI employees that answer and make business phone calls in Indian languages.
The call took place on ${when} (India time, IST). Resolve words like "tomorrow" or "Friday" against that date.
Return JSON only, with these keys:
{"reason_looking","business","city","call_volume","languages","role","decision_maker","stakeholders","pain_points","current_setup","demo_time","email","next_step","interest","summary","call_outcome","meeting_confirmed","meeting_start_iso","attendee_emails","solution"}
- Text fields: a short plain-English phrase from what the LEAD said (translate Telugu/Hindi/Tamil etc. to English), or null if not said. Never invent.
- business: their business / industry. call_volume: calls or enquiries they handle. languages: their customers' languages.
- role: the lead's designation. decision_maker: "yes", "no" or "shared" plus who decides, e.g. "no - MD Ramesh decides". stakeholders: other people who should join the demo (name and role).
- pain_points: the problems they described. current_setup: how calls are handled today (team size, tools, CRM).
- demo_time: the day/time agreed for the demo, in words. email: the lead's email if they said or confirmed one.
- next_step: what RANA's team should do next.
- interest: "hot" (wants a demo / to buy soon), "warm" (interested), "cold" (not interested) or "unclear".
- summary: 2-3 crisp sentences for the founder.
- call_outcome: one of demo_booked, callback, interested, not_interested, do_not_call, no_decision.
- meeting_confirmed: true ONLY if the lead clearly agreed to a specific date AND time for the demo meeting.
- meeting_start_iso: that agreed start as ISO 8601 with +05:30 offset (e.g. "2026-11-20T11:00:00+05:30"), else null.
- attendee_emails: array of email addresses the lead gave for people to invite (their own included), spelled as said; [] if none. Only real email addresses.
- solution: array of 2-4 short, specific sentences on how RANA AI helps THIS business with the problems they described (e.g. "Answer every after-hours enquiry in Telugu and send hot leads to your sales team on WhatsApp"). Use only these capabilities: answering inbound calls 24x7, calling leads/customers (follow-ups, reminders, renewals, feedback, collections reminders), 11 Indian languages plus English with mid-call switching, lead qualification and scoring, call recordings/transcripts/summaries, alerts to WhatsApp/email/CRM (HubSpot, Zoho, Google Sheets), go-live on their own script.`,
      },
      { role: "user", content: `Lead: ${lead.name || "unknown"}${lead.company ? `, ${lead.company}` : ""} (came from: ${lead.source}${lead.email ? `; email on the form: ${lead.email}` : ""})

${transcript}` },
    ], { maxTokens: 1200, temperature: 0, timeoutMs: 30_000 });
    const answers: CallAnswers = {};
    for (const k of ANSWER_KEYS) { const v = String(j?.[k] ?? "").trim(); if (v && !/^(null|none|n\/a|unknown)$/i.test(v)) answers[k] = v.slice(0, 300); }
    const interest = ["hot", "warm", "cold"].includes(String(j?.interest)) ? String(j.interest) : null;
    const outcomes = ["demo_booked", "callback", "interested", "not_interested", "do_not_call", "no_decision"];
    const demo: DemoRead = {
      meetingIso: typeof j?.meeting_start_iso === "string" && !isNaN(Date.parse(j.meeting_start_iso)) ? j.meeting_start_iso : null,
      meetingConfirmed: j?.meeting_confirmed === true,
      attendeeEmails: (Array.isArray(j?.attendee_emails) ? j.attendee_emails : []).map((e: any) => String(e || "").trim().toLowerCase().replace(/\s+/g, "")).filter((e: string) => EMAIL_RE.test(e)).slice(0, 8),
      solution: (Array.isArray(j?.solution) ? j.solution : []).map((x: any) => String(x || "").trim()).filter(Boolean).slice(0, 4).map((x: string) => x.slice(0, 240)),
      outcome: outcomes.includes(String(j?.call_outcome)) ? String(j.call_outcome) : null,
    };
    return { answers, summary: String(j?.summary || "").trim().slice(0, 700) || null, interest, demo };
  } catch (e: any) {
    console.error("[instant report] read failed", e?.message);
    return { answers: {}, summary: null, interest: null, demo: empty };
  }
}

/**
 * Build (and by default email) the report for one instant call. Runs once per instant call: a call that's already
 * reported is left alone unless `force`. Never throws.
 */
export async function reportInstantCall(instantId: string, call: any, o: { email?: boolean; force?: boolean } = {}): Promise<boolean> {
  try {
    const [lead] = (await sb<any[]>(`/instant_calls?id=eq.${instantId}&select=*&limit=1`).catch(() => [])) || [];
    if (!lead || (lead.reported_at && !o.force)) return false;
    // Claim it first, so a retried webhook arriving at the same moment doesn't send a second email.
    if (!o.force) {
      const claimed = (await sb<any[]>(`/instant_calls?id=eq.${instantId}&reported_at=is.null`, { method: "PATCH", body: JSON.stringify({ reported_at: new Date().toISOString() }) }).catch(() => [])) || [];
      if (!claimed.length) return false;
    }
    const { picked, detail } = outcomeOf(call);
    const turns = turnsOf(call);
    const read = picked ? await readAnswers(turns, lead) : { answers: {} as CallAnswers, summary: null, interest: null, demo: { meetingIso: null, meetingConfirmed: false, attendeeEmails: [], solution: [], outcome: null } as DemoRead };
    const leadStatus = picked ? (["hot", "warm", "cold"].includes(String(call?.lead_status)) ? call.lead_status : read.interest) : null;
    const summary = picked ? read.summary || String(call?.summary || "").trim() || null : null;
    const duration = Math.round(Number(call?.duration_seconds) || 0) || null;
    await sb(`/instant_calls?id=eq.${instantId}`, {
      method: "PATCH", prefer: "return=minimal",
      body: JSON.stringify({ outcome: picked ? "picked" : "not_picked", outcome_detail: detail, duration_seconds: duration, lead_status: leadStatus, summary, answers: read.answers, call_id: call?.id || lead.call_id || null, reported_at: new Date().toISOString() }),
    });
    // The lead's own email after the call (cc the founders): demo booked with a Google Meet invite, or a summary + brochure.
    const follow = o.email !== false ? await demoFollowup({ ...lead, answers: read.answers, summary }, { picked, detail, demo: read.demo }) : null;
    if (o.email !== false) {
      const mail = callReportEmail({ lead, picked, detail, duration, leadStatus, summary, answers: read.answers, transcript: turns, followup: follow });
      await sendEmail({ to: Array.from(new Set([...hqEmails(), "hello@ranaai.in"])), subject: mail.subject, html: mail.html, kind: "instant_call_report" });
    }
    return true;
  } catch (e: any) {
    console.error("[instant report]", e?.message || e);
    return false;
  }
}
