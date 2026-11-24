// @ts-nocheck
'use client';
// AI Employees: the one place to build, test and switch on an employee.
// One New employee button offers the three ways to build; each card shows where the employee stands
// (Published, Tested, Live) and the single next thing to do.
import { useEffect, useMemo, useState } from 'react';
import { fmtDate as fmtDay0 } from '@/lib/format';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { LANGUAGES } from '@/lib/storage';

type Script = { id: string; name: string; engine?: string | null; playbook?: any; starting_language: string; voice_name: string | null; cartesia_agent_id: string | null; tested_at: string | null; published_at: string | null; steps: any[]; status: string };
type PhoneNumber = { id: string; number: string; label: string | null; agentId: string | null; agentName: string | null; provider: string };
type Campaign = { id: string; name: string; script_id: string | null; status: string; total_contacts: number; created_at: string; kpis: { dialled: number; connected: number; hot: number } };

const fmtDate = (iso?: string | null) => (iso ? fmtDay0(iso) : '');
const ACTIVE = ['running', 'scheduled', 'completed', 'paused'];
const WA_BUILD = 'https://wa.me/917899793001?text=Hi%20RANA%20AI%2C%20please%20build%20an%20AI%20employee%20for%20my%20business.';

// Where an employee stands: draft (not published), test (published, not signed off), ready (tested, not in use), live.
function stageOf(s: Script, inbound: PhoneNumber[], outbound: Campaign[]) {
  const built = !!s.cartesia_agent_id;
  const tested = built && !!s.tested_at;
  const live = tested && (inbound.length > 0 || outbound.some((c) => ACTIVE.includes(c.status)));
  return { built, tested, live, key: live ? 'live' : tested ? 'ready' : built ? 'test' : 'draft' };
}

/** Published, Tested, Live. Each step says what is done and what to do next. */
function Stages({ s, inbound, outbound }: { s: Script; inbound: PhoneNumber[]; outbound: Campaign[] }) {
  const { built, tested, live } = stageOf(s, inbound, outbound);
  const steps = [
    { label: 'Published', done: built, note: built ? `On ${fmtDate(s.published_at)}` : 'Press Publish' },
    { label: 'Tested', done: tested, note: tested ? `Signed off ${fmtDate(s.tested_at)}` : built ? 'Test a call and sign off' : '—' },
    { label: 'Live', done: live, note: live ? [inbound.length ? `${inbound.length} phone line${inbound.length > 1 ? 's' : ''}` : '', outbound.length ? `${outbound.length} campaign${outbound.length > 1 ? 's' : ''}` : ''].filter(Boolean).join(' · ') : tested ? 'Choose incoming or outgoing calls' : '—' },
  ];
  return (
    <div className='mt-3 grid grid-cols-3 gap-2'>
      {steps.map((st, i) => (
        <div key={st.label} className={`rounded-lg border px-3 py-2 ${st.done ? 'border-signal/30 bg-signal-tint' : 'border-line bg-paper'}`}>
          <div className='flex items-center gap-1.5 text-[12px] font-semibold'>
            <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${st.done ? 'bg-signal text-on-accent' : 'border border-line bg-raised text-ink-soft'}`}>{st.done ? '✓' : i + 1}</span>
            {st.label}
          </div>
          <div className='mt-0.5 truncate text-[11.5px] text-ink-soft'>{st.note}</div>
        </div>
      ))}
    </div>
  );
}

/** The three ways to build an employee, in one place. */
function NewEmployee({ onClose }: { onClose: () => void }) {
  const ways = [
    { href: '/agents/new', tid: 'new-guided', tag: 'Recommended', title: 'Guided setup', body: 'Answer a few questions and paste your script. RANA turns it into a call plan with objections, FAQs and a closing.', icon: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z' },
    { href: '/builder', tid: 'open-builder', title: 'Write it yourself', body: 'Write the script in clear sections in Agent Builder. The employee follows it exactly as written.', icon: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z' },
    { href: WA_BUILD, tid: 'new-by-rana', ext: true, title: 'Let RANA build it', body: 'Send your script or brochure on WhatsApp and our team sets the employee up for you.', icon: 'M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z' },
  ];
  return (
    <div className='fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4' onClick={onClose}>
      <div className='max-h-[90vh] w-full max-w-[560px] overflow-y-auto rounded-2xl border border-line bg-raised shadow-xl' onClick={(e) => e.stopPropagation()} role='dialog' aria-label='New employee' data-testid='new-employee'>
        <div className='flex items-start justify-between border-b border-line px-6 py-5'>
          <div>
            <div className='font-display text-[18px] font-semibold'>New AI employee</div>
            <div className='mt-0.5 text-[12.5px] text-ink-soft'>Pick how you want to build it. You can change everything later.</div>
          </div>
          <button onClick={onClose} aria-label='Close' className='text-lg leading-none text-ink-soft hover:text-ink'>×</button>
        </div>
        <div className='flex flex-col gap-3 p-6'>
          {ways.map((w) => {
            const inner = (
              <>
                <span className='grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-signal-tint text-signal'>
                  <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.9' strokeLinecap='round' strokeLinejoin='round' aria-hidden><path d={w.icon} /></svg>
                </span>
                <span className='min-w-0 flex-1'>
                  <span className='flex items-center gap-2 text-[14px] font-semibold'>{w.title}{w.tag && <span className='rounded-full bg-signal-tint px-2 py-0.5 text-[10.5px] font-semibold text-signal'>{w.tag}</span>}</span>
                  <span className='mt-0.5 block text-[12.5px] leading-relaxed text-ink-soft'>{w.body}</span>
                </span>
                <span className='mt-2 text-ink-soft transition-transform group-hover:translate-x-0.5 group-hover:text-signal'>→</span>
              </>
            );
            const cls = 'group flex items-start gap-3.5 rounded-xl border border-line p-4 text-left transition-colors hover:border-signal/60';
            return w.ext
              ? <a key={w.tid} href={w.href} target='_blank' rel='noopener noreferrer' className={cls} data-testid={w.tid}>{inner}</a>
              : <Link key={w.tid} href={w.href} className={cls} data-testid={w.tid}>{inner}</Link>;
          })}
        </div>
      </div>
    </div>
  );
}

function DeployModal({ s, numbers, campaigns, onClose, onChanged }: { s: Script; numbers: PhoneNumber[]; campaigns: Campaign[]; onClose: () => void; onChanged: () => void }) {
  const [mode, setMode] = useState<'inbound' | 'outbound' | null>(null);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const mine = numbers.filter((n) => n.agentId && n.agentId === s.cartesia_agent_id);

  async function assign(numberId: string, scriptId: string | null) {
    setBusy(numberId); setMsg(null);
    try {
      const res = await fetch(`/api/admin/cartesia-phone-numbers/${numberId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scriptId }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not change the number');
      setMsg({ ok: true, text: scriptId ? `${s.name} now answers every call to this number.` : 'Number released. Nobody answers it until you assign someone.' });
      onChanged();
    } catch (e: any) { setMsg({ ok: false, text: e.message }); }
    finally { setBusy(''); }
  }

  return (
    <div className='fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4' onClick={onClose}>
      <div className='max-h-[90vh] w-full max-w-[640px] overflow-y-auto rounded-2xl border border-line bg-raised shadow-xl' onClick={(e) => e.stopPropagation()} role='dialog' aria-label={`Go live with ${s.name}`}>
        <div className='flex items-start justify-between border-b border-line px-6 py-5'>
          <div>
            <div className='font-display text-[18px] font-semibold'>Go live with {s.name}</div>
            <div className='mt-0.5 text-[12.5px] text-ink-soft'>Choose how {s.name} works for you. You can do both.</div>
          </div>
          <button onClick={onClose} aria-label='Close' className='text-lg leading-none text-ink-soft hover:text-ink'>×</button>
        </div>

        <div className='flex flex-col gap-4 p-6'>
          <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
            {[
              { key: 'inbound', title: 'Answer incoming calls', body: `Put ${s.name} on a phone number. Every call to that number is answered by ${s.name}.`, icon: 'M17 7L7 17 M16 17H7V8' },
              { key: 'outbound', title: 'Make outgoing calls', body: `Upload a list of numbers. ${s.name} calls each one and reports who is interested.`, icon: 'M7 17L17 7 M8 7h9v9' },
            ].map((o) => (
              <button key={o.key} onClick={() => setMode(o.key as any)}
                className={`rounded-xl border p-4 text-left transition-colors ${mode === o.key ? 'border-signal bg-signal-tint' : 'border-line hover:border-ink-soft'}`}>
                <div className='mb-2 flex h-8 w-8 items-center justify-center rounded-full border border-line bg-raised'>
                  <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.4' strokeLinecap='round' strokeLinejoin='round'><path d={o.icon} /></svg>
                </div>
                <div className='text-[14px] font-semibold'>{o.title}</div>
                <div className='mt-1 text-[12px] leading-relaxed text-ink-soft'>{o.body}</div>
              </button>
            ))}
          </div>

          {mode === 'inbound' && s.engine !== 'cartesia' && (
            <div className='flex flex-col gap-2 text-[12.5px] leading-relaxed' data-testid='sarvam-inbound'>
              <div className='text-[13px] font-semibold'>Answering your incoming calls</div>
              <div className='text-ink-soft'>Incoming calls need your own Indian number (Growth plan and above). Tell us which number {s.name} should answer and the RANA team connects it the same day. There is no setup on your side.</div>
              <div className='text-ink-soft'>Outgoing calls work fully from here: pick <b>Make outgoing calls</b> above.</div>
            </div>
          )}
          {mode === 'inbound' && s.engine === 'cartesia' && (
            <div className='flex flex-col gap-3'>
              <div className='text-[13px] font-semibold'>Pick the number {s.name} should answer</div>
              {numbers.length === 0 && (
                <div className='rounded-lg border border-dashed border-line p-4 text-[12.5px] text-ink-soft'>
                  No phone numbers yet. Add one on the <Link href='/phone-numbers' className='font-semibold text-signal'>Phone numbers</Link> page, then come back.
                </div>
              )}
              {numbers.map((n) => {
                const isMine = n.agentId && n.agentId === s.cartesia_agent_id;
                return (
                  <div key={n.id} className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${isMine ? 'border-signal/40 bg-signal-tint' : 'border-line'}`}>
                    <div className='min-w-0 flex-1'>
                      <div className='text-[13.5px] font-semibold'>{n.number}</div>
                      <div className='text-[11.5px] text-ink-soft'>{n.label || 'Unlabelled'} · {isMine ? `answered by ${s.name}` : n.agentName ? `answered by ${n.agentName}` : 'nobody answers yet'}</div>
                    </div>
                    {isMine ? (
                      <button onClick={() => assign(n.id, null)} disabled={!!busy} className='rounded-lg border border-miss/20 px-3 py-1.5 text-[12px] font-semibold text-miss disabled:opacity-40'>{busy === n.id ? '…' : 'Stop'}</button>
                    ) : (
                      <button onClick={() => assign(n.id, s.id)} disabled={!!busy} className='rounded-lg bg-signal px-3 py-1.5 text-[12px] font-semibold text-on-accent disabled:opacity-40'>{busy === n.id ? '…' : n.agentId ? 'Replace' : 'Assign'}</button>
                    )}
                  </div>
                );
              })}
              <div className='rounded-lg bg-paper p-3 text-[12px] leading-relaxed text-ink-soft'>
                <span className='font-semibold text-ink'>Keep your existing business number.</span> Forward it to the number above and callers will not notice a change.
                On Jio, Airtel or Vi, dial <span className='font-mono'>**21*&lt;number&gt;#</span> to forward all calls, or <span className='font-mono'>**61*&lt;number&gt;#</span> to forward only unanswered ones.
              </div>
              {mine.length > 0 && <div className='text-[12px] text-signal'>{s.name} is live on {mine.map((n) => n.number).join(', ')}.</div>}
            </div>
          )}

          {mode === 'outbound' && (
            <div className='flex flex-col gap-3'>
              <Link href={`/outbound/new?employee=${s.id}`} className='rounded-lg bg-signal px-4 py-2.5 text-center text-[13px] font-semibold text-on-accent'>
                Create a calling campaign with {s.name} →
              </Link>
              {campaigns.length > 0 && (
                <div className='divide-y divide-line rounded-lg border border-line'>
                  {campaigns.slice(0, 6).map((c) => (
                    <Link key={c.id} href={`/outbound/${c.id}`} className='flex items-center justify-between px-3 py-2.5 text-[12.5px] hover:bg-paper'>
                      <span className='truncate font-semibold'>{c.name}</span>
                      <span className='ml-3 shrink-0 text-ink-soft'>{c.status} · {c.kpis.dialled}/{c.total_contacts} dialled · {c.kpis.hot} hot</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {msg && <div className={`text-[12.5px] ${msg.ok ? 'text-signal' : 'text-miss'}`}>{msg.text}</div>}
        </div>
      </div>
    </div>
  );
}

const FILTERS: [string, string][] = [['all', 'All'], ['live', 'Live'], ['ready', 'Ready to go live'], ['test', 'Needs testing'], ['draft', 'Not published']];
const BADGE: Record<string, [string, string]> = {
  live: ['Live', 'bg-signal-tint text-signal'], ready: ['Ready to go live', 'bg-violet-tint text-violet'],
  test: ['Needs testing', 'bg-hot-tint text-hot'], draft: ['Not published', 'border border-line text-ink-soft'],
};

export default function EmployeesPage() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [numbers, setNumbers] = useState<PhoneNumber[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [publishing, setPublishing] = useState('');
  const [deployId, setDeployId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');

  async function load() {
    try {
      const [s, n, c] = await Promise.all([
        fetch('/api/scripts').then((r) => r.json()),
        fetch('/api/admin/cartesia-phone-numbers').then((r) => r.json()).catch(() => ({ numbers: [] })),
        fetch('/api/campaigns').then((r) => r.json()).catch(() => ({ campaigns: [] })),
      ]);
      if (s.error) throw new Error(s.error);
      setScripts(s.scripts || []); setNumbers(n.numbers || []); setCampaigns(c.campaigns || []);
      setError('');
    } catch (e: any) { setError(e.message || 'Could not load your employees.'); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    load();
    const q = new URLSearchParams(window.location.search);
    if (q.get('deploy')) setDeployId(q.get('deploy'));
    if (q.get('new')) setAdding(true);
  }, []);
  useEffect(() => {
    if (!adding && !deployId) return;
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { setAdding(false); setDeployId(null); } };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [adding, deployId]);

  async function publish(id: string) {
    setPublishing(id);
    try {
      const res = await fetch(`/api/scripts/${id}/publish`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Publish failed');
      await load();
    } catch (e: any) { setError(e.message); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    finally { setPublishing(''); }
  }

  const deploying = useMemo(() => scripts.find((s) => s.id === deployId) || null, [scripts, deployId]);
  const inboundOf = (s: Script) => numbers.filter((n) => n.agentId && n.agentId === s.cartesia_agent_id);
  const outboundOf = (s: Script) => campaigns.filter((c) => c.script_id === s.id);
  const rows = useMemo(() => scripts.map((s) => { const inbound = inboundOf(s), outbound = outboundOf(s); return { s, inbound, outbound, st: stageOf(s, inbound, outbound) }; }), [scripts, numbers, campaigns]);
  const counts = useMemo(() => { const c: Record<string, number> = { all: rows.length, live: 0, ready: 0, test: 0, draft: 0 }; rows.forEach((r) => { c[r.st.key]++; }); return c; }, [rows]);
  const shown = rows.filter((r) => (filter === 'all' || r.st.key === filter) && (!query.trim() || (r.s.name || '').toLowerCase().includes(query.trim().toLowerCase())));

  return (
    <div className='flex min-h-screen bg-paper'>
      <Sidebar active='employees' />
      <div className='min-w-0 flex-1 px-5 py-7 pb-20 md:pb-8 lg:px-10'>
        <div className='w-full max-w-[1280px]'>
          <div className='flex flex-wrap items-end justify-between gap-4'>
            <div className='min-w-0'>
              <h1 className='m-0 font-display text-[26px] font-semibold tracking-tight'>AI Employees</h1>
              <div className='mt-1 max-w-[640px] text-[13.5px] text-ink-soft'>Build an employee, test a call until it answers right, then put it on incoming calls, outgoing campaigns, or both.</div>
            </div>
            <button onClick={() => setAdding(true)} className='shrink-0 rounded-lg bg-signal px-4 py-2.5 text-[13px] font-semibold text-on-accent' data-testid='new-employee-btn'>+ New employee</button>
          </div>

          {error && <div className='mt-4 rounded-lg bg-miss-tint px-3 py-2.5 text-[12.5px] text-miss' role='alert'>{error}</div>}
          {loading && <div className='mt-6 text-[12.5px] text-ink-soft'>Loading your employees…</div>}

          {rows.length > 0 && (
            <div className='mt-5 flex flex-wrap items-center gap-2' data-testid='employee-filters'>
              {FILTERS.filter(([k]) => k === 'all' || counts[k] > 0).map(([k, l]) => (
                <button key={k} onClick={() => setFilter(k)} className={`rounded-full border px-3 py-1 text-[12.5px] ${filter === k ? 'border-signal bg-signal/15 font-semibold text-signal' : 'border-line text-ink-soft hover:text-ink'}`}>{l} <span className='tabular-nums opacity-70'>{counts[k]}</span></button>
              ))}
              {rows.length > 6 && (
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder='Search by name' aria-label='Search employees'
                  className='ml-auto h-9 w-full rounded-lg border border-line bg-raised px-3 text-[13px] outline-none placeholder:text-ink-soft/60 focus:border-signal sm:w-[220px]' />
              )}
            </div>
          )}

          <div className='mt-4 flex flex-col gap-3' data-testid='employee-list'>
            {shown.map(({ s, inbound, outbound, st }) => {
              const running = outbound.filter((c) => c.status === 'running').length;
              const langLabel = LANGUAGES.find((l) => l.code === s.starting_language)?.label ?? s.starting_language;
              const script = s.playbook ? ' · Studio script' : (s.steps || []).length ? ` · ${(s.steps || []).length} script steps` : st.built ? '' : ' · no script yet';
              return (
                <div key={s.id} className='rounded-2xl border border-line bg-raised p-5'>
                  <div className='flex flex-wrap items-start gap-4'>
                    <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-signal-tint font-display text-xl font-bold text-signal'>{(s.name || '?').charAt(0)}</div>
                    <div className='min-w-[180px] flex-1'>
                      <div className='flex flex-wrap items-center gap-2'>
                        <div className='text-[16px] font-semibold'>{s.name}</div>
                        <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${BADGE[st.key][1]}`}>{BADGE[st.key][0]}</span>
                        {inbound.length > 0 && <span className='rounded-full bg-signal-tint px-2 py-0.5 text-[10.5px] font-semibold text-signal'>Answering {inbound.map((n) => n.number).join(', ')}</span>}
                        {running > 0 && <span className='rounded-full bg-hot-tint px-2 py-0.5 text-[10.5px] font-semibold text-hot'>Calling · {running} campaign{running > 1 ? 's' : ''} running</span>}
                      </div>
                      <div className='mt-0.5 text-[12.5px] text-ink-soft'>{langLabel} · Voice {s.voice_name || 'Priya'}{script}</div>
                    </div>
                    <div className='flex shrink-0 gap-2'>
                      {!st.built ? (
                        <button onClick={() => publish(s.id)} disabled={!!publishing} className='rounded-lg bg-signal px-4 py-2 text-[12.5px] font-semibold text-on-accent disabled:opacity-50'>{publishing === s.id ? 'Publishing…' : 'Publish'}</button>
                      ) : !st.tested ? (
                        <Link href={`/talk?scriptId=${s.id}`} className='rounded-lg bg-signal px-4 py-2 text-[12.5px] font-semibold text-on-accent'>Test a call</Link>
                      ) : (
                        <button onClick={() => setDeployId(s.id)} className='rounded-lg bg-signal px-4 py-2 text-[12.5px] font-semibold text-on-accent'>{st.live ? 'Manage' : 'Go live'}</button>
                      )}
                      {st.tested && <Link href={`/talk?scriptId=${s.id}`} className='rounded-lg border border-line px-3 py-2 text-[12.5px] font-semibold hover:bg-paper'>Test</Link>}
                      <Link href={`/agents/new?id=${s.id}`} className='rounded-lg border border-line px-3 py-2 text-[12.5px] font-semibold hover:bg-paper'>Edit</Link>
                    </div>
                  </div>
                  <Stages s={s} inbound={inbound} outbound={outbound} />
                </div>
              );
            })}

            {!loading && rows.length > 0 && shown.length === 0 && (
              <div className='rounded-2xl border border-dashed border-line p-6 text-center text-[13px] text-ink-soft'>No employees match. <button onClick={() => { setFilter('all'); setQuery(''); }} className='font-semibold text-signal'>Show all</button></div>
            )}

            {!loading && !error && scripts.length === 0 && (
              <div className='rounded-2xl border border-dashed border-line p-8 text-center' data-testid='employees-empty'>
                <div className='font-display text-[18px] font-semibold'>Build your first AI employee</div>
                <div className='mx-auto mt-1.5 max-w-[460px] text-[13.5px] text-ink-soft'>It takes a few minutes: give it a name, pick a language and voice, and add your script. Then test a call before it talks to a real customer.</div>
                <button onClick={() => setAdding(true)} className='mt-4 rounded-lg bg-signal px-5 py-2.5 text-[13px] font-semibold text-on-accent'>+ New employee</button>
              </div>
            )}
          </div>
        </div>
      </div>
      {adding && <NewEmployee onClose={() => setAdding(false)} />}
      {deploying && <DeployModal s={deploying} numbers={numbers} campaigns={outboundOf(deploying)} onClose={() => setDeployId(null)} onChanged={load} />}
    </div>
  );
}
