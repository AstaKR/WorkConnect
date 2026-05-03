import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, FileCheck, Clock, CheckCircle2, Trash2,
  TrendingUp, Eye, UserCheck, RefreshCw,
  ChevronRight, FileText,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { useAuthStore } from '../store/useAuthStore';
import { format } from 'date-fns';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  'from-blue-400 to-indigo-500', 'from-violet-400 to-purple-500',
  'from-emerald-400 to-teal-500', 'from-rose-400 to-pink-500',
  'from-amber-400 to-orange-500', 'from-cyan-400 to-blue-500',
  'from-fuchsia-400 to-pink-500', 'from-lime-400 to-emerald-500',
];

function getAvatarColor(name: string) {
  return AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];
}

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? '?';
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-14 h-14 text-base' : 'w-10 h-10 text-sm';
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br ${getAvatarColor(name)} flex items-center justify-center text-white font-bold flex-shrink-0 shadow-sm`}>
      {initials}
    </div>
  );
}

const STATUS_FILTERS = [
  { key: 'all',       label: 'All',             dot: 'bg-gray-400' },
  { key: 'submitted', label: 'Submitted',        dot: 'bg-green-500' },
  { key: 'pending',   label: 'Pending Approval', dot: 'bg-amber-500' },
  { key: 'approved',  label: 'Approved',         dot: 'bg-blue-500' },
  { key: 'draft',     label: 'Draft',            dot: 'bg-gray-400' },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ManagerDashboard() {
  const { user } = useAuthStore();
  const isCEO = user?.role === 'ceo';
  const navigate = useNavigate();

  const [summary, setSummary] = useState<any>(null);
  const [teamReports, setTeamReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedPerson, setSelectedPerson] = useState<string>('__all__');
  const [statusFilter, setStatusFilter] = useState('all');
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

  // ── Derived data ────────────────────────────────────────────────────────────
  const persons = useMemo(() => {
    const map: Record<string, { name: string; reports: any[] }> = {};
    teamReports.forEach(r => {
      if (!map[r.user]) map[r.user] = { name: r.user_name, reports: [] };
      map[r.user].reports.push(r);
    });
    return Object.entries(map).map(([id, data]) => ({
      id, ...data,
      submitted: data.reports.filter(r => r.is_submitted).length,
      pending:   data.reports.filter(r => r.is_submitted && !r.approval).length,
      approved:  data.reports.filter(r => r.approval).length,
      draft:     data.reports.filter(r => !r.is_submitted).length,
    }));
  }, [teamReports]);

  const activeReports = useMemo(() => {
    const base = selectedPerson === '__all__'
      ? teamReports
      : (persons.find(p => p.id === selectedPerson)?.reports ?? []);
    if (statusFilter === 'submitted') return base.filter(r => r.is_submitted);
    if (statusFilter === 'pending')   return base.filter(r => r.is_submitted && !r.approval);
    if (statusFilter === 'approved')  return base.filter(r => r.approval);
    if (statusFilter === 'draft')     return base.filter(r => !r.is_submitted);
    return base;
  }, [selectedPerson, statusFilter, teamReports, persons]);

  const activePerson = useMemo(() =>
    selectedPerson === '__all__' ? null : persons.find(p => p.id === selectedPerson),
    [selectedPerson, persons]
  );

  const pendingCount   = teamReports.filter(r => r.is_submitted && !r.approval).length;
  const submittedCount = teamReports.filter(r => r.is_submitted).length;
  const approvedCount  = teamReports.filter(r => r.approval).length;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

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

  return (
    <div className="min-h-screen bg-gray-50/40">

      {/* ── Hero banner ──────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-800 via-blue-900 to-indigo-900 px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-20 sm:pb-24">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />
          <div className="absolute top-10 left-1/2 w-48 h-48 bg-violet-500/10 rounded-full blur-2xl" />
        </div>
        <div className="relative max-w-7xl mx-auto flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-blue-300 text-sm font-semibold mb-1">{greeting}, {user?.full_name?.split(' ')[0]} 👋</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Manager Dashboard</h1>
            <p className="text-blue-200/70 mt-1 text-sm">{format(new Date(), 'EEEE, MMMM d, yyyy')} · Team overview</p>
          </div>
          <button onClick={() => fetchData(true)} disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-sm font-medium transition-colors">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 sm:-mt-14 pb-10 space-y-4 sm:space-y-6">

        {/* ── KPI cards ────────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
            {[1,2,3,4].map(i => <div key={i} className="h-32 bg-white rounded-2xl shadow-md" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: <Users className="w-6 h-6" />,       label: 'Team Size',        value: summary?.team_size ?? 0, sub: 'active members',                                gradient: 'from-blue-500 to-indigo-600',   bg: 'bg-blue-50',    text: 'text-blue-600' },
              { icon: <FileCheck className="w-6 h-6" />,   label: 'Submitted',        value: submittedCount, sub: `of ${summary?.team_size ?? 0} expected`,                 gradient: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50', text: 'text-emerald-600' },
              { icon: <Clock className="w-6 h-6" />,       label: 'Pending Approval', value: pendingCount,   sub: pendingCount > 0 ? 'needs your action' : 'all clear!',   gradient: 'from-amber-500 to-orange-500', bg: 'bg-amber-50',   text: 'text-amber-600' },
              { icon: <CheckCircle2 className="w-6 h-6" />, label: 'Approved',        value: approvedCount,  sub: 'reports approved',                                       gradient: 'from-violet-500 to-purple-600', bg: 'bg-violet-50',  text: 'text-violet-600' },
            ].map((card, i) => (
              <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 sm:p-5 relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -translate-y-1/2 translate-x-1/2 bg-gradient-to-br ${card.gradient} opacity-10`} />
                <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl ${card.bg} ${card.text} flex items-center justify-center mb-3 sm:mb-4`}>{card.icon}</div>
                <p className="text-2xl sm:text-3xl font-extrabold text-gray-900">{card.value}</p>
                <p className="text-xs sm:text-sm font-semibold text-gray-600 mt-0.5">{card.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* ── Submission rate bar ───────────────────────────────────────── */}
        {!loading && summary && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
            {(() => {
              // How many distinct members submitted at least once (≤ team_size)
              const submittedMembers = Math.min(
                new Set(teamReports.filter(r => r.is_submitted).map((r: any) => r.user)).size,
                summary.team_size ?? 0
              );
              const pct = summary.team_size > 0
                ? Math.min(Math.round((submittedMembers / summary.team_size) * 100), 100)
                : 0;
              const notYet = Math.max((summary.team_size ?? 0) - submittedMembers, 0);
              return (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-bold text-gray-800">Team Submission Rate</p>
                    <span className={`text-sm font-bold ${pct === 100 ? 'text-emerald-600' : 'text-primary'}`}>
                      {pct}%
                    </span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className={`h-full rounded-full ${pct === 100 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-primary to-accent'}`}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-2">
                    <span>{submittedMembers} of {summary.team_size} members submitted</span>
                    {notYet > 0
                      ? <span className="text-amber-500">{notYet} not yet submitted</span>
                      : <span className="text-emerald-500 font-medium">✓ All members submitted</span>
                    }
                  </div>
                </>
              );
            })()}
          </motion.div>
        )}

        {/* ── Team Reports — Unified Tab Layout ────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
        >
          {/* Panel header */}
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-primary" />
              <h2 className="text-base font-bold text-gray-900">Team Reports</h2>
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full font-bold">{teamReports.length}</span>
            </div>
            <span className="text-xs text-gray-400 font-medium">
              {persons.length} team member{persons.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Person tab pills */}
          <div className="border-b border-gray-100 overflow-x-auto scrollbar-none">
            <div className="flex gap-2 px-4 py-3 min-w-max">

              {/* All tab */}
              <button
                onClick={() => { setSelectedPerson('__all__'); setStatusFilter('all'); }}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold border transition-all flex-shrink-0 ${
                  selectedPerson === '__all__'
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-primary/30 hover:bg-primary/5'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                All
                {pendingCount > 0 && (
                  <span className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full text-[9px] sm:text-[10px] font-bold flex items-center justify-center ${
                    selectedPerson === '__all__' ? 'bg-white/25 text-white' : 'bg-amber-500 text-white'
                  }`}>{pendingCount}</span>
                )}
              </button>

              {/* Per-person tabs */}
              {persons.map(person => {
                const isActive = selectedPerson === person.id;
                return (
                  <button
                    key={person.id}
                    onClick={() => { setSelectedPerson(person.id); setStatusFilter('all'); }}
                    className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold border transition-all flex-shrink-0 ${
                      isActive
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-primary/30 hover:bg-primary/5'
                    }`}
                  >
                    <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                      isActive ? 'bg-white/25 text-white' : 'bg-gradient-to-br from-primary/80 to-accent/80 text-white'
                    }`}>
                      {person.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <span className="max-w-[80px] sm:max-w-[120px] truncate">{person.name}</span>
                    {person.pending > 0 && (
                      <span className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full text-[9px] sm:text-[10px] font-bold flex items-center justify-center flex-shrink-0 ${
                        isActive ? 'bg-white/25 text-white' : 'bg-amber-500 text-white'
                      }`}>{person.pending}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Info strip + status filter */}
          <div className="px-4 sm:px-6 py-3 bg-gray-50/60 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
            {/* Person info */}
            <div className="flex items-center gap-2 min-w-0">
              {activePerson ? (
                <>
                  <Avatar name={activePerson.name} size="sm" />
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 text-sm">{activePerson.name}</p>
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap text-[11px]">
                      <span className="text-gray-400">{activePerson.reports.length} total</span>
                      <span className="text-green-600 font-medium flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" />{activePerson.submitted}
                      </span>
                      {activePerson.pending > 0 && (
                        <span className="text-amber-600 font-medium flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />{activePerson.pending} pending
                        </span>
                      )}
                      {activePerson.approved > 0 && (
                        <span className="text-blue-600 font-medium">✓{activePerson.approved} approved</span>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <p className="font-semibold text-gray-700 text-sm">All Team Members</p>
                  <span className="text-xs text-gray-400">· {teamReports.length} reports</span>
                </div>
              )}
            </div>

            {/* Status filter */}
            <div className="overflow-x-auto scrollbar-none flex-shrink-0">
              <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-200 p-1 min-w-max">
                {STATUS_FILTERS.map(f => (
                  <button
                    key={f.key}
                    onClick={() => setStatusFilter(f.key)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                      statusFilter === f.key
                        ? 'bg-gray-900 text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${f.dot} ${statusFilter === f.key ? 'bg-white/70' : ''}`} />
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Report list */}
          <div className="divide-y divide-gray-50">
            {loading ? (
              <div className="p-5 space-y-3 animate-pulse">
                {[1,2,3,4].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
              </div>
            ) : activeReports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <FileText className="w-12 h-12 opacity-20 mb-3" />
                <p className="font-medium">No reports here</p>
                <p className="text-xs mt-1">Try a different filter or team member</p>
              </div>
            ) : (
              <AnimatePresence>
                {activeReports.map((report, i) => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 sm:py-4 hover:bg-gray-50/70 transition-colors group"
                  >
                    {/* Avatar — only when viewing All */}
                    {selectedPerson === '__all__' && (
                      <Avatar name={report.user_name} size="sm" />
                    )}

                    {/* Date pill */}
                    <div className="flex-shrink-0 text-center bg-gray-50 border border-gray-100 rounded-xl px-2.5 sm:px-3 py-1.5 sm:py-2 min-w-[44px] sm:min-w-[52px]">
                      <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase">
                        {new Date(report.date).toLocaleDateString('en-US', { month: 'short' })}
                      </p>
                      <p className="text-base sm:text-lg font-extrabold text-gray-800 leading-none">
                        {new Date(report.date).getDate()}
                      </p>
                      <p className="text-[9px] sm:text-[10px] text-gray-400">
                        {new Date(report.date).toLocaleDateString('en-US', { weekday: 'short' })}
                      </p>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      {selectedPerson === '__all__' && (
                        <p className="font-semibold text-gray-900 text-sm truncate">{report.user_name}</p>
                      )}
                      <p className="text-xs text-gray-500 truncate font-medium">{report.place_of_work || '—'}</p>
                      {report.tasks?.length > 0 && (
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {report.tasks.length} task{report.tasks.length !== 1 ? 's' : ''} · {report.tasks.filter((t: any) => t.status === 'Completed').length} completed
                        </p>
                      )}
                    </div>

                    {/* Status badge */}
                    <span className={`flex-shrink-0 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-bold border ${
                      report.approval
                        ? 'bg-blue-50 text-blue-700 border-blue-100'
                        : report.is_submitted
                        ? 'bg-green-50 text-green-700 border-green-100'
                        : 'bg-gray-50 text-gray-500 border-gray-200'
                    }`}>
                      {report.approval ? '✓ Approved' : report.is_submitted ? 'Submitted' : 'Draft'}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => navigate(`/manager/employee/${report.user}`)}
                        className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-semibold text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">View</span>
                      </button>
                      {report.is_submitted && !report.approval && (
                        <button
                          onClick={() => approve(report.id)}
                          disabled={approvingId === report.id}
                          className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {approvingId === report.id
                            ? '…'
                            : <><CheckCircle2 className="w-3.5 h-3.5" /><span className="hidden sm:inline">Approve</span></>
                          }
                        </button>
                      )}
                      {isCEO && (
                        <button
                          onClick={() => deleteReport(report.id)}
                          disabled={deletingId === report.id}
                          className="p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 group-hover:text-gray-400 transition-colors hidden sm:block" />
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          {/* Footer */}
          {!loading && activeReports.length > 0 && (
            <div className="px-4 sm:px-5 py-2.5 border-t border-gray-100 bg-gray-50/40 text-xs text-gray-400 flex items-center justify-between">
              <span>Showing <strong className="text-gray-600">{activeReports.length}</strong> report{activeReports.length !== 1 ? 's' : ''}</span>
              {activePerson && (
                <button
                  onClick={() => navigate(`/manager/employee/${selectedPerson}`)}
                  className="flex items-center gap-1 text-primary font-semibold hover:underline"
                >
                  Full history <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </motion.div>

      </div>
    </div>
  );
}
