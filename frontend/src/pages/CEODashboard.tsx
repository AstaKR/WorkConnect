import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, MapPin, CheckCircle2, TrendingUp, Clock, AlertCircle,
  Building2, ChevronDown, ChevronUp, Search,
  BarChart3, Activity, Layers, Star, RefreshCw,
  ArrowUpRight, Zap, Globe, Award
} from 'lucide-react';
import axios from '../api/axios';
import { Link } from 'react-router-dom';
import { format, subDays } from 'date-fns';
import { useAuthStore } from '../store/useAuthStore';

// ─── Types ───────────────────────────────────────────────────────────────────
interface KPIs {
  total_employees: number; active_today: number; pending_submission: number;
  pending_approval: number; total_tasks: number; completed_tasks: number;
  overall_completion: number; unique_locations: number;
}
interface LocationStat {
  location: string; total: number; completed: number; in_progress: number;
  pending: number; employees: number; completion_rate: number;
}
interface EmployeeStat {
  id: number; name: string; email: string; role: string; department: string;
  manager_name: string; total_reports: number; submitted_reports: number;
  total_tasks: number; completed_tasks: number; completion_rate: number;
  locations_worked: string[];
}
interface DeptStat {
  department: string; count: number; total_tasks: number;
  completed_tasks: number; completion_rate: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const PRESETS = [
  { label: 'Today',       from: () => format(new Date(), 'yyyy-MM-dd'),                                                    to: () => format(new Date(), 'yyyy-MM-dd') },
  { label: 'Last 7 Days', from: () => format(subDays(new Date(), 6), 'yyyy-MM-dd'),                                        to: () => format(new Date(), 'yyyy-MM-dd') },
  { label: 'Last 30 Days',from: () => format(subDays(new Date(), 29), 'yyyy-MM-dd'),                                       to: () => format(new Date(), 'yyyy-MM-dd') },
  { label: 'This Month',  from: () => format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),  to: () => format(new Date(), 'yyyy-MM-dd') },
];

function ProgressRing({ value, size = 56, stroke = 5 }: { value: number; size?: number; stroke?: number }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  const color = value >= 80 ? '#22c55e' : value >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f3f4f6" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
    </svg>
  );
}

function ProgressBar({ value, thin = false }: { value: number; thin?: boolean }) {
  const color = value >= 80 ? 'from-emerald-400 to-green-500' : value >= 50 ? 'from-amber-400 to-yellow-500' : 'from-red-400 to-rose-500';
  const h = thin ? 'h-1.5' : 'h-2';
  return (
    <div className={`${h} bg-gray-100 rounded-full overflow-hidden`}>
      <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className={`h-full rounded-full bg-gradient-to-r ${color}`} />
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const colors = [
    'from-blue-400 to-indigo-500', 'from-violet-400 to-purple-500',
    'from-emerald-400 to-teal-500', 'from-rose-400 to-pink-500',
    'from-amber-400 to-orange-500', 'from-cyan-400 to-blue-500',
  ];
  const color = colors[(name.charCodeAt(0) ?? 0) % colors.length];
  return (
    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
      {initials}
    </div>
  );
}

function CompletionBadge({ rate }: { rate: number }) {
  const style = rate >= 80 ? 'bg-green-100 text-green-700 border-green-200'
    : rate >= 50 ? 'bg-amber-100 text-amber-700 border-amber-200'
    : 'bg-red-100 text-red-700 border-red-200';
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${style}`}>{rate}%</span>
  );
}

// ─── KPI Card ────────────────────────────────────────────────────────────────
interface KPICardProps {
  icon: React.ReactNode; label: string; value: string | number;
  sub?: string; gradient: string; delay?: number;
}
function KPICard({ icon, label, value, sub, gradient, delay = 0 }: KPICardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="relative overflow-hidden bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5 group">
      {/* Gradient accent blob */}
      <div className={`absolute -right-6 -top-6 w-28 h-28 rounded-full opacity-[0.07] bg-gradient-to-br ${gradient}`} />
      <div className="flex items-start justify-between">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}>
          {icon}
        </div>
        <ArrowUpRight className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="mt-4">
        <p className="text-3xl font-extrabold text-gray-900 leading-none">{value}</p>
        <p className="text-sm font-medium text-gray-500 mt-1">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function CEODashboard() {
  const { user, branding } = useAuthStore();
  const today = format(new Date(), 'yyyy-MM-dd');
  const sevenDaysAgo = format(subDays(new Date(), 6), 'yyyy-MM-dd');
  const [dateFrom, setDateFrom] = useState(sevenDaysAgo);
  const [dateTo, setDateTo] = useState(today);
  const [activePreset, setActivePreset] = useState('Last 7 Days');
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [locations, setLocations] = useState<LocationStat[]>([]);
  const [employees, setEmployees] = useState<EmployeeStat[]>([]);
  const [departments, setDepartments] = useState<DeptStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'locations' | 'employees' | 'departments'>('locations');
  const [search, setSearch] = useState('');
  const [expandedEmp, setExpandedEmp] = useState<number | null>(null);
  const [showCustomDates, setShowCustomDates] = useState(false);

  const firstName = user?.full_name?.split(' ')[0] ?? 'CEO';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const fetchData = useCallback(async (from: string, to: string, silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [hier] = await Promise.all([
        axios.get(`/dashboard/hierarchy/?date_from=${from}&date_to=${to}`),
      ]);
      const d = hier.data.data;
      setKpis(d.kpis);
      setLocations(d.location_breakdown ?? []);
      setEmployees(d.employee_stats ?? []);
      setDepartments(d.department_breakdown ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(dateFrom, dateTo); }, [dateFrom, dateTo]);

  const applyPreset = (p: typeof PRESETS[0]) => {
    setDateFrom(p.from()); setDateTo(p.to()); setActivePreset(p.label);
    setShowCustomDates(false);
  };

  const filteredEmployees = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.department?.toLowerCase().includes(search.toLowerCase()) ||
    e.locations_worked?.some(l => l.toLowerCase().includes(search.toLowerCase()))
  );

  const TABS = [
    { id: 'locations',   label: 'Locations',   icon: Globe },
    { id: 'employees',   label: 'Employees',   icon: Users },
    { id: 'departments', label: 'Departments', icon: Building2 },
  ];

  const displayRange = activePreset || `${dateFrom} – ${dateTo}`;

  return (
    <div className="min-h-screen bg-gray-50/50">

      {/* ── Hero Banner ───────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-violet-950 to-indigo-900 px-6 pt-8 pb-24">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-20 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl translate-y-1/2" />
        <div className="absolute top-16 left-1/2 w-48 h-48 bg-purple-400/10 rounded-full blur-2xl" />

        <div className="relative max-w-7xl mx-auto">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-violet-300/80 bg-white/8 border border-white/10 px-2.5 py-1 rounded-full">
                  <Zap className="w-3 h-3" /> CEO Dashboard
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">
                {greeting}, {firstName} 👋
              </h1>
              <p className="text-white/50 mt-1.5 text-sm">
                {branding.name && branding.name !== 'WorkConnect' ? branding.name + ' · ' : ''}
                Company-wide overview · <span className="text-white/70 font-medium">{displayRange}</span>
              </p>
            </div>

            {/* Refresh */}
            <button onClick={() => fetchData(dateFrom, dateTo, true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/15 text-white/80 hover:text-white rounded-xl text-sm font-medium transition-all">
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Preset pills */}
          <div className="flex flex-wrap items-center gap-2 mt-6">
            {PRESETS.map(p => (
              <button key={p.label} onClick={() => applyPreset(p)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  activePreset === p.label
                    ? 'bg-white text-violet-900 border-white shadow-md'
                    : 'bg-white/8 text-white/60 border-white/15 hover:bg-white/15 hover:text-white'
                }`}>
                {p.label}
              </button>
            ))}
            <button onClick={() => setShowCustomDates(v => !v)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                showCustomDates
                  ? 'bg-white/20 text-white border-white/30'
                  : 'bg-white/8 text-white/60 border-white/15 hover:bg-white/15 hover:text-white'
              }`}>
              <Activity className="w-3 h-3" /> Custom Range
            </button>

            <AnimatePresence>
              {showCustomDates && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-2xl px-3 py-2">
                  <input type="date" value={dateFrom} max={dateTo}
                    onChange={e => { setDateFrom(e.target.value); setActivePreset(''); }}
                    className="bg-transparent text-white text-xs border-none outline-none" />
                  <span className="text-white/40 text-xs">→</span>
                  <input type="date" value={dateTo} min={dateFrom} max={today}
                    onChange={e => { setDateTo(e.target.value); setActivePreset(''); }}
                    className="bg-transparent text-white text-xs border-none outline-none" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── KPI Cards (overlapping banner) ────────────────────────────── */}
      <div className="relative max-w-7xl mx-auto px-6 -mt-14 z-10">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-32 bg-white rounded-2xl border border-gray-100 shadow-sm" />
            ))}
          </div>
        ) : kpis && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard
              icon={<Users className="w-5 h-5 text-white" />}
              label="Total Employees" value={kpis.total_employees}
              gradient="from-blue-500 to-indigo-600" delay={0.0}
            />
            <KPICard
              icon={<CheckCircle2 className="w-5 h-5 text-white" />}
              label="Submitted Today" value={kpis.active_today}
              sub={`${kpis.pending_submission} still pending`}
              gradient="from-emerald-500 to-green-600" delay={0.05}
            />
            <KPICard
              icon={<Clock className="w-5 h-5 text-white" />}
              label="Pending Approval" value={kpis.pending_approval}
              gradient="from-amber-500 to-orange-500" delay={0.10}
            />
            <KPICard
              icon={<MapPin className="w-5 h-5 text-white" />}
              label="Active Locations" value={kpis.unique_locations}
              gradient="from-violet-500 to-purple-600" delay={0.15}
            />
            <KPICard
              icon={<BarChart3 className="w-5 h-5 text-white" />}
              label="Total Tasks" value={kpis.total_tasks}
              gradient="from-sky-500 to-cyan-600" delay={0.20}
            />
            <KPICard
              icon={<Award className="w-5 h-5 text-white" />}
              label="Completed Tasks" value={kpis.completed_tasks}
              gradient="from-teal-500 to-emerald-600" delay={0.25}
            />
            <KPICard
              icon={<TrendingUp className="w-5 h-5 text-white" />}
              label="Overall Completion" value={`${kpis.overall_completion}%`}
              gradient="from-rose-500 to-pink-600" delay={0.30}
            />
            <KPICard
              icon={<AlertCircle className="w-5 h-5 text-white" />}
              label="Pending Tasks" value={kpis.total_tasks - kpis.completed_tasks}
              gradient="from-orange-500 to-red-500" delay={0.35}
            />
          </div>
        )}
      </div>

      {/* ── Completion overview strip ──────────────────────────────────── */}
      {!loading && kpis && (
        <div className="max-w-7xl mx-auto px-6 mt-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-4 flex-1 min-w-48">
              <div className="relative">
                <ProgressRing value={kpis.overall_completion} size={64} stroke={6} />
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-800">
                  {kpis.overall_completion}%
                </span>
              </div>
              <div>
                <p className="font-bold text-gray-900">Overall Task Completion</p>
                <p className="text-sm text-gray-400 mt-0.5">{kpis.completed_tasks} of {kpis.total_tasks} tasks done</p>
              </div>
            </div>

            <div className="flex-1 min-w-48 space-y-2">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Report Submission Rate</span>
                <span className="font-semibold text-gray-700">
                  {kpis.total_employees > 0 ? Math.round((kpis.active_today / kpis.total_employees) * 100) : 0}%
                </span>
              </div>
              <ProgressBar value={kpis.total_employees > 0 ? Math.round((kpis.active_today / kpis.total_employees) * 100) : 0} />
              <p className="text-xs text-gray-400">{kpis.active_today} submitted · {kpis.pending_submission} pending</p>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="text-center px-4 py-2 bg-violet-50 rounded-xl border border-violet-100">
                <p className="text-2xl font-extrabold text-violet-700">{kpis.unique_locations}</p>
                <p className="text-xs text-violet-500 font-medium">Locations</p>
              </div>
              <div className="text-center px-4 py-2 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-2xl font-extrabold text-blue-700">{kpis.total_employees}</p>
                <p className="text-xs text-blue-500 font-medium">Employees</p>
              </div>
              <div className="text-center px-4 py-2 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-2xl font-extrabold text-amber-700">{kpis.pending_approval}</p>
                <p className="text-xs text-amber-500 font-medium">To Approve</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tabs Section ──────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 mt-5 pb-10">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

          {/* Tab header */}
          <div className="flex items-center gap-1 px-4 pt-4 pb-0 border-b border-gray-100">
            {TABS.map(t => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button key={t.id} onClick={() => setTab(t.id as any)}
                  className={`relative flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-all ${
                    active ? 'text-violet-700' : 'text-gray-400 hover:text-gray-600'
                  }`}>
                  <Icon className="w-4 h-4" />
                  {t.label}
                  {active && (
                    <motion.div layoutId="ceo-tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-t-full" />
                  )}
                </button>
              );
            })}

            {/* Search for employees */}
            <AnimatePresence>
              {tab === 'employees' && (
                <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }} className="ml-auto mb-2 overflow-hidden">
                  <div className="relative w-60">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                      placeholder="Search name, dept, location..."
                      className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-200 focus:border-violet-400 w-full outline-none" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="p-5">

            {/* ── LOCATIONS ───────────────────────────────────────────── */}
            {tab === 'locations' && (
              <div className="space-y-3">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
                  ))
                ) : locations.length === 0 ? (
                  <div className="text-center py-20 text-gray-400">
                    <Globe className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="font-medium">No location data for this period</p>
                    <p className="text-xs mt-1 text-gray-300">Tasks need a location assigned via ER Plan</p>
                  </div>
                ) : locations.map((loc, i) => (
                  <motion.div key={loc.location}
                    initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group p-4 border border-gray-100 rounded-2xl hover:border-violet-200 hover:bg-violet-50/30 transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-sm flex-shrink-0 shadow-sm">
                          {i + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 truncate">{loc.location}</p>
                          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                            <Users className="w-3 h-3" /> {loc.employees} employee{loc.employees !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="hidden sm:block text-right">
                          <p className="text-xs text-gray-400">Tasks</p>
                          <p className="text-xl font-extrabold text-gray-900">{loc.total}</p>
                        </div>
                        <CompletionBadge rate={loc.completion_rate} />
                      </div>
                    </div>

                    <div className="mt-3.5">
                      <ProgressBar value={loc.completion_rate} />
                    </div>

                    <div className="flex items-center gap-5 mt-2.5 text-xs text-gray-400">
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {loc.completed} done
                      </span>
                      <span className="flex items-center gap-1 text-blue-500">
                        <Activity className="w-3.5 h-3.5" /> {loc.in_progress} in progress
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {loc.pending} pending
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* ── EMPLOYEES ───────────────────────────────────────────── */}
            {tab === 'employees' && (
              <div className="space-y-2">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
                  ))
                ) : filteredEmployees.length === 0 ? (
                  <div className="text-center py-20 text-gray-400">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="font-medium">No employees found</p>
                  </div>
                ) : filteredEmployees.map((emp, i) => (
                  <motion.div key={emp.id}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border border-gray-100 rounded-2xl overflow-hidden hover:border-violet-200 transition-all">

                    <button onClick={() => setExpandedEmp(expandedEmp === emp.id ? null : emp.id)}
                      className="w-full flex items-center gap-3 p-4 hover:bg-gray-50/60 transition-colors text-left">
                      <Avatar name={emp.name} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900 text-sm">{emp.name}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${
                            emp.role === 'ceo'     ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            emp.role === 'manager' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                     'bg-gray-50 text-gray-500 border-gray-200'
                          }`}>{emp.role}</span>
                          {emp.department && (
                            <span className="text-xs text-gray-400 hidden sm:inline">{emp.department}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <div className="flex-1 max-w-xs">
                            <ProgressBar value={emp.completion_rate} thin />
                          </div>
                          <span className="text-xs text-gray-400 flex-shrink-0">{emp.completed_tasks}/{emp.total_tasks} tasks</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <CompletionBadge rate={emp.completion_rate} />
                        <motion.div animate={{ rotate: expandedEmp === emp.id ? 180 : 0 }} transition={{ duration: 0.2 }}>
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        </motion.div>
                      </div>
                    </button>

                    <AnimatePresence>
                      {expandedEmp === emp.id && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                          className="overflow-hidden">
                          <div className="px-5 pb-5 border-t border-gray-100 bg-gray-50/30">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
                              {[
                                { label: 'Total Reports',  value: emp.total_reports,    color: 'text-gray-900' },
                                { label: 'Submitted',      value: emp.submitted_reports, color: 'text-blue-700' },
                                { label: 'Total Tasks',    value: emp.total_tasks,       color: 'text-gray-900' },
                                { label: 'Completed',      value: emp.completed_tasks,   color: 'text-green-700' },
                              ].map(item => (
                                <div key={item.label} className="bg-white rounded-xl p-3 border border-gray-100 text-center">
                                  <p className={`text-2xl font-extrabold ${item.color}`}>{item.value}</p>
                                  <p className="text-xs text-gray-400 mt-0.5">{item.label}</p>
                                </div>
                              ))}
                            </div>

                            {emp.locations_worked?.length > 0 && (
                              <div className="mt-4">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">📍 Locations Worked</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {emp.locations_worked.map(l => (
                                    <span key={l} className="px-2.5 py-1 bg-violet-100 text-violet-700 text-xs font-semibold rounded-full border border-violet-200">
                                      {l}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {emp.manager_name && (
                              <p className="text-xs text-gray-400 mt-3">
                                Reports to: <strong className="text-gray-600">{emp.manager_name}</strong>
                              </p>
                            )}

                            <div className="mt-4">
                              <Link to={`/manager/employee/${emp.id}`}>
                                <button className="flex items-center gap-1.5 text-xs text-violet-600 font-semibold hover:text-violet-800 transition-colors">
                                  View Full Report History <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              </Link>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            )}

            {/* ── DEPARTMENTS ─────────────────────────────────────────── */}
            {tab === 'departments' && (
              <div className="space-y-3">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
                  ))
                ) : departments.length === 0 ? (
                  <div className="text-center py-20 text-gray-400">
                    <Building2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="font-medium">No department data for this period</p>
                  </div>
                ) : departments.map((dept, i) => (
                  <motion.div key={dept.department}
                    initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-4 border border-gray-100 rounded-2xl hover:border-violet-200 hover:bg-violet-50/20 transition-all">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm">
                          <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{dept.department}</p>
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <Users className="w-3 h-3" /> {dept.count} employee{dept.count !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-gray-400">Tasks</p>
                          <p className="font-extrabold text-gray-900">{dept.completed_tasks}<span className="text-gray-300 font-normal">/{dept.total_tasks}</span></p>
                        </div>
                        <div className="relative">
                          <ProgressRing value={dept.completion_rate} size={48} stroke={4} />
                          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-700">
                            {dept.completion_rate}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <ProgressBar value={dept.completion_rate} />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

          </div>
        </div>
      </div>

    </div>
  );
}

// ChevronRight used inline
function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}
