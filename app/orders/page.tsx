"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import StatusPill from "@/components/StatusPill";
import OrderDrawer from "@/components/OrderDrawer";
import type { OrderRow, PaymentStatus } from "@/lib/anFarmsOrders";
import { PAYMENT_LABEL, PAYMENT_TONE } from "@/lib/orderFormat";
import { fmtPhone, fmtClock, fmtDate } from "@/lib/format";

type Filter = "all" | PaymentStatus;
const filters: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending_call", label: "Pending call" },
  { key: "called_no_payment", label: "Called, no payment" },
  { key: "payment_collected", label: "Paid" },
  { key: "cancelled", label: "Cancelled" },
];

export default function OrdersPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<OrderRow | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/orders?limit=300", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load");
      setOrders(json.orders); setCounts(json.counts || {}); setError("");
    } catch (e: any) { setError(e.message); }
  }
  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, []);

  const all = orders ?? [];
  const shown = filter === "all" ? all : all.filter((o) => o.payment_status === filter);

  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar active="orders" />
      <main className="flex-1 box-border p-11 flex flex-col gap-5">
        <div>
          <h1 className="font-display text-[26px] font-semibold m-0">Orders</h1>
          <div className="text-[13px] text-ink-soft mt-1">Hot leads that placed an order. Track whether your telecaller has followed up and collected payment.</div>
        </div>

        <div className="flex gap-1 bg-raised border border-line rounded-[9px] p-1 w-fit overflow-x-auto">
          {filters.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`text-[13.5px] font-semibold px-3.5 py-2 rounded-md whitespace-nowrap ${filter === f.key ? "bg-ink text-paper" : "text-ink-soft"}`}>
              {f.label} <span className="opacity-60">{counts[f.key] ?? 0}</span>
            </button>
          ))}
        </div>

        {error && <div className="text-[12.5px] text-miss bg-miss-tint rounded-lg px-3 py-2.5">{error}</div>}

        <div className="bg-raised border border-line rounded-[10px] flex-1 overflow-hidden flex flex-col">
          <div className="flex px-5 py-3 border-b border-line text-[11.5px] font-semibold text-ink-soft">
            <div className="w-[110px]">Order</div>
            <div className="w-[160px]">Caller</div>
            <div className="flex-1">Product</div>
            <div className="w-24">Total</div>
            <div className="w-[150px]">Payment</div>
            <div className="w-[110px] text-right">When</div>
          </div>
          <div className="overflow-y-auto flex-1">
            {orders === null && !error && <div className="p-6 text-[13px] text-ink-soft">Loading…</div>}
            {orders !== null && shown.length === 0 && (
              <div className="p-8 text-center text-[13.5px] text-ink-soft">No orders {filter !== "all" ? "in this filter" : "yet"}.</div>
            )}
            {shown.map((o) => (
              <button key={o.id} onClick={() => setSelected(o)} className="w-full text-left flex items-center px-5 py-3.5 border-b border-line last:border-b-0 hover:bg-paper">
                <div className="w-[110px] pr-2 text-[13.5px] font-semibold truncate">{o.order_number}</div>
                <div className="w-[160px] pr-3 text-xs text-ink-soft truncate">{fmtPhone(o.caller_phone)}</div>
                <div className="flex-1 min-w-0 text-[13px] text-ink-soft truncate pr-3">{o.product || "—"}{o.quantity ? ` · ${o.quantity}` : ""}</div>
                <div className="w-24 text-[13px] text-ink-soft">{o.total_price ? `₹${o.total_price}` : "—"}</div>
                <div className="w-[150px]"><StatusPill label={PAYMENT_LABEL[o.payment_status]} tone={PAYMENT_TONE[o.payment_status]} /></div>
                <div className="w-[110px] text-right text-xs text-ink-soft">{fmtDate(o.created_at)} {fmtClock(o.created_at)}</div>
              </button>
            ))}
          </div>
        </div>
      </main>
      <OrderDrawer order={selected} onClose={() => setSelected(null)} onUpdated={(u) => { setSelected(u); setOrders((os) => (os ?? []).map((o) => (o.id === u.id ? u : o))); }} />
    </div>
  );
}
