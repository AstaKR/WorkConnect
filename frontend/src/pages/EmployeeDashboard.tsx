import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusCircle, FileText, CheckCircle2, Clock, AlertCircle,
  ArrowRight, MapPin, Zap, TrendingUp, CalendarDays,
  ListTodo, Flame, ChevronRight, Send, Edit3
} from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from '../api/axios';
import { format, subDays, parseISO } from 'date-fns';

const LOCAL_TODAY = format(new Date(), 'yyyy-MM-dd');

// ── Circular progress ring ────────────────────────────────────────────────────
function ProgressRing({ value, size = 80, stroke = 7, label }: {
  value: number; size?: number; stroke?: number; label?: string;
}) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  const color = value === 100 ? '#22c55e' : value >= 60 ? '#6366f1' : value >= 30 ? '#f59e0b' : '#e5e7eb';
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 absolute">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f3f4f6" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease, stroke 0.5s ease' }} />
      </svg>
      <div className="text-center z-10">
        <p className="text-lg font-extrabold text-gray-900 leading-none">{value}%</p>
        {label && <p className="text-[9px] font-medium text-gray-400 mt-0.5 uppercase tracking-wide">{label}</p>}
      </div>
    </div>
  );
}

// ── Priority config ───────────────────────────────────────────────────────────
const PRIORITY_CONFIG: Record<string, { bar: string; badge: string; dot: string }> = {
  High:   { bar: 'bg-red-500',    badge: 'bg-red-50 text-red-700 border-red-200',    dot: 'bg-red-500' },
  Medium: { bar: 'bg-amber-500',  badge: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  Low:    { bar: 'bg-emerald-500',badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
};
const STATUS_CONFIG: Record<string, { badge: string; icon: any }> = {
  'Completed':   { badge: 'bg-green-50 text-green-700 border-green-200',   icon: CheckCircle2 },
  'In Progress': { badge: 'bg-blue-50 text-blue-700 border-blue-200',      icon: Clock },
  'Pending':     { badge: 'bg-gray-50 text-gray-600 border-gray-200',      icon: AlertCircle },
};

// ── Main component ────────────────────────────────────────────────────────────
export default function EmployeeDashboard() {
  const { user, branding } = useAuthStore();
  const [todayReport, setTodayReport] = useState<any>(null);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [todayRes, historyRes] = await Promise.all([
          axios.get(`/reports/date/${LOCAL_TODAY}/`),
          axios.get(`/reports/?date_from=${format(subDays(new Date(), 6), 'yyyy-MM-dd')}&date_to=${LOCAL_TODAY}`),
        ]);
        setTodayReport(todayRes.data.data);
        const raw = historyRes.data;
        setRecentReports(Array.isArray(raw) ? raw : raw.results ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const tasks         = todayReport?.tasks ?? [];
  const completed     = tasks.filter((t: any) => t.status === 'Completed').length;
  const inProgress    = tasks.filter((t: any) => t.status === 'In Progress').length;
  const pending       = tasks.filter((t: any) => t.status === 'Pending').length;
  const totalTasks    = tasks.length;
  const progress      = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;
  const isSubmitted   = todayReport?.is_submitted ?? false;
  const isApproved    = !!todayReport?.approval;

  // Weekly streak — last 7 days
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
    const report = recentReports.find((r: any) => r.date === d);
    return { date: d, report, isToday: d === LOCAL_TODAY };
  });
  const streak = (() => {
    let s = 0;
    for (let i = last7.length - 1; i >= 0; i--) {
      if (last7[i].report?.is_submitted) s++;
      else break;
    }
    return s;
  })();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.full_name?.split(' ')[0] ?? 'there';

  const reportStatusLabel = isApproved ? 'Approved' : isSubmitted ? 'Submitted' : 'Draft';
  const reportStatusStyle = isApproved
    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
    : isSubmitted
    ? 'bg-blue-100 text-blue-700 border-blue-200'
    : 'bg-amber-100 text-amber-700 border-amber-200';

  return (
    <div className="min-h-screen bg-slate-50/60">

      {/* ── Hero banner ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-20 sm:pb-28">
        {/* decorative blobs */}
        <div className="absolute -top-16 -right-16 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-400/20 rounded-full blur-3xl" />
        <div className="absolute top-8 left-1/3 w-40 h-40 bg-indigo-300/10 rounded-full blur-2xl" />
        {/* Grid dots pattern */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="relative max-w-7xl mx-auto flex items-start justify-between gap-4 flex-wrap">
          <div>
            {branding.name && (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-white/60 bg-white/10 border border-white/15 px-2.5 py-1 rounded-full mb-3">
                <Zap className="w-3 h-3" /> {branding.name}
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight">
              {greeting}, {firstName} 👋
            </h1>
            <p className="text-white/60 mt-1.5 text-sm">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
              {streak > 1 && (
                <span className="ml-2 inline-flex items-center gap-1 text-amber-300 font-semibold">
                  <Flame className="w-3.5 h-3.5" /> {streak}-day streak!
                </span>
              )}
            </p>
          </div>

          <Link to="/employee/report">
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 bg-white text-indigo-700 px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-black/20 hover:shadow-xl transition-all text-sm">
              {isSubmitted ? <Edit3 className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
              {isSubmitted ? 'Edit Today\'s Report' : 'Update Today\'s Report'}
            </motion.button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-14 sm:-mt-20 pb-10 space-y-4 sm:space-y-6">

        {/* ── KPI cards overlapping banner ─────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
            {[1,2,3,4].map(i => <div key={i} className="h-32 bg-white rounded-2xl shadow-md" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Tasks Done */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 relative overflow-hidden">
              <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-indigo-500/10" />
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mb-3">
                <ListTodo className="w-5 h-5 text-indigo-600" />
              </div>
              <p className="text-3xl font-extrabold text-gray-900">{completed}<span className="text-lg text-gray-300 font-normal">/{totalTasks}</span></p>
              <p className="text-sm font-semibold text-gray-500 mt-0.5">Tasks Done</p>
              <p className="text-xs text-gray-400 mt-0.5">{inProgress} in progress · {pending} pending</p>
            </motion.div>

            {/* Progress ring */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.10 }}
              className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 flex items-center gap-4 relative overflow-hidden">
              <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-violet-500/10" />
              <ProgressRing value={progress} size={72} stroke={7} label="done" />
              <div>
                <p className="text-sm font-bold text-gray-700">Today's Progress</p>
                <p className="text-xs text-gray-400 mt-0.5">{completed} of {totalTasks} complete</p>
                {progress === 100 && (
                  <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full">
                    <CheckCircle2 className="w-2.5 h-2.5" /> All done!
                  </span>
                )}
              </div>
            </motion.div>

            {/* Report status */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 relative overflow-hidden">
              <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-emerald-500/10" />
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-3">
                <FileText className="w-5 h-5 text-emerald-600" />
              </div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold border ${reportStatusStyle}`}>
                {isApproved ? <CheckCircle2 className="w-3.5 h-3.5" /> : isSubmitted ? <Send className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                {reportStatusLabel}
              </span>
              <p className="text-sm font-semibold text-gray-500 mt-2">Report Status</p>
              {todayReport?.place_of_work && (
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3" />{todayReport.place_of_work}
                </p>
              )}
            </motion.div>

            {/* Weekly streak */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.20 }}
              className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 relative overflow-hidden">
              <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-amber-500/10" />
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mb-3">
                <Flame className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-3xl font-extrabold text-gray-900">{streak}<span className="text-sm text-gray-400 font-normal ml-1">days</span></p>
              <p className="text-sm font-semibold text-gray-500 mt-0.5">Submission Streak</p>
              <p className="text-xs text-gray-400 mt-0.5">{recentReports.filter(r => r.is_submitted).length} of 7 this week</p>
            </motion.div>
          </div>
        )}

        {/* ── Main content row ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Today's Tasks ──────────────────────────────── (2/3) */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-indigo-500" />
                <h2 className="text-base font-bold text-gray-900">Today's Tasks</h2>
                {totalTasks > 0 && (
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full border border-indigo-100">
                    {totalTasks}
                  </span>
                )}
              </div>
              <Link to="/employee/history" className="flex items-center gap-1 text-xs text-indigo-600 font-semibold hover:underline">
                View History <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Progress bar */}
            {totalTasks > 0 && (
              <div className="px-6 py-3 border-b border-gray-50 bg-gray-50/40">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                  <span>{completed} of {totalTasks} completed</span>
                  <span className="font-bold text-indigo-600">{progress}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                  />
                </div>
                <div className="flex items-center gap-4 mt-2 text-[11px] text-gray-400">
                  <span className="flex items-center gap-1 text-green-600"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />{completed} done</span>
                  <span className="flex items-center gap-1 text-blue-500"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />{inProgress} in progress</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />{pending} pending</span>
                </div>
              </div>
            )}

            {/* Task list */}
            <div className="divide-y divide-gray-50">
              {loading ? (
                <div className="p-6 space-y-3 animate-pulse">
                  {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
                </div>
              ) : tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
                    <ListTodo className="w-8 h-8 text-indigo-300" />
                  </div>
                  <p className="text-gray-500 font-medium mb-1">No tasks added yet for today</p>
                  <p className="text-sm text-gray-400 mb-4">Start by creating today's work report</p>
                  <Link to="/employee/report">
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl text-sm font-semibold shadow-sm">
                      <PlusCircle className="w-4 h-4" /> Add Your First Task
                    </motion.button>
                  </Link>
                </div>
              ) : (
                <AnimatePresence>
                  {tasks.map((task: any, i: number) => {
                    const pc = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG['Low'];
                    const sc = STATUS_CONFIG[task.status]   ?? STATUS_CONFIG['Pending'];
                    const StatusIcon = sc.icon;
                    const isExpanded = activeTask === task.id;
                    const isDone = task.status === 'Completed';
                    return (
                      <motion.div key={task.id}
                        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className={`transition-colors ${isDone ? 'bg-green-50/30' : ''}`}>
                        <button
                          onClick={() => setActiveTask(isExpanded ? null : task.id)}
                          className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50/70 transition-colors text-left group"
                        >
                          {/* Priority bar */}
                          <div className={`w-1 h-10 rounded-full flex-shrink-0 ${pc.bar}`} />

                          {/* Done checkmark */}
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            isDone ? 'bg-green-500 border-green-500' : 'border-gray-300 group-hover:border-indigo-400'
                          }`}>
                            {isDone && <CheckCircle2 className="w-3 h-3 text-white" />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className={`font-semibold text-sm truncate ${isDone ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                              {task.job}
                            </p>
                            {task.action_plan && (
                              <p className="text-xs text-gray-400 truncate mt-0.5">{task.action_plan}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${pc.badge}`}>
                              {task.priority}
                            </span>
                            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${sc.badge}`}>
                              <StatusIcon className="w-2.5 h-2.5" />{task.status}
                            </span>
                            <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                              <ChevronRight className="w-4 h-4 text-gray-300" />
                            </motion.div>
                          </div>
                        </button>

                        {/* Expanded detail */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-6 pb-4 bg-gray-50/40 border-t border-gray-50">
                                <div className="grid grid-cols-2 gap-3 pt-3">
                                  {task.action_plan && (
                                    <div className="col-span-2 bg-white rounded-xl border border-gray-100 p-3">
                                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Action Plan</p>
                                      <p className="text-sm text-gray-700">{task.action_plan}</p>
                                    </div>
                                  )}
                                  {task.remark && (
                                    <div className="col-span-2 bg-white rounded-xl border border-gray-100 p-3">
                                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Remarks</p>
                                      <p className="text-sm text-gray-600">{task.remark}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>

            {/* Edit report CTA */}
            {!loading && (
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/40">
                <Link to="/employee/report">
                  <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all">
                    <Edit3 className="w-4 h-4" />
                    {isSubmitted ? 'Edit Today\'s Report' : 'Fill Today\'s Report'}
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </Link>
              </div>
            )}
          </motion.div>

          {/* Right panel ─────────────────────────────────────── (1/3) */}
          <div className="space-y-5">

            {/* Weekly activity ──────────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <CalendarDays className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-bold text-gray-800">This Week</h3>
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {last7.map((day) => {
                  const submitted = day.report?.is_submitted;
                  const hasDraft  = day.report && !submitted;
                  return (
                    <div key={day.date} className="flex flex-col items-center gap-1">
                      <span className="text-[9px] font-bold text-gray-400 uppercase">
                        {format(parseISO(day.date), 'EEE')[0]}
                      </span>
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                        day.isToday
                          ? submitted
                            ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md'
                            : 'ring-2 ring-indigo-400 ring-offset-1 bg-indigo-50 text-indigo-700'
                          : submitted
                          ? 'bg-green-100 text-green-700'
                          : hasDraft
                          ? 'bg-amber-50 text-amber-600 border border-amber-200'
                          : 'bg-gray-50 text-gray-300 border border-gray-100'
                      }`}>
                        {submitted
                          ? <CheckCircle2 className="w-3.5 h-3.5" />
                          : hasDraft
                          ? <Edit3 className="w-3 h-3" />
                          : format(parseISO(day.date), 'd')}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-3 mt-3 text-[10px] text-gray-400">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-md bg-green-100 border border-green-300 inline-block" />Submitted</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-md bg-amber-50 border border-amber-200 inline-block" />Draft</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-md bg-gray-50 border border-gray-100 inline-block" />No report</span>
              </div>
            </motion.div>

            {/* Today's report info ──────────────────────────── */}
            {!loading && todayReport && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-violet-500" />
                  <h3 className="text-sm font-bold text-gray-800">Today's Report</h3>
                  <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold border ${reportStatusStyle}`}>
                    {reportStatusLabel}
                  </span>
                </div>
                {todayReport.place_of_work && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2 mb-2">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                    <span className="truncate font-medium">{todayReport.place_of_work}</span>
                  </div>
                )}
                {todayReport.notes && (
                  <p className="text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2 leading-relaxed line-clamp-3">
                    {todayReport.notes}
                  </p>
                )}
              </motion.div>
            )}

            {/* Quick links ──────────────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-gray-800">Quick Actions</h3>
              </div>
              <div className="space-y-2">
                {[
                  { to: '/employee/report',   icon: Edit3,       label: 'Today\'s Report',  sub: 'Add or edit your report',  color: 'text-indigo-600 bg-indigo-50' },
                  { to: '/employee/history',  icon: TrendingUp,  label: 'Report History',   sub: 'Browse past reports',      color: 'text-violet-600 bg-violet-50' },
                  { to: '/employee/calendar', icon: CalendarDays,label: 'Calendar View',    sub: 'Monthly overview',         color: 'text-blue-600 bg-blue-50' },
                  { to: '/kanban',            icon: ListTodo,    label: 'Kanban Board',     sub: 'Visual task management',   color: 'text-emerald-600 bg-emerald-50' },
                ].map(item => (
                  <Link key={item.to} to={item.to}>
                    <motion.div whileHover={{ x: 3 }}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-all group cursor-pointer">
                      <div className={`w-8 h-8 rounded-lg ${item.color} flex items-center justify-center flex-shrink-0`}>
                        <item.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                        <p className="text-xs text-gray-400">{item.sub}</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition-colors" />
                    </motion.div>
                  </Link>
                ))}
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
}
