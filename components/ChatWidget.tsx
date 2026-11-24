'use client';
// The ranaai.in website chat (Rana): launcher in the bottom-right corner of every public marketing page.
// Rana answers questions, explains pricing, books demos (through /api/demo, so Priya calls within seconds),
// raises support tickets and pre-qualifies the visitor. The conversation panel (components/chat/ChatPanel) is
// downloaded only when the chat is first opened. Backend: /api/public/chat (+ /ticket, /event, /feedback). HQ: Website chats.
import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { CSS, Icon, Orb, track } from './chat/base';

const loadPanel = () => import('./chat/ChatPanel');
const ChatPanel = dynamic(loadPanel, { ssr: false });

// Never on the app (signed-in pages have no `.site` wrapper), the post-payment page or public call pages.
const HIDE = [/^[/]trial[/]done/, /^[/]c[/]/];
const OPEN_KEY = 'rana_chat_open', TEASE_KEY = 'rana_chat_teased';

function teaserFor(path: string) {
  if (path.includes('pricing')) return 'Not sure which plan fits? Tell me your call volume and I will point you to it.';
  if (path.includes('trial')) return 'Questions about the ₹2,500 trial pack? Ask me anything.';
  if (path.includes('demo') || path.includes('contact')) return 'Want a quick answer before the demo? I reply in seconds.';
  return 'Hi, I am Rana. Ask me about pricing, a demo or how RANA AI answers your calls.';
}

export default function ChatWidget() {
  const path = usePathname() || '/';
  const [eligible, setEligible] = useState(false);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [teaser, setTeaser] = useState(false);
  const [unread, setUnread] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);

  // Show only on the public website (pages wrapped in `.site`).
  useEffect(() => {
    const check = () => setEligible(!!document.querySelector('.site') && !HIDE.some((r) => r.test(path)));
    check();
    const t = setTimeout(check, 600);
    return () => clearTimeout(t);
  }, [path]);

  const show = useCallback(() => {
    setReady(true); setOpen(true); setTeaser(false); setUnread(false);
    try { sessionStorage.setItem(OPEN_KEY, '1'); sessionStorage.setItem(TEASE_KEY, '1'); } catch {}
    track('chat_open');
  }, []);
  const hide = useCallback(() => {
    setOpen(false);
    try { sessionStorage.removeItem(OPEN_KEY); } catch {}
    btn.current?.focus();
  }, []);

  // A chat left open stays open when the visitor moves to another page (desktop only: on phones it covers the screen).
  useEffect(() => {
    if (!eligible) return;
    try { if (sessionStorage.getItem(OPEN_KEY) === '1' && window.innerWidth >= 640) { setReady(true); setOpen(true); } } catch {}
  }, [eligible]);
  // One friendly nudge per visit, once the visitor has had a moment to look around.
  useEffect(() => {
    if (!eligible) return;
    let seen = false; try { seen = sessionStorage.getItem(TEASE_KEY) === '1'; } catch {}
    if (seen) return;
    const t = setTimeout(() => { setTeaser(true); loadPanel(); try { sessionStorage.setItem(TEASE_KEY, '1'); } catch {} }, 12000);
    return () => clearTimeout(t);
  }, [eligible]);
  // Other parts of the site can open the chat: window.dispatchEvent(new Event('rana:chat')).
  useEffect(() => { window.addEventListener('rana:chat', show); return () => window.removeEventListener('rana:chat', show); }, [show]);
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') hide(); };
    window.addEventListener('keydown', key);
    // On phones the chat is full-screen: stop the page behind it from scrolling.
    const phone = window.innerWidth < 640, prev = document.body.style.overflow;
    if (phone) document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', key); if (phone) document.body.style.overflow = prev; };
  }, [open, hide]);

  if (!eligible) return null;
  return (
    <div className='rc font-sans'>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {ready && <ChatPanel open={open} path={path} onClose={hide} onUnread={() => setUnread(true)} />}

      <div className={`fixed z-[60] right-4 bottom-4 sm:right-6 sm:bottom-6 flex-col items-end gap-3 ${open ? 'hidden sm:flex' : 'flex'}`}>
        {teaser && !open && (
          <div className='rc-in relative max-w-[270px] rounded-2xl rounded-br-md border border-[var(--line2)] bg-[var(--surface)] px-4 py-3 text-[13.5px] leading-snug shadow-[0_20px_50px_-15px_rgba(0,0,0,.8)]' data-testid='chat-teaser'>
            <button type='button' onClick={() => setTeaser(false)} aria-label='Dismiss' className='absolute -top-2 -left-2 grid h-6 w-6 place-items-center rounded-full border border-[var(--line2)] bg-[var(--bg)] text-[var(--soft)] hover:text-[var(--ink)]'><Icon name='x' size={12} /></button>
            <button type='button' onClick={show} className='text-left'>{teaserFor(path)}</button>
          </div>
        )}
        <button ref={btn} type='button' onClick={open ? hide : show} onMouseEnter={loadPanel} onFocus={loadPanel}
          aria-label={open ? 'Close chat' : 'Chat with Rana, the RANA AI assistant'} aria-expanded={open} data-testid='chat-launcher'
          className={`group relative rounded-full bg-[linear-gradient(135deg,#2de1c2,#8b7cf6)] p-[1.5px] shadow-[0_18px_44px_-14px_rgba(45,225,194,.65)] transition-transform duration-200 hover:scale-[1.03] active:scale-[.98]`}>
          {open ? (
            <span className='grid h-[52px] w-[52px] place-items-center rounded-full bg-[var(--surface)]'><Icon name='down' size={22} /></span>
          ) : (
            <span className='flex h-[52px] items-center gap-2.5 rounded-full bg-[var(--surface)] pl-1.5 pr-1.5 sm:pr-5'>
              <Orb size={40} />
              <span className='hidden text-left leading-tight sm:block'>
                <span className='block text-[14px] font-semibold'>Ask Rana</span>
                <span className='block text-[11px] text-[var(--soft)]'>AI assistant · replies in seconds</span>
              </span>
            </span>
          )}
          {(unread || teaser) && !open && <span className='rc-ring absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-[var(--bg)] bg-[var(--a)]' aria-hidden />}
        </button>
      </div>
    </div>
  );
}
