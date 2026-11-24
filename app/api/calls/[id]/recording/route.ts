export const runtime = 'nodejs';
export const maxDuration = 60;
import { unauthorized } from '@/lib/auth';
import { getSession } from '@/lib/session';
import { sb } from '@/lib/db';
import { sarvamConfig } from '@/lib/sarvamAgent';

// Recordings are kept for 7 days. Transcripts, phone numbers and call details are kept for good.
// The database clears the recording link of older calls every night (rana_expire_recordings); this is the second lock.
const KEEP_DAYS = 7;

/**
 * GET /api/calls/:id/recording[?download=1] — the call's audio, streamed from the voice engine.
 * Sarvam's recordings API returns the WAV itself (not a link), so RANA serves it through this route:
 * the API key never reaches the browser, and only the call's own workspace (or RANA HQ staff) can play it.
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession(req);
  if (!session) return unauthorized();
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) return Response.json({ error: 'Not found' }, { status: 404 });
  const [call] = (await sb<any[]>(`/calls?id=eq.${params.id}&select=id,client_id,interaction_id,caller_name,created_at,raw_payload->>app_id&limit=1`).catch(() => [])) || [];
  if (!call || (call.client_id !== session.clientId && !session.hqRole)) return Response.json({ error: 'Not found' }, { status: 404 });
  if (Date.now() - new Date(call.created_at).getTime() > KEEP_DAYS * 86400000) {
    return Response.json({ error: 'Recordings are kept for 7 days. The transcript of this call is still available.' }, { status: 410 });
  }
  const interaction = String(call.interaction_id || '');
  if (!/^\d{8}\/.+/.test(interaction)) return Response.json({ error: 'This call has no recording.' }, { status: 404 });

  // RANA's own Sarvam workspace first, then the older per-client setup.
  const cfg = sarvamConfig();
  const tries = [
    cfg ? { org: cfg.orgId, ws: cfg.workspaceId, key: cfg.apiKey } : null,
    process.env.SARVAM_ORG_ID && process.env.SARVAM_WORKSPACE_ID && process.env.SARVAM_API_KEY
      ? { org: process.env.SARVAM_ORG_ID, ws: process.env.SARVAM_WORKSPACE_ID, key: process.env.SARVAM_API_KEY } : null,
  ].filter(Boolean) as { org: string; ws: string; key: string }[];
  const appId = String(call.app_id || cfg?.appId || '');
  for (const t of tries) {
    const res = await fetch(`https://apps.sarvam.ai/api/analytics/v1/${t.org}/${t.ws}/${encodeURIComponent(appId)}/recordings/${interaction}`, {
      headers: { 'X-API-Key': t.key }, cache: 'no-store',
    }).catch(() => null);
    if (!res || !res.ok || !res.body) continue;
    const name = `${String(call.caller_name || 'call').replace(/[^\w-]+/g, '-')}-${String(call.created_at).slice(0, 10)}.wav`;
    const download = new URL(req.url).searchParams.get('download');
    return new Response(res.body, {
      headers: {
        'Content-Type': res.headers.get('content-type') || 'audio/wav',
        'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${name}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  }
  return Response.json({ error: 'The recording is not available (yet).' }, { status: 404 });
}
