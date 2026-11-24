import DashboardPreview from "./DashboardPreview";

const POINTS = [
  ["Hot leads first", "Ranked so sales calls the right people first."],
  ["Instant alerts", "Slack, WhatsApp or email the moment a call ends."],
  ["Your reports", "Excel exports with exactly the columns you choose."],
  ["Every campaign", "Results campaign by campaign, and why calls didn't connect."],
] as const;

/** The dashboard as a framed product shot under a centred heading. */
export default function DashboardShowcase() {
  return (
    <section className="max-w-[1180px] mx-auto px-5 sm:px-8 pb-28" aria-labelledby="dashboard-title">
      <div className="text-center max-w-[720px] mx-auto">
        <div className="eyebrow">Your dashboard</div>
        <h2 id="dashboard-title" className="font-display font-semibold tracking-[-0.03em] leading-[1.05] text-[34px] sm:text-[48px] mt-3">Open it once. Know everything.</h2>
        <p className="text-ink-soft text-[16px] leading-relaxed mt-4">Calls, connect rate, talk time, hot leads and every transcript — live, filtered by day, campaign or direction.</p>
      </div>
      <div className="relative mt-14 max-w-[1000px] mx-auto">
        <div className="horizon" aria-hidden />
        <div className="relative frame p-2 sm:p-3"><DashboardPreview /></div>
      </div>
      <dl className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {POINTS.map(([t, d]) => (
          <div key={t}>
            <dt className="text-[15px] font-semibold">{t}</dt>
            <dd className="text-[14px] text-ink-soft mt-1.5 leading-relaxed">{d}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
