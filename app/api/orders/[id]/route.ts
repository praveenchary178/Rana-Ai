export const runtime = "nodejs";
import { unauthorized, forbidUnless } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { getSession } from "@/lib/session";
import { getOrder, getLinkedCall, updateOrder, AN_FARMS_CLIENT_ID, PAYMENT_STATUSES, type PaymentStatus } from "@/lib/anFarmsOrders";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession(req);
  if (!session) return unauthorized();
  if (session.clientId !== AN_FARMS_CLIENT_ID) return Response.json({ error: "Order tracking isn't available for this workspace" }, { status: 403 });
  const order = await getOrder(params.id);
  if (!order) return Response.json({ error: "Not found" }, { status: 404 });
  const call = await getLinkedCall(order).catch(() => null);
  return Response.json({ order, call });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession(req);
  if (!session) return unauthorized();
  if (session.clientId !== AN_FARMS_CLIENT_ID) return Response.json({ error: "Order tracking isn't available for this workspace" }, { status: 403 });
  const denied = forbidUnless(session, "agent"); if (denied) return denied;
  const body = await req.json().catch(() => ({}));
  const patch: any = {};
  if (body.payment_status && PAYMENT_STATUSES.includes(body.payment_status)) {
    const status = body.payment_status as PaymentStatus;
    patch.payment_status = status;
    // Stamp timestamps as the status moves forward, same spirit as lead_reason on calls.
    if (status === "called_no_payment" || status === "payment_collected") patch.called_at = new Date().toISOString();
    if (status === "payment_collected") patch.paid_at = new Date().toISOString();
  }
  if (typeof body.collected_amount === "number" && body.collected_amount >= 0) patch.collected_amount = body.collected_amount;
  if (typeof body.telecaller === "string") patch.telecaller = body.telecaller.trim();
  if (typeof body.telecaller_notes === "string") patch.telecaller_notes = body.telecaller_notes;
  if (!Object.keys(patch).length) return Response.json({ error: "Nothing to update" }, { status: 400 });
  const order = await updateOrder(params.id, patch);
  if (!order) return Response.json({ error: "Not found" }, { status: 404 });
  await audit(session, "an_farms_order_updated", { req, targetType: "an_farms_order", targetId: params.id, detail: patch });
  return Response.json({ order });
}
