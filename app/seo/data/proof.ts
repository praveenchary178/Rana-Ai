// Real results from RANA AI customers, taken from our own call records (Supabase `calls` and `an_farms_orders`).
// The customers named here agreed to be named. Re-run the queries before changing a number, and never round up.
import type { SeoPageData } from "../types";
import { TRUST_FAQS } from "./shared";

export const PROOF_CHECKED = "13 November 2026";

export const PROOF = {
  anFarms: { name: "AN Farms", what: "a poultry farm delivering country chicken (natu kodi) and eggs across Hyderabad", from: "28 October", to: "13 November 2026", days: 17, calls: 1837, callers: 1407, orders: 85, afterHours: 309, busiestDay: 187 },
  fashionHouse: { name: "The Fashion House", what: "a clothing store in Boduppal, Hyderabad", from: "7 October", to: "14 October 2026", days: 8, calls: 350, callers: 296, enquiries: 249, afterHours: 53, busiestDay: 100 },
  svr: { name: "SVR Travels", what: "a travel agency handling bus, flight, hotel and tour bookings", from: "27 October", to: "13 November 2026", days: 18, calls: 162, callers: 67, afterHours: 41 },
};

const n = (x: number) => x.toLocaleString("en-IN");
const share = (part: number, whole: number) => `${Math.round((part / whole) * 100)}%`;
const a = PROOF.anFarms, f = PROOF.fashionHouse, s = PROOF.svr;
const SRC = `(From RANA AI's call records, checked ${PROOF_CHECKED}.)`;

/** One-paragraph versions for industry and comparison pages. */
export const PROOF_TEXT = {
  anFarms: `${a.name}, ${a.what}, uses RANA AI on its order line. From ${a.from} to ${a.to} it answered ${n(a.calls)} calls from ${n(a.callers)} different callers and booked ${a.orders} orders by itself. ${n(a.afterHours)} of those calls (${share(a.afterHours, a.calls)}) came before 9 AM or after 8 PM, and on its busiest day it handled ${a.busiestDay} calls. ${SRC}`,
  fashionHouse: `${f.name}, ${f.what}, uses RANA AI to answer shoppers' calls. Over ${f.days} days (${f.from} – ${f.to}) it answered ${f.calls} calls from ${f.callers} different callers; ${f.enquiries} of them were questions about prices, sizes, stock and the store's location. On the busiest day it took ${f.busiestDay} calls. ${SRC}`,
  svr: `${s.name}, ${s.what}, uses RANA AI to answer its phone line. From ${s.from} to ${s.to} it answered ${s.calls} calls from ${s.callers} different callers, and ${share(s.afterHours, s.calls)} of them came before 9 AM or after 8 PM. ${SRC}`,
};

const TOTAL = a.calls + f.calls + s.calls;

export const CUSTOMER_RESULTS: SeoPageData = {
  path: "/customer-results", kind: "solution", label: "Customer results",
  title: "RANA AI Customer Results — Real Call Numbers",
  description: `Real results from RANA AI customers in Hyderabad: ${a.name} answered ${n(a.calls)} calls and booked ${a.orders} orders by AI in ${a.days} days. Numbers taken from our call records.`,
  h1: "Customer results: real numbers from real businesses",
  eyebrow: `Customers · Checked ${PROOF_CHECKED}`,
  intro: "These numbers come straight from our call records, not from surveys or estimates, for the dates shown. They count every call the AI answered — including very short calls and callers who hung up straight away — so nothing is rounded up.",
  keywords: ["rana ai reviews", "rana ai customers", "ai voice agent case study india", "ai calling results india", "ai receptionist case study", "ai phone ordering case study"],
  facts: [`${n(TOTAL)} calls answered`, `${a.orders} orders booked by AI`, "Telugu · Hindi · English", "From our own call logs"],
  demo: "booking",
  updated: "2026-11-14",
  sections: [
    { h2: `${a.name}: phone orders for a poultry farm`, body: `${a.name} is ${a.what}. Customers call to order country chicken and eggs, ask today's price and check whether delivery reaches their area. RANA AI answers that order line, quotes the price, checks the delivery area and day, and books the order, which reaches the farm team straight away.`, table: { head: ["Measure", "Result"], rows: [
      ["Period", `${a.from} – ${a.to} (${a.days} days)`],
      ["Calls answered", n(a.calls)],
      ["Different callers", n(a.callers)],
      ["Orders booked by the AI", String(a.orders)],
      ["Calls before 9 AM or after 8 PM", `${n(a.afterHours)} (${share(a.afterHours, a.calls)})`],
      ["Busiest single day", `${a.busiestDay} calls`],
    ] } },
    { h2: `${f.name}: shoppers' calls for a clothing store`, body: `${f.name} is ${f.what}. Shoppers call before they visit to ask about prices, sizes and what's in stock, and for the store's location and timings. RANA AI answers those calls so the staff can look after the customers already in the store.`, table: { head: ["Measure", "Result"], rows: [
      ["Period", `${f.from} – ${f.to} (${f.days} days)`],
      ["Calls answered", n(f.calls)],
      ["Different callers", n(f.callers)],
      ["Price, size, stock and location questions handled", String(f.enquiries)],
      ["Calls before 9 AM or after 8 PM", `${f.afterHours} (${share(f.afterHours, f.calls)})`],
      ["Busiest single day", `${f.busiestDay} calls`],
    ] } },
    { h2: `${s.name}: a travel agency's phone line`, body: `${s.name} is ${s.what}. Travellers call about new trips and about bookings they already have. RANA AI answers the line, takes the details and passes each enquiry to the team.`, table: { head: ["Measure", "Result"], rows: [
      ["Period", `${s.from} – ${s.to} (${s.days} days)`],
      ["Calls answered", n(s.calls)],
      ["Different callers", n(s.callers)],
      ["Calls before 9 AM or after 8 PM", `${s.afterHours} (${share(s.afterHours, s.calls)})`],
    ] } },
    { h2: "How we count", bullets: [
      "Calls answered: every inbound call the AI picked up, including very short and silent calls",
      "Different callers: unique phone numbers",
      "Before 9 AM or after 8 PM: calls received outside those hours, India time",
      "Orders booked: orders the AI created during the call, in the customer's order book",
      "We add customers as they go live, and we never round a number up",
    ] },
  ],
  faqs: [
    { q: "Are these real customers?", a: "Yes. Each business agreed to be named here, and every number comes from RANA AI's own call records for the dates shown." },
    { q: "Can I speak to one of these customers?", a: "Ask on your demo call and we'll check whether they're happy to take a call from you." },
    ...TRUST_FAQS.slice(0, 1),
  ],
  related: ["/industries/poultry-farm-produce", "/industries/fashion-clothing-stores", "/industries/travel-agencies", "/telugu-ai-voice-agent", "/pricing"],
};
