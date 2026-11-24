export const runtime = 'nodejs';
import { sb } from '@/lib/db';

const hits = new Map<string, number[]>();

/** Public: POST { chatId, turn, value: 'up' | 'down' | null }. A visitor rates one of Rana's answers; shown in HQ, Website chats. */
export async function POST(req: Request) {
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || '?';
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < 3600e3);
  if (list.length >= 60) return Response.json({ ok: false }, { status: 429 });
  list.push(now); hits.set(ip, list);

  const b = await req.json().catch(() => ({} as any));
  const turn = Number(b.turn);
  if (!/^[0-9a-f-]{36}$/i.test(String(b.chatId || '')) || !Number.isInteger(turn) || turn < 0) return Response.json({ ok: false }, { status: 400 });
  const [s] = (await sb<any[]>(`/chat_sessions?id=eq.${b.chatId}&select=id,messages&limit=1`).catch(() => [])) || [];
  if (!s) return Response.json({ ok: false }, { status: 404 });
  const messages: any[] = Array.isArray(s.messages) ? s.messages : [];
  const m = messages[turn];
  if (!m || m.role !== 'assistant') return Response.json({ ok: false }, { status: 400 });
  if (b.value === 'up' || b.value === 'down') m.fb = b.value; else delete m.fb;
  await sb(`/chat_sessions?id=eq.${s.id}`, { method: 'PATCH', prefer: 'return=minimal', body: JSON.stringify({ messages }) }).catch(() => {});
  return Response.json({ ok: true });
}
