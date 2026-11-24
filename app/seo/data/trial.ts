// /ai-calling-trial — the ₹2,500 trial pack. Keep it true: no minute counts or durations (owner's decision, 19 Nov 2026).
import type { SeoPageData } from "../types";
import { TRIAL_PACK_PATH, TRIAL_PACK_PRICE } from "@/lib/trialPack";
import { PRICE_FROM_LINE } from "@/lib/priceDisplay";

export const TRIAL: SeoPageData = {
  path: TRIAL_PACK_PATH, kind: "pricing", label: "₹2,500 trial pack",
  title: "AI Calling Trial Pack — Try RANA AI for ₹2,500",
  description: "Try an AI calling agent on your own business for ₹2,500. Our team sets up an AI employee on your script and language, and you test it on real calls.",
  h1: "Try RANA AI on your own calls for ₹2,500",
  eyebrow: "Trial pack · India",
  intro: "Not sure an AI can talk to your customers? Find out on your own business, not a canned demo. For a one-time ₹2,500, our team sets up an AI employee with your script, prices, FAQs and language. You put it on real calls — answering your phone or calling your leads — and see the recording, transcript and lead score of every call.",
  keywords: ["ai calling trial", "ai calling agent trial", "ai voice agent trial india", "try ai calling agent", "ai telecaller trial", "ai receptionist trial", "test ai calling for my business", "ai calling demo on my leads", "ai calling pack india", "ai voice agent price india"],
  facts: ["₹2,500 one-time", "Set up on your own script", "Telugu, Hindi, English + more", "Recordings & lead scores", "Pay by UPI or card"],
  offer: { name: "RANA AI trial pack", price: TRIAL_PACK_PRICE },
  sections: [
    { h2: "What you get in the trial pack", bullets: [
      "One AI employee, built by our team on your script, prices and FAQs",
      "Your customers' language: Telugu, Hindi, Tamil, Kannada, English and more — including mixed Hinglish and Tenglish",
      "Inbound, outbound or both: answer your business calls, or call your enquiries and old leads",
      "A recording, transcript, summary and hot / warm / cold score for every call",
      "Lead alerts on WhatsApp or email the moment a hot lead calls",
      "Script changes by our team as you watch the first calls come in",
    ] },
    { h2: "How it works", steps: [
      "Pay ₹2,500 online by UPI, card or netbanking. You get a GST invoice.",
      "Tell us how you handle calls today, or share your script. Our team writes and builds your AI employee.",
      "Call it yourself to test it, then switch it on for real calls or give it a list of leads to call.",
      "Watch the results in your dashboard: who called, what they wanted, and which leads are hot.",
      "Decide. Keep RANA on a monthly plan that fits your call volume, or stop — nothing renews automatically.",
    ] },
    { h2: "Why a paid trial instead of a free one", body: "Most free trials end the same way: you sign up, try to write a script yourself, get busy and never put it on a real call. With the trial pack our team does the setup on your actual script, so you quickly hear how your own customers react to it.\n\nThat setup is real work for us, so we charge a small one-time fee instead of giving away an empty account. If you only want to hear how the AI sounds first, you can talk to Rana on our website for free." },
    { h2: "Who the trial pack is for", bullets: [
      "Clinics and hospitals that miss calls during OPD hours or after closing",
      "Real estate teams with more leads than telecallers can call back the same day",
      "Coaching institutes and schools following up admission enquiries",
      "Shops, farm-produce and food businesses taking phone orders",
      "Travel agencies and hotels answering booking calls late at night",
    ] },
    { h2: "What businesses see with RANA", body: "AN Farms, a poultry business in Hyderabad, had 1,837 calls answered in 17 days, with 85 orders booked by the AI and 309 calls coming in before 9 AM or after 8 PM. The Fashion House, a clothing store, had 350 calls in 8 days, most of them price, size and stock questions the AI answered without staff picking up. See the full numbers on our customer results page." },
    { h2: "Trial pack vs testing with a new telecaller", table: { head: ["", "Hire a telecaller to test", "RANA trial pack"], rows: [["Cost", "₹15,000–25,000 a month + incentives", "₹2,500 one-time"], ["Hours", "~8 hours, 6 days a week", "24×7"], ["Calls at once", "1", "Several at once"], ["Languages", "1–2", "11 Indian languages + English"], ["Record of every call", "Notes, if any", "Recording, transcript and lead score"]], note: "Telecaller salaries are typical ranges in Indian metros." } },
  ],
  faqs: [
    { q: "How much does the RANA AI trial cost?", a: "₹2,500, paid once. GST is added where applicable, and you get a GST invoice." },
    { q: "Is there a free trial?", a: "No. Instead of an empty free account, the ₹2,500 trial pack includes setup by our team on your own script. You can still talk to Rana on our website for free to hear how it sounds." },
    { q: "Is the ₹2,500 adjusted in my monthly plan?", a: "No. The trial pack is a separate one-time payment for testing RANA on your business." },
    { q: "What happens after the trial?", a: `If you want to continue, our team suggests the monthly plan that fits your call volume — ${PRICE_FROM_LINE.toLowerCase()}. If you don't, nothing renews and you aren't charged again.` },
    { q: "Can it answer calls on my existing business number?", a: "Yes. You can forward your existing number to your AI employee, so customers keep calling the number they know." },
    { q: "Which languages can I test?", a: "11 Indian languages including Telugu, Hindi, Tamil, Kannada, Malayalam, Marathi and Bengali, plus English, Spanish, French and Japanese. Callers can mix languages in one sentence." },
    { q: "Do I need to write the script myself?", a: "No. Tell us how you handle calls today — what customers ask, your prices, your offers — and our team writes the script and builds the AI employee." },
    { q: "How do I pay?", a: "Online by UPI, card or netbanking through Razorpay. Your trial setup starts after the payment goes through." },
  ],
  related: ["/pricing", "/customer-results", "/ai-calling-agent", "/ai-receptionist", "/telugu-ai-voice-agent", "/compare/ai-vs-human-telecaller"],
  updated: "2026-11-19",
};
