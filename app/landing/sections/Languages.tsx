"use client";

type Lang = { native: string; name: string; global?: boolean };

const INDIAN: Lang[] = [
  { native: "తెలుగు", name: "Telugu" }, { native: "हिन्दी", name: "Hindi" }, { native: "தமிழ்", name: "Tamil" },
  { native: "ಕನ್ನಡ", name: "Kannada" }, { native: "മലയാളം", name: "Malayalam" }, { native: "मराठी", name: "Marathi" },
  { native: "বাংলা", name: "Bengali" }, { native: "ગુજરાતી", name: "Gujarati" }, { native: "ਪੰਜਾਬੀ", name: "Punjabi" },
  { native: "ଓଡ଼ିଆ", name: "Odia" }, { native: "English", name: "English" },
];
const GLOBAL: Lang[] = [
  { native: "Español", name: "Spanish", global: true }, { native: "Français", name: "French", global: true }, { native: "日本語", name: "Japanese", global: true },
];

/** Every call language, written in its own script. */
export default function Languages({ india, onTry }: { india: boolean; onTry: () => void }) {
  const langs = india ? [...INDIAN, ...GLOBAL] : [INDIAN[10], ...GLOBAL, ...INDIAN.slice(0, 10)];
  return (
    <section className="border-y border-white/[.06] bg-raised/30" aria-labelledby="languages-title">
      <div className="max-w-[1180px] mx-auto px-5 sm:px-8 py-24">
        <div className="grid lg:grid-cols-[1.25fr_1fr] gap-8 lg:gap-16 items-end">
          <div>
            <div className="eyebrow">Languages</div>
            <h2 id="languages-title" className="font-display font-semibold tracking-[-0.03em] leading-[1.05] text-[34px] sm:text-[48px] mt-3">Speaks the way your customers do.</h2>
          </div>
          <div>
            <p className="text-ink-soft text-[16px] leading-relaxed">
              {india
                ? "11 Indian languages — the mother tongues of nearly 9 in 10 Indians — plus Spanish, French and Japanese for callers abroad. Rana switches mid-call when the caller does."
                : "English, Spanish, French and Japanese for callers around the world, plus Hindi and 10 more Indian languages. Rana switches mid-call when the caller does."}
            </p>
            <button type="button" onClick={onTry} className="mt-5 text-[14.5px] font-semibold text-signal hover:underline underline-offset-4">Hear it in your language →</button>
          </div>
        </div>
        <ul className="mt-14 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-px rounded-2xl overflow-hidden border border-white/[.07] bg-white/[.07]" data-testid="language-grid">
          {langs.map((l) => (
            <li key={l.name} className="bg-paper px-4 py-5 sm:py-6">
              <div className="text-[22px] sm:text-[24px] font-semibold leading-tight" lang={l.name === "English" ? "en" : undefined}>{l.native}</div>
              <div className="mt-1.5 flex items-center gap-2 text-[12.5px] text-ink-soft">
                {l.name}{l.global && <span className="text-[11px] font-medium text-violet">Global</span>}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
