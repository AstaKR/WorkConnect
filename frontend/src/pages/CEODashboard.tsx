import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Users, MapPin, CheckCircle2, TrendingUp, Clock, AlertCircle,
  Building2, ChevronDown, ChevronUp, Search, Filter, Settings,
  BarChart3, Activity, Layers, Star, Download
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
const ProgressBar = ({ value, color = 'bg-primary' }: { value: number; color?: string }) => (
  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
    <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className={`h-full rounded-full ${color}`} />
  </div>
);

const CompletionBadge = ({ rate }: { rate: number }) => {
  const color = rate >= 80 ? 'bg-green-100 text-green-700' : rate >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700';
  return <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${color}`}>{rate}%</span>;
};

const PRESETS = [
  { label: 'Today', from: () => format(new Date(), 'yyyy-MM-dd'), to: () => format(new Date(), 'yyyy-MM-dd') },
  { label: 'Last 7 Days', from: () => format(subDays(new Date(), 6), 'yyyy-MM-dd'), to: () => format(new Date(), 'yyyy-MM-dd') },
  { label: 'Last 30 Days', from: () => format(subDays(new Date(), 29), 'yyyy-MM-dd'), to: () => format(new Date(), 'yyyy-MM-dd') },
  { label: 'This Month', from: () => format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'), to: () => format(new Date(), 'yyyy-MM-dd') },
];

// ─── KPI Card ────────────────────────────────────────────────────────────────
function KPICard({ icon, label, value, sub, color }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 relative overflow-hidden hover:shadow-md transition-shadow">
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 ${color}`} />
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color} bg-opacity-20`}>
        {icon}
      </div>
      <div>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500 font-medium mt-0.5">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function CEODashboard() {
  const { branding } = useAuthStore();
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
  const [tab, setTab] = useState<'locations' | 'employees' | 'departments'>('locations');
  const [search, setSearch] = useState('');
  const [expandedEmp, setExpandedEmp] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const fetchData = useCallback(async (from: string, to: string) => {
    setLoading(true);
    try {
      const [hier, team] = await Promise.all([
        axios.get(`/dashboard/hierarchy/?date_from=${from}&date_to=${to}`),
        axios.get('/dashboard/summary/'),
      ]);
      const d = hier.data.data;
      setKpis(d.kpis);
      setLocations(d.location_breakdown);
      setEmployees(d.employee_stats);
      setDepartments(d.department_breakdown);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(dateFrom, dateTo); }, [dateFrom, dateTo]);

  const applyPreset = (p: typeof PRESETS[0]) => {
    setDateFrom(p.from()); setDateTo(p.to()); setActivePreset(p.label);
  };

  const filteredEmployees = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.department.toLowerCase().includes(search.toLowerCase()) ||
    e.locations_worked.some(l => l.toLowerCase().includes(search.toLowerCase()))
  );

  const TABS = [
    { id: 'locations', label: 'By Location', icon: <MapPin className="w-4 h-4" /> },
    { id: 'employees', label: 'By Employee', icon: <Users className="w-4 h-4" /> },
    { id: 'departments', label: 'By Department', icon: <Building2 className="w-4 h-4" /> },
  ];

  const displayLabel = dateFrom === dateTo
    ? (dateFrom === today ? 'Today' : dateFrom)
    : `${dateFrom} – ${dateTo}`;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm p-1 overflow-hidden">
             {branding.logo ? (
               <img src={branding.logo} alt="Logo" className="w-full h-full object-contain" />
             ) : (
               <Layers className="w-8 h-8 text-primary" />
             )}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">
                {branding.name}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Hierarchy Dashboard
            </h1>
            <p className="text-gray-500 mt-0.5 text-sm">
              Multi-location operations · <strong>{displayLabel}</strong>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/settings/system">
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium text-sm">
              <Settings className="w-4 h-4" /> Settings
            </button>
          </Link>
        </div>
      </div>

      {/* ── Date filter bar ────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Activity className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-1">Period:</span>
          {PRESETS.map(p => (
            <button key={p.label} onClick={() => applyPreset(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                activePreset === p.label ? 'bg-primary text-white border-primary' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}>
              {p.label}
            </button>
          ))}
          <button onClick={() => setShowFilters(v => !v)}
            className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${showFilters ? 'bg-primary/10 text-primary border-primary/20' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
            <Filter className="w-3.5 h-3.5" /> Custom
          </button>
        </div>
        {showFilters && (
          <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-gray-100">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">From</label>
              <input type="date" value={dateFrom} max={dateTo}
                onChange={e => { setDateFrom(e.target.value); setActivePreset(''); }}
                className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">To</label>
              <input type="date" value={dateTo} min={dateFrom} max={today}
                onChange={e => { setDateTo(e.target.value); setActivePreset(''); }}
                className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary" />
            </div>
          </div>
        )}
      </div>

      {/* ── KPI Grid ─────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
          {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl" />)}
        </div>
      ) : kpis && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard icon={<Users className="w-5 h-5 text-blue-600" />} label="Total Employees" value={kpis.total_employees} color="bg-blue-500" />
          <KPICard icon={<CheckCircle2 className="w-5 h-5 text-green-600" />} label="Submitted Today" value={kpis.active_today} sub={`${kpis.pending_submission} pending`} color="bg-green-500" />
          <KPICard icon={<Clock className="w-5 h-5 text-yellow-600" />} label="Pending Approval" value={kpis.pending_approval} color="bg-yellow-500" />
          <KPICard icon={<MapPin className="w-5 h-5 text-purple-600" />} label="Active Locations" value={kpis.unique_locations} color="bg-purple-500" />
          <KPICard icon={<BarChart3 className="w-5 h-5 text-indigo-600" />} label="Total Tasks" value={kpis.total_tasks} color="bg-indigo-500" />
          <KPICard icon={<Star className="w-5 h-5 text-emerald-600" />} label="Completed Tasks" value={kpis.completed_tasks} color="bg-emerald-500" />
          <KPICard icon={<TrendingUp className="w-5 h-5 text-rose-600" />} label="Overall Completion" value={`${kpis.overall_completion}%`} color="bg-rose-500" />
          <KPICard icon={<AlertCircle className="w-5 h-5 text-orange-600" />} label="Pending Tasks" value={kpis.total_tasks - kpis.completed_tasks} color="bg-orange-500" />
        </div>
      )}

      {/* ── Tabs ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Tab bar */}
        <div className="flex items-center border-b border-gray-100 px-4 pt-4 gap-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl border-b-2 transition-all ${
                tab === t.id ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}>
              {t.icon} {t.label}
            </button>
          ))}
          {tab === 'employees' && (
            <div className="ml-auto mb-2 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search employees, locations..."
                className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary w-64" />
            </div>
          )}
        </div>

        <div className="p-4">

          {/* ── LOCATION TAB ─────────────────────────────────────────── */}
          {tab === 'locations' && (
            <div className="space-y-3">
              {locations.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <MapPin className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>No location data for this period.</p>
                  <p className="text-xs mt-1">Tasks need location assigned via ER Plan.</p>
                </div>
              ) : locations.map((loc, i) => (
                <motion.div key={loc.location} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className="p-4 bg-gray-50/60 border border-gray-100 rounded-2xl hover:bg-white hover:shadow-sm transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">
                        #{i + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 truncate">{loc.location}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{loc.employees} employee{loc.employees !== 1 ? 's' : ''} working here</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-gray-500">Tasks</p>
                        <p className="font-bold text-gray-900 text-lg">{loc.total}</p>
                      </div>
                      <CompletionBadge rate={loc.completion_rate} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <ProgressBar
                      value={loc.completion_rate}
                      color={loc.completion_rate >= 80 ? 'bg-green-500' : loc.completion_rate >= 50 ? 'bg-yellow-500' : 'bg-red-400'}
                    />
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" />{loc.completed} Done</span>
                    <span className="flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5 text-blue-400" />{loc.in_progress} In Progress</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-gray-400" />{loc.pending} Pending</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* ── EMPLOYEE TAB ─────────────────────────────────────────── */}
          {tab === 'employees' && (
            <div className="space-y-2">
              {filteredEmployees.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>No employees found.</p>
                </div>
              ) : filteredEmployees.map((emp, i) => (
                <motion.div key={emp.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="border border-gray-100 rounded-2xl overflow-hidden hover:border-gray-200 transition-all">
                  <button onClick={() => setExpandedEmp(expandedEmp === emp.id ? null : emp.id)}
                    className="w-full flex items-center gap-3 p-4 hover:bg-gray-50/50 transition-colors text-left">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900">{emp.name}</p>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${
                          emp.role === 'ceo' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          emp.role === 'manager' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-gray-50 text-gray-600 border-gray-200'
                        }`}>{emp.role}</span>
                        {emp.department && <span className="text-xs text-gray-400">{emp.department}</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex-1 max-w-48">
                          <ProgressBar
                            value={emp.completion_rate}
                            color={emp.completion_rate >= 80 ? 'bg-green-500' : emp.completion_rate >= 50 ? 'bg-yellow-500' : 'bg-red-400'}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{emp.completed_tasks}/{emp.total_tasks} tasks</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <CompletionBadge rate={emp.completion_rate} />
                      {expandedEmp === emp.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {expandedEmp === emp.id && (
                    <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50/30">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 text-sm">
                        <div className="bg-white rounded-xl p-3 border border-gray-100">
                          <p className="text-xs text-gray-400">Total Reports</p>
                          <p className="font-bold text-gray-900 text-xl">{emp.total_reports}</p>
                        </div>
                        <div className="bg-white rounded-xl p-3 border border-gray-100">
                          <p className="text-xs text-gray-400">Submitted</p>
                          <p className="font-bold text-gray-900 text-xl">{emp.submitted_reports}</p>
                        </div>
                        <div className="bg-white rounded-xl p-3 border border-gray-100">
                          <p className="text-xs text-gray-400">Total Tasks</p>
                          <p className="font-bold text-gray-900 text-xl">{emp.total_tasks}</p>
                        </div>
                        <div className="bg-white rounded-xl p-3 border border-gray-100">
                          <p className="text-xs text-gray-400">Completed</p>
                          <p className="font-bold text-green-600 text-xl">{emp.completed_tasks}</p>
                        </div>
                      </div>
                      {emp.locations_worked.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">📍 Locations Worked</p>
                          <div className="flex flex-wrap gap-1.5">
                            {emp.locations_worked.map(l => (
                              <span key={l} className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full border border-primary/20">
                                {l}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {emp.manager_name && (
                        <p className="text-xs text-gray-400 mt-3">Reports to: <strong className="text-gray-600">{emp.manager_name}</strong></p>
                      )}
                      <div className="mt-3">
                        <Link to={`/manager/employee/${emp.id}`}>
                          <button className="text-xs text-primary font-semibold hover:underline">View Full Report History →</button>
                        </Link>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {/* ── DEPARTMENT TAB ───────────────────────────────────────── */}
          {tab === 'departments' && (
            <div className="space-y-3">
              {departments.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>No department data for this period.</p>
                </div>
              ) : departments.map((dept, i) => (
                <motion.div key={dept.department} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className="p-4 bg-gray-50/60 border border-gray-100 rounded-2xl hover:bg-white hover:shadow-sm transition-all">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{dept.department}</p>
                        <p className="text-xs text-gray-500">{dept.count} employees</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Tasks</p>
                        <p className="font-bold text-gray-900">{dept.completed_tasks}/{dept.total_tasks}</p>
                      </div>
                      <CompletionBadge rate={dept.completion_rate} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <ProgressBar
                      value={dept.completion_rate}
                      color={dept.completion_rate >= 80 ? 'bg-green-500' : dept.completion_rate >= 50 ? 'bg-yellow-500' : 'bg-red-400'}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
