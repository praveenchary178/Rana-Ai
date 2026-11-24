"use client";


export default function DashboardPreview() {
  const bars = [22, 30, 26, 44, 38, 52, 47, 63, 58, 71, 66, 80];
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-center gap-1.5 mb-4"><span className="w-2.5 h-2.5 rounded-full bg-miss/70" /><span className="w-2.5 h-2.5 rounded-full bg-hot/70" /><span className="w-2.5 h-2.5 rounded-full bg-signal/70" /><span className="ml-3 text-[11px] font-mono text-ink-soft">app · Dashboard · Today</span></div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3">
        {[["Total calls", "842", "+12%"], ["Connected", "391", "46%"], ["Hot leads", "57", "+9"], ["Talk time", "19h 40m", "avg 3m"]].map(([k, v, s]) => (
          <div key={k} className="rounded-xl border border-white/[.07] bg-white/[.02] p-3">
            <div className="text-[10.5px] text-ink-soft">{k}</div>
            <div className="font-display text-[20px] font-semibold">{v}</div>
            <div className="text-[10.5px] text-signal">▲ {s}</div>
          </div>
        ))}
      </div>
      <div className="grid sm:grid-cols-[1.4fr_1fr] gap-2.5">
        <div className="rounded-xl border border-white/[.07] bg-white/[.02] p-3">
          <div className="text-[11px] text-ink-soft mb-2 flex justify-between"><span>Calls by hour</span><span><span className="text-signal">■</span> in <span className="text-violet ml-1">■</span> out</span></div>
          <div className="flex items-end gap-1.5 h-[110px]">
            {bars.map((b, i) => (
              <div key={i} className="flex-1 flex flex-col justify-end gap-[2px] h-full">
                <div className="rounded-t bg-violet/80" style={{ height: `${b * 0.55}%` }} />
                <div className="bg-signal/90" style={{ height: `${b * 0.45}%` }} />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-white/[.07] bg-white/[.02] p-3 text-[12px]">
          <div className="text-[11px] text-ink-soft mb-2">Hot leads — call these now</div>
          {[["Sneha R.", "Ready to close", "text-signal bg-signal/10"], ["Karthik", "Hot", "text-hot bg-hot/10"], ["Irfan M.", "Hot", "text-hot bg-hot/10"], ["Divya N.", "Warm", "text-warm bg-warm/10"]].map(([n, s, c]) => (
            <div key={n} className="flex justify-between items-center py-1.5 border-b border-white/[.06] last:border-0"><span className="font-medium">{n}</span><span className={`text-[10.5px] font-semibold rounded-full px-2 py-0.5 ${c}`}>{s}</span></div>
          ))}
        </div>
      </div>
    </div>
  );
}
