'use client';
// Calls: every call in one list, incoming and outgoing together, so a call is never on a page you did not open.
// Filter by direction, by what happened, by period and by the number called; search by name or phone.
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import StatusPill from '@/components/StatusPill';
import CallDrawer from '@/components/CallDrawer';
import type { CallRow, LeadStatus } from '@/lib/calls';
import { LEAD_LABEL, LEAD_TONE, fmtDuration, fmtPhone, fmtClock, fmtDate } from '@/lib/format';

type Row = CallRow & { line_label?: string | null; follow_up?: boolean; recording_url?: string | null; lead_reason?: string | null };
type Dir = 'all' | 'inbound' | 'outbound';
type What = 'all' | 'hot' | 'warm' | 'missed' | 'callback';

const DIRS: { key: Dir; label: string }[] = [{ key: 'all', label: 'All calls' }, { key: 'inbound', label: 'Incoming' }, { key: 'outbound', label: 'Outgoing' }];
const WHATS: { key: What; label: string }[] = [
  { key: 'all', label: 'Everything' }, { key: 'hot', label: 'Hot leads' }, { key: 'warm', label: 'Warm leads' },
  { key: 'callback', label: 'Asked for a call back' }, { key: 'missed', label: 'Not answered' },
];
const PERIODS: { key: string; label: string; days: number }[] = [
  { key: 'today', label: 'Today', days: 0 }, { key: '7d', label: 'Last 7 days', days: 7 }, { key: '30d', label: 'Last 30 days', days: 30 }, { key: 'all', label: 'Latest 300 calls', days: -1 },
];
const IN = 'rgb(var(--c-signal))', OUT = 'rgb(var(--c-violet))';
// One column template for the header and every row, so the columns line up.
const COLS = 'md:grid-cols-[minmax(190px,1.1fr)_minmax(0,2fr)_150px_70px_96px] md:items-center md:gap-x-5';

const is = (c: Row, w: What) =>
  w === 'all' ? true
  : w === 'hot' ? c.lead_status === 'hot' || c.lead_status === 'ready_to_close'
  : w === 'warm' ? c.lead_status === 'warm'
  : w === 'callback' ? !!c.follow_up
  : c.lead_status === 'no_answer' || !c.duration_seconds;
// Call notes sometimes carry raw seconds such as 4.755918367346939s; show them as 4.8s.
const tidy = (t: string) => t.replace(/([0-9]+)[.]([0-9]{3,})/g, (m) => String(Math.round(Number(m) * 10) / 10));
const sinceOf = (key: string) => {
  const p = PERIODS.find((x) => x.key === key) || PERIODS[1];
  if (p.days < 0) return '';
  const d = new Date(); d.setHours(0, 0, 0, 0);
  if (p.days) d.setDate(d.getDate() - (p.days - 1));
  return d.toISOString();
};

export default function CallsPage() {
  const [dir, setDir] = useState<Dir>('all');
  const [what, setWhat] = useState<What>('all');
  const [period, setPeriod] = useState('7d');
  const [line, setLine] = useState('all');
  const [query, setQuery] = useState('');
  const [calls, setCalls] = useState<Row[] | null>(null);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<CallRow | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [note, setNote] = useState('');
  const [ready, setReady] = useState(false);

  // Links from Home and old bookmarks carry the filter in the address.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const d = q.get('direction'), f = q.get('filter'), p = q.get('period');
    if (d === 'inbound' || d === 'outbound') setDir(d);
    if (f && WHATS.some((x) => x.key === f)) setWhat(f as What);
    if (p && PERIODS.some((x) => x.key === p)) setPeriod(p);
    // Search hands over a caller to look up: show every call we hold for them.
    const find = q.get('q');
    if (find) { setQuery(find); if (!p) setPeriod('all'); }
    setReady(true);
  }, []);

  async function load() {
    try {
      const since = sinceOf(period);
      const res = await fetch(`/api/calls?limit=300${since ? `&since=${encodeURIComponent(since)}` : ''}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Could not load your calls');
      setCalls(json.calls || []); setError('');
    } catch (e: any) { setError(e.message); }
  }
  useEffect(() => {
    if (!ready) return;
    setCalls(null); load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [period, ready]);

  async function syncNow() {
    setSyncing(true); setNote('');
    try {
      const res = await fetch('/api/calls/sync', { method: 'POST' });
      const j = await res.json();
      if (!res.ok && !j.saved) throw new Error(j.errors?.[0] || j.error || 'Could not refresh');
      setNote(j.agents === 0 ? 'No published employee yet. Publish one first.' : `${j.saved} new or updated call${j.saved === 1 ? '' : 's'}.`);
      await load();
    } catch (e: any) { setNote(e.message); }
    finally { setSyncing(false); }
  }

  const all = calls ?? [];
  const lines = useMemo(() => Array.from(new Set(all.map((c) => c.line_label).filter((x): x is string => !!x))).sort(), [all]);
  const text = query.trim().toLowerCase();
  const base = all.filter((c) => (line === 'all' || c.line_label === line)
    && (!text || `${c.caller_name || ''} ${c.caller_phone || ''} ${c.summary || ''}`.toLowerCase().includes(text)));
  const inDir = base.filter((c) => dir === 'all' || c.direction === dir);
  const shown = inDir.filter((c) => is(c, what));
  const dirCount = (d: Dir) => base.filter((c) => d === 'all' || c.direction === d).length;
  const filtered = dir !== 'all' || what !== 'all' || line !== 'all' || !!text;
  const reset = () => { setDir('all'); setWhat('all'); setLine('all'); setQuery(''); };

  return (
    <div className='flex min-h-screen bg-paper'>
      <Sidebar active='calls' />
      <main className='box-border flex min-w-0 flex-1 flex-col gap-4 px-5 py-7 pb-20 md:pb-8 lg:px-10'>
        <div className='flex flex-wrap items-end justify-between gap-4'>
          <div>
            <h1 className='m-0 font-display text-[26px] font-semibold tracking-tight'>Calls</h1>
            <div className='mt-1 text-[13.5px] text-ink-soft'>Every call your AI employees answered or made. Open a call for the transcript and details. Recordings are kept for 7 days.</div>
          </div>
          <div className='flex flex-col items-end gap-1'>
            <div className='flex gap-2'>
              <Link href='/live' className='rounded-lg border border-line bg-raised px-3 py-1.5 text-[12.5px] font-semibold hover:border-ink-soft' data-testid='calls-live'>Live view</Link>
              <button onClick={syncNow} disabled={syncing} className='rounded-lg border border-line bg-raised px-3 py-1.5 text-[12.5px] font-semibold hover:border-ink-soft disabled:opacity-50'>{syncing ? 'Refreshing…' : '↻ Refresh calls'}</button>
            </div>
            {note && <div className='text-[11.5px] text-ink-soft'>{note}</div>}
          </div>
        </div>

        <div className='flex flex-wrap items-center gap-3'>
          <div className='flex gap-1 rounded-[10px] border border-line bg-raised p-1' data-testid='calls-dir'>
            {DIRS.map((d) => (
              <button key={d.key} onClick={() => setDir(d.key)} className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-semibold ${dir === d.key ? 'bg-ink text-paper' : 'text-ink-soft hover:text-ink'}`}>
                {d.key !== 'all' && <span className='h-2 w-2 rounded-full' style={{ background: d.key === 'inbound' ? IN : OUT }} />}
                {d.label} <span className='tabular-nums opacity-60'>{dirCount(d.key)}</span>
              </button>
            ))}
          </div>
          <select value={period} onChange={(e) => setPeriod(e.target.value)} aria-label='Period' data-testid='calls-period'
            className='h-9 rounded-lg border border-line bg-raised px-3 text-[13px] font-semibold outline-none focus:border-signal'>
            {PERIODS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
          {lines.length > 1 && (
            <select value={line} onChange={(e) => setLine(e.target.value)} aria-label='Number called'
              className='h-9 rounded-lg border border-line bg-raised px-3 text-[13px] font-semibold outline-none focus:border-signal'>
              <option value='all'>All numbers</option>
              {lines.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          )}
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder='Search name, phone or summary' aria-label='Search calls' data-testid='calls-search'
            className='h-9 w-full rounded-lg border border-line bg-raised px-3 text-[13px] outline-none placeholder:text-ink-soft/60 focus:border-signal sm:ml-auto sm:w-[260px]' />
        </div>

        <div className='flex flex-wrap gap-2' data-testid='calls-what'>
          {WHATS.map((w) => (
            <button key={w.key} onClick={() => setWhat(w.key)} className={`rounded-full border px-3 py-1 text-[12.5px] ${what === w.key ? 'border-signal bg-signal/15 font-semibold text-signal' : 'border-line text-ink-soft hover:text-ink'}`}>
              {w.label} <span className='tabular-nums opacity-70'>{inDir.filter((c) => is(c, w.key)).length}</span>
            </button>
          ))}
        </div>

        {error && <div className='rounded-lg bg-miss-tint px-3 py-2.5 text-[12.5px] text-miss' role='alert'>{error}</div>}

        {calls !== null && (
          <div className='flex items-center justify-between gap-3 text-[12.5px] text-ink-soft' data-testid='calls-count'>
            <span><span className='font-semibold tabular-nums text-ink'>{shown.length}</span> {shown.length === 1 ? 'call' : 'calls'}{filtered ? ` of ${all.length} in this period` : ''}</span>
            {filtered && <button onClick={reset} className='font-semibold text-signal'>Clear filters</button>}
          </div>
        )}

        <div className='flex flex-1 flex-col overflow-hidden rounded-[14px] border border-line bg-raised'>
          <div className={`hidden border-b border-line bg-sunken/60 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-soft md:grid ${COLS}`}>
            <div>Caller</div>
            <div>What happened</div>
            <div>Result</div>
            <div className='text-right'>Length</div>
            <div className='text-right'>When</div>
          </div>
          <div className='flex-1 overflow-y-auto' data-testid='calls-list'>
            {calls === null && !error && <div className='p-6 text-[13px] text-ink-soft'>Loading your calls…</div>}
            {calls !== null && shown.length === 0 && (
              <div className='p-8 text-center text-[13.5px] text-ink-soft' data-testid='calls-empty'>
                {filtered ? <>No calls match these filters. <button onClick={reset} className='font-semibold text-signal'>Clear filters</button></>
                  : <>No calls in this period yet. Calls appear here by themselves once an employee is live. Start on <Link href='/employees' className='font-semibold text-signal'>AI Employees</Link>, or pick a longer period.</>}
              </div>
            )}
            {shown.map((c) => {
              const name = c.caller_name && !/^(not provided|unknown)$/i.test(c.caller_name.trim()) ? c.caller_name : '';
              const incoming = c.direction === 'inbound';
              return (
                <button key={c.id} onClick={() => setSelected(c)} data-testid='call-row'
                  className={`flex w-full flex-wrap items-center gap-x-4 gap-y-1.5 border-b border-line px-5 py-3.5 text-left last:border-b-0 hover:bg-paper md:grid ${COLS}`}>
                  <div className='flex w-full min-w-0 items-center gap-3 md:w-auto'>
                    <span className='grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sunken text-[12.5px] font-semibold text-ink-soft' aria-hidden>{(name || '#').charAt(0).toUpperCase()}</span>
                    <div className='min-w-0'>
                      <div className='truncate text-[13.5px] font-semibold'>{name || (c.caller_phone ? fmtPhone(c.caller_phone) : 'Unknown caller')}</div>
                      <div className='flex items-center gap-1.5 truncate text-[12px] text-ink-soft'>
                        <span className='h-1.5 w-1.5 shrink-0 rounded-full' style={{ background: incoming ? IN : OUT }} />
                        {incoming ? 'Incoming' : 'Outgoing'}{name && c.caller_phone ? ` · ${fmtPhone(c.caller_phone)}` : ''}
                      </div>
                      {c.line_label && <div className='truncate text-[11.5px] text-ink-soft'>Called: {c.line_label}</div>}
                    </div>
                  </div>
                  <div className='line-clamp-2 w-full min-w-0 text-[13px] leading-snug text-ink-soft md:w-auto'>{tidy(c.summary || c.lead_reason || '—')}</div>
                  <div className='flex flex-wrap items-center gap-1.5'>
                    <StatusPill label={LEAD_LABEL[c.lead_status as LeadStatus]} tone={LEAD_TONE[c.lead_status as LeadStatus]} />
                    {c.follow_up && <span className='rounded-full border border-line px-2 py-px text-[11px] font-medium text-ink-soft'>Call back</span>}
                  </div>
                  <div className='text-[13px] tabular-nums text-ink-soft md:text-right'>{fmtDuration(Math.round(c.duration_seconds || 0))}</div>
                  <div className='ml-auto text-right text-[12px] leading-snug text-ink-soft md:ml-0'>
                    <div className='font-medium text-ink'>{fmtDate(c.created_at)}</div>
                    <div className='tabular-nums'>{fmtClock(c.created_at)}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        {calls !== null && all.length >= 300 && <div className='text-center text-[12px] text-ink-soft'>Showing the latest 300 calls in this period. For everything, download it from <Link href='/reports' className='font-semibold text-signal'>Leads & reports</Link>.</div>}
      </main>
      <CallDrawer call={selected} onClose={() => setSelected(null)} onUpdated={(u) => { setSelected(u); setCalls((cs) => (cs ?? []).map((c) => (c.id === u.id ? (u as Row) : c))); }} />
    </div>
  );
}
