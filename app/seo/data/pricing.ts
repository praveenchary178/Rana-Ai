// /pricing — indexable price page. Charan, 16 Nov 2026: plans and amounts hidden while the new pricing is
// finalised; only "starts from ₹3 per minute" is shown (lib/priceDisplay).
import type { SeoPageData } from "../types";
import { PRICE_FROM_LINE } from "@/lib/priceDisplay";

export const PRICING: SeoPageData = {
  path: "/pricing", kind: "pricing", label: "Pricing",
  title: "AI Calling Pricing in India — Starts from ₹3 per Minute",
  description: "RANA AI pricing: AI calling in India starts from ₹3 per minute, with 30-second billing and no charge for unanswered calls. Share your call volume and our team suggests the right plan.",
  h1: "AI calling agent pricing — starts from ₹3 per minute",
  eyebrow: "Pricing · India",
  intro: "RANA AI pricing starts from ₹3 per minute of connected talk time. Every plan includes both voice engines, the dashboard, recordings and lead alerts. The right plan depends on your call volume, so book a free demo and our team will suggest the one that fits — and set it up on your own script.",
  keywords: ["ai calling pricing", "ai calling agent pricing", "ai calling agent price", "ai calling agent price in india", "ai voice agent price india", "ai telecaller cost", "ai calling cost per minute india", "ai receptionist price", "how much does ai calling cost"],
  facts: [PRICE_FROM_LINE, "30-second billing pulses", "Both voice engines included", "Free demo"],
  sections: [
    { h2: "What's included", bullets: ["Inbound answering and outbound campaigns", "11 Indian languages + Spanish, French, Japanese", "Recordings, transcripts and hot / warm / cold lead scores for every call", "Lead alerts on WhatsApp, Slack, email or webhook", "Mission control live view and reports export", "Do-not-call list and calling-hour controls", "Setup help from our team"] },
    { h2: "How pricing works", body: "Pricing starts from ₹3 per minute. The right plan depends on how many calls you answer and make each month, how many AI employees you need and how many calls should run at the same time — so our team looks at your call volume and suggests the plan that fits.\n\nCalls that don't connect (no answer, busy, switched off) don't use minutes, and billing is in 30-second pulses, so short calls stay cheap." },
    { h2: "Compare with a telecaller", table: { head: ["", "One telecaller", "RANA AI"], rows: [["Cost", "₹15,000–25,000 a month + incentives", "From ₹3 per minute"], ["Hours", "~8 hours, 6 days a week", "24×7"], ["Calls at once", "1", "Several at once"], ["Languages", "1–2", "14"]], note: "Telecaller salaries are typical ranges in Indian metros." } },
  ],
  faqs: [
    { q: "How much does an AI calling agent cost in India?", a: "With RANA AI, pricing starts from ₹3 per minute. The exact plan depends on your call volume — book a demo or share your number and our team will reach out with the right plan." },
    { q: "Is there a setup fee?", a: "Our team builds and tests your AI employee with your script, FAQs and languages. They'll explain everything that's included when they share your plan." },
    { q: "What happens if I need more minutes?", a: "Calls never stop mid-campaign — you can top up or move to a bigger plan any time. Our team will help you pick the right size." },
    { q: "Do unanswered calls use minutes?", a: "No — only connected talk time counts, billed in 30-second pulses." },
    { q: "Can I pay monthly and cancel any time?", a: "Yes. Plans are monthly. See our refund policy for details." },
    { q: "Do you have international pricing?", a: "Yes — tell us where your callers are and our team will share pricing in your currency." },
  ],
  related: ["/compare/ai-vs-human-telecaller", "/blog/telecaller-vs-ai-calling-cost-india", "/tools/ai-calling-cost-calculator", "/vapi-alternative-india", "/ai-calling-agent", "/ai-receptionist"],
};
