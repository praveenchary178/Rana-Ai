// Facts about RANA AI reused across SEO pages — kept in one place so every page says the same true thing.
// Charan, 16 Nov 2026: no plan prices on public pages, only "starts from ₹3 per minute" (lib/priceDisplay).
import { PRICE_FROM_LINE } from "@/lib/priceDisplay";

export const INDIAN_LANGS = ["Telugu", "Hindi", "Tamil", "Kannada", "Malayalam", "Marathi", "Bengali", "Gujarati", "Punjabi", "Odia", "English"];
export const LANGS_SENTENCE = "Telugu, Hindi, Tamil, Kannada, Malayalam, Marathi, Bengali, Gujarati, Punjabi, Odia and English — plus Spanish, French and Japanese for callers abroad";
export const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
export const TRIAL_LINE = "Free demo on your own script";
export const ENTRY_LINE = `${PRICE_FROM_LINE}, billed in 30-second pulses`;
export const RANA_PRICE_LINE = "From ₹3 per minute — our team shares the right plan for your call volume";

/** What every RANA AI voice agent does — a shared checklist for solution pages. */
export const CORE_FEATURES = [
  "Answers inbound calls on your Indian business number, 24×7 — no missed calls, no hold music",
  "Calls your lead lists (bulk campaigns from a CSV or your CRM) and follows up automatically",
  `Speaks ${LANGS_SENTENCE}, and switches when the caller does`,
  "Qualifies every caller and tags them hot / warm / cold with a one-line reason",
  "Sends the lead card to your team on WhatsApp, Slack, email or a webhook the moment the call ends",
  "Books appointments and site visits, and hands the call to a person when it should",
  "Every call recorded, transcribed and searchable — with a live Mission control view",
  "Respects your do-not-call list and calling hours",
];

export const TRUST_FAQS: { q: string; a: string }[] = [
  { q: "How quickly can we go live?", a: `Usually within a few days: we set up your AI employee with your script, prices, FAQs and languages, you test it by talking to it in your browser, and then we connect your number. Start with a free demo on your own script.` },
  { q: "What does it cost?", a: `Pricing starts from ₹3 per minute, billed in 30-second pulses. The exact plan depends on your call volume — book a demo and our team will reach out with the right plan.` },
  { q: "Will callers know they are talking to an AI?", a: "The agent introduces itself by the name you choose and speaks naturally, with natural pauses and interruptions. We recommend being open that it is an AI assistant — callers care far more that they got a quick, correct answer than who gave it." },
];
