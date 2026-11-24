// Run work after the response has been sent, so a public form answers instantly.
// On Vercel this hands the promise to the platform's request context (what @vercel/functions' waitUntil does), which
// keeps the function alive until it settles (up to the route's maxDuration). Anywhere else it simply waits for it.
export async function runAfterResponse(work: () => Promise<unknown>): Promise<void> {
  const p = work().catch((e) => console.error("[background]", e?.message || e));
  const ctx = (globalThis as any)[Symbol.for("@vercel/request-context")]?.get?.();
  if (typeof ctx?.waitUntil === "function") { ctx.waitUntil(p); return; }
  await p;
}
