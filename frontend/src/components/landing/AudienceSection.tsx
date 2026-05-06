interface AudienceCard {
  id: string;
  emoji: string;
  title: string;
  tagline: string;
  topGradient: string;
  taglineClass: string;
  checkClass: string;
  desc: string;
  points: readonly string[];
  scenarioLabelClass: string;
  scenario: string;
}

const TOP_CARDS: AudienceCard[] = [
  {
    id: 'business',
    emoji: '🏢',
    title: 'Business Owners & Managers',
    tagline: 'Oversight & accountability',
    topGradient: 'from-indigo-500 to-indigo-400',
    taglineClass: 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20',
    checkClass: 'bg-indigo-500/15 text-indigo-300',
    desc: "Run your organization from a single dashboard. Track every team member's work, define custom approval chains, and let AI surface what needs your attention.",
    points: [
      'Custom roles: define who approves what',
      'Real-time team performance overview',
      'Multi-step report approval flows',
      'AI digest of team activity',
    ],
    scenarioLabelClass: 'text-indigo-300',
    scenario: '"Ahmed runs a 40-person consulting firm. He sets up department leads as approvers, gets a daily AI summary, and never chases status updates again."',
  },
  {
    id: 'solo',
    emoji: '🙋',
    title: 'Individuals & Self-improvers',
    tagline: 'Personal growth & workload clarity',
    topGradient: 'from-amber-500 to-orange-400',
    taglineClass: 'bg-amber-500/10 text-amber-300 border border-amber-500/20',
    checkClass: 'bg-amber-500/15 text-amber-300',
    desc: 'Use WorkConnect solo to track your own work, manage personal tasks, and let the AI coach you on your productivity patterns and growth over time.',
    points: [
      'Daily work logs → spot your patterns',
      'Personal kanban for task clarity',
      'AI insights on your own performance',
      'Weekly self-review & goal tracking',
    ],
    scenarioLabelClass: 'text-amber-300',
    scenario: '"Riya is a freelance designer. She logs her daily output, reviews her AI-generated weekly summary, and ships more because she can see what slows her down."',
  },
  {
    id: 'dev',
    emoji: '💻',
    title: 'Developers & IT Teams',
    tagline: 'Self-host & extend',
    topGradient: 'from-cyan-500 to-teal-400',
    taglineClass: 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20',
    checkClass: 'bg-cyan-500/15 text-cyan-300',
    desc: 'Clone, deploy, and own it. Full Django + React source, a REST API, pluggable AI providers, and the freedom to adapt every part of the platform to your infrastructure.',
    points: [
      'Fully open source (MIT)',
      'REST API with JWT auth',
      'Pluggable AI: OpenAI, Claude, Groq, Gemini',
      'Docker-ready, deploy anywhere',
    ],
    scenarioLabelClass: 'text-cyan-300',
    scenario: '"Tomas self-hosts WorkConnect for his agency, swaps in Claude for AI summaries, and adds a custom Slack webhook — all from the codebase he fully controls."',
  },
];

const BOTTOM_CARDS: AudienceCard[] = [
  {
    id: 'remote',
    emoji: '🌍',
    title: 'Remote & Distributed Teams',
    tagline: 'Async clarity across time zones',
    topGradient: 'from-green-500 to-emerald-400',
    taglineClass: 'bg-green-500/10 text-green-300 border border-green-500/20',
    checkClass: 'bg-green-500/15 text-green-300',
    desc: 'Keep everyone aligned without endless meetings. Work reports replace standups, the kanban shows team progress at a glance, and AI summaries keep remote members in sync.',
    points: [
      'Daily reports replace standups',
      'Shared kanban visible to whole team',
      'Async approval flows — no waiting',
      'AI-generated team digest for managers',
    ],
    scenarioLabelClass: 'text-green-300',
    scenario: '"Sara manages a 12-person remote team across 4 time zones. Everyone logs daily, she reviews an AI digest each morning, and the team runs without a single sync call."',
  },
  {
    id: 'startup',
    emoji: '🚀',
    title: 'Startups & Small Teams',
    tagline: 'Ship fast, stay organized',
    topGradient: 'from-purple-500 to-violet-400',
    taglineClass: 'bg-purple-500/10 text-purple-300 border border-purple-500/20',
    checkClass: 'bg-purple-500/15 text-purple-300',
    desc: "No need for multiple tools. Work reports, tasks, calendar and AI — all in one place. Start free, grow without limits, self-host when you're ready.",
    points: [
      'Replace 3+ tools with one platform',
      'Zero setup cost — free & open source',
      'Scales as your team grows',
      'Custom roles from day one',
    ],
    scenarioLabelClass: 'text-purple-300',
    scenario: "\"Lena's 6-person startup replaced Jira + Notion + spreadsheets with WorkConnect. One tool, one source of truth, half the overhead.\"",
  },
];

function Card({ card }: { card: AudienceCard }) {
  return (
    <div className="relative bg-white/[0.03] border border-white/[0.06] rounded-[20px] p-8 hover:bg-indigo-500/[0.05] hover:border-indigo-500/20 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${card.topGradient}`} />
      <span className="text-[28px] mb-3.5 block">{card.emoji}</span>
      <h3 className="text-[17px] font-extrabold text-slate-200 mb-2">{card.title}</h3>
      <span className={`inline-block text-[12px] font-semibold rounded-full px-3 py-1 mb-3 ${card.taglineClass}`}>
        {card.tagline}
      </span>
      <p className="text-[13px] text-slate-500 mb-5 leading-[1.65]">{card.desc}</p>
      <ul className="flex flex-col gap-2.5 mb-5">
        {card.points.map(point => (
          <li key={point} className="flex items-start gap-2.5 text-[13px] text-slate-500 font-medium leading-snug">
            <span className={`w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5 ${card.checkClass}`}>✓</span>
            {point}
          </li>
        ))}
      </ul>
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3.5">
        <p className={`text-[9px] font-bold uppercase tracking-[0.1em] mb-1.5 ${card.scenarioLabelClass}`}>Use case</p>
        <p className="text-[12px] text-slate-600 leading-relaxed italic">{card.scenario}</p>
      </div>
    </div>
  );
}

export default function AudienceSection() {
  return (
    <section id="use-cases" className="py-[90px] px-8 bg-white/[0.01] border-t border-white/[0.04]">
      <div className="max-w-[1040px] mx-auto">
        <div className="text-center mb-[52px]">
          <span className="inline-block bg-indigo-500/[0.08] text-indigo-300 border border-indigo-500/20 rounded-full px-4 py-1 text-[11px] font-bold tracking-widest uppercase mb-4">
            Who it's for
          </span>
          <h2 className="font-black tracking-[-1.5px] text-slate-100 mb-4 leading-[1.12]"
            style={{ fontSize: 'clamp(28px, 3.5vw, 44px)' }}>
            Built for anyone who works
          </h2>
          <p className="text-base text-slate-500 max-w-[520px] mx-auto leading-relaxed">
            Whether you're running a team, building solo, or just trying to stay on top of your own work — WorkConnect works for you.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-[18px] mb-[18px]">
          {TOP_CARDS.map(card => <Card key={card.id} card={card} />)}
        </div>
        <div className="grid grid-cols-2 gap-[18px]">
          {BOTTOM_CARDS.map(card => <Card key={card.id} card={card} />)}
        </div>
      </div>
    </section>
  );
}
