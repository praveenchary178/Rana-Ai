// Public call page: the link in a client's WhatsApp call alert opens this. It shows which number the customer
// dialled, the caller, the trip details the AI captured, the summary, the recording and the full conversation.
// The code is a random 12-character value saved on call_summary_log when the alert is sent, so the page needs no login.
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Call details — RANA AI", robots: { index: false, follow: false } };

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

async function sb(path: string): Promise<any[]> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    cache: "no-store",
  });
  if (!r.ok) return [];
  return (await r.json().catch(() => [])) as any[];
}

// The travel fields first, in the order a travel desk reads them.
const FIELDS: [string, string][] = [
  ["user_name", "Customer name"], ["customer_request", "Wants"], ["enquiry_category", "Type of enquiry"],
  ["destination", "Destination"], ["package_quoted", "Package quoted"], ["travel_dates", "Travel dates"],
  ["traveller_count", "Travellers"], ["budget", "Budget"], ["price_quoted", "Price quoted"],
  ["lead_status", "Lead"], ["disposition", "Call outcome"], ["callback_time", "Callback time"],
  ["contact_preference", "Contact preference"], ["next_step", "Next step promised"],
];
const SKIP = new Set(["rana_instructions", "call_summary", "summary", "customer_summary"]);

const fmtPhone = (n: string) => {
  const d = String(n || "").replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("9180")) return `080 ${d.slice(4, 8)} ${d.slice(8)}`;
  if (d.length === 12 && d.startsWith("91")) return `+91 ${d.slice(2, 7)} ${d.slice(7)}`;
  return n || "—";
};
const clean = (v: unknown) => {
  const s = String(v ?? "").trim();
  return s && s.toLowerCase() !== "null" ? s : "";
};

export default async function CallPage({ params }: { params: { code: string } }) {
  const code = String(params.code || "");
  if (!/^[a-z0-9]{10,16}$/.test(code)) notFound();
  const [row] = await sb(`/call_summary_log?rec_code=eq.${code}&select=payload,created_at,route_id&limit=1`);
  if (!row?.payload) notFound();
  const p = row.payload || {};
  const [route] = await sb(`/call_summary_routes?id=eq.${row.route_id}&select=name&limit=1`);
  const agentPhone = String(p.agent_phone_number || "");
  const [line] = agentPhone ? await sb(`/phone_lines?number=eq.${encodeURIComponent(agentPhone)}&select=label&limit=1`) : [];

  const vars: Record<string, unknown> = { ...(p.initial_agent_variables || {}), ...(p.final_agent_variables || {}), ...(p.output_agent_variables || {}) };
  const known = FIELDS.map(([k, l]) => [l, clean(vars[k])] as [string, string]).filter(([, v]) => v);
  const knownKeys = new Set(FIELDS.map(([k]) => k));
  const others = Object.entries(vars)
    .filter(([k, v]) => !knownKeys.has(k) && !SKIP.has(k) && (typeof v !== "object" || v === null) && clean(v))
    .map(([k, v]) => [k.replace(/_/g, " "), clean(v)] as [string, string]);
  const summary = clean(vars.call_summary) || clean(vars.summary);
  const turns: { who: string; en: string; orig: string }[] = (Array.isArray(p.interaction_transcript) ? p.interaction_transcript : [])
    .map((t: any) => {
      const en = clean(t?.en_text || t?.text);
      const orig = clean(t?.indic_text);
      return { who: ["agent", "bot", "assistant"].includes(String(t?.role).toLowerCase()) ? "AI agent" : "Customer", en: en || orig, orig: orig && orig !== en ? orig : "" };
    })
    .filter((t: { en: string }) => t.en);
  const secs = Math.round(Number(p.duration || 0));
  const when = new Date(p.start_datetime || row.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true });
  const lineLabel = line?.label ? String(line.label) : "";
  const calledText = lineLabel ? (/number|line/i.test(lineLabel) ? lineLabel : `${lineLabel}'s number`) : "";
  const audio = `${SUPABASE_URL}/functions/v1/rec?c=${code}`;

  return (
    <main className="min-h-screen bg-paper text-ink px-4 py-6 flex justify-center">
      <div className="w-full max-w-[640px] flex flex-col gap-4">
        <div>
          <div className="text-[12px] font-semibold text-ink-soft uppercase tracking-wide">{route?.name || "Call details"}</div>
          <h1 className="font-display text-[22px] font-semibold m-0 mt-1">{clean(vars.user_name) || "Unknown caller"}</h1>
          <div className="text-[13.5px] text-ink-soft mt-0.5">
            <a href={`tel:${p.user_phone_number || ""}`} className="text-signal font-semibold">{fmtPhone(p.user_phone_number)}</a> · {when} · {Math.floor(secs / 60)}m {secs % 60}s
          </div>
          {calledText && (
            <div className="mt-2 inline-block text-[13px] font-semibold rounded-full px-3 py-1 border border-signal/50 text-signal">
              Customer called {calledText} ({fmtPhone(agentPhone)})
            </div>
          )}
        </div>

        {summary && (
          <section className="bg-raised border border-line rounded-[10px] p-4">
            <div className="text-[12.5px] font-semibold text-ink-soft mb-1">Summary</div>
            <p className="text-[14px] leading-relaxed m-0">{summary}</p>
          </section>
        )}

        <section className="bg-raised border border-line rounded-[10px] p-4">
          <div className="text-[12.5px] font-semibold text-ink-soft mb-2">Call recording</div>
          <audio controls preload="none" src={audio} className="w-full" />
          <div className="text-[12px] text-ink-soft mt-1.5">If it doesn&apos;t play yet, try again in a minute. <a href={audio} className="text-signal font-semibold">Open the audio file</a></div>
        </section>

        {(known.length > 0 || others.length > 0) && (
          <section className="bg-raised border border-line rounded-[10px] overflow-hidden">
            <div className="text-[12.5px] font-semibold text-ink-soft px-4 pt-3 pb-2">Trip details captured on the call</div>
            <div className="divide-y divide-line text-[13.5px]">
              {[...known, ...others].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 px-4 py-2"><span className="text-ink-soft capitalize">{k}</span><span className="font-medium text-right">{v}</span></div>
              ))}
            </div>
          </section>
        )}

        <section className="bg-raised border border-line rounded-[10px] p-4">
          <div className="text-[12.5px] font-semibold text-ink-soft mb-2">Full conversation</div>
          {turns.length ? (
            <div className="flex flex-col gap-2">
              {turns.map((t, i) => (
                <div key={i} className={`max-w-[88%] rounded-lg px-3 py-2 text-[13.5px] leading-relaxed ${t.who === "AI agent" ? "bg-signal-tint self-start" : "bg-paper border border-line self-end"}`}>
                  <div className="text-[10.5px] uppercase tracking-wide text-ink-soft mb-0.5">{t.who}</div>
                  {t.orig && <div className="mb-0.5">{t.orig}</div>}
                  <div className={t.orig ? "text-ink-soft" : ""}>{t.en}</div>
                </div>
              ))}
            </div>
          ) : <div className="text-[13px] text-ink-soft">No conversation was captured on this call.</div>}
        </section>

        <div className="text-[11.5px] text-ink-soft text-center pb-4">Answered by your RANA AI agent. Keep this link private — anyone with it can open this call.</div>
      </div>
    </main>
  );
}
