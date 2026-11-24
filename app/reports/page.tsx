'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { displayZone } from '@/lib/format';
import { localDate } from '@/lib/tz';

const day = (offset = 0) => localDate(displayZone(), Date.now() - offset * 86400e3);
const RANGES: [string, string, () => [string, string]][] = [
  ['today', 'Today', () => [day(0), day(0)]],
  ['yesterday', 'Yesterday', () => [day(1), day(1)]],
  ['7d', 'Last 7 days', () => [day(6), day(0)]],
  ['30d', 'Last 30 days', () => [day(29), day(0)]],
  ['month', 'This month', () => [day(0).slice(0, 8) + '01', day(0)]],
];
const field = 'border border-line rounded-lg px-2.5 py-1.5 text-[13px] bg-sunken';

type F = { from: string; to: string; direction: string; campaign: string; leads: string[]; connected: string; columns: string[] };

// Same keys as WHOLESALE_COLUMNS in lib/reports.ts (kept here so the page does not import server code).
const WHOLESALE_COLS = ['when', 'name', 'phone', 'purpose', 'product', 'quantity', 'budget', 'visit', 'caller_location', 'said', 'summary', 'lead', 'follow_up', 'notes', 'recording'];
/** Reports: pick the calls, the leads and the columns; see the numbers; download Excel. */
export default function ReportsPage() {
  const [range, setRange] = useState('7d');
  const [f, setF] = useState<F>(() => ({ from: day(6), to: day(0), direction: 'all', campaign: 'all', leads: [], connected: 'all', columns: [] }));
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [tplName, setTplName] = useState('');
  const [msg, setMsg] = useState('');
  const [colsOpen, setColsOpen] = useState(false);
  const seq = useRef(0);
  const [canDownload, setCanDownload] = useState(true);
  const [hasWholesale, setHasWholesale] = useState(false);
  useEffect(() => { fetch('/api/auth/me').then((r) => r.json()).then((j) => setCanDownload(['owner', 'admin', 'manager'].includes(j?.user?.role || 'owner'))).catch(() => {}); }, []);

  const qs = (x: F, extra: Record<string, string> = {}) => new URLSearchParams({ from: x.from, to: x.to, direction: x.direction, campaign: x.campaign, leads: x.leads.join(','), connected: x.connected, columns: x.columns.join(','), ...extra }).toString();
  // The wholesale shortcut is only for businesses that actually get wholesale enquiries (any in the last 90 days).
  useEffect(() => {
    fetch(`/api/reports?${qs({ from: day(89), to: day(0), direction: 'all', campaign: 'all', leads: ['wholesale'], connected: 'all', columns: [] })}`)
      .then((r) => (r.ok ? r.json() : null)).then((j) => setHasWholesale((j?.stats?.calls || 0) > 0)).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const n = ++seq.current; setLoading(true); setErr('');
    const t = setTimeout(() => {
      fetch(`/api/reports?${qs(f)}`).then(async (r) => { const j = await r.json(); if (!r.ok) throw new Error(j.error); if (n !== seq.current) return; setD(j); if (!f.columns.length) setF((x) => ({ ...x, columns: j.filter.columns })); })
        .catch((e) => n === seq.current && setErr(e.message)).finally(() => n === seq.current && setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [f]); // eslint-disable-line react-hooks/exhaustive-deps
  const loadTemplates = () => fetch('/api/reports/templates').then((r) => r.json()).then((j) => setTemplates(j.templates || [])).catch(() => {});
  useEffect(() => { loadTemplates(); }, []);

  const set = (patch: Partial<F>) => setF((x) => ({ ...x, ...patch }));
  const pickRange = (k: string) => { setRange(k); const r = RANGES.find((x) => x[0] === k); if (r) { const [from, to] = r[2](); set({ from, to }); } };
  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const allCols = useMemo(() => [...(d?.columns || []), ...(d?.listColumns || [])], [d]);
  const colLabel = (k: string) => allCols.find((c: any) => c.key === k)?.label || k.replace(/^list:/, '');
  const move = (k: string, dir: -1 | 1) => { const c = [...f.columns]; const i = c.indexOf(k); const j = i + dir; if (i < 0 || j < 0 || j >= c.length) return; [c[i], c[j]] = [c[j], c[i]]; set({ columns: c }); };

  async function saveTemplate() {
    if (!tplName.trim()) return;
    const r = await fetch('/api/reports/templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: tplName, filter: f, range }) });
    const j = await r.json(); if (!r.ok) { setMsg(j.error); return; }
    setTplName(''); setMsg('Template saved for your team.'); loadTemplates();
  }
  function useTemplate(t: any) {
    const c = t.config || {};
    const r = RANGES.find((x) => x[0] === c.range);
    const [from, to] = r ? r[2]() : [f.from, f.to];
    if (r) setRange(r[0]);
    setF({ from, to, direction: c.direction || 'all', campaign: c.campaign || 'all', leads: c.leads || [], connected: c.connected || 'all', columns: c.columns || [] });
    setMsg(`Using “${t.name}”.`);
  }
  async function delTemplate(id: string) { await fetch(`/api/reports/templates?id=${id}`, { method: 'DELETE' }); loadTemplates(); }

  const s = d?.stats;
  const tiles = s ? [['Calls', s.calls], ['Answered', `${s.connected} · ${s.connectRate}%`], ['Hot + ready', s.hot], ['Warm', s.warm], ['Call backs', s.followUps], ['Needs a person', s.needsPerson], ['Talk time', `${s.talkMinutes} min`]] : [];

  return (
    <div className='flex min-h-screen bg-paper'>
      <Sidebar active='leads-results' />
      <div className='min-w-0 flex-1 px-5 py-7 pb-20 md:pb-8 lg:px-10'>
        <div className='flex w-full max-w-[1600px] flex-col gap-5'>
          <div>
            <h1 className='m-0 font-display text-[26px] font-semibold tracking-tight'>Leads &amp; reports</h1>
            <div className='mt-1 text-[13.5px] text-ink-soft'>Choose which calls and which columns you want. The numbers update as you choose; download it as an Excel file.</div>
            {hasWholesale && (
              <div className='mt-2.5 flex flex-wrap items-center gap-2' data-testid='wholesale-list'>
                <button type='button' onClick={() => set({ leads: ['wholesale'], columns: WHOLESALE_COLS })} className='rounded-lg border border-signal/60 px-3 py-1.5 text-[12.5px] font-semibold text-signal hover:bg-signal/10'>Wholesale list</button>
                <span className='text-[12px] text-ink-soft'>Every wholesale enquiry with name, number and what they discussed, for your staff to call back. Pick the dates, then Download Excel.</span>
              </div>
            )}
          </div>

          <div className='flex flex-col gap-3.5 rounded-xl border border-line bg-raised p-4' data-testid='report-filters'>
            <div className='flex flex-wrap items-center gap-2'>
              <span className='w-[88px] text-[12px] font-semibold text-ink-soft'>Dates</span>
              {RANGES.map(([k, l]) => <button key={k} onClick={() => pickRange(k)} className={`rounded-full border px-3 py-1 text-[12.5px] ${range === k ? 'border-ink bg-ink font-semibold text-paper' : 'border-line text-ink-soft hover:text-ink'}`}>{l}</button>)}
              <input type='date' value={f.from} max={f.to} onChange={(e) => { setRange('custom'); set({ from: e.target.value }); }} className={field} aria-label='From' />
              <span className='text-[12px] text-ink-soft'>to</span>
              <input type='date' value={f.to} min={f.from} max={day(0)} onChange={(e) => { setRange('custom'); set({ to: e.target.value }); }} className={field} aria-label='To' />
            </div>
            <div className='flex flex-wrap items-center gap-2'>
              <span className='w-[88px] text-[12px] font-semibold text-ink-soft'>Calls</span>
              <select value={f.direction} onChange={(e) => set({ direction: e.target.value })} className={field} aria-label='Direction'><option value='all'>Incoming + outgoing</option><option value='outbound'>Outgoing (campaigns)</option><option value='inbound'>Incoming</option></select>
              <select value={f.campaign} onChange={(e) => set({ campaign: e.target.value })} className={field} aria-label='Campaign'><option value='all'>All campaigns</option>{(d?.campaigns || []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              <select value={f.connected} onChange={(e) => set({ connected: e.target.value })} className={field} aria-label='Answered'><option value='all'>Answered + not answered</option><option value='connected'>Answered only</option><option value='not_connected'>Not answered only</option></select>
            </div>
            <div className='flex flex-wrap items-center gap-1.5'>
              <span className='w-[88px] text-[12px] font-semibold text-ink-soft'>Leads</span>
              <button onClick={() => set({ leads: [] })} className={`rounded-full border px-3 py-1 text-[12.5px] ${!f.leads.length ? 'border-signal/50 bg-signal/15 font-semibold text-signal' : 'border-line text-ink-soft'}`}>All</button>
              {(d?.leadChoices || []).filter((l: any) => l.key !== 'wholesale' || hasWholesale).map((l: any) => <button key={l.key} onClick={() => set({ leads: toggle(f.leads, l.key) })} aria-pressed={f.leads.includes(l.key)} className={`rounded-full border px-3 py-1 text-[12.5px] ${f.leads.includes(l.key) ? 'border-signal/50 bg-signal/15 font-semibold text-signal' : 'border-line text-ink-soft hover:text-ink'}`}>{l.label}</button>)}
            </div>
            <div className='flex flex-wrap items-start gap-2'>
              <span className='w-[88px] pt-1 text-[12px] font-semibold text-ink-soft'>Columns</span>
              <div className='min-w-0 flex-1'>
                <div className='flex flex-wrap gap-1.5'>
                  {f.columns.map((k) => <span key={k} className='inline-flex items-center gap-1 rounded-md border border-line bg-sunken py-0.5 pl-2 pr-1 text-[12px]'>{colLabel(k)}<button onClick={() => move(k, -1)} aria-label={`Move ${colLabel(k)} left`} className='px-0.5 text-ink-soft'>‹</button><button onClick={() => move(k, 1)} aria-label={`Move ${colLabel(k)} right`} className='px-0.5 text-ink-soft'>›</button><button onClick={() => set({ columns: f.columns.filter((x) => x !== k) })} aria-label={`Remove ${colLabel(k)}`} className='px-0.5 text-miss'>×</button></span>)}
                  <button onClick={() => setColsOpen((o) => !o)} className='px-1 text-[12.5px] font-semibold text-signal' data-testid='cols-toggle'>{colsOpen ? 'Done' : '+ Choose columns'}</button>
                </div>
                {colsOpen && (
                  <div className='mt-2.5 grid grid-cols-2 gap-1.5 border-t border-line pt-2.5 md:grid-cols-4' data-testid='cols-picker'>
                    {allCols.map((c: any) => <label key={c.key} className='flex items-center gap-2 text-[12.5px]'><input type='checkbox' checked={f.columns.includes(c.key)} onChange={() => set({ columns: toggle(f.columns, c.key) })} />{c.label}{c.key.startsWith('list:') && <span className='text-[10.5px] text-ink-soft'>(your list)</span>}</label>)}
                    <button onClick={() => set({ columns: d?.defaultColumns || [] })} className='text-left text-[12px] text-ink-soft underline'>Reset to default</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {err && <div className='text-[13px] text-miss' role='alert'>{err}</div>}
          <div className={`grid grid-cols-2 gap-2.5 transition-opacity sm:grid-cols-4 lg:grid-cols-7 ${loading ? 'opacity-60' : ''}`} data-testid='report-stats'>
            {tiles.map(([k, v]) => <div key={k as string} className='rounded-xl border border-line bg-raised p-3'><div className='text-[11px] text-ink-soft'>{k}</div><div className='font-display text-[20px] font-semibold tabular-nums'>{v}</div></div>)}
          </div>

          <div className='flex flex-wrap items-center gap-2'>
            <a href={`/api/reports/download?${qs(f)}`} className={`rounded-lg bg-signal px-4 py-2 text-[13.5px] font-semibold text-on-accent ${!s?.calls || !canDownload ? 'pointer-events-none opacity-40' : ''}`} data-testid='dl-xlsx'>⬇ Download Excel ({s?.calls ?? 0} calls)</a>
            <a href={`/api/reports/download?${qs(f, { format: 'csv' })}`} className={`rounded-lg border border-line px-3 py-2 text-[13px] ${!s?.calls || !canDownload ? 'pointer-events-none opacity-40' : ''}`}>CSV</a>
            {!canDownload && <span className='text-[12px] text-ink-soft'>Ask a manager to download. Your role can view only.</span>}
            <span className='flex-1' />
            <input value={tplName} onChange={(e) => setTplName(e.target.value)} placeholder='Save as template, e.g. Daily hot leads' className={`${field} w-[230px]`} />
            <button onClick={saveTemplate} disabled={!tplName.trim()} className='rounded-lg border border-line px-3 py-1.5 text-[13px] font-semibold disabled:opacity-40'>Save</button>
          </div>
          {msg && <div className='-mt-2 text-[12.5px] text-ink-soft'>{msg}</div>}
          {templates.length > 0 && (
            <div className='-mt-1 flex flex-wrap items-center gap-1.5'>
              <span className='mr-1 text-[12px] text-ink-soft'>Saved:</span>
              {templates.map((t) => <span key={t.id} className='inline-flex items-center gap-1 rounded-full border border-line py-0.5 pl-3 pr-1.5 text-[12.5px]'><button onClick={() => useTemplate(t)} className='font-semibold'>{t.name}</button><button onClick={() => delTemplate(t.id)} className='px-1 text-ink-soft hover:text-miss' aria-label={`Delete ${t.name}`}>×</button></span>)}
            </div>
          )}

          {s && s.byCampaign.length > 0 && (
            <div className='overflow-x-auto rounded-xl border border-line bg-raised p-4'>
              <div className='mb-2 text-[13.5px] font-semibold'>By campaign</div>
              <table className='w-full text-[13px]'><thead><tr className='text-left text-[11px] uppercase tracking-wide text-ink-soft'><th className='py-1 pr-3'>Campaign</th><th className='pr-3 text-right'>Calls</th><th className='pr-3 text-right'>Answered</th><th className='pr-3 text-right'>Hot</th><th className='text-right'>Warm</th></tr></thead>
                <tbody>{s.byCampaign.map((g: any) => <tr key={g.name} className='border-t border-line/60'><td className='py-1.5 pr-3'>{g.name}</td><td className='pr-3 text-right tabular-nums'>{g.calls}</td><td className='pr-3 text-right tabular-nums'>{g.connected}</td><td className='pr-3 text-right font-semibold tabular-nums text-hot'>{g.hot}</td><td className='text-right tabular-nums'>{g.warm}</td></tr>)}</tbody></table>
            </div>
          )}

          <div className='overflow-x-auto rounded-xl border border-line bg-raised p-4' data-testid='report-preview'>
            <div className='mb-2 text-[13.5px] font-semibold'>Preview <span className='text-[12px] font-normal text-ink-soft'>· first {Math.min(8, s?.calls || 0)} of {s?.calls ?? 0} rows, exactly as they will appear in Excel</span></div>
            {!d ? <div className='text-[13px] text-ink-soft'>Loading…</div> : d.preview.rows.length === 0 ? <div className='text-[13px] text-ink-soft'>No calls match. Try a wider date range or fewer lead filters.</div> : (
              <table className='min-w-full text-[12.5px]'><thead><tr className='text-left text-[11px] uppercase tracking-wide text-ink-soft'>{d.preview.headers.map((h: string) => <th key={h} className='whitespace-nowrap py-1 pr-4'>{h}</th>)}</tr></thead>
                <tbody>{d.preview.rows.map((r: any[], i: number) => <tr key={i} className='border-t border-line/60 align-top'>{r.map((v, j) => <td key={j} className='max-w-[320px] py-1.5 pr-4'><div className='line-clamp-3'>{String(v)}</div></td>)}</tr>)}</tbody></table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
