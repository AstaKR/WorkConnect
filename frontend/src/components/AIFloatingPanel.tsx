import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bot, Loader2, Copy, Check } from 'lucide-react';
import { aiDailySummary, aiTaskBreakdown } from '../api/ai';

interface Task {
  id?: number;
  job: string;
  status: string;
  ai_enabled?: boolean;
}

interface AIFloatingPanelProps {
  tasks: Task[];
  reportId?: number;
  onSubtasksGenerated?: (parentJob: string, subtasks: string[]) => void;
  activeProviderName?: string;
}

function getErrorMessage(e: unknown, fallback: string): string {
  if (typeof e === 'object' && e !== null && 'response' in e) {
    const resp = (e as { response?: { data?: { message?: string } } }).response;
    return resp?.data?.message ?? fallback;
  }
  return fallback;
}

export default function AIFloatingPanel({
  tasks, reportId, onSubtasksGenerated, activeProviderName = 'AI',
}: AIFloatingPanelProps) {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [copied, setCopied] = useState(false);
  const [breakdownJob, setBreakdownJob] = useState('');
  const [loadingBreakdown, setLoadingBreakdown] = useState(false);
  const [subtasksResult, setSubtasksResult] = useState<string[]>([]);
  const [error, setError] = useState('');

  const aiEnabledTasks = tasks.filter(t => t.ai_enabled);

  const handleGenerateSummary = async () => {
    if (loadingSummary || tasks.length === 0) return;
    setSummary('');
    setLoadingSummary(true);
    setError('');
    try {
      const payload = reportId
        ? { report_id: reportId }
        : { tasks: tasks.map(t => ({ job: t.job, status: t.status })) };
      const res = await aiDailySummary(payload);
      if (res.data.success) setSummary(res.data.data.summary);
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'AI unavailable. Check provider settings.'));
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleBreakdown = async () => {
    if (!breakdownJob.trim()) return;
    setLoadingBreakdown(true);
    setError('');
    try {
      const taskWithJob = aiEnabledTasks.find(t => t.job === breakdownJob);
      const res = await aiTaskBreakdown(breakdownJob, taskWithJob?.id);
      if (res.data.success) {
        setSubtasksResult(res.data.data.subtasks);
        onSubtasksGenerated?.(breakdownJob, res.data.data.subtasks);
      }
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Task breakdown failed.'));
    } finally {
      setLoadingBreakdown(false);
    }
  };

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard permission denied or not available — silently ignore
    }
  };

  return (
    <>
      {/* Floating trigger button */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-2xl shadow-lg shadow-violet-200 font-semibold text-sm"
      >
        <Bot className="w-4 h-4" />
        AI Assistant
      </motion.button>

      {/* Slide-in panel */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} exit={{ opacity: 0 }}
              onClick={() => { setOpen(false); setSubtasksResult([]); }}
              className="fixed inset-0 bg-black z-40"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-violet-600" />
                  <span className="font-bold text-gray-900">AI Assistant</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">
                    {activeProviderName}
                  </span>
                  <button onClick={() => { setOpen(false); setSubtasksResult([]); }} className="p-1 rounded-lg hover:bg-gray-100 text-gray-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-5">

                {/* Error banner */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-600">
                    {error}
                  </div>
                )}

                {/* Daily Summary */}
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    📋 Daily Summary
                  </div>
                  <button
                    onClick={handleGenerateSummary}
                    disabled={loadingSummary || tasks.length === 0}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-sm font-semibold shadow-sm disabled:opacity-50"
                  >
                    {loadingSummary ? <Loader2 className="w-4 h-4 animate-spin" /> : '✨'}
                    {loadingSummary ? 'Generating...' : 'Generate Summary'}
                  </button>
                  {summary && (
                    <div className="mt-2 bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-700 relative">
                      <p className="leading-relaxed pr-6">{summary}</p>
                      <button
                        onClick={handleCopySummary}
                        className="absolute top-2 right-2 p-1 rounded-lg hover:bg-gray-200 text-gray-400"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}
                </div>

                {/* Task Breakdown */}
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    🧩 Break Down a Task
                  </div>
                  {aiEnabledTasks.length === 0 ? (
                    <p className="text-xs text-gray-400 bg-gray-50 rounded-xl p-3">
                      Enable AI on at least one task (🤖 toggle) to use breakdown.
                    </p>
                  ) : (
                    <>
                      <select
                        value={breakdownJob}
                        onChange={e => { setBreakdownJob(e.target.value); setSubtasksResult([]); }}
                        className="w-full text-sm border border-gray-200 rounded-xl p-2 mb-2 focus:ring-violet-300 focus:border-violet-400"
                      >
                        <option value="">Select an AI-enabled task...</option>
                        {aiEnabledTasks.map((t) => (
                          <option key={t.id ?? t.job} value={t.job}>{t.job.slice(0, 50)}</option>
                        ))}
                      </select>
                      <button
                        onClick={handleBreakdown}
                        disabled={!breakdownJob || loadingBreakdown}
                        className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
                      >
                        {loadingBreakdown ? <Loader2 className="w-4 h-4 animate-spin" /> : '🧩'}
                        {loadingBreakdown ? 'Breaking down...' : 'Break Down'}
                      </button>
                      {subtasksResult.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {subtasksResult.map((s, i) => (
                            <div key={`${i}-${s.slice(0, 20)}`} className="flex items-start gap-2 bg-blue-50 rounded-lg p-2 text-xs text-blue-800">
                              <span className="font-bold mt-0.5">{i + 1}.</span>
                              <span>{s}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* AI-enabled tasks count */}
                <div className="bg-violet-50 rounded-xl p-3 text-xs text-violet-700">
                  <span className="font-bold">{aiEnabledTasks.length}</span> of{' '}
                  <span className="font-bold">{tasks.length}</span> tasks have AI enabled.
                  Toggle the 🤖 icon on any task row to enable inline AI buttons.
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
