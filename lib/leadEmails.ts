// The two emails around every website lead:
//   welcomeEmail()    → the person who booked a demo / signed up / asked for a proof run (sent seconds after the form)
//   callReportEmail() → RANA HQ, after Priya's instant call: picked up or not, and what they said
// Table-based, inline-styled HTML so it renders the same in Gmail, Outlook and phone mail apps.
import { APP_URL, esc } from "./notify";
import type { CallLanguage } from "./callLanguages";

export type LeadSource = "demo" | "signup" | "proof_run" | "talk";

const C = { ink: "#0e1424", soft: "#5b6476", line: "#e6e9ef", paper: "#f4f6fa", card: "#ffffff", night: "#070b14", teal: "#2de1c2", tealDark: "#0f8f7a", violet: "#8b7cf6", hot: "#e8590c" };
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const SALES_PHONE = "+91 78997 93001";
const SALES_TEL = "+917899793001";

const pretty = (n: string | null | undefined) => String(n || "").replace(/^\+91(\d{5})(\d{5})$/, "+91 $1 $2");

function shell(o: { preheader: string; hero: string; body: string; footNote?: string }) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>RANA AI</title></head>
<body style="margin:0;padding:0;background:${C.paper};font-family:${FONT};color:${C.ink};-webkit-font-smoothing:antialiased">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(o.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.paper}"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px">
${o.hero}
<tr><td style="background:${C.card};border:1px solid ${C.line};border-top:0;border-radius:0 0 18px 18px;padding:30px 30px 26px">${o.body}</td></tr>
<tr><td style="padding:20px 8px 0;font-size:12px;line-height:1.6;color:${C.soft};text-align:center">
<b style="color:${C.ink}">RANA AI</b> · AI employees that answer and make your business calls<br>
Hyderabad, India · <a href="tel:${SALES_TEL}" style="color:${C.soft}">${SALES_PHONE}</a> · <a href="mailto:hello@ranaai.in" style="color:${C.soft}">hello@ranaai.in</a> · <a href="${APP_URL()}" style="color:${C.soft}">ranaai.in</a>
${o.footNote ? `<br><span style="color:#8a92a3">${o.footNote}</span>` : ""}
</td></tr></table></td></tr></table></body></html>`;
}

/** Dark band with the wordmark, a thin teal → violet line and the headline. */
function hero(eyebrow: string, title: string, sub: string) {
  return `<tr><td style="background:${C.night};border-radius:18px 18px 0 0;padding:26px 30px 30px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td style="font-size:16px;font-weight:700;color:#ffffff;letter-spacing:.2px">RANA<span style="color:${C.teal}"> AI</span></td>
<td align="right" style="font-size:11px;font-family:ui-monospace,Menlo,monospace;color:${C.teal};letter-spacing:1.5px">${esc(eyebrow)}</td>
</tr></table>
<div style="height:2px;margin:20px 0 22px;background:${C.teal};background-image:linear-gradient(90deg,${C.teal},${C.violet});border-radius:2px;line-height:2px;font-size:0">&nbsp;</div>
<div style="font-size:26px;line-height:1.25;font-weight:700;color:#ffffff">${title}</div>
<div style="font-size:15px;line-height:1.6;color:#aab3c5;margin-top:10px">${sub}</div>
</td></tr>`;
}

const h2 = (t: string) => `<div style="font-size:12px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:${C.tealDark};margin:26px 0 12px">${esc(t)}</div>`;
const button = (label: string, url: string) => `<a href="${esc(url)}" style="display:inline-block;background:${C.ink};color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:13px 22px;border-radius:999px">${esc(label)} &rarr;</a>`;

function steps(items: [string, string][]) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${items.map(([t, d], i) => `<tr>
<td width="40" valign="top" style="padding:0 0 14px"><div style="width:30px;height:30px;line-height:30px;text-align:center;border-radius:9px;background:#e9fbf7;border:1px solid #bdeee4;color:${C.tealDark};font-size:12px;font-weight:700;font-family:ui-monospace,Menlo,monospace">0${i + 1}</div></td>
<td valign="top" style="padding:3px 0 14px"><div style="font-size:15px;font-weight:600">${t}</div><div style="font-size:13.5px;line-height:1.55;color:${C.soft};margin-top:2px">${d}</div></td></tr>`).join("")}</table>`;
}

const SERVICES: [string, string][] = [
  ["24×7 AI receptionist", "Answers every call in under a second, day and night."],
  ["Calls your leads", "Follows up enquiries, reminders and renewals on its own."],
  ["Your customers' language", "11 Indian languages and English, switching mid-call."],
  ["Hot leads, instantly", "Sent to your team on WhatsApp, email or your CRM."],
  ["Every call understood", "Recorded, transcribed, summarised and scored."],
  ["Live in days", "We set it up on your script, prices and numbers."],
];

function servicesGrid() {
  const cell = ([t, d]: [string, string]) => `<td width="50%" valign="top" style="padding:6px"><div style="border:1px solid ${C.line};border-radius:12px;padding:13px 14px;background:#fbfcfe"><div style="font-size:14px;font-weight:600">${t}</div><div style="font-size:12.5px;line-height:1.5;color:${C.soft};margin-top:3px">${d}</div></div></td>`;
  const rows: string[] = [];
  for (let i = 0; i < SERVICES.length; i += 2) rows.push(`<tr>${cell(SERVICES[i])}${cell(SERVICES[i + 1])}</tr>`);
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 -6px">${rows.join("")}</table>`;
}

const NEXT: Record<LeadSource, (o: { called: boolean; from: string; lang: string; phone: string }) => [string, string][]> = {
  demo: (o) => [
    [o.called ? "Priya calls you, right now" : "We call you", o.called ? `Our AI assistant is ringing you from <b>${o.from}</b> in ${o.lang}. Two minutes to understand your business and calls.` : `Our team calls you on <b>${o.phone}</b> within one working day.`],
    ["You get the invite", "A Google Meet invite and an email with the agenda arrive right after the call. Missed the call? We email you open slots."],
    ["Your 30-minute demo on Google Meet", "Priya books a time with you on the call. Sri Charan shows an AI employee handling calls for a business like yours, in your customers' language. Bring whoever decides on this."],
  ],
  proof_run: (o) => [
    [o.called ? "Priya calls you, right now" : "We call you", o.called ? `Our AI assistant is ringing you from <b>${o.from}</b> in ${o.lang} to understand your enquiries.` : `Our team calls you on <b>${o.phone}</b> within one working day.`],
    ["We confirm your script", "A RANA specialist checks your list and the questions RANA should ask."],
    ["RANA calls your enquiries", "During permitted hours, then we send you a report of who is still interested."],
  ],
  signup: (o) => [
    [o.called ? "Priya calls you, right now" : "We call you", o.called ? `Our AI assistant is ringing you from <b>${o.from}</b> in ${o.lang} to learn what you need.` : `Our team calls you on <b>${o.phone}</b> within one working day.`],
    ["We switch on your free trial", "A RANA specialist activates your 14-day trial, usually within a working day."],
    ["Your first AI employee goes live", "Build it yourself, or let us set it up with you in a guided session."],
  ],
  talk: (o) => [
    [o.called ? "Priya calls you, right now" : "We call you", o.called ? `Our AI assistant is ringing you from <b>${o.from}</b> in ${o.lang}.` : `Our team calls you on <b>${o.phone}</b> within one working day.`],
    ["Our team reaches out", "Within one working day, with everything you told Rana."],
    ["Your 30-minute demo on Google Meet", "Built around your business and your calls."],
  ],
};

const SUBJECT: Record<LeadSource, string> = {
  demo: "Your RANA AI demo is confirmed — here's what happens next",
  proof_run: "Your free RANA AI proof run — here's what happens next",
  signup: "Welcome to RANA AI — here's what happens next",
  talk: "Thanks for talking to Rana — here's what happens next",
};

/** Sent to the lead seconds after the form, alongside Priya's call. */
export function welcomeEmail(o: { source: LeadSource; name: string | null; phone: string; called: boolean; from: string | null; lang: CallLanguage; leadCount?: number }) {
  const first = String(o.name || "").trim().split(/\s+/).find((w) => w.replace(/\W/g, "").length > 1) || "";
  const from = pretty(o.from) || "+91 80642 61733";
  const callout = o.called
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="background:#e9fbf7;border:1px solid #bdeee4;border-radius:14px;padding:15px 16px">
<div style="font-size:14.5px;line-height:1.55"><b style="color:${C.tealDark}">&#9679; Your phone is ringing.</b> Priya, our AI assistant, is calling you from <b>${esc(from)}</b> in <b>${esc(o.lang.label)}</b>. Missed it? Reply to this email or WhatsApp us — we'll call you back.</div></td></tr></table>`
    : `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="background:${C.paper};border:1px solid ${C.line};border-radius:14px;padding:15px 16px">
<div style="font-size:14.5px;line-height:1.55">Our team will call you on <b>${esc(pretty(o.phone))}</b> within one working day.</div></td></tr></table>`;
  const intro = o.source === "signup"
    ? "Thank you for choosing RANA AI. Your workspace is created, and your 14-day free trial is being switched on."
    : o.source === "proof_run"
      ? `Thank you for choosing RANA AI. Your free proof run${o.leadCount ? ` on ${o.leadCount} enquiries` : ""} is booked.`
      : "Thank you for choosing RANA AI. Your request is confirmed, and our team is already on it.";
  const body = `
<div style="font-size:15px;line-height:1.65">${esc(intro)}</div>
<div style="height:16px"></div>${callout}
${h2("What happens next")}${steps(NEXT[o.source]({ called: o.called, from: esc(from), lang: esc(o.lang.label), phone: esc(pretty(o.phone)) }))}
${h2("What RANA AI does for you")}${servicesGrid()}
<div style="height:22px"></div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="left">${o.source === "signup" ? button("Sign in to RANA", `${APP_URL()}/login`) : button("See how it works", `${APP_URL()}/#how`)}</td></tr></table>
<div style="font-size:13.5px;line-height:1.6;color:${C.soft};margin-top:22px;border-top:1px solid ${C.line};padding-top:16px">Questions? Call or WhatsApp us on <a href="tel:${SALES_TEL}" style="color:${C.ink};font-weight:600;text-decoration:none">${SALES_PHONE}</a>, or simply reply to this email.<br><br>Warm regards,<br><b style="color:${C.ink}">Sri Charan</b><br>Founder, RANA AI</div>`;
  return {
    subject: SUBJECT[o.source],
    html: shell({
      preheader: o.called ? `Priya is calling you now from ${from}. Here's what happens next.` : "Here's what happens next.",
      hero: hero(o.source === "signup" ? "WELCOME" : "CONFIRMED", `Thank you, ${esc(first || "and welcome")}.`, "Your AI employee is one conversation away. Here's exactly what happens next."),
      body,
      footNote: "You're receiving this because you asked RANA AI to contact you on ranaai.in.",
    }),
  };
}

// ---------------------------------------------------------------- HQ call report

export type CallAnswers = {
  reason_looking?: string | null; business?: string | null; city?: string | null; call_volume?: string | null;
  languages?: string | null; demo_time?: string | null; email?: string | null; next_step?: string | null;
  role?: string | null; decision_maker?: string | null; stakeholders?: string | null; pain_points?: string | null; current_setup?: string | null;
};

/** What happened after the call (shown in the HQ report). */
export type FollowupResult = { status: string; meetingAt: string | null; meetingLink: string | null; invite: "google" | "ics" | null; to: string[] };

const SOURCE_LABEL: Record<LeadSource, string> = { demo: "Book a demo", signup: "Free trial sign-up", proof_run: "Free proof run", talk: "Talk to Rana" };
export const sourceLabel = (s: string) => SOURCE_LABEL[s as LeadSource] || (s === "followup" ? "Follow-up call" : s);

const fmtDuration = (s: number | null | undefined) => {
  const n = Math.round(Number(s) || 0);
  return n >= 60 ? `${Math.floor(n / 60)}m ${String(n % 60).padStart(2, "0")}s` : `${n}s`;
};

function row(label: string, value: string | null | undefined) {
  if (!value) return "";
  return `<tr><td width="150" valign="top" style="padding:9px 0;border-bottom:1px solid ${C.line};font-size:13px;color:${C.soft}">${esc(label)}</td><td valign="top" style="padding:9px 0;border-bottom:1px solid ${C.line};font-size:14px;font-weight:500">${esc(value)}</td></tr>`;
}

/** Sent to RANA HQ when Priya's instant call ends: picked up or not, and the answers, in one clean card. */
export function callReportEmail(o: {
  lead: { name: string | null; company: string | null; phone: string; email: string | null; source: string; language: string | null; created_at: string };
  picked: boolean; detail: string; duration: number | null; leadStatus: string | null; summary: string | null; answers: CallAnswers | null;
  transcript: { role: string; text: string }[];
  followup?: FollowupResult | null;
}) {
  const who = [o.lead.name, o.lead.company].filter(Boolean).join(" · ") || pretty(o.lead.phone);
  const tone = o.leadStatus === "hot" ? C.hot : o.leadStatus === "warm" ? "#c98a00" : C.soft;
  const badge = (text: string, color: string, bg: string) => `<span style="display:inline-block;font-size:12px;font-weight:700;letter-spacing:.4px;color:${color};background:${bg};border-radius:999px;padding:5px 11px;margin:0 6px 6px 0">${esc(text)}</span>`;
  const badges = [
    o.picked ? badge(`PICKED UP · ${fmtDuration(o.duration)}`, C.tealDark, "#e9fbf7") : badge(`DID NOT PICK UP · ${o.detail.toUpperCase()}`, C.hot, "#fff1e8"),
    o.picked && o.leadStatus ? badge(`${o.leadStatus.toUpperCase()} LEAD`, tone, "#f6f7fa") : "",
    badge(sourceLabel(o.lead.source).toUpperCase(), C.soft, "#f6f7fa"),
  ].join("");
  const a = o.answers || {};
  const answers = o.picked
    ? `${h2("What they told Priya")}<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${[
      row("Why they're looking", a.reason_looking), row("Business", [a.business, a.city].filter(Boolean).join(", ") || null),
      row("Their role", a.role), row("Decision maker", a.decision_maker), row("Others to involve", a.stakeholders),
      row("Pain points", a.pain_points), row("How calls work today", a.current_setup), row("Call volume", a.call_volume),
      row("Languages", a.languages), row("Demo / callback", a.demo_time), row("Email", a.email), row("Next step", a.next_step),
    ].join("") || row("Answers", "They didn't share details on this call.")}</table>`
    : `<div style="font-size:14.5px;line-height:1.6;margin-top:18px;background:#fff7f1;border:1px solid #ffd9c2;border-radius:12px;padding:13px 15px"><b>Next step:</b> call them back yourself on <a href="tel:${esc(o.lead.phone)}" style="color:${C.ink};font-weight:700">${esc(pretty(o.lead.phone))}</a>. ${o.lead.source === "followup" ? "This was a follow-up call to an older enquiry; try once more later." : `They asked to be contacted ${esc(timeAgo(o.lead.created_at))}.`}</div>`;
  const transcript = o.picked && o.transcript.length
    ? `${h2("Conversation")}<div style="border:1px solid ${C.line};border-radius:12px;padding:6px 14px;background:#fbfcfe">${o.transcript.slice(0, 40).map((t) => `<div style="padding:7px 0;font-size:13.5px;line-height:1.5"><b style="color:${t.role === "user" ? C.ink : C.tealDark}">${t.role === "user" ? esc(o.lead.name?.split(" ")[0] || "Lead") : "Priya"}:</b> ${esc(t.text)}</div>`).join("")}</div>`
    : "";
  const body = `
<div style="font-size:20px;font-weight:700">${esc(who)}</div>
<div style="font-size:14px;color:${C.soft};margin-top:4px"><a href="tel:${esc(o.lead.phone)}" style="color:${C.ink};font-weight:600;text-decoration:none">${esc(pretty(o.lead.phone))}</a>${o.lead.email ? ` · <a href="mailto:${esc(o.lead.email)}" style="color:${C.soft}">${esc(o.lead.email)}</a>` : ""}${o.lead.language ? ` · prefers ${esc(o.lead.language)}` : ""}</div>
<div style="margin-top:14px">${badges}</div>
${o.summary ? `<div style="font-size:14.5px;line-height:1.6;margin-top:10px;border-left:3px solid ${C.teal};padding-left:12px">${esc(o.summary)}</div>` : ""}
${followupBlock(o.followup)}
${answers}${transcript}
<div style="height:22px"></div>${button("Open Website leads in HQ", `${APP_URL()}/hq/leads`)}`;
  return {
    subject: `${o.picked ? "📞 Picked up" : "⚠️ Did not pick up"} · ${who}${o.picked && o.leadStatus ? ` · ${o.leadStatus}` : ""} — call report`,
    html: shell({ preheader: o.summary || (o.picked ? "Call report" : `Did not pick up (${o.detail})`), hero: hero("CALL REPORT", o.picked ? "Priya spoke with your lead." : "Your lead didn't pick up.", `${esc(sourceLabel(o.lead.source))} · ${esc(timeAgo(o.lead.created_at))}`), body }),
  };
}

function followupBlock(f: FollowupResult | null | undefined) {
  if (!f) return "";
  const when = f.meetingAt ? new Date(f.meetingAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit", hour12: true }) : null;
  const text = f.status === "booked"
    ? `<b>Demo booked: ${esc(when || "")} IST.</b> ${f.invite === "google" ? `Google Calendar invite with Google Meet sent to ${esc(f.to.join(", "))}.` : `Invite (.ics) emailed to ${esc(f.to.join(", "))}. Google Calendar isn't connected, so there is no Meet link yet: connect it on HQ → Website leads, or send them a link.`}${f.meetingLink ? ` <a href="${esc(f.meetingLink)}" style="color:${C.tealDark}">Meet link</a>` : ""}`
    : f.status === "summary" ? `No meeting fixed on the call. Call summary, how RANA helps and the brochure were emailed to ${esc(f.to.join(", "))}.`
    : f.status === "missed" ? `They didn't pick up. A "sorry we missed you" email with the brochure went to ${esc(f.to.join(", "))}.`
    : `Follow-up email to the lead: ${esc(f.status)}.`;
  const good = f.status === "booked";
  return `<div style="font-size:14px;line-height:1.6;margin-top:14px;background:${good ? "#e9fbf7" : C.paper};border:1px solid ${good ? "#bdeee4" : C.line};border-radius:12px;padding:12px 14px">${text}</div>`;
}

// ---------------------------------------------------------------- emails to the lead after Priya's call
// Sent to the lead (cc RANA's founders). Booked → date, Meet link, agenda, who should join. Not booked → summary,
// how RANA helps them, brochure. Missed → brochure and an easy way to pick a time.

const WA_LINK = "https://wa.me/917899793001?text=" + encodeURIComponent("Hi RANA AI, I'd like to book a demo.");
export const BROCHURE_PATH = "/brand/rana-ai-brochure.pdf";

function bullets(items: string[]) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${items.map((t) => `<tr><td width="22" valign="top" style="padding:0 0 10px;color:${C.tealDark};font-size:15px;line-height:1.5">&#10003;</td><td valign="top" style="padding:0 0 10px;font-size:14.5px;line-height:1.55">${esc(t)}</td></tr>`).join("")}</table>`;
}
function facts(a: CallAnswers) {
  const rows = [
    row("Your business", [a.business, a.city].filter(Boolean).join(", ") || null),
    row("What you're looking for", a.reason_looking),
    row("Challenges", a.pain_points),
    row("Calls today", [a.current_setup, a.call_volume].filter(Boolean).join(" · ") || null),
    row("Customer languages", a.languages),
  ].join("");
  return rows ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>` : "";
}
const signoff = `<div style="font-size:13.5px;line-height:1.6;color:${C.soft};margin-top:22px;border-top:1px solid ${C.line};padding-top:16px">Questions? Call or WhatsApp us on <a href="tel:${SALES_TEL}" style="color:${C.ink};font-weight:600;text-decoration:none">${SALES_PHONE}</a>, or simply reply to this email.<br><br>Warm regards,<br><b style="color:${C.ink}">Sri Charan</b><br>Founder, RANA AI</div>`;
const firstOf = (n: string | null | undefined) => String(n || "").trim().split(/\s+/).find((w) => w.replace(/\W/g, "").length > 1) || "";
const DEFAULT_SOLUTION = [
  "Answer every call in under a second, 24x7, including after hours and when your team is busy.",
  "Call back and follow up every enquiry automatically, so no lead goes cold.",
  "Speak to your customers in their own language: 11 Indian languages plus English.",
  "Send the hot leads to your team on WhatsApp, email or your CRM, with a summary of every call.",
];

export function demoBookedEmail(o: { name: string | null; company: string | null; when: string; meetLink: string | null; calendarInvite: boolean; answers: CallAnswers; solution: string[] }) {
  const first = firstOf(o.name);
  const join = o.meetLink
    ? `<div style="margin-top:14px">${button("Join Google Meet", o.meetLink)}</div><div style="font-size:12.5px;color:${C.soft};margin-top:8px">${esc(o.meetLink)}</div>`
    : `<div style="font-size:13.5px;color:${C.soft};margin-top:10px">Sri Charan will share the meeting link before the demo.</div>`;
  const card = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="background:#e9fbf7;border:1px solid #bdeee4;border-radius:14px;padding:18px">
<div style="font-size:12px;font-weight:700;letter-spacing:1.2px;color:${C.tealDark}">YOUR DEMO</div>
<div style="font-size:19px;font-weight:700;margin-top:6px">${esc(o.when)} IST</div>
<div style="font-size:14px;color:${C.soft};margin-top:4px">30 minutes · Google Meet · with Sri Charan, Founder, RANA AI</div>
${join}
<div style="font-size:12.5px;color:${C.soft};margin-top:12px">${o.calendarInvite ? "A Google Calendar invite is on its way to you: please accept it so it's in your calendar." : "The calendar invite is attached: open it to add the demo to your calendar."}</div>
</td></tr></table>`;
  const industry = o.answers.business ? ` like ${esc(o.answers.business)}` : " like yours";
  const body = `
<div style="font-size:15px;line-height:1.65">Hi ${esc(first || "there")},<br><br>Thank you for speaking with Priya. Your RANA AI demo${o.company ? ` for <b>${esc(o.company)}</b>` : ""} is booked.</div>
<div style="height:16px"></div>${card}
${facts(o.answers) ? h2("What we understood") + facts(o.answers) : ""}
${h2("How RANA AI can help you")}${bullets(o.solution.length ? o.solution : DEFAULT_SOLUTION)}
${h2("Agenda")}${steps([
    ["Your calls and goals (5 min)", "How enquiries reach you today, where calls are missed, and what a great first month looks like."],
    ["Live demo (15 min)", `An AI employee handling real calls for a business${industry}, in your customers' language.`],
    ["Your rollout plan (10 min)", "Script, numbers, integrations, timeline to go live, and the right plan for your call volume."],
  ])}
${h2("Who should join")}<div style="font-size:14.5px;line-height:1.6">Please invite everyone who will be part of this decision, so every question is answered in one meeting: the owner or MD, the head of sales or operations, and whoever manages your calling team.${o.answers.stakeholders ? ` From our call: <b>${esc(o.answers.stakeholders)}</b>.` : ""} Just forward this email, or reply with their email addresses and we'll add them to the invite.</div>
<div style="font-size:14px;line-height:1.6;margin-top:14px;color:${C.soft}">Need a different time? Reply to this email and we'll move it.</div>
${signoff}`;
  const day = o.when.split(",")[0];
  return {
    subject: `Your RANA AI demo is booked: ${o.when} IST`,
    html: shell({ preheader: `${o.when} IST · 30 minutes on Google Meet with Sri Charan.`, hero: hero("DEMO BOOKED", first ? `See you on ${esc(day)}, ${esc(first)}.` : `See you on ${esc(day)}.`, `${esc(o.when)} IST · 30 minutes · Google Meet`), body, footNote: "You're receiving this because you asked RANA AI to contact you on ranaai.in." }),
  };
}

export function demoSummaryEmail(o: { name: string | null; company: string | null; summary: string | null; answers: CallAnswers; solution: string[]; notInterested: boolean; brochureUrl: string; slots: string[] }) {
  const first = firstOf(o.name);
  const intro = o.notInterested
    ? "Thank you for taking Priya's call. We understand the timing may not be right. Here is a short note on what we discussed and how RANA AI works, for whenever it's useful."
    : `Thank you for speaking with Priya. Here is a short summary of our call, and how RANA AI can help${o.company ? ` <b>${esc(o.company)}</b>` : " your business"}.`;
  const slots = o.slots.length ? `<br><br>Open slots: <b>${o.slots.slice(0, 4).map(esc).join("</b>, <b>")}</b> (IST).` : "";
  const book = o.notInterested ? "" : `${h2("See it live: 30-minute demo")}<div style="font-size:14.5px;line-height:1.6">A 30-minute Google Meet with Sri Charan, our founder: a live AI employee for a business like yours, and a rollout plan for your call volume. Please bring whoever decides on this with you.${slots}<br><br>Reply to this email with a time that suits you, or WhatsApp us.</div><div style="margin-top:14px">${button("WhatsApp us to book a time", WA_LINK)}</div>`;
  const body = `
<div style="font-size:15px;line-height:1.65">Hi ${esc(first || "there")},<br><br>${intro}</div>
${o.summary ? `${h2("Our call")}<div style="font-size:14.5px;line-height:1.6;border-left:3px solid ${C.teal};padding-left:12px">${esc(o.summary)}</div>` : ""}
${facts(o.answers) ? h2("What we understood") + facts(o.answers) : ""}
${h2(o.solution.length ? "How RANA AI can help you" : "What RANA AI does")}${bullets(o.solution.length ? o.solution : DEFAULT_SOLUTION)}
${h2("About RANA AI")}${servicesGrid()}
<div style="margin-top:18px">${button("Download the RANA AI brochure", o.brochureUrl)}</div><div style="font-size:12.5px;color:${C.soft};margin-top:8px">The brochure is also attached to this email.</div>
${book}
${signoff}`;
  return {
    subject: o.notInterested ? "Thank you for your time — RANA AI" : `Summary of our call${o.company ? ` with ${o.company}` : ""} — RANA AI`,
    html: shell({ preheader: "A summary of our call, how RANA AI can help, and our brochure.", hero: hero("CALL SUMMARY", first ? `Thank you, ${esc(first)}.` : "Thank you for your time.", "A short summary of our call, how RANA AI can help, and our brochure."), body, footNote: "You're receiving this because you asked RANA AI to contact you on ranaai.in." }),
  };
}

export function missedCallEmail(o: { name: string | null; brochureUrl: string; slots: string[] }) {
  const first = firstOf(o.name);
  const slots = o.slots.length ? `<br><br>Open slots: <b>${o.slots.slice(0, 4).map(esc).join("</b>, <b>")}</b> (IST).` : "";
  const body = `
<div style="font-size:15px;line-height:1.65">Hi ${esc(first || "there")},<br><br>Priya from RANA AI tried calling you about your demo request, but we couldn't reach you. No problem: pick a time that suits you, and Sri Charan, our founder, will walk you through it on a 30-minute Google Meet.${slots}</div>
<div style="margin-top:16px">${button("WhatsApp us to book a time", WA_LINK)}</div>
<div style="font-size:14px;line-height:1.6;margin-top:12px;color:${C.soft}">Or simply reply to this email with a time.</div>
${h2("What RANA AI does for you")}${servicesGrid()}
<div style="margin-top:18px">${button("Download the RANA AI brochure", o.brochureUrl)}</div><div style="font-size:12.5px;color:${C.soft};margin-top:8px">The brochure is also attached to this email.</div>
${signoff}`;
  return {
    subject: "We tried calling you — let's find a time for your RANA AI demo",
    html: shell({ preheader: "Pick a time for your 30-minute demo. Brochure attached.", hero: hero("WE MISSED YOU", first ? `Sorry we missed you, ${esc(first)}.` : "Sorry we missed you.", "Let's find a time for your 30-minute demo."), body, footNote: "You're receiving this because you asked RANA AI to contact you on ranaai.in." }),
  };
}

function timeAgo(iso: string) {
  const m = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000));
  return m < 1 ? "just now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
