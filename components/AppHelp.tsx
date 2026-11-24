'use client';
// Signed-in pages only: a search box that jumps to any page, employee, call or campaign (Ctrl+K or Cmd+K),
// and a short plain-words guide to the page you are on. Both open from the small dock in the bottom-right corner.
import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const NO_NAME = /^(|not provided|unknown|n.a|na|none)$/i;
const realName = (n?: string | null) => (NO_NAME.test(String(n || '').trim()) ? '' : String(n || '').trim());
type Hit = { group: string; label: string; sub?: string; href: string };
type Page = { label: string; href: string; words?: string; hq?: boolean };

const PAGES: Page[] = [
  { label: 'Home', href: '/', words: 'dashboard overview today numbers' },
  { label: 'AI Employees', href: '/employees', words: 'agents team bots scripts' },
  { label: 'New AI employee', href: '/employees?new=1', words: 'create build add agent' },
  { label: 'Test a call', href: '/talk', words: 'talk try voice demo' },
  { label: 'Calls', href: '/calls', words: 'all calls incoming outgoing inbound outbound recordings transcripts' },
  { label: 'Hot leads', href: '/calls?filter=hot&period=30d', words: 'interested buyers ready to close' },
  { label: 'Calls that asked for a call back', href: '/calls?filter=callback&period=30d', words: 'follow up callback' },
  { label: 'Calls not answered', href: '/calls?filter=missed&period=30d', words: 'missed dnp no answer busy' },
  { label: 'Live view', href: '/live', words: 'mission control live calls now' },
  { label: 'Campaigns', href: '/outbound', words: 'bulk outbound calling list upload' },
  { label: 'New campaign', href: '/outbound/new', words: 'start create bulk calling upload numbers' },
  { label: 'Leads & reports', href: '/reports', words: 'excel download export csv' },
  { label: 'Lead alerts', href: '/integrations', words: 'whatsapp email slack webhook notifications integrations' },
  { label: 'Phone numbers', href: '/phone-numbers', words: 'number line forwarding' },
  { label: 'Plan & billing', href: '/billing', words: 'invoice payment minutes usage upgrade recharge' },
  { label: 'Settings', href: '/settings', words: 'team invite users calling rules hours account password' },
  { label: 'HQ · All clients', href: '/hq', hq: true, words: 'workspaces customers' },
  { label: 'HQ · Command centre', href: '/hq/command', hq: true },
  { label: 'HQ · Demo requests', href: '/hq/demos', hq: true },
  { label: 'HQ · Website leads', href: '/hq/leads', hq: true, words: 'instant calls priya' },
  { label: 'HQ · Website chats', href: '/hq/chats', hq: true, words: 'chatbot tickets support rana' },
  { label: 'HQ · Sales CRM', href: '/hq/crm', hq: true },
  { label: 'HQ · Instagram & FB inbox', href: '/hq/inbox', hq: true, words: 'meta messages dm' },
  { label: 'HQ · Outbound (LeadFlow)', href: '/hq/outbound', hq: true },
  { label: 'HQ · Money & credits', href: '/hq/money', hq: true, words: 'sarvam balance revenue' },
  { label: 'HQ · Voice engines', href: '/hq/voices', hq: true },
  { label: 'HQ · Phone numbers', href: '/hq/numbers', hq: true },
  { label: 'HQ · Team & security', href: '/hq/team', hq: true },
  { label: 'HQ · Sign-ins', href: '/hq/sign-ins', hq: true },
  { label: 'HQ · Reel studio', href: '/hq/reel', hq: true },
];

// A short guide per page: what it is for and what you can do there. The longest matching address wins.
const GUIDES: [string, { title: string; what: string; tips: string[] }][] = [
  ['/', { title: 'Home', what: 'A quick view of how your AI employees are doing.', tips: ['The four big numbers cover the period you pick at the top.', 'Needs your attention lists what to act on first.', 'Open Full report for charts, campaigns and how each number is counted.'] }],
  ['/employees', { title: 'AI Employees', what: 'Build, test and switch on the employees that answer and make your calls.', tips: ['New employee offers three ways to build one.', 'Each card shows the one next step: Publish, Test a call or Go live.', 'Use the chips to see only the ones that are live or still need testing.'] }],
  ['/agents', { title: 'Guided setup', what: 'Four steps to build an employee: name and languages, voice, script, then publish.', tips: ['Paste your existing script; RANA turns it into a call plan.', 'You can come back and edit any step later.', 'After publishing, test a call before going live.'] }],
  ['/builder', { title: 'Agent Builder', what: 'Write the script yourself in clear sections. The employee follows it exactly.', tips: ['Ask the AI for changes in plain words.', 'Publish, then test straight away.'] }],
  ['/talk', { title: 'Test a call', what: 'Talk to an employee from your browser before real customers do.', tips: ['Pick the employee, press start and speak.', 'Test calls never count in your results.', 'Sign off when it answers the way you want.'] }],
  ['/calls', { title: 'Calls', what: 'Every call your employees answered or made, in one list.', tips: ['Filter by incoming or outgoing, and by what happened.', 'Click a call for its recording, transcript and details.', 'Search by name, phone number or words in the summary.'] }],
  ['/live', { title: 'Live view', what: 'What is happening right now: calls in progress and today so far.', tips: ['Ask a question about your calls in the box at the top.', 'For older calls, use the Calls page.'] }],
  ['/outbound', { title: 'Campaigns', what: 'Upload a list of numbers and let an employee call each one.', tips: ['A campaign needs a published and tested employee.', 'Calls run only inside your allowed calling hours.', 'Open a campaign to see who was interested.'] }],
  ['/reports', { title: 'Leads & reports', what: 'Choose the calls and columns you want and download them as Excel.', tips: ['Pick the dates first, then the kind of leads.', 'Save a set of choices as a template for your team.', 'The preview shows exactly what the file will contain.'] }],
  ['/integrations', { title: 'Lead alerts', what: 'Send leads to where your team works the moment a call ends.', tips: ['Choose the channel: WhatsApp, email, Slack or a webhook.', 'Choose which leads trigger an alert, for example only hot ones.', 'Send a test alert before relying on it.'] }],
  ['/phone-numbers', { title: 'Phone numbers', what: 'The numbers your employees call from and answer on.', tips: ['Keep your existing number by forwarding it.', 'You can get a local business number here.'] }],
  ['/billing', { title: 'Plan & billing', what: 'Your plan, the minutes used this period, and your invoices.', tips: ['You are billed for answered minutes only.', 'Pay an invoice or top up from this page.'] }],
  ['/settings', { title: 'Settings', what: 'Who can use RANA in your business and when your employees may call.', tips: ['Invite teammates and choose what each can do.', 'Set calling hours under Calling rules.', 'Activity shows every important change.'] }],
  ['/orders', { title: 'Orders', what: 'Orders taken on calls, with payment follow-up.', tips: ['Open an order to see the call it came from.'] }],
  ['/hq', { title: 'RANA HQ', what: 'Tools for the RANA team: clients, sales and operations.', tips: ['Use the RANA HQ box in the menu to move between HQ pages.', 'Search (Ctrl+K) also finds every HQ page.'] }],
];

const WA_HELP = 'https://wa.me/917899793001?text=Hi%20RANA%20AI%2C%20I%20need%20help%20with%20my%20dashboard.';
const has = (text: string, q: string) => q.split(' ').filter(Boolean).every((w) => text.includes(w));

export default function AppHelp() {
  const path = usePathname() || '/';
  const router = useRouter();
  const [inApp, setInApp] = useState(false);
  const [open, setOpen] = useState(false);
  const [guide, setGuide] = useState(false);
  const [q, setQ] = useState('');
  const [at, setAt] = useState(0);
  const [data, setData] = useState<{ hq: boolean; scripts: any[]; calls: any[]; campaigns: any[] } | null>(null);
  const box = useRef<HTMLInputElement>(null);

  // Only on signed-in pages, which are the ones with the dashboard menu.
  useEffect(() => {
    const check = () => setInApp(!!document.querySelector('[data-testid=sidebar]'));
    check();
    const t = setTimeout(check, 700);
    setOpen(false); setGuide(false);
    return () => clearTimeout(t);
  }, [path]);

  useEffect(() => {
    if (!inApp) return;
    const key = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setGuide(false); setOpen((v) => !v); }
      else if (e.key === 'Escape') { setOpen(false); setGuide(false); }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [inApp]);

  // Names to search are fetched the first time search opens, never on page load.
  useEffect(() => {
    if (!open) return;
    setQ(''); setAt(0);
    setTimeout(() => box.current?.focus(), 30);
    if (data) return;
    const get = (u: string) => fetch(u).then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
    Promise.all([get('/api/auth/me'), get('/api/scripts'), get('/api/calls?limit=200'), get('/api/campaigns')])
      .then(([me, s, c, k]: any[]) => setData({ hq: !!me?.hq, scripts: s?.scripts || [], calls: c?.calls || [], campaigns: k?.campaigns || [] }));
  }, [open]);

  const hits = useMemo<Hit[]>(() => {
    const text = q.trim().toLowerCase();
    const pages = PAGES.filter((p) => (!p.hq || data?.hq) && (!text ? !p.hq : has(`${p.label} ${p.words || ''}`.toLowerCase(), text)))
      .slice(0, text ? 6 : 8).map((p) => ({ group: 'Pages', label: p.label, href: p.href }));
    if (!text || !data) return pages;
    const emp = data.scripts.filter((s) => has(String(s.name || '').toLowerCase(), text)).slice(0, 5)
      .map((s) => ({ group: 'AI Employees', label: s.name, sub: 'Open to edit', href: `/agents/new?id=${s.id}` }));
    const seen = new Set<string>();
    const calls = data.calls.filter((c) => c.caller_phone || !NO_NAME.test(c.caller_name || '')).filter((c) => has(`${c.caller_name || ''} ${c.caller_phone || ''}`.toLowerCase(), text)).filter((c) => {
      const k = `${c.caller_name || ''}|${c.caller_phone || ''}`; if (seen.has(k)) return false; seen.add(k); return true;
    }).slice(0, 5).map((c) => ({ group: 'Callers', label: realName(c.caller_name) || c.caller_phone || 'Unknown caller', sub: [realName(c.caller_name) ? c.caller_phone : '', String(c.lead_status || '').split('_').join(' ')].filter(Boolean).join(' · '), href: `/calls?q=${encodeURIComponent(c.caller_phone || c.caller_name || '')}` }));
    const camps = data.campaigns.filter((c) => has(String(c.name || '').toLowerCase(), text)).slice(0, 5)
      .map((c) => ({ group: 'Campaigns', label: c.name, sub: c.status, href: `/outbound/${c.id}` }));
    return [...pages, ...emp, ...calls, ...camps];
  }, [q, data]);

  // A result on the page you are already on reloads it, so its filter is applied.
  const go = (h?: Hit) => { if (!h) return; setOpen(false); if (h.href.split('?')[0] === path && h.href.includes('?')) window.location.assign(h.href); else router.push(h.href); };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setAt((i) => Math.min(i + 1, hits.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setAt((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); go(hits[at]); }
  };

  if (!inApp) return null;
  const g = GUIDES.filter(([p]) => (p === '/' ? path === '/' : path === p || path.startsWith(p + '/'))).sort((a, b) => b[0].length - a[0].length)[0]?.[1];
  const btn = 'flex h-10 items-center gap-2 rounded-full border border-line bg-raised px-3.5 text-[12.5px] font-semibold text-ink-soft shadow-lg transition-colors hover:border-signal/60 hover:text-ink';

  return (
    <>
      <div className='fixed bottom-4 right-4 z-30 flex items-center gap-2' data-testid='app-help'>
        <button type='button' onClick={() => { setGuide(false); setOpen(true); }} className={btn} aria-label='Search' data-testid='search-open'>
          <svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden><path d='M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3' /></svg>
          <span className='hidden sm:inline'>Search</span>
          <kbd className='hidden rounded border border-line px-1.5 py-px font-mono text-[10.5px] sm:inline'>Ctrl K</kbd>
        </button>
        {g && <button type='button' onClick={() => setGuide((v) => !v)} className={`${btn} w-10 justify-center px-0`} aria-label='About this page' aria-expanded={guide} data-testid='guide-open'>?</button>}
      </div>

      {guide && g && (
        <div className='fixed bottom-16 right-4 z-30 w-[300px] max-w-[calc(100vw-32px)] rounded-2xl border border-line bg-raised p-4 shadow-xl' role='dialog' aria-label='About this page' data-testid='guide'>
          <div className='flex items-start justify-between gap-3'>
            <div className='font-display text-[15px] font-semibold'>{g.title}</div>
            <button type='button' onClick={() => setGuide(false)} aria-label='Close' className='leading-none text-ink-soft hover:text-ink'>×</button>
          </div>
          <div className='mt-1 text-[12.5px] leading-relaxed text-ink-soft'>{g.what}</div>
          <ul className='mt-3 flex flex-col gap-1.5'>
            {g.tips.map((t) => <li key={t} className='flex gap-2 text-[12.5px] leading-relaxed'><span className='mt-[7px] h-1 w-1 shrink-0 rounded-full bg-signal' />{t}</li>)}
          </ul>
          <a href={WA_HELP} target='_blank' rel='noopener noreferrer' className='mt-3 block text-[12.5px] font-semibold text-signal'>Still stuck? Ask us on WhatsApp →</a>
        </div>
      )}

      {open && (
        <div className='fixed inset-0 z-[70] flex items-start justify-center bg-black/60 p-4 pt-[12vh]' onClick={() => setOpen(false)}>
          <div className='w-full max-w-[560px] overflow-hidden rounded-2xl border border-line bg-raised shadow-2xl' onClick={(e) => e.stopPropagation()} role='dialog' aria-label='Search' data-testid='search'>
            <input ref={box} value={q} onChange={(e) => { setQ(e.target.value); setAt(0); }} onKeyDown={onKey} placeholder='Search pages, employees, callers, campaigns' aria-label='Search'
              className='h-12 w-full border-b border-line bg-transparent px-4 text-[14.5px] outline-none placeholder:text-ink-soft/60' data-testid='search-input' />
            <div className='max-h-[52vh] overflow-y-auto p-2'>
              {hits.length === 0 && <div className='px-3 py-6 text-center text-[13px] text-ink-soft'>{data ? 'Nothing found. Try a page name, a caller name or a phone number.' : 'Loading…'}</div>}
              {hits.map((h, i) => (
                <div key={`${h.group}${h.href}${i}`}>
                  {(i === 0 || hits[i - 1].group !== h.group) && <div className='px-3 pb-1 pt-2 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-soft/60'>{h.group}</div>}
                  <button type='button' onClick={() => go(h)} onMouseEnter={() => setAt(i)} data-testid='search-hit'
                    className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-[13.5px] ${i === at ? 'bg-signal-tint text-signal' : ''}`}>
                    <span className='truncate font-medium'>{h.label}</span>
                    {h.sub && <span className='shrink-0 truncate text-[12px] text-ink-soft'>{h.sub}</span>}
                  </button>
                </div>
              ))}
            </div>
            <div className='flex justify-between border-t border-line px-4 py-2 text-[11px] text-ink-soft'>
              <span>↑ ↓ to move · Enter to open · Esc to close</span>
              {!data && q.trim() && <span>Loading names…</span>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
