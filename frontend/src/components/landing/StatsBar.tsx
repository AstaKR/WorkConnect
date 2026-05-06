const STATS = [
  { value: '100%', label: 'Open Source & Free', sub: null },
  { value: '4', label: 'AI Providers', sub: 'Claude · GPT-4 · Groq · Gemini' },
  { value: 'Custom', label: 'Roles & Approval Flows', sub: 'You define who approves what' },
  { value: '15+', label: 'Themes & Layouts', sub: 'Make it yours' },
] as const;

export default function StatsBar() {
  return (
    <div className="border-t border-white/[0.05] border-b border-white/[0.05] bg-white/[0.02] py-12 px-8">
      <div className="max-w-[980px] mx-auto grid grid-cols-4 gap-4 text-center">
        {STATS.map((s, i) => (
          <div key={s.label} className={i < 3 ? 'border-r border-white/[0.06] pr-4' : ''}>
            <p className="text-4xl font-black bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent tracking-tight leading-none">
              {s.value}
            </p>
            <p className="text-slate-500 text-sm mt-1.5">{s.label}</p>
            {s.sub && <p className="text-slate-700 text-[11px] mt-1">{s.sub}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
