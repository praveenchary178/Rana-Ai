'use client';
// Lead alerts: the client decides where leads go (Slack, WhatsApp, email, webhook), which leads, and what is in them.
// The page is a gallery: one card per channel with its status, then the alerts that are set up, the apps that connect
// through the webhook, and the recent deliveries.
import { useEffect, useState } from 'react';
import { fmtDateTime } from '@/lib/format';
import Sidebar from '@/components/Sidebar';

const KINDS: { k: string; name: string; blurb: string }[] = [
  { k: 'whatsapp', name: 'WhatsApp', blurb: 'Send leads to your team on WhatsApp, from your own WhatsApp Business number.' },
  { k: 'email', name: 'Email', blurb: 'Email each lead to up to 10 people.' },
  { k: 'slack', name: 'Slack', blurb: 'Post leads into a Slack channel your sales team watches.' },
  { k: 'webhook', name: 'Webhook', blurb: 'Send leads to your CRM, a Google Sheet, Zapier or Make.' },
];
// Apps that receive leads through the webhook. Logo files live in /public/integrations.
const APPS: { k: string; name: string; logo: boolean }[] = [
  { k: 'sheets', name: 'Google Sheets', logo: true }, { k: 'hubspot', name: 'HubSpot', logo: true }, { k: 'zoho', name: 'Zoho CRM', logo: true },
  { k: 'zapier', name: 'Zapier', logo: true }, { k: 'make', name: 'Make', logo: true }, { k: 'salesforce', name: 'Salesforce', logo: false },
];
const field = 'w-full rounded-lg border border-line bg-sunken px-3 py-2 text-[13px]';
const LAB = 'text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-soft';
const BTN = 'rounded-lg border border-line px-3 py-1.5 text-[12.5px] font-semibold hover:border-ink-soft';
// Free Google Sheets receiver: paste into Extensions > Apps Script, deploy as a Web app, paste its URL into RANA.
const SHEETS_SCRIPT = `function doPost(e) {
  var d = JSON.parse(e.postData.contents), l = d.lead || {};
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var cols = ['name', 'phone', 'lead', 'category', 'purpose', 'details', 'wholesale', 'reason', 'summary', 'campaign', 'direction', 'when', 'talk', 'needs_person', 'recording'];
  var row = [new Date()].concat(cols.map(function (c) { return l[c] || ''; }));
  function add(name) {
    var sh = ss.getSheetByName(name) || ss.insertSheet(name);
    if (sh.getLastRow() === 0) sh.appendRow(['Received'].concat(cols));
    sh.appendRow(row);
  }
  add('RANA leads');
  if (l.wholesale === 'Yes' || l.wholesale === true) add('Wholesale');
  return ContentService.createTextOutput('ok');
}`;
const when = (d: string | null) => (d ? fmtDateTime(d) : 'never');

/** The channel or app mark on a white tile, the same in day and night mode. */
function Mark({ kind, name }: { kind: string; name?: string }) {
  const box = 'grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line bg-white text-[#0D1117]';
  if (kind === 'email') return <span className={box} aria-hidden><svg width='19' height='19' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'><rect x='3' y='5' width='18' height='14' rx='2' /><path d='m3 7 9 6 9-6' /></svg></span>;
  if (kind === 'webhook') return <span className={box} aria-hidden><svg width='19' height='19' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'><path d='M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7' /><path d='M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7' /></svg></span>;
  if (kind === 'salesforce') return <span className={`${box} text-[14px] font-bold`} aria-hidden>{(name || 'S').charAt(0)}</span>;
  return <span className={box} aria-hidden><img src={`/integrations/${kind}.svg`} alt='' width={20} height={20} className='h-5 w-5 object-contain' /></span>;
}

export default function IntegrationsPage() {
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState('');
  const [form, setForm] = useState<any>(null); // new or editing
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Record<string, { ok: boolean | null; text: string }>>({});
  const [signing, setSigning] = useState<string | null>(null);
  const [role, setRole] = useState('viewer');

  const load = () => fetch('/api/integrations').then(async (r) => { const j = await r.json(); if (!r.ok) throw new Error(j.error); setD(j); }).catch((e) => setErr(e.message));
  useEffect(() => { load(); fetch('/api/auth/me').then((r) => r.json()).then((j) => setRole(j?.user?.role || 'viewer')).catch(() => {}); }, []);
  const canEdit = ['owner', 'admin'].includes(role);

  const start = (kind: string) => { setErr(''); setForm({ kind, name: '', rules: { ...d.defaults }, recipients: '', secret: '', phoneNumberId: '', template: '', templateLang: 'en' }); };
  const edit = (i: any) => { setErr(''); setForm({ id: i.id, kind: i.kind, name: i.name, rules: i.config.rules, recipients: (i.config.recipients || []).join(', '), secret: '', secretHint: i.secretHint, phoneNumberId: i.config.phoneNumberId || '', template: i.config.template || '', templateLang: i.config.templateLang || 'en' }); };
  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const setRule = (k: string, v: any) => setForm((f: any) => ({ ...f, rules: { ...f.rules, [k]: v } }));

  async function save() {
    setBusy(true); setErr('');
    try {
      const body = { ...form, recipients: String(form.recipients || '').split(/[,\s;]+/).filter(Boolean) };
      const r = await fetch('/api/integrations', { method: form.id ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const j = await r.json(); if (!r.ok) { setErr(j.error); return; }
      if (j.signingSecret) setSigning(j.signingSecret);
      setForm(null); load();
    } finally { setBusy(false); }
  }
  async function test(id: string) {
    setMsg((m) => ({ ...m, [id]: { ok: null, text: 'Sending a sample lead…' } }));
    const r = await fetch('/api/integrations/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    const j = await r.json().catch(() => ({}));
    setMsg((m) => ({ ...m, [id]: r.ok ? { ok: true, text: 'Sample lead sent. Check that it arrived.' } : { ok: false, text: `The test failed: ${j.error || 'no reason given'}` } })); load();
  }
  async function enable(i: any) { await fetch('/api/integrations', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: i.id, enabled: !i.enabled }) }); load(); }
  async function remove(i: any) { if (!window.confirm(`Remove “${i.name}”? Leads will stop going there.`)) return; await fetch(`/api/integrations?id=${i.id}`, { method: 'DELETE' }); load(); }

  const leadLabel = (k: string) => d?.leadChoices.find((x: any) => x.key === k)?.label || k;
  const kindOf = (k: string) => KINDS.find((x) => x.k === k) || KINDS[3];
  const list: any[] = d?.integrations || [];
  const failing = (i: any) => !!i.lastError && (!i.lastSentAt || i.lastErrorAt > i.lastSentAt);

  return (
    <div className='flex min-h-screen bg-paper'>
      <Sidebar active='alerts' />
      <main className='box-border flex min-w-0 flex-1 flex-col gap-6 px-5 py-7 pb-20 md:pb-8 lg:px-10'>
        <div>
          <h1 className='m-0 font-display text-[26px] font-semibold tracking-tight'>Lead alerts</h1>
          <div className='mt-1 max-w-[760px] text-[13.5px] text-ink-soft'>The moment a call ends, send the leads you choose to where your team works. You decide the channel, which leads, which calls and what the message contains.</div>
        </div>
        {err && !form && <div className='rounded-lg bg-miss-tint px-3 py-2.5 text-[12.5px] text-miss' role='alert'>{err}</div>}
        {signing && (
          <div className='rounded-[14px] border border-signal/40 bg-signal-tint p-4 text-[13px]' data-testid='signing-secret'>
            <b>Webhook signing secret.</b> Copy it now; it will not be shown again. Every request carries <code>X-Rana-Signature: sha256=…</code> (HMAC-SHA256 of the body with this secret).
            <div className='mt-2 select-all break-all rounded-md bg-raised px-2 py-1.5 font-mono text-[12.5px]'>{signing}</div>
            <button onClick={() => setSigning(null)} className='mt-2 text-[12.5px] font-semibold text-signal'>I have saved it</button>
          </div>
        )}

        {!d ? <div className='text-[13px] text-ink-soft'>Loading…</div> : (<>
          {/* Channels */}
          <section className='flex flex-col gap-3'>
            <div className={LAB}>Channels</div>
            <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4' data-testid='alert-channels'>
              {KINDS.map((k) => {
                const mine = list.filter((i) => i.kind === k.k);
                const on = mine.filter((i) => i.enabled).length;
                return (
                  <div key={k.k} className='flex flex-col gap-3 rounded-[14px] border border-line bg-raised p-5'>
                    <div className='flex items-start justify-between gap-3'>
                      <Mark kind={k.k} />
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${on ? 'bg-signal-tint text-signal' : 'bg-sunken text-ink-soft'}`} data-testid={`status-${k.k}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${on ? 'bg-signal' : 'bg-ink-soft/50'}`} />{on ? 'Connected' : mine.length ? 'Paused' : 'Not connected'}
                      </span>
                    </div>
                    <div>
                      <div className='text-[15px] font-semibold'>{k.name}</div>
                      <div className='mt-1 text-[12.5px] leading-relaxed text-ink-soft'>{k.blurb}</div>
                    </div>
                    <div className='mt-auto flex items-center justify-between gap-3 pt-1'>
                      <span className='text-[12px] text-ink-soft'>{mine.length ? `${mine.length} alert${mine.length === 1 ? '' : 's'}` : ''}</span>
                      {canEdit && (
                        <button onClick={() => start(k.k)} data-testid={`add-${k.k}`}
                          className={mine.length ? BTN : 'rounded-lg bg-signal px-3.5 py-1.5 text-[12.5px] font-semibold text-on-accent'}>{mine.length ? 'Add another' : 'Connect'}</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {!canEdit && <div className='text-[12.5px] text-ink-soft'>Only owners and admins can change lead alerts.</div>}
          </section>

          {/* The alerts that are set up */}
          {list.length > 0 && (
            <section className='flex flex-col gap-3'>
              <div className={LAB}>Your alerts</div>
              <div className='flex flex-col gap-3' data-testid='alert-list'>
                {list.map((i) => {
                  const k = kindOf(i.kind), bad = failing(i);
                  return (
                    <div key={i.id} className='flex flex-col gap-3 rounded-[14px] border border-line bg-raised p-5'>
                      <div className='flex flex-wrap items-center gap-3'>
                        <Mark kind={i.kind} />
                        <div className='min-w-0 flex-1'>
                          <div className='flex flex-wrap items-center gap-2'>
                            <span className='truncate text-[14.5px] font-semibold'>{i.name}</span>
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${!i.enabled ? 'bg-sunken text-ink-soft' : bad ? 'bg-miss-tint text-miss' : 'bg-signal-tint text-signal'}`}>{!i.enabled ? 'Paused' : bad ? 'Last send failed' : 'Active'}</span>
                          </div>
                          <div className='text-[12px] text-ink-soft'>{k.name} · {i.sentCount ? `${i.sentCount} sent, last ${when(i.lastSentAt)}` : 'Nothing sent yet'}</div>
                        </div>
                        {canEdit && (
                          <div className='flex flex-wrap items-center gap-2'>
                            <button onClick={() => test(i.id)} className={`${BTN} text-signal`}>Send test</button>
                            <button onClick={() => edit(i)} className={BTN}>Edit</button>
                            <button onClick={() => enable(i)} className={BTN}>{i.enabled ? 'Pause' : 'Resume'}</button>
                            <button onClick={() => remove(i)} className={`${BTN} text-miss`}>Remove</button>
                          </div>
                        )}
                      </div>
                      <div className='rounded-xl bg-paper px-3.5 py-2.5 text-[12.5px] leading-relaxed text-ink-soft'>
                        Sends <b className='text-ink'>{i.config.rules.leads.map(leadLabel).join(', ')}</b> from {i.config.rules.directions.length === 2 ? 'incoming and outgoing calls' : i.config.rules.directions[0] === 'outbound' ? 'outgoing calls only' : 'incoming calls only'}, {i.config.rules.campaigns === 'all' ? 'all campaigns' : `${i.config.rules.campaigns.length} campaign(s)`}
                        {i.config.recipients?.length ? `, to ${i.config.recipients.join(', ')}` : i.secretHint ? `, to ${i.secretHint}` : ''}.
                      </div>
                      {bad && <div className='text-[12.5px] text-miss'>Last error {when(i.lastErrorAt)}: {i.lastError}</div>}
                      {msg[i.id] && <div className={`text-[12.5px] ${msg[i.id].ok === false ? 'text-miss' : msg[i.id].ok ? 'text-signal' : 'text-ink-soft'}`}>{msg[i.id].text}</div>}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Apps through the webhook */}
          <section className='flex flex-col gap-3'>
            <div>
              <div className={LAB}>Your CRM and apps</div>
              <div className='mt-1 text-[12.5px] text-ink-soft'>These connect through the Webhook channel. Add a webhook alert and paste the address the app gives you.</div>
            </div>
            <div className='grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6' data-testid='alert-apps'>
              {APPS.map((a) => (
                <button key={a.k} type='button' disabled={!canEdit} onClick={() => start('webhook')}
                  className='flex items-center gap-3 rounded-[14px] border border-line bg-raised p-3.5 text-left hover:border-ink-soft disabled:cursor-default disabled:hover:border-line'>
                  <Mark kind={a.k} name={a.name} />
                  <span className='min-w-0'><span className='block truncate text-[13.5px] font-semibold'>{a.name}</span><span className='block text-[11.5px] text-ink-soft'>Via webhook</span></span>
                </button>
              ))}
            </div>
          </section>

          {d.log.length > 0 && (
            <section className='flex flex-col gap-3'>
              <div className={LAB}>Recent deliveries</div>
              <div className='overflow-x-auto rounded-[14px] border border-line bg-raised'>
                <div className='min-w-[520px]'>
                  {d.log.slice(0, 12).map((l: any, n: number) => {
                    const i = list.find((x) => x.id === l.integration_id);
                    return (
                      <div key={n} className='grid grid-cols-[150px_minmax(0,1fr)_minmax(0,1.4fr)] items-center gap-4 border-b border-line px-5 py-2.5 text-[12.5px] last:border-b-0'>
                        <span className='tabular-nums text-ink-soft'>{when(l.created_at)}</span>
                        <span className='truncate font-medium'>{i?.name || 'Removed alert'}{l.kind === 'test' ? ' (test)' : ''}</span>
                        <span className={`truncate ${l.ok ? 'text-signal' : l.ok === false ? 'text-miss' : 'text-ink-soft'}`}>{l.ok ? 'Delivered' : l.ok === false ? `Failed: ${l.error || ''}` : 'Sending…'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}
        </>)}
      </main>

      {form && d && (
        <div className='fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/40 p-4' onMouseDown={(e) => { if (e.target === e.currentTarget) setForm(null); }}>
          <div className='my-6 flex w-full max-w-[640px] flex-col gap-4 rounded-2xl border border-line bg-raised p-6 shadow-xl' role='dialog' aria-modal='true' data-testid='alert-form'>
            <div className='flex items-center gap-3'>
              <Mark kind={form.kind} />
              <div className='font-display text-[18px] font-semibold'>{form.id ? 'Edit' : 'Connect'} {kindOf(form.kind).name}</div>
            </div>
            <label className='text-[12px] font-semibold text-ink-soft'>Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={`For example: Sales team ${kindOf(form.kind).name}`} className={`${field} mt-1`} /></label>

            {form.kind === 'slack' && (
              <label className='text-[12px] font-semibold text-ink-soft'>Slack Incoming Webhook URL
                <input value={form.secret} onChange={(e) => setForm({ ...form, secret: e.target.value })} placeholder={form.secretHint ? `Saved (${form.secretHint}). Paste a new one to replace it` : 'https://hooks.slack.com/services/…'} className={`${field} mt-1 font-mono`} />
                <span className='mt-1 block font-normal'>In Slack: Apps, then <b>Incoming Webhooks</b>, Add to Slack, pick the channel, and copy the Webhook URL.</span>
              </label>
            )}
            {form.kind === 'email' && (
              <label className='text-[12px] font-semibold text-ink-soft'>Send to (up to 10 emails)<input value={form.recipients} onChange={(e) => setForm({ ...form, recipients: e.target.value })} placeholder='sales@yourcompany.com, manager@yourcompany.com' className={`${field} mt-1`} /></label>
            )}
            {form.kind === 'webhook' && (
              <label className='text-[12px] font-semibold text-ink-soft'>Webhook URL (https)
                <input value={form.recipients} onChange={(e) => setForm({ ...form, recipients: e.target.value })} placeholder='https://hooks.zapier.com/hooks/catch/…' className={`${field} mt-1 font-mono`} />
                <span className='mt-1 block font-normal'>RANA sends JSON <code>{`{ event: 'rana.lead', title, lead: {…} }`}</code> for each lead. Works with Zapier, Make, n8n, Google Apps Script and most CRMs.</span>
              </label>
            )}
            {form.kind === 'webhook' && (
              <details className='rounded-lg bg-sunken p-3 text-[12.5px]' data-testid='sheets-help'>
                <summary className='cursor-pointer font-semibold'>Send leads straight into a Google Sheet (free, 2 minutes)</summary>
                <ol className='mt-2 flex list-decimal flex-col gap-1 pl-5 text-ink-soft'>
                  <li>Open a new Google Sheet, then <b>Extensions</b>, <b>Apps Script</b>.</li>
                  <li>Delete what is there, paste the script below, press <b>Save</b>.</li>
                  <li><b>Deploy</b>, <b>New deployment</b>, type <b>Web app</b>, Execute as <b>Me</b>, Who has access <b>Anyone</b>, then <b>Deploy</b> and allow access.</li>
                  <li>Copy the <b>Web app URL</b> (https://script.google.com/macros/s/…/exec), paste it above, add the alert, press <b>Send test</b>. A row appears in the “RANA leads” tab.</li>
                  <li>To log <b>every</b> call, tick <b>Every call (for a sheet)</b> below. Wholesale enquiries are also copied to a <b>“Wholesale”</b> tab.</li>
                </ol>
                <pre className='mt-2 overflow-x-auto whitespace-pre rounded-md border border-line bg-raised p-2 font-mono text-[11px]'>{SHEETS_SCRIPT}</pre>
                <button type='button' onClick={() => navigator.clipboard?.writeText(SHEETS_SCRIPT)} className='mt-1.5 text-[12px] font-semibold text-signal'>Copy script</button>
              </details>
            )}
            {form.kind === 'whatsapp' && (<>
              <div className='rounded-lg bg-sunken p-3 text-[12px] text-ink-soft'>Uses your own <b>WhatsApp Business (Meta Cloud API)</b> number. In Meta Business, WhatsApp, API setup, copy the <b>Phone number ID</b> and a <b>permanent access token</b>. For messages that start a chat, WhatsApp requires an <b>approved template</b>; its {'{{1}}, {{2}}…'} are filled with the details below, in order.</div>
              <div className='grid gap-3 sm:grid-cols-2'>
                <label className='text-[12px] font-semibold text-ink-soft'>Send to (numbers with country code)<input value={form.recipients} onChange={(e) => setForm({ ...form, recipients: e.target.value })} placeholder='919876543210, 919812345678' className={`${field} mt-1`} /></label>
                <label className='text-[12px] font-semibold text-ink-soft'>Phone number ID<input value={form.phoneNumberId} onChange={(e) => setForm({ ...form, phoneNumberId: e.target.value })} placeholder='1234567890…' className={`${field} mt-1 font-mono`} /></label>
                <label className='text-[12px] font-semibold text-ink-soft'>Template name<input value={form.template} onChange={(e) => setForm({ ...form, template: e.target.value })} placeholder='hot_lead_alert' className={`${field} mt-1 font-mono`} /></label>
                <label className='text-[12px] font-semibold text-ink-soft'>Template language<input value={form.templateLang} onChange={(e) => setForm({ ...form, templateLang: e.target.value })} placeholder='en' className={`${field} mt-1 font-mono`} /></label>
              </div>
              <label className='text-[12px] font-semibold text-ink-soft'>Access token<input type='password' value={form.secret} onChange={(e) => setForm({ ...form, secret: e.target.value })} placeholder={form.secretHint ? 'Saved. Paste a new token to replace it' : 'EAAG…'} className={`${field} mt-1 font-mono`} autoComplete='off' /></label>
            </>)}

            <div className='border-t border-line pt-3'>
              <div className='mb-1.5 text-[12px] font-semibold text-ink-soft'>Which leads?</div>
              <div className='flex flex-wrap gap-1.5'>{d.leadChoices.map((l: any) => <button key={l.key} type='button' onClick={() => setRule('leads', toggle(form.rules.leads, l.key))} aria-pressed={form.rules.leads.includes(l.key)} className={`rounded-full border px-3 py-1 text-[12.5px] ${form.rules.leads.includes(l.key) ? 'border-signal/50 bg-signal/15 font-semibold text-signal' : 'border-line text-ink-soft'}`}>{l.label}</button>)}</div>
            </div>
            <div className='grid gap-3 sm:grid-cols-2'>
              <div>
                <div className='mb-1.5 text-[12px] font-semibold text-ink-soft'>Which calls?</div>
                {[['outbound', 'Outgoing (campaigns)'], ['inbound', 'Incoming']].map(([k, l]) => <label key={k} className='flex items-center gap-2 text-[13px]'><input type='checkbox' checked={form.rules.directions.includes(k)} onChange={() => setRule('directions', toggle(form.rules.directions, k))} />{l}</label>)}
              </div>
              <div>
                <div className='mb-1.5 text-[12px] font-semibold text-ink-soft'>Which campaigns?</div>
                <select value={form.rules.campaigns === 'all' ? 'all' : 'some'} onChange={(e) => setRule('campaigns', e.target.value === 'all' ? 'all' : [])} className={field}><option value='all'>All campaigns</option><option value='some'>Only the ones I pick</option></select>
                {form.rules.campaigns !== 'all' && <div className='mt-1.5 flex max-h-[120px] flex-col gap-1 overflow-y-auto'>{d.campaigns.length ? d.campaigns.map((c: any) => <label key={c.id} className='flex items-center gap-2 text-[12.5px]'><input type='checkbox' checked={form.rules.campaigns.includes(c.id)} onChange={() => setRule('campaigns', toggle(form.rules.campaigns, c.id))} />{c.name}</label>) : <span className='text-[12px] text-ink-soft'>No campaigns yet.</span>}</div>}
              </div>
            </div>
            <div>
              <div className='mb-1.5 text-[12px] font-semibold text-ink-soft'>What goes in the message? {form.kind === 'whatsapp' && form.template ? <span className='font-normal'>(in this order, filling {'{{1}}, {{2}}…'})</span> : null}</div>
              <div className='grid grid-cols-2 gap-1 sm:grid-cols-3'>{d.fields.map((x: any) => <label key={x.key} className='flex items-center gap-2 text-[12.5px]'><input type='checkbox' checked={form.rules.fields.includes(x.key)} onChange={() => setRule('fields', toggle(form.rules.fields, x.key))} />{x.label}</label>)}</div>
            </div>
            {err && <div className='text-[13px] text-miss'>{err}</div>}
            <div className='flex justify-end gap-2'>
              <button onClick={() => setForm(null)} className='rounded-lg border border-line px-4 py-2 text-[13px]'>Cancel</button>
              <button onClick={save} disabled={busy} className='rounded-lg bg-signal px-4 py-2 text-[13px] font-semibold text-on-accent disabled:opacity-50' data-testid='alert-save'>{busy ? 'Saving…' : form.id ? 'Save changes' : 'Add alert'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
