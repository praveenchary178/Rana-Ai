'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';

type Turn = { role: 'user' | 'assistant'; text: string; at?: string; fb?: 'up' | 'down' };
type Chat = { id: string; created_at: string; updated_at: string; page: string | null; source: string | null; messages: Turn[]; lead: Record<string, string>; intent: string | null; score: string | null; summary: string | null; demo_booked_at: string | null; ticket_id: string | null };
type Ticket = { id: string; number: number; created_at: string; name: string | null; email: string | null; phone: string | null; company: string | null; category: string; subject: string | null; details: string | null; status: 'open' | 'in_progress' | 'resolved'; hq_notes: string | null; chat_id: string | null };

const TONE: Record<string, string> = { hot: 'text-hot border-hot/50 bg-hot/10', warm: 'text-[#c98a00] border-[#c98a00]/40 bg-[#c98a00]/10', cold: 'text-ink-soft border-line' };
const STATUS: Record<Ticket['status'], [string, string]> = { open: ['Open', 'text-hot border-hot/50 bg-hot/10'], in_progress: ['In progress', 'text-[#c98a00] border-[#c98a00]/40 bg-[#c98a00]/10'], resolved: ['Resolved', 'text-signal border-signal/50 bg-signal/10'] };
const FIELDS: [string, string][] = [['name', 'Name'], ['company', 'Company'], ['phone', 'Phone'], ['email', 'Email'], ['business', 'Business'], ['city', 'City'], ['call_volume', 'Call volume'], ['languages', 'Languages'], ['need', 'Needs'], ['timeline', 'Timeline'], ['role', 'Role']];
const when = (d: string) => {
  const s = (Date.now() - Date.parse(d)) / 1000;
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
};

/** RANA HQ → Website chats: every conversation with the website chat (lead details, score, transcript) and support tickets. */
export default function HqChatsPage() {
  const [data, setData] = useState<{ chats: Chat[]; tickets: Ticket[] } | null>(null);
  const [err, setErr] = useState('');
  const [tab, setTab] = useState<'chats' | 'tickets'>('chats');
  const [filter, setFilter] = useState('all');
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const load = () => fetch('/api/hq/chats').then(async (r) => { const j = await r.json(); if (!r.ok) throw new Error(j.error); setData(j); }).catch((e) => setErr(e.message));
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('tab') === 'tickets') setTab('tickets');
    load(); const t = setInterval(load, 30000); return () => clearInterval(t);
  }, []);

  async function setStatus(t: Ticket, status: Ticket['status']) {
    await fetch('/api/hq/chats', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ticketId: t.id, status }) }).catch(() => {});
    load();
  }

  const chats = data?.chats || [], tickets = data?.tickets || [];
  const stats = useMemo(() => ({
    chats: chats.length,
    leads: chats.filter((c) => c.lead?.phone || c.lead?.email).length,
    hot: chats.filter((c) => c.score === 'hot').length,
    demos: chats.filter((c) => c.demo_booked_at).length,
    open: tickets.filter((t) => t.status !== 'resolved').length,
  }), [chats, tickets]);
  const shown = chats.filter((c) => filter === 'all' || (filter === 'leads' ? !!(c.lead?.phone || c.lead?.email) : filter === 'demo' ? !!c.demo_booked_at : filter === 'ticket' ? !!c.ticket_id : c.score === filter));

  const Tile = ({ label, value, tone }: { label: string; value: number; tone?: string }) => (
    <div className='border border-line rounded-xl bg-raised px-4 py-3.5'>
      <div className='text-[11px] font-semibold uppercase tracking-wide text-ink-soft'>{label}</div>
      <div className={`text-[26px] font-display font-semibold tabular-nums mt-0.5 ${tone || ''}`}>{value}</div>
    </div>
  );

  return (
    <div className='flex min-h-screen bg-paper'>
      <Sidebar active='hq' />
      <div className='flex-1 p-6 md:p-10 min-w-0'>
        <div className='w-full max-w-[1400px] flex flex-col gap-5'>
          <div>
            <div className='text-[11px] font-semibold uppercase tracking-wide text-signal'><Link href='/hq'>RANA HQ</Link> · Website chats</div>
            <div className='text-[22px] font-display font-semibold'>Website chat &amp; support tickets</div>
            <div className='text-[13px] text-ink-soft mt-0.5'>Every conversation with Rana, the chat on ranaai.in: what the visitor asked, what they told us about their business, how hot they are, whether they rated an answer 👍 or 👎, and any demo or ticket they raised. Also on <Link href='/hq/leads' className='text-signal'>Website leads</Link>.</div>
          </div>

          <div className='grid grid-cols-2 md:grid-cols-5 gap-3' data-testid='chats-stats'>
            <Tile label='Chats' value={stats.chats} />
            <Tile label='Shared contact' value={stats.leads} tone='text-signal' />
            <Tile label='Hot' value={stats.hot} tone={stats.hot ? 'text-hot' : ''} />
            <Tile label='Demos booked' value={stats.demos} tone='text-signal' />
            <Tile label='Open tickets' value={stats.open} tone={stats.open ? 'text-hot' : ''} />
          </div>

          <div className='flex flex-wrap items-center gap-2 text-[12.5px]'>
            {(['chats', 'tickets'] as const).map((k) => (
              <button key={k} onClick={() => setTab(k)} className={`rounded-lg px-3.5 py-1.5 font-semibold ${tab === k ? 'bg-ink text-paper' : 'border border-line text-ink-soft'}`}>{k === 'chats' ? `Chats (${chats.length})` : `Tickets (${tickets.length})`}</button>
            ))}
            {tab === 'chats' && <span className='w-px h-5 bg-line mx-1' />}
            {tab === 'chats' && [['all', 'All'], ['leads', 'Shared contact'], ['hot', 'Hot'], ['warm', 'Warm'], ['demo', 'Booked demo'], ['ticket', 'Raised ticket']].map(([k, l]) => (
              <button key={k} onClick={() => setFilter(k)} className={`rounded-full border px-3 py-1 ${filter === k ? 'bg-signal/15 border-signal text-signal font-semibold' : 'border-line text-ink-soft hover:text-ink'}`}>{l}</button>
            ))}
          </div>

          {err && <div className='text-[13px] text-miss'>{err}</div>}
          {!data && !err && <div className='text-[13px] text-ink-soft'>Loading…</div>}

          {tab === 'chats' && data && (
            <div className='flex flex-col gap-3' data-testid='chats-list'>
              {!shown.length && <div className='border border-dashed border-line rounded-xl p-6 text-[13px] text-ink-soft'>No chats here yet.</div>}
              {shown.map((c) => {
                const fields = FIELDS.filter(([k]) => c.lead?.[k]);
                const first = c.messages.find((m) => m.role === 'user')?.text;
                return (
                  <div key={c.id} className='border border-line rounded-xl bg-raised p-4 sm:p-5 flex flex-col gap-3'>
                    <div className='flex flex-wrap items-start justify-between gap-3'>
                      <div className='min-w-0'>
                        <div className='text-[15px] font-semibold'>{c.lead?.name || c.lead?.company || 'Anonymous visitor'}{c.lead?.company && c.lead?.name && <span className='text-ink-soft font-normal'> · {c.lead.company}</span>}</div>
                        <div className='text-[12.5px] text-ink-soft mt-0.5'>{when(c.updated_at)} · {c.messages.filter((m) => m.role === 'user').length} messages · {c.intent || 'general'} · {c.page || '—'}</div>
                      </div>
                      <div className='flex flex-wrap gap-1.5'>
                        {c.score && c.score !== 'unknown' && <span className={`text-[11.5px] font-semibold border rounded-full px-2.5 py-0.5 capitalize ${TONE[c.score] || TONE.cold}`}>{c.score}</span>}
                        {c.demo_booked_at && <span className='text-[11.5px] font-semibold border rounded-full px-2.5 py-0.5 text-signal border-signal/50 bg-signal/10'>Demo booked</span>}
                        {c.messages.some((m) => m.fb === 'down') && <span className='text-[11.5px] font-semibold border rounded-full px-2.5 py-0.5 text-hot border-hot/50 bg-hot/10'>👎 Not helpful</span>}
                        {c.messages.some((m) => m.fb === 'up') && <span className='text-[11.5px] font-semibold border rounded-full px-2.5 py-0.5 text-signal border-signal/50 bg-signal/10'>👍 Helpful</span>}
                        {c.ticket_id && <span className='text-[11.5px] font-semibold border rounded-full px-2.5 py-0.5 text-[#8b7cf6] border-[#8b7cf6]/50 bg-[#8b7cf6]/10'>Ticket</span>}
                      </div>
                    </div>
                    {c.summary ? <div className='text-[14px] leading-relaxed border-l-2 border-signal pl-3'>{c.summary}</div> : first ? <div className='text-[13.5px] text-ink-soft'>“{first}”</div> : null}
                    {fields.length > 0 && (
                      <div className='grid sm:grid-cols-2 lg:grid-cols-4 gap-2'>
                        {fields.map(([k, l]) => (
                          <div key={k} className='rounded-lg bg-sunken px-3 py-2'>
                            <div className='text-[10.5px] font-semibold uppercase tracking-wide text-ink-soft'>{l}</div>
                            <div className='text-[13px] mt-0.5 break-words'>{k === 'phone' ? <a href={`tel:${c.lead[k]}`} className='text-signal font-semibold'>{c.lead[k]}</a> : k === 'email' ? <a href={`mailto:${c.lead[k]}`} className='text-signal'>{c.lead[k]}</a> : c.lead[k]}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    <button onClick={() => setOpen((o) => ({ ...o, [c.id]: !o[c.id] }))} className='self-start text-[12.5px] text-signal font-semibold'>{open[c.id] ? 'Hide conversation' : `Show conversation (${c.messages.length})`}</button>
                    {open[c.id] && (
                      <div className='rounded-lg bg-sunken p-3 flex flex-col gap-1.5 max-h-[420px] overflow-y-auto'>
                        {c.messages.map((m, i) => <div key={i} className='text-[13px] leading-relaxed'><b className={m.role === 'user' ? '' : 'text-signal'}>{m.role === 'user' ? 'Visitor' : 'Rana'}:</b> {m.text}{m.fb === 'up' ? ' 👍' : m.fb === 'down' ? ' 👎' : ''}</div>)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'tickets' && data && (
            <div className='flex flex-col gap-3' data-testid='tickets-list'>
              {!tickets.length && <div className='border border-dashed border-line rounded-xl p-6 text-[13px] text-ink-soft'>No tickets yet.</div>}
              {tickets.map((t) => (
                <div key={t.id} className='border border-line rounded-xl bg-raised p-4 sm:p-5 flex flex-col gap-2.5'>
                  <div className='flex flex-wrap items-start justify-between gap-3'>
                    <div>
                      <div className='text-[15px] font-semibold'>#{t.number} · {t.subject || 'Support request'}</div>
                      <div className='text-[12.5px] text-ink-soft mt-0.5 flex flex-wrap gap-x-3'>
                        <span>{t.name}{t.company ? ` · ${t.company}` : ''}</span>
                        {t.phone && <a href={`tel:${t.phone}`} className='text-signal font-semibold'>{t.phone}</a>}
                        {t.email && <a href={`mailto:${t.email}?subject=${encodeURIComponent(`Re: ticket #${t.number}`)}`} className='text-signal'>{t.email}</a>}
                        <span>{t.category} · {when(t.created_at)}</span>
                      </div>
                    </div>
                    <span className={`text-[11.5px] font-semibold border rounded-full px-2.5 py-0.5 ${STATUS[t.status][1]}`}>{STATUS[t.status][0]}</span>
                  </div>
                  {t.details && <div className='text-[13.5px] leading-relaxed whitespace-pre-wrap'>{t.details}</div>}
                  <div className='flex flex-wrap gap-2 pt-1'>
                    {(['open', 'in_progress', 'resolved'] as const).filter((s) => s !== t.status).map((s) => (
                      <button key={s} onClick={() => setStatus(t, s)} className='text-[12px] font-semibold border border-line rounded-lg px-3 py-1.5 hover:border-ink-soft'>Mark {STATUS[s][0].toLowerCase()}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
