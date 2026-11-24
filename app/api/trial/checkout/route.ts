export const runtime = "nodejs";
export const maxDuration = 30;
import { sb } from "@/lib/db";
import { hashPassword, createSessionCookie } from "@/lib/auth";
import { createUser, getUserByEmail, normaliseEmail, validEmail, tempPassword } from "@/lib/users";
import { audit } from "@/lib/audit";
import { createInvoice, trialItems } from "@/lib/billing";
import { razorpayConfigured } from "@/lib/razorpay";
import { trialCheckoutStarted } from "@/lib/trialEmails";
import { TRIAL_PACK } from "@/lib/trialPack";

const recent = new Map<string, number[]>();
const INDUSTRIES = ["edtech", "realestate", "hospitality", "saas", "other"];
const clip = (v: any, n: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, n);

/** Indian mobile → +91XXXXXXXXXX. */
function phoneOf(raw: string): string | null {
  const d = String(raw || "").replace(/\D/g, "");
  const local = d.length === 12 && d.startsWith("91") ? d.slice(2) : d.length === 11 && d.startsWith("0") ? d.slice(1) : d;
  return /^[6-9]\d{9}$/.test(local) ? `+91${local}` : null;
}

/**
 * POST { company, name, email, phone, password, industry?, source? } → the ₹2,500 trial pack.
 * Creates the workspace (pending: no calling until paid), signs the person in, and returns a Razorpay link.
 * Paying switches the trial on straight away (lib/billing markPaid, kind "trial") — no HQ approval.
 * Someone who started before and didn't pay gets their open payment link back instead of an error.
 */
export async function POST(req: Request) {
  if (!razorpayConfigured()) return Response.json({ error: "Online payment isn't available right now. Call +91 78997 93001 and we'll set up your trial." }, { status: 503 });
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "?";
  const hits = (recent.get(ip) || []).filter((t) => Date.now() - t < 3600e3);
  if (hits.length >= 5) return Response.json({ error: "Too many attempts from this network. Call +91 78997 93001 and we'll help." }, { status: 429 });
  const b = await req.json().catch(() => ({} as any));
  if (b.website) return Response.json({ ok: true }); // honeypot
  const company = clip(b.company, 80), name = clip(b.name, 80);
  const email = normaliseEmail(b.email);
  const phone = phoneOf(b.phone);
  const password = String(b.password || "");
  const sourceTag = String(b.source || "").replace(/[^\w.=&|-]/g, "").slice(0, 250);
  if (name.length < 2) return Response.json({ error: "Enter your name." }, { status: 400 });
  if (company.length < 2) return Response.json({ error: "Enter your business name." }, { status: 400 });
  if (!validEmail(email)) return Response.json({ error: "Enter a valid email — your login and invoice go there." }, { status: 400 });
  if (!phone) return Response.json({ error: "Enter a valid 10-digit Indian mobile number." }, { status: 400 });
  if (password.length < 8) return Response.json({ error: "Choose a password of at least 8 characters." }, { status: 400 });

  // Started before and didn't pay? Send them back to the same payment.
  const existing = await getUserByEmail(email);
  if (existing) {
    const [c] = (await sb<any[]>(`/clients?id=eq.${existing.client_id}&select=id,status&limit=1`).catch(() => [])) || [];
    const [open] = c ? (await sb<any[]>(`/invoices?client_id=eq.${c.id}&kind=eq.trial&status=eq.issued&rzp_link_url=not.is.null&order=created_at.desc&limit=1`).catch(() => [])) || [] : [];
    if (c?.status === "pending" && open) return Response.json({ ok: true, payUrl: open.rzp_link_url, resumed: true });
    return Response.json({ error: "That email already has a RANA login. Sign in, or call +91 78997 93001 and we'll add the trial pack to your account." }, { status: 409 });
  }
  const owned = await sb<any[]>(`/clients?login_email=eq.${encodeURIComponent(email)}&select=id&limit=1`).catch(() => []);
  if (owned?.length) return Response.json({ error: "That email already has a RANA workspace. Sign in instead." }, { status: 409 });
  hits.push(Date.now()); recent.set(ip, hits);

  const [client] = await sb<any[]>(`/clients`, {
    method: "POST",
    body: JSON.stringify({
      name: company, company_name: company, login_email: email, industry: INDUSTRIES.includes(b.industry) ? b.industry : "other",
      login_password: hashPassword(tempPassword() + tempPassword()), plan: "trial", status: "pending",
      signup_source: `web-trial-pack${sourceTag ? `|${sourceTag}` : ""}`, contact_phone: phone, market: "in",
      billing_name: company, billing_email: email, billing_phone: phone,
      hq_notes: `Bought the ₹${TRIAL_PACK.price} trial pack on the website: ${name} (${phone}).`,
    }),
  });
  const user = await createUser({ clientId: client.id, email, name, password, role: "owner", mustChange: false });
  await audit({ clientId: client.id, email, userId: user.id }, "user_invited", { req, detail: { signup: true, trialPack: true } });

  const origin = new URL(req.url).origin;
  const { invoice, linkError } = await createInvoice(client, {
    kind: "trial", items: trialItems(), createdBy: "trial-pack", origin, callbackPath: "/trial/done?invoice={id}",
    notes: `Trial pack: ${TRIAL_PACK.days} days, ${TRIAL_PACK.minutes} minutes. Starts when paid. No auto-renewal.`,
  });
  if (!invoice?.rzp_link_url) {
    console.error("[trial] payment link failed", linkError);
    return Response.json({ error: "We couldn't open the payment page. Please try again in a minute, or call +91 78997 93001." }, { status: 502 });
  }
  await trialCheckoutStarted(client, { name, email, phone }, invoice.rzp_link_url);

  // Signed in from here, so "Open RANA" works the moment they've paid.
  const headers = new Headers({ "Content-Type": "application/json" });
  headers.set("Set-Cookie", createSessionCookie(client.id, user.email, { userId: user.id, role: "owner", name: user.name }));
  return new Response(JSON.stringify({ ok: true, payUrl: invoice.rzp_link_url }), { status: 200, headers });
}
