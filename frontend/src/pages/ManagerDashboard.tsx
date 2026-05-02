import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, FileCheck, Clock, CheckCircle, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { useAuthStore } from '../store/useAuthStore';

// Simple animated counter
const AnimatedCounter = ({ value }: { value: number }) => {
  return (
    <motion.span 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      key={value}
      className="text-4xl font-bold text-gray-900"
    >
      {value}
    </motion.span>
  );
};

export default function ManagerDashboard() {
  const { user } = useAuthStore();
  const isCEO = user?.role === 'ceo';
  const navigate = useNavigate();
  const [summary, setSummary] = useState<any>(null);
  const [teamReports, setTeamReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, submitted, pending
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryRes, teamRes] = await Promise.all([
          axios.get('/dashboard/summary/'),
          axios.get('/dashboard/team/')
        ]);
        setSummary(summaryRes.data.data);
        setTeamReports(teamRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredReports = teamReports.filter(r => {
    if (filter === 'submitted') return r.is_submitted;
    if (filter === 'pending') return !r.is_submitted;
    return true;
  });

  const approveReport = async (id: number) => {
    try {
      await axios.post(`/reports/${id}/approve/`, { comment: 'Approved' });
      const teamRes = await axios.get('/dashboard/team/');
      setTeamReports(teamRes.data.data);
    } catch (err) {
      console.error(err);
      alert('Failed to approve report');
    }
  };

  const deleteReport = async (id: number) => {
    if (!confirm('Delete this report and all its tasks? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await axios.delete(`/reports/${id}/`);
      setTeamReports(prev => prev.filter(r => r.id !== id));
    } catch {
      alert('Failed to delete report.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Manager Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of your team's performance and reports.</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl"></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
            className="glass p-6 rounded-2xl relative overflow-hidden"
          >
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-blue-100 rounded-full blur-3xl opacity-50"></div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-gray-500 font-medium">Team Size</h3>
            </div>
            <AnimatedCounter value={summary?.team_size || 0} />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
            className="glass p-6 rounded-2xl relative overflow-hidden"
          >
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-green-100 rounded-full blur-3xl opacity-50"></div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                <FileCheck className="w-6 h-6" />
              </div>
              <h3 className="text-gray-500 font-medium">Submitted Today</h3>
            </div>
            <AnimatedCounter value={summary?.team_reports_today || 0} />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
            className="glass p-6 rounded-2xl relative overflow-hidden"
          >
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-yellow-100 rounded-full blur-3xl opacity-50"></div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-yellow-50 text-yellow-600 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-gray-500 font-medium">Pending Approvals</h3>
            </div>
            <AnimatedCounter value={summary?.pending_approvals || 0} />
          </motion.div>
        </div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="glass rounded-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-gray-900">Team Reports</h2>
          <div className="flex items-center gap-3">
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="text-sm border-gray-200 border rounded-xl py-2 px-3 bg-white focus:ring-primary focus:border-primary"
            >
              <option value="all">All Reports</option>
              <option value="submitted">Submitted</option>
              <option value="pending">Draft / Pending</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
              <tr>
                <th className="py-4 px-6">Employee</th>
                <th className="py-4 px-6">Date</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Approval</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">No reports found for the selected filter.</td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6 font-medium text-gray-900">{report.user_name}</td>
                    <td className="py-4 px-6">{new Date(report.date).toLocaleDateString()}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${report.is_submitted ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {report.is_submitted ? 'Submitted' : 'Draft'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {report.approval ? (
                        <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                          <CheckCircle className="w-4 h-4" /> Approved
                        </span>
                      ) : report.is_submitted ? (
                        <span className="text-yellow-600 text-xs font-medium">Pending Review</span>
                      ) : (
                        <span className="text-gray-400 text-xs font-medium">-</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button onClick={() => navigate(`/manager/employee/${report.user}`)} className="text-primary hover:text-blue-700 font-medium text-sm transition-colors">View</button>
                      {report.is_submitted && !report.approval && (
                        <button
                          onClick={() => approveReport(report.id)}
                          className="bg-green-50 text-green-600 hover:bg-green-100 px-3 py-1.5 rounded-lg font-medium text-sm transition-colors"
                        >
                          Approve
                        </button>
                      )}
                      {isCEO && (
                        <button
                          onClick={() => deleteReport(report.id)}
                          disabled={deletingId === report.id}
                          className="p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors disabled:opacity-40 inline-flex items-center"
                          title="Delete report"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
