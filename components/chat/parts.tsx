'use client';
// Building blocks of the chat conversation: safe rich text for Rana's answers and the action cards
// (book a demo, raise a ticket, trial pack, call the team).
import { useState, type ReactNode } from 'react';
import { Icon, NL, PHONE, TEL, WA_URL, track } from './base';

export type Lead = Record<string, string>;

const okHref = (h: string) => (h.startsWith('/') && !h.startsWith('//')) || h.startsWith('https://') || h.startsWith('mailto:') || h.startsWith('tel:');

/** Bold and links inside one line. Built as React nodes, never as HTML, so nothing a model writes can inject markup. */
function inline(s: string): ReactNode[] {
  const out: ReactNode[] = [];
  let i = 0, k = 0;
  while (i < s.length) {
    const b = s.indexOf('**', i), l = s.indexOf('[', i);
    if (b < 0 && l < 0) break;
    if (b >= 0 && (l < 0 || b < l)) {
      const e = s.indexOf('**', b + 2);
      out.push(s.slice(i, b), <strong key={k++} className='font-semibold text-white'>{e < 0 ? s.slice(b + 2) : s.slice(b + 2, e)}</strong>);
      i = e < 0 ? s.length : e + 2;
    } else {
      const m = s.indexOf('](', l), e = m >= 0 ? s.indexOf(')', m) : -1;
      if (m < 0) { out.push(s.slice(i, l + 1)); i = l + 1; continue; }
      const label = s.slice(l + 1, m), href = e < 0 ? '' : s.slice(m + 2, e).trim();
      out.push(s.slice(i, l), okHref(href)
        ? <a key={k++} href={href} className='rc-link' {...(href.startsWith('https://') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{label}</a>
        : label);
      i = e < 0 ? s.length : e + 1;
    }
  }
  out.push(s.slice(i));
  return out;
}

/** Rana's answers: paragraphs, short bullet lists, bold and links. `caret` shows the writing cursor at the end. */
export function Rich({ text, caret }: { text: string; caret?: boolean }) {
  const blocks: { ul: boolean; lines: string[] }[] = [];
  for (const raw of text.split(NL)) {
    const line = raw.trim();
    if (!line) continue;
    const ul = line.startsWith('- ') || line.startsWith('* ') || line.startsWith('• ');
    const prev = blocks[blocks.length - 1];
    if (ul && prev?.ul) prev.lines.push(line.slice(2));
    else blocks.push({ ul, lines: [ul ? line.slice(2) : line] });
  }
  return (
    <div className='flex flex-col gap-2'>
      {blocks.map((b, i) => {
        const end = !!caret && i === blocks.length - 1;
        return b.ul ? (
          <ul key={i} className='flex flex-col gap-1.5'>
            {b.lines.map((l, j) => (
              <li key={j} className='flex gap-2.5'>
                <span className='mt-[9px] h-1 w-1 shrink-0 rounded-full bg-[var(--a)]' aria-hidden />
                <span className={end && j === b.lines.length - 1 ? 'rc-caret' : ''}>{inline(l)}</span>
              </li>
            ))}
          </ul>
        ) : <p key={i} className={end ? 'rc-caret' : ''}>{inline(b.lines[0])}</p>;
      })}
    </div>
  );
}

const input = 'w-full h-10 px-3 rounded-xl text-[13.5px] outline-none bg-[var(--bg)] border border-[var(--line)] focus:border-[var(--a)] text-[var(--ink)] placeholder:text-[var(--faint)] transition-colors';
const primary = 'flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[var(--a)] px-4 text-[13.5px] font-semibold text-[var(--on)] transition hover:brightness-110 disabled:opacity-60';
const ghost = 'flex h-10 items-center justify-center gap-1.5 rounded-xl border border-[var(--line2)] px-3 text-[13px] font-medium transition hover:bg-white/5';
const LANGS = [['en', 'English'], ['hi', 'हिन्दी · Hindi'], ['te', 'తెలుగు · Telugu'], ['ta', 'தமிழ் · Tamil'], ['kn', 'ಕನ್ನಡ · Kannada'], ['ml', 'മലയാളം · Malayalam']];

function Shell({ icon, title, sub, testid, children }: { icon: string; title: string; sub?: string; testid: string; children: ReactNode }) {
  return (
    <div className='rc-in mt-2 rounded-2xl border border-[var(--line2)] bg-[var(--surface)] p-3.5' data-testid={testid}>
      <div className='mb-3 flex items-center gap-2.5'>
        <span className='grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[rgba(45,225,194,.12)] text-[var(--a)]'><Icon name={icon} size={16} /></span>
        <div className='min-w-0'>
          <div className='text-[13.5px] font-semibold leading-tight'>{title}</div>
          {sub && <div className='text-[11.5px] text-[var(--soft)]'>{sub}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}

export function DemoCard({ chatId, lead, onDone }: { chatId: string | null; lead: Lead; onDone: (text: string) => void }) {
  const [f, setF] = useState({ name: lead.name || '', phone: (lead.phone || '').replace('+91', ''), company: lead.company || '', email: lead.email || '', callLanguage: 'en', consent: true });
  const [busy, setBusy] = useState(false), [err, setErr] = useState('');
  const set = (k: string, v: any) => setF((x) => ({ ...x, [k]: v }));
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (f.phone.replace(/[^0-9]/g, '').length < 10) { setErr('Please enter a 10-digit mobile number.'); return; }
    setBusy(true); setErr('');
    try {
      const r = await fetch('/api/demo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...f, wants: 'both', source: `chat${chatId ? `|${chatId}` : ''}`, message: lead.need || lead.business || null }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Could not book. Please try again.');
      if (chatId) fetch('/api/public/chat/event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chatId, event: 'demo', ...f }) }).catch(() => {});
      track('chat_demo_booked');
      onDone(j.calling ? `Booked. Priya, our AI caller, is ringing you now on ${f.phone} to fix your 30-minute demo. Keep your phone close.` : 'Booked. Our team will call you within one working day to fix your demo.');
    } catch (e: any) { setErr(e.message); setBusy(false); }
  }
  return (
    <Shell icon='calendar' title='Book a free demo' sub='30 minutes on Google Meet with our team' testid='chat-demo-card'>
      <form onSubmit={submit} className='grid gap-2'>
        <input className={input} required placeholder='Your name' value={f.name} onChange={(e) => set('name', e.target.value)} autoComplete='name' />
        <input className={input} required inputMode='tel' placeholder='Mobile number' value={f.phone} onChange={(e) => set('phone', e.target.value)} autoComplete='tel' />
        <input className={input} required placeholder='Business name' value={f.company} onChange={(e) => set('company', e.target.value)} autoComplete='organization' />
        <input className={input} type='email' placeholder='Email (optional)' value={f.email} onChange={(e) => set('email', e.target.value)} autoComplete='email' />
        <select className={input} value={f.callLanguage} onChange={(e) => set('callLanguage', e.target.value)} aria-label='Call me in'>
          {LANGS.map(([k, l]) => <option key={k} value={k} style={{ background: '#10172a' }}>Call me in {l}</option>)}
        </select>
        <label className='flex items-start gap-2 text-[11.5px] leading-snug text-[var(--soft)]'>
          <input type='checkbox' className='mt-0.5 accent-[#2de1c2]' checked={f.consent} onChange={(e) => set('consent', e.target.checked)} required /> RANA AI may call or message me about this demo.
        </label>
        {err && <div className='text-[12px] text-[var(--err)]' role='alert'>{err}</div>}
        <button disabled={busy} className={primary}>{busy ? 'Booking…' : <>Book my demo <Icon name='right' size={15} /></>}</button>
      </form>
    </Shell>
  );
}

export function TicketCard({ chatId, lead, onDone }: { chatId: string | null; lead: Lead; onDone: (text: string) => void }) {
  const [f, setF] = useState({ name: lead.name || '', email: lead.email || '', phone: lead.phone || '', company: lead.company || '', category: 'support', details: '', website: '' });
  const [busy, setBusy] = useState(false), [err, setErr] = useState('');
  const set = (k: string, v: any) => setF((x) => ({ ...x, [k]: v }));
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr('');
    try {
      const r = await fetch('/api/public/chat/ticket', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...f, chatId }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Could not send. Please try again.');
      track('chat_ticket');
      onDone(`Ticket #${j.number} raised. Our team replies within one working day${f.email ? `, and a confirmation is on its way to ${f.email}` : ''}. Urgent? Call ${PHONE}.`);
    } catch (e: any) { setErr(e.message); setBusy(false); }
  }
  return (
    <Shell icon='life' title='Raise a support ticket' sub='A person replies within one working day' testid='chat-ticket-card'>
      <form onSubmit={submit} className='grid gap-2'>
        <input type='text' className='hidden' tabIndex={-1} autoComplete='off' value={f.website} onChange={(e) => set('website', e.target.value)} aria-hidden />
        <input className={input} required placeholder='Your name' value={f.name} onChange={(e) => set('name', e.target.value)} autoComplete='name' />
        <div className='grid grid-cols-2 gap-2'>
          <input className={input} type='email' placeholder='Email' value={f.email} onChange={(e) => set('email', e.target.value)} autoComplete='email' />
          <input className={input} inputMode='tel' placeholder='Phone' value={f.phone} onChange={(e) => set('phone', e.target.value)} autoComplete='tel' />
        </div>
        <div className='grid grid-cols-2 gap-2'>
          <input className={input} placeholder='Business (optional)' value={f.company} onChange={(e) => set('company', e.target.value)} />
          <select className={input} value={f.category} onChange={(e) => set('category', e.target.value)} aria-label='Category'>
            {[['support', 'Support'], ['technical', 'Calls / technical'], ['billing', 'Billing'], ['sales', 'Sales question'], ['other', 'Other']].map(([k, l]) => <option key={k} value={k} style={{ background: '#10172a' }}>{l}</option>)}
          </select>
        </div>
        <textarea className={`${input} h-20 resize-none py-2`} required placeholder='What do you need help with?' value={f.details} onChange={(e) => set('details', e.target.value)} />
        {err && <div className='text-[12px] text-[var(--err)]' role='alert'>{err}</div>}
        <button disabled={busy} className={primary}>{busy ? 'Sending…' : 'Raise ticket'}</button>
      </form>
    </Shell>
  );
}

export function TrialCard() {
  return (
    <Shell icon='zap' title='₹2,500 trial pack' sub='One-time · no auto-renewal' testid='chat-trial-card'>
      <div className='mb-3 text-[13px] leading-relaxed text-[var(--soft)]'>Our team sets up an AI employee on your script and language, and you test it on real calls.</div>
      <a href='/trial?from=chat' onClick={() => track('chat_trial_click')} className={primary}>Start my trial <Icon name='right' size={15} /></a>
    </Shell>
  );
}

export function CallCard() {
  const [copied, setCopied] = useState(false);
  const copy = () => { try { navigator.clipboard.writeText(PHONE).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); } catch {} };
  return (
    <Shell icon='phone' title='RANA AI team' sub='Sales and support · call or WhatsApp' testid='chat-call-card'>
      <a href={`tel:${TEL}`} className='block text-[24px] font-semibold tracking-wide text-[var(--a)]' data-testid='chat-call-number'>{PHONE}</a>
      <div className='mt-3 grid grid-cols-3 gap-2'>
        <a href={`tel:${TEL}`} onClick={() => track('chat_call_click')} className={primary}>Call now</a>
        <button type='button' onClick={copy} className={ghost}>{copied ? <><Icon name='check' size={14} /> Copied</> : 'Copy'}</button>
        <a href={WA_URL} target='_blank' rel='noopener noreferrer' className={ghost}><Icon name='chat' size={14} /> WhatsApp</a>
      </div>
    </Shell>
  );
}

export function ContactCard() {
  return (
    <div className='rc-in mt-2 grid grid-cols-2 gap-2' data-testid='chat-contact-card'>
      <a href={`tel:${TEL}`} className={`${ghost} col-span-2 text-[15px] text-[var(--a)]`}><Icon name='phone' size={15} /> {PHONE}</a>
      <a href={WA_URL} target='_blank' rel='noopener noreferrer' className={ghost}><Icon name='chat' size={14} /> WhatsApp</a>
      <a href='mailto:hello@ranaai.in' className={ghost}><Icon name='mail' size={14} /> Email</a>
    </div>
  );
}
