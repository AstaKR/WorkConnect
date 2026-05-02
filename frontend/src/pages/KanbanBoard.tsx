import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Clock, AlertCircle, CheckCircle2, Loader2, Calendar,
  ChevronLeft, ChevronRight, GripVertical, Filter, X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { format, subDays, addDays, startOfWeek, endOfWeek, isToday, parseISO } from 'date-fns';

type Status = 'Pending' | 'In Progress' | 'Completed';
interface Task { id: number; job: string; priority: string; status: Status; action_plan?: string; report_date?: string; }

const COLUMNS: { id: Status; label: string; color: string; headerColor: string; icon: React.ReactNode }[] = [
  { id: 'Pending',     label: 'Pending',     color: 'bg-gray-50 border-gray-200',   headerColor: 'text-gray-600',   icon: <Clock className="w-4 h-4 text-gray-400" /> },
  { id: 'In Progress', label: 'In Progress', color: 'bg-blue-50 border-blue-200',   headerColor: 'text-blue-700',   icon: <AlertCircle className="w-4 h-4 text-blue-500" /> },
  { id: 'Completed',   label: 'Completed',   color: 'bg-green-50 border-green-200', headerColor: 'text-green-700',  icon: <CheckCircle2 className="w-4 h-4 text-green-500" /> },
];

const PRIORITY_COLORS: Record<string, string> = {
  High: 'bg-red-100 text-red-700 border-red-200',
  Medium: 'bg-orange-100 text-orange-700 border-orange-200',
  Low: 'bg-green-100 text-green-700 border-green-200',
};

const PRESETS = [
  { label: 'Today',      getValue: () => ({ from: format(new Date(), 'yyyy-MM-dd'), to: format(new Date(), 'yyyy-MM-dd') }) },
  { label: 'Yesterday', getValue: () => { const d = subDays(new Date(), 1); const s = format(d, 'yyyy-MM-dd'); return { from: s, to: s }; } },
  { label: 'This Week',  getValue: () => ({ from: format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'), to: format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd') }) },
  { label: 'Last 7 Days',getValue: () => ({ from: format(subDays(new Date(), 6), 'yyyy-MM-dd'), to: format(new Date(), 'yyyy-MM-dd') }) },
  { label: 'Last 30 Days',getValue: () => ({ from: format(subDays(new Date(), 29), 'yyyy-MM-dd'), to: format(new Date(), 'yyyy-MM-dd') }) },
];

function TaskCard({ task, overlay = false, reportId, onStatusChange }: { task: Task; overlay?: boolean; reportId?: number | null; onStatusChange?: (id: number, status: Status) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  return (
    <div ref={setNodeRef} style={style}
      className={`bg-white rounded-xl border border-gray-100 p-3.5 shadow-sm hover:shadow-md transition-all ${overlay ? 'rotate-2 shadow-xl scale-105' : ''}`}>
      <div className="flex items-start gap-2">
        <div {...attributes} {...listeners} className="mt-0.5 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing flex-shrink-0">
          <GripVertical className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 leading-snug">{task.job || 'Untitled task'}</p>
          {task.action_plan && <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">{task.action_plan}</p>}
          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${PRIORITY_COLORS[task.priority] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
              {task.priority}
            </span>
            {task.report_date && (
              <span className="px-2 py-0.5 rounded-full text-xs text-gray-400 bg-gray-50 border border-gray-100">
                {format(parseISO(task.report_date), 'MMM d')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Column({ status, tasks, reportId, onStatusChange }: { status: typeof COLUMNS[number]; tasks: Task[]; reportId: number | null; onStatusChange: (id: number, s: Status) => void }) {
  return (
    <div className={`rounded-2xl border p-4 min-h-[400px] flex flex-col ${status.color}`}>
      <div className="flex items-center gap-2 mb-4">
        {status.icon}
        <h3 className={`font-bold text-sm ${status.headerColor}`}>{status.label}</h3>
        <span className="ml-auto bg-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold text-gray-600 shadow-sm border border-gray-100">
          {tasks.length}
        </span>
      </div>
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 flex-1">
          {tasks.map(task => <TaskCard key={task.id} task={task} reportId={reportId} onStatusChange={onStatusChange} />)}
          {tasks.length === 0 && (
            <div className="flex-1 flex items-center justify-center py-10 border-2 border-dashed border-gray-200/70 rounded-xl mt-2">
              <p className="text-xs text-gray-300 text-center">No tasks here.<br />Drag tasks from other columns.</p>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export default function KanbanBoard() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [activePreset, setActivePreset] = useState('Today');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reportId, setReportId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);
  const [showFilter, setShowFilter] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const fetchTasks = useCallback(async (from: string, to: string) => {
    setLoading(true);
    try {
      if (from === to) {
        // Single date: use date endpoint
        const res = await api.get(`/reports/date/${from}/`);
        const data = res.data.data;
        setReportId(data.id);
        setTasks((data.tasks || []).map((t: Task) => ({ ...t, report_date: from })));
      } else {
        // Date range: fetch each date's report and aggregate tasks
        const allTasks: Task[] = [];
        let firstReportId: number | null = null;
        const start = new Date(from + 'T00:00:00');
        const end = new Date(to + 'T00:00:00');
        const dates: string[] = [];
        for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
          dates.push(format(d, 'yyyy-MM-dd'));
        }
        // Fetch all in parallel
        const results = await Promise.all(
          dates.map(d => api.get(`/reports/date/${d}/`).catch(() => null))
        );
        results.forEach((res, i) => {
          if (res?.data?.data) {
            const rpt = res.data.data;
            if (!firstReportId) firstReportId = rpt.id;
            (rpt.tasks || []).forEach((t: Task) => {
              allTasks.push({ ...t, report_date: dates[i] });
            });
          }
        });
        setReportId(firstReportId);
        setTasks(allTasks);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(dateFrom, dateTo); }, [dateFrom, dateTo]);

  const applyPreset = (preset: typeof PRESETS[0]) => {
    const { from, to } = preset.getValue();
    setDateFrom(from); setDateTo(to); setActivePreset(preset.label);
  };

  const handleDragStart = ({ active }: any) => setActiveTask(tasks.find(t => t.id === active.id) || null);

  const handleDragEnd = async ({ active, over }: any) => {
    setActiveTask(null);
    if (!over) return;
    const task = tasks.find(t => t.id === active.id);
    if (!task) return;
    let newStatus: Status = task.status;
    if (typeof over.id === 'string' && COLUMNS.find(c => c.id === over.id)) {
      newStatus = over.id as Status;
    } else {
      const overTask = tasks.find(t => t.id === over.id);
      if (overTask) newStatus = overTask.status;
    }
    if (newStatus === task.status) return;

    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    setUpdating(task.id);
    try {
      // Find the correct reportId for this task's date
      let rptId = reportId;
      if (task.report_date && task.report_date !== dateFrom) {
        const res = await api.get(`/reports/date/${task.report_date}/`);
        rptId = res.data.data.id;
      }
      if (rptId) await api.patch(`/reports/${rptId}/tasks/${task.id}/`, { status: newStatus });
    } catch {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: task.status } : t));
    } finally { setUpdating(null); }
  };

  const tasksByStatus = (status: Status) => tasks.filter(t => t.status === status);
  const isSingleDay = dateFrom === dateTo;
  const isRangeToday = dateFrom === today && dateTo === today;

  const displayLabel = isSingleDay
    ? (isToday(new Date(dateFrom + 'T00:00:00')) ? 'Today' : format(new Date(dateFrom + 'T00:00:00'), 'MMM d, yyyy'))
    : `${format(new Date(dateFrom + 'T00:00:00'), 'MMM d')} – ${format(new Date(dateTo + 'T00:00:00'), 'MMM d, yyyy')}`;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kanban Board</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Showing <strong>{tasks.length}</strong> task{tasks.length !== 1 ? 's' : ''} for <strong>{displayLabel}</strong>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {updating && <span className="flex items-center gap-1.5 text-sm text-gray-400"><Loader2 className="w-4 h-4 animate-spin" /> Saving...</span>}
          <Link to="/employee/report">
            <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-accent text-white rounded-xl text-sm font-medium shadow-md hover:shadow-lg transition-all">
              Open Work Report
            </button>
          </Link>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
        {/* Preset buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-1">Quick:</span>
          {PRESETS.map(p => (
            <button key={p.label} onClick={() => applyPreset(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                activePreset === p.label ? 'bg-primary text-white border-primary shadow-sm' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}>
              {p.label}
            </button>
          ))}
          <button onClick={() => setShowFilter(v => !v)}
            className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${showFilter ? 'bg-primary/10 text-primary border-primary/20' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}>
            <Filter className="w-3.5 h-3.5" /> Custom Range
          </button>
        </div>

        {/* Custom range pickers */}
        {showFilter && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap items-end gap-4 pt-2 border-t border-gray-100">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">From Date</label>
              <input type="date" value={dateFrom} max={dateTo}
                onChange={e => { setDateFrom(e.target.value); setActivePreset(''); }}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">To Date</label>
              <input type="date" value={dateTo} min={dateFrom} max={today}
                onChange={e => { setDateTo(e.target.value); setActivePreset(''); }}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary" />
            </div>
            <button onClick={() => { setDateFrom(today); setDateTo(today); setActivePreset('Today'); setShowFilter(false); }}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-500 transition-colors mb-2">
              <X className="w-3.5 h-3.5" /> Reset
            </button>
          </motion.div>
        )}

        {/* Date nav arrows (single day mode) */}
        {isSingleDay && (
          <div className="flex items-center gap-2 border-t border-gray-100 pt-3">
            <button onClick={() => { const d = format(subDays(new Date(dateFrom + 'T00:00:00'), 1), 'yyyy-MM-dd'); setDateFrom(d); setDateTo(d); setActivePreset(''); }}
              className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center border border-gray-200 transition-colors">
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            </button>
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Calendar className="w-4 h-4 text-primary" />
              {displayLabel}
            </div>
            <button onClick={() => { const d = format(addDays(new Date(dateFrom + 'T00:00:00'), 1), 'yyyy-MM-dd'); if (d <= today) { setDateFrom(d); setDateTo(d); setActivePreset(''); } }}
              disabled={dateFrom >= today}
              className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center border border-gray-200 transition-colors disabled:opacity-40">
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        )}
      </div>

      {/* Kanban columns */}
      {loading ? (
        <div className="grid grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-96 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : tasks.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center">
          <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium mb-1">No tasks found for {displayLabel}</p>
          <p className="text-gray-400 text-sm mb-4">Try a different date or add tasks in Work Report</p>
          <Link to="/employee/report" className="text-primary font-medium hover:text-accent transition-colors text-sm">
            Open Work Report →
          </Link>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {COLUMNS.map(col => (
              <Column key={col.id} status={col} tasks={tasksByStatus(col.id)} reportId={reportId} onStatusChange={() => {}} />
            ))}
          </div>
          <DragOverlay>
            {activeTask && <TaskCard task={activeTask} overlay />}
          </DragOverlay>
        </DndContext>
      )}

      {/* Summary bar */}
      {tasks.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap items-center gap-6 text-sm">
          <span className="font-bold text-gray-800">Summary:</span>
          <span className="flex items-center gap-1.5 text-gray-500"><Clock className="w-4 h-4 text-gray-400" />{tasksByStatus('Pending').length} Pending</span>
          <span className="flex items-center gap-1.5 text-blue-600"><AlertCircle className="w-4 h-4" />{tasksByStatus('In Progress').length} In Progress</span>
          <span className="flex items-center gap-1.5 text-green-600"><CheckCircle2 className="w-4 h-4" />{tasksByStatus('Completed').length} Completed</span>
          <span className="ml-auto font-semibold text-green-600">
            {tasks.length > 0 ? Math.round((tasksByStatus('Completed').length / tasks.length) * 100) : 0}% Complete
          </span>
        </div>
      )}
    </div>
  );
}
