export const runtime = 'nodejs';
export const maxDuration = 120;
import { recordCron } from '@/lib/lifecycle';
import { maybeSyncSheet, crmDigest } from '@/lib/crmSync';
import { checkUsage } from '@/lib/opsHealth';

/** Daily ~9:00 IST (vercel.json): pull the Google Sheet, email follow-up reminders to the sales team, and warn HQ if storage is nearly full. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) return Response.json({ error: 'Forbidden' }, { status: 403 });
  // The storage check must never stop the digest, and the digest must never stop the check.
  const usage = await checkUsage().catch((e: any) => ({ error: String(e?.message || e).slice(0, 200) }));
  try {
    const sheet = await maybeSyncSheet(0);
    const digest = await crmDigest();
    await recordCron('crm-digest', true, { sheet: sheet ? (sheet.ok ? sheet.result : sheet.error) : null, digest, usage });
    return Response.json({ ok: true, sheet, digest, usage });
  } catch (e: any) {
    await recordCron('crm-digest', false, { error: String(e?.message || e).slice(0, 500), usage });
    return Response.json({ ok: false, error: String(e?.message || e), usage }, { status: 500 });
  }
}
