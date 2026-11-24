import "../landing/landing.css";
import SiteHeader from "../landing/SiteHeader";
import MarketingFooter from "../landing/MarketingFooter";

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="site theme-night min-h-screen">
      <SiteHeader showProof />
      <main className="max-w-[860px] mx-auto px-5 sm:px-8 py-12 sm:py-16">{children}</main>
      <MarketingFooter directory links={[["Blog", "/blog"]]} />
    </div>
  );
}
