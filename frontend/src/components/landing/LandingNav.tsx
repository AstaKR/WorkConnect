import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GitBranch } from 'lucide-react';
import { GITHUB_URL } from '../../constants';

const NAV_LINKS = ['Features', 'Use Cases', 'AI', 'Docs'];

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-50 bg-[#070d1a]/85 backdrop-blur-xl h-16 flex items-center justify-between px-10 transition-all duration-200 ${
        scrolled ? 'border-b border-white/[0.06]' : ''
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="w-[34px] h-[34px] rounded-[9px] bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-black text-sm shadow-[0_0_18px_rgba(99,102,241,0.5)]">
          W
        </div>
        <span className="bg-gradient-to-r from-indigo-300 to-cyan-300 bg-clip-text text-transparent font-extrabold text-base tracking-tight">
          WorkConnect
        </span>
      </div>

      {/* Nav links */}
      <div className="flex items-center gap-7">
        {NAV_LINKS.map(link => (
          <a
            key={link}
            href={`#${link.toLowerCase().replace(' ', '-')}`}
            className="text-slate-400 text-sm font-medium hover:text-slate-100 transition-colors duration-150"
          >
            {link}
          </a>
        ))}
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-slate-400 text-sm font-medium hover:text-slate-100 transition-colors duration-150"
        >
          <GitBranch size={14} />
          GitHub
        </a>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2.5">
        <Link
          to="/login"
          className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-400 border border-white/[0.08] bg-white/[0.03] hover:border-indigo-500/50 hover:text-indigo-400 transition-all duration-150"
        >
          Sign In
        </Link>
        <Link
          to="/signup"
          className="px-5 py-2.5 rounded-[9px] text-sm font-bold text-white bg-gradient-to-r from-indigo-500 to-cyan-500 shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_28px_rgba(99,102,241,0.55)] transition-all duration-150"
        >
          Get Started Free
        </Link>
      </div>
    </nav>
  );
}
