"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import OutboundShell, { ModePill, StagePill, Notice, btn, primary, runEngine, getJson, ago, when } from "@/components/OutboundShell";

/** RANA HQ → Outbound → WhatsApp inbox. Priya (AI) answers by default; take over to reply yourself.
 *  Built to be used from a phone too: the list and the open chat refresh on their own while the page is open,
 *  the tab title shows the unread count, and a new customer message gives a short buzz on phones that support it. */
const LIST_EVERY_MS = 15_000;
const THREAD_EVERY_MS = 8_000;

function sentByLabel(sentBy: string, agent: string) {
  if (sentBy === "agent") return `${agent} (AI)`;
  if (sentBy === "you") return "You";
  if (sentBy === "template") return "Template";
  if (sentBy?.startsWith("call-summary:")) return `Call summary · ${sentBy.slice("call-summary:".length)}`;
  return sentBy && sentBy !== "" ? sentBy : "Sent";
}

export default function WhatsAppInbox() {
  const [list, setList] = useState<any>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [t, setT] = useState<any>(null);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState("");
  const [q, setQ] = useState("");
  const bottom = useRef<HTMLDivElement>(null);
  const openRef = useRef<string | null>(null);
  const lastMsgId = useRef<number>(0);
  const seenUnread = useRef<number | null>(null);

  const loadList = useCallback(() => getJson("/api/hq/outbound/whatsapp").then((l: any) => {
    setList(l);
    // Buzz once when the total unread count goes up (a new customer message arrived) — phones only, best-effort.
    const unread = (l?.convos || []).reduce((n: number, c: any) => n + (c.unread || 0), 0);
    if (seenUnread.current !== null && unread > seenUnread.current) {
      try { (navigator as any).vibrate?.([120, 60, 120]); } catch { /* not supported */ }
    }
    seenUnread.current = unread;
    document.title = unread ? `(${unread}) WhatsApp inbox · RANA HQ` : "WhatsApp inbox · RANA HQ";
  }).catch((e) => setErr(e.message)), []);

  /** Silent refresh of the open chat: keeps whatever you're typing, only scrolls when something new arrived. */
  const refreshThread = useCallback(async (number: string) => {
    try {
      const j = await getJson(`/api/hq/outbound/whatsapp/${encodeURIComponent(number)}`);
      if (openRef.current !== number) return; // you switched chats meanwhile
      setT(j);
    } catch { /* keep the last good copy; the next tick retries */ }
  }, []);

  async function openThread(number: string) {
    setOpen(number); openRef.current = number; setT(null); setText(""); setErr(""); lastMsgId.current = 0;
    try {
      const j = await getJson(`/api/hq/outbound/whatsapp/${encodeURIComponent(number)}`);
      if (openRef.current !== number) return;
      setT(j);
      setList((l: any) => l && { ...l, convos: l.convos.map((c: any) => (c.number === number ? { ...c, unread: 0 } : c)) });
    } catch (e: any) { setErr(e.message); }
  }

  useEffect(() => {
    loadList();
    const n = new URLSearchParams(window.location.search).get("n");
    if (n) openThread(n);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live updates while the page is visible (paused in a background tab / locked phone; catches up on return).
  useEffect(() => {
    const tick = () => { if (document.visibilityState === "visible") loadList(); };
    const id = window.setInterval(tick, LIST_EVERY_MS);
    const onShow = () => { if (document.visibilityState === "visible") { loadList(); if (openRef.current) refreshThread(openRef.current); } };
    document.addEventListener("visibilitychange", onShow);
    return () => { window.clearInterval(id); document.removeEventListener("visibilitychange", onShow); };
  }, [loadList, refreshThread]);

  useEffect(() => {
    if (!open) return;
    const id = window.setInterval(() => { if (document.visibilityState === "visible" && openRef.current) refreshThread(openRef.current); }, THREAD_EVERY_MS);
    return () => window.clearInterval(id);
  }, [open, refreshThread]);

  // Scroll to the newest message only when one actually arrived (not on every silent refresh).
  useEffect(() => {
    const newest = Number(t?.messages?.[t.messages.length - 1]?.id || 0);
    if (newest && newest !== lastMsgId.current) {
      lastMsgId.current = newest;
      bottom.current?.scrollIntoView({ block: "end" });
    }
  }, [t]);

  async function act(body: Record<string, unknown>, done: string) {
    if (!open) return;
    setBusy(String(body.action)); setErr(""); setMsg("");
    try {
      await runEngine({ ...body, number: open });
      setMsg(done);
      if (body.action === "wa_reply") setText("");
      await refreshThread(open); loadList();
    } catch (e: any) { setErr(e.message); } finally { setBusy(""); }
  }

  const agent = list?.agentName || "Priya";
  const convos = (list?.convos || []).filter((c: any) => { const s = q.trim().toLowerCase(); return !s || [c.name, c.company, c.number].some((v) => String(v || "").toLowerCase().includes(s)); });
  const mode = t?.convo?.mode || "agent";

  return (
    <OutboundShell title="WhatsApp inbox" sub={`${agent} (AI) chats with leads and inbound contacts, books demos, and hands chats to you. Updates live while this page is open.${list && !list.agentOn ? ` ${agent} is switched off in Settings.` : ""}`}>
      <Notice err={err} msg={msg} onClear={() => { setErr(""); setMsg(""); }} />
      <div className="grid md:grid-cols-[340px_1fr] gap-3 md:h-[calc(100vh-220px)] md:min-h-[480px]">
        <div className={`border border-line rounded-xl bg-raised flex flex-col min-h-0 ${open ? "hidden md:flex" : "flex"}`} data-testid="wa-list">
          {/* 16px on phones so iOS doesn't zoom the page when the field is tapped */}
          <div className="p-2 border-b border-line"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or number…" className="w-full border border-line rounded-lg px-3 py-2 text-[16px] md:text-[13px] bg-paper" /></div>
          <div className="overflow-y-auto flex-1">
            {!list ? <div className="p-4 text-[13px] text-ink-soft">{err ? "" : "Loading…"}</div> : !convos.length ? (
              <div className="p-4 text-[13px] text-ink-soft">{list.convos.length ? "No chats match." : "No WhatsApp conversations yet."}</div>
            ) : convos.map((c: any) => (
              <button key={c.number} onClick={() => openThread(c.number)} className={`w-full text-left px-3 py-3 md:py-2.5 border-b border-line flex flex-col gap-0.5 hover:bg-sunken ${open === c.number ? "bg-signal-tint" : ""}`} data-testid="wa-convo">
                <div className="flex items-center gap-2">
                  <span className={`text-[14px] md:text-[13px] truncate ${c.unread ? "font-bold" : "font-semibold"}`}>{c.name || c.number}</span>
                  {c.unread > 0 && <span className="rounded-full bg-signal text-on-accent text-[10.5px] font-semibold px-1.5 min-w-[18px] text-center">{c.unread}</span>}
                  <span className="ml-auto text-[11px] text-ink-soft whitespace-nowrap">{c.lastAt ? ago(c.lastAt) : ""}</span>
                </div>
                <div className="text-[12px] text-ink-soft truncate">{c.lastDirection === "out" ? (c.lastBy === "agent" ? `${agent}: ` : c.lastBy === "you" ? "You: " : "↗ ") : ""}{c.lastBody || "—"}</div>
                <div className="flex gap-1 mt-0.5"><ModePill mode={c.mode} agent={agent} /><StagePill stage={c.stage} />{c.origin === "inbound" && <span className="text-[10.5px] text-ink-soft self-center">inbound</span>}{String(c.origin || "").startsWith("call-summary:") && <span className="text-[10.5px] text-ink-soft self-center">{String(c.origin).slice("call-summary:".length)} caller</span>}</div>
              </button>
            ))}
          </div>
        </div>

        <div className={`border border-line rounded-xl bg-raised flex flex-col min-h-[70vh] md:min-h-0 ${open ? "flex" : "hidden md:flex"}`} data-testid="wa-thread">
          {!open ? <div className="m-auto text-[13px] text-ink-soft p-6">Pick a conversation.</div> : !t ? <div className="m-auto text-[13px] text-ink-soft">{err ? "" : "Loading…"}</div> : (
            <>
              <div className="px-4 py-3 border-b border-line flex items-center gap-2 flex-wrap">
                <button onClick={() => { setOpen(null); openRef.current = null; setT(null); }} className="md:hidden text-signal font-semibold text-[15px] px-1 -ml-1" aria-label="Back to chats">← Chats</button>
                <div className="min-w-0">
                  <div className="text-[14px] font-semibold truncate">{t.lead?.name || t.convo?.contact_name || t.number}</div>
                  <div className="text-[11.5px] text-ink-soft truncate">{[t.lead?.company, t.number, t.convo?.contact_email].filter(Boolean).join(" · ")}{t.convo?.booked_at ? ` · demo ${t.convo.booked_at}` : ""}</div>
                </div>
                <div className="flex gap-1"><ModePill mode={mode} agent={agent} />{t.convo && <StagePill stage={t.convo.stage} />}</div>
                <div className="ml-auto flex gap-2 flex-wrap">
                  {t.lead && <Link href={`/hq/outbound/leads/${t.lead.id}`} className={btn}>Lead</Link>}
                  {t.canAct && mode === "agent" && <button onClick={() => act({ action: "wa_mode", mode: "human" }, `You've taken over. ${agent} won't reply in this chat.`)} disabled={!!busy} className={btn} data-testid="wa-takeover">{busy === "wa_mode" ? "…" : "Take over"}</button>}
                  {t.canAct && mode !== "agent" && <button onClick={() => act({ action: "wa_mode", mode: "agent" }, `Handed back to ${agent}.`)} disabled={!!busy} className={btn} data-testid="wa-handback">{busy === "wa_mode" ? "…" : `Hand back to ${agent}`}</button>}
                  {t.canAct && mode !== "closed" && <button onClick={() => act({ action: "wa_mode", mode: "closed" }, "Chat closed.")} disabled={!!busy} className="text-[12px] text-ink-soft hover:text-miss">Close</button>}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2 min-h-0">
                {!t.messages.length && <div className="m-auto text-[13px] text-ink-soft">No messages yet.</div>}
                {t.messages.map((m: any) => {
                  const out = m.direction === "out";
                  return (
                    <div key={m.id} className={`max-w-[85%] md:max-w-[80%] flex flex-col ${out ? "self-end items-end" : "self-start items-start"}`}>
                      <div className={`rounded-2xl px-3 py-2 text-[14px] md:text-[13px] whitespace-pre-wrap break-words ${out ? (m.sent_by === "agent" ? "bg-violet-tint" : "bg-signal-tint") + " rounded-br-md" : "bg-sunken border border-line rounded-bl-md"}`}>{m.body}</div>
                      <div className="text-[10.5px] text-ink-soft mt-0.5 px-1">
                        {out ? sentByLabel(m.sent_by, agent) + " · " : ""}{when(m.created_at)}{out && m.status ? ` · ${m.status}` : ""}
                      </div>
                    </div>
                  );
                })}
                <div ref={bottom} />
              </div>
              {t.canAct && (
                <div className="border-t border-line p-3 sticky bottom-0 bg-raised">
                  {t.canReply ? (
                    <div className="flex gap-2 items-end">
                      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder={mode === "agent" ? `Replying takes the chat over from ${agent}…` : "Type a reply…"} className="flex-1 border border-line rounded-lg px-3 py-2 text-[16px] md:text-[13px] bg-paper resize-y" data-testid="wa-reply-text"
                        onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && text.trim()) act({ action: "wa_reply", text }, "Sent."); }} />
                      <button onClick={() => act({ action: "wa_reply", text }, "Sent.")} disabled={!!busy || !text.trim()} className={primary} data-testid="wa-reply-send">{busy === "wa_reply" ? "Sending…" : "Send"}</button>
                    </div>
                  ) : (
                    <div className="text-[12.5px] text-ink-soft" data-testid="wa-24h">
                      WhatsApp only allows free-text replies within 24 hours of the contact's last message{t.lastInboundAt ? ` (theirs was ${ago(t.lastInboundAt)})` : " (they haven't written yet)"}. Outside that window only approved templates can be sent — the engine does that as part of the sequence.
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </OutboundShell>
  );
}
