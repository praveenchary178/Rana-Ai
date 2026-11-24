// What customers may see about price. Charan, 16 Nov 2026: the new pricing is being finalised, so the website,
// the client dashboard and the website voice agent show NO plans or amounts — only "starts from ₹3 per minute".
// Staff-only pages (HQ, CRM, finance) keep using the real price list in lib/pricing.
// Set SHOW_PRICES back to true (and restore the plan components from git history) when the new prices are ready.
export const SHOW_PRICES: boolean = false;
export const PRICE_FROM_PER_MIN = 3;
export const PRICE_FROM_LINE = `Starts from ₹${PRICE_FROM_PER_MIN} per minute`;
export const PRICE_ON_REQUEST = `Pricing starts from ₹${PRICE_FROM_PER_MIN} per minute. The right plan depends on your call volume — share your details and our team will reach out with it.`;
/** For visitors outside India (other currencies). */
export const PRICE_GLOBAL_LINE = "Simple per-minute pricing — our team shares the right plan for your country";
export const PRICE_SUPPORT_LINE = "For plans and pricing, contact our team at support@ranaai.in — pricing starts from ₹3 per minute.";
