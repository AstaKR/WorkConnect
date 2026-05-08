import { GITHUB_URL } from '../../constants';

const FOOTER_COLS = [
  { heading: 'Product', links: ['Features', 'AI Assistant', 'Roles & Approvals', 'Changelog'] },
  { heading: 'Resources', links: ['Documentation', 'API Reference', 'Self-Hosting', 'GitHub'] },
  { heading: 'Use Cases', links: ['For Teams', 'For Individuals', 'For Developers', 'For Startups'] },
] as const;

const BADGES = ['MIT License', 'Django 6 + React 19', 'AI-Powered'] as const;

export default function LandingFooter() {
  return (
    <footer className="bg-[#050b16] border-t border-white/[0.05] px-8 pt-14 pb-8">
      <div className="max-w-[1000px] mx-auto">
        <div className="grid gap-8 mb-10" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr' }}>
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-[32px] h-[32px] rounded-[9px] bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-black text-sm shadow-[0_0_14px_rgba(99,102,241,0.4)]">
                W
              </div>
              <span className="bg-gradient-to-r from-indigo-300 to-cyan-300 bg-clip-text text-transparent font-extrabold text-base tracking-tight">
                WorkConnect
              </span>
            </div>
            <p className="text-[13px] text-slate-700 max-w-[240px] leading-relaxed">
              The open-source AI-powered workspace for individuals, teams, and organizations.
            </p>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4 text-[12px] text-slate-600 hover:text-slate-400 transition-colors duration-150"
            >
              ⭐ Star on GitHub
            </a>
          </div>
          {FOOTER_COLS.map(col => (
            <div key={col.heading}>
              <h4 className="text-slate-600 text-[12px] font-bold uppercase tracking-[0.08em] mb-3.5">
                {col.heading}
              </h4>
              {col.links.map(link => (
                <a
                  key={link}
                  href="#"
                  className="block text-slate-700 text-[13px] mb-2.5 hover:text-slate-400 transition-colors duration-150"
                >
                  {link}
                </a>
              ))}
            </div>
          ))}
        </div>
        <div className="border-t border-white/[0.04] pt-6 flex items-center justify-between">
          <div>
            <p className="text-[12px] text-slate-800">
              © 2026 WorkConnect. Open source under MIT License.
            </p>
            <p className="text-[11px] text-slate-700 mt-1">v1.1.0</p>
          </div>
          <div className="flex gap-2">
            {BADGES.map(b => (
              <span
                key={b}
                className="bg-white/[0.03] text-slate-700 border border-white/[0.05] rounded-md px-2.5 py-1 text-[11px] font-semibold"
              >
                {b}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
