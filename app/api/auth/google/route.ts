export const runtime = "nodejs";
import { googleEnabled, newStateAndNonce, stateCookieValue, cookieHeader, authorizeUrl, safeNext } from "@/lib/googleAuth";

/** GET /api/auth/google?next=/campaigns&email=… — starts "Continue with Google". */
export async function GET(req: Request) {
  const url = new URL(req.url);
  if (!googleEnabled()) return Response.redirect(new URL("/login?error=google_off", url.origin), 302);
  const { state, nonce } = newStateAndNonce();
  const headers = new Headers({ Location: authorizeUrl(req, state, nonce, url.searchParams.get("email")), "Cache-Control": "no-store" });
  headers.append("Set-Cookie", cookieHeader(stateCookieValue({ state, nonce, next: safeNext(url.searchParams.get("next")) }), 600));
  return new Response(null, { status: 302, headers });
}
