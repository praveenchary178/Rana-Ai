import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./premium.css";
import { Instrument_Sans, JetBrains_Mono } from "next/font/google";
import Analytics from "@/components/Analytics";
import ChatWidget from "@/components/ChatWidget";
import AppHelp from "@/components/AppHelp";

// Self-hosted by next/font: no request to Google at runtime, no layout shift, exposed as CSS variables for Tailwind.
const sans = Instrument_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://ranaai.in"),
  title: { default: "RANA AI — AI Voice Agents for Indian Businesses", template: "%s · RANA AI" },
  description: "RANA AI answers and places your business calls in Indian and global languages, qualifies every lead and hands the hot ones to your team.",
  applicationName: "RANA AI",
  openGraph: { type: "website", siteName: "RANA AI", locale: "en_IN" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#06080D",
};

// Runs before paint so there is no flash of the wrong theme. The dashboard is day by default; night is a saved choice.
const THEME_BOOT = `document.documentElement.classList.add('js');try{var t=localStorage.getItem('rana_theme');if(t==='light')document.documentElement.setAttribute('data-theme','light');if(localStorage.getItem('rana_app_theme')==='night')document.documentElement.classList.add('app-night');}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      </head>
      <body className="font-sans">
        {children}
        {/* Website chat (sales + support). Shows only on public pages (those wrapped in `.site`), never inside the app. */}
        <ChatWidget />
        {/* Search and page guide. Shows only on signed-in pages (those with the dashboard menu). */}
        <AppHelp />
        <Analytics />
      </body>
    </html>
  );
}
