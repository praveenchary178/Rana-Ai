import Link from "next/link";
import { LEGAL, LEGAL_LINKS } from "@/app/legal/legal";
import { LINK_GROUPS, labelFor, HUB_LABELS } from "@/app/seo/index";

type Props = {
  /** Show the full internal-link directory (solutions, languages, industries, cities, comparisons). */
  directory?: boolean;
  /** Extra links shown before the legal links, e.g. [["Blog", "/blog"]]. */
  links?: ReadonlyArray<readonly [label: string, href: string]>;
  /** Contact email shown in the footer line. */
  email?: string;
};

/**
 * Footer for inner marketing pages (blog, legal, SEO pages). The link directory is how Google discovers
 * and ranks the SEO pages, so it stays on every page that has it.
 */
export default function MarketingFooter({ directory = false, links = [], email = LEGAL.salesEmail }: Props) {
  return (
    <footer className="border-t border-line/70 mt-10">
      {directory && (
        <div className="max-w-[1080px] mx-auto px-5 sm:px-8 pt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 text-[13px]">
          {LINK_GROUPS.map((g) => (
            <div key={g.title}>
              <div className="text-[13px] font-semibold text-ink mb-3">{g.title}</div>
              <ul className="grid gap-2">
                {g.links.map((l) => (
                  <li key={l}><Link href={l} className="text-ink-soft hover:text-signal">{HUB_LABELS[l] || labelFor(l)}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      <div className="max-w-[1080px] mx-auto px-5 sm:px-8 py-8 text-[13px] text-ink-soft space-y-3">
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/" className="hover:text-signal">Home</Link>
          {links.map(([l, h]) => <Link key={h} href={h} className="hover:text-signal">{l}</Link>)}
          {LEGAL_LINKS.map(([l, h]) => <Link key={h} href={h} className="hover:text-signal">{l}</Link>)}
        </nav>
        <p>
          RANA AI, {LEGAL.city}. Sales:{" "}
          <a className="text-signal tabular-nums" href={`tel:${LEGAL.phoneTel}`}>{LEGAL.phone}</a>
          {" · "}
          <a className="text-signal" href={`mailto:${email}`}>{email}</a>
        </p>
      </div>
    </footer>
  );
}
