"use client";
import CallConsole from "./CallConsole";
import { CALL_LANGUAGE_COUNT, type IndustryCall } from "../content";
import { art, type Vertical } from "../verticals";
import type { Market } from "../markets";

type Props = {
  market: Market;
  vertical?: Vertical;
  calls: IndustryCall[];
  onTry: () => void;
  onDemo: () => void;
  onProof: () => void;
  onTalk: () => void;
};

function eyebrowFor(market: Market) {
  if (market.key === "in") return "AI voice agent & AI calling agent for Indian businesses";
  if (market.key === "global") return "AI voice agents for businesses worldwide";
  const where = market.key === "us" ? "the United States" : market.key === "ae" ? "the UAE & Gulf" : market.name;
  return `AI voice agents for businesses in ${where}`;
}

const SUB_IN = "AI voice agents that answer and make your business calls in Telugu, Hindi, Tamil and 11 more languages — then hand your team only the leads worth calling back.";
const SUB_GLOBAL = "AI voice agents that answer and make your business calls around the clock in English, Spanish, French, Japanese, Hindi and 9 more Indian languages — then hand your team only the leads worth calling back.";

/** Centred statement, two actions, and the live call console as the product shot. */
export default function Hero({ market, vertical: v, calls, onTry, onDemo, onProof, onTalk }: Props) {
  const india = market.key === "in";
  return (
    <section className="relative" aria-labelledby="hero-title">
      <div className="max-w-[1000px] mx-auto px-5 sm:px-8 pt-14 sm:pt-24 text-center">
        <div className="inline-flex items-center gap-2.5 rounded-full border border-line bg-raised/60 pl-1.5 pr-3.5 py-1 text-[13px] text-ink-soft">
          <span className="rounded-full bg-signal/15 text-signal text-[12px] font-semibold px-2 py-0.5">Live</span>
          Answering calls in {CALL_LANGUAGE_COUNT} languages, 24×7
        </div>

        <h1 id="hero-title" className="mt-8">
          <span className="block eyebrow mb-5">{v ? v.eyebrow : eyebrowFor(market)}</span>
          <span className="block font-display font-semibold display-xl">
            {v ? <>{v.h1a}<br /><span className="text-signal">{v.h1b}</span></> : <>We build what<br /><span className="text-signal">answers back.</span></>}
          </span>
        </h1>

        <p className="text-ink-soft text-[17px] sm:text-[19px] leading-relaxed mt-7 max-w-[660px] mx-auto">
          {v ? v.sub : india ? SUB_IN : SUB_GLOBAL}
        </p>

        <div className="flex flex-wrap gap-3 mt-10 justify-center">
          {v ? <>
            <button type="button" onClick={onProof} className="btn-glow rounded-full px-6 py-3.5 text-[15px] font-semibold" data-testid="hero-proof">Free proof run on my leads</button>
            <button type="button" onClick={onTry} className="btn-ghost rounded-full px-6 py-3.5 text-[15px] font-medium" data-testid="hero-try">Hear {art(v.label)} {v.label.toLowerCase()} call</button>
          </> : <>
            <button type="button" onClick={onTry} className="btn-glow rounded-full px-6 py-3.5 text-[15px] font-semibold" data-testid="hero-try">Try an instant demo</button>
            <button type="button" onClick={onDemo} className="btn-ghost rounded-full px-6 py-3.5 text-[15px] font-medium" data-testid="hero-demo">Book a demo</button>
          </>}
        </div>
        <p className="text-[13px] text-ink-soft/80 mt-4">No sign-up. Hear a real call in your language in under a minute.</p>
      </div>

      <div className="relative max-w-[1180px] mx-auto px-4 sm:px-8 mt-16 sm:mt-20">
        <div className="horizon" aria-hidden />
        <div className="relative"><CallConsole calls={calls} onTalk={onTalk} /></div>
      </div>
    </section>
  );
}
