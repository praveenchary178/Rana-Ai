"use client";
// Google Analytics 4 for the PUBLIC website only. Every public page (homepage and country pages, /for, SEO pages,
// blog, legal) is wrapped in an element with class "site"; the signed-in dashboard is not, so it never loads GA.
// We send page views ourselves (one per navigation) and keep only marketing parameters in the URL.
import { useEffect } from "react";
import { usePathname } from "next/navigation";

const GA_ID = "G-LY578H9XS3";
const KEEP = /^(utm_[a-z]+|gclid)$/;

function pageLocation() {
  const u = new URL(location.href);
  const q = new URLSearchParams();
  u.searchParams.forEach((v, k) => { if (KEEP.test(k)) q.set(k, v); });
  return `${u.origin}${u.pathname}${q.toString() ? `?${q}` : ""}`;
}

export default function Analytics() {
  const pathname = usePathname();
  useEffect(() => {
    const t = setTimeout(() => {
      if (!document.querySelector(".site")) return; // not a public page
      const w = window as any;
      if (!w.__ranaGa) {
        w.__ranaGa = true;
        w.dataLayer = w.dataLayer || [];
        w.gtag = function gtag() { w.dataLayer.push(arguments); };
        w.gtag("js", new Date());
        w.gtag("config", GA_ID, { send_page_view: false });
        const s = document.createElement("script");
        s.async = true;
        s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
        document.head.appendChild(s);
      }
      w.gtag("event", "page_view", { page_location: pageLocation(), page_title: document.title });
    }, 50);
    return () => clearTimeout(t);
  }, [pathname]);
  return null;
}
