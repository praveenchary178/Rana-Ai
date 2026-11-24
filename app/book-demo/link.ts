// Every "Book a demo" button on the site leads to the /book-demo page.
// `from` tags where the visitor clicked (saved with the request as its source); details the visitor already gave
// elsewhere (Talk to Rana, an industry page) are handed over through sessionStorage so the form starts filled in.

export type DemoPrefill = { name?: string; phone?: string; email?: string; company?: string; message?: string; languages?: string[]; talkId?: string };

const KEY = "rana_demo_prefill";

export const bookDemoHref = (from?: string) => (from ? `/book-demo?from=${encodeURIComponent(from)}` : "/book-demo");

/** Open /book-demo from a click handler, optionally starting the form with what we already know. */
export function goToBookDemo(from: string, prefill?: DemoPrefill | null) {
  try {
    if (prefill) sessionStorage.setItem(KEY, JSON.stringify(prefill));
    else sessionStorage.removeItem(KEY);
  } catch { /* storage blocked: the form simply starts empty */ }
  window.location.assign(bookDemoHref(from));
}

/** Read (once) the details handed over by goToBookDemo. */
export function takeDemoPrefill(): DemoPrefill | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return raw ? (JSON.parse(raw) as DemoPrefill) : null;
  } catch {
    return null;
  }
}
