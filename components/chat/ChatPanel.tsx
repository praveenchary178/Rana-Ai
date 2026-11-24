'use client';
// The conversation panel of the website chat. Loaded on first open (see components/ChatWidget).
// Answers arrive as a live stream from /api/public/chat and are written on screen as the model produces them.
// The conversation is kept in this browser for 24 hours, so it survives page changes and return visits.
import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon, NL, Orb, TEL, WA_URL, track } from './base';
import { CallCard, ContactCard, DemoCard, Rich, TicketCard, TrialCard, type Lead } from './parts';

type Card = 'none' | 'demo' | 'ticket' | 'trial' | 'contact' | 'call';
type Msg = { id: string; role: 'user' | 'assistant'; text: string; at: number; card?: Card; chips?: string[]; done?: string; turn?: number; fb?: 'up' | 'down'; err?: boolean; live?: boolean };
type Store = { chatId: string | null; msgs: Msg[]; lead: Lead; ts: number };

const KEY = 'rana_chat_v2', TTL = 24 * 3600e3;
const uid = () => Math.random().toString(36).slice(2, 10);
const fresh = (): Store => ({ chatId: null, msgs: [], lead: {}, ts: Date.now() });
const mk = (role: Msg['role'], text: string, extra: Partial<Msg> = {}): Msg => ({ id: uid(), role, text, at: Date.now(), ...extra });
const clock = (at: number) => new Date(at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

function load(): Store {
  try {
    const j = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (j && Array.isArray(j.msgs) && Date.now() - (j.ts || 0) < TTL)
      return { chatId: j.chatId || null, lead: j.lead || {}, ts: j.ts, msgs: j.msgs.filter((m: Msg) => m.text || (m.card && m.card !== 'none')).map((m: Msg) => ({ ...m, live: false })) };
  } catch {}
  return fresh();
}

const ACTIONS = [
  { id: 'pricing', icon: 'tag', title: 'Pricing', sub: 'Starts from ₹3 per minute' },
  { id: 'demo', icon: 'calendar', title: 'Book a demo', sub: 'Free · 30 minutes' },
  { id: 'trial', icon: 'zap', title: 'Trial pack', sub: '₹2,500 · one-time' },
  { id: 'support', icon: 'life', title: 'Get support', sub: 'Raise a ticket' },
];
const ASKS = ['How does the AI answer my business calls?', 'Which languages can it speak?', 'Can it work on my existing phone number?'];

const iconBtn = 'grid h-9 w-9 place-items-center rounded-full text-[var(--soft)] transition hover:bg-white/10 hover:text-[var(--ink)]';
const mini = 'grid h-7 w-7 place-items-center rounded-md transition hover:bg-white/10 hover:text-[var(--ink)]';

export default function ChatPanel({ open, path, onClose, onUnread }: { open: boolean; path: string; onClose: () => void; onUnread: () => void }) {
  const [s, setS] = useState<Store>(fresh);
  const [hydrated, setHydrated] = useState(false);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [wide, setWide] = useState(false);
  const [copied, setCopied] = useState('');
  const sRef = useRef(s); sRef.current = s;
  const openRef = useRef(open); openRef.current = open;
  const busyRef = useRef(false);
  const ac = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setS(load()); setHydrated(true); }, []);
  useEffect(() => { if (hydrated) try { localStorage.setItem(KEY, JSON.stringify({ ...s, ts: Date.now() })); } catch {} }, [s, hydrated]);
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [s.msgs, open]);
  useEffect(() => { if (open && window.innerWidth >= 640) box.current?.focus(); }, [open]);
  useEffect(() => { const el = box.current; if (!el) return; el.style.height = 'auto'; el.style.height = `${Math.min(el.scrollHeight, 120)}px`; }, [text]);

  const add = (...m: Msg[]) => setS((v) => ({ ...v, msgs: [...v.msgs, ...m] }));
  const edit = (id: string, p: Partial<Msg>) => setS((v) => ({ ...v, msgs: v.msgs.map((m) => (m.id === id ? { ...m, ...p } : m)) }));

  const ask = useCallback(async (raw: string) => {
    const msg = raw.trim();
    if (!msg || busyRef.current) return;
    setText('');
    const bot = mk('assistant', '', { live: true });
    setS((v) => ({ ...v, msgs: [...v.msgs, mk('user', msg), bot] }));
    busyRef.current = true; setBusy(true);
    const ctl = new AbortController(); ac.current = ctl;
    const patch = (p: Partial<Msg>) => setS((v) => ({ ...v, msgs: v.msgs.map((m) => (m.id === bot.id ? { ...m, ...p } : m)) }));
    const finish = (j: any) => {
      setS((v) => ({ ...v, chatId: j.chatId || v.chatId, lead: j.lead || v.lead, msgs: v.msgs.map((m) => (m.id === bot.id ? { ...m, text: j.reply, card: j.card, chips: j.chips, turn: j.turn, live: false } : m)) }));
      if (!openRef.current) onUnread();
    };
    let acc = '';
    track('chat_message');
    try {
      const res = await fetch('/api/public/chat', {
        method: 'POST', signal: ctl.signal, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: sRef.current.chatId, message: msg, page: path, source: document.referrer ? `ref:${document.referrer.slice(0, 120)}` : null, stream: true }),
      });
      if (!(res.headers.get('content-type') || '').includes('event-stream') || !res.body) {
        const j = await res.json().catch(() => ({}));
        if (!res.ok || !j.reply) throw new Error(j.error || '');
        finish(j);
      } else {
        const reader = res.body.getReader(), dec = new TextDecoder();
        let buf = '', done = false;
        while (!done) {
          const r = await reader.read();
          if (r.done) break;
          buf += dec.decode(r.value, { stream: true });
          let i: number;
          while ((i = buf.indexOf(NL + NL)) >= 0) {
            const line = buf.slice(0, i); buf = buf.slice(i + 2);
            if (!line.startsWith('data:')) continue;
            const ev = JSON.parse(line.slice(5));
            if (ev.t === 'd') { acc += ev.v; patch({ text: acc }); }
            else if (ev.t === 'done') { finish(ev); done = true; }
            else if (ev.t === 'err') throw new Error(ev.error || '');
          }
        }
        if (!done) throw new Error('');
      }
    } catch (e: any) {
      if (ctl.signal.aborted) patch({ live: false, text: acc.trim() || 'Stopped.' });
      else patch({ live: false, err: true, text: acc.trim() || e?.message || 'I could not reply just now.', card: 'contact' });
    } finally { busyRef.current = false; setBusy(false); }
  }, [path, onUnread]);

  const showNumber = () => {
    const lastMsg = sRef.current.msgs[sRef.current.msgs.length - 1];
    if (lastMsg?.card !== 'call') add(mk('assistant', 'You can reach the RANA AI team directly on this number:', { card: 'call' }));
  };
  function act(id: string) {
    track('chat_action', { action: id });
    if (id === 'demo') return add(mk('user', 'Book a demo'), mk('assistant', 'Sure. Share your details and Priya, our AI caller, will ring you within seconds to fix a 30-minute demo with our team.', { card: 'demo' }));
    if (id === 'support') return add(mk('user', 'I need support'), mk('assistant', 'Tell us what is happening and a person from our team will get back to you within one working day.', { card: 'ticket' }));
    if (id === 'call') return showNumber();
    if (id === 'pricing') return ask('What does RANA AI cost?');
    if (id === 'trial') return ask('Tell me about the ₹2,500 trial pack');
  }
  function retry(m: Msg) {
    const list = sRef.current.msgs, i = list.findIndex((x) => x.id === m.id), prev = list[i - 1];
    if (!prev || prev.role !== 'user') return;
    setS((v) => ({ ...v, msgs: v.msgs.filter((x) => x.id !== m.id && x.id !== prev.id) }));
    setTimeout(() => ask(prev.text), 0);
  }
  function rate(m: Msg, v: 'up' | 'down') {
    const value = m.fb === v ? null : v;
    edit(m.id, { fb: value || undefined });
    track('chat_feedback', { value: value || 'cleared' });
    if (sRef.current.chatId && m.turn != null)
      fetch('/api/public/chat/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chatId: sRef.current.chatId, turn: m.turn, value }) }).catch(() => {});
  }
  function copy(m: Msg) {
    try { navigator.clipboard.writeText(m.text).then(() => { setCopied(m.id); setTimeout(() => setCopied(''), 1600); }); } catch {}
  }
  function reset() { ac.current?.abort(); setS(fresh()); setText(''); box.current?.focus(); }

  const home = s.msgs.length === 0;
  const lastId = s.msgs[s.msgs.length - 1]?.id;

  return (
    <section role='dialog' aria-label='Chat with Rana, the RANA AI assistant' data-testid='chat-panel'
      className={`rc-panel fixed inset-0 z-[61] flex-col overflow-hidden bg-[var(--bg)] sm:inset-auto sm:bottom-[92px] sm:right-6 sm:rounded-[20px] sm:border sm:border-[var(--line2)] sm:shadow-[0_40px_100px_-20px_rgba(0,0,0,.85),0_0_0_1px_rgba(45,225,194,.06)] sm:transition-[width,height] sm:duration-300 ${open ? 'flex' : 'hidden'} ${wide ? 'sm:h-[calc(100dvh-116px)] sm:w-[min(720px,calc(100vw-48px))]' : 'sm:h-[min(700px,calc(100dvh-116px))] sm:w-[400px]'}`}>
      <div className='pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(70%_100%_at_50%_0%,rgba(45,225,194,.13),rgba(139,124,246,.06)_55%,transparent)]' aria-hidden />

      <header className='relative flex items-center gap-3 border-b border-[var(--line)] px-4 py-3'>
        <Orb size={36} busy={busy} />
        <div className='min-w-0 flex-1'>
          <div className='flex items-center gap-2 text-[15px] font-semibold leading-tight'>Rana <span className='rounded-md border border-[var(--line2)] px-1.5 py-px text-[10px] font-semibold tracking-wide text-[var(--soft)]'>AI</span></div>
          <div className='mt-0.5 flex items-center gap-1.5 text-[12px] text-[var(--soft)]'><span className='h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--ok)]' aria-hidden /><span className='truncate'>{busy ? 'Writing…' : 'AI assistant · online'}</span></div>
        </div>
        <button type='button' onClick={showNumber} aria-label='Call us' title='Call the RANA AI team' data-testid='chat-call' className={iconBtn}><Icon name='phone' size={17} /></button>
        {!home && <button type='button' onClick={reset} aria-label='New chat' title='New chat' data-testid='chat-new' className={iconBtn}><Icon name='edit' size={17} /></button>}
        <button type='button' onClick={() => setWide((w) => !w)} aria-label={wide ? 'Make smaller' : 'Make larger'} title={wide ? 'Make smaller' : 'Make larger'} className={`${iconBtn} hidden sm:grid`}><Icon name={wide ? 'shrink' : 'expand'} size={16} /></button>
        <button type='button' onClick={onClose} aria-label='Close chat' title='Close' className={iconBtn}><Icon name='x' size={18} /></button>
      </header>

      <div className='rc-scroll relative flex-1 overflow-y-auto overscroll-contain px-4 py-4' aria-live='polite'>
        {home ? (
          <div className='rc-in mx-auto flex max-w-[520px] flex-col pt-4' data-testid='chat-home'>
            <Orb size={52} />
            <h2 className='mt-4 text-[24px] font-semibold leading-tight tracking-tight'>Hi, I’m Rana.</h2>
            <p className='mt-1.5 text-[14.5px] leading-relaxed text-[var(--soft)]'>RANA AI’s assistant. Ask me anything about AI employees for your business calls, in any language.</p>
            <div className='mt-5 grid grid-cols-2 gap-2'>
              {ACTIONS.map((a) => (
                <button key={a.id} type='button' onClick={() => act(a.id)} data-testid={`chat-action-${a.id}`}
                  className='group rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3 text-left transition hover:border-[rgba(45,225,194,.45)] hover:bg-[var(--raise)]'>
                  <span className='grid h-8 w-8 place-items-center rounded-lg bg-[rgba(45,225,194,.12)] text-[var(--a)]'><Icon name={a.icon} size={16} /></span>
                  <span className='mt-2.5 block text-[13.5px] font-semibold'>{a.title}</span>
                  <span className='block text-[12px] text-[var(--soft)]'>{a.sub}</span>
                </button>
              ))}
            </div>
            <div className='mt-5 text-[11px] font-semibold uppercase tracking-[.08em] text-[var(--faint)]'>People often ask</div>
            <div className='mt-2 flex flex-col'>
              {ASKS.map((q) => (
                <button key={q} type='button' onClick={() => ask(q)} className='group flex items-center justify-between gap-3 border-b border-[var(--line)] py-2.5 text-left text-[13.5px] transition last:border-0 hover:text-[var(--a)]'>
                  {q}<Icon name='right' size={15} className='shrink-0 text-[var(--faint)] transition group-hover:translate-x-0.5 group-hover:text-[var(--a)]' />
                </button>
              ))}
            </div>
            <div className='mt-4 flex items-center justify-between gap-3 rounded-2xl border border-[var(--line)] px-3.5 py-3'>
              <span className='text-[12.5px] text-[var(--soft)]'>Prefer to talk to a person?</span>
              <span className='flex gap-1.5'>
                <a href={`tel:${TEL}`} onClick={(e) => { if (window.innerWidth >= 640) { e.preventDefault(); showNumber(); } }} className='flex h-8 items-center gap-1.5 rounded-lg border border-[var(--line2)] px-2.5 text-[12.5px] font-medium hover:bg-white/5'><Icon name='phone' size={13} /> Call</a>
                <a href={WA_URL} target='_blank' rel='noopener noreferrer' className='flex h-8 items-center gap-1.5 rounded-lg border border-[var(--line2)] px-2.5 text-[12.5px] font-medium hover:bg-white/5'><Icon name='chat' size={13} /> WhatsApp</a>
              </span>
            </div>
          </div>
        ) : (
          <div className={`mx-auto flex flex-col gap-4 ${wide ? 'max-w-[620px]' : ''}`}>
            <div className='self-center rounded-full border border-[var(--line)] px-3 py-1 text-[11px] text-[var(--faint)]'>You are chatting with Rana, an AI assistant</div>
            {s.msgs.map((m) => m.role === 'user' ? (
              <div key={m.id} className='rc-in max-w-[85%] self-end whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-[var(--a)] px-3.5 py-2.5 text-[14px] leading-relaxed text-[var(--on)]'>{m.text}</div>
            ) : (
              <div key={m.id} className='rc-in flex items-start gap-2.5'>
                <Orb size={24} busy={!!m.live} className='mt-1' />
                <div className='min-w-0 flex-1'>
                  <div className={`inline-block max-w-full break-words rounded-2xl rounded-tl-md border px-3.5 py-2.5 text-[14px] leading-relaxed ${m.err ? 'border-[rgba(255,143,143,.35)] bg-[rgba(255,143,143,.06)]' : 'border-[var(--line)] bg-[var(--surface)]'}`}>
                    {m.text ? <Rich text={m.text} caret={m.live} /> : (
                      <span className='flex h-[22px] items-center gap-1' aria-label='Rana is writing'>
                        {[0, 1, 2].map((d) => <span key={d} className='rc-dot' style={{ animationDelay: `${d * 0.16}s` }} />)}
                      </span>
                    )}
                  </div>

                  {!m.live && m.card && m.card !== 'none' && (
                    m.done ? <div className='rc-in mt-2 flex items-start gap-2 rounded-2xl border border-[rgba(53,208,127,.35)] bg-[rgba(53,208,127,.08)] px-3.5 py-2.5 text-[13.5px] leading-relaxed'><Icon name='check' size={16} className='mt-0.5 shrink-0 text-[var(--ok)]' />{m.done}</div>
                      : m.card === 'demo' ? <DemoCard chatId={s.chatId} lead={s.lead} onDone={(t) => edit(m.id, { done: t })} />
                      : m.card === 'ticket' ? <TicketCard chatId={s.chatId} lead={s.lead} onDone={(t) => edit(m.id, { done: t })} />
                      : m.card === 'trial' ? <TrialCard /> : m.card === 'call' ? <CallCard /> : <ContactCard />
                  )}

                  {!m.live && m.err && (
                    <button type='button' onClick={() => retry(m)} className='mt-2 flex h-8 items-center gap-1.5 rounded-lg border border-[var(--line2)] px-3 text-[12.5px] font-medium hover:bg-white/5'><Icon name='retry' size={13} /> Try again</button>
                  )}

                  {!m.live && !m.err && !!m.text && (
                    <div className='mt-1 flex items-center gap-0.5 text-[var(--faint)]'>
                      <span className='mr-1.5 text-[11px]'>Rana · AI · {clock(m.at)}</span>
                      <button type='button' onClick={() => copy(m)} aria-label='Copy answer' title='Copy' className={`${mini} ${copied === m.id ? 'text-[var(--a)]' : ''}`}><Icon name={copied === m.id ? 'check' : 'copy'} size={13} /></button>
                      {m.turn != null && <>
                        <button type='button' onClick={() => rate(m, 'up')} aria-label='Helpful' aria-pressed={m.fb === 'up'} title='Helpful' data-testid='chat-fb-up' className={`${mini} ${m.fb === 'up' ? 'text-[var(--a)]' : ''}`}><Icon name='up' size={13} /></button>
                        <button type='button' onClick={() => rate(m, 'down')} aria-label='Not helpful' aria-pressed={m.fb === 'down'} title='Not helpful' data-testid='chat-fb-down' className={`${mini} ${m.fb === 'down' ? 'text-[var(--err)]' : ''}`}><Icon name='dn' size={13} /></button>
                      </>}
                    </div>
                  )}

                  {m.fb === 'down' && (
                    <div className='rc-in mt-2 rounded-2xl border border-[var(--line)] px-3.5 py-3 text-[13px]'>
                      <div className='text-[var(--soft)]'>Sorry that missed the mark. Would you like a person from our team to help?</div>
                      <div className='mt-2 flex gap-2'>
                        <button type='button' onClick={showNumber} className='flex h-8 items-center gap-1.5 rounded-lg border border-[var(--line2)] px-3 text-[12.5px] font-medium hover:bg-white/5'><Icon name='phone' size={13} /> Talk to the team</button>
                        <button type='button' onClick={() => act('support')} className='flex h-8 items-center gap-1.5 rounded-lg border border-[var(--line2)] px-3 text-[12.5px] font-medium hover:bg-white/5'><Icon name='life' size={13} /> Raise a ticket</button>
                      </div>
                    </div>
                  )}

                  {m.id === lastId && !busy && !m.live && !!m.chips?.length && (
                    <div className='mt-2.5 flex flex-wrap gap-1.5'>
                      {m.chips.map((c) => <button key={c} type='button' onClick={() => ask(c)} className='rounded-full border border-[rgba(45,225,194,.4)] px-3 py-1.5 text-[12.5px] text-[var(--a)] transition hover:bg-[rgba(45,225,194,.1)]'>{c}</button>)}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
        )}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); ask(text); }} className='relative border-t border-[var(--line)] px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-2.5'>
        <div className={`mx-auto flex items-end gap-2 rounded-2xl border border-[var(--line2)] bg-[var(--surface)] py-1.5 pl-3.5 pr-1.5 transition-colors focus-within:border-[rgba(45,225,194,.6)] ${wide ? 'max-w-[620px]' : ''}`}>
          <textarea ref={box} value={text} onChange={(e) => setText(e.target.value)} rows={1} maxLength={1500} data-testid='chat-input' aria-label='Message Rana'
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); ask(text); } }}
            placeholder='Ask anything, in any language' className='max-h-[120px] flex-1 resize-none bg-transparent py-1.5 text-[14px] leading-relaxed outline-none placeholder:text-[var(--faint)]' style={{ outline: 'none' }} />
          {busy ? (
            <button type='button' onClick={() => ac.current?.abort()} aria-label='Stop' title='Stop' data-testid='chat-stop' className='grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-[var(--ink)] hover:bg-white/20'><Icon name='stop' size={16} /></button>
          ) : (
            <button type='submit' disabled={!text.trim()} aria-label='Send' title='Send' data-testid='chat-send' className='grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--a)] text-[var(--on)] transition hover:brightness-110 disabled:bg-white/10 disabled:text-[var(--faint)]'><Icon name='send' size={17} /></button>
          )}
        </div>
        <div className='mt-1.5 text-center text-[10.5px] text-[var(--faint)]'>Rana is an AI and can make mistakes · <a href='/legal/privacy' className='underline underline-offset-2 hover:text-[var(--soft)]'>Privacy</a></div>
      </form>
    </section>
  );
}
