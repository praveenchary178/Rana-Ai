// After Priya's instant call to a website lead (book a demo, Talk to Rana, follow-up…), the lead gets one email from
// RANA AI, with RANA's founders (RANA_HQ_EMAILS) in CC:
//   • demo agreed on a date and time → booked on HQ's Google Calendar with a Google Meet link (Google sends the invite to
//     the lead, anyone else they named, and the founders); the email has the date, Meet link, agenda and who should join.
//     Calendar not connected → the same email with an .ics invite attached instead.
//   • picked up, no meeting fixed → call summary, how RANA helps their business, the brochure, open demo slots.
//   • didn't pick up (demo requests only) → "sorry we missed you", the brochure and a way to pick a time.
// Never for "do not call" or without an email address. Runs once per instant call (followup_at claim). Never throws.
import { sb } from "./db";
import { hqEmails } from "./hq";
import { sendEmail, APP_URL, type EmailAttachment } from "./notify";
import { calendarStatus, createMeetEvent, icsInvite, istLabel, nextDemoSlots, DEMO_MINUTES } from "./googleCalendar";
import { demoBookedEmail, demoSummaryEmail, missedCallEmail, BROCHURE_PATH, type CallAnswers, type FollowupResult } from "./leadEmails";

export type DemoRead = { meetingIso: string | null; meetingConfirmed: boolean; attendeeEmails: string[]; solution: string[]; outcome: string | null };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const clip = (v: unknown, n: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, n);

async function patch(id: string, body: Record<string, unknown>) {
  await sb(`/instant_calls?id=eq.${id}`, { method: "PATCH", prefer: "return=minimal", body: JSON.stringify(body) }).catch(() => {});
}

/** A meeting time we can actually book: agreed, parsable, at least 20 minutes ahead and within 45 days. */
function bookableTime(d: DemoRead): Date | null {
  if (!d.meetingConfirmed || !d.meetingIso) return null;
  const t = new Date(d.meetingIso);
  const ms = t.getTime() - Date.now();
  return isNaN(ms) || ms < 20 * 60_000 || ms > 45 * 86400_000 ? null : t;
}

function eventDescription(lead: any, a: CallAnswers, solution: string[], summary: string | null) {
  return [
    `RANA AI demo for ${[lead.name, lead.company].filter(Boolean).join(", ") || lead.phone}.`,
    "",
    "Agenda (30 min)",
    "1. Your calls and goals (5 min)",
    "2. Live demo of an AI employee for your business (15 min)",
    "3. Rollout plan, timeline and the right plan for your call volume (10 min)",
    "",
    "Please invite everyone who'll be part of the decision: owner / MD, head of sales or operations, and whoever manages your calling team.",
    ...(solution.length ? ["", "How RANA AI can help:", ...solution.map((s) => `• ${s}`)] : []),
    ...(summary ? ["", `From our call: ${summary}`] : []),
    ...(a.decision_maker ? [`Decision maker: ${a.decision_maker}`] : []),
    "",
    `Contact: ${lead.phone}${lead.email ? ` · ${lead.email}` : ""}`,
    "RANA AI · ranaai.in · +91 78997 93001",
  ].join("\n");
}

export async function demoFollowup(lead: any, o: { picked: boolean; detail: string; demo: DemoRead }): Promise<FollowupResult | null> {
  try {
    if (!lead?.id) return null;
    // Claim it first so a retried webhook can't send a second email.
    const claimed = (await sb<any[]>(`/instant_calls?id=eq.${lead.id}&followup_at=is.null`, { method: "PATCH", body: JSON.stringify({ followup_at: new Date().toISOString() }) }).catch(() => [])) || [];
    if (!claimed.length) return null;

    const answers: CallAnswers = lead.answers || {};
    const skip = async (why: string): Promise<FollowupResult> => { await patch(lead.id, { followup_status: `skipped: ${why}` }); return { status: `skipped (${why})`, meetingAt: null, meetingLink: null, invite: null, to: [] }; };
    if (o.demo.outcome === "do_not_call") return skip("they asked not to be contacted");
    if (!o.picked && lead.source !== "demo") return skip("didn't pick up (only demo requests get a missed-call email)");

    const spoken = EMAIL_RE.test(String(answers.email || "")) ? String(answers.email).toLowerCase() : null;
    const primary = (lead.email && EMAIL_RE.test(lead.email) ? String(lead.email).toLowerCase() : null) || spoken || o.demo.attendeeEmails[0] || null;
    if (!primary) return skip("no email address for this lead");
    const others = Array.from(new Set([spoken, ...o.demo.attendeeEmails].filter((e): e is string => !!e && e !== primary)));
    const to = [primary, ...others];
    const founders = hqEmails().length ? hqEmails() : ["hello@ranaai.in"];
    const replyTo = founders[0];
    const brochureUrl = `${APP_URL()}${BROCHURE_PATH}`;
    const brochure: EmailAttachment = { filename: "RANA-AI-brochure.pdf", path: brochureUrl };

    // ---------------- demo agreed → book it
    const at = o.picked ? bookableTime(o.demo) : null;
    if (at) {
      const when = istLabel(at);
      const title = `RANA AI demo · ${clip(lead.company || lead.name || "your business", 60)}`;
      const description = eventDescription(lead, answers, o.demo.solution, lead.summary || null);
      let invite: "google" | "ics" = "ics", meetLink: string | null = null, eventId: string | null = null, calNote = "";
      const cal = await calendarStatus();
      if (cal.connected) {
        try {
          const ev = await createMeetEvent({ start: at, summary: title, description, attendees: [...to, ...founders.filter((f) => f !== cal.email)], requestId: `rana-${lead.id}` });
          invite = "google"; meetLink = ev.meetLink; eventId = ev.id;
        } catch (e: any) {
          calNote = clip(e?.message || e, 160);
          console.error("[demo followup] calendar", calNote);
        }
      }
      const mail = demoBookedEmail({ name: lead.name, company: lead.company, when, meetLink, calendarInvite: invite === "google", answers, solution: o.demo.solution });
      const attachments: EmailAttachment[] = invite === "ics"
        ? [{ filename: "RANA-AI-demo.ics", contentType: "text/calendar; method=REQUEST", content: Buffer.from(icsInvite({ uid: `demo-${lead.id}`, start: at, minutes: DEMO_MINUTES, summary: title, description, location: meetLink, organizer: replyTo, attendees: [...to, ...founders] })).toString("base64") }]
        : [];
      const sent = await sendEmail({ to, cc: founders, replyTo, subject: mail.subject, html: mail.html, kind: "demo_booked", attachments: [...attachments, brochure] });
      await patch(lead.id, {
        meeting_at: at.toISOString(), meeting_link: meetLink, meeting_event_id: eventId, attendees: to,
        meeting_status: invite === "google" ? "booked_google" : `booked_ics${calNote ? ` (calendar failed: ${calNote})` : cal.connected ? "" : " (Google Calendar not connected)"}`,
        followup_status: sent.ok ? "booked" : `failed: ${clip(sent.error, 150)}`,
      });
      return { status: sent.ok ? "booked" : `booking email failed (${clip(sent.error, 120)})`, meetingAt: at.toISOString(), meetingLink: meetLink, invite, to };
    }

    // ---------------- no meeting fixed / missed call → summary + brochure
    const slots = (await nextDemoSlots(4).catch(() => [])).map((s) => s.label);
    const mail = o.picked
      ? demoSummaryEmail({ name: lead.name, company: lead.company, summary: lead.summary || null, answers, solution: o.demo.solution, notInterested: o.demo.outcome === "not_interested", brochureUrl, slots })
      : missedCallEmail({ name: lead.name, brochureUrl, slots });
    const status = o.picked ? "summary" : "missed";
    const sent = await sendEmail({ to, cc: founders, replyTo, subject: mail.subject, html: mail.html, kind: o.picked ? "demo_summary" : "demo_missed", attachments: [brochure] });
    await patch(lead.id, { followup_status: sent.ok ? status : `failed: ${clip(sent.error, 150)}`, attendees: to });
    return { status: sent.ok ? status : `email failed (${clip(sent.error, 120)})`, meetingAt: null, meetingLink: null, invite: null, to };
  } catch (e: any) {
    console.error("[demo followup]", e?.message || e);
    return null;
  }
}
