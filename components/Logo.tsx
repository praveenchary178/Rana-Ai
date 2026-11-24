/**
 * RANA AI mark (R + eye + globe) on a white tile so it reads on both night and day themes.
 * Lives in its own module so public pages don't pull in the dashboard Sidebar to show the logo.
 */
export function Logo({ size = 30 }: { size?: number }) {
  const inner = Math.round(size * 0.86);
  return (
    <span className="inline-flex items-center justify-center shrink-0 rounded-[9px] bg-white ring-1 ring-black/5 overflow-hidden" style={{ width: size, height: size }} data-testid="rana-logo">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/rana-mark.svg" alt="" aria-hidden width={inner} height={inner} style={{ display: "block", width: inner, height: inner }} />
    </span>
  );
}
