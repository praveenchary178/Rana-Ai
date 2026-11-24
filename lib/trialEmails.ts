// Emails around the ₹2,500 trial pack: HQ hears when someone starts checkout (so nobody who drops off is lost)
// and when they pay; the customer gets a "your trial is live" email with what to do first.
import { sendEmail, emailHtml, ownerEmails, APP_URL, esc } from "./notify";
import { hqEmails } from "./hq";
import { TRIAL_PACK, TRIAL_PACK_PRICE_LABEL as TRIAL_PACK_PRICE } from "./trialPack";

const hq = () => Array.from(new Set([...hqEmails(), "hello@ranaai.in"]));
const day = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

/** Someone filled the /trial form and went to pay. If they don't pay, this is HQ's lead to call. */
export async function trialCheckoutStarted(c: any, who: { name: string; email: string; phone: string }, payUrl: string | null) {
  await sendEmail({
    to: hq(), kind: "trial_checkout", clientId: c.id, subject: `💳 Trial pack checkout started: ${c.name}`,
    html: emailHtml({
      title: `${c.name} is paying for the ${TRIAL_PACK_PRICE} trial`,
      lines: [
        `${esc(who.name || "—")} · ${esc(who.email)} · <b>${esc(who.phone)}</b>`,
        "They were sent to Razorpay to pay. You'll get a second email the moment the payment goes through.",
        "No payment email within the hour? Call them — they wanted to try RANA.",
        ...(payUrl ? [`Their payment link: <a href="${esc(payUrl)}">${esc(payUrl)}</a>`] : []),
      ],
      button: { label: "Open RANA HQ", url: `${APP_URL()}/hq` },
    }),
  }).catch(() => {});
}

/** Paid: the trial is live. Customer gets their first steps; HQ gets the money alert. */
export async function trialStarted(c: any, inv: any, endsAt: string) {
  const ends = day(endsAt);
  await sendEmail({
    to: await ownerEmails(c.id, c.billing_email || c.login_email), kind: "trial_started", clientId: c.id,
    subject: "Your RANA AI trial is live",
    html: emailHtml({
      title: "Your RANA AI trial is live",
      lines: [
        `Thank you for choosing RANA AI. Your payment of ₹${Number(inv.total).toLocaleString("en-IN")} is received (invoice ${esc(inv.number)}).`,
        "Your workspace is open now, and nothing is charged after the trial.",
        "<b>What happens next:</b> our team calls you shortly to set up your AI employee on your script, prices and language. Then you test it yourself and put it on real calls.",
        "Want to start sooner? Call or WhatsApp us on +91 78997 93001.",
      ],
      button: { label: "Open RANA", url: `${APP_URL()}/` },
    }),
  }).catch(() => {});
  await sendEmail({
    to: hq(), kind: "trial_paid", clientId: c.id, subject: `💰 Trial pack paid: ${c.name} (₹${Number(inv.total).toLocaleString("en-IN")})`,
    html: emailHtml({
      title: `${c.name} paid for the trial pack`,
      lines: [
        `Invoice ${esc(inv.number)} · ₹${Number(inv.total).toLocaleString("en-IN")} · paid ${esc(inv.paid_via || "online")}`,
        `${esc(c.login_email || "")} · <b>${esc(c.contact_phone || "")}</b>`,
        `Their workspace is live now (no approval needed). Trial allowance: ${TRIAL_PACK.minutes} minutes until ${ends}.`,
        "Call them today and set up their AI employee on their script — the trial pack promises setup by our team.",
      ],
      button: { label: "Open RANA HQ", url: `${APP_URL()}/hq` },
    }),
  }).catch(() => {});
}
