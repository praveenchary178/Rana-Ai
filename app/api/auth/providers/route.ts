export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { googleEnabled } from "@/lib/googleAuth";

/** GET — which extra sign-in options the login page should show. */
export async function GET() {
  return Response.json({ google: googleEnabled() }, { headers: { "Cache-Control": "no-store" } });
}
