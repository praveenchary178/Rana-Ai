// @ts-nocheck
'use client';
// The dashboard menu. Four short groups in plain words for customers; RANA HQ tools sit in their own
// collapsible section. On phones the menu is a drawer opened from a floating Menu button.
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { setDisplayZone, fmtNum, fmtClock } from '@/lib/format';
import { Logo } from './Logo';

// Re-exported for existing imports; new code should import from '@/components/Logo'.
export { Logo };

type Client = {
  id: string; name: string; industry: string; sarvam_app_id: string | null;
  hq?: boolean; actingAsHq?: boolean; pending?: boolean; hqSession?: { readOnly: boolean; expiresAt: number | null; reason: string | null } | null;
  plan?: { key: string; name: string; status: string; trialDaysLeft: number | null; minutesUsed: number; minutesIncluded: number } | null;
  user?: { name: string | null; email: string; designation?: string | null; roleLabel?: string; personal?: boolean } | null;
} | null;

const PATHS: Record<string, string> = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  people: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  mic: 'M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v4',
  pulse: 'M22 12h-4l-3 9L9 3l-3 9H2',
  inbound: 'M17 7 7 17M16 17H7V8',
  megaphone: 'M3 11v3a1 1 0 0 0 1 1h2l4 5V5L6 10H4a1 1 0 0 0-1 1zM15 8a4 4 0 0 1 0 8M18 5a8 8 0 0 1 0 14',
  table: 'M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 9h18M3 15h18M9 3v18',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
  phone: 'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z',
  card: 'M1 6a2 2 0 0 1 2-2h18a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2zM1 10h22',
  sliders: 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6',
  bag: 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0',
  building: 'M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1',
  radar: 'M9 12a3 3 0 1 0 6 0 3 3 0 1 0-6 0M16.2 7.8a6 6 0 0 1 0 8.4M7.8 16.2a6 6 0 0 1 0-8.4M19.1 4.9a10 10 0 0 1 0 14.2M4.9 19.1a10 10 0 0 1 0-14.2',
  star: 'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21 7 14.2 2 9.3l6.9-1z',
  globe: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z',
  chat: 'M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z',
  target: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  inbox: 'M22 12h-6l-2 3h-4l-2-3H2M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.1z',
  send: 'M22 2 11 13M22 2l-7 20-4-9-9-4z',
  wallet: 'M20 12V8H6a2 2 0 0 1 0-4h12v4M4 6v12a2 2 0 0 0 2 2h14v-4M18 12a2 2 0 0 0 0 4h4v-4z',
  wave: 'M2 12h2M6 8v8M10 4v16M14 7v10M18 10v4M22 12h.01',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  login: 'M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3',
  film: 'M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM7 3v18M17 3v18M3 8h4M3 16h4M17 8h4M17 16h4',
  chev: 'm6 9 6 6 6-6',
  menu: 'M3 6h18M3 12h18M3 18h18',
  x: 'M18 6 6 18M6 6l12 12',
  help: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
};
function Icon({ name, size = 16 }: { name: string; size?: number }) {
  return <svg width={size} height={size} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.9' strokeLinecap='round' strokeLinejoin='round' aria-hidden><path d={PATHS[name]} /></svg>;
}

// AN Farms' row in `clients`: kept as a plain string here (not imported from lib/anFarmsOrders)
// so this client component never pulls that server-only module (SUPABASE_SERVICE_KEY) into the browser bundle.
const AN_FARMS_CLIENT_ID = '35c7498b-3172-4123-8a89-c4fe597634ce';

type Item = { key: string; label: string; href: string; icon: string; tid?: string };

// What every customer sees. Building an employee starts on AI Employees; every call (incoming, outgoing, live view) is under Calls.
const GROUPS: { label: string; items: Item[] }[] = [
  { label: 'Start', items: [
    { key: 'overview', label: 'Home', href: '/', icon: 'home' },
    { key: 'employees', label: 'AI Employees', href: '/employees', icon: 'people' },
    { key: 'talk', label: 'Test a call', href: '/talk', icon: 'mic' },
  ] },
  { label: 'Calls', items: [
    { key: 'calls', label: 'Calls', href: '/calls', icon: 'pulse' },
    { key: 'outbound', label: 'Campaigns', href: '/outbound', icon: 'megaphone' },
  ] },
  { label: 'Results', items: [
    { key: 'leads-results', label: 'Leads & reports', href: '/reports', icon: 'table' },
    { key: 'alerts', label: 'Lead alerts', href: '/integrations', icon: 'bell' },
  ] },
  { label: 'Account', items: [
    { key: 'phone-numbers', label: 'Phone numbers', href: '/phone-numbers', icon: 'phone' },
    { key: 'billing', label: 'Plan & billing', href: '/billing', icon: 'card' },
    { key: 'settings', label: 'Settings', href: '/settings', icon: 'sliders' },
  ] },
];
const ORDERS: Item = { key: 'orders', label: 'Orders', href: '/orders', icon: 'bag' };

// RANA HQ only.
const HQ_GROUPS: { label: string; items: Item[] }[] = [
  { label: 'Clients', items: [
    { key: 'hq', label: 'All clients', href: '/hq', icon: 'building', tid: 'hq-link' },
    { key: 'hq-command', label: 'Command centre', href: '/hq/command', icon: 'radar', tid: 'hq-command-nav' },
  ] },
  { label: 'Sales', items: [
    { key: 'hq-demos', label: 'Demo requests', href: '/hq/demos', icon: 'star', tid: 'hq-demos-nav' },
    { key: 'hq-leads', label: 'Website leads', href: '/hq/leads', icon: 'globe', tid: 'hq-leads-nav' },
    { key: 'hq-chats', label: 'Website chats', href: '/hq/chats', icon: 'chat', tid: 'hq-chats-nav' },
    { key: 'hq-crm', label: 'Sales CRM', href: '/hq/crm', icon: 'target', tid: 'hq-crm-nav' },
    { key: 'hq-inbox', label: 'Instagram & FB inbox', href: '/hq/inbox', icon: 'inbox', tid: 'hq-inbox-nav' },
    { key: 'hq-outbound', label: 'Outbound (LeadFlow)', href: '/hq/outbound', icon: 'send', tid: 'hq-outbound-nav' },
  ] },
  { label: 'Operations', items: [
    { key: 'hq-money', label: 'Money & credits', href: '/hq/money', icon: 'wallet', tid: 'hq-money-nav' },
    { key: 'hq-voices', label: 'Voice engines', href: '/hq/voices', icon: 'wave', tid: 'hq-voices-nav' },
    { key: 'hq-numbers', label: 'Phone numbers', href: '/hq/numbers', icon: 'phone', tid: 'hq-numbers-nav' },
    { key: 'hq-team', label: 'Team & security', href: '/hq/team', icon: 'shield', tid: 'hq-team-nav' },
    { key: 'hq-signins', label: 'Sign-ins', href: '/hq/sign-ins', icon: 'login', tid: 'hq-signins-nav' },
    { key: 'hq-reel', label: 'Reel studio', href: '/hq/reel', icon: 'film', tid: 'hq-reel-nav' },
  ] },
];
const ALL_HREFS = [...GROUPS, ...HQ_GROUPS].flatMap((g) => g.items.map((i) => i.href)).concat(ORDERS.href);
// Pages without their own menu item light up the item they belong to.
const HOME_OF: [string, string][] = [['/agents', '/employees'], ['/builder', '/employees'], ['/scripts', '/employees'], ['/live', '/calls'], ['/inbound', '/calls']];

const HQ_KEY = 'rana_hq_nav';
const label = 'px-3 pb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-soft/60';

export default function Sidebar({ active, client: clientProp }: { active: string; client?: Client }) {
  const router = useRouter();
  const pathname = usePathname() || '/';
  const [client, setClient] = useState<Client>(clientProp ?? null);
  const [drawer, setDrawer] = useState(false);
  const [hqOpen, setHqOpen] = useState(true);
  useEffect(() => {
    if (clientProp) { setClient(clientProp); return; }
    fetch('/api/auth/me').then((r) => (r.ok ? r.json() : null)).then((c) => c && setClient(c)).catch(() => {});
  }, [clientProp]);
  // Show times in this client's own zone. First visit (or a switch to another workspace) reloads once.
  useEffect(() => {
    const c: any = client;
    if (!c?.timezone) return;
    if (setDisplayZone(c.timezone, c.locale)) {
      try { if (sessionStorage.getItem('rana_tz_reload') === c.timezone) return; sessionStorage.setItem('rana_tz_reload', c.timezone); } catch {}
      window.location.reload();
    }
  }, [client]);
  useEffect(() => { setDrawer(false); }, [pathname]);
  useEffect(() => { try { if (localStorage.getItem(HQ_KEY) === '0' && !pathname.startsWith('/hq')) setHqOpen(false); } catch {} }, []);
  const flipHq = () => setHqOpen((v) => { try { localStorage.setItem(HQ_KEY, v ? '0' : '1'); } catch {} return !v; });

  // Sales CRM badge: my leads to call (overdue or due today).
  const [crmDue, setCrmDue] = useState(0);
  const [inboxDue, setInboxDue] = useState(0);
  const isHq = !!(client as any)?.hq;
  useEffect(() => {
    if (!isHq) return;
    fetch('/api/hq/crm/due').then((r) => (r.ok ? r.json() : null)).then((j) => j && setCrmDue(Number(j.due) || 0)).catch(() => {});
    fetch('/api/hq/inbox/due').then((r) => (r.ok ? r.json() : null)).then((j) => j && setInboxDue(Number(j.due) || 0)).catch(() => {});
  }, [isHq]);
  async function backToHq() {
    const r = await fetch('/api/hq/return', { method: 'POST' });
    if (r.ok) window.location.href = '/hq';
  }
  // AN Farms only: badge the Orders item with orders still needing a telecaller follow-up.
  const isAnFarms = client?.id === AN_FARMS_CLIENT_ID;
  const [ordersDue, setOrdersDue] = useState(0);
  useEffect(() => {
    if (!isAnFarms) return;
    fetch('/api/orders?limit=1').then((r) => (r.ok ? r.json() : null))
      .then((j) => j?.counts && setOrdersDue(Number(j.counts.pending_call || 0)))
      .catch(() => {});
  }, [isAnFarms]);
  const p = client?.plan;
  const low = p && (p.status === 'suspended' || (p.trialDaysLeft !== null && p.trialDaysLeft <= 3) || p.minutesUsed >= p.minutesIncluded * 0.8);
  async function handleLogout() {
    await fetch('/api/auth/me', { method: 'POST' });
    router.push('/login');
  }

  // The item for the page being viewed: the longest menu address the page address starts with, else the page's own key.
  const home = HOME_OF.find(([from]) => pathname === from || pathname.startsWith(from + '/'));
  const here = home ? home[1] : pathname;
  const match = ALL_HREFS.filter((h) => (h === '/' ? here === '/' : here === h || here.startsWith(h + '/'))).sort((a, b) => b.length - a.length)[0];
  const isOn = (i: Item) => (match ? i.href === match : i.key === active);
  const badges: Record<string, [number, string, string, string]> = {
    'hq-crm': [crmDue, 'bg-miss', 'Your leads to call today or overdue, plus your tasks due today', 'hq-crm-due'],
    'hq-inbox': [inboxDue, 'bg-hot', 'Unread chats or chats that need a person', 'hq-inbox-due'],
    orders: [ordersDue, 'bg-hot', 'Orders waiting on a telecaller follow-up', 'orders-due'],
  };
  const row = (i: Item) => {
    const on = isOn(i), b = badges[i.key];
    return (
      <Link key={i.key} href={i.href} data-testid={i.tid} aria-current={on ? 'page' : undefined}
        className={`relative flex items-center gap-[11px] rounded-lg px-3 py-[8px] text-[13.5px] transition-colors ${on ? 'bg-signal-tint font-semibold text-signal' : 'font-medium text-ink-soft hover:bg-raised hover:text-ink'}`}>
        {on && <span className='absolute -left-4 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-signal shadow-glow' />}
        <span className={on ? 'text-signal' : 'opacity-80'}><Icon name={i.icon} /></span>
        <span className='truncate'>{i.label}</span>
        {b && b[0] > 0 && <span className={`ml-auto min-w-[18px] rounded-full px-1.5 text-center text-[10.5px] font-semibold text-white ${b[1]}`} title={b[2]} data-testid={b[3]}>{b[0]}</span>}
      </Link>
    );
  };

  return (
    <>
      {/* Phones: the menu opens from this button. */}
      <button type='button' onClick={() => setDrawer(true)} aria-label='Open menu' data-testid='nav-open'
        className='fixed bottom-4 left-4 z-40 flex h-11 items-center gap-2 rounded-full border border-line bg-raised px-4 text-[13px] font-semibold shadow-lg md:hidden'>
        <Icon name='menu' /> Menu
      </button>
      {drawer && <div className='fixed inset-0 z-40 bg-black/60 md:hidden' onClick={() => setDrawer(false)} aria-hidden />}

      <aside className={`glass fixed inset-y-0 left-0 z-50 box-border flex h-screen w-[280px] shrink-0 flex-col gap-5 overflow-y-auto border-r border-line px-4 py-5 transition-transform duration-200 md:sticky md:top-0 md:z-30 md:w-[244px] md:translate-x-0 ${drawer ? 'translate-x-0' : '-translate-x-full'}`} data-testid='sidebar'>
        <div className='flex items-center justify-between'>
          <Link href='/' className='group flex items-center gap-2.5 px-1.5'>
            <Logo />
            <span className='font-display text-[17px] font-semibold tracking-tight'>RANA<span className='text-gradient'> AI</span></span>
          </Link>
          <button type='button' onClick={() => setDrawer(false)} aria-label='Close menu' className='grid h-8 w-8 place-items-center rounded-lg text-ink-soft hover:bg-raised md:hidden'><Icon name='x' /></button>
        </div>

        {client?.actingAsHq && (
          <div className='rounded-xl border border-hot/30 bg-hot-tint px-3 py-2.5 text-[11.5px] leading-snug' data-testid='hq-acting'>
            <div className='flex items-center gap-1.5 font-semibold text-hot'><span className='h-1.5 w-1.5 rounded-full bg-hot' />RANA HQ inside this workspace</div>
            <div className='mt-0.5 text-ink-soft'>{client.hqSession?.readOnly ? 'Read-only visit: nothing can be changed.' : 'Changes you make are logged in their activity.'}{client.hqSession?.expiresAt ? ` Ends ${fmtClock(client.hqSession.expiresAt)}.` : ''}</div>
            <button onClick={backToHq} className='mt-1.5 font-semibold text-signal'>← Back to HQ</button>
          </div>
        )}
        {client?.pending && (
          <div className='rounded-xl border border-hot/30 bg-hot-tint px-3 py-2.5 text-[11.5px] leading-snug' data-testid='pending-banner'>
            <div className='font-semibold text-hot'>Waiting for approval</div>
            <div className='text-ink-soft'>Build your AI employee now. Calling switches on when RANA starts your trial.</div>
          </div>
        )}

        {client?.hq && (
          <div className='rounded-xl border border-line bg-sunken/60 p-2' data-testid='hq-nav'>
            <button type='button' onClick={flipHq} aria-expanded={hqOpen} className='flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[12.5px] font-semibold hover:bg-raised'>
              <span className='live-dot h-2 w-2 rounded-full bg-signal' /> RANA HQ
              {!hqOpen && crmDue + inboxDue > 0 && <span className='rounded-full bg-hot px-1.5 text-[10.5px] font-semibold text-white'>{crmDue + inboxDue}</span>}
              <span className={`ml-auto text-ink-soft transition-transform ${hqOpen ? 'rotate-180' : ''}`}><Icon name='chev' size={14} /></span>
            </button>
            {hqOpen && (
              <div className='mt-2 flex flex-col gap-3 pl-0'>
                {HQ_GROUPS.map((g) => (
                  <div key={g.label} className='flex flex-col gap-0.5'>
                    <div className={label}>{g.label}</div>
                    {g.items.map(row)}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <nav className='flex flex-col gap-5' aria-label='Dashboard'>
          {client?.hq && <div className='-mb-2 px-3 text-[11px] text-ink-soft/70'>This workspace</div>}
          {GROUPS.map((g) => (
            <div key={g.label} className='flex flex-col gap-0.5'>
              <div className={label}>{g.label}</div>
              {g.items.map(row)}
              {/* AN Farms only: orders placed on calls, with payment-collection follow-up tracking. */}
              {g.label === 'Calls' && isAnFarms && row(ORDERS)}
            </div>
          ))}
        </nav>

        <div className='mt-auto flex flex-col gap-2'>
          <a href='https://wa.me/917899793001?text=Hi%20RANA%20AI%2C%20I%20need%20help%20with%20my%20dashboard.' target='_blank' rel='noopener noreferrer' data-testid='nav-help'
            className='flex items-center gap-[11px] rounded-lg px-3 py-[8px] text-[13px] font-medium text-ink-soft hover:bg-raised hover:text-ink'>
            <span className='opacity-80'><Icon name='help' /></span>Help on WhatsApp
          </a>
          <ThemeToggle />
          <div className='flex flex-col gap-1 rounded-xl border border-line bg-raised p-3'>
            <div className='flex items-center gap-2.5'>
              <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-tint font-display text-[13px] font-bold text-violet'>{(client?.name ?? 'R').charAt(0).toUpperCase()}</div>
              <div className='min-w-0'>
                <div className='truncate text-[13px] font-semibold'>{client?.name ?? 'RANA AI'}</div>
                {client?.industry && <div className='truncate text-[11px] capitalize text-ink-soft'>{client.industry}</div>}
              </div>
            </div>
            {client?.user?.personal && (
              <div className='mt-1 truncate text-[11.5px] leading-snug' data-testid='signed-in-as' title={client.user.email}>
                <span className='font-semibold text-ink'>{client.user.name || client.user.email.split('@')[0]}</span>
                <span className='text-ink-soft'>{client.user.designation ? ` · ${client.user.designation}` : client.user.roleLabel ? ` · ${client.user.roleLabel}` : ''}</span>
              </div>
            )}
            {p && (
              <Link href='/billing' data-testid='plan-chip' className={`mt-1.5 rounded-lg border px-2.5 py-2 text-[11px] leading-snug ${low ? 'border-miss/30 bg-miss-tint text-miss' : 'border-line bg-sunken text-ink-soft'}`}>
                <div className='flex justify-between'><span className='font-semibold text-ink'>{p.status === 'suspended' ? 'Paused' : p.name}</span>
                <span>{p.trialDaysLeft !== null && p.status !== 'suspended' ? ` · ${p.trialDaysLeft} day${p.trialDaysLeft === 1 ? '' : 's'} left` : ''}</span></div>
                <div className='mt-1.5 h-1 overflow-hidden rounded-full bg-line'><div className={`h-full rounded-full ${low ? 'bg-miss' : 'bg-gradient-to-r from-signal to-violet'}`} style={{ width: `${Math.min(100, (p.minutesUsed / Math.max(1, p.minutesIncluded)) * 100)}%` }} /></div>
                <div className='mt-1 font-mono'>{Math.round(p.minutesUsed)} / {fmtNum(p.minutesIncluded)} min used</div>
              </Link>
            )}
            <button onClick={handleLogout} className='mt-1 flex items-center gap-1.5 text-left text-[11.5px] text-ink-soft hover:text-signal'><Icon name='logout' size={13} /> Sign out</button>
          </div>
        </div>
      </aside>
    </>
  );
}

export function ThemeToggle() {
  const [light, setLight] = useState(true);
  // Day is the default look of the dashboard; night is a choice the person makes here.
  useEffect(() => { setLight(!document.documentElement.classList.contains('app-night')); }, []);
  function flip() {
    const next = !light; setLight(next);
    document.documentElement.classList.toggle('app-night', !next);
    try { localStorage.setItem('rana_app_theme', next ? 'day' : 'night'); } catch {}
  }
  return (
    <button onClick={flip} data-testid='theme-toggle' className='flex items-center justify-between rounded-xl border border-line bg-raised px-3 py-2 text-[12px] text-ink-soft hover:text-ink'>
      <span className='flex items-center gap-2'>{light ? 'Day' : 'Night'} mode</span>
      <span className={`flex h-[18px] w-8 rounded-full p-[2px] ${light ? 'justify-start bg-line' : 'justify-end bg-signal/30'}`}><span className={`h-[14px] w-[14px] rounded-full ${light ? 'bg-ink-soft' : 'bg-signal'}`} /></span>
    </button>
  );
}
