export const runtime = "nodejs";
import { sb } from "@/lib/db";
import { audit } from "@/lib/audit";
import { getInvoice, markPaid } from "@/lib/billing";
import { verifyLinkCallback, fetchPaymentLink, razorpayConfigured } from "@/lib/razorpay";

/**
 * POST { invoice, razorpay_* } — the browser lands on /trial/done after paying for the trial pack. Public (the buyer
 * may not be signed in on this device): it only ever marks the invoice paid after Razorpay's signature checks out or
 * Razorpay itself says the link is paid. The webhook does the same, whichever arrives first.
 */
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({} as any));
  const inv = await getInvoice(String(b.invoice || b.razorpay_payment_link_reference_id || ""));
  if (!inv || inv.kind !== "trial") return Response.json({ error: "Not found" }, { status: 404 });
  const done = async () => {
    const [c] = (await sb<any[]>(`/clients?id=eq.${inv.client_id}&select=name,trial_ends_at&limit=1`).catch(() => [])) || [];
    return Response.json({ ok: true, paid: true, company: c?.name || null, trialEndsAt: c?.trial_ends_at || null, number: inv.number });
  };
  if (inv.status === "paid") return done();
  const linkId = String(b.razorpay_payment_link_id || "");
  if (!inv.rzp_link_id || (linkId && linkId !== inv.rzp_link_id)) return Response.json({ ok: true, paid: false });
  let paymentId = String(b.razorpay_payment_id || "");
  let paid = false;
  if (b.razorpay_signature && verifyLinkCallback({ linkId, referenceId: String(b.razorpay_payment_link_reference_id || ""), status: String(b.razorpay_payment_link_status || ""), paymentId, signature: String(b.razorpay_signature) }))
    paid = b.razorpay_payment_link_status === "paid" && b.razorpay_payment_link_reference_id === inv.id;
  else if (razorpayConfigured()) {
    const link = await fetchPaymentLink(inv.rzp_link_id).catch(() => null);
    paid = link?.status === "paid";
    paymentId = paymentId || link?.payments?.[0]?.payment_id || "";
  }
  if (!paid) return Response.json({ ok: true, paid: false, payUrl: inv.rzp_link_url || null });
  const r = await markPaid(inv.id, { via: "razorpay", paymentId });
  if (!r.already) await audit({ clientId: inv.client_id, email: "trial-pack" }, "invoice_paid", { req, targetType: "invoice", targetId: inv.id, detail: { number: inv.number, total: inv.total, via: "razorpay", trialPack: true } });
  return done();
}
