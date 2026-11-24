// Speed-to-lead. Seconds after a website visitor books a demo, signs up, asks for a free proof run or gives their number
// to Talk to Rana, RANA HQ's AI employee (Priya) calls them from HQ's number to learn why they're looking, and a
// WhatsApp thank-you goes out. The call's recording, transcript and outcome land in HQ like any other call.
//
// Switch and settings: platform setting "instant_call" = { on, script_id, whatsapp } (turn off without a deploy).
// Every attempt is logged in `instant_calls` (placed / skipped / failed, with the reason). Never throws.
import { sb } from "./db";
import { getSetting } from "./platformSettings";
import { sarvamConfig, withClientNumber, routeVoice, placeOutboundCall, webhookUrl } from "./sarvamAgent";
import { normalisePhone } from "./campaigns";
import { dncSet } from "./compliance";
import { friendly } from "./sarvamHealth";
import { callLanguage, greetingIn, type CallLanguage } from "./callLanguages";
import { nextDemoSlots } from "./googleCalendar";

export type LeadSource = "demo" | "signup" | "proof_run" | "talk" | "followup";
export type InstantLead = {
  source: LeadSource;
  refId?: string | null;
  name?: string | null;
  company?: string | null;
  phone: string;
  email?: string | null;
  /** Anything they already told us (form notes, Talk to Rana summary) so Priya doesn't ask twice. */
  context?: string | null;
  /** The language they chose on the form ("Call me in …"): Priya opens the call in it. Code or name; English by default. */
  language?: string | null;
};
export type InstantResult = { id: string | null; called: boolean; note: string; from: string | null; whatsapp: boolean | null; lang: CallLanguage };

type Settings = { on?: boolean; script_id?: string; whatsapp?: boolean };

/** What the visitor did (said in the greeting and the WhatsApp) and the next step Priya should reach. */
const ACTION: Record<LeadSource, { did: string; next: string }> = {
  demo: { did: "booking a demo", next: "They asked for a demo: run the discovery, recommend the right RANA setup, then book the 30-minute Google Meet demo with Sri Charan in one of the open demo slots, with the decision makers on it." },
  signup: { did: "signing up for a free trial", next: "They signed up for the 14-day free trial: say a specialist switches it on shortly, and offer a 30-minute Google Meet demo with Sri Charan in one of the open demo slots to set up their first AI employee." },
  proof_run: { did: "requesting a free proof run", next: "They asked for a free proof run on their old enquiries: learn what kind and how many, then agree a time with Sri Charan to confirm the script." },
  talk: { did: "talking to Rana on our website", next: "They already talked to Rana on the website: don't repeat what they told us, and book the 30-minute Google Meet demo with Sri Charan in one of the open demo slots." },
  followup: { did: "enquiring about RANA AI on our website", next: "Follow-up call: they enquired on our website a few weeks ago and nobody closed it. Your greeting asked which language they are comfortable in: switch fully to that language and stay in it. Then ask what is on their mind now: are they still looking for an AI to answer or make their calls, and what problem they want solved. Keep it short and respectful of their time. If interested, book a 30-minute Google Meet demo with Sri Charan in one of the open demo slots and confirm their email. If not interested now, thank them warmly and end; if they say don't call again, apologise and end." },
};

/** Calls can only be placed to Indian mobiles from HQ's Indian number. */
const INDIAN_MOBILE = /^\+91[6-9]\d{9}$/;
/** One call per number per half hour (e.g. demo form right after Talk to Rana). */
const RECENT_MS = 30 * 60_000;

const clip = (v: unknown, n: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, n);
/** The name to greet: the first word that isn't an initial ("P Bhagya Veerendra" → "Bhagya", "Dr. Ravi" → "Ravi"). */
const firstName = (n?: string | null) => {
  const words = clip(n, 60).split(" ").map((w) => w.replace(/[.,]/g, "")).filter(Boolean);
  return words.find((w) => w.length > 1 && !/^(dr|mr|mrs|ms)$/i.test(w)) || "";
};

async function log(id: string | null, patch: Record<string, unknown>) {
  if (!id) return;
  await sb(`/instant_calls?id=eq.${id}`, { method: "PATCH", prefer: "return=minimal", body: JSON.stringify(patch) }).catch(() => {});
}

/** WhatsApp thank-you through the LeadFlow template function (it holds the WhatsApp token; one fixed template only). */
async function sendWhatsApp(phone: string, name: string, did: string): Promise<{ ok: boolean; note: string }> {
  const base = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const [k] = (await sb<{ value: string }[]>(`/ops_settings?key=eq.fn_key&select=value`).catch(() => [])) || [];
  if (!base || !k?.value) return { ok: false, note: "WhatsApp function key missing" };
  try {
    const r = await fetch(`${base}/functions/v1/leadflow-wa-template`, {
      method: "POST", cache: "no-store", signal: AbortSignal.timeout(10_000),
      headers: { Authorization: `Bearer ${k.value}`, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send_lead_thanks", to: phone, name, did }),
    });
    const j = await r.json().catch(() => ({}));
    return r.ok && j?.ok ? { ok: true, note: "sent" } : { ok: false, note: clip(j?.error || `HTTP ${r.status}`, 200) };
  } catch (e: any) {
    return { ok: false, note: clip(e?.message || "network error", 200) };
  }
}

/** Call a new website lead right now (and WhatsApp them). Safe to await from a public route: never throws. */
export async function callNewLead(lead: InstantLead): Promise<InstantResult> {
  const phone = normalisePhone(lead.phone || "");
  const settings = await getSetting<Settings>("instant_call", {});
  const action = ACTION[lead.source];
  const name = clip(lead.name, 80) || null;
  const lang = callLanguage(lead.language);

  const [row] = phone
    ? (await sb<any[]>(`/instant_calls`, { method: "POST", body: JSON.stringify({ source: lead.source, ref_id: lead.refId || null, name, company: clip(lead.company, 120) || null, phone, email: clip(lead.email, 120) || null, language: lang.code }) }).catch(() => [])) || []
    : [];
  const id: string | null = row?.id || null;
  const skip = async (note: string): Promise<InstantResult> => { await log(id, { call_status: "skipped", call_note: note }); return { id, called: false, note, from: null, whatsapp: null, lang }; };

  if (!phone) return { id: null, called: false, note: "no valid phone number", from: null, whatsapp: null, lang };
  if (!settings.on) return skip("instant calls are switched off");
  if (!INDIAN_MOBILE.test(phone)) return skip("not an Indian mobile number");

  try {
    const [hq] = (await sb<any[]>(`/clients?is_hq=eq.true&select=*&limit=1`)) || [];
    if (!hq) return skip("RANA HQ workspace not found");
    if ((await dncSet(hq.id, [phone])).has(phone)) return skip("number is on HQ's do-not-call list");
    const recent = (await sb<any[]>(`/instant_calls?phone=eq.${encodeURIComponent(phone)}&call_status=eq.placed&created_at=gte.${encodeURIComponent(new Date(Date.now() - RECENT_MS).toISOString())}&select=id&limit=1`).catch(() => [])) || [];
    if (recent.length) return skip("already called this number in the last 30 minutes");

    const [script] = settings.script_id ? (await sb<any[]>(`/scripts?id=eq.${settings.script_id}&client_id=eq.${hq.id}&limit=1`)) || [] : [];
    if (!script?.published_at) return skip("the lead-caller AI employee isn't set up or published");
    const base = sarvamConfig();
    if (!base) return skip("calling isn't configured on this server");

    const first = firstName(name);
    // Follow-up calls to older leads don't know their language yet: Priya opens by asking for it.
    const followup = lead.source === "followup";
    const greeting = followup
      ? `Hi${first ? ` ${first}` : ""}, this is Priya from RANA AI. You had enquired about RANA AI on our website a few weeks ago. Before we talk, which language are you most comfortable in: English, Hindi, Telugu, Tamil, Kannada, Malayalam or Marathi?`
      : greetingIn(lang, first, action.did);
    const { cfg } = await routeVoice(withClientNumber(base, hq), script.voice_name, script.engine_agent);
    // Real open times on HQ's calendar (IST), so Priya books a slot Sri Charan can actually make.
    const slots = await nextDemoSlots(6).catch(() => []);
    const placed = await placeOutboundCall(cfg, {
      phone,
      script: { ...script, greeting, starting_language: lang.sarvam },
      caller: {
        name,
        variables: {
          company: clip(lead.company, 120),
          what_they_did: followup ? "enquired about RANA AI on ranaai.in a few weeks ago; this is a follow-up call" : `${action.did} on ranaai.in, a few seconds ago`,
          already_told_us: clip(lead.context, 900),
          email_on_form: clip(lead.email, 120) || "none given: ask for it",
          open_demo_slots: slots.length ? `${slots.map((x) => x.label).join("; ")} (all IST)` : "Weekdays and Saturdays, 11 AM to 7 PM IST, from tomorrow",
          next_step: action.next,
          preferred_language: followup
            ? "Not known yet: your greeting asks. Switch fully to the language they choose (English, Hindi, Telugu, Tamil, Kannada, Malayalam or Marathi) and stay in it."
            : lang.code === "en"
            ? "English (chosen on the form). Switch only if they speak another language."
            : `${lang.label} (chosen on the form). Speak ${lang.label} in its own script from the first word; switch only if they ask or reply in another language.`,
        },
      },
      webhook: hq.webhook_secret ? webhookUrl(hq.webhook_secret) : null,
      metadata: { rana_script_id: script.id, rana_source: `instant_${lead.source}`, ...(id ? { rana_instant_call: id } : {}) },
      direction: "outbound",
    });
    await log(id, { call_status: "placed", attempt_id: placed?.attempt_id || null, called_at: new Date().toISOString(), call_note: `from ${cfg.agentNumber || "RANA's number"}` });

    let whatsapp: boolean | null = null;
    if (settings.whatsapp !== false && !followup) {
      const wa = await sendWhatsApp(phone, first || "there", action.did);
      whatsapp = wa.ok;
      await log(id, { wa_status: wa.ok ? "sent" : `failed: ${wa.note}` });
    }
    return { id, called: true, note: "calling now", from: cfg.agentNumber, whatsapp, lang };
  } catch (e: any) {
    const note = clip(friendly(e, e?.message || "call failed"), 300);
    console.error("[instant call]", lead.source, e?.message || e);
    await log(id, { call_status: "failed", call_note: note });
    return { id, called: false, note, from: null, whatsapp: null, lang };
  }
}

/** Record whether the confirmation email went out (shown next to the call in HQ). */
export async function noteEmail(r: InstantResult | null, sent: { ok: boolean; error?: string } | null) {
  if (!r?.id || !sent) return;
  await log(r.id, { email_status: sent.ok ? "sent" : `failed: ${clip(sent.error, 150)}` });
}

/** Line for the confirmation email: tells the person the call is coming, from which number. */
export function callLine(r: InstantResult | null): string | null {
  if (!r?.called) return null;
  const from = r.from ? ` from <b>${r.from.replace(/^\+91(\d{5})(\d{5})$/, "+91 $1 $2")}</b>` : "";
  return `Priya, our AI assistant, is calling you right now${from} to understand what you need. Missed it? Just reply to this email or WhatsApp us, and we'll call back.`;
}
