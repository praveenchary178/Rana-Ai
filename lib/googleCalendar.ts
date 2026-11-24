// RANA HQ's Google Calendar: Priya's demo bookings become real Google Calendar events with a Google Meet link, and
// Google itself sends the invite to every attendee.
//
// A founder connects it once on HQ → Website leads ("Connect Google Calendar"). That reuses the existing Google sign-in
// client (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET) and its redirect URI (/api/auth/google/callback), so nothing new has
// to be registered. The refresh token is kept server-side in ops_settings (key "google_calendar"), never sent to a browser.
// The Google Cloud project needs the "Google Calendar API" enabled. Never throws to callers that only read status.
import { sb } from "./db";
import { redirectUri } from "./googleAuth";

const KEY = "google_calendar";
const SCOPES = ["openid", "email", "https://www.googleapis.com/auth/calendar.events", "https://www.googleapis.com/auth/calendar.freebusy"];
export const DEMO_MINUTES = 30;
export const TZ = "Asia/Kolkata";

type Stored = { refresh_token: string; email: string | null; connected_at: string; connected_by: string | null };

async function readStored(): Promise<Stored | null> {
  const [row] = (await sb<{ value: Stored }[]>(`/ops_settings?key=eq.${KEY}&select=value`).catch(() => [])) || [];
  return row?.value?.refresh_token ? row.value : null;
}

export async function calendarStatus(): Promise<{ connected: boolean; email: string | null; connected_at: string | null }> {
  const s = await readStored();
  return { connected: !!s, email: s?.email || null, connected_at: s?.connected_at || null };
}

export async function disconnectCalendar() {
  await sb(`/ops_settings?key=eq.${KEY}`, { method: "DELETE", prefer: "return=minimal" }).catch(() => {});
  tokenCache = null;
}

export function calendarAuthorizeUrl(req: Request, state: string, loginHint?: string | null): string {
  const u = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  u.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID || "");
  u.searchParams.set("redirect_uri", redirectUri(req));
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", SCOPES.join(" "));
  u.searchParams.set("access_type", "offline");
  u.searchParams.set("prompt", "consent"); // always returns a refresh token
  u.searchParams.set("include_granted_scopes", "true");
  u.searchParams.set("state", state);
  if (loginHint && /^[^\s@]+@[^\s@]+$/.test(loginHint)) u.searchParams.set("login_hint", loginHint);
  return u.toString();
}

/** Second half of "Connect Google Calendar": swap the code for a refresh token and keep it. */
export async function connectCalendarWithCode(req: Request, code: string, by: string | null): Promise<{ email: string | null }> {
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: process.env.GOOGLE_CLIENT_ID || "", client_secret: process.env.GOOGLE_CLIENT_SECRET || "", redirect_uri: redirectUri(req), grant_type: "authorization_code" }),
    signal: AbortSignal.timeout(10_000),
  });
  const j: any = await r.json().catch(() => ({}));
  if (!r.ok || !j.refresh_token) throw new Error(`token ${r.status} ${j.error || (j.refresh_token ? "" : "no refresh token")}`.trim());
  const scopes = String(j.scope || "");
  if (!scopes.includes("calendar.events")) throw new Error("calendar permission was not granted");
  let email: string | null = null;
  try { const c = JSON.parse(Buffer.from(String(j.id_token).split(".")[1], "base64url").toString()); email = c.email ? String(c.email).toLowerCase() : null; } catch {}
  const value: Stored = { refresh_token: j.refresh_token, email, connected_at: new Date().toISOString(), connected_by: by };
  await sb(`/ops_settings?on_conflict=key`, { method: "POST", prefer: "resolution=merge-duplicates,return=minimal", body: JSON.stringify({ key: KEY, value, updated_at: new Date().toISOString() }) });
  tokenCache = { token: j.access_token, exp: Date.now() + (Number(j.expires_in) || 3000) * 1000 - 60_000 };
  return { email };
}

let tokenCache: { token: string; exp: number } | null = null;
async function accessToken(): Promise<string | null> {
  if (tokenCache && tokenCache.exp > Date.now()) return tokenCache.token;
  const s = await readStored();
  if (!s) return null;
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID || "", client_secret: process.env.GOOGLE_CLIENT_SECRET || "", refresh_token: s.refresh_token, grant_type: "refresh_token" }),
    signal: AbortSignal.timeout(10_000),
  });
  const j: any = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) throw new Error(`Google Calendar refresh failed (${j.error || r.status}). Reconnect it on HQ → Website leads.`);
  tokenCache = { token: j.access_token, exp: Date.now() + (Number(j.expires_in) || 3000) * 1000 - 60_000 };
  return tokenCache.token;
}

async function gcal(path: string, init: RequestInit = {}): Promise<any> {
  const token = await accessToken();
  if (!token) throw new Error("Google Calendar is not connected");
  const r = await fetch(`https://www.googleapis.com/calendar/v3${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers || {}) },
    signal: AbortSignal.timeout(15_000),
  });
  const j: any = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Google Calendar ${r.status}: ${String(j?.error?.message || "").slice(0, 200)}`);
  return j;
}

// ------------------------------------------------------------------ demo slots

/** Working hours for demos, IST: Monday–Saturday. */
const SLOT_TIMES = [[11, 0], [12, 30], [15, 0], [16, 30], [18, 0]] as const;
const IST_OFFSET_MIN = 330;

/** A wall-clock time in IST as a real Date. */
export function istDate(y: number, m: number, d: number, hh: number, mm: number): Date {
  return new Date(Date.UTC(y, m, d, hh, mm) - IST_OFFSET_MIN * 60_000);
}
export function istParts(d: Date) {
  const t = new Date(d.getTime() + IST_OFFSET_MIN * 60_000);
  return { y: t.getUTCFullYear(), m: t.getUTCMonth(), d: t.getUTCDate(), dow: t.getUTCDay(), hh: t.getUTCHours(), mm: t.getUTCMinutes() };
}
/** "Thursday, 20 November, 11:00 AM" (IST). */
export function istLabel(d: Date, withYear = false): string {
  return d.toLocaleString("en-IN", { timeZone: TZ, weekday: "long", day: "numeric", month: "long", ...(withYear ? { year: "numeric" } : {}), hour: "numeric", minute: "2-digit", hour12: true })
    .replace(/\bam\b/i, "AM").replace(/\bpm\b/i, "PM");
}

async function busyRanges(from: Date, to: Date): Promise<[number, number][]> {
  try {
    const j = await gcal(`/freeBusy`, { method: "POST", body: JSON.stringify({ timeMin: from.toISOString(), timeMax: to.toISOString(), timeZone: TZ, items: [{ id: "primary" }] }) });
    return (j?.calendars?.primary?.busy || []).map((b: any) => [Date.parse(b.start), Date.parse(b.end)] as [number, number]);
  } catch { return []; }
}

/** The next free demo slots (at least 3 hours from now, over the next working days), checked against the calendar when connected. */
export async function nextDemoSlots(count = 6, now = new Date()): Promise<{ iso: string; label: string }[]> {
  const earliest = now.getTime() + 3 * 3600_000;
  const candidates: Date[] = [];
  const p = istParts(now);
  for (let day = 0; day < 10 && candidates.length < 30; day++) {
    const base = new Date(Date.UTC(p.y, p.m, p.d + day));
    if (base.getUTCDay() === 0) continue; // Sunday off
    for (const [hh, mm] of SLOT_TIMES) {
      const at = istDate(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(), hh, mm);
      if (at.getTime() >= earliest) candidates.push(at);
    }
  }
  if (!candidates.length) return [];
  const connected = !!(await readStored());
  const busy = connected ? await busyRanges(candidates[0], new Date(candidates[candidates.length - 1].getTime() + DEMO_MINUTES * 60_000)) : [];
  const free = candidates.filter((c) => !busy.some(([s, e]) => c.getTime() < e && c.getTime() + DEMO_MINUTES * 60_000 > s));
  // Spread them: up to two per day, so Priya can offer "tomorrow or the day after".
  const perDay = new Map<string, number>();
  const out: { iso: string; label: string }[] = [];
  for (const c of free) {
    const k = c.toISOString().slice(0, 10);
    if ((perDay.get(k) || 0) >= 2) continue;
    perDay.set(k, (perDay.get(k) || 0) + 1);
    out.push({ iso: c.toISOString(), label: istLabel(c) });
    if (out.length >= count) break;
  }
  return out;
}

// ------------------------------------------------------------------ events

/** Creates the demo on HQ's calendar with a Google Meet link; Google emails the invite to every attendee. */
export async function createMeetEvent(o: { start: Date; minutes?: number; summary: string; description: string; attendees: string[]; requestId: string }): Promise<{ id: string; meetLink: string | null; htmlLink: string | null }> {
  const end = new Date(o.start.getTime() + (o.minutes || DEMO_MINUTES) * 60_000);
  const body = {
    summary: o.summary,
    description: o.description,
    start: { dateTime: o.start.toISOString(), timeZone: TZ },
    end: { dateTime: end.toISOString(), timeZone: TZ },
    attendees: Array.from(new Set(o.attendees.map((e) => e.trim().toLowerCase()).filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)))).map((email) => ({ email })),
    conferenceData: { createRequest: { requestId: o.requestId.slice(0, 60), conferenceSolutionKey: { type: "hangoutsMeet" } } },
    reminders: { useDefault: false, overrides: [{ method: "email", minutes: 24 * 60 }, { method: "popup", minutes: 15 }] },
    guestsCanSeeOtherGuests: true,
  };
  const j = await gcal(`/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all`, { method: "POST", body: JSON.stringify(body) });
  const meet = (j?.conferenceData?.entryPoints || []).find((e: any) => e.entryPointType === "video")?.uri || j?.hangoutLink || null;
  return { id: String(j.id), meetLink: meet, htmlLink: j.htmlLink || null };
}

/** A standard .ics invite, used when Google Calendar isn't connected (still lands in Gmail / Outlook calendars). */
export function icsInvite(o: { uid: string; start: Date; minutes?: number; summary: string; description: string; location?: string | null; organizer: string; attendees: string[] }): string {
  const f = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
  const end = new Date(o.start.getTime() + (o.minutes || DEMO_MINUTES) * 60_000);
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//RANA AI//Demo booking//EN", "METHOD:REQUEST", "CALSCALE:GREGORIAN", "BEGIN:VEVENT",
    `UID:${o.uid}@ranaai.in`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(o.start)}`, `DTEND:${f(end)}`,
    `SUMMARY:${esc(o.summary)}`, `DESCRIPTION:${esc(o.description)}`, ...(o.location ? [`LOCATION:${esc(o.location)}`] : []),
    `ORGANIZER;CN=RANA AI:mailto:${o.organizer}`,
    ...o.attendees.map((a) => `ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${a}`),
    "BEGIN:VALARM", "TRIGGER:-PT15M", "ACTION:DISPLAY", "DESCRIPTION:RANA AI demo in 15 minutes", "END:VALARM",
    "END:VEVENT", "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}
