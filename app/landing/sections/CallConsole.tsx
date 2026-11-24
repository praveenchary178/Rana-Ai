"use client";
import { useEffect, useRef, useState } from "react";
import RanaCore from "@/components/RanaCore";
import type { Line, IndustryCall } from "../content";

export function MicIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </svg>
  );
}

function CheckIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
}

const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
const titleCase = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

/** A line's tag reads "OUTCOME → sent to TEAM"; split it for the summary panel. */
function parseTag(tag?: string) {
  if (!tag) return null;
  const [outcome, dest] = tag.split("→").map((x) => x.trim());
  return { outcome, dest };
}

/**
 * The hero's product shot: a live call console. Rana's voice core reacts to who is talking, the transcript
 * types out, and the call summary fills in when the outcome is reached. Visitors can switch business type,
 * or tap the core to talk to Rana themselves.
 */
export default function CallConsole({ calls, onTalk }: { calls: IndustryCall[]; onTalk: () => void }) {
  const [ind, setInd] = useState(0);
  const [round, setRound] = useState(0);
  const pinned = useRef(false); // once the visitor picks a business, keep replaying that one
  const [lines, setLines] = useState<Line[]>([]);
  const [typing, setTyping] = useState("");
  const [done, setDone] = useState(false);
  const [secs, setSecs] = useState(0);
  const call = calls[ind] || calls[0];

  useEffect(() => {
    setSecs(0);
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setLines(call.lines); setDone(true); return; }
    let alive = true;
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    (async () => {
      setLines([]); setDone(false);
      await sleep(600);
      for (const l of call.lines) {
        for (let i = 1; i <= l.text.length && alive; i += 2) { setTyping(l.text.slice(0, i)); await sleep(24); }
        if (!alive) return;
        setTyping(""); setLines((x) => [...x, l]); await sleep(850);
      }
      if (!alive) return;
      setDone(true);
      await sleep(5200);
      // Keep cycling through businesses until the visitor picks one; then replay theirs.
      if (alive) { if (pinned.current) setRound((r) => r + 1); else setInd((i) => (i + 1) % calls.length); }
    })();
    return () => { alive = false; };
  }, [ind, round]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (done) return;
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [done]);

  const next = call.lines[lines.length];
  const speaking = Boolean(typing && next?.who === "ai");
  const listening = Boolean(typing && next?.who === "caller");
  const status = speaking ? "Speaking" : listening ? "Listening" : done ? "Call complete" : "On the line";
  const other = call.dir === "OUTBOUND" ? "Customer" : "Caller";
  const result = lines.some((l) => l.tag) ? parseTag(call.lines.find((l) => l.tag)?.tag) : null;

  const pick = (i: number) => { pinned.current = true; setTyping(""); setInd(i); if (i === ind) setRound((r) => r + 1); };

  return (
    <div className="frame overflow-hidden text-left" data-testid="live-call">
      {/* Title bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-white/[.06]">
        <div className="flex items-center gap-2.5 text-[12.5px] text-ink-soft">
          <span className={`w-2 h-2 rounded-full ${done ? "bg-ink-soft/50" : "bg-signal live-dot"}`} aria-hidden />
          <span className="font-medium text-ink">{done ? "Call ended" : "Live call"}</span>
          <span className="font-mono tabular-nums">{mmss(secs)}</span>
        </div>
        <div className="flex gap-1 min-w-0 max-w-full overflow-x-auto no-scrollbar -mx-1 px-1" role="tablist" aria-label="Pick a business">
          {calls.map((c, i) => (
            <button key={c.key} type="button" role="tab" aria-selected={i === ind} onClick={() => pick(i)}
              className={`shrink-0 rounded-full px-3 py-1 text-[12.5px] transition-colors ${i === ind ? "bg-white/[.08] text-ink" : "text-ink-soft hover:text-ink"}`}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[240px_minmax(0,1fr)_280px]">
        {/* Agent */}
        <div className="flex lg:flex-col items-center gap-5 p-5 lg:p-6 border-b lg:border-b-0 lg:border-r border-white/[.06]">
          <div className="w-[92px] lg:w-[180px] shrink-0">
            <RanaCore size="100%" hud={false} dense={false} mode={speaking ? "speaking" : listening ? "listening" : "idle"} onClick={onTalk} label="Talk to Rana — ask anything about RANA AI" />
          </div>
          <div className="min-w-0 lg:text-center">
            <div className="text-[15px] font-semibold">Rana</div>
            <div className="text-[12.5px] text-ink-soft">AI employee · <span className={speaking ? "text-signal" : listening ? "text-violet" : ""}>{status}</span></div>
            <button type="button" onClick={onTalk} data-testid="hero-core"
              className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/[.12] hover:border-signal/60 px-3.5 py-1.5 text-[12.5px] font-medium">
              <MicIcon size={14} />Talk to Rana yourself
            </button>
          </div>
        </div>

        {/* Transcript */}
        <div className="min-w-0 p-5 sm:p-6 min-h-[320px] flex flex-col" aria-live="polite">
          <div className="flex flex-col gap-4 flex-1">
            {lines.map((l, i) => (
              <TranscriptLine key={`${call.key}-${round}-${i}`} who={l.who} label={l.who === "ai" ? "Rana" : other} text={l.text} />
            ))}
            {typing && next && <TranscriptLine who={next.who} label={next.who === "ai" ? "Rana" : other} text={typing} typing />}
          </div>
          <div className={`wave flex items-end gap-[3px] h-7 mt-5 overflow-hidden transition-opacity ${typing ? "opacity-100" : "opacity-30"}`} aria-hidden>
            {Array.from({ length: 56 }, (_, i) => <i key={i} style={{ animationDelay: `${(i % 14) * 0.07}s` }} />)}
          </div>
        </div>

        {/* Summary */}
        <aside className="p-5 sm:p-6 border-t lg:border-t-0 lg:border-l border-white/[.06] text-[13px]" aria-label="Call summary">
          <div className="text-[12.5px] font-semibold text-ink-soft">Call summary</div>
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-5 gap-y-2.5">
            <dt className="text-ink-soft">Business</dt><dd className="text-right">{call.label}</dd>
            <dt className="text-ink-soft">Direction</dt><dd className="text-right">{titleCase(call.dir)}</dd>
            <dt className="text-ink-soft">Language</dt><dd className="text-right">{titleCase(call.lang)}</dd>
            <dt className="text-ink-soft">Number</dt><dd className="text-right font-mono text-[12px] tabular-nums whitespace-nowrap">{call.number}</dd>
          </dl>
          <div className={`mt-6 rounded-xl border p-4 transition-colors duration-500 ${result ? "border-signal/40 bg-signal/[.07]" : "border-white/[.08]"}`} data-testid="call-outcome">
            <div className="text-[12px] font-semibold text-ink-soft">Outcome</div>
            {result ? (
              <div className="hud-pop">
                <div className="mt-1.5 text-[14px] font-semibold text-ink leading-snug">{titleCase(result.outcome)}</div>
                {result.dest && <div className="mt-2 flex items-center gap-1.5 text-signal"><CheckIcon />{result.dest.charAt(0).toUpperCase() + result.dest.slice(1)}</div>}
              </div>
            ) : (
              <div className="mt-1.5 text-ink-soft">Understanding what the {other.toLowerCase()} needs…</div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function TranscriptLine({ who, label, text, typing = false }: { who: Line["who"]; label: string; text: string; typing?: boolean }) {
  const ai = who === "ai";
  return (
    <div className={`flex gap-3 ${typing ? "" : "animate-rise"}`}>
      <span className={`mt-0.5 grid place-items-center w-7 h-7 shrink-0 rounded-full text-[11.5px] font-semibold ${ai ? "bg-signal/15 text-signal" : "bg-white/[.07] text-ink-soft"}`} aria-hidden>{label[0]}</span>
      <div className="min-w-0">
        <div className={`text-[12px] font-medium ${ai ? "text-signal" : "text-ink-soft"}`}>{label}</div>
        <p className={`text-[14.5px] leading-snug text-ink/90 mt-0.5 ${typing ? "caret" : ""}`}>{text}</p>
      </div>
    </div>
  );
}
