'use client';
// Shared pieces of the website chat that the launcher needs straight away (kept small: the conversation panel
// itself is loaded only when a visitor opens the chat).

export const PHONE = '+91 78997 93001', TEL = '+917899793001', WA = '917899793001';
export const WA_URL = `https://wa.me/${WA}?text=${encodeURIComponent('Hi RANA AI, I would like to know more.')}`;
export const NL = String.fromCharCode(10);

/** Chat events go to Google Analytics when it is on the page. */
export function track(event: string, params: Record<string, unknown> = {}) {
  try { (window as any).gtag?.('event', event, { event_category: 'website_chat', ...params }); } catch {}
}

// The chat carries its own colours and motion: it sits outside the site theme wrapper.
export const CSS = `
.rc{--bg:#090d17;--surface:#10172a;--raise:#172039;--line:rgba(255,255,255,.08);--line2:rgba(255,255,255,.14);--ink:#eef1f7;--soft:#9aa5bd;--faint:#6d7892;--a:#2de1c2;--b:#8b7cf6;--on:#04131a;--ok:#35d07f;--err:#ff8f8f;color:var(--ink);-webkit-font-smoothing:antialiased}
@keyframes rc-up{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes rc-panel{from{opacity:0;transform:translateY(18px) scale(.96)}to{opacity:1;transform:none}}
@keyframes rc-spin{to{transform:rotate(360deg)}}
@keyframes rc-caret{50%{opacity:0}}
@keyframes rc-dot{0%,80%,100%{opacity:.25;transform:translateY(0)}40%{opacity:1;transform:translateY(-3px)}}
@keyframes rc-ring{0%{box-shadow:0 0 0 0 rgba(45,225,194,.45)}100%{box-shadow:0 0 0 14px rgba(45,225,194,0)}}
.rc-orb{position:relative;display:inline-block;border-radius:999px;overflow:hidden;isolation:isolate;background:#0b1020;box-shadow:inset 0 0 0 1px rgba(255,255,255,.14)}
.rc-orb::before{content:'';position:absolute;inset:-45%;background:conic-gradient(from 0deg,#2de1c2,#8b7cf6,#3aa0ff,#2de1c2);filter:blur(5px);animation:rc-spin 7s linear infinite}
.rc-orb::after{content:'';position:absolute;inset:0;border-radius:inherit;background:radial-gradient(circle at 32% 26%,rgba(255,255,255,.6),rgba(255,255,255,0) 46%),radial-gradient(circle at 70% 80%,rgba(4,10,24,.55),rgba(4,10,24,0) 55%)}
.rc-orb-busy::before{animation-duration:1.4s}
.rc-in{animation:rc-up .3s cubic-bezier(.2,.8,.2,1) both}
.rc-panel{animation:rc-panel .34s cubic-bezier(.2,.9,.25,1) both;transform-origin:bottom right}
.rc-caret::after{content:'';display:inline-block;width:6px;height:1em;margin-left:3px;vertical-align:-2px;border-radius:2px;background:var(--a);animation:rc-caret 1s steps(1) infinite}
.rc-dot{width:6px;height:6px;border-radius:999px;background:var(--soft);animation:rc-dot 1.2s ease-in-out infinite}
.rc-ring{animation:rc-ring 2.4s ease-out infinite}
.rc-scroll{scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.16) transparent}
.rc-scroll::-webkit-scrollbar{width:6px}.rc-scroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,.14);border-radius:6px}
.rc a.rc-link{color:var(--a);text-decoration:underline;text-underline-offset:3px;text-decoration-color:rgba(45,225,194,.4)}
.rc button:focus-visible,.rc a:focus-visible,.rc textarea:focus-visible{outline:2px solid var(--a);outline-offset:2px}
@media (prefers-reduced-motion:reduce){.rc *,.rc *::before,.rc *::after{animation:none!important;transition:none!important}}
`;

const PATHS: Record<string, string> = {
  phone: 'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z',
  x: 'M18 6 6 18M6 6l12 12',
  down: 'm6 9 6 6 6-6',
  send: 'M12 19V5M5 12l7-7 7 7',
  stop: 'M7 7h10v10H7z',
  edit: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
  expand: 'M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7',
  shrink: 'M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7',
  copy: 'M8 8h12v12H8zM16 8V4H4v12h4',
  check: 'M20 6 9 17l-5-5',
  up: 'M7 10v11M7 10l4-7a2 2 0 0 1 3 2l-1 5h5a2 2 0 0 1 2 2.3l-1.2 6a2 2 0 0 1-2 1.7H7M3 10h4v11H3z',
  dn: 'M17 14V3M17 14l-4 7a2 2 0 0 1-3-2l1-5H6a2 2 0 0 1-2-2.3l1.2-6A2 2 0 0 1 7.2 3H17M21 14h-4V3h4z',
  calendar: 'M4 5h16v16H4zM16 3v4M8 3v4M4 10h16',
  tag: 'M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8zM7 7h.01',
  zap: 'M13 2 3 14h9l-1 8 10-12h-9z',
  life: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4.9 4.9l4.3 4.3M14.8 14.8l4.3 4.3M14.8 9.2l4.3-4.3M4.9 19.1l4.3-4.3',
  chat: 'M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z',
  mail: 'M3 5h18v14H3zM3 6l9 7 9-7',
  right: 'M5 12h14M13 6l6 6-6 6',
  retry: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5',
};

export function Icon({ name, size = 18, className }: { name: string; size?: number; className?: string }) {
  const solid = name === 'stop';
  return (
    <svg width={size} height={size} viewBox='0 0 24 24' fill={solid ? 'currentColor' : 'none'} stroke={solid ? 'none' : 'currentColor'} strokeWidth={1.8} strokeLinecap='round' strokeLinejoin='round' className={className} aria-hidden>
      <path d={PATHS[name]} />
    </svg>
  );
}

/** Rana's mark: a small living orb. Spins faster while an answer is being written. */
export function Orb({ size = 32, busy = false, className = '' }: { size?: number; busy?: boolean; className?: string }) {
  return <span className={`rc-orb shrink-0 ${busy ? 'rc-orb-busy' : ''} ${className}`} style={{ width: size, height: size }} aria-hidden />;
}
