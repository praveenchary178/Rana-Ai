import { NextResponse, type NextRequest } from "next/server";

import { SEO_PUBLIC_PATHS } from "./app/seo/paths";
const PUBLIC_PATHS = [...SEO_PUBLIC_PATHS, "/login", "/contact", "/book-demo", "/trial", "/signup", "/forgot-password", "/reset-password", "/api/auth/login", "/api/auth/signup", "/api/auth/2fa", "/api/auth/forgot", "/api/auth/reset", "/api/auth/google", "/api/auth/providers", "/api/demo", "/api/proof-run", "/api/trial", "/for", "/api/public", "/api/webhooks", "/api/cron", "/landing", "/global", "/us", "/ae", "/eu", "/jp", "/legal", "/blog", "/robots.txt", "/sitemap.xml", "/llms.txt", "/opengraph-image", "/apple-icon", "/api/sarvam/diagnose", "/c", "/brand"];
// While RANA HQ looks inside a client's workspace read-only, these are the only writes allowed.
const RO_ALLOWED = ["/api/hq/return", "/api/auth/me"];
// The default Vercel address serves the same pages as ranaai.in. Send logged-out page visits (people and Google) to
// the real domain so it isn't a duplicate copy of the site. APIs (webhooks, cron) and signed-in sessions are left alone.
const VERCEL_HOST = "rana-ai-roan.vercel.app";

// Edge runtime: verify the HMAC-signed session cookie with Web Crypto (same scheme as lib/auth.ts).
async function sessionPayload(req: NextRequest): Promise<any | null> {
  const raw = req.cookies.get("rana_session")?.value;
  const secret = process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_KEY;
  if (!raw || !secret) return null;
  try {
    const [data, sig] = raw.split(".");
    if (!data || !sig) return null;
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data)));
    const expected = Array.from(mac).map((b) => b.toString(16).padStart(2, "0")).join("");
    if (expected.length !== sig.length) return null;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
    if (diff !== 0) return null;
    const json = atob(data.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(json);
    return payload?.clientId && payload.exp > Date.now() ? payload : null;
  } catch { return null; }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (
    req.headers.get("host") === VERCEL_HOST &&
    (req.method === "GET" || req.method === "HEAD") &&
    !pathname.startsWith("/api/") &&
    !req.cookies.get("rana_session")
  ) {
    return NextResponse.redirect(new URL(pathname + req.nextUrl.search, "https://ranaai.in"), 308);
  }
  // Old "?demo=1" links (ads, WhatsApp, emails) used to open a pop-up; demos are now booked on /book-demo.
  if (req.nextUrl.searchParams.get("demo") === "1" && !pathname.startsWith("/api/") && pathname !== "/book-demo") {
    const url = req.nextUrl.clone();
    url.pathname = "/book-demo";
    url.searchParams.delete("demo");
    if (!url.searchParams.has("from")) url.searchParams.set("from", "link");
    return NextResponse.redirect(url);
  }
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) return NextResponse.next();
  const s = await sessionPayload(req);
  if (s) {
    if (s.hqFrom) {
      // Timed HQ visit ran out → straight back to HQ.
      if (s.hqExp && s.hqExp < Date.now() && pathname !== "/api/hq/return") {
        if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Your support visit has ended. Go back to HQ." }, { status: 401 });
        const url = req.nextUrl.clone(); url.pathname = "/api/hq/return"; url.search = ""; return NextResponse.redirect(url);
      }
      if (s.hqRO && req.method !== "GET" && req.method !== "HEAD" && pathname.startsWith("/api/") && !RO_ALLOWED.includes(pathname))
        return NextResponse.json({ error: "Read-only support visit: nothing can be changed. Go back to HQ and open the workspace with editing on." }, { status: 403 });
    }
    return NextResponse.next();
  }
  // Logged-out visitors to the root see the public ranaai.in page instead of being bounced to /login.
  if (pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = "/landing";
    return NextResponse.rewrite(url);
  }
  if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

// Static files skip the login check. Every image type served from /public must be listed here, or logged-out
// visitors (and the image optimizer) get redirected to /login instead of the image.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpe?g|svg|ico|webp|avif|gif)).*)"],
};
