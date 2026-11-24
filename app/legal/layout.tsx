import "../landing/landing.css";
import SiteHeader from "../landing/SiteHeader";
import MarketingFooter from "../landing/MarketingFooter";
import { LEGAL } from "./legal";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="site theme-night min-h-screen">
      <SiteHeader />
      <main className="max-w-[860px] mx-auto px-5 sm:px-8 py-12 sm:py-16">{children}</main>
      <MarketingFooter email={LEGAL.email} />
    </div>
  );
}
