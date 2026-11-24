"use client";
// /pricing: Charan, 16 Nov 2026 — plans and prices hidden while the new pricing is finalised (lib/priceDisplay).
import Link from "next/link";
import { bookDemoHref } from "@/app/book-demo/link";
import { PRICE_FROM_LINE } from "@/lib/priceDisplay";

export default function PriceSwitcher() {
  return (
    <section className="mt-10 rounded-2xl border border-signal/40 bg-signal/[.06] p-6 sm:p-8 text-center" data-testid="price-switcher">
      <h2 className="font-display text-[26px] sm:text-[32px] font-semibold tracking-tight text-signal">{PRICE_FROM_LINE}</h2>
      <p className="text-[15px] text-ink-soft mt-3 max-w-[560px] mx-auto">The right plan depends on how many calls you answer and make each month. Book a demo or share your details, and our team will reach out with the plan that fits.</p>
      <Link href={bookDemoHref("pricing")} className="btn-glow inline-block mt-6 rounded-full px-7 py-3 text-[14px] font-semibold">Book a demo</Link>
    </section>
  );
}
