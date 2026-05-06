import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  PlusCircle, History, Columns, Zap, TrendingUp,
  CalendarDays, Flame, ArrowRight, FileText,
} from 'lucide-react';
import axios from '../api/axios';
import { format, subDays } from 'date-fns';

const LOCAL_TODAY = format(new Date(), 'yyyy-MM-dd');
const LAST_7 = format(subDays(new Date(), 6), 'yyyy-MM-dd');

function StatCard({
  label, value, icon, color,
}: {
  label: string; value: string | number; icon: React.ReactNode; color: string;
}) {
  return (
    <div className="glass rounded-2xl p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-extrabold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 font-medium mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function IndividualDashboard() {
  const { user } = useAuthStore();
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [reportCount, setReportCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [aiSummary, setAiSummary] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const firstName = user?.full_name?.split(' ')[0] ?? 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    const load = async () => {
      try {
        const [historyRes, monthRes] = await Promise.all([
          axios.get(`/reports/?date_from=${LAST_7}&date_to=${LOCAL_TODAY}`),
          axios.get(`/reports/?date_from=${format(subDays(new Date(), 29), 'yyyy-MM-dd')}&date_to=${LOCAL_TODAY}`),
        ]);

        const recent = Array.isArray(historyRes.data)
          ? historyRes.data
          : historyRes.data.results ?? [];
        setRecentReports(recent.slice(0, 5));

        const month = Array.isArray(monthRes.data)
          ? monthRes.data
          : monthRes.data.results ?? [];
        setReportCount(month.length);

        // Calculate streak — consecutive days with a report ending today
        const dates = recent.map((r: any) => r.date ?? r.created_at?.slice(0, 10)).filter(Boolean);
        let s = 0;
        for (let i = 0; i < 7; i++) {
          const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
          if (dates.includes(d)) s++;
          else break;
        }
        setStreak(s);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const fetchAI = async () => {
      setAiLoading(true);
      try {
        const res = await axios.post('/ai/query/', {
          query: `Give me a concise personal productivity summary for ${user?.full_name} based on their recent work reports. Focus on patterns, achievements, and one actionable suggestion. Keep it under 3 sentences.`,
        });
        setAiSummary(res.data?.response ?? res.data?.answer ?? '');
      } catch {
        setAiSummary('');
      } finally {
        setAiLoading(false);
      }
    };
    fetchAI();
  }, [user?.full_name]);

  const fadeUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">

      {/* Welcome header */}
      <motion.div {...fadeUp} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-extrabold text-gray-900">
          {greeting}, {firstName} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </motion.div>

      {/* Stats row */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        {...fadeUp}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <StatCard
          label="Reports this month"
          value={loading ? '—' : reportCount}
          icon={<FileText className="w-5 h-5 text-primary" />}
          color="bg-primary/10"
        />
        <StatCard
          label="Day streak 🔥"
          value={loading ? '—' : streak}
          icon={<Flame className="w-5 h-5 text-amber-500" />}
          color="bg-amber-50"
        />
        <StatCard
          label="Reports (last 7 days)"
          value={loading ? '—' : recentReports.length}
          icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
          color="bg-emerald-50"
        />
      </motion.div>

      {/* AI Insight */}
      <motion.div
        className="glass rounded-2xl p-6"
        {...fadeUp}
        transition={{ duration: 0.4, delay: 0.2 }}
        data-testid="ai-insight-card"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">AI Insight</p>
            <p className="text-xs text-gray-400">Your personal productivity summary</p>
          </div>
        </div>
        {aiLoading ? (
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            Generating your summary...
          </div>
        ) : aiSummary ? (
          <p className="text-gray-700 text-sm leading-relaxed">{aiSummary}</p>
        ) : (
          <p className="text-gray-400 text-sm">Log some work reports to get AI-powered insights about your productivity patterns.</p>
        )}
      </motion.div>

      {/* Recent activity */}
      <motion.div
        className="glass rounded-2xl p-6"
        {...fadeUp}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">Recent Activity</h2>
          <Link to="/employee/history" className="text-xs font-semibold text-primary hover:text-accent flex items-center gap-1 transition-colors">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : recentReports.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No recent reports. Start logging your work!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentReports.map((report, idx) => (
              <div key={report.id ?? idx} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <CalendarDays className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {report.date ?? report.created_at?.slice(0, 10) ?? 'Report'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {report.tasks?.length ?? 0} tasks · {report.status ?? 'submitted'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Quick actions */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-3 gap-3"
        {...fadeUp}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <Link to="/employee/report/new"
          className="glass rounded-2xl p-5 flex items-center gap-3 hover:shadow-md transition-all group">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
            <PlusCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Log today's work</p>
            <p className="text-xs text-gray-400">Submit a report</p>
          </div>
        </Link>

        <Link to="/kanban"
          className="glass rounded-2xl p-5 flex items-center gap-3 hover:shadow-md transition-all group">
          <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-100 transition-colors">
            <Columns className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Open Kanban</p>
            <p className="text-xs text-gray-400">View your tasks</p>
          </div>
        </Link>

        <Link to="/employee/history"
          className="glass rounded-2xl p-5 flex items-center gap-3 hover:shadow-md transition-all group">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-100 transition-colors">
            <History className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Report history</p>
            <p className="text-xs text-gray-400">Browse past logs</p>
          </div>
        </Link>
      </motion.div>

    </div>
  );
}
