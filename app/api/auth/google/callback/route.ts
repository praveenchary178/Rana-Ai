export const runtime = "nodejs";
import { randomBytes } from "crypto";
import { createSessionCookie } from "@/lib/auth";
import { getClientByEmail, getClientById } from "@/lib/supabase";
import { getUserByEmail, createUser, updateUser, type UserRow } from "@/lib/users";
import { audit } from "@/lib/audit";
import { makeTicket } from "@/lib/totp";
import { getSession } from "@/lib/session";
import { requireHq } from "@/lib/hq";
import { connectCalendarWithCode } from "@/lib/googleCalendar";
import { GOOGLE_COOKIE, googleEnabled, readStateCookie, readCookie, cookieHeader, exchangeCode } from "@/lib/googleAuth";

/**
 * GET /api/auth/google/callback — Google sends people back here. Signs in an EXISTING RANA user whose verified Google
 * email matches; never creates a new workspace. Two-step login still asks for the authenticator code.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const clear = cookieHeader("", 0);
  const back = (error: string, email?: string) => {
    const to = new URL("/login", url.origin);
    to.searchParams.set("error", error);
    if (email) to.searchParams.set("email", email);
    return new Response(null, { status: 302, headers: { Location: to.toString(), "Set-Cookie": clear, "Cache-Control": "no-store" } });
  };
  if (!googleEnabled()) return back("google_off");
  if (url.searchParams.get("error")) return back("google_cancelled");

  const saved = readStateCookie(readCookie(req, GOOGLE_COOKIE));
  const code = url.searchParams.get("code");
  if (!saved || !code || url.searchParams.get("state") !== saved.state) return back("google_expired");

  // A founder connecting HQ's Google Calendar (demo bookings with Google Meet), not a sign-in.
  if (saved.purpose === "calendar") {
    const done = (status: string) => new Response(null, { status: 302, headers: { Location: new URL(`/hq/leads?calendar=${status}`, url.origin).toString(), "Set-Cookie": clear, "Cache-Control": "no-store" } });
    const session = await getSession(req);
    if (requireHq(session, "team")) return done("not_allowed");
    try {
      await connectCalendarWithCode(req, code, (session as any)?.email || null);
      return done("connected");
    } catch (e: any) {
      console.error("[google calendar connect]", e?.message || e);
      return done("failed");
    }
  }

  let email: string;
  let gname: string | null;
  try {
    const id = await exchangeCode(req, code, saved.nonce);
    email = id.email; gname = id.name;
  } catch (e: any) {
    console.error("[google login]", e?.message || e);
    return back("google_failed");
  }

  try {
    let user: UserRow | null = await getUserByEmail(email);
    if (!user) {
      // The company's original shared login email: on first use it becomes that person's own Owner account (as with passwords).
      const legacy = await getClientByEmail(email);
      if (!legacy || !legacy.is_active) return back("google_no_account", email);
      user = await createUser({ clientId: legacy.id, email, name: gname || legacy.name, password: randomBytes(24).toString("base64url"), role: "owner", mustChange: false });
    }
    if (!user.is_active) return back("google_removed", email);
    const client = await getClientById(user.client_id);
    if (!client || !client.is_active) return back("google_disabled", email);

    // Two-step login on: Google proves the email, the authenticator code is still required.
    if ((user as any).totp_enabled && (user as any).totp_secret) {
      const to = new URL("/login", url.origin);
      if (saved.next) to.searchParams.set("next", saved.next);
      to.hash = `2fa=${makeTicket(user.id)}`; // the fragment never reaches a server or its logs
      return new Response(null, { status: 302, headers: { Location: to.toString(), "Set-Cookie": clear, "Cache-Control": "no-store" } });
    }

    await updateUser(user.id, { last_login_at: new Date().toISOString() } as any).catch(() => null);
    await audit({ clientId: client.id, email: user.email, userId: user.id }, "login", { req, detail: { via: "google" } });

    const home = (client as any).is_hq ? "/hq" : "/";
    const headers = new Headers({ Location: new URL(saved.next || home, url.origin).toString(), "Cache-Control": "no-store" });
    headers.append("Set-Cookie", createSessionCookie(client.id, user.email, { userId: user.id, role: user.role, name: user.name }));
    headers.append("Set-Cookie", clear);
    return new Response(null, { status: 302, headers });
  } catch (e: any) {
    console.error("[google login]", e?.message || e);
    return back("google_failed");
  }
}
