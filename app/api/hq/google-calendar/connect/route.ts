export const runtime = "nodejs";
import { getSession } from "@/lib/session";
import { requireHq } from "@/lib/hq";
import { googleEnabled, newStateAndNonce, stateCookieValue, cookieHeader } from "@/lib/googleAuth";
import { calendarAuthorizeUrl } from "@/lib/googleCalendar";

/** GET — a founder connects HQ's Google Calendar, so Priya's demo bookings get a Google Meet invite. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const session = await getSession(req);
  if (requireHq(session, "team")) return Response.redirect(new URL("/hq/leads?calendar=not_allowed", url.origin), 302);
  if (!googleEnabled()) return Response.redirect(new URL("/hq/leads?calendar=google_off", url.origin), 302);
  const { state, nonce } = newStateAndNonce();
  const headers = new Headers({ Location: calendarAuthorizeUrl(req, state, session?.email), "Cache-Control": "no-store" });
  headers.append("Set-Cookie", cookieHeader(stateCookieValue({ state, nonce, next: null, purpose: "calendar" }), 600));
  return new Response(null, { status: 302, headers });
}
