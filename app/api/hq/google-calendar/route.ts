export const runtime = "nodejs";
import { getSession } from "@/lib/session";
import { requireHq } from "@/lib/hq";
import { calendarStatus, disconnectCalendar, nextDemoSlots } from "@/lib/googleCalendar";
import { googleEnabled } from "@/lib/googleAuth";

/** GET — is HQ's Google Calendar connected (demo bookings with Google Meet), and the next free demo slots Priya would offer. */
export async function GET(req: Request) {
  const denied = requireHq(await getSession(req), "view"); if (denied) return denied;
  const [status, slots] = await Promise.all([calendarStatus(), nextDemoSlots(6)]);
  return Response.json({ ...status, available: googleEnabled(), slots });
}

/** DELETE — disconnect it (bookings then go out as .ics invites by email). */
export async function DELETE(req: Request) {
  const denied = requireHq(await getSession(req), "team"); if (denied) return denied;
  await disconnectCalendar();
  return Response.json({ ok: true });
}
