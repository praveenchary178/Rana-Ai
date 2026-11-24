"use client";
import { useEffect, useState } from "react";
import StatusPill from "@/components/StatusPill";
import { fmtPhone, fmtClock, fmtDate } from "@/lib/format";
import { PAYMENT_LABEL, PAYMENT_TONE, PAYMENT_ORDER } from "@/lib/orderFormat";
import type { OrderRow, PaymentStatus, LinkedCall } from "@/lib/anFarmsOrders";

export default function OrderDrawer({ order, onClose, onUpdated }: { order: OrderRow | null; onClose: () => void; onUpdated: (o: OrderRow) => void }) {
  const [notes, setNotes] = useState(order?.telecaller_notes ?? "");
  const [telecaller, setTelecaller] = useState(order?.telecaller ?? "");
  const [amount, setAmount] = useState(order?.collected_amount != null ? String(order.collected_amount) : "");
  const [saving, setSaving] = useState(false);
  // The order itself has no transcript — it's created mid-call, before the call-summary webhook
  // fires. Looked up on demand from the real call record (see lib/anFarmsOrders.getLinkedCall).
  const [call, setCall] = useState<LinkedCall | null | undefined>(undefined);
  const [showCall, setShowCall] = useState(false);
  useEffect(() => {
    setNotes(order?.telecaller_notes ?? "");
    setTelecaller(order?.telecaller ?? "");
    setAmount(order?.collected_amount != null ? String(order.collected_amount) : "");
    setCall(undefined);
    setShowCall(false);
  }, [order?.id]);

  async function openCall() {
    setShowCall(true);
    if (call !== undefined) return; // already fetched (or confirmed none) for this order
    try {
      const res = await fetch(`/api/orders/${order!.id}`);
      const data = await res.json();
      setCall(res.ok ? data.call ?? null : null);
    } catch { setCall(null); }
  }

  if (!order) return null;

  async function patch(body: Record<string, unknown>) {
    setSaving(true);
    try {
      const res = await fetch(`/api/orders/${order!.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (res.ok) onUpdated(data.order);
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-40 flex" onClick={onClose}>
      <div className="flex-1 bg-black/60" />
      <aside className="w-[440px] max-w-full bg-raised border-l border-line h-full overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-line flex items-start justify-between gap-3">
          <div>
            <div className="font-display text-[19px] font-semibold">{order.order_number}</div>
            <div className="text-[13px] text-ink-soft">
              {order.caller_phone ? (
                <button onClick={openCall} className="font-semibold text-signal hover:underline">{fmtPhone(order.caller_phone)}</button>
              ) : fmtPhone(order.caller_phone)} · {fmtDate(order.created_at)} {fmtClock(order.created_at)}
            </div>
          </div>
          <button onClick={onClose} className="text-ink-soft hover:text-ink text-lg leading-none">×</button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          {showCall && (
            <div className="border border-line rounded-lg p-3">
              <div className="text-[12.5px] font-semibold text-ink-soft mb-2">Call transcript</div>
              {call === undefined && <div className="text-[13px] text-ink-soft">Loading…</div>}
              {call === null && (
                <div className="text-[13px] text-ink-soft">
                  {order.call_log_id ? "Couldn't find the matching call record." : "This order isn't linked to a call yet — it was placed before call-tracking was added, or the match didn't run."}
                </div>
              )}
              {call && (
                <div className="flex flex-col gap-3">
                  {call.summary && <p className="text-[13.5px] leading-relaxed m-0">{call.summary}</p>}
                  {call.recording_url && (
                    <div className="flex flex-col gap-1.5">
                      <audio controls src={call.recording_url} className="w-full h-9" />
                      <a href={call.recording_url} download target="_blank" rel="noreferrer" className="text-[12px] font-semibold text-signal self-start">Download recording</a>
                    </div>
                  )}
                  {call.transcript?.length ? (
                    <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
                      {call.transcript.map((t, i) => (
                        <div key={i} className={`max-w-[92%] rounded-lg px-3 py-2 text-[13px] leading-relaxed ${t.role === "agent" ? "bg-signal-tint self-start" : "bg-paper self-end"}`}>
                          <div className="text-[10.5px] uppercase tracking-wide text-ink-soft mb-0.5">{t.role === "agent" ? "Agent" : "Caller"}</div>
                          {t.indic_text && <div className="mb-0.5">{t.indic_text}</div>}
                          <div className={t.indic_text ? "text-ink-soft" : ""}>{t.text}</div>
                        </div>
                      ))}
                    </div>
                  ) : <div className="text-[13px] text-ink-soft">No transcript on the call record.</div>}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-[12.5px]">
            <div className="border border-line rounded-lg p-3"><div className="text-ink-soft">Product</div><div className="font-semibold text-[14px]">{order.product || "—"}{order.quantity ? ` · ${order.quantity}` : ""}</div></div>
            <div className="border border-line rounded-lg p-3"><div className="text-ink-soft">Order total</div><div className="font-semibold text-[14px]">{order.total_price ? `₹${order.total_price}` : "—"}</div></div>
            <div className="border border-line rounded-lg p-3"><div className="text-ink-soft">Delivery area</div><div className="font-semibold text-[14px]">{order.delivery_area || "—"}</div></div>
            <div className="border border-line rounded-lg p-3"><div className="text-ink-soft">Est. delivery</div><div className="font-semibold text-[14px]">{order.estimated_delivery || "—"}</div></div>
          </div>
          {order.delivery_address && (
            <div className="border border-line rounded-lg px-3 py-2.5 bg-paper text-[13px]"><span className="text-ink-soft">Address:</span> {order.delivery_address}</div>
          )}

          <div>
            <div className="text-[12.5px] font-semibold text-ink-soft mb-2">Payment status</div>
            <div className="flex flex-wrap gap-1.5">
              {PAYMENT_ORDER.map((s: PaymentStatus) => (
                <button key={s} disabled={saving} onClick={() => patch({ payment_status: s })}
                  className={`text-xs font-semibold px-2.5 py-1.5 rounded-md border ${order.payment_status === s ? "bg-ink text-paper border-ink" : "border-line text-ink-soft hover:border-ink"}`}>
                  {PAYMENT_LABEL[s]}
                </button>
              ))}
            </div>
            <div className="mt-1.5"><StatusPill label={PAYMENT_LABEL[order.payment_status]} tone={PAYMENT_TONE[order.payment_status]} /></div>
            {(order.called_at || order.paid_at) && (
              <div className="text-[11.5px] text-ink-soft mt-1.5">
                {order.called_at && <>Called {fmtDate(order.called_at)} {fmtClock(order.called_at)}</>}
                {order.paid_at && <>{order.called_at ? " · " : ""}Paid {fmtDate(order.paid_at)} {fmtClock(order.paid_at)}</>}
              </div>
            )}
          </div>

          <div>
            <div className="text-[12.5px] font-semibold text-ink-soft mb-1.5">Amount collected</div>
            <div className="flex gap-2">
              <input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0"
                className="w-full border border-line rounded-lg px-3 py-2 text-[13.5px] bg-paper outline-none focus:border-signal" />
              <button disabled={saving || amount === "" || Number(amount) === (order.collected_amount ?? -1)}
                onClick={() => patch({ collected_amount: Number(amount) })}
                className="text-[12.5px] font-semibold px-3 py-2 rounded-md bg-signal text-on-accent disabled:opacity-40 whitespace-nowrap">Save</button>
            </div>
          </div>

          <div>
            <div className="text-[12.5px] font-semibold text-ink-soft mb-1.5">Telecaller</div>
            <div className="flex gap-2">
              <input value={telecaller} onChange={(e) => setTelecaller(e.target.value)} placeholder="Who followed up?"
                className="w-full border border-line rounded-lg px-3 py-2 text-[13.5px] bg-paper outline-none focus:border-signal" />
              <button disabled={saving || telecaller === (order.telecaller ?? "")} onClick={() => patch({ telecaller })}
                className="text-[12.5px] font-semibold px-3 py-2 rounded-md bg-signal text-on-accent disabled:opacity-40 whitespace-nowrap">Save</button>
            </div>
          </div>

          <div>
            <div className="text-[12.5px] font-semibold text-ink-soft mb-1.5">Notes</div>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="e.g. Asked to call back after 6pm"
              className="w-full border border-line rounded-lg px-3 py-2 text-[13.5px] bg-paper outline-none focus:border-signal" />
            <button disabled={saving || notes === (order.telecaller_notes ?? "")} onClick={() => patch({ telecaller_notes: notes })}
              className="mt-2 text-[12.5px] font-semibold px-3 py-1.5 rounded-md bg-signal text-on-accent disabled:opacity-40">Save notes</button>
          </div>
        </div>
      </aside>
    </div>
  );
}
