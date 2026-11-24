export const runtime = 'nodejs';
export const maxDuration = 60;
import { sb } from '@/lib/db';
import { botReply, type ChatLead, type ChatTurn } from '@/lib/chatBot';
import { chatLeadAlert } from '@/lib/chatAlerts';
import { runAfterResponse } from '@/lib/background';

const hits = new Map<string, number[]>();
const MAX_TURNS = 40, PER_HOUR = 80, NEW_CHATS_PER_HOUR = 25;
const TEAM = 'call or WhatsApp +91 78997 93001';
const NL = String.fromCharCode(10);
const clip = (v: unknown, n: number) => String(v ?? '').split(/[ \t\r\n]+/).join(' ').trim().slice(0, n);

/** Indian mobile becomes +91XXXXXXXXXX; anything else with 8 to 15 digits is kept with a +. */
function phoneOf(raw?: string): string | undefined {
  const d = String(raw || '').replace(/[^0-9]/g, '');
  const local = d.length === 12 && d.startsWith('91') ? d.slice(2) : d.length === 11 && d.startsWith('0') ? d.slice(1) : d;
  if (/^[6-9][0-9]{9}$/.test(local)) return `+91${local}`;
  return d.length >= 8 && d.length <= 15 ? `+${d}` : undefined;
}

/**
 * Public: POST { chatId?, message, page?, source?, stream? }.
 * The website chat. Each visitor message gets one AI reply; the conversation and what the visitor told us
 * (lead details, intent, hot / warm / cold) are saved in chat_sessions. HQ is emailed once the visitor shares a phone or email.
 * With stream: true the reply is sent as server-sent events while the model writes it:
 *   data: {t:'d', v:'text'} ... then data: {t:'done', chatId, reply, chips, card, lead, turn}   (or {t:'err', error}).
 * Without it the answer is one JSON object { chatId, reply, chips, card, lead, turn }.
 */
export async function POST(req: Request) {
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || '?';
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < 3600e3);
  if (list.length >= PER_HOUR) return Response.json({ error: `You are sending messages very fast. Please ${TEAM}, or try again in a while.` }, { status: 429 });
  list.push(now); hits.set(ip, list);

  const b = await req.json().catch(() => ({} as any));
  const text = clip(b.message, 1500);
  if (!text) return Response.json({ error: 'Type a message' }, { status: 400 });
  const page = clip(b.page, 300) || null;

  let s: any = null;
  if (/^[0-9a-f-]{36}$/i.test(String(b.chatId || ''))) s = ((await sb<any[]>(`/chat_sessions?id=eq.${b.chatId}&limit=1`).catch(() => [])) || [])[0] || null;
  if (!s) {
    // The in-memory counter above resets with each server instance, so new chats are also capped from the database.
    const since = encodeURIComponent(new Date(now - 3600e3).toISOString());
    const recent = (await sb<any[]>(`/chat_sessions?ip=eq.${encodeURIComponent(ip)}&created_at=gte.${since}&select=id&limit=${NEW_CHATS_PER_HOUR}`).catch(() => [])) || [];
    if (recent.length >= NEW_CHATS_PER_HOUR) return Response.json({ error: `Too many chats from this network. Please ${TEAM}.` }, { status: 429 });
    [s] = (await sb<any[]>(`/chat_sessions`, { method: 'POST', body: JSON.stringify({ page, ip, source: clip(b.source, 200) || null }) }).catch(() => [])) || [];
    if (!s) return Response.json({ error: `Chat is unavailable right now. Please ${TEAM}.` }, { status: 503 });
  }
  const messages: ChatTurn[] = Array.isArray(s.messages) ? s.messages : [];
  if (messages.filter((m) => m.role === 'user').length >= MAX_TURNS)
    return Response.json({ chatId: s.id, reply: `We have covered a lot. For anything more, our team is happy to help directly: ${TEAM}, or book a demo below.`, chips: [], card: 'demo', lead: s.lead || {} });

  const run = async (onDelta?: (d: string) => void) => {
    const r = await botReply(messages, text, s.lead || {}, page, onDelta);
    const lead: ChatLead = { ...(s.lead || {}), ...r.lead };
    if (lead.phone) lead.phone = phoneOf(lead.phone) || lead.phone;
    const at = new Date().toISOString();
    const next: ChatTurn[] = [...messages, { role: 'user', text, at }, { role: 'assistant', text: r.reply, at }];
    const patch: Record<string, any> = {
      messages: next, lead, updated_at: at, intent: r.intent || s.intent,
      score: r.score !== 'unknown' ? r.score : s.score, summary: r.summary || s.summary, ...(page ? { page } : {}),
    };
    await sb(`/chat_sessions?id=eq.${s.id}`, { method: 'PATCH', prefer: 'return=minimal', body: JSON.stringify(patch) }).catch(() => {});
    // First time we can reach them: tell HQ (once per chat).
    if (!s.notified_at && (lead.phone || lead.email)) {
      const claimed = (await sb<any[]>(`/chat_sessions?id=eq.${s.id}&notified_at=is.null`, { method: 'PATCH', body: JSON.stringify({ notified_at: at }) }).catch(() => [])) || [];
      if (claimed.length) await runAfterResponse(() => chatLeadAlert({ id: s.id, page, lead, score: patch.score, summary: patch.summary, messages: next }, 'The visitor shared their contact details in the website chat.'));
    }
    return { chatId: s.id, reply: r.reply, chips: r.chips, card: r.card, lead, turn: next.length - 1 };
  };

  if (b.stream !== true) return Response.json(await run());

  const enc = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(c) {
      // If the visitor pressed Stop the connection is gone; keep going so the answer is still saved.
      const send = (o: any) => { try { c.enqueue(enc.encode(`data: ${JSON.stringify(o)}${NL}${NL}`)); } catch {} };
      try { send({ t: 'done', ...(await run((d) => send({ t: 'd', v: d }))) }); }
      catch (e: any) { console.error('[chat] stream failed', e?.message); send({ t: 'err', error: `I could not reply just now. Please ${TEAM}.` }); }
      finally { try { c.close(); } catch {} }
    },
  });
  return new Response(body, { headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', 'X-Accel-Buffering': 'no' } });
}
