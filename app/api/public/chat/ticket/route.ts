export const runtime = "nodejs";
export const maxDuration = 30;
import { sb } from "@/lib/db";
import { ticketAlerts } from "@/lib/chatAlerts";
import { runAfterResponse } from "@/lib/background";

const hits = new Map<string, number[]>();
const CATEGORIES = ["sales", "support", "billing", "technical", "other"];
const clip = (v: unknown, n: number) => String(v ?? "").replace(/[ \t]+/g, " ").trim().slice(0, n);

/** Public: POST { chatId?, name, email?, phone?, company?, category, subject?, details } → { ok, number }. */
export async function POST(req: Request) {
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "?";
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < 3600e3);
  if (list.length >= 6) return Response.json({ error: "Too many tickets from this network. Call +91 78997 93001." }, { status: 429 });
  const b = await req.json().catch(() => ({} as any));
  if (b.website) return Response.json({ ok: true }); // honeypot
  const name = clip(b.name, 80), email = clip(b.email, 120).toLowerCase(), phone = clip(b.phone, 20).replace(/[^\d+]/g, "");
  const details = clip(b.details, 3000);
  if (name.length < 2) return Response.json({ error: "Please tell us your name." }, { status: 400 });
  if (!email && phone.replace(/\D/g, "").length < 10) return Response.json({ error: "Add an email or a phone number so we can reply." }, { status: 400 });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return Response.json({ error: "That email doesn't look right." }, { status: 400 });
  if (details.length < 5) return Response.json({ error: "Tell us a little about what you need." }, { status: 400 });
  list.push(now); hits.set(ip, list);

  const chatId = /^[0-9a-f-]{36}$/i.test(String(b.chatId || "")) ? String(b.chatId) : null;
  const [t] = (await sb<any[]>(`/support_tickets`, {
    method: "POST",
    body: JSON.stringify({
      chat_id: chatId, name, email: email || null, phone: phone || null, company: clip(b.company, 120) || null,
      category: CATEGORIES.includes(b.category) ? b.category : "support", subject: clip(b.subject, 160) || details.slice(0, 80), details, source: "website-chat",
    }),
  }).catch((e) => { console.error("[ticket]", e?.message); return []; })) || [];
  if (!t) return Response.json({ error: "Couldn't save your request. Please email support@ranaai.in." }, { status: 500 });

  let session: any = null;
  if (chatId) {
    session = ((await sb<any[]>(`/chat_sessions?id=eq.${chatId}&limit=1`).catch(() => [])) || [])[0] || null;
    if (session) {
      const lead = { ...(session.lead || {}), name: session.lead?.name || name, ...(email && !session.lead?.email ? { email } : {}), ...(phone && !session.lead?.phone ? { phone } : {}) };
      await sb(`/chat_sessions?id=eq.${chatId}`, { method: "PATCH", prefer: "return=minimal", body: JSON.stringify({ ticket_id: t.id, lead, intent: "support", notified_at: session.notified_at || new Date().toISOString(), updated_at: new Date().toISOString() }) }).catch(() => {});
    }
  }
  await runAfterResponse(() => ticketAlerts(t, session));
  return Response.json({ ok: true, number: t.number });
}
