export const runtime = "nodejs";
import { getSession } from "@/lib/session";
import { requireHq } from "@/lib/hq";

/** HQ → Connect WhatsApp. Thin proxy to the wa-connect Edge Function (holds the Meta app secret and business tokens).
 *  GET  → { status, connections }   (no tokens ever leave the server)
 *  GET ?view=templates → { accounts: [{ label, waba_id, templates }] }   (read-only, live from Meta)
 *  POST → finish an Embedded Signup: { code, waba_id, phone_number_id, label, coexistence } */
async function fn(body: Record<string, unknown>) {
  const base = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_KEY;
  if (!base || !key) return { status: 500, data: { error: "Supabase isn't configured on this server." } };
  try {
    const r = await fetch(`${base.replace(/\/$/, "")}/functions/v1/wa-connect`, {
      method: "POST", cache: "no-store", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body), signal: AbortSignal.timeout(55_000),
    });
    const data = await r.json().catch(() => ({ error: `HTTP ${r.status}` }));
    return { status: r.status, data };
  } catch (e: any) {
    return { status: 502, data: { error: `Couldn't reach wa-connect (${e?.name === "TimeoutError" ? "timed out" : e?.message || "network error"}).` } };
  }
}

export async function GET(req: Request) {
  const session = await getSession(req);
  const denied = requireHq(session, "clients"); if (denied) return denied;
  if (new URL(req.url).searchParams.get("view") === "templates") {
    const t = await fn({ action: "templates" });
    return Response.json(t.data, { status: t.status });
  }
  const [status, list] = await Promise.all([fn({ action: "status" }), fn({ action: "list" })]);
  return Response.json({ status: status.data, connections: list.data?.connections || [] }, { status: list.status === 200 ? 200 : list.status });
}

export async function POST(req: Request) {
  const session = await getSession(req);
  const denied = requireHq(session, "clients"); if (denied) return denied;
  const b = await req.json().catch(() => ({}));
  const str = (v: unknown, n = 200) => String(v ?? "").slice(0, n);
  const r = await fn({
    action: "exchange", code: str(b.code, 2000), waba_id: str(b.waba_id, 30), phone_number_id: str(b.phone_number_id, 30),
    label: str(b.label, 80), coexistence: !!b.coexistence, by: str((session as any)?.email || (session as any)?.user?.email || "", 120),
  });
  return Response.json(r.data, { status: r.status });
}
