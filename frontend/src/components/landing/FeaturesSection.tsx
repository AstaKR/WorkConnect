const FEATURES = [
  { icon: '📝', title: 'Work Reports', desc: 'Log daily activities. Managers review and approve. Full history with filters and export.' },
  { icon: '📋', title: 'Kanban Board', desc: 'Visual task management with drag-and-drop. Track work across custom stages in real time.' },
  { icon: '📅', title: 'Team Calendar', desc: 'Events, deadlines, and meetings with monthly/weekly views and team-wide visibility.' },
  { icon: '🛡️', title: 'Custom Roles & Approvals', desc: 'Create any role structure you need. Define who can view, submit, and approve — with multi-step approval chains.' },
  { icon: '📊', title: 'Smart Dashboards', desc: 'Real-time KPIs, personal progress charts, and team performance views — tailored to each role.' },
  { icon: '🎨', title: 'Full Customization', desc: '15+ themes, 3 layout modes, custom colors. Every workspace feels personal.' },
] as const;

export default function FeaturesSection() {
  return (
    <section id="features" className="py-[90px] px-8 max-w-[1040px] mx-auto">
      <div className="text-center">
        <span className="inline-block bg-indigo-500/[0.08] text-indigo-300 border border-indigo-500/20 rounded-full px-4 py-1 text-[11px] font-bold tracking-widest uppercase mb-4">
          Everything you need
        </span>
        <h2 className="font-black tracking-[-1.5px] text-slate-100 mb-3.5 leading-[1.12]"
          style={{ fontSize: 'clamp(28px, 3.5vw, 44px)' }}>
          Built for how real work gets done
        </h2>
        <p className="text-base text-slate-500 max-w-[520px] mx-auto leading-relaxed">
          From daily logs to team oversight — WorkConnect adapts to your workflow, not the other way around.
        </p>
      </div>
      <div className="mt-14 rounded-[20px] overflow-hidden border border-white/[0.05]"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px' }}>
        {FEATURES.map(f => (
          <div key={f.title}
            className="bg-white/[0.02] p-7 hover:bg-indigo-500/[0.05] transition-colors duration-200">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-4 bg-white/[0.04] border border-white/[0.06]">
              {f.icon}
            </div>
            <h3 className="text-[15px] font-bold text-slate-200 mb-2">{f.title}</h3>
            <p className="text-[13px] text-slate-500 leading-[1.55]">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
