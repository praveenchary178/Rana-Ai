export const runtime = "nodejs";
import { unauthorized } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { listOrders, orderCounts, AN_FARMS_CLIENT_ID } from "@/lib/anFarmsOrders";

// AN Farms-only: this is a single-tenant table (no client_id column), so every route here is
// gated to AN Farms' workspace rather than scoped by session.clientId like /api/calls is.
export async function GET(req: Request) {
  const session = await getSession(req);
  if (!session) return unauthorized();
  if (session.clientId !== AN_FARMS_CLIENT_ID) return Response.json({ error: "Order tracking isn't available for this workspace" }, { status: 403 });
  const sp = new URL(req.url).searchParams;
  try {
    const [orders, counts] = await Promise.all([
      listOrders({ status: sp.get("status") ?? undefined, limit: Number(sp.get("limit") ?? 200) }),
      orderCounts(),
    ]);
    return Response.json({ orders, counts });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
