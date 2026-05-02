import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ChevronLeft, ChevronRight, Calendar, Send, Save, Download, Upload,
  Plus, Trash2, GripVertical, Check, X, FileText, ChevronDown,
  AlertCircle, Clock, Loader2, Wand2, RotateCcw, Printer,
  CheckCircle2, Circle, TrendingUp,
} from 'lucide-react';
import {
  format, isToday, isFuture, isPast, parseISO, addDays, subDays,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  isSameMonth, isSameDay, addMonths, subMonths,
} from 'date-fns';
import api from '../api/axios';
import { useAuthStore } from '../store/useAuthStore';
import PlaceSelector from '../components/PlaceSelector';
import AIAssistButton from '../components/AIAssistButton';
import AIFloatingPanel from '../components/AIFloatingPanel';
import { aiSpellCheck, aiSentenceMaker, aiActionPlan, aiDetectPriority } from '../api/ai';

// ─── DatePickerCalendar ───────────────────────────────────────────────────────
interface DatePickerCalendarProps {
  selectedDate: Date;
  onSelect: (d: Date) => void;
  onClose: () => void;
}

function DatePickerCalendar({ selectedDate, onSelect, onClose }: DatePickerCalendarProps) {
  const [viewMonth, setViewMonth] = useState<Date>(startOfMonth(selectedDate));
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 1 }),
  });

  const weekDays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  const handleSelect = (d: Date) => {
    onSelect(d);
    onClose();
  };

  return (
    <div
      ref={containerRef}
      className="absolute top-full left-0 mt-2 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 w-72 select-none"
      style={{ minWidth: 280 }}
      onClick={e => e.stopPropagation()}
    >
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setViewMonth(m => subMonths(m, 1))}
          className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-center">
          <p className="font-bold text-gray-900 text-sm">{format(viewMonth, 'MMMM yyyy')}</p>
        </div>
        <button
          onClick={() => setViewMonth(m => addMonths(m, 1))}
          className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {weekDays.map(d => (
          <div key={d} className="text-center text-[11px] font-bold text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {days.map(day => {
          const isCurrentMonth = isSameMonth(day, viewMonth);
          const isSelected = isSameDay(day, selectedDate);
          const isThisToday = isToday(day);

          return (
            <button
              key={day.toISOString()}
              onClick={() => handleSelect(day)}
              className={`
                h-9 w-9 mx-auto rounded-xl text-sm font-medium transition-all
                ${isSelected
                  ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-200 scale-105'
                  : isThisToday
                  ? 'bg-blue-50 text-blue-600 font-bold ring-1 ring-blue-300 hover:bg-blue-100'
                  : isCurrentMonth
                  ? 'text-gray-700 hover:bg-gray-100'
                  : 'text-gray-300 hover:bg-gray-50'
                }
              `}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
        <button
          onClick={() => handleSelect(new Date())}
          className="text-xs text-blue-600 font-semibold hover:text-blue-800 transition-colors px-2 py-1 rounded-lg hover:bg-blue-50"
        >
          Go to Today
        </button>
        <button
          onClick={onClose}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Task {
  id: number; job: string; priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'In Progress' | 'Completed';
  action_plan: string; order: number; _new?: boolean;
  place_of_work?: string;
  _localId?: number; // stable key for React that never changes even when real ID assigned
  remarks: string;
  ai_enabled: boolean;
  ai_assisted: boolean;
}
interface Report {
  id: number; date: string; place_of_work: string; notes: string;
  is_submitted: boolean; submitted_at: string | null;
  tasks: Task[]; approval: any;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const PRIORITY_META = {
  High:   { bg: 'bg-red-500',    light: 'bg-red-50',    text: 'text-red-700',    border: 'border-l-red-400' },
  Medium: { bg: 'bg-amber-400',  light: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-l-amber-400' },
  Low:    { bg: 'bg-emerald-400',light: 'bg-emerald-50',text: 'text-emerald-700',border: 'border-l-emerald-400' },
};
const STATUS_META = {
  Pending:      { icon: <Circle className="w-3.5 h-3.5" />,      color: 'text-gray-400',   bg: 'bg-gray-100' },
  'In Progress':{ icon: <Clock className="w-3.5 h-3.5" />,        color: 'text-blue-500',   bg: 'bg-blue-50' },
  Completed:    { icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: 'text-emerald-500',bg: 'bg-emerald-50' },
};
const PLACE_OPTIONS = ['Corporate Office', 'Work From Home', 'Field Work', 'On Leave', 'Holiday'];

// ─── Progress Ring ────────────────────────────────────────────────────────────
function ProgressRing({ pct, size = 120 }: { pct: number; size?: number }) {
  const r = size * 0.38, cx = size / 2, strokeW = size * 0.07;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const color = pct === 100 ? '#10B981' : pct >= 60 ? '#3B82F6' : pct >= 30 ? '#F59E0B' : '#EF4444';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={color + 'aa'} />
        </linearGradient>
      </defs>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="#E5E7EB" strokeWidth={strokeW} />
      <motion.circle cx={cx} cy={cx} r={r} fill="none" stroke="url(#ring-grad)" strokeWidth={strokeW}
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        transform={`rotate(-90 ${cx} ${cx})`} />
      <text x={cx} y={cx - 2} textAnchor="middle" dominantBaseline="middle"
        fontSize={size * 0.18} fontWeight="700" fill="#111827">{pct}%</text>
      <text x={cx} y={cx + size * 0.14} textAnchor="middle" dominantBaseline="middle"
        fontSize={size * 0.085} fill="#6B7280">done</text>
    </svg>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error' | 'info'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  const colors = { success: 'bg-emerald-600', error: 'bg-red-500', info: 'bg-blue-600' };
  return (
    <motion.div initial={{ opacity: 0, y: 40, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: 40, x: '-50%' }}
      className={`fixed bottom-6 left-1/2 z-[100] flex items-center gap-3 px-5 py-3 rounded-2xl text-white text-sm font-medium shadow-2xl ${colors[type]}`}>
      {type === 'success' ? <Check className="w-4 h-4" /> : type === 'error' ? <X className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      {msg}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><X className="w-3.5 h-3.5" /></button>
    </motion.div>
  );
}

// ─── Task Card ────────────────────────────────────────────────────────────────
function TaskCard({ task, onUpdate, onDelete, onToggle, selected, onSelect, readOnly, onToggleAI }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task._localId ?? task.id });
  const [expanded, setExpanded] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const statusRef = React.useRef<HTMLDivElement>(null);
  const pm = PRIORITY_META[task.priority as keyof typeof PRIORITY_META] || PRIORITY_META.Medium;
  const sm = STATUS_META[task.status as keyof typeof STATUS_META] || STATUS_META.Pending;

  // Close status dropdown when clicking outside
  React.useEffect(() => {
    if (!statusOpen) return;
    const handler = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setStatusOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [statusOpen]);

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 }}
      className={`group bg-white rounded-2xl border-l-4 shadow-sm hover:shadow-md transition-all ${pm.border} ${selected ? 'ring-2 ring-primary/30' : ''} ${task.status === 'Completed' ? 'opacity-75' : ''}`}>
      <div className="flex items-start gap-3 p-4">
        {/* Drag handle */}
        {!readOnly && (
          <div {...attributes} {...listeners} className="mt-0.5 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing flex-shrink-0 pt-0.5">
            <GripVertical className="w-4 h-4" />
          </div>
        )}
        {/* Checkbox */}
        <button onClick={() => onToggle(task.id)}
          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
            task.status === 'Completed' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 hover:border-emerald-400'
          }`}>
          {task.status === 'Completed' && <Check className="w-3 h-3" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <p onClick={() => !readOnly && setExpanded(!expanded)} 
              className={`font-semibold text-sm flex-1 cursor-pointer hover:text-primary transition-colors ${task.status === 'Completed' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
              {task.job || <span className="italic text-gray-400">Untitled task (click to edit)</span>}
            </p>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Priority badge */}
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${pm.light} ${pm.text}`}>{task.priority}</span>
              {/* Status pill */}
              {!readOnly ? (
                <div ref={statusRef} className="relative">
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); setStatusOpen(v => !v); }}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sm.bg} ${sm.color} border border-current/10`}>
                    {sm.icon}<span className="hidden sm:inline">{task.status}</span><ChevronDown className="w-3 h-3" />
                  </button>
                  {statusOpen && (
                    <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 z-[50] min-w-[150px]">
                      {(['Pending', 'In Progress', 'Completed'] as const).map(s => (
                        <button key={s} type="button"
                          onClick={e => { e.stopPropagation(); onUpdate(task.id, 'status', s); setStatusOpen(false); }}
                          className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl ${task.status === s ? 'font-bold text-primary bg-primary/5' : 'text-gray-700'}`}>
                          {STATUS_META[s].icon}<span>{s}</span>
                          {task.status === s && <Check className="w-3 h-3 ml-auto text-primary" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sm.bg} ${sm.color}`}>
                  {sm.icon}{task.status}
                </span>
              )}
              {/* AI Toggle */}
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => onToggleAI?.(task.id, task._localId, task.ai_enabled)}
                  title={task.ai_enabled ? 'Disable AI for this task' : 'Enable AI for this task'}
                  className={`shrink-0 p-1 rounded-lg transition-colors ${
                    task.ai_enabled ? 'bg-violet-100 text-violet-600' : 'text-gray-300 hover:text-gray-500'
                  }`}
                >
                  <span className="text-base leading-none">🤖</span>
                </button>
              )}

              {/* AI Inline Buttons */}
              {!readOnly && task.ai_enabled && (
                <div className="flex items-center gap-1 shrink-0">
                  <AIAssistButton
                    feature="spell_check"
                    disabled={!task.job.trim()}
                    onCall={async () => {
                      const res = await aiSpellCheck(task.job, task._new ? undefined : task.id);
                      if (res.data.success) {
                        onUpdate(task.id, 'job', res.data.data.corrected);
                        onUpdate(task.id, 'ai_assisted', true);
                      }
                    }}
                  />
                  <AIAssistButton
                    feature="action_plan"
                    disabled={!task.job.trim()}
                    onCall={async () => {
                      const res = await aiActionPlan(task.job, task._new ? undefined : task.id);
                      if (res.data.success) {
                        onUpdate(task.id, 'action_plan', res.data.data.action_plan);
                        onUpdate(task.id, 'ai_assisted', true);
                      }
                    }}
                  />
                  <AIAssistButton
                    feature="detect_priority"
                    disabled={!task.job.trim()}
                    onCall={async () => {
                      const res = await aiDetectPriority(task.job, task._new ? undefined : task.id);
                      if (res.data.success) {
                        onUpdate(task.id, 'priority', res.data.data.priority);
                        onUpdate(task.id, 'ai_assisted', true);
                      }
                    }}
                  />
                </div>
              )}

              {/* AI-assisted badge */}
              {task.ai_assisted && (
                <span className="shrink-0 text-[10px] bg-violet-100 text-violet-600 rounded-full px-1.5 py-0.5 font-semibold">
                  🤖 AI
                </span>
              )}
            </div>
          </div>

          {task.action_plan && (
            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed line-clamp-2">{task.action_plan}</p>
          )}

          {task.place_of_work && (
            <span className="inline-flex items-center gap-1 mt-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
              📍 {task.place_of_work}
            </span>
          )}

          {!readOnly && (
            <button onClick={() => setExpanded(!expanded)} className="text-xs text-primary mt-1.5 hover:underline">
              {expanded ? 'Less ▲' : 'Edit details ▼'}
            </button>
          )}

          {expanded && !readOnly && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} style={{ overflow: 'visible' }} className="mt-3 space-y-2">
              <input value={task.job} onChange={e => onUpdate(task.id, 'job', e.target.value)}
                placeholder="Task description" className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary" />
              <textarea value={task.action_plan || ''} onChange={e => onUpdate(task.id, 'action_plan', e.target.value)}
                placeholder="Action plan / notes..." rows={2}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary resize-none" />
              {/* Task-level location */}
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">📍 Task Location</p>
                <PlaceSelector
                  value={task.place_of_work || ''}
                  onChange={val => onUpdate(task.id, 'place_of_work', val)}
                />
              </div>
              <div className="flex gap-2">
                {(['High', 'Medium', 'Low'] as const).map(p => (
                  <button key={p} onClick={() => onUpdate(task.id, 'priority', p)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${task.priority === p ? `${PRIORITY_META[p].bg} text-white border-transparent` : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                    {p}
                  </button>
                ))}
              </div>
              {/* Remarks */}
              <div className="relative">
                <label className="text-xs font-medium text-gray-500 mb-1 block">Remarks</label>
                <div className="flex gap-2 items-start">
                  <textarea
                    value={task.remarks || ''}
                    onChange={e => onUpdate(task.id, 'remarks', e.target.value)}
                    placeholder="Add remarks or notes..."
                    rows={2}
                    className="flex-1 text-sm border border-gray-200 rounded-xl p-2 resize-none focus:ring-violet-300 focus:border-violet-400"
                  />
                  {task.ai_enabled && (
                    <AIAssistButton
                      feature="sentence_maker"
                      size="xs"
                      disabled={!(task.remarks || '').trim()}
                      onCall={async () => {
                        const res = await aiSentenceMaker(task.remarks || '', task._new ? undefined : task.id);
                        if (res.data.success) {
                          onUpdate(task.id, 'remarks', res.data.data.improved);
                          onUpdate(task.id, 'ai_assisted', true);
                        }
                      }}
                    />
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Delete */}
        {!readOnly && (
          <button onClick={() => onDelete(task.id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-500 transition-all flex-shrink-0">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Import Modal ─────────────────────────────────────────────────────────────
function ImportModal({ onImport, onClose }: { onImport: (csv: string) => void; onClose: () => void }) {
  const [tab, setTab] = useState<'paste' | 'upload'>('paste');
  const [csv, setCsv] = useState('');
  const [preview, setPreview] = useState<string[][]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const TEMPLATE = `task,priority,status,action_plan\nDesign login page,High,In Progress,Create wireframes and mockups\nWrite unit tests,Medium,Pending,Cover auth module\nCode review,Low,Completed,Review PR #45`;

  const parsePreview = (text: string) => {
    const lines = text.trim().split('\n').slice(0, 6);
    setPreview(lines.map(l => l.split(',')));
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { const text = ev.target?.result as string; setCsv(text); parsePreview(text); };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-gray-900">Import Tasks</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex border-b border-gray-100">
          {(['paste', 'upload'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-medium transition-colors capitalize ${tab === t ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'}`}>
              {t === 'paste' ? 'Paste CSV' : 'Upload File'}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-4">
          {tab === 'paste' ? (
            <>
              <div className="bg-gray-50 rounded-xl p-3 text-xs font-mono text-gray-600 border border-gray-100">
                <p className="text-xs text-gray-400 mb-1 font-sans font-medium">Required format (CSV):</p>
                <p>task, priority, status, action_plan</p>
                <p className="text-gray-400 mt-1">Priorities: High | Medium | Low</p>
                <p className="text-gray-400">Status: Pending | In Progress | Completed</p>
              </div>
              <textarea value={csv} onChange={e => { setCsv(e.target.value); parsePreview(e.target.value); }}
                rows={6} placeholder="task,priority,status,action_plan&#10;Review sprint plan,High,Pending,Check all tasks before standup"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:ring-2 focus:ring-primary resize-none" />
              <button onClick={() => { setCsv(TEMPLATE); parsePreview(TEMPLATE); }}
                className="text-xs text-primary hover:underline">Load example template</button>
            </>
          ) : (
            <div onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center cursor-pointer hover:border-primary/50 hover:bg-blue-50/30 transition-colors">
              <Upload className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-600">Click to upload CSV file</p>
              <p className="text-xs text-gray-400 mt-1">Supported: .csv · Max 5MB</p>
              <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFile} />
            </div>
          )}

          {preview.length > 1 && (
            <div className="rounded-xl border border-gray-100 overflow-hidden text-xs">
              <p className="bg-gray-50 px-3 py-2 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Preview ({preview.length - 1} tasks)</p>
              <table className="w-full">
                <thead><tr className="border-b border-gray-100">{preview[0].map((h, i) => <th key={i} className="px-3 py-2 text-left text-gray-400 font-medium capitalize">{h.trim()}</th>)}</tr></thead>
                <tbody>{preview.slice(1).map((row, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0">
                    {row.map((cell, j) => <td key={j} className="px-3 py-2 text-gray-700 truncate max-w-[120px]">{cell.trim()}</td>)}
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">Cancel</button>
          <button disabled={!csv.trim()} onClick={() => onImport(csv)}
            className="px-5 py-2 text-sm bg-gradient-to-r from-primary to-accent text-white rounded-xl font-medium disabled:opacity-40 hover:shadow-md transition-all flex items-center gap-2">
            <Upload className="w-4 h-4" /> Import Tasks
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ERPlan() {
  const { user } = useAuthStore();
  const [date, setDate] = useState(new Date());
  const [report, setReport] = useState<Report | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'All' | 'Pending' | 'In Progress' | 'Completed'>('All');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showImport, setShowImport] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [placeOfWork, setPlaceOfWork] = useState('Corporate Office');
  const [notes, setNotes] = useState('');
  const [notesOpen, setNotesOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Refs to always access the latest state inside async callbacks / timers
  const tasksRef = useRef<Task[]>([]);
  const placeOfWorkRef = useRef('Corporate Office');
  const notesRef = useRef('');

  // Keep refs in sync with state on every render
  useEffect(() => { tasksRef.current = tasks; }, [tasks]);
  useEffect(() => { placeOfWorkRef.current = placeOfWork; }, [placeOfWork]);
  useEffect(() => { notesRef.current = notes; }, [notes]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'success') => setToast({ msg, type }), []);
  const dateStr = format(date, 'yyyy-MM-dd');
  const readOnly = report?.is_submitted || false;

  // ── Fetch report for selected date ──────────────────────────────────────
  const fetchReport = useCallback(async (d: Date) => {
    setLoading(true);
    setSelectedIds(new Set());
    try {
      const ds = format(d, 'yyyy-MM-dd');
      const res = await api.get(`/reports/date/${ds}/`);
      const data: Report = res.data.data;
      setReport(data);
      // Assign stable _localId to each task loaded from server; default new fields
      setTasks((data.tasks || []).map((t: Task) => ({
        remarks: '',
        ai_enabled: false,
        ai_assisted: false,
        ...t,
        _localId: t.id,
      })));
      setPlaceOfWork(data.place_of_work || 'Corporate Office');
      setNotes(data.notes || '');
    } catch (err: any) {
      showToast('Failed to load report for this date', 'error');
    } finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { fetchReport(date); }, [date]);

  // ── Shared task flush — single bulk request for speed ──────────────────
  const flushTasks = useCallback(async (reportId: number, currentTasks: Task[]): Promise<{ localId: number; serverId: number }[]> => {
    // Validate: skip completely empty tasks
    const emptyTasks = currentTasks.filter(t => !t.job.trim());
    if (emptyTasks.length > 0) {
      showToast(`⚠️ ${emptyTasks.length} task(s) have no description and will be skipped.`, 'error');
    }
    const tasksToSave = currentTasks.filter(t => t.job.trim());
    const res = await api.post(`/reports/${reportId}/save_tasks/`, { tasks: tasksToSave });
    if (res.data.success) {
      const serverTasks: Task[] = res.data.data;
      // Return ONLY id mappings so callers can update IDs without touching content
      return currentTasks
        .filter(t => t._new && t._localId)
        .map(local => {
          const server = serverTasks.find(s => s.job === local.job);
          return server ? { localId: local._localId!, serverId: server.id } : null;
        })
        .filter(Boolean) as { localId: number; serverId: number }[];
    }
    return [];
  }, [showToast]);

  // ── Auto-save 1.5s after last change ────────────────────────────────────
  // Uses refs so the timer always reads the LATEST state, not a stale closure.
  // IMPORTANT: after flush we only patch _new→false and update IDs using a
  // functional setTasks so we never overwrite content the user typed during
  // the async round-trip.
  const triggerAutoSave = useCallback(() => {
    if (readOnly || !report) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        const latestTasks = tasksRef.current;
        const latestPlace = placeOfWorkRef.current;
        const latestNotes = notesRef.current;
        await api.patch(`/reports/${report.id}/`, { place_of_work: latestPlace, notes: latestNotes });
        const idMappings = await flushTasks(report.id, latestTasks);
        if (idMappings.length > 0) {
          // Only update IDs for tasks that were new — NEVER overwrite content
          setTasks(prev => prev.map(t => {
            if (!t._new || !t._localId) return t;
            const mapping = idMappings.find(m => m.localId === t._localId);
            return mapping ? { ...t, id: mapping.serverId, _new: false } : t;
          }));
        }
      } catch { /* silent */ }
    }, 1500);
  }, [report, readOnly, flushTasks]);

  // ── Save manually ────────────────────────────────────────────────────────
  const saveNow = async () => {
    if (!report) return;
    setSaving(true);
    try {
      await api.patch(`/reports/${report.id}/`, { place_of_work: placeOfWork, notes });
      const idMappings = await flushTasks(report.id, tasks);
      if (idMappings.length > 0) {
        setTasks(prev => prev.map(t => {
          if (!t._new || !t._localId) return t;
          const mapping = idMappings.find(m => m.localId === t._localId);
          return mapping ? { ...t, id: mapping.serverId, _new: false } : t;
        }));
      }
      showToast('Report saved successfully');
    } catch { showToast('Save failed', 'error'); }
    finally { setSaving(false); }
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const submitReport = async () => {
    if (!report || submitting) return;

    // Validate empty tasks
    const emptyTasks = tasks.filter(t => !t.job.trim());
    if (emptyTasks.length > 0) {
      showToast(`⚠️ ${emptyTasks.length} task(s) have no description. Please fill them in before submitting.`, 'error');
      return;
    }

    setSubmitting(true);
    try {
      // Single request: save details + tasks + submit atomically
      await api.post(`/reports/${report.id}/submit_all/`, {
        place_of_work: placeOfWork,
        notes,
        tasks,
      });
      setReport(r => r ? { ...r, is_submitted: true } : r);
      showToast('Report submitted successfully! 🎉');
    } catch { showToast('Submit failed', 'error'); }
    finally { setSubmitting(false); }
  };

  // ── Reopen ───────────────────────────────────────────────────────────────
  const reopenReport = async () => {
    if (!report) return;
    try {
      await api.post(`/reports/${report.id}/unsubmit/`);
      setReport(r => r ? { ...r, is_submitted: false } : r);
      showToast('Report reopened for editing', 'info');
    } catch { showToast('Failed to reopen', 'error'); }
  };

  // ── Task CRUD ────────────────────────────────────────────────────────────
  const addTask = () => {
    if (readOnly) return;
    const localId = Date.now(); // stable local key, never sent to server as real ID
    const newTask: Task = {
      id: localId,
      _localId: localId,
      job: '',
      priority: 'Medium',
      status: 'Pending',
      action_plan: '',
      order: tasks.length,
      _new: true,
      place_of_work: placeOfWork,
      remarks: '',
      ai_enabled: false,
      ai_assisted: false,
    };
    setTasks(prev => [...prev, newTask]);
  };

  const updateTask = (id: number, field: string, value: any) => {
    if (readOnly) return;
    setTasks(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
    triggerAutoSave();
  };

  const toggleAI = useCallback(async (taskId: number | undefined, localId: number | undefined, currentValue: boolean) => {
    const newValue = !currentValue;
    setTasks(prev => prev.map(t =>
      (t._localId ?? t.id) === (localId ?? taskId)
        ? { ...t, ai_enabled: newValue }
        : t
    ));
    if (taskId) {
      try {
        await api.patch(`/reports/tasks/${taskId}/`, { ai_enabled: newValue });
      } catch { /* ignore — will sync on next save */ }
    }
  }, []);

  const toggleTaskDone = (id: number) => {
    if (readOnly) return;
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: t.status === 'Completed' ? 'Pending' : 'Completed' } : t));
    triggerAutoSave();
  };

  const deleteTask = async (id: number) => {
    if (readOnly || !report) return;
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    setTasks(prev => prev.filter(t => t.id !== id));
    if (!task._new) {
      try { await api.delete(`/reports/${report.id}/tasks/${id}/`); }
      catch { setTasks(prev => [...prev, task]); showToast('Delete failed', 'error'); }
    }
  };

  const bulkDelete = async () => {
    if (!report || selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    const hadNew = ids.filter(id => tasks.find(t => t.id === id)?._new);
    setTasks(prev => prev.filter(t => !selectedIds.has(t.id)));
    setSelectedIds(new Set());
    const serverIds = ids.filter(id => !hadNew.includes(id));
    if (serverIds.length > 0) {
      try {
        await api.delete(`/reports/${report.id}/tasks/bulk`, { data: { ids: serverIds } });
        showToast(`${ids.length} tasks deleted`);
      } catch { fetchReport(date); showToast('Bulk delete failed', 'error'); }
    } else { showToast(`${ids.length} tasks deleted`); }
  };

  // ── Drag & Drop ──────────────────────────────────────────────────────────
  const handleDragEnd = async ({ active, over }: any) => {
    setActiveId(null);
    if (!over || active.id === over.id || !report) return;
    const oldIndex = tasks.findIndex(t => (t._localId ?? t.id) === active.id);
    const newIndex = tasks.findIndex(t => (t._localId ?? t.id) === over.id);
    const reordered = arrayMove(tasks, oldIndex, newIndex).map((t, i) => ({ ...t, order: i }));
    setTasks(reordered);
    try {
      await Promise.all(reordered.filter(t => !t._new).map(t =>
        api.patch(`/reports/${report.id}/tasks/${t.id}/`, { order: t.order })
      ));
    } catch { /* silent */ }
  };

  // ── Import ───────────────────────────────────────────────────────────────
  const handleImport = async (csvData: string) => {
    if (!report) return;
    setShowImport(false);
    try {
      const res = await api.post(`/reports/${report.id}/import/`, { csv_data: csvData });
      if (res.data.success) {
        setTasks(prev => [...prev, ...res.data.data]);
        showToast(res.data.message);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Import failed', 'error');
    }
  };

  // ── Export Excel ─────────────────────────────────────────────────────────
  const exportExcel = async () => {
    if (!report) return;
    setExporting(true);
    try {
      const res = await api.get(`/reports/${report.id}/export/`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.download = `ER_Plan_${user?.full_name?.replace(' ', '_')}_${dateStr}.xlsx`;
      a.click(); URL.revokeObjectURL(url);
      showToast('Excel downloaded');
    } catch { showToast('Export failed', 'error'); }
    finally { setExporting(false); }
  };

  // ── Export CSV (client-side) ─────────────────────────────────────────────
  const exportCSV = () => {
    const rows = [['Task', 'Priority', 'Status', 'Action Plan'], ...tasks.map(t => [t.job, t.priority, t.status, t.action_plan || ''])];
    const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `ER_Plan_${dateStr}.csv`; a.click();
    URL.revokeObjectURL(url);
    showToast('CSV downloaded');
  };

  // ── Stats ────────────────────────────────────────────────────────────────
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'Completed').length;
  const inProgress = tasks.filter(t => t.status === 'In Progress').length;
  const pending = tasks.filter(t => t.status === 'Pending').length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const filteredTasks = filterStatus === 'All' ? tasks : tasks.filter(t => t.status === filterStatus);

  const dayType = isToday(date) ? 'today' : isFuture(date) ? 'future' : 'past';
  const dayColors = { today: 'from-blue-600 to-indigo-600', future: 'from-amber-500 to-orange-500', past: 'from-slate-500 to-gray-600' };

  if (loading) return (
    <div className="flex items-center justify-center h-full py-32">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto" />
        <p className="text-sm text-gray-400">Loading your ER Plan...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-full bg-gray-50/50">
      {/* ── Hero Header ─────────────────────────────────────────────────── */}
      <div className={`bg-gradient-to-r ${dayColors[dayType]} text-white px-8 pt-8 pb-6`}>
        <div className="max-w-6xl mx-auto">
          {/* Date navigator */}
          <div className="flex items-center gap-4 mb-6">
            <button onClick={() => setDate(d => subDays(d, 1))}
              className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 flex-1 relative">
              {/* Date picker trigger */}
              <button
                onClick={() => setCalendarOpen(v => !v)}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 rounded-xl px-4 py-2 transition-colors cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span className="font-bold text-lg">{format(date, 'EEEE, MMMM d, yyyy')}</span>
                {isToday(date) && <span className="text-xs bg-white/30 px-2 py-0.5 rounded-full font-medium ml-1">Today</span>}
                <ChevronDown className={`w-4 h-4 ml-1 opacity-70 transition-transform ${calendarOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Custom calendar popup */}
              {calendarOpen && (
                <DatePickerCalendar
                  selectedDate={date}
                  onSelect={d => { setDate(d); }}
                  onClose={() => setCalendarOpen(false)}
                />
              )}

              {!isToday(date) && !calendarOpen && (
                <button onClick={() => setDate(new Date())}
                  className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors font-medium">
                  Go to Today
                </button>
              )}
            </div>

            <button onClick={() => setDate(d => addDays(d, 1))}
              className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Stats row + progress ring */}
          <div className="flex items-center gap-6">
            <ProgressRing pct={pct} size={100} />

            <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total Tasks', value: total, color: 'bg-white/20' },
                { label: 'Completed', value: completed, color: 'bg-emerald-500/30' },
                { label: 'In Progress', value: inProgress, color: 'bg-blue-400/30' },
                { label: 'Pending', value: pending, color: 'bg-white/10' },
              ].map(stat => (
                <div key={stat.label} className={`${stat.color} rounded-2xl p-3 backdrop-blur-sm`}>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-white/70 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Status badge */}
            <div className="hidden lg:flex flex-col items-end gap-2">
              <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${report?.is_submitted ? 'bg-emerald-500/30 text-white' : 'bg-white/20 text-white/80'}`}>
                {report?.is_submitted ? '✓ Submitted' : '● Draft'}
              </span>
              {report?.approval && <span className="text-xs text-emerald-300 font-medium">✓ Approved</span>}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-8 py-6 space-y-5">

        {/* Action bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Place of work */}
          <PlaceSelector
            value={placeOfWork}
            onChange={val => { setPlaceOfWork(val); triggerAutoSave(); }}
            disabled={readOnly}
          />

          <div className="flex-1" />

          {/* Export dropdown */}
          <div className="relative group/export">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">
              <Download className="w-4 h-4" /> Export <ChevronDown className="w-3 h-3" />
            </button>
            <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 z-10 hidden group-hover/export:block min-w-[160px]">
              <button onClick={exportExcel} disabled={exporting}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-t-xl">
                <FileText className="w-4 h-4 text-green-600" /> Excel (.xlsx)
              </button>
              <button onClick={exportCSV}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                <FileText className="w-4 h-4 text-blue-600" /> CSV
              </button>
              <button onClick={() => window.print()}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-b-xl">
                <Printer className="w-4 h-4 text-gray-500" /> Print
              </button>
            </div>
          </div>

          {/* Import */}
          {!readOnly && (
            <button onClick={() => setShowImport(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">
              <Upload className="w-4 h-4" /> Import
            </button>
          )}

          {/* Save */}
          {!readOnly && (
            <button onClick={saveNow} disabled={saving}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
          )}

          {/* Submit / Reopen */}
          {readOnly ? (
            <button onClick={reopenReport}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium shadow-sm transition-colors">
              <RotateCcw className="w-4 h-4" /> Reopen
            </button>
          ) : (
            <button onClick={submitReport} disabled={submitting || total === 0}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-primary to-accent text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg disabled:opacity-50 transition-all">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Submit Report
            </button>
          )}
        </div>

        {/* Notes (collapsible) */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <button onClick={() => setNotesOpen(!notesOpen)}
            className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-gray-50/50 transition-colors">
            <span className="font-semibold text-gray-800 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" /> Notes / End of Day Summary
              {notes && <span className="w-2 h-2 rounded-full bg-primary ml-1" />}
            </span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${notesOpen ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {notesOpen && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                <textarea value={notes} onChange={e => { setNotes(e.target.value); triggerAutoSave(); }}
                  disabled={readOnly} rows={3} placeholder="Summarize your day, blockers, or important notes..."
                  className="w-full px-5 py-3 text-sm text-gray-700 focus:outline-none resize-none border-t border-gray-100 placeholder-gray-300 disabled:bg-gray-50 disabled:text-gray-400" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Task Section ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          {/* Task header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div className="flex items-center gap-3">
              <h2 className="font-bold text-gray-900">Tasks</h2>
              <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">{total}</span>
            </div>

            <div className="flex items-center gap-2">
              {/* Filter tabs */}
              <div className="flex bg-gray-100 rounded-xl p-0.5">
                {(['All', 'Pending', 'In Progress', 'Completed'] as const).map(s => (
                  <button key={s} onClick={() => setFilterStatus(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterStatus === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    {s === 'All' ? `All (${total})` : s === 'Completed' ? `✓ ${completed}` : s === 'In Progress' ? `● ${inProgress}` : `○ ${pending}`}
                  </button>
                ))}
              </div>

              {selectedIds.size > 0 && (
                <button onClick={bulkDelete}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-xl text-xs font-semibold hover:bg-red-100 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" /> Delete ({selectedIds.size})
                </button>
              )}

              {!readOnly && (
                <button onClick={addTask}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm">
                  <Plus className="w-3.5 h-3.5" /> Add Task
                </button>
              )}
            </div>
          </div>

          {/* Task list */}
          <div className="p-4">
            {filteredTasks.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-gray-500 font-medium mb-1">
                  {filterStatus === 'All' ? 'No tasks yet for this day' : `No ${filterStatus.toLowerCase()} tasks`}
                </p>
                <p className="text-gray-400 text-sm mb-4">
                  {filterStatus === 'All' ? 'Add your first task or import from CSV' : 'Try switching the filter above'}
                </p>
                {!readOnly && filterStatus === 'All' && (
                  <div className="flex items-center justify-center gap-3">
                    <button onClick={addTask}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
                      <Plus className="w-4 h-4" /> Add Task
                    </button>
                    <button onClick={() => setShowImport(true)}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
                      <Upload className="w-4 h-4" /> Import CSV
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter}
                onDragStart={({ active }) => setActiveId(active.id as number)}
                onDragEnd={handleDragEnd}>
                <SortableContext items={filteredTasks.map(t => t._localId ?? t.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {filteredTasks.map(task => (
                      <TaskCard key={task._localId ?? task.id} task={task}
                        onUpdate={updateTask} onDelete={deleteTask} onToggle={toggleTaskDone}
                        onToggleAI={toggleAI}
                        selected={selectedIds.has(task.id)}
                        onSelect={(id: number) => setSelectedIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; })}
                        readOnly={readOnly} />
                    ))}
                  </div>
                </SortableContext>
                <DragOverlay>
                  {activeId && <TaskCard task={tasks.find(t => (t._localId ?? t.id) === activeId)!}
                    onUpdate={() => {}} onDelete={() => {}} onToggle={() => {}} selected={false} onSelect={() => {}} readOnly={false} />}
                </DragOverlay>
              </DndContext>
            )}
          </div>

          {/* Footer bar */}
          {total > 0 && (
            <div className="border-t border-gray-50 px-5 py-3 bg-gray-50/50 flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span>Completion: <strong className="text-gray-700">{pct}%</strong></span>
                <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full"
                    animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} />
                </div>
              </div>
              {!readOnly && (
                <button onClick={addTask}
                  className="text-xs text-primary hover:text-accent font-medium flex items-center gap-1 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Add another task
                </button>
              )}
            </div>
          )}
        </div>

        {/* Submitted notice */}
        {readOnly && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">Report submitted</p>
              <p className="text-xs text-emerald-600 mt-0.5">
                {report?.submitted_at ? `Submitted on ${format(new Date(report.submitted_at), 'MMM d, yyyy h:mm a')}` : 'This report has been submitted.'}
                {' · '}
                <button onClick={reopenReport} className="underline hover:no-underline">Reopen to edit</button>
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Modals & Toasts ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {showImport && <ImportModal onImport={handleImport} onClose={() => setShowImport(false)} />}
        {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>

      <AIFloatingPanel
        tasks={tasks}
        reportId={report?.id}
        onSubtasksGenerated={(parentJob, subtasks) => {
          const newTasks = subtasks.map((s, i) => ({
            _localId: Date.now() + i,
            id: Date.now() + i,
            job: s,
            priority: 'Medium' as const,
            status: 'Pending' as const,
            place_of_work: '',
            action_plan: '',
            remarks: '',
            order: tasks.length + i,
            ai_enabled: false,
            ai_assisted: false,
            _new: true,
          }));
          setTasks(prev => [...prev, ...newTasks]);
        }}
      />
    </div>
  );
}
