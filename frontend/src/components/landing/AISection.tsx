const PROVIDERS = [
  '🤖 Claude (Anthropic)',
  '✨ GPT-4 (OpenAI)',
  '⚡ Groq (Ultra-fast)',
  '🧠 Gemini (Google)',
] as const;

type Message = { role: 'user' | 'ai'; text: string };

const MESSAGES: Message[] = [
  { role: 'user', text: 'How has my productivity looked this month?' },
  { role: 'ai', text: "You've submitted 23 of 25 reports — 92% rate. Trending 14% above your monthly average. 🎯" },
  { role: 'user', text: 'What should I focus on next week?' },
  { role: 'ai', text: '3 overdue tasks on Kanban + Friday deadline for Q2 report. Want me to draft a weekly plan?' },
];

export default function AISection() {
  return (
    <section id="ai" className="relative py-[90px] px-8 overflow-hidden">
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px]"
        style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, transparent 60%)' }} />
      <div className="relative z-10 max-w-[1000px] mx-auto grid grid-cols-2 gap-[70px] items-center">
        <div>
          <span className="inline-block bg-indigo-500/[0.08] text-indigo-300 border border-indigo-500/20 rounded-full px-4 py-1 text-[11px] font-bold tracking-widest uppercase mb-4">
            AI-Powered
          </span>
          <h2 className="font-black tracking-[-1.5px] text-slate-100 mb-4 leading-[1.12]"
            style={{ fontSize: 'clamp(28px, 3.5vw, 44px)' }}>
            Your AI assistant.<br />Always in context.
          </h2>
          <p className="text-base text-slate-500 leading-relaxed">
            Ask about team performance, get work summaries, generate self-improvement insights, or automate repetitive analysis — without leaving your workspace.
          </p>
          <div className="flex gap-2 flex-wrap mt-7">
            {PROVIDERS.map(p => (
              <span key={p} className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2 text-xs font-semibold text-slate-500">
                {p}
              </span>
            ))}
          </div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-[18px] p-6 flex flex-col gap-3.5">
          <p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest mb-1">AI Assistant</p>
          {MESSAGES.map((m, i) => (
            <div key={i} className={`flex gap-2.5 items-start ${m.role === 'ai' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-7 h-7 rounded-[8px] flex-shrink-0 flex items-center justify-center text-[11px] font-bold ${
                m.role === 'ai'
                  ? 'bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-[0_0_10px_rgba(99,102,241,0.4)] text-white'
                  : 'bg-white/[0.06] border border-white/[0.08] text-slate-400'
              }`}>
                {m.role === 'ai' ? '✦' : 'K'}
              </div>
              <div className={`rounded-[10px] px-3.5 py-2.5 text-xs leading-relaxed max-w-[230px] ${
                m.role === 'ai'
                  ? 'bg-indigo-500/[0.12] border border-indigo-500/20 text-indigo-200'
                  : 'bg-white/[0.05] border border-white/[0.07] text-slate-400'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
