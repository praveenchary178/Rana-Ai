// ranaai.in/for — pick your industry.
import type { Metadata } from "next";
import "../landing/landing.css";
import { INDUSTRY_LIST } from "../industries";
import IndustryHub from "../industries/ui/IndustryHub";

const SITE = "https://ranaai.in";
const DESCRIPTION = "Pick your industry — real estate, healthcare, education, BFSI, retail, hospitality, automotive, HR or IT — and see, hear and try what RANA AI does for it.";

export const metadata: Metadata = {
  title: { absolute: "AI Voice Agents for Your Industry | RANA AI" },
  description: DESCRIPTION,
  alternates: { canonical: "/for" },
};

export default function IndustriesPage() {
  const items = INDUSTRY_LIST.map((i) => ({ slug: i.slug, label: i.label, mark: i.mark, short: i.short, h1a: i.h1a, count: i.useCases.length, top: i.useCases.slice(0, 3).map((u) => u.title) }));
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "CollectionPage", "@id": `${SITE}/for#page`, url: `${SITE}/for`, name: "AI voice agents for your industry", description: DESCRIPTION, inLanguage: "en-IN", about: { "@id": `${SITE}/#org` } },
      { "@type": "ItemList", itemListElement: INDUSTRY_LIST.map((i, n) => ({ "@type": "ListItem", position: n + 1, url: `${SITE}/for/${i.slug}`, name: i.label })) },
      { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` }, { "@type": "ListItem", position: 2, name: "Industries", item: `${SITE}/for` }] },
    ],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <IndustryHub items={items} />
    </>
  );
}
