// Warns RANA HQ by email before the database or file storage fills up. A full project refuses every request:
// on 17 Nov 2026 that took logins and the dashboard down for hours. Runs once a day from the crm-digest cron.
// Limits default to what the Supabase Pro plan includes (8 GB database, 100 GB files); set SUPABASE_DB_LIMIT_MB /
// SUPABASE_STORAGE_LIMIT_MB in Vercel if the plan changes.
import { sb } from './db';
import { sendEmail, emailHtml } from './notify';
import { hqEmails } from './hq';

const MB = 1024 * 1024;
const WARN_AT = 80;

export async function checkUsage() {
  const r = await sb<any>('/rpc/rana_usage', { method: 'POST', body: '{}' });
  const u = Array.isArray(r) ? r[0] : r;
  const dbLimit = Number(process.env.SUPABASE_DB_LIMIT_MB || 8192), filesLimit = Number(process.env.SUPABASE_STORAGE_LIMIT_MB || 102400);
  const dbMb = Math.round((Number(u?.db_bytes) || 0) / MB), filesMb = Math.round((Number(u?.storage_bytes) || 0) / MB);
  const dbPct = Math.round((dbMb / dbLimit) * 100), filesPct = Math.round((filesMb / filesLimit) * 100);
  const warned = dbPct >= WARN_AT || filesPct >= WARN_AT;
  if (warned) {
    const tables = (Array.isArray(u?.top_tables) ? u.top_tables : []).map((t: any) => `${t.name}: ${t.mb} MB`).join(', ');
    await sendEmail({
      to: hqEmails(), kind: 'hq_usage_warning',
      subject: `Action needed: RANA storage is ${Math.max(dbPct, filesPct)}% full`,
      html: emailHtml({
        title: 'RANA is close to its storage limit',
        lines: [
          `Database: <b>${dbMb} MB of ${dbLimit} MB</b> (${dbPct}%). Files: <b>${filesMb} MB of ${filesLimit} MB</b> (${filesPct}%).`,
          'Past 100%, Supabase either charges extra or, with the spend cap on, starts refusing requests: nobody can sign in and calls stop being saved.',
          tables ? `Largest tables: ${tables}.` : '',
          'Clear old data, or review the spend cap in Supabase, before it fills up.',
        ].filter(Boolean),
        button: { label: 'Open Supabase usage', url: 'https://supabase.com/dashboard/project/_/settings/billing/usage' },
      }),
    }).catch(() => {});
  }
  return { dbMb, filesMb, dbPct, filesPct, warned };
}
