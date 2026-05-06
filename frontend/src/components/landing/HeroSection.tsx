import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GITHUB_URL } from '../../constants';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay },
});

export default function HeroSection() {
  return (
    <section
      className="relative min-h-[95vh] flex flex-col items-center justify-center text-center px-6 py-24 overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(99,102,241,0.12) 0%, transparent 70%), #070d1a',
      }}
    >
      <div className="pointer-events-none absolute -top-48 -left-36 w-[600px] h-[600px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 60%)' }} />
      <div className="pointer-events-none absolute -bottom-36 -right-24 w-[500px] h-[500px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.10) 0%, transparent 60%)' }} />
      <div className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)',
        }} />

      <motion.div {...fadeUp(0)}
        className="relative z-10 inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/25 rounded-full px-4 py-1.5 text-xs font-bold text-indigo-300 mb-8 tracking-wide">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1] animate-pulse" />
        Open Source · AI-Powered · Free Forever
      </motion.div>

      <motion.h1 {...fadeUp(0.1)}
        className="relative z-10 font-black leading-[1.06] tracking-[-2.5px] text-slate-100 max-w-[820px] mb-4"
        style={{ fontSize: 'clamp(38px, 5.5vw, 72px)' }}>
        The{' '}
        <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
          AI-powered workspace
        </span>
        <br />for every kind of work
      </motion.h1>

      <motion.p {...fadeUp(0.2)}
        className="relative z-10 text-lg text-slate-500 max-w-xl mx-auto mb-10 leading-relaxed">
        Track work, manage tasks, run teams, and grow — all in one open-source platform built around how you actually work.
      </motion.p>

      <motion.div {...fadeUp(0.3)}
        className="relative z-10 flex items-center gap-3.5 justify-center flex-wrap mb-16">
        <Link to="/signup"
          className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-[15px] font-bold text-white bg-gradient-to-r from-indigo-500 to-cyan-500 shadow-[0_0_30px_rgba(99,102,241,0.45)] hover:-translate-y-0.5 transition-all duration-200">
          🚀 Get Started Free
        </Link>
        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-[15px] font-semibold text-slate-400 bg-white/[0.04] border border-white/10 backdrop-blur-md hover:border-indigo-500/40 hover:text-indigo-400 transition-all duration-200">
          <ExternalLink size={15} />
          View on GitHub
        </a>
      </motion.div>

      <motion.div {...fadeUp(0.4)} className="relative z-10 w-full max-w-[960px] mx-auto">
        <AppPreviewFrame />
        <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 w-3/4 h-20 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.25) 0%, transparent 70%)', filter: 'blur(20px)' }} />
      </motion.div>
    </section>
  );
}

function AppPreviewFrame() {
  const kpis = [
    { color: 'rgba(99,102,241,0.15)', value: '24', label: 'Team Members' },
    { color: 'rgba(6,182,212,0.15)', value: '156', label: 'Reports This Month' },
    { color: 'rgba(34,197,94,0.15)', value: '94%', label: 'Submission Rate' },
    { color: 'rgba(245,158,11,0.15)', value: '12', label: 'Pending Approval' },
  ];
  const barHeights = [40, 60, 82, 55, 95, 70, 100];

  return (
    <div className="bg-[#0d1525] rounded-[18px] overflow-hidden border border-indigo-500/15"
      style={{ boxShadow: '0 40px 100px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.1), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
      <div className="bg-[#111827] px-4 py-3 flex items-center gap-2 border-b border-white/[0.04]">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
        </div>
        <div className="flex-1 bg-white/[0.04] rounded-md py-1 px-3 text-[11px] text-slate-600 text-center border border-white/[0.04]">
          app.workconnect.io/dashboard
        </div>
      </div>
      <div className="grid h-[320px]" style={{ gridTemplateColumns: '200px 1fr' }}>
        <div className="bg-[#0d1525] border-r border-white/[0.05] p-3 flex flex-col gap-0.5 overflow-hidden">
          <div className="flex items-center gap-2 px-2.5 py-2 mb-2">
            <div className="w-6 h-6 rounded-[7px] bg-gradient-to-br from-indigo-500 to-cyan-500 flex-shrink-0" />
            <span className="text-slate-200 font-bold text-xs">WorkConnect</span>
          </div>
          <p className="text-[9px] font-bold text-slate-700 uppercase tracking-widest px-2.5 pb-1">Dashboard</p>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[7px] bg-indigo-500/[0.12] border border-indigo-500/15 text-indigo-300 text-[11px] font-medium">📊 CEO Dashboard</div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-600 text-[11px]">👤 My Dashboard</div>
          <p className="text-[9px] font-bold text-slate-700 uppercase tracking-widest px-2.5 pt-2 pb-1">Workspace</p>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-600 text-[11px]">📝 Work Reports</div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-600 text-[11px]">📋 Kanban Board</div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-600 text-[11px]">📅 Calendar</div>
          <p className="text-[9px] font-bold text-slate-700 uppercase tracking-widest px-2.5 pt-2 pb-1">Management</p>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-600 text-[11px]">👥 Team</div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-600 text-[11px]">🛡️ Roles & Approvals</div>
        </div>
        <div className="bg-[#0f172a] p-4 overflow-hidden">
          <p className="text-[13px] font-extrabold text-slate-200 mb-0.5">CEO Dashboard</p>
          <p className="text-[9px] text-slate-700 mb-3.5">Sunday, May 3, 2026 · Company overview</p>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {kpis.map(k => (
              <div key={k.label} className="bg-white/[0.03] rounded-[10px] p-2.5 border border-white/[0.05]">
                <div className="w-5 h-5 rounded-[5px] mb-1.5" style={{ background: k.color }} />
                <p className="text-[15px] font-black text-slate-200 leading-none">{k.value}</p>
                <p className="text-[9px] text-slate-700 mt-0.5">{k.label}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/[0.03] rounded-[10px] p-2.5 border border-white/[0.05]">
              <p className="text-[9px] font-bold text-slate-600 mb-2">Weekly Submissions</p>
              <div className="flex items-end gap-0.5 h-[54px]">
                {barHeights.map((h, i) => (
                  <div key={i} className="flex-1 rounded-sm"
                    style={{ height: `${h}%`, background: h >= 80 ? 'linear-gradient(180deg,#818cf8,#6366f1)' : 'rgba(99,102,241,0.35)', boxShadow: h >= 80 ? '0 0 8px rgba(99,102,241,0.5)' : 'none' }} />
                ))}
              </div>
            </div>
            <div className="bg-white/[0.03] rounded-[10px] p-2.5 border border-white/[0.05]">
              <p className="text-[9px] font-bold text-slate-600 mb-1.5">AI Insights</p>
              <p className="text-[9px] text-slate-600 leading-relaxed mb-1.5">"Productivity up 18% this week. 3 members have pending approvals."</p>
              <span className="inline-flex items-center gap-1 bg-indigo-500/10 border border-indigo-500/20 rounded px-1.5 py-0.5 text-[9px] font-bold text-indigo-300">✨ AI Generated</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
