// /best-ai-voice-agents-india (the buyer's guide) and "<Indian rival> alternative" pages.
// Competitor facts come only from their own pages, or — where marked — a named third-party comparison, each dated.
// We make RANA AI: the guide says so, and says plainly where another product is the better choice.
// Charan, 16 Nov 2026: RANA's own price is shown only as "from ₹3 per minute" (lib/priceDisplay).
import type { SeoPageData } from "../types";
import { TRUST_FAQS, TRIAL_LINE } from "./shared";
import { PROOF, PROOF_TEXT } from "./proof";

const NOV = "14 November 2026";
const SEP = "30 September 2026";
const SRC = {
  ringg: { label: "Ringg AI pricing", url: "https://www.ringg.ai/pricing" },
  bolna: { label: "Bolna pricing", url: "https://www.bolna.ai/pricing" },
  vapi: { label: "Vapi pricing", url: "https://vapi.ai/pricing" },
  retell: { label: "Retell AI pricing", url: "https://www.retellai.com/pricing" },
  bland: { label: "Bland AI pricing", url: "https://www.bland.ai/pricing" },
  myoperator: { label: "MyOperator — Top 10 Voice AI Agents in India (2026)", url: "https://myoperator.com/blog/top-10-voice-ai-agents-india-2026" },
  squadstack: { label: "SquadStack — Top AI agent companies in India", url: "https://www.squadstack.ai/voicebot/top-ai-agent-companies-in-india" },
};
const RANA_PRICE = "From ₹3 per minute; our team shares the right plan for your call volume; GST invoice";
const RANA_LANGS = "Telugu, Hindi, Tamil, Kannada, Malayalam, Marathi, Bengali, Gujarati, Punjabi, Odia + English";
const a = PROOF.anFarms;

type V = { name: string; type: string; bestFor: string; price: string; checked: string; setup: string; body: string; watch: string };

const VENDORS: V[] = [
  { name: "RANA AI (ours)", type: "Done-for-you AI calling employee (India)", bestFor: "Small and mid-sized Indian businesses that want calls answered and leads called without building anything", price: RANA_PRICE, checked: NOV, setup: "Done by our team",
    body: `RANA AI is a finished AI calling employee rather than a toolkit. Our team in Hyderabad sets it up with your script, prices and FAQs; it answers your calls and calls your leads in Telugu, Hindi, Tamil and 8 more languages, and sends every lead to WhatsApp with a hot, warm or cold score. For ${a.name}, a poultry farm in Hyderabad, it answered ${a.calls.toLocaleString("en-IN")} calls in ${a.days} days and booked ${a.orders} orders by itself.`,
    watch: "Not built for developers who want to build their own voice product, and there's no self-serve sign-up: our team sets up every account and shares the plan for your volume." },
  { name: "Ringg AI", type: "Voice AI platform, self-serve and enterprise (India)", bestFor: "High call volumes at a low all-in price per minute", price: "₹6 per connected minute, telephony included; number ₹499/month; 2 calls at once included", checked: NOV, setup: "No-code builder; enterprise help on request",
    body: "Ringg AI is an Indian voice AI platform with a no-code agent builder and one rate per connected minute that covers speech, voice, the language model and telephony. It also sells chat, WhatsApp and browser agents. Ringg has announced a $15 million Series A led by Peak XV.",
    watch: "Two calls at once are included; more capacity is sold in blocks of five (₹1,995 per block). You or your team build and look after the agents." },
  { name: "Bolna", type: "Developer voice AI platform (India)", bestFor: "Developers and agencies building voice agents for Indian callers", price: "From 6¢ (₹5.52) a minute, about 4.5¢ with larger top-ups; platform fee and telephony added per minute", checked: NOV, setup: "You build",
    body: "Bolna is an Indian platform for building voice agents, popular with developers and agencies. You assemble the agent — prompts, speech and voice providers, telephony — and can bring your own keys. New accounts get $5 of free credits, and there are prepaid pilot plans for larger tests.",
    watch: "The listed per-minute rate doesn't include the platform fee and telephony, so add those when you compare. You need someone technical to build and maintain the agent." },
  { name: "MyOperator", type: "Cloud telephony with AI voice agents (India)", bestFor: "Businesses that want numbers, IVR, call tracking and AI voice from one vendor", price: "Custom quote with managed onboarding (per MyOperator, Nov 2026)", checked: NOV, setup: "Managed onboarding",
    body: "MyOperator is an established Indian cloud telephony company — virtual numbers, IVR, call management and WhatsApp — that now offers AI voice agents on top. It's a natural choice if your phone system already runs on MyOperator.",
    watch: "No public price for the AI voice agent; ask for a written quote at your call volume." },
  { name: "SquadStack", type: "AI plus managed human telecalling (India)", bestFor: "Large sales and support programmes that want AI and a managed calling team", price: "Custom, based on requirements, call volume and modules (per SquadStack)", checked: NOV, setup: "Managed by SquadStack",
    body: "SquadStack combines AI voice agents with a managed team of human telecallers and analytics, and works mainly with large consumer brands, lenders and insurers.",
    watch: "Built for large volumes; a small business may find it more than it needs." },
  { name: "Gnani.ai", type: "Enterprise conversational AI (India)", bestFor: "Large enterprises such as banks and insurers running contact centres", price: "No public price list; quote on request", checked: NOV, setup: "Enterprise project",
    body: "Gnani.ai is an Indian conversational AI company that builds its own speech technology for Indian languages and works mostly with large enterprises.",
    watch: "Enterprise sales process and pricing; not self-serve for small businesses." },
  { name: "Jio Haptik", type: "Enterprise chat and voice AI (India)", bestFor: "Large brands that want WhatsApp, chat and voice assistants from one enterprise vendor", price: "Quote on request (usage-based)", checked: NOV, setup: "Enterprise project",
    body: "Haptik, part of Jio, is best known for chat and WhatsApp assistants for large Indian brands, and also offers voice agents.",
    watch: "Enterprise-focused, and voice is one channel among many." },
  { name: "Vapi", type: "Developer voice AI platform (global)", bestFor: "Developers building voice products who want to choose every model and provider", price: "$0.05/min platform fee plus speech, model, voice and telephony costs", checked: SEP, setup: "You build",
    body: "Vapi is a widely used developer platform for voice agents. You choose and swap every model and provider, and pay a platform fee plus what those providers charge.",
    watch: "Total cost depends on the providers you pick; for a business that just needs calls handled it's usually more than you need." },
  { name: "Retell AI", type: "Developer voice AI platform (global)", bestFor: "Engineering teams that want a well-documented voice-agent API", price: "Pay-as-you-go, about $0.07–0.31/min depending on model and voice, plus numbers and add-ons", checked: SEP, setup: "You build",
    body: "Retell AI offers a clean API and dashboard for building voice agents, priced per minute by the model and voice you choose. Strong for engineering teams serving mostly English-speaking callers.",
    watch: "Billed in dollars; test Indian-language quality on your own calls." },
  { name: "Bland AI", type: "Phone automation platform (global)", bestFor: "Very large outbound programmes, mostly in the US", price: "From $0.14/min (Start), or $0.12/min with a $299/month platform fee (Build)", checked: SEP, setup: "You build or enterprise",
    body: "Bland AI focuses on high-volume phone automation with one per-minute dollar rate and enterprise options.",
    watch: "US-centric; check language support for your callers." },
];

export const GUIDE: SeoPageData = {
  path: "/best-ai-voice-agents-india", kind: "compare", label: "Best AI voice agents in India",
  title: "Best AI Voice Agents in India (2026): 10 Compared",
  description: "The 10 best AI voice agents and AI calling agents in India for 2026 — RANA AI, Ringg, Bolna, MyOperator, SquadStack, Gnani, Haptik, Vapi, Retell and Bland: prices, setup and who each suits.",
  h1: "Best AI voice agents in India (2026): 10 platforms compared",
  eyebrow: `Buyer's guide · Updated ${NOV}`,
  intro: "We make RANA AI, so read this knowing that. We've tried to write the guide we'd want if we were buying: ten platforms Indian businesses actually compare, prices taken from each company's own pricing page where it publishes one, and clear notes on where someone else is the better choice.",
  keywords: ["best ai voice agent india", "best ai calling agent india", "ai voice agents in india", "top ai voice agents india 2026", "ai voice agent companies in india", "ai calling agent india", "voice ai companies india", "best ai voice agents", "cheapest ai calling agent india"],
  facts: ["10 platforms compared", "Prices from their own sites", `Updated ${NOV}`],
  checked: NOV,
  updated: "2026-11-14",
  sources: [SRC.ringg, SRC.bolna, SRC.vapi, SRC.retell, SRC.bland, SRC.myoperator, SRC.squadstack],
  demo: "qualify",
  sections: [
    { h2: "Key takeaways", bullets: [
      "Listed per-minute prices from Indian self-serve platforms: Bolna from ₹5.52 (before platform and telephony fees) and Ringg at ₹6 per connected minute with telephony included; RANA AI starts from ₹3 per minute, set up by our team",
      "If you have developers, a build-it-yourself platform (Bolna in India; Vapi or Retell globally) gives you the most control",
      "If you want numbers, IVR and AI from one vendor, look at MyOperator; for AI plus a managed human calling team, SquadStack",
      "Large banks and insurers usually shortlist enterprise vendors such as Gnani.ai and Jio Haptik",
      "If you're a small or mid-sized business that wants it set up for you in Telugu, Hindi or another Indian language, RANA AI is built for exactly that",
    ] },
    { h2: "Quick comparison", table: { head: ["Platform", "Type", "Best for", "Public pricing", "Setup"], rows: VENDORS.map((v) => [v.name, v.type, v.bestFor, v.price, v.setup]), note: `Prices from each company's own pricing page (Ringg, Bolna: ${NOV}; Vapi, Retell, Bland: ${SEP}). Where a company publishes no price, we say so and cite where the description comes from. Prices change often — check before you buy.` } },
    { h2: "How we compared them", bullets: [
      "Prices only from each company's own pricing page, with the date we checked; where there's no public price we say so",
      "We describe what each product is built for, not marketing claims about voice quality or speed",
      "We haven't run our own latency or accuracy tests on competitors — test every shortlisted product on your own calls, in your customers' languages",
    ] },
    ...VENDORS.map((v, i) => ({ h2: `${i + 1}. ${v.name} — best for ${v.bestFor.charAt(0).toLowerCase()}${v.bestFor.slice(1)}`, body: `${v.body}\n\nWatch out for: ${v.watch}` })),
    { h2: "Price per minute vs total cost", body: "Ringg lists ₹6 per connected minute with telephony included, and Bolna from about ₹5.5 before its platform and telephony fees. RANA AI pricing starts from ₹3 per minute, and our team shares the exact plan for your call volume.\n\nHeadline rates are only part of the cost. Count the work too: writing and testing the script in your customers' languages, connecting your numbers and lead sources, reading transcripts and fixing what callers trip over. With RANA AI our team does that for you. A fair test: take one real month of calls and add up every cost for each option, including people's time." },
    { h2: "Which one should you pick?", table: { head: ["If you are…", "Shortlist"], rows: [
      ["A developer or agency building agents for Indian callers", "Bolna, Ringg"],
      ["A developer building a global voice product", "Vapi, Retell AI"],
      ["A business that wants a self-serve no-code builder", "Ringg, Bolna"],
      ["A business that wants numbers, IVR and AI from one vendor", "MyOperator"],
      ["A large brand or lender wanting AI plus a managed human team", "SquadStack"],
      ["A bank, insurer or large contact centre", "Gnani.ai, Jio Haptik"],
      ["A small or mid-sized business that wants it set up for you, in Indian languages", "RANA AI"],
    ] } },
    { h2: "How to choose: 7 questions to ask any vendor", steps: [
      "Can I hear it on a real call in my customers' language — including mixed Telugu–English or Hindi–English?",
      "What exactly is included in the price: speech, voice, model, telephony, numbers, calls at once, support?",
      "Will it run on an Indian number, and can calls to my existing number be forwarded to it?",
      "Who builds and maintains the script — me, my developer, or the vendor?",
      "What do I get after each call: recording, transcript, lead score, CRM or WhatsApp push?",
      "How does it follow TRAI rules for promotional calls (consent, DND, registered numbers, calling hours)?",
      "Is billing in rupees with a GST invoice, and can I cancel monthly?",
    ] },
  ],
  faqs: [
    { q: "Which is the best AI voice agent in India?", a: "It depends on who you are. Developers usually pick Bolna, Vapi or Retell AI; businesses that want a self-serve builder look at Ringg or Bolna; large enterprises look at Gnani.ai, Jio Haptik or SquadStack; small and mid-sized businesses that want it set up for them in Indian languages choose RANA AI." },
    { q: "Which is the cheapest AI calling agent in India?", a: `On listed per-minute rates (checked ${NOV}): Bolna from ₹5.52 a minute before its platform and telephony fees, and Ringg at ₹6 per connected minute with telephony included. RANA AI pricing starts from ₹3 per minute, with setup by our team; the exact plan depends on your call volume.` },
    { q: "Which AI voice agent supports Telugu, Hindi and Tamil?", a: `RANA AI has ${RANA_LANGS} built in and follows the caller when they switch. Most other platforms support Indian languages through the speech and voice providers they use — test each on real calls in your language.` },
    { q: "Do I need DLT registration to use an AI calling agent?", a: "For promotional calls, yes — the same TRAI rules apply whether a person or an AI makes the call. Service calls to your own customers follow different rules. See our DLT registration and TCCCPR pages, and confirm your case with your telecom provider." },
    ...TRUST_FAQS.slice(0, 1),
  ],
  related: ["/ringg-ai-alternative", "/myoperator-alternative", "/squadstack-alternative", "/compare/rana-ai-vs-bolna", "/vapi-alternative-india", "/customer-results", "/pricing"],
};

type R = { name: string; slug: string; src: { label: string; url: string }; what: string; price: string; setup: string; script: string; betterFor: string[] };

function rival(r: R): SeoPageData {
  const path = `/${r.slug}-alternative`;
  return {
    path, kind: "compare", label: `${r.name} alternative`,
    title: `${r.name} Alternative in India — Done-for-You AI Calling`,
    description: `Comparing ${r.name} with RANA AI? RANA is a done-for-you AI calling agent for Indian businesses: set up by our team, Telugu, Hindi, Tamil and 8 more languages, pricing from ₹3 per minute.`,
    h1: `${r.name} alternative: RANA AI vs ${r.name}`,
    eyebrow: `${r.name} alternative · India`,
    intro: `${r.name} is ${r.what}. It's a strong product, and for some businesses the better choice — we say which below. RANA AI differs in one main way: our team sets up and looks after your AI calling employee, so you don't build anything. Here's an honest comparison, using ${r.name}'s public information as of ${NOV}.`,
    keywords: [`${r.name.toLowerCase()} alternative`, `${r.name.toLowerCase()} alternatives`, `${r.name.toLowerCase()} competitors`, `${r.name.toLowerCase()} vs rana ai`, `${r.name.toLowerCase()} pricing`, `${r.name.toLowerCase()} review`],
    facts: ["Done-for-you setup", "₹ billing + GST invoice", "Real customer results", TRIAL_LINE],
    checked: NOV,
    updated: "2026-11-14",
    sources: [r.src],
    demo: "qualify",
    sections: [
      { h2: `${r.name} vs RANA AI at a glance`, table: { head: ["", r.name, "RANA AI"], rows: [
        ["What it is", r.what.charAt(0).toUpperCase() + r.what.slice(1), "A ready-made AI calling employee, set up and looked after by our team"],
        ["Pricing (public)", r.price, RANA_PRICE],
        ["Setup", r.setup, "Done by our team"],
        ["Who writes and improves your script", r.script, "Our team, with you"],
        ["Indian languages", `Check ${r.name} for your languages`, RANA_LANGS],
        ["After every call", `Check ${r.name}'s plan`, "Recording, transcript, hot/warm/cold score and a lead card on WhatsApp, Slack or email"],
      ], note: `${r.name} details from ${r.src.url} on ${NOV}. Prices and features change — check their site.` } },
      { h2: `When ${r.name} is the better choice`, bullets: r.betterFor },
      { h2: "When RANA AI is the better choice", bullets: [
        "You're a small or mid-sized business and want it working this week, without building anything",
        "Your callers speak Telugu, Hindi, Tamil or another Indian language — often mixed with English",
        "You want simple pricing in rupees, from ₹3 per minute, with a GST invoice",
        "You want a team in Hyderabad who set it up, read your calls with you and keep improving the script",
      ] },
      { h2: "A real result", body: `${PROOF_TEXT.anFarms}\n\nSee more on our customer results page.` },
      { h2: `Switching from ${r.name}`, steps: [`Tell us what your ${r.name} agent does today (or share its script).`, "We rebuild it as a RANA AI employee in your languages.", "You call it from your browser and compare it on real questions.", "Point your number to RANA AI when you're happy."] },
    ],
    faqs: [
      { q: `Is RANA AI cheaper than ${r.name}?`, a: "RANA AI pricing starts from ₹3 per minute, with setup and script work by our team included; the exact plan depends on your call volume. Compare one real month of calls on both, including the time your team would spend building and maintaining the agent." },
      { q: `Is RANA AI built on ${r.name}?`, a: "No. RANA AI runs its own platform with two voice engines, R1 and R2, tuned for Indian languages and Indian phone numbers." },
      ...TRUST_FAQS.slice(0, 1),
    ],
    related: ["/best-ai-voice-agents-india", "/ringg-ai-alternative", "/myoperator-alternative", "/squadstack-alternative", "/customer-results", "/pricing"].filter((p) => p !== path),
  };
}

export const RIVALS: SeoPageData[] = [
  rival({ name: "Ringg AI", slug: "ringg-ai", src: SRC.ringg, what: "an Indian voice AI platform with a no-code agent builder and one all-in price per minute", price: "₹6 per connected minute with telephony included; number ₹499/month; 2 calls at once included, +5 for ₹1,995", setup: "Self-serve no-code builder; enterprise help on request", script: "You or your team",
    betterFor: ["You want a self-serve, no-code builder with one all-in listed rate (₹6 per connected minute with telephony included)", "You have someone who will build, test and maintain agents in a no-code builder", "You also want chat, WhatsApp or browser agents from the same vendor", "You run very high volumes and want an enterprise contract with a well-funded vendor"] }),
  rival({ name: "MyOperator", slug: "myoperator", src: SRC.myoperator, what: "an Indian cloud telephony company (virtual numbers, IVR, call management) that now offers AI voice agents", price: "Custom quote with managed onboarding (per MyOperator, Nov 2026)", setup: "Managed onboarding by MyOperator", script: "Set up with MyOperator's team",
    betterFor: ["You want virtual numbers, IVR, call tracking and AI voice agents from one vendor", "Your phone system already runs on MyOperator", "You also need a calling app for your human team"] }),
  rival({ name: "SquadStack", slug: "squadstack", src: SRC.squadstack, what: "an Indian company that combines AI voice agents with a managed human telecalling team", price: "Custom, based on requirements, call volume and modules (per SquadStack)", setup: "Managed by SquadStack", script: "SquadStack's team",
    betterFor: ["You want AI plus a managed team of human telecallers from one vendor", "You run large sales or collections programmes and want pricing tied to outcomes", "You're a large brand, lender or insurer with high monthly call volumes"] }),
];
