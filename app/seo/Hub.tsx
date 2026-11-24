import type { Metadata } from "next";
import Link from "next/link";
import type { SeoPageData } from "./types";

const SITE = "https://ranaai.in";

// Hub pages (/industries, /compare, /glossary): a crawlable index of every page of one kind.
export function hubMetadata(path: string, title: string, description: string): Metadata {
  return { title: { absolute: `${title} | RANA AI` }, description, alternates: { canonical: path }, openGraph: { title, description, url: path, type: "website", images: [{ url: "/opengraph-image", width: 1200, height: 630 }] } };
}

type Card = { path: string; label: string; intro: string };

export default function Hub({ eyebrow, h1, intro, pages, path, extra = [] }: { eyebrow: string; h1: string; intro: string; pages: SeoPageData[]; path?: string; extra?: Card[] }) {
  const cards: Card[] = [...extra, ...pages.map((p) => ({ path: p.path, label: p.label, intro: p.intro }))];
  const ld = path && {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "CollectionPage", "@id": `${SITE}${path}#page`, url: `${SITE}${path}`, name: h1, description: intro, inLanguage: "en-IN", isPartOf: { "@id": `${SITE}/#website` }, about: { "@id": `${SITE}/#org` } },
      { "@type": "ItemList", itemListElement: cards.map((c, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE}${c.path}`, name: c.label })) },
      { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` }, { "@type": "ListItem", position: 2, name: eyebrow, item: `${SITE}${path}` }] },
    ],
  };
  return (
    <div>
      {ld && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />}
      <div className="eyebrow">{eyebrow}</div>
      <h1 className="font-display text-[36px] sm:text-[48px] font-semibold tracking-[-0.03em] leading-[1.05] mt-3">{h1}</h1>
      <p className="text-[17px] leading-relaxed text-ink-soft mt-5 max-w-[720px]">{intro}</p>
      <ul className="grid sm:grid-cols-2 gap-3 mt-10">
        {cards.map((p) => (
          <li key={p.path}>
            <Link href={p.path} className="block h-full rounded-2xl border border-white/10 hover:border-signal/40 bg-white/[.02] p-5">
              <div className="font-display text-[18px] font-semibold">{p.label}</div>
              <div className="text-[14px] text-ink-soft mt-1.5 leading-snug">{p.intro.length > 150 ? p.intro.slice(0, p.intro.lastIndexOf(" ", 147)) + "…" : p.intro}</div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
