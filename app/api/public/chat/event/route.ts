export const runtime = "nodejs";
import { sb } from "@/lib/db";

/**
 * Public: POST { chatId, event: "demo", name?, phone?, company?, email? } — the chat widget tells us the visitor booked a
 * demo from the chat (the booking itself goes through /api/demo, which calls them and emails HQ). Links the two.
 */
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({} as any));
  if (!/^[0-9a-f-]{36}$/i.test(String(b.chatId || "")) || b.event !== "demo") return Response.json({ ok: false }, { status: 400 });
  const [s] = (await sb<any[]>(`/chat_sessions?id=eq.${b.chatId}&select=id,lead,demo_booked_at&limit=1`).catch(() => [])) || [];
  if (!s) return Response.json({ ok: false }, { status: 404 });
  if (s.demo_booked_at) return Response.json({ ok: true });
  const clip = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);
  const lead = { ...(s.lead || {}) };
  for (const k of ["name", "phone", "company", "email"] as const) if (b[k] && !lead[k]) lead[k] = clip(b[k], 120);
  const now = new Date().toISOString();
  await sb(`/chat_sessions?id=eq.${s.id}`, { method: "PATCH", prefer: "return=minimal", body: JSON.stringify({ demo_booked_at: now, lead, intent: "demo", score: "hot", notified_at: now, updated_at: now }) }).catch(() => {});
  return Response.json({ ok: true });
}
