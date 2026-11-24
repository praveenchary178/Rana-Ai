// Every SEO page, looked up by path. Add pages in app/seo/data/*, and list new top-level prefixes in ./paths.ts.
import type { SeoPageData } from "./types";
import { LANDING as LANDING_RAW } from "./data/landing";
import { PRICING as PRICING_RAW } from "./data/pricing";
import { COMPARE as COMPARE_RAW } from "./data/compare";
import { INDUSTRIES as INDUSTRIES_RAW } from "./data/industries";
import { CITIES as CITIES_RAW } from "./data/cities";
import { GLOSSARY as GLOSSARY_RAW } from "./data/glossary";
import { GLOSSARY_EXTRA } from "./data/glossaryExtra";
import { GROWTH as GROWTH_RAW, COST_TOOL as COST_TOOL_RAW } from "./data/growth";
import { GUIDE as GUIDE_RAW, RIVALS as RIVALS_RAW } from "./data/guide";
import { CUSTOMER_RESULTS as RESULTS_RAW } from "./data/proof";
import { TRIAL as TRIAL_RAW } from "./data/trial";
import { INDUSTRY_MENU } from "../industries/menu";

/** When each page's content last changed (YYYY-MM-DD): shown on the page, in its JSON-LD and in the sitemap.
 *  Update the date whenever you change a page's content. Pages may also set `updated` themselves. */
const UPDATED: Record<string, string> = {
  "/pricing": "2026-11-19",
  "/industries/travel-agencies": "2026-11-14", "/industries/poultry-farm-produce": "2026-11-14", "/industries/fashion-clothing-stores": "2026-11-14",
};
const dated = (p: SeoPageData): SeoPageData => (p.updated || !UPDATED[p.path] ? p : { ...p, updated: UPDATED[p.path] });

/** /industries pages that duplicated a /for page (same searches). They 301 to /for (next.config.js) and are dropped here;
 *  every internal link to them is rewritten to the /for page. Keep in sync with next.config.js. */
export const INDUSTRY_TO_FOR: Record<string, string> = {
  "/industries/real-estate": "/for/real-estate",
  "/industries/clinics-hospitals": "/for/healthcare",
  "/industries/education-coaching": "/for/education",
  "/industries/e-commerce": "/for/ecommerce",
  "/industries/banking-nbfc-loans": "/for/bfsi",
  "/industries/hotels-hospitality": "/for/hospitality",
  "/industries/automobile-dealers": "/for/automobile",
  "/industries/recruitment-staffing": "/for/hr-recruitment",
};
const relink = (path: string) => INDUSTRY_TO_FOR[path] || path;

/** Shorter <title>s where the generated one runs past ~60 characters with " | RANA AI". */
const TITLE_FIX: Record<string, string> = {
  "/industries/poultry-farm-produce": "AI Phone Orders for Poultry, Meat & Farm Produce",
  "/industries/fashion-clothing-stores": "AI Receptionist for Clothing & Fashion Stores",
  "/ringg-ai-alternative": "Ringg AI Alternative for Indian Businesses",
  "/myoperator-alternative": "MyOperator Alternative for Indian Businesses",
  "/squadstack-alternative": "SquadStack Alternative for Indian Businesses",
};

/** Glossary pages get a worked example, a checklist and more FAQs (data/glossaryExtra.ts). */
function deepenGlossary(p: SeoPageData): SeoPageData {
  const x = GLOSSARY_EXTRA[p.path.replace("/glossary/", "")];
  if (!x) return p;
  const [definition, ...rest] = p.sections;
  const howRana = rest.pop()!;
  return {
    ...p,
    title: x.title ?? p.title,
    description: x.desc && p.description.length < 125 ? x.desc : p.description,
    sections: [definition, { h2: "Example", body: x.example }, ...rest, { h2: x.checklist.h2, bullets: x.checklist.bullets }, howRana],
    faqs: [...p.faqs, ...x.faq.filter((f) => !p.faqs.some((g) => g.q === f.q))],
    updated: "2026-11-14",
  };
}

const tidy = (p: SeoPageData): SeoPageData => dated({ ...p, title: TITLE_FIX[p.path] ?? p.title, related: Array.from(new Set(p.related.map(relink))).filter((r) => r !== p.path) });
const all = (list: SeoPageData[]) => list.map(tidy);

/** The pricing page also sells the trial pack. */
function withTrial(p: SeoPageData): SeoPageData {
  return {
    ...p,
    sections: [{ h2: "Start with the ₹2,500 trial pack", body: "Not ready for a monthly plan? Try RANA on your own business first. For a one-time ₹2,500, our team sets up an AI employee on your script and language, and you test it on real calls with recordings, transcripts and lead scores. The trial pack is a separate payment and isn't adjusted against a later plan. See what's included on the trial pack page." }, ...p.sections],
    faqs: [{ q: "Is there a trial?", a: "Yes — a paid trial pack for ₹2,500, one-time. Our team sets up an AI employee on your script so you can test it on real calls. There is no free trial." }, ...p.faqs],
    related: ["/ai-calling-trial", ...p.related],
  };
}

export const LANDING = all(LANDING_RAW);
export const PRICING = tidy(withTrial(PRICING_RAW));
export const COMPARE = all(COMPARE_RAW);
export const INDUSTRIES = all(INDUSTRIES_RAW.filter((p) => !INDUSTRY_TO_FOR[p.path]));
export const CITIES = all(CITIES_RAW);
export const GLOSSARY = all(GLOSSARY_RAW.map(deepenGlossary));
// The buyer's guide now lives in data/guide.ts; drop the older copy that is still in data/growth.ts.
export const GROWTH = all(GROWTH_RAW.filter((p) => p.path !== GUIDE_RAW.path));
export const COST_TOOL = tidy(COST_TOOL_RAW);
export const GUIDE = tidy(GUIDE_RAW);
export const RIVALS = all(RIVALS_RAW);
export const CUSTOMER_RESULTS = tidy(RESULTS_RAW);
export const TRIAL = tidy(TRIAL_RAW);

export const ALL_SEO: SeoPageData[] = [...LANDING, PRICING, TRIAL, ...COMPARE, ...INDUSTRIES, ...CITIES, ...GLOSSARY, ...GROWTH, GUIDE, ...RIVALS, CUSTOMER_RESULTS, COST_TOOL];
export const SEO_BY_PATH: Record<string, SeoPageData> = Object.fromEntries(ALL_SEO.map((p) => [p.path, p]));
/** Pages served at the top level (/ai-receptionist, /ai-voice-agent-hyderabad …) by app/(seo)/[slug]. */
export const TOP_LEVEL = [...LANDING, ...CITIES, ...GROWTH, GUIDE, ...RIVALS, CUSTOMER_RESULTS, TRIAL];

/** The /for industry pages (app/industries), for link labels and the /industries hub. */
export const FOR_PAGES = INDUSTRY_MENU.map((i) => ({ path: `/for/${i.slug}`, label: `AI calling for ${i.label}` }));
const FOR_LABELS: Record<string, string> = Object.fromEntries(FOR_PAGES.map((f) => [f.path, f.label]));

/** Blog posts we link to from SEO pages (titles kept here so pages render without a DB call). */
export const BLOG_LABELS: Record<string, string> = {
  "/blog/ai-voice-agent-for-business-india": "AI voice agent for business in India: complete guide",
  "/blog/ai-telecaller-for-real-estate-india": "AI telecaller for real estate in India",
  "/blog/ai-calling-for-coaching-institutes": "AI calling for coaching institutes",
  "/blog/ai-receptionist-for-clinics-india": "AI receptionist for clinics in India",
  "/blog/telecaller-vs-ai-calling-cost-india": "Telecaller vs AI calling cost in India",
  "/blog/telugu-ai-voice-agent": "Telugu AI voice agent guide",
  "/blog/trai-dlt-rules-for-ai-calling": "TRAI DLT rules for AI calling",
  "/blog/missed-call-to-lead-conversion": "Missed call to lead conversion playbook",
  "/blog/check-dnd-status-before-calling": "How to check DND status before calling",
  "/blog/how-many-telecallers-do-i-need": "How many telecallers do I need?",
};
export const labelFor = (path: string) => SEO_BY_PATH[path]?.label || FOR_LABELS[path] || BLOG_LABELS[path] || path;

/** Footer / hub link groups. */
export const LINK_GROUPS: { title: string; links: string[] }[] = [
  { title: "Solutions", links: ["/ai-calling-trial", "/ai-calling-agent", "/ai-receptionist", "/ai-receptionist-for-clinics", "/ai-receptionist-for-doctors", "/ai-telecaller", "/ai-voice-calling", "/telecaller-software", "/pricing", "/customer-results"] },
  { title: "Languages", links: ["/telugu-ai-voice-agent", "/hindi-ai-voice-agent", "/tamil-ai-voice-agent", "/kannada-ai-voice-agent"] },
  { title: "Industries", links: ["/for/real-estate", "/for/healthcare", "/for/education", "/for/ecommerce", "/industries/poultry-farm-produce", "/industries/fashion-clothing-stores", "/industries/travel-agencies", "/for/bfsi", "/industries"] },
  { title: "Cities", links: [...CITIES.map((c) => c.path), "/ai-receptionist-for-hospitals-hyderabad", "/ai-calling-for-real-estate-hyderabad", "/ai-calling-for-coaching-institutes-hyderabad"] },
  { title: "Compare", links: ["/best-ai-voice-agents-india", "/ringg-ai-alternative", "/myoperator-alternative", "/squadstack-alternative", "/vapi-alternative-india", "/compare/rana-ai-vs-bolna", "/compare/rana-ai-vs-retell-ai", "/compare/ai-vs-human-telecaller", "/compare"] },
  { title: "Learn", links: ["/tools/ai-calling-cost-calculator", "/blog", "/glossary/dlt-registration", "/glossary/trai-tcccpr-rules", "/glossary/dnd-ncpr", "/glossary/speed-to-lead", "/glossary"] },
];
export const HUB_LABELS: Record<string, string> = { "/industries": "All industries →", "/compare": "All comparisons →", "/glossary": "Glossary →", "/blog": "Blog" };
