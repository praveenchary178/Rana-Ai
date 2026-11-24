import "../landing/landing.css";
import SiteHeader from "../landing/SiteHeader";
import MarketingFooter from "../landing/MarketingFooter";

// Marketing layout for every SEO page: the site header, and a footer that links every solution, language,
// industry, city and comparison (internal links are how Google discovers and ranks these pages).
export default function SeoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="site theme-night min-h-screen">
      <SiteHeader showProof />
      <main className="max-w-[900px] mx-auto px-5 sm:px-8 py-10 sm:py-14">{children}</main>
      <MarketingFooter directory links={[["Blog", "/blog"]]} />
    </div>
  );
}
