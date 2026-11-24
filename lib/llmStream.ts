// Token streaming for the website chat: yields the answer piece by piece as the model writes it.
// Same provider order as lib/llm.ts (Anthropic, then OpenAI, then Sarvam). Throws when the provider refuses to stream,
// so callers can fall back to the ordinary chat() call.
import { llmProvider, type ChatMessage, type LlmOptions } from './llm';

const NL = String.fromCharCode(10);

async function* sseData(res: Response): AsyncGenerator<string> {
  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i: number;
    while ((i = buf.indexOf(NL)) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (line.startsWith('data:')) yield line.slice(5).trim();
    }
  }
}

export async function* chatStream(messages: ChatMessage[], o: LlmOptions = {}): AsyncGenerator<string> {
  const p = llmProvider();
  if (!p) throw new Error('No AI model is configured');
  const signal = AbortSignal.timeout(o.timeoutMs ?? 60000);
  const common = { max_tokens: o.maxTokens ?? 2000, temperature: o.temperature ?? 0.3, stream: true };
  let res: Response;
  if (p === 'anthropic') {
    res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', signal,
      headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY!, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5', ...common,
        system: messages.filter((m) => m.role === 'system').map((m) => m.content).join(NL + NL),
        messages: messages.filter((m) => m.role !== 'system'),
      }),
    });
  } else if (p === 'openai') {
    res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', signal,
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-4o-mini', messages, ...common }),
    });
  } else {
    res = await fetch('https://api.sarvam.ai/v1/chat/completions', {
      method: 'POST', signal,
      headers: { 'api-subscription-key': process.env.SARVAM_CHAT_API_KEY || process.env.SARVAM_API_KEY || '', 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: process.env.SARVAM_MODEL || 'sarvam-105b', messages, ...common, reasoning_effort: null }),
    });
  }
  if (!res.ok || !res.body) throw new Error(`${p} stream ${res.status}: ${(await res.text().catch(() => '')).slice(0, 200)}`);
  for await (const data of sseData(res)) {
    if (data === '[DONE]') return;
    let j: any;
    try { j = JSON.parse(data); } catch { continue; }
    const piece = p === 'anthropic' ? (j.type === 'content_block_delta' ? j.delta?.text : '') : j.choices?.[0]?.delta?.content;
    if (piece) yield piece as string;
  }
}
