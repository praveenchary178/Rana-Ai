'use client';
// Home: an overview first. A greeting, four headline numbers, calls over time and how they ended, what needs
// attention and the hot leads to call, then shortcuts. The funnel, campaigns and definitions sit under 'Full report'.
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import SetupChecklist from '@/components/SetupChecklist';
import StatusPill from '@/components/StatusPill';
import CallDrawer from '@/components/CallDrawer';
import type { CallRow, LeadStatus } from '@/lib/calls';
import { LEAD_LABEL, LEAD_TONE, fmtDuration, fmtPhone, fmtTimeAgo, fmtClock, fmtDate, fmtDay, fmtNum } from '@/lib/format';

/* ───────── types mirrored from /api/dashboard ───────── */
type Kpis = {
  total: number; dialled: number; received: number; connected: number; dnp: number; connectRate: number;
  engaged: number; interested: number; hot: number; readyToClose: number; warm: number; cold: number;
  notInterested: number; followUps: number; talkSeconds: number; avgTalk: number; leadRate: number;
};
type Lean = { id: string; direction: 'inbound' | 'outbound'; caller_name: string | null; caller_phone: string | null; duration_seconds: number; lead_status: LeadStatus; lead_reason: string | null; summary: string | null; created_at: string; follow_up: boolean };
type Campaign = { id: string; name: string; status: string; totalContacts: number | null; dialled: number; connected: number; dnp: number; connectRate: number; hot: number; warm: number; followUps: number; notInterested: number; talkSeconds: number; lastCallAt: string | null };
type Dash = {
  range: { key: string; from: string; to: string; label: string; days: number };
  previous: { from: string; to: string; label: string };
  direction: 'all' | 'inbound' | 'outbound';
  kpis: Kpis; previousKpis: Kpis; split: { inbound: Kpis; outbound: Kpis };
  hourly: { hour: number; inbound: number; outbound: number; connected: number }[];
  trend: { date: string; inbound: number; outbound: number; connected: number; hot: number }[];
  notConnected: { reason: string; count: number }[];
  leadMix: { status: LeadStatus; count: number }[];
  campaigns: Campaign[]; hotLeads: Lean[]; followUps: Lean[];
  definitions: { term: string; rule: string }[];
  generatedAt: string;
};
type Me = { name?: string; user?: { name?: string | null } | null; plan?: { name: string; status: string; trialDaysLeft: number | null; minutesUsed: number; minutesIncluded: number } | null } | null;

const IN_COLOR = 'rgb(var(--c-signal))';   // incoming: brand teal
const OUT_COLOR = 'rgb(var(--c-violet))';  // outgoing: violet (distinct hue from teal)
const ONE_HUE = 'rgb(var(--c-signal))';    // single-series magnitude bars (brand signal)

const RANGES = [
  { key: 'today', label: 'Today' }, { key: 'yesterday', label: 'Yesterday' },
  { key: '7d', label: '7 days' }, { key: '30d', label: '30 days' }, { key: 'custom', label: 'Custom' },
];
const DIRS = [{ key: 'all', label: 'All calls' }, { key: 'inbound', label: 'Incoming' }, { key: 'outbound', label: 'Outgoing' }] as const;
const SHORTCUTS = [
  { href: '/employees', title: 'New AI employee', sub: 'Build one or pick a ready-made one' },
  { href: '/talk', title: 'Test a call', sub: 'Talk to your employee right now' },
  { href: '/outbound', title: 'Start a campaign', sub: 'Call a list of numbers' },
  { href: '/reports', title: 'Download a report', sub: 'Leads and calls in Excel' },
];
const FULL_KEY = 'rana_home_full';

const n = (v: number) => fmtNum(v);
const talk = (s: number) => (s >= 3600 ? `${Math.floor(s / 3600)}h ${Math.round((s % 3600) / 60)}m` : fmtDuration(s));
const share = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : '—');
const plural = (v: number, one: string, many = `${one}s`) => `${n(v)} ${v === 1 ? one : many}`;
// Call notes sometimes carry raw seconds such as 4.755918367346939s; show them as 4.8s.
const tidy = (t: string) => t.replace(/([0-9]+)[.]([0-9]{3,})/g, (m) => String(Math.round(Number(m) * 10) / 10));

/* ───────── small pieces ───────── */
function Info({ text }: { text: string }) {
  return (
    <span className='group relative inline-flex'>
      <span className='h-[15px] w-[15px] cursor-help rounded-full border border-line text-center text-[9.5px] leading-[13px] text-ink-soft'>i</span>
      <span className='pointer-events-none absolute left-1/2 top-5 z-30 w-[240px] -translate-x-1/2 rounded-lg bg-ink px-3 py-2 text-[11.5px] leading-snug text-paper opacity-0 shadow-lg transition-opacity group-hover:opacity-100'>{text}</span>
    </span>
  );
}

function Delta({ cur, prev, invert = false, suffix = '' }: { cur: number; prev: number; invert?: boolean; suffix?: string }) {
  const d = Math.round((cur - prev) * 10) / 10;
  if (!prev && !cur) return <span className='text-[11.5px] text-ink-soft'>no activity before</span>;
  const good = invert ? d < 0 : d > 0;
  const tone = d === 0 ? 'text-ink-soft' : good ? 'text-signal' : 'text-miss';
  return <span className={`text-[11.5px] font-semibold ${tone}`}>{d > 0 ? '▲' : d < 0 ? '▼' : '•'} {Math.abs(d)}{suffix} <span className='font-normal text-ink-soft'>vs before</span></span>;
}

function Tile({ label, value, sub, info, delta, href, big = false }: { label: string; value: string; sub?: React.ReactNode; info: string; delta?: React.ReactNode; href?: string; big?: boolean }) {
  const body = (
    <div className='flex h-full flex-col gap-2 rounded-[14px] border border-line bg-raised px-5 py-5 transition-colors hover:border-ink-soft'>
      <div className='flex items-center gap-1.5 text-[12.5px] font-medium text-ink-soft'>{label}<Info text={info} /></div>
      <div className={`font-display font-semibold tabular-nums leading-none tracking-tight ${big ? 'text-[36px]' : 'text-[26px]'}`}>{value}</div>
      {sub && <div className='text-[12px] text-ink-soft'>{sub}</div>}
      {delta}
    </div>
  );
  return href ? <Link href={href} className='block'>{body}</Link> : body;
}

function Card({ title, info, right, children, className = '', id }: { title: string; info?: string; right?: React.ReactNode; children: React.ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={`flex min-w-0 flex-col rounded-[14px] border border-line bg-raised ${className}`}>
      <div className='flex items-center justify-between gap-3 px-5 pb-3 pt-4'>
        <div className='flex items-center gap-1.5 text-[14px] font-semibold'>{title}{info && <Info text={info} />}</div>
        {right}
      </div>
      <div className='min-w-0 flex-1 px-5 pb-5'>{children}</div>
    </section>
  );
}

function Legend() {
  return (
    <div className='flex items-center gap-3 text-[11.5px] text-ink-soft'>
      <span className='flex items-center gap-1.5'><span className='h-2.5 w-2.5 rounded-sm' style={{ background: IN_COLOR }} />Incoming</span>
      <span className='flex items-center gap-1.5'><span className='h-2.5 w-2.5 rounded-sm' style={{ background: OUT_COLOR }} />Outgoing</span>
    </div>
  );
}

/** Horizontal single-hue bars with value + share. Used for funnel, lead mix and not-answered reasons. */
function BarList({ items, max, color = ONE_HUE }: { items: { label: React.ReactNode; value: number; note?: string; color?: string }[]; max: number; color?: string }) {
  return (
    <div className='flex flex-col gap-2.5'>
      {items.map((it, i) => (
        <div key={i} className='grid grid-cols-[132px_1fr_auto] items-center gap-3 text-[12.5px]'>
          <div className='truncate text-ink'>{it.label}</div>
          <div className='h-[14px] overflow-hidden rounded-[4px] bg-paper' title={`${it.value}`}>
            <div className='h-full rounded-r-[4px]' style={{ width: `${max ? Math.max(it.value ? 2 : 0, (it.value / max) * 100) : 0}%`, background: it.color || color }} />
          </div>
          <div className='whitespace-nowrap text-right tabular-nums'><span className='font-semibold'>{n(it.value)}</span>{it.note && <span className='ml-1.5 text-ink-soft'>{it.note}</span>}</div>
        </div>
      ))}
    </div>
  );
}

/** Stacked columns incoming/outgoing with a 2px surface gap and a hover tooltip. */
function StackedColumns({ data, labelOf, height = 170 }: { data: { key: string; inbound: number; outbound: number; connected: number }[]; labelOf: (k: string, i: number) => string; height?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.inbound + d.outbound));
  const ticks = [0, Math.ceil(max / 2), max];
  const every = data.length > 16 ? 3 : data.length > 10 ? 2 : 1;
  return (
    <div className='relative'>
      <div className='flex gap-2'>
        <div className='flex flex-col justify-between pb-5 text-[10.5px] tabular-nums text-ink-soft' style={{ height }}>
          {[...ticks].reverse().map((t) => <span key={t}>{t}</span>)}
        </div>
        <div className='min-w-0 flex-1'>
          <div className='relative border-b border-line' style={{ height: height - 20 }}>
            {ticks.slice(1).map((t) => <div key={t} className='absolute left-0 right-0 border-t border-line/60' style={{ bottom: `${(t / max) * 100}%` }} />)}
            <div className='absolute inset-0 flex items-end gap-[3px]'>
              {data.map((d, i) => {
                const tot = d.inbound + d.outbound;
                const hIn = (d.inbound / max) * 100, hOut = (d.outbound / max) * 100;
                return (
                  <div key={d.key} className='flex h-full flex-1 cursor-default flex-col items-center justify-end'
                    onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                    <div className='flex h-full w-full max-w-[24px] flex-col justify-end' style={{ opacity: hover === null || hover === i ? 1 : 0.45 }}>
                      {d.outbound > 0 && <div style={{ height: `${hOut}%`, background: OUT_COLOR, borderRadius: '4px 4px 0 0', marginBottom: d.inbound > 0 ? 2 : 0 }} />}
                      {d.inbound > 0 && <div style={{ height: `${hIn}%`, background: IN_COLOR, borderRadius: d.outbound > 0 ? 0 : '4px 4px 0 0' }} />}
                      {tot === 0 && <div className='h-[2px] rounded bg-line' />}
                    </div>
                  </div>
                );
              })}
            </div>
            {hover !== null && (
              <div className='pointer-events-none absolute -top-2 z-20 whitespace-nowrap rounded-lg bg-ink px-3 py-2 text-[11.5px] text-paper shadow-lg'
                style={{ left: `${Math.min(80, Math.max(0, (hover / data.length) * 100 - 6))}%` }}>
                <div className='mb-0.5 font-semibold'>{labelOf(data[hover].key, hover)}</div>
                <div>Incoming {data[hover].inbound} · Outgoing {data[hover].outbound}</div>
                <div className='text-paper/70'>Answered {data[hover].connected} ({share(data[hover].connected, data[hover].inbound + data[hover].outbound)})</div>
              </div>
            )}
          </div>
          <div className='mt-1.5 flex gap-[3px]'>
            {data.map((d, i) => <div key={d.key} className='flex-1 truncate text-center text-[10px] text-ink-soft'>{i % every === 0 ? labelOf(d.key, i) : ''}</div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

function LeadRow({ c, onOpen }: { c: Lean; onOpen: (id: string) => void }) {
  return (
    <button onClick={() => onOpen(c.id)} className='-mx-2 flex w-full items-start gap-3 rounded-md border-b border-line px-2 py-3 text-left last:border-b-0 hover:bg-paper'>
      <span className='mt-1 h-2 w-2 shrink-0 rounded-full' style={{ background: c.direction === 'inbound' ? IN_COLOR : OUT_COLOR }} title={c.direction === 'inbound' ? 'Incoming' : 'Outgoing'} />
      <div className='min-w-0 flex-1'>
        <div className='flex items-center gap-2'>
          <span className='truncate text-[13.5px] font-semibold'>{c.caller_name || fmtPhone(c.caller_phone)}</span>
          <StatusPill label={LEAD_LABEL[c.lead_status]} tone={LEAD_TONE[c.lead_status]} />
        </div>
        <div className='truncate text-[12px] text-ink-soft'>{tidy(c.lead_reason || c.summary || '—')}</div>
      </div>
      <div className='shrink-0 text-right'>
        <div className='text-[12px] text-ink-soft'>{fmtTimeAgo(c.created_at)}</div>
        <div className='text-[11.5px] tabular-nums text-ink-soft'>{fmtDuration(c.duration_seconds)}</div>
      </div>
    </button>
  );
}

const DOT: Record<string, string> = { hot: 'bg-hot', signal: 'bg-signal', miss: 'bg-miss', soft: 'bg-ink-soft' };
function Attention({ tone, title, sub, href }: { tone: string; title: string; sub: string; href: string }) {
  return (
    <Link href={href} className='group -mx-2 flex items-start gap-3 rounded-lg px-2 py-2.5 hover:bg-paper' data-testid='attention-item'>
      <span className={`mt-[7px] h-2 w-2 shrink-0 rounded-full ${DOT[tone] || DOT.soft}`} />
      <span className='min-w-0 flex-1'>
        <span className='block text-[13.5px] font-semibold'>{title}</span>
        <span className='block text-[12px] text-ink-soft'>{sub}</span>
      </span>
      <span className='mt-0.5 text-ink-soft transition-transform group-hover:translate-x-0.5 group-hover:text-signal'>→</span>
    </Link>
  );
}

/* ───────── page ───────── */
export default function DashboardPage() {
  const [range, setRange] = useState('7d');
  const [dir, setDir] = useState<'all' | 'inbound' | 'outbound'>('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [data, setData] = useState<Dash | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showDefs, setShowDefs] = useState(false);
  const [selected, setSelected] = useState<CallRow | null>(null);
  const [me, setMe] = useState<Me>(null);
  const [hello, setHello] = useState('Welcome');
  const [full, setFull] = useState(false);

  useEffect(() => {
    const h = new Date().getHours();
    setHello(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening');
    try { setFull(localStorage.getItem(FULL_KEY) === '1'); } catch {}
    fetch('/api/auth/me').then((r) => (r.ok ? r.json() : null)).then((c) => c && setMe(c)).catch(() => {});
  }, []);
  const flipFull = () => setFull((v) => { try { localStorage.setItem(FULL_KEY, v ? '0' : '1'); } catch {} return !v; });

  async function load() {
    if (range === 'custom' && (!from || !to)) return;
    setLoading(true);
    try {
      const q = new URLSearchParams({ range, direction: dir });
      if (range === 'custom') { q.set('from', from); q.set('to', to); }
      const res = await fetch(`/api/dashboard?${q}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load');
      setData(json); setError('');
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); const t = setInterval(load, 60000); return () => clearInterval(t); }, [range, dir, from, to]);

  async function syncNow() {
    setSyncing(true);
    try { await fetch('/api/calls/sync', { method: 'POST' }); await load(); } finally { setSyncing(false); }
  }
  async function openCall(id: string) {
    const res = await fetch(`/api/calls/${id}`);
    const j = await res.json();
    if (res.ok) setSelected(j.call);
  }

  const k = data?.kpis, p = data?.previousKpis;
  const singleDay = (data?.range.days ?? 1) <= 1;
  const chartData = useMemo(() => {
    if (!data) return [];
    if (singleDay) {
      // Trim to the active window (first to last hour with calls, at least 9am to 9pm) so the columns stay readable.
      const active = data.hourly.map((h, i) => (h.inbound + h.outbound ? i : -1)).filter((i) => i >= 0);
      const lo = Math.min(9, ...(active.length ? active : [9])), hi = Math.max(21, ...(active.length ? active : [21]));
      return data.hourly.slice(lo, hi + 1).map((h) => ({ key: String(h.hour), inbound: h.inbound, outbound: h.outbound, connected: h.connected }));
    }
    return data.trend.map((d) => ({ key: d.date, inbound: d.inbound, outbound: d.outbound, connected: d.connected }));
  }, [data, singleDay]);
  const hourLabel = (key: string) => { const h = Number(key); return `${((h + 11) % 12) + 1}${h < 12 ? 'a' : 'p'}`; };
  const dayLabel = (key: string) => fmtDay(key);

  const dirLink = (extra = '') => (dir === 'outbound' ? `/outbound${extra}` : `/inbound${extra}`);
  const subtitle = data ? `${data.range.label} · ${fmtDate(data.range.from)}${data.range.days > 1 ? ` – ${fmtDate(new Date(Date.parse(data.range.to) - 1).toISOString())}` : ''}` : '';
  const first = (me?.user?.name || '').trim().split(' ')[0];

  const funnel = k ? [
    { label: dir === 'inbound' ? 'Received' : dir === 'outbound' ? 'Dialled' : 'All calls', value: k.total },
    { label: 'Answered', value: k.connected, note: share(k.connected, k.total) },
    { label: 'Talked 30s or more', value: k.engaged, note: share(k.engaged, k.connected) },
    { label: 'Interested', value: k.interested, note: share(k.interested, k.connected) },
    { label: 'Hot', value: k.hot, note: share(k.hot, k.connected) },
    { label: 'Ready to close', value: k.readyToClose, note: share(k.readyToClose, k.connected) },
  ] : [];
  const mixTotal = data ? data.leadMix.reduce((a, m) => a + m.count, 0) : 0;
  const empty = data && data.kpis.total === 0;
  const missed = k ? (dir === 'inbound' ? k.total - k.connected : k.dnp) : 0;

  // What needs the customer today, most valuable first.
  const plan = me?.plan;
  const used = plan ? Math.round((plan.minutesUsed / Math.max(1, plan.minutesIncluded)) * 100) : 0;
  const planNote = !plan ? null
    : plan.status === 'suspended' ? 'Calling is paused on your plan'
    : plan.trialDaysLeft !== null && plan.trialDaysLeft <= 3 ? `${plural(plan.trialDaysLeft, 'day')} left in your trial`
    : used >= 80 ? `${used}% of your plan minutes are used` : null;
  const attention = k ? [
    k.hot > 0 && { tone: 'hot', title: `${plural(k.hot, 'hot lead')} to call`, sub: 'They asked a buying question. Call while it is fresh.', href: '#hot-leads' },
    k.followUps > 0 && { tone: 'signal', title: `${plural(k.followUps, 'caller')} asked for a call back`, sub: 'Follow-ups for your sales team.', href: '#follow-ups' },
    missed > 0 && { tone: 'soft', title: `${plural(missed, 'call')} not answered`, sub: dir === 'inbound' ? 'Callers who did not get through.' : 'Busy or no answer. Worth retrying at another hour.', href: dirLink('?filter=missed') },
    planNote && { tone: 'miss', title: planNote, sub: 'Open Plan & billing to keep your calls running.', href: '/billing' },
  ].filter(Boolean) as { tone: string; title: string; sub: string; href: string }[] : [];

  const pill = (on: boolean, accent = false) => `rounded-md px-3 py-1.5 text-[12.5px] font-semibold ${on ? (accent ? 'bg-signal text-on-accent' : 'bg-ink text-paper') : 'text-ink-soft hover:text-ink'}`;

  return (
    <div className='flex min-h-screen bg-paper'>
      <Sidebar active='overview' />
      <main className='box-border flex min-w-0 flex-1 flex-col gap-5 px-5 py-7 pb-20 md:pb-8 lg:px-10'>
        {/* Greeting */}
        <div className='flex flex-wrap items-end justify-between gap-4'>
          <div>
            <h1 className='m-0 font-display text-[26px] font-semibold tracking-tight' data-testid='home-hello'>{hello}{first ? `, ${first}` : ''}</h1>
            <div className='mt-1 text-[13.5px] text-ink-soft'>Here is how your AI employees are doing{subtitle ? ` · ${subtitle}` : ''}.</div>
          </div>
          <div className='flex flex-wrap items-center gap-2'>
            <span className='text-[11.5px] text-ink-soft'>{data ? `Updated ${fmtClock(data.generatedAt)}` : ''}</span>
            <button onClick={syncNow} disabled={syncing} className='rounded-lg border border-line bg-raised px-3 py-1.5 text-[12.5px] font-semibold hover:border-ink-soft disabled:opacity-50'>
              {syncing ? 'Refreshing…' : '↻ Refresh calls'}
            </button>
          </div>
        </div>

        <SetupChecklist />

        {/* Period */}
        <div className='flex flex-wrap items-center gap-3'>
          <div className='flex flex-wrap gap-1 rounded-[10px] border border-line bg-raised p-1'>
            {RANGES.map((r) => <button key={r.key} onClick={() => setRange(r.key)} className={pill(range === r.key, true)}>{r.label}</button>)}
          </div>
          <div className='flex gap-1 rounded-[10px] border border-line bg-raised p-1'>
            {DIRS.map((d) => (
              <button key={d.key} onClick={() => setDir(d.key)} className={`flex items-center gap-1.5 ${pill(dir === d.key)}`}>
                {d.key !== 'all' && <span className='h-2 w-2 rounded-full' style={{ background: d.key === 'inbound' ? IN_COLOR : OUT_COLOR }} />}
                {d.label}
              </button>
            ))}
          </div>
          {range === 'custom' && (
            <div className='flex items-center gap-1.5 text-[12.5px]'>
              <input type='date' value={from} onChange={(e) => setFrom(e.target.value)} className='rounded-md border border-line bg-raised px-2 py-1.5' />
              <span className='text-ink-soft'>to</span>
              <input type='date' value={to} onChange={(e) => setTo(e.target.value)} className='rounded-md border border-line bg-raised px-2 py-1.5' />
            </div>
          )}
          {data && <span className='text-[12px] text-ink-soft'>▲▼ compared with {data.previous.label}</span>}
          {loading && <span className='text-[12px] text-ink-soft'>Loading…</span>}
        </div>

        {error && <div className='rounded-lg bg-miss-tint px-3 py-2.5 text-[12.5px] text-miss'>{error}</div>}

        {empty && (
          <div className='rounded-[14px] border border-dashed border-line bg-raised px-5 py-4 text-[13px] text-ink-soft' data-testid='home-empty'>
            <span className='font-semibold text-ink'>No calls in this period yet.</span> New calls appear here by themselves. To get your first one: publish an employee on{' '}
            <Link href='/employees' className='font-semibold text-signal'>AI Employees</Link>, try it on <Link href='/talk' className='font-semibold text-signal'>Test a call</Link>, then connect a number on{' '}
            <Link href='/phone-numbers' className='font-semibold text-signal'>Phone numbers</Link> or start a <Link href='/outbound' className='font-semibold text-signal'>campaign</Link>. Or pick a longer period above.
          </div>
        )}

        {/* Headline numbers */}
        <div className='grid grid-cols-2 gap-3 xl:grid-cols-4' data-testid='home-tiles'>
          <Tile big label={dir === 'outbound' ? 'Numbers dialled' : dir === 'inbound' ? 'Calls received' : 'Total calls'} value={k ? n(k.total) : '—'}
            sub={k && dir === 'all' ? <>{n(k.received)} incoming · {n(k.dialled)} outgoing</> : undefined}
            info='Every call in the selected period. Outgoing counts every number dialled, answered or not. Incoming counts every call that reached your AI employee.'
            delta={k && p && <Delta cur={k.total} prev={p.total} />} href={dirLink()} />
          <Tile big label='Answered' value={k ? n(k.connected) : '—'} sub={k ? <>{k.connectRate}% of all calls</> : undefined}
            info='Calls that were picked up and had talk time. The percentage is answered calls out of all calls.'
            delta={k && p && <Delta cur={k.connectRate} prev={p.connectRate} suffix=' pts' />} />
          <Tile big label='Interested leads' value={k ? n(k.interested) : '—'} sub={k ? <>{k.leadRate}% of answered calls</> : undefined}
            info='Warm, hot and ready-to-close callers together.'
            delta={k && p && <Delta cur={k.interested} prev={p.interested} />} href={dirLink('?filter=warm')} />
          <Tile big label='Hot leads' value={k ? n(k.hot) : '—'} sub={k ? <>{n(k.readyToClose)} ready to close</> : undefined}
            info='Callers who asked a buying question (fees, price, timing and so on) and talked for a minute or more, or who said they want to go ahead.'
            delta={k && p && <Delta cur={k.hot} prev={p.hot} />} href={dirLink('?filter=hot')} />
        </div>

        {/* Overview: how many calls over time, and how they ended */}
        {!empty && (
          <div className='grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]' data-testid='home-overview'>
          <Card title={singleDay ? 'Calls by hour' : 'Calls by day'} info='Incoming and outgoing calls stacked. Hover a column for the answered count.' right={<Legend />}>
            {data ? <StackedColumns data={chartData} labelOf={singleDay ? hourLabel : dayLabel} height={220} /> : <div className='h-[220px]' />}
          </Card>
          <Card title='How calls ended' info='Every call gets exactly one label. Open any call to see the rule that assigned it.' right={<span className='text-[11.5px] text-ink-soft'>{n(mixTotal)} calls</span>}>
            <BarList max={Math.max(1, ...(data?.leadMix.map((m) => m.count) || [1]))}
              items={(data?.leadMix || []).filter((m) => m.status !== 'new' || m.count > 0).map((m) => ({
                label: <StatusPill label={m.status === 'no_answer' ? 'Not answered' : LEAD_LABEL[m.status]} tone={LEAD_TONE[m.status]} />,
                value: m.count, note: share(m.count, mixTotal),
                color: m.status === 'no_answer' || m.status === 'not_interested' || m.status === 'new' ? 'rgb(var(--c-ink-soft))' : undefined,
              }))} />
          </Card>
          </div>
        )}

        {/* What to do now */}
        <div className='grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1.35fr]'>
          <Card title='Needs your attention' info='The few things worth acting on in this period, most valuable first.'>
            {!data ? null : attention.length ? attention.map((a) => <Attention key={a.title} {...a} />)
              : <div className='py-6 text-center text-[13px] text-ink-soft' data-testid='attention-clear'>All clear. Nothing needs you right now.</div>}
          </Card>
          <Card id='hot-leads' title='Hot leads to call now' info='Ready to close first, then hot, newest first. Each line shows why RANA marked it hot.' right={<span className='text-[11.5px] text-ink-soft'>{k ? n(k.hot) : ''}</span>}>
            {data?.hotLeads.length ? data.hotLeads.map((c) => <LeadRow key={c.id} c={c} onOpen={openCall} />)
              : data ? <div className='py-6 text-center text-[13px] text-ink-soft'>No hot leads in this period yet.</div> : null}
          </Card>
        </div>
        {!!data?.followUps.length && (
          <Card id='follow-ups' title='Asked for a call back' info='Callers who asked to be called back, not counting the hot leads listed above.'>
            {data.followUps.map((c) => <LeadRow key={c.id} c={c} onOpen={openCall} />)}
          </Card>
        )}

        {/* Shortcuts: after the numbers, so the page opens on results */}
        <div className='grid grid-cols-2 gap-3 xl:grid-cols-4' data-testid='home-shortcuts'>
          {SHORTCUTS.map((s) => (
            <Link key={s.href} href={s.href} className='group flex items-center justify-between gap-3 rounded-[14px] border border-line bg-raised px-4 py-3 transition-colors hover:border-signal/60'>
              <span className='min-w-0'>
                <span className='block text-[13.5px] font-semibold leading-snug'>{s.title}</span>
                <span className='hidden truncate text-[12px] text-ink-soft sm:block'>{s.sub}</span>
              </span>
              <span className='text-ink-soft transition-transform group-hover:translate-x-0.5 group-hover:text-signal'>→</span>
            </Link>
          ))}
        </div>

        {/* Full report */}
        <button onClick={flipFull} aria-expanded={full} data-testid='home-full-toggle'
          className='flex items-center justify-between rounded-[14px] border border-line bg-raised px-5 py-3.5 text-left text-[14px] font-semibold hover:border-ink-soft'>
          <span>Full report <span className='ml-1 text-[12.5px] font-normal text-ink-soft'>Funnel, campaigns and how every number is counted</span></span>
          <span className='text-[12.5px] font-normal text-signal'>{full ? 'Hide' : 'Show'}</span>
        </button>

        {full && (
          <div className='flex flex-col gap-4' data-testid='home-full'>
            <div className='grid grid-cols-2 gap-3 xl:grid-cols-4'>
              <Tile label='Not answered' value={k ? n(missed) : '—'}
                sub={k ? <>{share(missed, dir === 'inbound' ? k.total : k.dialled || k.total)} of {dir === 'inbound' ? 'received' : 'dialled'}</> : undefined}
                info='Outgoing calls that were busy, unanswered, rejected, went to voicemail or failed to dial. Worth retrying.'
                delta={k && p && <Delta cur={k.dnp} prev={p.dnp} invert />} href={dirLink('?filter=missed')} />
              <Tile label='Talk time' value={k ? talk(k.talkSeconds) : '—'} sub={k ? <>about {fmtDuration(k.avgTalk)} per answered call</> : undefined}
                info='Total time in answered conversations. The average is talk time divided by answered calls.'
                delta={k && p && <Delta cur={Math.round(k.talkSeconds / 60)} prev={Math.round(p.talkSeconds / 60)} suffix=' min' />} />
            </div>

            <div className='grid grid-cols-1 gap-4 xl:grid-cols-[1.3fr_1fr]'>
              <Card title='From call to customer' info='Each step is part of the one above. Percentages after Answered are of answered calls, so a poor calling list does not hide a good script.'>
                <BarList items={funnel} max={k?.total || 0} />
              </Card>
              <Card title='Why calls were not answered' info='The reason the phone network reported. Busy and no-answer numbers are worth retrying at a different hour.'>
                {data && data.notConnected.length ? (
                  <BarList items={data.notConnected.map((r) => ({ label: r.reason, value: r.count, note: share(r.count, data.kpis.total) }))} max={Math.max(...data.notConnected.map((r) => r.count))} color='rgb(var(--c-ink-soft))' />
                ) : data ? <div className='py-6 text-center text-[13px] text-ink-soft'>Every call was answered in this period.</div> : null}
              </Card>
            </div>

            {dir === 'all' && data && (
              <Card title='Incoming vs outgoing' info='The same numbers side by side, so you can see which side is producing leads.'>
                <div className='overflow-x-auto'>
                  <table className='w-full min-w-[560px] text-[13px]'>
                    <thead><tr className='text-left text-[11.5px] text-ink-soft'>
                      <th className='pb-2 font-medium'>Calls</th><th className='pb-2 text-right font-medium'>Total</th><th className='pb-2 text-right font-medium'>Answered</th>
                      <th className='pb-2 text-right font-medium'>Answer rate</th><th className='pb-2 text-right font-medium'>Interested</th><th className='pb-2 text-right font-medium'>Hot</th>
                      <th className='pb-2 text-right font-medium'>Avg talk</th><th className='pb-2 text-right font-medium'>Call backs</th>
                    </tr></thead>
                    <tbody>
                      {(['inbound', 'outbound'] as const).map((ch) => {
                        const s = data.split[ch];
                        return (
                          <tr key={ch} className='cursor-pointer border-t border-line hover:bg-paper' onClick={() => setDir(ch)}>
                            <td className='py-2.5 font-semibold'><span className='inline-flex items-center gap-2'><span className='h-2 w-2 rounded-full' style={{ background: ch === 'inbound' ? IN_COLOR : OUT_COLOR }} />{ch === 'inbound' ? 'Incoming' : 'Outgoing'}</span></td>
                            <td className='text-right tabular-nums'>{n(s.total)}</td><td className='text-right tabular-nums'>{n(s.connected)}</td>
                            <td className='text-right tabular-nums'>{s.connectRate}%</td><td className='text-right tabular-nums'>{n(s.interested)}</td>
                            <td className='text-right font-semibold tabular-nums'>{n(s.hot)}</td><td className='text-right tabular-nums'>{fmtDuration(s.avgTalk)}</td>
                            <td className='text-right tabular-nums'>{n(s.followUps)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {dir !== 'inbound' && (
              <Card title={`Campaigns · ${data?.range.label.toLowerCase() || ''}`} info='Every outgoing campaign that dialled in this period. Click a name to open its full call list.'
                right={<Link href='/outbound' className='text-[12.5px] font-semibold text-signal'>All campaigns →</Link>}>
                {data && data.campaigns.length ? (
                  <div className='overflow-x-auto'>
                    <table className='w-full min-w-[760px] text-[13px]'>
                      <thead><tr className='text-left text-[11.5px] text-ink-soft'>
                        <th className='pb-2 font-medium'>Campaign</th><th className='pb-2 text-right font-medium'>Dialled</th><th className='pb-2 text-right font-medium'>Answered</th>
                        <th className='pb-2 text-right font-medium'>Not answered</th><th className='pb-2 text-right font-medium'>Hot</th><th className='pb-2 text-right font-medium'>Warm</th>
                        <th className='pb-2 text-right font-medium'>Call backs</th><th className='pb-2 text-right font-medium'>Not interested</th><th className='pb-2 text-right font-medium'>Talk time</th><th className='pb-2 text-right font-medium'>Last call</th>
                      </tr></thead>
                      <tbody>
                        {data.campaigns.map((c) => (
                          <tr key={c.id} className='border-t border-line hover:bg-paper'>
                            <td className='py-2.5 pr-3'><Link href={`/outbound?campaign=${encodeURIComponent(c.id)}`} className='font-semibold hover:text-signal'>{c.name}</Link>
                              {c.totalContacts ? <div className='text-[11.5px] text-ink-soft'>{n(c.dialled)} of {n(c.totalContacts)} contacts</div> : null}</td>
                            <td className='text-right tabular-nums'>{n(c.dialled)}</td>
                            <td className='text-right tabular-nums'>{n(c.connected)} <span className='text-ink-soft'>({c.connectRate}%)</span></td>
                            <td className='text-right tabular-nums'>{n(c.dnp)}</td><td className='text-right font-semibold tabular-nums'>{n(c.hot)}</td>
                            <td className='text-right tabular-nums'>{n(c.warm)}</td><td className='text-right tabular-nums'>{n(c.followUps)}</td>
                            <td className='text-right tabular-nums'>{n(c.notInterested)}</td><td className='text-right tabular-nums'>{talk(c.talkSeconds)}</td>
                            <td className='whitespace-nowrap text-right text-ink-soft'>{c.lastCallAt ? `${fmtDate(c.lastCallAt)} ${fmtClock(c.lastCallAt)}` : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : data ? <div className='py-6 text-center text-[13px] text-ink-soft'>No campaigns ran in this period.</div> : null}
              </Card>
            )}

            <section className='rounded-[14px] border border-line bg-raised'>
              <button onClick={() => setShowDefs((v) => !v)} className='flex w-full items-center justify-between px-5 py-3.5 text-[14px] font-semibold'>
                How RANA counts every number
                <span className='text-[12.5px] font-normal text-ink-soft'>{showDefs ? 'Hide' : 'Show definitions'}</span>
              </button>
              {showDefs && (
                <div className='grid grid-cols-1 gap-x-8 gap-y-3 px-5 pb-5 md:grid-cols-2'>
                  {(data?.definitions || []).map((d) => (
                    <div key={d.term} className='text-[12.5px] leading-relaxed'><span className='font-semibold'>{d.term}.</span> <span className='text-ink-soft'>{d.rule}</span></div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
      <CallDrawer call={selected} onClose={() => setSelected(null)} onUpdated={(c) => { setSelected(c); load(); }} />
    </div>
  );
}
