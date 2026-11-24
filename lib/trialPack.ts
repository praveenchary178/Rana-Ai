// The paid trial pack shown on the website. Charan, 19 Nov 2026: ₹2,500 one-time, replaces the free trial,
// not adjusted against a later plan; no minute count or duration is shown publicly.
// Internally the pack switches on the trial plan's allowance (PLANS.trial in lib/pricing) the moment it's paid.
import { PLANS, TRIAL_DAYS, TRIAL_MINUTES } from "./pricing";

export const TRIAL_PACK_PRICE = 2500;
export const TRIAL_PACK_PRICE_LABEL = "₹2,500";
/** SEO landing page for the pack (app/seo/data/trial.ts). */
export const TRIAL_PACK_PATH = "/ai-calling-trial";
/** Where people pay: RANA's own checkout (/trial → Razorpay → trial switched on automatically). */
export const TRIAL_CHECKOUT_PATH = "/trial";
/** Kept for older imports: an external Razorpay Payment Page, if one is ever preferred over /trial. Empty = use /trial. */
export const TRIAL_PACK_PAY_URL = "";
export const trialPayHref = (from: string) => TRIAL_PACK_PAY_URL || `${TRIAL_CHECKOUT_PATH}?from=${encodeURIComponent(from)}`;

/** Internal allowance (billing and in-app only — never printed on public pages). */
export const TRIAL_PACK = {
  price: TRIAL_PACK_PRICE,
  minutes: TRIAL_MINUTES,
  days: TRIAL_DAYS,
  employees: PLANS.trial.employees,
} as const;

/** One line, used on every promo. */
export const TRIAL_PACK_LINE = "One-time · set up on your script · no auto-renewal";

/** What's in the pack, worded once for the homepage and /trial (same promises as /ai-calling-trial). */
export const TRIAL_PACK_INCLUDES: [string, string][] = [
  ["Your own AI employee", "Built by our team on your script, prices and FAQs."],
  ["Real calls, not a demo", "Answer your business calls, call your enquiries, or both."],
  ["Your customers' language", "Telugu, Hindi, Tamil, Kannada, English and more, mixed in one sentence."],
  ["Every call recorded and scored", "Recording, transcript, summary and hot / warm / cold lead score."],
  ["Lead alerts", "WhatsApp or email the moment a hot lead calls."],
  ["No auto-renewal", "Pay once. Continue on a plan only if it works for you."],
];
