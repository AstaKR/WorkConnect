import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, FileCheck, Clock, CheckCircle2, Trash2, ChevronRight,
  TrendingUp, AlertCircle, Eye, UserCheck, RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { useAuthStore } from '../store/useAuthStore';
import { format } from 'date-fns';

const FILTER_TABS = [
  { key: 'all',       label: 'All',              color: 'text-gray-600' },
  { key: 'submitted', label: 'Submitted',         color: 'text-green-600' },
  { key: 'pending',   label: 'Pending Approval',  color: 'text-amber-600' },
  { key: 'approved',  label: 'Approved',          color: 'text-blue-600' },
];

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const colors = [
    'from-blue-400 to-indigo-500', 'from-violet-400 to-purple-500',
    'from-emerald-400 to-teal-500', 'from-rose-400 to-pink-500',
    'from-amber-400 to-orange-500', 'from-cyan-400 to-blue-500',
  ];
  const color = colors[name.charCodeAt(0) % colors.length];
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {initials}
    </div>
  );
}

export default function ManagerDashboard() {
  const { user } = useAuthStore();
  const isCEO = user?.role === 'ceo';
  const navigate = useNavigate();

  const [summary, setSummary] = useState<any>(null);
  const [teamReports, setTeamReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [approvingId, setApprovingId] = useState<number | null>(null);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [s, t] = await Promise.all([
        axios.get('/dashboard/summary/'),
        axios.get('/dashboard/team/'),
      ]);
      setSummary(s.data.data);
      setTeamReports(t.data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = teamReports.filter(r => {
    if (filter === 'submitted') return r.is_submitted;
    if (filter === 'pending') return r.is_submitted && !r.approval;
    if (filter === 'approved') return r.approval;
    return true;
  });

  const approve = async (id: number) => {
    setApprovingId(id);
    try {
      await axios.post(`/reports/${id}/approve/`, { comment: 'Approved' });
      await fetchData(true);
    } catch { alert('Failed to approve'); }
    finally { setApprovingId(null); }
  };

  const deleteReport = async (id: number) => {
    if (!confirm('Delete this report and all its tasks?')) return;
    setDeletingId(id);
    try {
      await axios.delete(`/reports/${id}/`);
      setTeamReports(p => p.filter(r => r.id !== id));
    } catch { alert('Failed to delete.'); }
    finally { setDeletingId(null); }
  };

  const pendingCount = teamReports.filter(r => r.is_submitted && !r.approval).length;
  const submittedCount = teamReports.filter(r => r.is_submitted).length;
  const approvedCount = teamReports.filter(r => r.approval).length;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="min-h-screen bg-gray-50/40">

      {/* ── Hero banner ───────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-800 via-blue-900 to-indigo-900 px-8 pt-8 pb-24">
        {/* Decorative blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />
          <div className="absolute top-10 left-1/2 w-48 h-48 bg-violet-500/10 rounded-full blur-2xl" />
        </div>
        <div className="relative max-w-7xl mx-auto flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-blue-300 text-sm font-semibold mb-1">{greeting()}, {user?.full_name?.split(' ')[0]} 👋</p>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Manager Dashboard</h1>
            <p className="text-blue-200/70 mt-1 text-sm">{format(new Date(), 'EEEE, MMMM d, yyyy')} · Team overview</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-sm font-medium transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 -mt-14 pb-10 space-y-6">

        {/* ── KPI cards (overlapping the banner) ────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
            {[1,2,3,4].map(i => <div key={i} className="h-32 bg-white rounded-2xl shadow-md" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                icon: <Users className="w-6 h-6" />,
                label: 'Team Size',
                value: summary?.team_size ?? 0,
                sub: 'active members',
                gradient: 'from-blue-500 to-indigo-600',
                bg: 'bg-blue-50',
                text: 'text-blue-600',
              },
              {
                icon: <FileCheck className="w-6 h-6" />,
                label: 'Submitted Today',
                value: submittedCount,
                sub: `of ${summary?.team_size ?? 0} expected`,
                gradient: 'from-emerald-500 to-teal-600',
                bg: 'bg-emerald-50',
                text: 'text-emerald-600',
              },
              {
                icon: <Clock className="w-6 h-6" />,
                label: 'Pending Approval',
                value: pendingCount,
                sub: pendingCount > 0 ? 'needs your action' : 'all clear!',
                gradient: 'from-amber-500 to-orange-500',
                bg: 'bg-amber-50',
                text: 'text-amber-600',
              },
              {
                icon: <CheckCircle2 className="w-6 h-6" />,
                label: 'Approved',
                value: approvedCount,
                sub: 'reports approved',
                gradient: 'from-violet-500 to-purple-600',
                bg: 'bg-violet-50',
                text: 'text-violet-600',
              },
            ].map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 relative overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -translate-y-1/2 translate-x-1/2 bg-gradient-to-br ${card.gradient} opacity-10`} />
                <div className={`w-11 h-11 rounded-xl ${card.bg} ${card.text} flex items-center justify-center mb-4`}>
                  {card.icon}
                </div>
                <p className="text-3xl font-extrabold text-gray-900">{card.value}</p>
                <p className="text-sm font-semibold text-gray-600 mt-0.5">{card.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* ── Submission rate bar ────────────────────────────────────── */}
        {!loading && summary && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <p className="text-sm font-bold text-gray-800">Today's Submission Rate</p>
              </div>
              <span className="text-sm font-bold text-primary">
                {summary.team_size > 0 ? Math.round((submittedCount / summary.team_size) * 100) : 0}%
              </span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${summary.team_size > 0 ? (submittedCount / summary.team_size) * 100 : 0}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>{submittedCount} submitted</span>
              <span>{(summary.team_size ?? 0) - submittedCount} not yet submitted</span>
            </div>
          </motion.div>
        )}

        {/* ── Team Reports ───────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-primary" />
              <h2 className="text-base font-bold text-gray-900">Team Reports</h2>
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full font-bold">{filtered.length}</span>
            </div>
            {/* Filter tabs */}
            <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-1 border border-gray-100">
              {FILTER_TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filter === tab.key
                      ? 'bg-white shadow-sm text-gray-900 border border-gray-200'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Report cards */}
          <div className="divide-y divide-gray-50">
            {loading ? (
              <div className="p-6 space-y-3 animate-pulse">
                {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center">
                <AlertCircle className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 font-medium">No reports match this filter</p>
              </div>
            ) : (
              <AnimatePresence>
                {filtered.map((report, i) => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50/60 transition-colors group"
                  >
                    <Avatar name={report.user_name} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 text-sm">{report.user_name}</p>
                        {report.approval && (
                          <span className="flex items-center gap-0.5 text-[10px] bg-green-50 text-green-700 border border-green-200 rounded-full px-1.5 py-0.5 font-bold">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Approved
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(report.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        {report.place_of_work && <span className="mx-1">·</span>}
                        {report.place_of_work && <span>{report.place_of_work}</span>}
                      </p>
                    </div>

                    {/* Status badge */}
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                      report.is_submitted
                        ? 'bg-green-50 text-green-700 border border-green-100'
                        : 'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>
                      {report.is_submitted ? 'Submitted' : 'Draft'}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => navigate(`/manager/employee/${report.user}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                      {report.is_submitted && !report.approval && (
                        <button
                          onClick={() => approve(report.id)}
                          disabled={approvingId === report.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {approvingId === report.id ? '…' : <><CheckCircle2 className="w-3.5 h-3.5" /> Approve</>}
                        </button>
                      )}
                      {isCEO && (
                        <button
                          onClick={() => deleteReport(report.id)}
                          disabled={deletingId === report.id}
                          className="p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors disabled:opacity-40"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 group-hover:text-gray-400 transition-colors" />
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
