// Emails about website chats: HQ hears about every chat lead (once, when the visitor shares a phone or email),
// every support ticket, and the visitor gets a ticket confirmation.
import { sendEmail, emailHtml, APP_URL, esc } from "./notify";
import { hqEmails } from "./hq";
import type { ChatLead, ChatTurn } from "./chatBot";

const hq = () => Array.from(new Set([...hqEmails(), "hello@ranaai.in"]));
const SCORE: Record<string, string> = { hot: "🔥 Hot", warm: "Warm", cold: "Cold", unknown: "Not scored yet" };

const leadLines = (l: ChatLead) => [
  ["Name", l.name], ["Company", l.company], ["Phone", l.phone], ["Email", l.email], ["Business", l.business], ["City", l.city],
  ["Call volume", l.call_volume], ["Languages", l.languages], ["Needs", l.need], ["Timeline", l.timeline], ["Role", l.role],
].filter(([, v]) => v).map(([k, v]) => `${k}: <b>${esc(v)}</b>`);

const transcript = (msgs: ChatTurn[]) =>
  `<details><summary>Conversation (${msgs.length} messages)</summary>${msgs.slice(-40).map((m) => `<div style="margin:6px 0"><b>${m.role === "user" ? "Visitor" : "Rana"}:</b> ${esc(m.text)}</div>`).join("")}</details>`;

export async function chatLeadAlert(s: { id: string; page?: string | null; lead: ChatLead; score?: string | null; summary?: string | null; messages: ChatTurn[] }, why: string) {
  await sendEmail({
    to: hq(), kind: "chat_lead",
    subject: `💬 Website chat lead: ${s.lead.company || s.lead.name || s.lead.phone || "visitor"} (${SCORE[s.score || "unknown"] || s.score})`,
    html: emailHtml({
      title: "New lead from the website chat",
      lines: [why, ...(s.summary ? [esc(s.summary)] : []), ...leadLines(s.lead), `Page: ${esc(s.page || "—")}`, transcript(s.messages)],
      button: { label: "Open Website chats", url: `${APP_URL()}/hq/chats` },
    }),
  }).catch(() => {});
}

export async function ticketAlerts(t: any, s: { lead?: ChatLead; messages?: ChatTurn[] } | null) {
  const no = `#${t.number}`;
  await sendEmail({
    to: hq(), kind: "support_ticket", subject: `🛟 Ticket ${no} (${t.category}): ${t.subject || t.company || t.name}`,
    html: emailHtml({
      title: `Support ticket ${no}`,
      lines: [
        `<b>${esc(t.name || "—")}</b>${t.company ? ` · ${esc(t.company)}` : ""} · ${esc(t.email || "")} ${t.phone ? `· <b>${esc(t.phone)}</b>` : ""}`,
        `Category: <b>${esc(t.category)}</b>`,
        `<b>${esc(t.subject || "")}</b>`,
        esc(t.details || ""),
        "Reply within one working day — that's what the chat promised.",
        ...(s?.messages?.length ? [transcript(s.messages)] : []),
      ],
      button: { label: "Open tickets in HQ", url: `${APP_URL()}/hq/chats?tab=tickets` },
    }),
  }).catch(() => {});
  if (t.email) {
    await sendEmail({
      to: t.email, kind: "ticket_ack", subject: `We've got your request — ticket ${no}`,
      html: emailHtml({
        title: `Thanks, ${esc(String(t.name || "").split(" ")[0] || "there")} — we're on it`,
        lines: [
          `Your request is logged as <b>ticket ${no}</b>. Our team replies within one working day.`,
          `<b>${esc(t.subject || "Your request")}</b><br>${esc(t.details || "")}`,
          "Urgent? Call or WhatsApp us on +91 78997 93001 and quote your ticket number.",
        ],
      }),
    }).catch(() => {});
  }
}
