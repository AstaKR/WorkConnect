import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, Clock, ChevronDown, ChevronUp, FileText, Trash2, Edit3, Check, X } from 'lucide-react';
import api from '../api/axios';
import { useAuthStore } from '../store/useAuthStore';

export default function EmployeeDetail() {
  const { id } = useParams();
  const { user: currentUser } = useAuthStore();
  const isCEO = currentUser?.role === 'ceo';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingTask, setEditingTask] = useState<{ id: number; status: string; priority: string } | null>(null);
  const [savingTask, setSavingTask] = useState(false);

  useEffect(() => {
    api.get(`/dashboard/employee/${id}/`)
      .then(res => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const approveReport = async (reportId: number) => {
    setApprovingId(reportId);
    try {
      await api.post(`/reports/${reportId}/approve/`, { comment: 'Approved' });
      const res = await api.get(`/dashboard/employee/${id}/`);
      setData(res.data.data);
    } catch { alert('Failed to approve'); }
    finally { setApprovingId(null); }
  };

  const deleteReport = async (reportId: number) => {
    if (!confirm('Delete this report and all its tasks? This cannot be undone.')) return;
    setDeletingId(reportId);
    try {
      await api.delete(`/reports/${reportId}/`);
      setData((prev: any) => ({ ...prev, reports: prev.reports.filter((r: any) => r.id !== reportId) }));
      if (expanded === reportId) setExpanded(null);
    } catch { alert('Failed to delete report.'); }
    finally { setDeletingId(null); }
  };

  const saveTaskEdit = async (reportId: number) => {
    if (!editingTask) return;
    setSavingTask(true);
    try {
      await api.patch(`/reports/tasks/${editingTask.id}/`, {
        status: editingTask.status,
        priority: editingTask.priority,
      });
      setData((prev: any) => ({
        ...prev,
        reports: prev.reports.map((r: any) =>
          r.id === reportId
            ? { ...r, tasks: r.tasks.map((t: any) => t.id === editingTask.id ? { ...t, ...editingTask } : t) }
            : r
        ),
      }));
      setEditingTask(null);
    } catch { alert('Failed to save task.'); }
    finally { setSavingTask(false); }
  };

  if (loading) return (
    <div className="p-8 flex items-center justify-center">
      <div className="animate-spin w-8 h-8 rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );

  if (!data) return <div className="p-8 text-center text-gray-500">Employee not found.</div>;

  const { user, reports } = data;
  const submitted = reports.filter((r: any) => r.is_submitted).length;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/manager/dashboard" className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{user.full_name}</h1>
          <p className="text-gray-500 text-sm">{user.email} · {user.department || 'No department'}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Reports', value: reports.length, color: 'blue' },
          { label: 'Submitted', value: submitted, color: 'green' },
          { label: 'Pending Approval', value: reports.filter((r: any) => r.is_submitted && !r.approval).length, color: 'yellow' },
        ].map(stat => (
          <div key={stat.label} className="glass p-5 rounded-2xl">
            <p className="text-gray-500 text-sm">{stat.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Reports List */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900">Report History</h2>
        {reports.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center text-gray-400">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>No reports found.</p>
          </div>
        ) : reports.map((report: any, i: number) => (
          <motion.div key={report.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
            className="glass rounded-2xl overflow-hidden">
            <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/60 transition-colors"
              onClick={() => setExpanded(expanded === report.id ? null : report.id)}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center font-bold text-blue-700 text-sm">
                  {new Date(report.date).getDate()}
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    {new Date(report.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </p>
                  <p className="text-xs text-gray-500">{report.place_of_work}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${report.is_submitted ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {report.is_submitted ? 'Submitted' : 'Draft'}
                </span>
                {report.approval ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : report.is_submitted ? (
                  <button onClick={(e) => { e.stopPropagation(); approveReport(report.id); }}
                    disabled={approvingId === report.id}
                    className="px-3 py-1.5 bg-green-50 text-green-600 text-xs font-medium rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50">
                    {approvingId === report.id ? '...' : 'Approve'}
                  </button>
                ) : null}
                {isCEO && (
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteReport(report.id); }}
                    disabled={deletingId === report.id}
                    className="p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors disabled:opacity-40"
                    title="Delete report"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                {expanded === report.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </div>
            </div>

            {expanded === report.id && (
              <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                {report.notes && <p className="text-sm text-gray-600 mb-3"><span className="font-medium">Notes:</span> {report.notes}</p>}
                {report.tasks?.length > 0 ? (
                  <div className="space-y-2">
                    {report.tasks.map((task: any) => {
                      const isEditing = editingTask?.id === task.id;
                      return (
                        <div key={task.id} className="flex items-start justify-between p-3 bg-white border border-gray-100 rounded-xl text-sm gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900">{task.job}</p>
                            {task.action_plan && <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{task.action_plan}</p>}
                          </div>
                          {isEditing ? (
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <select
                                value={editingTask.priority}
                                onChange={e => setEditingTask(prev => prev ? { ...prev, priority: e.target.value } : prev)}
                                className="text-xs border border-gray-200 rounded-lg px-1.5 py-1"
                              >
                                {['High', 'Medium', 'Low'].map(p => <option key={p}>{p}</option>)}
                              </select>
                              <select
                                value={editingTask.status}
                                onChange={e => setEditingTask(prev => prev ? { ...prev, status: e.target.value } : prev)}
                                className="text-xs border border-gray-200 rounded-lg px-1.5 py-1"
                              >
                                {['Pending', 'In Progress', 'Completed'].map(s => <option key={s}>{s}</option>)}
                              </select>
                              <button onClick={() => saveTaskEdit(report.id)} disabled={savingTask}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-40">
                                <Check className="w-4 h-4" />
                              </button>
                              <button onClick={() => setEditingTask(null)}
                                className="p-1.5 text-gray-400 hover:bg-gray-50 rounded-lg">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                task.priority === 'High' ? 'bg-red-100 text-red-700' :
                                task.priority === 'Medium' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                              }`}>{task.priority}</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                task.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                task.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                              }`}>{task.status}</span>
                              {isCEO && (
                                <button
                                  onClick={() => setEditingTask({ id: task.id, status: task.status, priority: task.priority })}
                                  className="p-1 text-blue-400 hover:bg-blue-50 rounded-lg transition-colors"
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
                ) : <p className="text-sm text-gray-400 italic">No tasks logged.</p>}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
