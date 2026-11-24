// AN Farms (poultry) order payment tracking — a single-tenant table, not part of the generic
// multi-client `calls` data layer (see lib/calls.ts). Orders are created mid-call by the
// `an-farms-book-order` edge function; the call-summary edge function backfills caller_phone/
// call_log_id by matching order timing against call_summary_log. This module is the dashboard-side
// read/update layer for that table, following the same shape as lib/calls.ts (CallRow/updateCall).
import { sb } from "./db";

// AN Farms' row in `clients`. Also duplicated (not imported) in components/Sidebar.tsx so that a
// client component never pulls this server-only module (which touches SUPABASE_SERVICE_KEY) into
// the browser bundle just to decide whether to show the "Orders" nav item.
export const AN_FARMS_CLIENT_ID = "35c7498b-3172-4123-8a89-c4fe597634ce";

export type PaymentStatus = "pending_call" | "called_no_payment" | "payment_collected" | "cancelled";
export const PAYMENT_STATUSES: PaymentStatus[] = ["pending_call", "called_no_payment", "payment_collected", "cancelled"];

export type OrderRow = {
  id: number;
  order_number: string;
  product: string | null;
  quantity: string | null;
  delivery_area: string | null;
  delivery_address: string | null;
  total_price: string | null;
  estimated_delivery: string | null;
  status: string | null;
  caller_phone: string | null;
  call_log_id: number | null;
  payment_status: PaymentStatus;
  collected_amount: number | null;
  called_at: string | null;
  paid_at: string | null;
  telecaller: string | null;
  telecaller_notes: string | null;
  created_at: string;
};

const COLS =
  "id,order_number,product,quantity,delivery_area,delivery_address,total_price,estimated_delivery,status," +
  "caller_phone,call_log_id,payment_status,collected_amount,called_at,paid_at,telecaller,telecaller_notes,created_at";

export async function listOrders(opts: { status?: string; since?: string; limit?: number } = {}): Promise<OrderRow[]> {
  const limit = Math.min(500, Math.max(1, opts.limit ?? 200));
  let q = `/an_farms_orders?select=${COLS}&order=created_at.desc&limit=${limit}`;
  if (opts.status && opts.status !== "all") q += `&payment_status=eq.${opts.status}`;
  if (opts.since) q += `&created_at=gte.${encodeURIComponent(opts.since)}`;
  return (await sb<OrderRow[]>(q)) || [];
}

export async function getOrder(id: number | string): Promise<OrderRow | null> {
  const rows = await sb<OrderRow[]>(`/an_farms_orders?id=eq.${id}&select=${COLS}&limit=1`);
  return rows?.[0] ?? null;
}

export async function updateOrder(
  id: number | string,
  patch: Partial<Pick<OrderRow, "payment_status" | "collected_amount" | "telecaller" | "telecaller_notes" | "called_at" | "paid_at">>,
): Promise<OrderRow | null> {
  const rows = await sb<OrderRow[]>(`/an_farms_orders?id=eq.${id}&select=${COLS}`, { method: "PATCH", body: JSON.stringify(patch) });
  return rows?.[0] ?? null;
}

export type LinkedCall = {
  id: string;
  interaction_id: string | null;
  summary: string | null;
  transcript: { role: "agent" | "user"; text: string; indic_text?: string | null }[];
  recording_url: string | null;
  duration_seconds: number;
  created_at: string;
};

/**
 * The actual call behind an order. An order is created mid-call by the an-farms-book-order edge
 * function (the Sarvam agent's book_order tool handler) — it has no transcript or recording of its
 * own. The call-summary edge function later backfills order.call_log_id with the matching row's id
 * in call_summary_log (matched by timing, see migration an_farms_orders_payment_tracking). That log
 * row's call_ref is the same interaction_id the dashboard's generic `calls` table keys on, so this
 * does one more hop — call_log_id -> call_summary_log.call_ref -> calls.interaction_id -> the real
 * call record with its transcript and recording.
 */
export async function getLinkedCall(order: Pick<OrderRow, "call_log_id">): Promise<LinkedCall | null> {
  if (!order.call_log_id) return null;
  const logRows = await sb<{ call_ref: string | null }[]>(`/call_summary_log?id=eq.${order.call_log_id}&select=call_ref&limit=1`);
  const ref = logRows?.[0]?.call_ref;
  if (!ref) return null;
  const rows = await sb<LinkedCall[]>(
    `/calls?client_id=eq.${AN_FARMS_CLIENT_ID}&interaction_id=eq.${encodeURIComponent(ref)}&select=id,interaction_id,summary,transcript,recording_url,duration_seconds,created_at&limit=1`,
  );
  return rows?.[0] ?? null;
}

/** Counts by payment_status, for the filter tab badges. Cheap at AN Farms' current order volume. */
export async function orderCounts(): Promise<Record<"all" | PaymentStatus, number>> {
  const rows = (await sb<{ payment_status: PaymentStatus }[]>(`/an_farms_orders?select=payment_status`)) || [];
  const out: Record<"all" | PaymentStatus, number> = { all: rows.length, pending_call: 0, called_no_payment: 0, payment_collected: 0, cancelled: 0 };
  for (const r of rows) out[r.payment_status] = (out[r.payment_status] || 0) + 1;
  return out;
}
