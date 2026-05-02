import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Search, ChevronDown, ChevronUp, Trash2, Edit3, Check, X,
  SlidersHorizontal, User, FileText, Clock, CheckCircle2,
  AlertCircle, RotateCcw, Users
} from 'lucide-react';
import api from '../api/axios';
import { useAuthStore } from '../store/useAuthStore';
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, parseISO } from 'date-fns';

const PRIORITY_COLORS: Record<string, string> = {
  High: 'bg-red-100 text-red-700',
  Medium: 'bg-orange-100 text-orange-700',
  Low: 'bg-green-100 text-green-700',
};
const STATUS_COLORS: Record<string, string> = {
  Completed: 'bg-green-100 text-green-700',
  'In Progress': 'bg-blue-100 text-blue-700',
  Pending: 'bg-gray-100 text-gray-600',
};

const STATUS_TABS = [
  { key: '', label: 'All', icon: FileText },
  { key: 'draft', label: 'Draft', icon: Clock },
  { key: 'submitted', label: 'Submitted', icon: AlertCircle },
  { key: 'approved', label: 'Approved', icon: CheckCircle2 },
  { key: 'pending', label: 'Pending Approval', icon: AlertCircle },
];

const DATE_PRESETS = [
  { label: 'Today', getRange: () => { const d = format(new Date(), 'yyyy-MM-dd'); return { from: d, to: d }; } },
  { label: 'This Week', getRange: () => ({ from: format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'), to: format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd') }) },
  { label: 'This Month', getRange: () => ({ from: format(startOfMonth(new Date()), 'yyyy-MM-dd'), to: format(endOfMonth(new Date()), 'yyyy-MM-dd') }) },
  { label: 'Last 7 Days', getRange: () => ({ from: format(subDays(new Date(), 6), 'yyyy-MM-dd'), to: format(new Date(), 'yyyy-MM-dd') }) },
  { label: 'Last 30 Days', getRange: () => ({ from: format(subDays(new Date(), 29), 'yyyy-MM-dd'), to: format(new Date(), 'yyyy-MM-dd') }) },
];

interface Employee { id: number; full_name: string; email: string; role: string; department: string | null; }

export default function ReportHistory() {
  const { user } = useAuthStore();
  const isCEO = user?.role === 'ceo';
  const isManager = user?.role === 'manager';
  const canFilter = isCEO || isManager;

  // Data state
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Filter state
  const [filtersOpen, setFiltersOpen] = useState(canFilter);
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activePreset, setActivePreset] = useState('');

  // Interaction state
  const [expandedReport, setExpandedReport] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingTask, setEditingTask] = useState<{ id: number; status: string; priority: string } | null>(null);
  const [savingTask, setSavingTask] = useState(false);

  // Load employees list for filter dropdown
  useEffect(() => {
    if (!canFilter) return;
    api.get('/auth/users/').then(res => {
      const data = res.data;
      const list: Employee[] = Array.isArray(data) ? data : (data.results ?? []);
      setEmployees(list.filter(e => e.role === 'employee' || e.role === 'manager'));
    }).catch(() => {});
  }, [canFilter]);

  // Build query and fetch reports
  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (selectedUserId) params.user_id = selectedUserId;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/reports/', { params });
      const data = res.data;
      setReports(Array.isArray(data) ? data : (data.results ?? []));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedUserId, dateFrom, dateTo, statusFilter]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  // Preset date handler
  const applyPreset = (preset: typeof DATE_PRESETS[0]) => {
    const range = preset.getRange();
    setDateFrom(range.from);
    setDateTo(range.to);
    setActivePreset(preset.label);
  };

  const clearFilters = () => {
    setSelectedUserId('');
    setDateFrom('');
    setDateTo('');
    setStatusFilter('');
    setActivePreset('');
    setSearch('');
  };

  const hasActiveFilters = selectedUserId || dateFrom || dateTo || statusFilter || search;

  // Client-side search on top of server-filtered results
  const filtered = reports.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (r.place_of_work || '').toLowerCase().includes(q) ||
      new Date(r.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toLowerCase().includes(q) ||
      (r.user_name || '').toLowerCase().includes(q) ||
      (r.notes || '').toLowerCase().includes(q) ||
      (r.tasks || []).some((t: any) => (t.job || '').toLowerCase().includes(q))
    );
  });

  // Group by user for CEO/manager view
  const groupedByUser = React.useMemo(() => {
    if (!canFilter || selectedUserId) return null; // Don't group when single user selected
    const groups: Record<string, { userName: string; reports: any[] }> = {};
    filtered.forEach(r => {
      const key = r.user_name || 'Unknown';
      if (!groups[key]) groups[key] = { userName: key, reports: [] };
      groups[key].reports.push(r);
    });
    return Object.values(groups);
  }, [filtered, canFilter, selectedUserId]);

  // Actions
  const toggleExpand = (id: number) => {
    setExpandedReport(expandedReport === id ? null : id);
    setEditingTask(null);
  };

  const handleDeleteReport = async (id: number) => {
    if (!confirm('Delete this report and all its tasks? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await api.delete(`/reports/${id}/`);
      setReports(prev => prev.filter(r => r.id !== id));
      if (expandedReport === id) setExpandedReport(null);
    } catch {
      alert('Failed to delete report.');
    } finally {
      setDeletingId(null);
    }
  };

  const saveTaskEdit = async (reportId: number) => {
    if (!editingTask) return;
    setSavingTask(true);
    try {
      await api.patch(`/reports/tasks/${editingTask.id}/`, { status: editingTask.status, priority: editingTask.priority });
      setReports(prev => prev.map(r =>
        r.id === reportId
          ? { ...r, tasks: r.tasks.map((t: any) => t.id === editingTask.id ? { ...t, ...editingTask } : t) }
          : r
      ));
      setEditingTask(null);
    } catch {
      alert('Failed to save task.');
    } finally {
      setSavingTask(false);
    }
  };

  // ── Render a single report card ────────────────────────────────────────────
  const renderReportCard = (report: any, index: number) => (
    <motion.div
      key={report.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.25) }}
      className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Header row */}
      <div
        className="p-4 flex items-center justify-between cursor-pointer select-none hover:bg-gray-50 transition-colors"
        onClick={() => toggleExpand(report.id)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center border border-blue-100 flex-shrink-0">
            <span className="text-xs text-blue-500 font-medium leading-none">
              {format(parseISO(report.date), 'MMM')}
            </span>
            <span className="text-lg font-bold text-blue-700 leading-none">
              {format(parseISO(report.date), 'd')}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm">
              {format(parseISO(report.date), 'EEEE, MMMM d, yyyy')}
            </p>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              <span className="text-xs text-gray-500">{report.place_of_work || 'No location'}</span>
              {canFilter && report.user_name && !selectedUserId && (
                <span className="px-2 py-0.5 bg-violet-50 text-violet-600 text-xs rounded-full font-medium border border-violet-100">
                  {report.user_name}
                </span>
              )}
              {report.tasks?.length > 0 && (
                <span className="text-xs text-gray-400">{report.tasks.length} task{report.tasks.length !== 1 ? 's' : ''}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${report.is_submitted ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
            {report.is_submitted ? 'Submitted' : 'Draft'}
          </span>
          {report.approval && (
            <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full border border-emerald-100 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Approved
            </span>
          )}
          {isCEO && (
            <button
              onClick={e => { e.stopPropagation(); handleDeleteReport(report.id); }}
              disabled={deletingId === report.id}
              className="p-1.5 rounded-lg text-red-300 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40"
              title="Delete report"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {expandedReport === report.id
            ? <ChevronUp className="w-4 h-4 text-gray-400" />
            : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {/* Expanded tasks */}
      <AnimatePresence>
        {expandedReport === report.id && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-3 border-t border-gray-100 bg-gray-50/50">
              {report.notes && (
                <p className="text-sm text-gray-600 mb-3 bg-white rounded-xl px-3 py-2 border border-gray-100">
                  <span className="font-semibold text-gray-800">Notes: </span>{report.notes}
                </p>
              )}
              {report.tasks?.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Tasks ({report.tasks.length})
                  </p>
                  {report.tasks.map((task: any) => {
                    const isEditing = editingTask?.id === task.id;
                    return (
                      <div key={task.id} className="flex items-start justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-sm gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900">
                            {task.job}
                            {task.ai_assisted && (
                              <span className="inline-flex items-center text-[10px] bg-violet-100 text-violet-600 rounded-full px-1.5 py-0.5 font-semibold ml-2">
                                🤖 AI
                              </span>
                            )}
                          </p>
                          {task.action_plan && <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{task.action_plan}</p>}
                          {task.remarks && <p className="text-xs text-gray-400 mt-0.5 italic">{task.remarks}</p>}
                        </div>
                        {isEditing ? (
                          <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                            <select
                              value={editingTask?.priority ?? 'Medium'}
                              onChange={e => setEditingTask(prev => prev ? { ...prev, priority: e.target.value } : prev)}
                              className="text-xs border border-gray-200 rounded-lg px-1.5 py-1"
                            >
                              {['High', 'Medium', 'Low'].map(p => <option key={p}>{p}</option>)}
                            </select>
                            <select
                              value={editingTask?.status ?? 'Pending'}
                              onChange={e => setEditingTask(prev => prev ? { ...prev, status: e.target.value } : prev)}
                              className="text-xs border border-gray-200 rounded-lg px-1.5 py-1"
                            >
                              {['Pending', 'In Progress', 'Completed'].map(s => <option key={s}>{s}</option>)}
                            </select>
                            <button onClick={() => saveTaskEdit(report.id)} disabled={savingTask}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-40">
                              <Check className="w-4 h-4" />
                            </button>
                            <button onClick={() => setEditingTask(null)} className="p-1.5 text-gray-400 hover:bg-gray-50 rounded-lg">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-lg ${PRIORITY_COLORS[task.priority] || 'bg-gray-100 text-gray-600'}`}>
                              {task.priority}
                            </span>
                            <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-lg ${STATUS_COLORS[task.status] || 'bg-gray-100 text-gray-600'}`}>
                              {task.status}
                            </span>
                            {isCEO && (
                              <button
                                onClick={e => { e.stopPropagation(); setEditingTask({ id: task.id, status: task.status, priority: task.priority }); }}
                                className="p-1.5 text-blue-400 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit task"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No tasks logged for this report.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  // ── Summary stats ──────────────────────────────────────────────────────────
  const stats = {
    total: filtered.length,
    submitted: filtered.filter(r => r.is_submitted).length,
    approved: filtered.filter(r => r.approval).length,
    draft: filtered.filter(r => !r.is_submitted).length,
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Report History</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {canFilter ? 'All employee reports — filter by user, date, and status.' : 'View and filter your past daily work reports.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search reports..."
              className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary text-sm w-52 shadow-sm"
            />
          </div>
          {/* Toggle filters */}
          <button
            onClick={() => setFiltersOpen(v => !v)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors shadow-sm ${filtersOpen ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {hasActiveFilters && <span className="w-2 h-2 bg-red-400 rounded-full" />}
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-500 text-sm hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors shadow-sm"
              title="Clear all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Advanced Filter Panel ─────────────────────────────────────────── */}
      <AnimatePresence>
        {filtersOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
              {/* Row 1: Employee + Date range */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {canFilter && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      <Users className="w-3.5 h-3.5 inline mr-1" />Employee
                    </label>
                    <select
                      value={selectedUserId}
                      onChange={e => setSelectedUserId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-primary bg-white"
                    >
                      <option value="">All Employees</option>
                      {employees.map(e => (
                        <option key={e.id} value={e.id}>{e.full_name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    <Calendar className="w-3.5 h-3.5 inline mr-1" />From Date
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={e => { setDateFrom(e.target.value); setActivePreset(''); }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    <Calendar className="w-3.5 h-3.5 inline mr-1" />To Date
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={e => { setDateTo(e.target.value); setActivePreset(''); }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              {/* Row 2: Quick date presets */}
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-gray-400 font-medium self-center mr-1">Quick:</span>
                {DATE_PRESETS.map(p => (
                  <button
                    key={p.label}
                    onClick={() => applyPreset(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${activePreset === p.label
                      ? 'bg-primary text-white border-primary'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Row 3: Status tabs */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Status</label>
                <div className="flex flex-wrap gap-2">
                  {STATUS_TABS.map(tab => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setStatusFilter(tab.key)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${statusFilter === tab.key
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Active filter chips ───────────────────────────────────────────── */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-gray-400 font-medium">Active filters:</span>
          {selectedUserId && employees.find(e => e.id === +selectedUserId) && (
            <span className="flex items-center gap-1 px-2.5 py-1 bg-violet-50 text-violet-700 border border-violet-200 rounded-full text-xs font-medium">
              <User className="w-3 h-3" />
              {employees.find(e => e.id === +selectedUserId)?.full_name}
              <button onClick={() => setSelectedUserId('')} className="ml-0.5 hover:text-violet-900"><X className="w-3 h-3" /></button>
            </span>
          )}
          {(dateFrom || dateTo) && (
            <span className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-medium">
              <Calendar className="w-3 h-3" />
              {dateFrom || '...'} → {dateTo || '...'}
              <button onClick={() => { setDateFrom(''); setDateTo(''); setActivePreset(''); }} className="ml-0.5 hover:text-blue-900"><X className="w-3 h-3" /></button>
            </span>
          )}
          {statusFilter && (
            <span className="flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-medium">
              {STATUS_TABS.find(t => t.key === statusFilter)?.label}
              <button onClick={() => setStatusFilter('')} className="ml-0.5 hover:text-green-900"><X className="w-3 h-3" /></button>
            </span>
          )}
          {search && (
            <span className="flex items-center gap-1 px-2.5 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded-full text-xs font-medium">
              <Search className="w-3 h-3" />"{search}"
              <button onClick={() => setSearch('')} className="ml-0.5 hover:text-orange-900"><X className="w-3 h-3" /></button>
            </span>
          )}
        </div>
      )}

      {/* ── Summary Stats ─────────────────────────────────────────────────── */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Reports', value: stats.total, color: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-200' },
            { label: 'Submitted', value: stats.submitted, color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
            { label: 'Approved', value: stats.approved, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
            { label: 'Draft', value: stats.draft, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} border ${s.border} rounded-xl p-3 flex items-center justify-between`}>
              <p className="text-xs text-gray-500 font-medium">{s.label}</p>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Reports List ──────────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 bg-white border border-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-gray-200 rounded-2xl">
          <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No reports found</p>
          <p className="text-gray-400 text-sm mt-1">
            {hasActiveFilters ? 'Try adjusting your filters.' : 'No reports have been created yet.'}
          </p>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="mt-3 text-primary text-sm font-medium hover:underline">
              Clear all filters
            </button>
          )}
        </div>
      ) : groupedByUser ? (
        /* ── Grouped by user (CEO/manager without single-user filter) ──── */
        <div className="space-y-6">
          {groupedByUser.map(group => (
            <div key={group.userName}>
              {/* User group header */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                  {group.userName.charAt(0).toUpperCase()}
                </div>
                <h3 className="font-bold text-gray-800 text-sm">{group.userName}</h3>
                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full font-medium">
                  {group.reports.length} report{group.reports.length !== 1 ? 's' : ''}
                </span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
              <div className="space-y-2 pl-4 border-l-2 border-gray-100">
                {group.reports.map((r, i) => renderReportCard(r, i))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── Flat list (employee view or single-user filter) ─────────── */
        <div className="space-y-2">
          {filtered.map((r, i) => renderReportCard(r, i))}
        </div>
      )}
    </div>
  );
}
