import Image from "next/image";
import { CALL_LANGUAGE_COUNT } from "../content";

/** Client logos live in /public/clients (320×320 WebP). */
const CLIENTS = [
  { name: "SVR Tours and Travels", sector: "Travel", logo: "/clients/svr-tours-and-travels.webp" },
  { name: "Fashion House Premium", sector: "Fashion retail", logo: "/clients/fashion-house-premium.webp" },
  { name: "AN Farms and Hatcheries", sector: "Poultry & hatcheries", logo: "/clients/an-farms-and-hatcheries.webp" },
];

const INDUSTRIES = ["Clinics & hospitals", "Real estate", "Coaching & education", "E-commerce", "Insurance & loans", "Hospitality", "Home services"];

/** Clients, who it's for, the first deployment, and the four numbers that matter — as a quiet band, not cards. */
export default function Highlights({ india }: { india: boolean }) {
  const stats: [string, string, string][] = [
    [String(CALL_LANGUAGE_COUNT), "Call languages", india ? "11 Indian + 3 global" : "Global + 11 Indian"],
    ["24×7", "Every call answered", "Nights, Sundays, rush hours"],
    ["~1 s", "To respond", "Natural turn-taking"],
    ["30 s", "Billing pulses", "Not full minutes"],
  ];
  return (
    <section className="max-w-[1180px] mx-auto px-5 sm:px-8 pt-24" aria-label="Highlights">
      <p className="text-center text-[14px] text-ink-soft">Trusted by businesses across India</p>
      <ul className="mt-6 flex flex-wrap justify-center gap-4" data-testid="client-logos">
        {CLIENTS.map((c) => (
          <li key={c.name} className="flex items-center gap-3.5 rounded-2xl border border-white/[.08] bg-raised/50 py-2.5 pl-2.5 pr-5">
            <Image src={c.logo} alt={`${c.name} logo`} width={56} height={56} className="rounded-xl" />
            <span className="text-left">
              <span className="block text-[14.5px] font-semibold leading-tight">{c.name}</span>
              <span className="block text-[12.5px] text-ink-soft mt-0.5">{c.sector}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-14 text-center text-[14px] text-ink-soft">Built for every business that runs on phone calls</p>
      <ul className="mt-5 flex flex-wrap justify-center gap-x-8 gap-y-3 font-display text-[17px] sm:text-[19px] font-semibold text-ink/45">
        {INDUSTRIES.map((x) => <li key={x}>{x}</li>)}
      </ul>
      {india && (
        <p className="mt-8 text-center text-[14px] text-ink-soft max-w-[720px] mx-auto">
          <span className="text-ink font-medium">First deployment:</span> a leading medical-entrance coaching network across South India — enquiries and outbound campaigns, end to end, in Telugu and English.
        </p>
      )}
      <dl className="mt-14 grid grid-cols-2 lg:grid-cols-4 rounded-2xl border border-white/[.07] overflow-hidden">
        {stats.map(([n, l, d]) => (
          <div key={l} className="flex flex-col p-6 sm:p-8 border-white/[.07] odd:border-r [&:nth-child(-n+2)]:border-b lg:[&:nth-child(-n+2)]:border-b-0 lg:border-r lg:last:border-r-0">
            <dt className="order-2 mt-3 text-[13.5px] font-medium text-ink">{l}</dt>
            <dd className="order-1 font-display text-[34px] sm:text-[44px] font-semibold tracking-[-0.03em] tabular-nums leading-none">{n}</dd>
            <dd className="order-3 text-[13px] text-ink-soft mt-1">{d}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
