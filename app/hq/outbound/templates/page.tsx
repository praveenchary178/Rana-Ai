"use client";
import { useEffect, useState } from "react";
import OutboundShell, { Notice, Pill, btn, getJson } from "@/components/OutboundShell";

/** RANA HQ → Outbound → Templates.
 *  Read-only list of WhatsApp message templates for the Rana AI number and every number connected through
 *  Rana AI Connect, fetched live from Meta (GET /{waba-id}/message_templates) by the wa-connect Edge Function. */
const STATUS_TONE: Record<string, string> = {
  APPROVED: "bg-signal-tint text-signal", PENDING: "bg-hot-tint text-hot", IN_APPEAL: "bg-hot-tint text-hot",
  REJECTED: "bg-miss-tint text-miss", PAUSED: "bg-miss-tint text-miss", DISABLED: "bg-sunken text-ink-soft",
};

export default function Templates() {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");

  const load = () => { setBusy(true); setErr(""); getJson("/api/hq/wa-connect?view=templates").then(setData).catch((e) => setErr(e.message)).finally(() => setBusy(false)); };
  useEffect(() => { load(); }, []);

  const accounts: any[] = data?.accounts || [];
  const match = (t: any) => !q.trim() || `${t.name} ${t.body}`.toLowerCase().includes(q.trim().toLowerCase());

  return (
    <OutboundShell title="WhatsApp templates" sub="Message templates approved by Meta for your WhatsApp numbers. Loaded live from Meta each time you open this page."
      actions={<button onClick={load} disabled={busy} className={btn} data-testid="tpl-refresh">{busy ? "Loading…" : "Refresh from Meta"}</button>}>
      <Notice err={err} onClear={() => setErr("")} />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search templates…" className="w-full max-w-[420px] border border-line rounded-lg px-3 py-2 text-[16px] md:text-[13px] bg-paper" data-testid="tpl-search" />
      {!data && !err && <div className="text-[13px] text-ink-soft">Loading templates from Meta…</div>}
      {data && !accounts.length && <div className="text-[13px] text-ink-soft">No WhatsApp accounts to show yet.</div>}
      {accounts.map((a) => {
        const list = (a.templates || []).filter(match);
        return (
          <div key={a.waba_id} className="border border-line rounded-xl bg-raised" data-testid="tpl-account">
            <div className="px-4 py-3 border-b border-line flex items-center justify-between gap-2 flex-wrap">
              <div className="text-[14px] font-semibold">{a.label} <span className="text-ink-soft font-normal text-[12px]">· WhatsApp Business Account {a.waba_id}</span></div>
              <div className="text-[12px] text-ink-soft">{(a.templates || []).length} templates</div>
            </div>
            {a.error ? <div className="p-4 text-[13px] text-miss">Meta returned an error: {a.error}</div> : !list.length ? <div className="p-4 text-[13px] text-ink-soft">No templates{q ? " match your search" : ""}.</div> : (
              <div className="divide-y divide-line">
                {list.map((t: any) => (
                  <div key={`${t.name}-${t.language}`} className="px-4 py-3 flex flex-col gap-1.5 text-[13px]" data-testid="tpl-row">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold font-mono text-[12.5px]">{t.name}</span>
                      <Pill tone={STATUS_TONE[t.status] || ""}>{t.status}</Pill>
                      <Pill>{t.category}</Pill>
                      <Pill>{t.language}</Pill>
                    </div>
                    {t.body && <div className="text-[12.5px] text-ink-soft whitespace-pre-wrap">{t.body}</div>}
                    {t.rejected_reason && t.rejected_reason !== "NONE" && <div className="text-[12px] text-miss">Rejected: {t.rejected_reason}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </OutboundShell>
  );
}
