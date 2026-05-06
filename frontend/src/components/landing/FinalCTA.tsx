import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { GITHUB_URL } from '../../constants';

export default function FinalCTA() {
  return (
    <section className="relative py-[110px] px-8 text-center overflow-hidden">
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px]"
        style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 60%)' }}
      />
      <div className="relative z-10">
        <h2
          className="font-black tracking-[-2px] text-slate-100 mb-4 leading-[1.1]"
          style={{ fontSize: 'clamp(30px, 4vw, 54px)' }}
        >
          Ready to take control of{' '}
          <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            your work?
          </span>
        </h2>
        <p className="text-[17px] text-slate-500 max-w-[480px] mx-auto mb-10 leading-relaxed">
          Free forever. Open source. No credit card. Start solo or invite your whole team.
        </p>
        <div className="flex gap-3.5 justify-center flex-wrap">
          <Link
            to="/signup"
            className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-[15px] font-bold text-white bg-gradient-to-r from-indigo-500 to-cyan-500 shadow-[0_0_30px_rgba(99,102,241,0.45)] hover:-translate-y-0.5 transition-all duration-200"
          >
            🚀 Get Started Free
          </Link>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-[15px] font-semibold text-slate-400 bg-white/[0.04] border border-white/10 backdrop-blur-md hover:border-indigo-500/40 hover:text-indigo-400 transition-all duration-200"
          >
            <ExternalLink size={15} />
            View Source on GitHub
          </a>
        </div>
      </div>
    </section>
  );
}
