export const runtime = "nodejs";
import { getSession } from "@/lib/session";
import { requireHq } from "@/lib/hq";
import { sb } from "@/lib/db";

/** GET — website chats (with at least one visitor message) and support tickets, newest first. */
export async function GET(req: Request) {
  const session = await getSession(req);
  const denied = requireHq(session, "view"); if (denied) return denied;
  const [chats, tickets] = await Promise.all([
    sb<any[]>(`/chat_sessions?order=updated_at.desc&limit=300&select=id,created_at,updated_at,page,source,messages,lead,intent,score,summary,demo_booked_at,ticket_id`).catch(() => []),
    sb<any[]>(`/support_tickets?order=created_at.desc&limit=300`).catch(() => []),
  ]);
  return Response.json({ chats: (chats || []).filter((c) => Array.isArray(c.messages) && c.messages.some((m: any) => m.role === "user")), tickets: tickets || [] });
}

/** PATCH { ticketId, status?, notes? } — move a ticket along (open → in progress → resolved). */
export async function PATCH(req: Request) {
  const session = await getSession(req);
  const denied = requireHq(session, "clients"); if (denied) return denied;
  const b = await req.json().catch(() => ({} as any));
  if (!/^[0-9a-f-]{36}$/i.test(String(b.ticketId || ""))) return Response.json({ error: "ticketId required" }, { status: 400 });
  const patch: Record<string, any> = { updated_at: new Date().toISOString() };
  if (["open", "in_progress", "resolved"].includes(b.status)) { patch.status = b.status; patch.resolved_at = b.status === "resolved" ? new Date().toISOString() : null; }
  if (typeof b.notes === "string") patch.hq_notes = b.notes.slice(0, 2000) || null;
  const [t] = (await sb<any[]>(`/support_tickets?id=eq.${b.ticketId}`, { method: "PATCH", body: JSON.stringify(patch) })) || [];
  return Response.json({ ok: true, ticket: t });
}
