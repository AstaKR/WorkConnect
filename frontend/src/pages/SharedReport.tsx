import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from '../api/axios';
import { motion } from 'framer-motion';
import { Calendar, FileText, CheckCircle } from 'lucide-react';

export default function SharedReport() {
  const { token } = useParams<{ token: string }>();
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSharedReport = async () => {
      try {
        const res = await axios.get(`/share/public/${token}/`);
        setReport(res.data.data);
      } catch (err: any) {
        console.error(err);
        setError(err.response?.data?.message || 'Invalid or expired share link.');
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchSharedReport();
  }, [token]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-pulse flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-primary animate-bounce"></div><div className="w-4 h-4 rounded-full bg-primary animate-bounce delay-75"></div><div className="w-4 h-4 rounded-full bg-primary animate-bounce delay-150"></div></div></div>;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-4 border border-red-100">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Link Invalid</h1>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Work Report</h1>
          <p className="text-gray-500">Shared publicly via ER System</p>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100">
          
          <div className="flex flex-col md:flex-row justify-between border-b border-gray-100 pb-6 mb-6 gap-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{report.user_name}</h2>
              <p className="text-gray-500 flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4" /> {new Date(report.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Place of Work</p>
                <p className="font-semibold text-gray-900">{report.place_of_work}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Status</p>
                {report.approval ? (
                  <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold"><CheckCircle className="w-4 h-4"/> Approved</span>
                ) : (
                  <span className="inline-flex items-center bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">Submitted</span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">End of Day Notes</h3>
              <div className="bg-gray-50 p-4 rounded-xl text-gray-700 whitespace-pre-wrap border border-gray-100">
                {report.notes || 'No additional notes provided.'}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Task Breakdown</h3>
              <div className="space-y-3">
                {report.tasks.map((task: any) => (
                  <div key={task.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-gray-900 text-lg">{task.job}</h4>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                        task.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                    {task.action_plan && (
                      <p className="text-gray-600 text-sm mt-2 bg-blue-50/50 p-3 rounded-lg border border-blue-100/50">
                        <span className="font-semibold text-blue-800 block mb-1">Action Plan:</span>
                        {task.action_plan}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

        </motion.div>
      </div>
    </div>
  );
}
