// "Continue with Google" (OpenID Connect, authorization-code flow). No dependencies.
// Needs GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET; the button stays hidden until both are set.
// The Google OAuth client must list <site>/api/auth/google/callback as an authorized redirect URI.
import crypto from "crypto";

export const GOOGLE_COOKIE = "rana_google_oauth";
const STATE_TTL_MS = 10 * 60_000;

export function googleEnabled(): boolean {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

/** Where Google sends people back. GOOGLE_REDIRECT_URI pins it; otherwise this site's own origin. */
export function redirectUri(req: Request): string {
  return process.env.GOOGLE_REDIRECT_URI || `${new URL(req.url).origin}/api/auth/google/callback`;
}

/** Same rule as the login page: a local path only (blocks //evil and /\evil). */
export function safeNext(next: string | null | undefined): string | null {
  const n = String(next || "");
  return n && /^\/(?![\/\\])/.test(n) && !/[\\\s]/.test(n) && n !== "/" && n.length < 300 ? n : null;
}

const key = () => process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_KEY || "";
function sign(data: string) { return crypto.createHmac("sha256", key()).update("google:" + data).digest("hex"); }

/** Signed, short-lived cookie that ties Google's reply to the browser that started the sign-in. */
export function newStateAndNonce(): { state: string; nonce: string } {
  return { state: crypto.randomBytes(24).toString("base64url"), nonce: crypto.randomBytes(24).toString("base64url") };
}
/** purpose "calendar": a founder connecting HQ's Google Calendar (same client and redirect URI as sign-in). */
export function stateCookieValue(p: { state: string; nonce: string; next: string | null; purpose?: "login" | "calendar" }): string {
  const data = Buffer.from(JSON.stringify({ ...p, exp: Date.now() + STATE_TTL_MS })).toString("base64url");
  return `${data}.${sign(data)}`;
}
export function readStateCookie(raw: string | undefined): { state: string; nonce: string; next: string | null; purpose: "login" | "calendar" } | null {
  const [data, sig] = String(raw || "").split(".");
  if (!data || !sig || !key()) return null;
  const want = sign(data);
  if (want.length !== sig.length || !crypto.timingSafeEqual(Buffer.from(want), Buffer.from(sig))) return null;
  try {
    const p = JSON.parse(Buffer.from(data, "base64url").toString());
    return p && p.exp > Date.now() && p.state && p.nonce ? { state: p.state, nonce: p.nonce, next: safeNext(p.next), purpose: p.purpose === "calendar" ? "calendar" : "login" } : null;
  } catch { return null; }
}
export function cookieHeader(value: string, maxAgeSec: number): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${GOOGLE_COOKIE}=${value}; Path=/api/auth/google; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}${secure}`;
}
export function readCookie(req: Request, name: string): string | undefined {
  const m = (req.headers.get("cookie") || "").match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return m?.[1];
}

export function authorizeUrl(req: Request, state: string, nonce: string, loginHint?: string | null): string {
  const u = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  u.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID || "");
  u.searchParams.set("redirect_uri", redirectUri(req));
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", "openid email profile");
  u.searchParams.set("state", state);
  u.searchParams.set("nonce", nonce);
  u.searchParams.set("prompt", "select_account");
  if (loginHint && /^[^\s@]+@[^\s@]+$/.test(loginHint)) u.searchParams.set("login_hint", loginHint);
  return u.toString();
}

export type GoogleIdentity = { email: string; name: string | null; sub: string };

/**
 * Swaps the one-time code for Google's ID token and checks it. The token comes straight from Google's token endpoint
 * over TLS, so (per OpenID Connect) its claims are checked here rather than its signature.
 */
export async function exchangeCode(req: Request, code: string, nonce: string): Promise<GoogleIdentity> {
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code, client_id: process.env.GOOGLE_CLIENT_ID || "", client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirect_uri: redirectUri(req), grant_type: "authorization_code",
    }),
    signal: AbortSignal.timeout(10_000),
  });
  const j: any = await r.json().catch(() => ({}));
  if (!r.ok || !j.id_token) throw new Error(`token ${r.status} ${j.error || ""}`.trim());
  const part = String(j.id_token).split(".")[1];
  const c: any = JSON.parse(Buffer.from(part, "base64url").toString());
  if (c.iss !== "https://accounts.google.com" && c.iss !== "accounts.google.com") throw new Error("bad issuer");
  if (c.aud !== process.env.GOOGLE_CLIENT_ID) throw new Error("bad audience");
  if (!c.exp || c.exp * 1000 < Date.now()) throw new Error("expired");
  if (!c.nonce || c.nonce !== nonce) throw new Error("bad nonce");
  if (!c.email || c.email_verified !== true) throw new Error("email not verified");
  return { email: String(c.email).trim().toLowerCase(), name: c.name ? String(c.name) : null, sub: String(c.sub) };
}
