export const runtime = "nodejs";
export const maxDuration = 60;
import { getSession } from "@/lib/session";
import { requireHq } from "@/lib/hq";
import { sb } from "@/lib/db";
import { reportInstantCall } from "@/lib/instantReport";

const COLS = "id,created_at,source,ref_id,name,company,phone,email,language,call_status,call_note,called_at,wa_status,email_status,call_id,outcome,outcome_detail,duration_seconds,lead_status,summary,answers,reported_at,meeting_at,meeting_link,meeting_status,attendees,followup_status";

/** GET — every website lead Priya called (or tried to), newest first, with the call's transcript. */
export async function GET(req: Request) {
  const session = await getSession(req);
  const denied = requireHq(session, "view"); if (denied) return denied;
  const rows = (await sb<any[]>(`/instant_calls?order=created_at.desc&limit=500&select=${COLS}`).catch(() => [])) || [];
  const ids = Array.from(new Set(rows.map((r) => r.call_id).filter(Boolean)));
  const calls = ids.length ? (await sb<any[]>(`/calls?id=in.(${ids.join(",")})&select=id,transcript,recording_url,connectivity_status`).catch(() => [])) || [] : [];
  const byId = new Map(calls.map((c) => [c.id, c]));
  return Response.json({
    rows: rows.map((r) => {
      const c = r.call_id ? byId.get(r.call_id) : null;
      const transcript = (Array.isArray(c?.transcript) ? c.transcript : []).map((t: any) => ({ role: t?.role === "user" ? "user" : "agent", text: String(t?.text || "") })).filter((t: any) => t.text);
      return { ...r, transcript, recording_url: c?.recording_url || null };
    }),
  });
}

/** POST { id } — rebuild one lead's call report (no email). POST { backfill: true } — every call not reported yet. */
export async function POST(req: Request) {
  const session = await getSession(req);
  const denied = requireHq(session, "clients"); if (denied) return denied;
  const b = await req.json().catch(() => ({} as any));
  const one = /^[0-9a-f-]{36}$/i.test(String(b.id || "")) ? String(b.id) : null;
  if (!one && !b.backfill) return Response.json({ error: "Send an id or backfill: true" }, { status: 400 });
  const rows = (await sb<any[]>(one ? `/instant_calls?id=eq.${one}&select=id,call_id` : `/instant_calls?reported_at=is.null&call_id=not.is.null&select=id,call_id&limit=40`).catch(() => [])) || [];
  let done = 0;
  for (const r of rows) {
    if (!r.call_id) continue;
    const [call] = (await sb<any[]>(`/calls?id=eq.${r.call_id}&select=*&limit=1`).catch(() => [])) || [];
    if (call && (await reportInstantCall(r.id, call, { email: false, force: true }))) done++;
  }
  return Response.json({ ok: true, reported: done });
}
