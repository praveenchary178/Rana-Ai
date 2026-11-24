export const runtime = "nodejs";
export const maxDuration = 30;
import { getSession } from "@/lib/session";
import { requireHq } from "@/lib/hq";
import { callNewLead } from "@/lib/instantCall";

/**
 * POST { phone, name?, company?, email?, refId?, context? } — RANA HQ staff only.
 * Priya calls an older website lead again (a follow-up): she opens by asking which language they're comfortable in.
 * Same pipeline as instant calls, so the result lands in HQ → Website leads with a call report.
 */
export async function POST(req: Request) {
  const session = await getSession(req);
  const denied = requireHq(session, "clients"); if (denied) return denied;
  const b = await req.json().catch(() => ({} as any));
  if (!String(b.phone || "").trim()) return Response.json({ error: "phone required" }, { status: 400 });
  const r = await callNewLead({
    source: "followup", refId: /^[0-9a-f-]{36}$/i.test(String(b.refId || "")) ? b.refId : null,
    name: b.name || null, company: b.company || null, phone: String(b.phone), email: b.email || null,
    context: String(b.context || "").slice(0, 900) || null,
  });
  return Response.json({ ok: true, called: r.called, note: r.note, id: r.id });
}
