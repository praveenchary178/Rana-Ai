'use client';
// The side panel for one call. Order: who and when, the three facts, what happened, the audio and transcript files,
// what the team decides (result, call back, notes), then the details and the full transcript.
import { CATEGORY_LABEL } from '@/lib/callCategory';
import { useEffect, useState } from 'react';
import StatusPill from '@/components/StatusPill';
import type { CallRow, LeadStatus } from '@/lib/calls';
import { LEAD_LABEL, LEAD_TONE, LEAD_ORDER, fmtDuration, fmtPhone, fmtClock, fmtDate } from '@/lib/format';

// Recordings are kept for 7 days; transcripts and details are kept for good.
const KEEP_DAYS = 7;

/** '/api/calls/<id>/recording' becomes the same address with ?download=1, so the browser saves the file instead of playing it. */
function downloadHref(url: string) {
  if (!url.startsWith('/api/')) return url;
  return url + (url.includes('?') ? '&' : '?') + 'download=1';
}

const realName = (n?: string | null) => (/^(|not provided|unknown)$/i.test(String(n || '').trim()) ? '' : String(n || '').trim());
// Call notes sometimes carry raw seconds such as 4.755918367346939s; show them as 4.8s.
const tidy = (t: string) => t.replace(/([0-9]+)[.]([0-9]{3,})/g, (m) => String(Math.round(Number(m) * 10) / 10));

const fileStem = (call: CallRow) => {
  const who = String(call.caller_name || call.caller_phone || 'call').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').slice(0, 40) || 'call';
  return `rana-call-${String(call.created_at || '').slice(0, 10)}-${who}`;
};

/** The transcript as a plain-text file the client can keep or share. */
function downloadTranscript(call: CallRow) {
  const head = [
    `Call: ${realName(call.caller_name) || 'Unknown caller'}${call.caller_phone ? ` (${fmtPhone(call.caller_phone)})` : ''}`,
    `Date: ${fmtDate(call.created_at)} ${fmtClock(call.created_at)} · ${call.direction === 'inbound' ? 'Incoming' : 'Outgoing'} · ${fmtDuration(call.duration_seconds)}`,
    call.interaction_id ? `Call ID: ${call.interaction_id}` : '',
    call.summary ? `\nSummary: ${call.summary}` : '',
    '\nTranscript',
    '----------',
  ].filter(Boolean);
  const lines = (call.transcript || []).map((t) => {
    const who = t.role === 'agent' ? 'AI employee' : 'Caller';
    return t.indic_text && t.indic_text !== t.text ? `${who}: ${t.indic_text}\n        (${t.text})` : `${who}: ${t.text}`;
  });
  const blob = new Blob([[...head, ...lines].join('\n') + '\n'], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${fileStem(call)}-transcript.txt`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

const LAB = 'mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-soft';

export default function CallDrawer({ call, onClose, onUpdated }: { call: CallRow | null; onClose: () => void; onUpdated: (c: CallRow) => void }) {
  const [notes, setNotes] = useState(call?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => { setNotes(call?.notes ?? ''); }, [call?.id]);
  useEffect(() => {
    if (!call) return;
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [call?.id]);
  if (!call) return null;

  async function patch(body: Record<string, unknown>) {
    setSaving(true);
    try {
      const res = await fetch(`/api/calls/${call!.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (res.ok) onUpdated(data.call);
    } finally { setSaving(false); }
  }

  function copyCallId() {
    if (!call?.interaction_id) return;
    navigator.clipboard.writeText(call.interaction_id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }).catch(() => {});
  }

  const vars = Object.entries(call.agent_variables || {}).filter(([, v]) => typeof v !== 'object');
  const hasTranscript = !!call.transcript?.length;
  const name = realName(call.caller_name);
  const answered = call.duration_seconds > 0;
  const expired = Date.now() - new Date(call.created_at).getTime() > KEEP_DAYS * 86400000;
  const btn = 'inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-[12.5px] font-semibold hover:border-ink-soft';
  const fact = 'rounded-xl border border-line px-3.5 py-3';

  return (
    <div className='fixed inset-0 z-40 flex' onClick={onClose}>
      <div className='flex-1 bg-black/40' />
      <aside className='h-full w-[520px] max-w-full overflow-y-auto border-l border-line bg-raised shadow-xl' onClick={(e) => e.stopPropagation()} role='dialog' aria-label='Call details' data-testid='call-drawer'>
        <div className='sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-line bg-raised px-6 py-5'>
          <div className='min-w-0'>
            <div className='truncate font-display text-[20px] font-semibold tracking-tight'>{name || (call.caller_phone ? fmtPhone(call.caller_phone) : 'Unknown caller')}</div>
            <div className='mt-0.5 text-[13px] text-ink-soft'>{name && call.caller_phone ? `${fmtPhone(call.caller_phone)} · ` : ''}{call.direction === 'inbound' ? 'Incoming' : 'Outgoing'} · {fmtDate(call.created_at)} {fmtClock(call.created_at)}</div>
          </div>
          <button onClick={onClose} aria-label='Close' className='grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[20px] leading-none text-ink-soft hover:bg-paper hover:text-ink'>×</button>
        </div>

        <div className='flex flex-col gap-6 p-6'>
          <div className='grid grid-cols-3 gap-3 text-[12.5px]'>
            <div className={fact}><div className='text-ink-soft'>Length</div><div className='mt-0.5 text-[16px] font-semibold tabular-nums'>{fmtDuration(call.duration_seconds)}</div></div>
            <div className={fact}><div className='text-ink-soft'>Answered</div><div className='mt-0.5 text-[16px] font-semibold capitalize'>{call.connectivity_status?.replace('_', ' ') || (answered ? 'Yes' : 'No')}</div></div>
            <div className={fact}><div className='text-ink-soft'>Result</div><div className='mt-1.5'><StatusPill label={LEAD_LABEL[call.lead_status]} tone={LEAD_TONE[call.lead_status]} /></div></div>
          </div>

          {(call.summary || call.lead_reason) && (
            <div>
              <div className={LAB}>What happened</div>
              {call.summary && <p className='m-0 text-[14px] leading-relaxed'>{call.summary}</p>}
              {call.lead_reason && (
                <div className='mt-2.5 rounded-xl bg-paper px-3.5 py-3 text-[13px] leading-relaxed'>
                  <span className='font-semibold'>Why it is marked {LEAD_LABEL[call.lead_status]}:</span> {tidy(call.lead_reason)}
                </div>
              )}
            </div>
          )}

          {call.handoff && (
            <div className='rounded-xl border border-hot/40 bg-hot-tint px-3.5 py-3' data-testid='handoff-banner'>
              <div className='text-[11.5px] font-semibold uppercase tracking-wide text-hot'>Needs a person · {call.handoff.label}</div>
              <div className='mt-1 text-[13px] leading-relaxed'>“{call.handoff.quote}”</div>
              <div className='mt-1 text-[12px] text-ink-soft'>{call.handoff.to_name ? `Routed to ${call.handoff.to_name}${call.handoff.to_phone ? ` · ${call.handoff.to_phone}` : ''}` : 'Routed to your team'}{call.handoff.emailed ? ' · alert emailed' : ''}</div>
            </div>
          )}

          <div data-testid='call-media'>
            <div className={LAB}>Recording and transcript</div>
            <div className='flex flex-col gap-3 rounded-xl border border-line p-3.5'>
              {call.recording_url && !expired ? (
                <audio controls preload='none' src={call.recording_url} className='h-9 w-full' />
              ) : (
                <div className='text-[13px] text-ink-soft' data-testid='recording-note'>
                  {!answered ? 'No recording: the call was not answered.'
                    : expired ? 'Recordings are kept for 7 days, so this one is no longer available. The transcript below is kept for good.'
                    : 'The recording is not available for this call.'}
                </div>
              )}
              {(hasTranscript || (call.recording_url && !expired)) && (
                <div className='flex flex-wrap gap-2'>
                  {call.recording_url && !expired && (
                    <a href={downloadHref(call.recording_url)} download={`${fileStem(call)}.wav`} className={btn} data-testid='download-recording'>Download recording</a>
                  )}
                  {hasTranscript && (
                    <button type='button' onClick={() => downloadTranscript(call)} className={btn} data-testid='download-transcript'>Download transcript</button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <div className={LAB}>Change the result</div>
            <div className='flex flex-wrap gap-1.5'>
              {LEAD_ORDER.map((s: LeadStatus) => (
                <button key={s} disabled={saving} onClick={() => patch({ lead_status: s })}
                  className={`rounded-lg border px-3 py-1.5 text-[12.5px] font-semibold ${call.lead_status === s ? 'border-ink bg-ink text-paper' : 'border-line text-ink-soft hover:border-ink-soft hover:text-ink'}`}>
                  {LEAD_LABEL[s]}
                </button>
              ))}
            </div>
            <label className='mt-3 flex items-center gap-2.5 text-[13.5px]'>
              <input type='checkbox' checked={Boolean(call.follow_up)} disabled={saving} onChange={(e) => patch({ follow_up: e.target.checked })} className='h-4 w-4 accent-signal' />
              Needs a call back from your team
            </label>
          </div>

          <div>
            <div className={LAB}>Notes for your team</div>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder='For example: call back after 6pm, wants EMI options'
              className='w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-[13.5px] outline-none focus:border-signal' />
            <button disabled={saving || notes === (call.notes ?? '')} onClick={() => patch({ notes })}
              className='mt-2 rounded-lg bg-signal px-3.5 py-2 text-[12.5px] font-semibold text-on-accent disabled:opacity-40'>Save notes</button>
          </div>

          {call.insight && call.category && (
            <div data-testid='call-insight'>
              <div className={LAB}>Why they called</div>
              <div className='rounded-xl border border-line px-3.5 py-3'>
                <div className='flex flex-wrap items-center gap-1.5'>
                  <span className={`rounded-full border px-2 py-0.5 text-[11.5px] font-semibold ${['marketing', 'spam', 'junk', 'wrong_number'].includes(call.category) ? 'border-line text-ink-soft' : 'border-signal/50 text-signal'}`}>{CATEGORY_LABEL[call.category as keyof typeof CATEGORY_LABEL] || call.category}</span>
                  {(call.tags || []).includes('wholesale') && <span className='rounded-full border border-warm/50 px-2 py-0.5 text-[11.5px] font-semibold text-warm'>Wholesale</span>}
                </div>
                {call.insight.purpose && <div className='mt-1.5 text-[13px] leading-relaxed'>{call.insight.purpose}</div>}
                {Object.keys(call.insight.details || {}).length > 0 && (
                  <div className='mt-1.5 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[12.5px]'>
                    {Object.entries(call.insight.details || {}).map(([k, v]: any) => <div key={k}><span className='capitalize text-ink-soft'>{k}:</span> {String(v)}</div>)}
                  </div>
                )}
              </div>
            </div>
          )}

          {vars.length > 0 && (
            <div>
              <div className={LAB}>Details captured on the call</div>
              <div className='divide-y divide-line rounded-xl border border-line text-[13px]'>
                {vars.map(([k, v]) => (
                  <div key={k} className='flex justify-between gap-3 px-3.5 py-2.5'><span className='capitalize text-ink-soft'>{k.replace(/_/g, ' ')}</span><span className='text-right font-medium'>{String(v)}</span></div>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className={LAB}>Transcript</div>
            {hasTranscript ? (
              <div className='flex flex-col gap-2'>
                {call.transcript.map((t, i) => (
                  <div key={i} className={`max-w-[88%] rounded-xl px-3.5 py-2.5 text-[13.5px] leading-relaxed ${t.role === 'agent' ? 'self-start bg-signal-tint' : 'self-end bg-paper'}`}>
                    <div className='mb-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-ink-soft'>{t.role === 'agent' ? 'AI employee' : 'Caller'}</div>
                    {t.indic_text && <div className='mb-0.5'>{t.indic_text}</div>}
                    <div className={t.indic_text ? 'text-ink-soft' : ''}>{t.text}</div>
                  </div>
                ))}
              </div>
            ) : <div className='text-[13px] text-ink-soft'>No transcript: the call was not answered.</div>}
          </div>

          {call.interaction_id && (
            <button onClick={copyCallId} className='flex items-center justify-between gap-3 rounded-xl border border-line px-3.5 py-2.5 text-left text-[11.5px] text-ink-soft hover:border-ink-soft'>
              <span className='min-w-0'><span className='block text-[11px] font-semibold uppercase tracking-[0.06em]'>Call ID (for support)</span><span className='block truncate font-mono'>{call.interaction_id}</span></span>
              <span className='shrink-0 font-semibold text-signal'>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}
